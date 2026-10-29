/**
 * InstantTranslate - Content Script (Phiên bản Giao Diện Thuần Việt - Chuẩn Cốc Cốc / Laban Dict)
 * Thiết kế thân thuộc, gần gũi với người dùng Việt Nam: rõ ràng, đậm đà, dễ đọc, hỗ trợ từ điển & phát âm chuẩn.
 * Cách ly 100% bằng Closed Shadow DOM.
 */

(function () {
  if (window.__instantTranslateLoaded) return;
  window.__instantTranslateLoaded = true;

  // Bản đồ ngôn ngữ hiển thị tiếng Việt & cờ
  const LANG_DATA = {
    vi: { name: "Tiếng Việt", short: "Việt", flag: "🇻🇳", tts: "vi-VN" },
    en: { name: "Tiếng Anh", short: "Anh", flag: "🇺🇸", tts: "en-US" },
    "zh-CN": { name: "Tiếng Trung (Giản)", short: "Trung", flag: "🇨🇳", tts: "zh-CN" },
    "zh-TW": { name: "Tiếng Trung (Phồn)", short: "Đài Loan", flag: "🇹🇼", tts: "zh-TW" },
    ja: { name: "Tiếng Nhật", short: "Nhật", flag: "🇯🇵", tts: "ja-JP" },
    ko: { name: "Tiếng Hàn", short: "Hàn", flag: "🇰🇷", tts: "ko-KR" },
    fr: { name: "Tiếng Pháp", short: "Pháp", flag: "🇫🇷", tts: "fr-FR" },
    de: { name: "Tiếng Đức", short: "Đức", flag: "🇩🇪", tts: "de-DE" },
    es: { name: "Tây Ban Nha", short: "TBN", flag: "🇪🇸", tts: "es-ES" },
    ru: { name: "Tiếng Nga", short: "Nga", flag: "🇷🇺", tts: "ru-RU" },
    th: { name: "Tiếng Thái", short: "Thái", flag: "🇹🇭", tts: "th-TH" },
    it: { name: "Tiếng Ý", short: "Ý", flag: "🇮🇹", tts: "it-IT" },
    auto: { name: "Tự động nhận diện", short: "Tự động", flag: "🌐", tts: "en-US" }
  };

  // Cấu hình người dùng
  let settings = {
    enabled: true,
    targetLang: "vi",
    sourceLang: "auto",
    triggerMode: "auto", // "auto" | "icon" | "ctrl" | "alt"
    showDict: true,
    autoTts: false,
    theme: "auto",
    enableReplace: true,
    doubleClickToTranslate: false,
    excludedDomains: []
  };

  let isPinned = false;
  let activeRange = null;
  let activeInputElement = null;
  let currentDetectedSourceLang = "en";
  let activeTranslateRequest = 0;

  // Đọc cài đặt
  function refreshSettings() {
    if (chrome?.storage?.local) {
      chrome.storage.local.get("settings", (res) => {
        if (res && res.settings) {
          settings = { ...settings, ...res.settings };
        }
      });
    }
  }
  refreshSettings();

  if (chrome?.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes.settings) {
        settings = { ...settings, ...changes.settings.newValue };
      }
    });
  }

  // Tạo phần tử máy chủ cách ly
  const host = document.createElement("div");
  host.id = "instant-translate-host";
  host.style.position = "absolute";
  host.style.top = "0";
  host.style.left = "0";
  host.style.width = "0";
  host.style.height = "0";
  host.style.zIndex = "2147483647";
  host.style.pointerEvents = "none";
  document.documentElement.appendChild(host);

  // Gắn Shadow DOM kín
  const shadow = host.attachShadow({ mode: "closed" });

  // CSS Phong cách Thuần Việt (Laban Dict + Cốc Cốc + Zalo UI)
  const styleEl = document.createElement("style");
  styleEl.textContent = `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    :host {
      all: initial;
    }

    .vn-wrapper {
      position: absolute;
      pointer-events: auto;
      z-index: 2147483647;
      user-select: none;
    }

    /* Nút Icon tròn kích hoạt nổi khi bôi đen */
    .vn-trigger-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0068ff 0%, #0084ff 100%);
      box-shadow: 0 4px 14px rgba(0, 104, 255, 0.4), 0 2px 4px rgba(0, 0, 0, 0.1);
      border: 2px solid #ffffff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.18s ease;
      animation: vnPop 0.15s ease-out;
    }

    .vn-trigger-btn:hover {
      transform: scale(1.15) translateY(-2px);
      box-shadow: 0 6px 18px rgba(0, 104, 255, 0.55);
    }

    .vn-trigger-btn svg {
      width: 17px;
      height: 17px;
      fill: #ffffff;
    }

    /* Cửa Sổ Bảng Dịch (Phong cách Từ Điển Việt Nam thân thuộc) */
    .vn-card {
      position: absolute;
      width: 390px;
      min-width: 320px;
      max-width: 92vw;
      border-radius: 14px;
      background: #ffffff;
      color: #1e293b;
      box-shadow: 
        0 16px 40px -8px rgba(0, 80, 200, 0.2),
        0 4px 16px rgba(0, 0, 0, 0.08),
        0 0 0 1px #dbe5f0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: vnSpring 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @media (prefers-color-scheme: dark) {
      .vn-card {
        background: #181d28;
        color: #f1f5f9;
        box-shadow: 
          0 20px 48px -8px rgba(0, 0, 0, 0.65),
          0 6px 20px rgba(0, 0, 0, 0.4),
          0 0 0 1px #2e384d;
      }
    }

    /* Header chuẩn phong cách Tiện Ích Trình Duyệt Việt Nam */
    .vn-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 9px 13px;
      background: #f0f5fc;
      border-bottom: 1.5px solid #e1e9f4;
    }

    @media (prefers-color-scheme: dark) {
      .vn-header {
        background: #202636;
        border-color: #2c354a;
      }
    }

    .vn-header-left {
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .vn-app-icon {
      width: 22px;
      height: 22px;
      border-radius: 6px;
      background: #0068ff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0, 104, 255, 0.3);
    }

    .vn-app-icon svg {
      width: 13px;
      height: 13px;
      fill: #ffffff;
    }

    .vn-header-title {
      font-size: 13px;
      font-weight: 700;
      color: #004ecc;
      letter-spacing: -0.2px;
    }

    @media (prefers-color-scheme: dark) {
      .vn-header-title {
        color: #60a5fa;
      }
    }

    /* Thanh Chuyển Ngôn Ngữ Nổi */
    .vn-lang-badge {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 2.5px 8px;
      border-radius: 20px;
      background: #ffffff;
      border: 1px solid #c7d8ee;
      font-size: 11px;
      font-weight: 600;
      color: #1e3a8a;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }

    @media (prefers-color-scheme: dark) {
      .vn-lang-badge {
        background: #262e42;
        border-color: #3b4763;
        color: #93c5fd;
      }
    }

    .vn-swap-icon {
      width: 17px;
      height: 17px;
      border-radius: 50%;
      border: none;
      background: #e8f0fe;
      color: #0068ff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.18s ease;
    }

    .vn-swap-icon:hover {
      background: #0068ff;
      color: #ffffff;
      transform: rotate(180deg);
    }

    @media (prefers-color-scheme: dark) {
      .vn-swap-icon {
        background: #1e283d;
        color: #60a5fa;
      }
      .vn-swap-icon:hover {
        background: #3b82f6;
        color: #ffffff;
      }
    }

    .vn-swap-icon svg {
      width: 10px;
      height: 10px;
      fill: currentColor;
    }

    /* Nút Thao Tác Header (Ghim & Đóng) */
    .vn-header-btns {
      display: flex;
      align-items: center;
      gap: 3px;
    }

    .vn-tool-btn {
      width: 25px;
      height: 25px;
      border-radius: 6px;
      border: none;
      background: transparent;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }

    .vn-tool-btn:hover {
      background: #e2e8f0;
      color: #0f172a;
    }

    @media (prefers-color-scheme: dark) {
      .vn-tool-btn:hover {
        background: #334155;
        color: #ffffff;
      }
    }

    .vn-tool-btn.pinned {
      color: #0068ff;
      background: #dbeafe;
    }

    @media (prefers-color-scheme: dark) {
      .vn-tool-btn.pinned {
        color: #60a5fa;
        background: #1e3a8a;
      }
    }

    .vn-tool-btn svg {
      width: 14px;
      height: 14px;
      fill: currentColor;
    }

    /* Thân Hộp Dịch */
    .vn-body {
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 400px;
      overflow-y: auto;
    }

    .vn-body::-webkit-scrollbar {
      width: 5px;
    }
    .vn-body::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }

    /* 1. KHỐI NGHĨA TIẾNG VIỆT (Tâm điểm chính - Đậm đà, nổi bật) */
    .vn-result-box {
      background: #f0f7ff;
      border: 1.5px solid #bfdbfe;
      border-radius: 11px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    @media (prefers-color-scheme: dark) {
      .vn-result-box {
        background: #1a2336;
        border-color: #2b3954;
      }
    }

    .vn-result-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .vn-result-tag {
      font-size: 11px;
      font-weight: 800;
      color: #0056cc;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    @media (prefers-color-scheme: dark) {
      .vn-result-tag {
        color: #93c5fd;
      }
    }

    .vn-result-text {
      font-size: 16px;
      font-weight: 700;
      line-height: 1.55;
      color: #0a2540;
      word-break: break-word;
      user-select: text;
    }

    @media (prefers-color-scheme: dark) {
      .vn-result-text {
        color: #f8fafc;
      }
    }

    /* 2. KHỐI VĂN BẢN GỐC (Tinh gọn, rõ ràng) */
    .vn-source-box {
      background: #fafbfc;
      border: 1px solid #e2e8f0;
      border-radius: 9px;
      padding: 8px 11px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    @media (prefers-color-scheme: dark) {
      .vn-source-box {
        background: #1e2433;
        border-color: #2c3547;
      }
    }

    .vn-source-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 10.5px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .vn-source-text {
      font-size: 13px;
      line-height: 1.45;
      color: #334155;
      word-break: break-word;
      max-height: 60px;
      overflow-y: auto;
      user-select: text;
    }

    @media (prefers-color-scheme: dark) {
      .vn-source-text {
        color: #cbd5e1;
      }
    }

    /* Phiên âm IPA phong cách Từ điển Anh - Việt (Laban/Cốc Cốc) */
    .vn-ipa-wrap {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      color: #0284c7;
      font-family: ui-monospace, Consolas, "Courier New", monospace;
      background: #e0f2fe;
      padding: 2px 7px;
      border-radius: 5px;
      width: fit-content;
      margin-top: 2px;
    }

    @media (prefers-color-scheme: dark) {
      .vn-ipa-wrap {
        background: #0f2c4a;
        color: #38bdf8;
      }
    }

    /* 3. TỪ ĐIỂN TRA TỪ LOẠI (Danh từ, Động từ, Tính từ chuẩn Việt) */
    .vn-dict-group {
      display: flex;
      flex-direction: column;
      gap: 7px;
      padding-top: 8px;
      border-top: 1px dashed #cbd5e1;
    }

    @media (prefers-color-scheme: dark) {
      .vn-dict-group {
        border-color: #334155;
      }
    }

    .vn-dict-title {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }

    .vn-pos-block {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .vn-pos-header {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .vn-pos-badge {
      font-size: 10.5px;
      font-weight: 700;
      padding: 1.5px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .pos-noun { background: #dcfce7; color: #15803d; }
    .pos-verb { background: #ede9fe; color: #6d28d9; }
    .pos-adj  { background: #fef3c7; color: #b45309; }
    .pos-other { background: #f1f5f9; color: #475569; }

    @media (prefers-color-scheme: dark) {
      .pos-noun { background: #143823; color: #4ade80; }
      .pos-verb { background: #281b47; color: #c084fc; }
      .pos-adj  { background: #3d2a0c; color: #fcd34d; }
      .pos-other { background: #242c3d; color: #94a3b8; }
    }

    .vn-synonym-list {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      padding-left: 4px;
    }

    .vn-syn-chip {
      font-size: 11.5px;
      padding: 2px 7px;
      border-radius: 12px;
      background: #ffffff;
      border: 1px solid #d1d5db;
      color: #374151;
      cursor: pointer;
      transition: all 0.12s ease;
    }

    .vn-syn-chip:hover {
      background: #0068ff;
      color: #ffffff;
      border-color: #0068ff;
    }

    @media (prefers-color-scheme: dark) {
      .vn-syn-chip {
        background: #242c3d;
        border-color: #3e495e;
        color: #cbd5e1;
      }
      .vn-syn-chip:hover {
        background: #3b82f6;
        color: #ffffff;
      }
    }

    /* Thanh Dưới (Footer Thao Tác) */
    .vn-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 9px 13px;
      background: #f8fafc;
      border-top: 1.5px solid #e2e8f0;
      gap: 8px;
    }

    @media (prefers-color-scheme: dark) {
      .vn-footer {
        background: #1c2230;
        border-color: #2b3545;
      }
    }

    .vn-select-lang {
      font-size: 11.5px;
      font-weight: 600;
      padding: 4px 6px;
      border-radius: 7px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #1e293b;
      cursor: pointer;
      outline: none;
    }

    @media (prefers-color-scheme: dark) {
      .vn-select-lang {
        background: #262e3f;
        border-color: #3f4b61;
        color: #f1f5f9;
      }
    }

    .vn-actions-right {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .vn-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11.5px;
      font-weight: 700;
      padding: 5px 9px;
      border-radius: 7px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #334155;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .vn-btn:hover {
      background: #f1f5f9;
      color: #0f172a;
      border-color: #94a3b8;
    }

    @media (prefers-color-scheme: dark) {
      .vn-btn {
        background: #242c3d;
        border-color: #3a4659;
        color: #cbd5e1;
      }
      .vn-btn:hover {
        background: #323d52;
        color: #ffffff;
      }
    }

    /* Nút chính Sao Chép (Xanh Zalo / Cốc Cốc) */
    .vn-btn-primary {
      background: #0068ff !important;
      color: #ffffff !important;
      border: none !important;
      box-shadow: 0 2px 6px rgba(0, 104, 255, 0.35);
    }

    .vn-btn-primary:hover {
      background: #0052cc !important;
      box-shadow: 0 3px 10px rgba(0, 104, 255, 0.45);
    }

    .vn-btn-primary.copied {
      background: #16a34a !important;
      box-shadow: 0 2px 6px rgba(22, 163, 74, 0.4) !important;
    }

    .vn-btn svg {
      width: 13px;
      height: 13px;
      fill: currentColor;
    }

    /* Hiệu ứng thanh tải shimmer */
    .vn-shimmer-bar {
      height: 18px;
      border-radius: 5px;
      background: linear-gradient(90deg, #dbeafe 25%, #bfdbfe 50%, #dbeafe 75%);
      background-size: 200% 100%;
      animation: vnShimmer 1.3s infinite;
      margin: 4px 0;
    }

    @media (prefers-color-scheme: dark) {
      .vn-shimmer-bar {
        background: linear-gradient(90deg, #1e293b 25%, #2e3d54 50%, #1e293b 75%);
        background-size: 200% 100%;
      }
    }

    @keyframes vnPop {
      from { transform: scale(0.8); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    @keyframes vnSpring {
      0% { opacity: 0; transform: translateY(8px) scale(0.97); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes vnShimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `;
  shadow.appendChild(styleEl);

  const container = document.createElement("div");
  container.className = "vn-wrapper";
  shadow.appendChild(container);

  // Thư viện SVG icon chuẩn
  const ICONS = {
    book: `<svg viewBox="0 0 24 24"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>`,
    speaker: `<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`,
    copy: `<svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`,
    check: `<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`,
    pin: `<svg viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>`,
    close: `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
    swap: `<svg viewBox="0 0 24 24"><path d="M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z"/></svg>`,
    replace: `<svg viewBox="0 0 24 24"><path d="M19 8l-4 4h3c0 3.31-2.69 6-6 6-1.01 0-1.97-.25-2.8-.7l-1.46 1.46C8.97 19.54 10.43 20 12 20c4.42 0 8-3.58 8-8h3l-4-4zM6 12c0-3.31 2.69-6 6-6 1.01 0 1.97.25 2.8.7l1.46-1.46C15.03 4.46 13.57 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4H6z"/></svg>`,
    external: `<svg viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>`
  };

  // Phát âm văn bản
  function speak(text, lang) {
    if (!text || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = LANG_DATA[lang]?.tts || lang || "vi-VN";
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  }

  // Đóng UI
  function hideUI() {
    container.innerHTML = "";
    container.style.display = "none";
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  // Căn chỉnh vị trí thông minh
  function position(elem, rect) {
    container.style.display = "block";
    container.style.visibility = "hidden";

    requestAnimationFrame(() => {
      const w = elem.offsetWidth || 390;
      const h = elem.offsetHeight || 260;
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      let left = rect.left + scrollX;
      if (left + w > scrollX + window.innerWidth - 12) {
        left = scrollX + window.innerWidth - w - 12;
      }
      if (left < scrollX + 12) left = scrollX + 12;

      let top = rect.bottom + 8 + scrollY;
      if (window.innerHeight - rect.bottom < h + 20 && rect.top > h + 20) {
        top = rect.top - h - 8 + scrollY;
      }

      container.style.left = `${Math.round(left)}px`;
      container.style.top = `${Math.round(top)}px`;
      container.style.visibility = "visible";
    });
  }

  // Thay thế chữ trên web
  function replaceText(newText) {
    if (!newText) return;

    if (activeInputElement && typeof activeInputElement.selectionStart === "number") {
      const s = activeInputElement.selectionStart;
      const e = activeInputElement.selectionEnd;
      const v = activeInputElement.value;
      activeInputElement.value = v.slice(0, s) + newText + v.slice(e);
      activeInputElement.setSelectionRange(s + newText.length, s + newText.length);
      activeInputElement.dispatchEvent(new Event("input", { bubbles: true }));
      hideUI();
      return;
    }

    if (activeRange) {
      try {
        activeRange.deleteContents();
        const node = document.createTextNode(newText);
        activeRange.insertNode(node);
        hideUI();
        return;
      } catch (e) {
        console.warn("DOM replace error:", e);
      }
    }

    navigator.clipboard.writeText(newText);
  }

  // Nút kích hoạt dạng icon
  function showIcon(text, rect) {
    container.innerHTML = "";
    const btn = document.createElement("button");
    btn.className = "vn-trigger-btn";
    btn.title = "Dịch đoạn này bằng InstantTranslate";
    btn.innerHTML = ICONS.book;

    btn.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      e.preventDefault();
      translate(text, rect);
    });

    container.appendChild(btn);

    let left = rect.right + 6 + window.scrollX;
    let top = rect.bottom + 4 + window.scrollY;
    if (left + 36 > window.scrollX + window.innerWidth) {
      left = rect.right - 34 + window.scrollX;
    }

    container.style.left = `${Math.round(left)}px`;
    container.style.top = `${Math.round(top)}px`;
    container.style.display = "block";
    container.style.visibility = "visible";
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // Hiển thị khung dịch chuẩn giao diện Việt Nam
  function render(text, rect, targetLangOverride) {
    const curTarget = targetLangOverride || settings.targetLang || "vi";
    const src = LANG_DATA[currentDetectedSourceLang] || { flag: "🌐", short: currentDetectedSourceLang };
    const trg = LANG_DATA[curTarget] || { flag: "🇻🇳", short: "Việt" };

    container.innerHTML = `
      <div class="vn-card">
        <!-- Header -->
        <div class="vn-header">
          <div class="vn-header-left">
            <div class="vn-app-icon">${ICONS.book}</div>
            <span class="vn-header-title">Dịch Tiếng Việt</span>
          </div>

          <!-- Huy hiệu cờ ngôn ngữ -->
          <div class="vn-lang-badge">
            <span>${src.flag} ${src.short}</span>
            <button class="vn-swap-icon" id="vn-swap-btn" title="Đổi chiều ngôn ngữ">
              ${ICONS.swap}
            </button>
            <span>${trg.flag} ${trg.short}</span>
          </div>

          <!-- Nút thao tác -->
          <div class="vn-header-btns">
            <button class="vn-tool-btn ${isPinned ? "pinned" : ""}" id="vn-pin-btn" title="${isPinned ? "Bỏ ghim" : "Ghim cửa sổ"}">
              ${ICONS.pin}
            </button>
            <button class="vn-tool-btn" id="vn-close-btn" title="Đóng (Esc)">
              ${ICONS.close}
            </button>
          </div>
        </div>

        <!-- Thân hộp dịch -->
        <div class="vn-body">
          <!-- 1. KHỐI BẢN DỊCH TIẾNG VIỆT (TÂM ĐIỂM) -->
          <div class="vn-result-box">
            <div class="vn-result-header">
              <span class="vn-result-tag">🇻🇳 NGHĨA TIẾNG VIỆT</span>
              <button class="vn-tool-btn" id="vn-tts-res" title="Phát âm tiếng Việt" style="display:none;">
                ${ICONS.speaker}
              </button>
            </div>
            <div id="vn-res-content">
              <div class="vn-shimmer-bar" style="width: 88%;"></div>
              <div class="vn-shimmer-bar" style="width: 60%;"></div>
            </div>
          </div>

          <!-- 2. KHỐI VĂN BẢN GỐC -->
          <div class="vn-source-box">
            <div class="vn-source-header">
              <span>VĂN BẢN GỐC</span>
              <button class="vn-tool-btn" id="vn-tts-src" title="Phát âm bản gốc">
                ${ICONS.speaker}
              </button>
            </div>
            <div class="vn-source-text">${escapeHtml(text)}</div>
            <div id="vn-ipa-container" style="display:none;"></div>
          </div>

          <!-- 3. TỪ ĐIỂN TRA TỪ LOẠI -->
          <div id="vn-dict-container" style="display:none;"></div>
        </div>

        <!-- Thanh công cụ dưới -->
        <div class="vn-footer">
          <select class="vn-select-lang" id="vn-lang-select">
            <option value="vi" ${curTarget === "vi" ? "selected" : ""}>🇻🇳 Tiếng Việt</option>
            <option value="en" ${curTarget === "en" ? "selected" : ""}>🇺🇸 Tiếng Anh</option>
            <option value="zh-CN" ${curTarget === "zh-CN" ? "selected" : ""}>🇨🇳 Tiếng Trung</option>
            <option value="ja" ${curTarget === "ja" ? "selected" : ""}>🇯🇵 Tiếng Nhật</option>
            <option value="ko" ${curTarget === "ko" ? "selected" : ""}>🇰🇷 Tiếng Hàn</option>
            <option value="fr" ${curTarget === "fr" ? "selected" : ""}>🇫🇷 Tiếng Pháp</option>
          </select>

          <div class="vn-actions-right">
            <button class="vn-btn" id="vn-replace-btn" title="Thay thế chữ đang chọn trên web (Ctrl+Enter)">
              ${ICONS.replace}
              <span>Thay thế</span>
            </button>
            <button class="vn-btn vn-btn-primary" id="vn-copy-btn" title="Sao chép kết quả">
              ${ICONS.copy}
              <span>Sao chép</span>
            </button>
            <button class="vn-tool-btn" id="vn-ext-btn" title="Mở trang Google Dịch">
              ${ICONS.external}
            </button>
          </div>
        </div>
      </div>
    `;

    const card = container.querySelector(".vn-card");
    position(card, rect);

    // Xử lý sự kiện
    container.querySelector("#vn-pin-btn").addEventListener("click", (e) => {
      isPinned = !isPinned;
      e.currentTarget.classList.toggle("pinned", isPinned);
    });

    container.querySelector("#vn-close-btn").addEventListener("click", () => {
      isPinned = false;
      hideUI();
    });

    container.querySelector("#vn-lang-select").addEventListener("change", (e) => {
      translate(text, rect, e.target.value);
    });

    container.querySelector("#vn-swap-btn").addEventListener("click", () => {
      const nextTarget = currentDetectedSourceLang === "vi" ? "en" : currentDetectedSourceLang;
      translate(text, rect, nextTarget);
    });

    container.querySelector("#vn-tts-src").addEventListener("click", () => {
      speak(text, currentDetectedSourceLang);
    });

    container.querySelector("#vn-tts-res").addEventListener("click", () => {
      speak(container.dataset.translatedText || "", curTarget);
    });

    const copyBtn = container.querySelector("#vn-copy-btn");
    copyBtn.addEventListener("click", async () => {
      const tr = container.dataset.translatedText;
      if (!tr) return;
      await navigator.clipboard.writeText(tr);
      copyBtn.classList.add("copied");
      copyBtn.innerHTML = `${ICONS.check} <span>Đã chép!</span>`;
      setTimeout(() => {
        copyBtn.classList.remove("copied");
        copyBtn.innerHTML = `${ICONS.copy} <span>Sao chép</span>`;
      }, 1500);
    });

    container.querySelector("#vn-replace-btn").addEventListener("click", () => {
      const tr = container.dataset.translatedText;
      if (tr) replaceText(tr);
    });

    container.querySelector("#vn-ext-btn").addEventListener("click", () => {
      window.open(`https://translate.google.com/?sl=auto&tl=${curTarget}&text=${encodeURIComponent(text)}`, "_blank");
    });

    return curTarget;
  }

  // Gọi dịch thuật
  function translate(text, rect, targetLangOverride) {
    const curTarget = targetLangOverride || settings.targetLang || "vi";
    render(text, rect, curTarget);

    const reqId = ++activeTranslateRequest;

    chrome.runtime.sendMessage(
      {
        action: "TRANSLATE",
        text: text,
        sourceLang: "auto",
        targetLang: curTarget
      },
      (res) => {
        if (reqId !== activeTranslateRequest) return;

        const resContent = container.querySelector("#vn-res-content");
        const ttsRes = container.querySelector("#vn-tts-res");
        const ipaContainer = container.querySelector("#vn-ipa-container");
        const dictContainer = container.querySelector("#vn-dict-container");

        if (!resContent) return;

        if (res && res.success && res.data) {
          const d = res.data;
          container.dataset.translatedText = d.translatedText;
          currentDetectedSourceLang = d.sourceLang || "en";

          // Hiển thị nghĩa tiếng Việt
          resContent.innerHTML = `<div class="vn-result-text">${escapeHtml(d.translatedText)}</div>`;
          if (ttsRes) ttsRes.style.display = "flex";

          // Phiên âm IPA
          if (d.transliteration && ipaContainer) {
            ipaContainer.style.display = "block";
            ipaContainer.innerHTML = `<div class="vn-ipa-wrap">🔊 [${escapeHtml(d.transliteration)}]</div>`;
          }

          // Tra từ loại (chuẩn từ điển Cốc Cốc / Laban)
          if (settings.showDict && d.dict && d.dict.length > 0 && dictContainer) {
            let dictHtml = `
              <div class="vn-dict-group">
                <span class="vn-dict-title">📖 CÁC NGHĨA KHÁC & TỪ LOẠI</span>
            `;
            for (const item of d.dict) {
              const posLow = (item.pos || "").toLowerCase();
              let posClass = "pos-other";
              let posLabel = item.pos;
              if (posLow.includes("noun")) { posClass = "pos-noun"; posLabel = "Danh từ"; }
              else if (posLow.includes("verb")) { posClass = "pos-verb"; posLabel = "Động từ"; }
              else if (posLow.includes("adj")) { posClass = "pos-adj"; posLabel = "Tính từ"; }

              dictHtml += `
                <div class="vn-pos-block">
                  <div class="vn-pos-header">
                    <span class="vn-pos-badge ${posClass}">${escapeHtml(posLabel)}</span>
                  </div>
                  <div class="vn-synonym-list">
                    ${item.terms.map(t => `<span class="vn-syn-chip" title="Bấm để chép từ này">${escapeHtml(t)}</span>`).join("")}
                  </div>
                </div>
              `;
            }
            dictHtml += `</div>`;
            dictContainer.innerHTML = dictHtml;
            dictContainer.style.display = "flex";

            // Click vào từ đồng nghĩa để chép
            dictContainer.querySelectorAll(".vn-syn-chip").forEach(chip => {
              chip.addEventListener("click", () => {
                navigator.clipboard.writeText(chip.textContent);
                const old = chip.textContent;
                chip.textContent = "✓ Đã chép";
                setTimeout(() => { chip.textContent = old; }, 1200);
              });
            });
          }

          if (settings.autoTts) {
            speak(d.translatedText, d.targetLang);
          }

          const card = container.querySelector(".vn-card");
          if (card) position(card, rect);
        } else {
          resContent.innerHTML = `<div style="color: #dc2626; font-size: 13px; font-weight: 600;">⚠️ ${escapeHtml(res?.error || "Không thể dịch văn bản")}</div>`;
        }
      }
    );
  }

  // Bắt sự kiện bôi đen
  function onSelect(event) {
    if (!settings.enabled) return;

    const currentHost = window.location.hostname;
    if (settings.excludedDomains?.includes(currentHost)) return;

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      if (!isPinned && container.style.display === "block") hideUI();
      return;
    }

    const text = sel.toString().trim();
    if (!text || text.length < 1 || text.length > 5000) {
      if (!isPinned) hideUI();
      return;
    }

    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
      if (activeEl.type === "password") return;
      activeInputElement = activeEl;
    } else {
      activeInputElement = null;
    }

    activeRange = sel.getRangeAt(0).cloneRange();
    const rect = activeRange.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    const mode = settings.triggerMode || "auto";
    if (mode === "ctrl" && !event.ctrlKey && !event.metaKey) return;
    if (mode === "alt" && !event.altKey) return;

    if (mode === "icon") {
      showIcon(text, rect);
    } else {
      translate(text, rect);
    }
  }

  document.addEventListener("mouseup", (e) => {
    if (e.composedPath().includes(host)) return;
    setTimeout(() => onSelect(e), 20);
  });

  document.addEventListener("dblclick", (e) => {
    if (!settings.enabled || !settings.doubleClickToTranslate) return;
    if (e.composedPath().includes(host)) return;
    setTimeout(() => onSelect(e), 30);
  });

  document.addEventListener("mousedown", (e) => {
    if (e.composedPath().includes(host)) return;
    if (!isPinned && container.style.display === "block") hideUI();
  });

  document.addEventListener("keydown", (e) => {
    if (container.style.display !== "block") return;
    if (e.key === "Escape") {
      isPinned = false;
      hideUI();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      const tr = container.dataset.translatedText;
      if (tr) {
        e.preventDefault();
        replaceText(tr);
      }
    }
  });

  chrome.runtime?.onMessage?.addListener((msg) => {
    if (msg.action === "TRIGGER_SELECTION_TRANSLATE" && msg.text) {
      const sel = window.getSelection();
      let rect = { left: window.innerWidth / 2 - 195, top: 120, right: window.innerWidth / 2 + 195, bottom: 140 };
      if (sel && sel.rangeCount > 0) {
        rect = sel.getRangeAt(0).getBoundingClientRect();
      }
      translate(msg.text, rect);
    }
  });
})();
