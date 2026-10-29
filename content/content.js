/**
 * InstantTranslate - Content Script (V5 - Cờ Quốc Gia SVG Chuẩn Xác 100%)
 * Sử dụng cờ SVG màu sắc thực tế thay vì ký tự emoji (khắc phục triệt để lỗi Windows biến cờ thành chữ 'us' và 'vn').
 * Định dạng chuẩn: [Cờ SVG] + Tên ngôn ngữ (Hoàn toàn không có chữ 'us' hay 'vn').
 */

(function () {
  if (window.__instantTranslateLoaded) return;
  window.__instantTranslateLoaded = true;

  // Thư viện CỜ SVG CHUẨN (Hiển thị sắc nét trên Windows 10/11, không bao giờ bị biến thành chữ US/VN)
  const SVG_FLAGS = {
    vi: `<svg class="vn-flag-svg" viewBox="0 0 30 20"><rect width="30" height="20" rx="2.5" fill="#da251d"/><polygon fill="#ffff00" points="15,4 16.5,8.5 21,8.5 17.5,11.2 18.8,15.5 15,12.8 11.2,15.5 12.5,11.2 9,8.5 13.5,8.5"/></svg>`,
    en: `<svg class="vn-flag-svg" viewBox="0 0 30 20"><rect width="30" height="20" rx="2.5" fill="#b22234"/><path d="M0 3.1h30v1.5H0zm0 3.1h30v1.5H0zm0 3.1h30v1.5H0zm0 3.1h30v1.5H0zm0 3.1h30v1.5H0zm0 3.1h30v1.5H0z" fill="#ffffff"/><rect width="13" height="10.8" rx="2" fill="#3c3b6e"/><circle cx="6.5" cy="5.4" r="2.8" fill="#ffffff"/></svg>`,
    "zh-CN": `<svg class="vn-flag-svg" viewBox="0 0 30 20"><rect width="30" height="20" rx="2.5" fill="#de2910"/><polygon fill="#ffde00" points="5,3 6,6 9,6 6.5,8 7.5,11 5,9 2.5,11 3.5,8 1,6 4,6"/></svg>`,
    "zh-TW": `<svg class="vn-flag-svg" viewBox="0 0 30 20"><rect width="30" height="20" rx="2.5" fill="#fe0000"/><rect width="14" height="10" rx="2" fill="#000095"/><circle cx="7" cy="5" r="2.8" fill="#ffffff"/></svg>`,
    ja: `<svg class="vn-flag-svg" viewBox="0 0 30 20"><rect width="30" height="20" rx="2.5" fill="#ffffff" stroke="#cbd5e1" stroke-width="0.8"/><circle cx="15" cy="10" r="5.5" fill="#bc002d"/></svg>`,
    ko: `<svg class="vn-flag-svg" viewBox="0 0 30 20"><rect width="30" height="20" rx="2.5" fill="#ffffff" stroke="#cbd5e1" stroke-width="0.8"/><circle cx="15" cy="10" r="5" fill="#cd2e3a"/><path d="M10 10a5 5 0 0 0 10 0 2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 0-5 0z" fill="#0047a0"/></svg>`,
    fr: `<svg class="vn-flag-svg" viewBox="0 0 30 20"><rect width="10" height="20" rx="2.5" fill="#002395"/><rect x="10" width="10" height="20" fill="#ffffff"/><rect x="20" width="10" height="20" rx="2.5" fill="#ed2939"/></svg>`,
    de: `<svg class="vn-flag-svg" viewBox="0 0 30 20"><rect width="30" height="6.7" rx="2.5" fill="#000000"/><rect y="6.7" width="30" height="6.6" fill="#dd0000"/><rect y="13.3" width="30" height="6.7" rx="2.5" fill="#ffce00"/></svg>`,
    es: `<svg class="vn-flag-svg" viewBox="0 0 30 20"><rect width="30" height="20" rx="2.5" fill="#aa151b"/><rect y="5" width="30" height="10" fill="#f1bf00"/></svg>`,
    ru: `<svg class="vn-flag-svg" viewBox="0 0 30 20"><rect width="30" height="6.7" rx="2.5" fill="#ffffff" stroke="#cbd5e1" stroke-width="0.6"/><rect y="6.7" width="30" height="6.6" fill="#0039a6"/><rect y="13.3" width="30" height="6.7" rx="2.5" fill="#d52b1e"/></svg>`,
    th: `<svg class="vn-flag-svg" viewBox="0 0 30 20"><rect width="30" height="20" rx="2.5" fill="#a51931"/><rect y="3.3" width="30" height="13.4" fill="#ffffff"/><rect y="6.7" width="30" height="6.6" fill="#2d2a4a"/></svg>`,
    it: `<svg class="vn-flag-svg" viewBox="0 0 30 20"><rect width="10" height="20" rx="2.5" fill="#009246"/><rect x="10" width="10" height="20" fill="#ffffff"/><rect x="20" width="10" height="20" rx="2.5" fill="#ce2b37"/></svg>`,
    auto: `<svg class="vn-flag-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#0284c7"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10zM2 12h20M4.93 6.93h14.14M4.93 17.07h14.14" stroke="#ffffff" stroke-width="1.6" fill="none"/></svg>`
  };

  // Danh mục tên ngôn ngữ thuần Việt
  const LANG_NAMES = {
    vi: "Tiếng Việt",
    en: "Tiếng Anh",
    "zh-CN": "Tiếng Trung (Giản)",
    "zh-TW": "Tiếng Trung (Phồn)",
    ja: "Tiếng Nhật",
    ko: "Tiếng Hàn",
    fr: "Tiếng Pháp",
    de: "Tiếng Đức",
    es: "Tiếng Tây Ban Nha",
    ru: "Tiếng Nga",
    th: "Tiếng Thái",
    it: "Tiếng Ý",
    auto: "Tự động phát hiện"
  };

  const TTS_VOICES = {
    vi: "vi-VN",
    en: "en-US",
    "zh-CN": "zh-CN",
    "zh-TW": "zh-TW",
    ja: "ja-JP",
    ko: "ko-KR",
    fr: "fr-FR",
    de: "de-DE",
    es: "es-ES",
    ru: "ru-RU",
    th: "th-TH",
    it: "it-IT"
  };

  function getFlagSvg(code) {
    return SVG_FLAGS[code] || SVG_FLAGS["auto"];
  }

  function getLangName(code) {
    return LANG_NAMES[code] || code.toUpperCase();
  }

  // Cấu hình
  let settings = {
    enabled: true,
    targetLang: "vi",
    sourceLang: "auto",
    triggerMode: "auto",
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
  let activeSelectionText = "";

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

  // Khởi tạo Shadow Host
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

  const shadow = host.attachShadow({ mode: "closed" });

  // Stylesheet
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

    /* CỜ QUỐC GIA SVG THẬT (SẮC NÉT TRÊN WINDOWS) */
    .vn-flag-svg {
      width: 19px;
      height: 13px;
      border-radius: 2.5px;
      display: inline-block;
      vertical-align: middle;
      flex-shrink: 0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.22);
      overflow: hidden;
    }

    /* Nút trigger icon tròn */
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

    /* KHUNG THẺ DỊCH CHÍNH */
    .vn-card {
      position: absolute;
      width: 490px;
      min-width: 330px;
      max-width: 92vw;
      border-radius: 14px;
      background: #ffffff;
      color: #1e293b;
      box-shadow: 
        0 20px 48px -8px rgba(0, 40, 120, 0.22),
        0 6px 18px -2px rgba(0, 0, 0, 0.08),
        0 0 0 1px rgba(200, 215, 235, 0.9);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: vnSpring 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @media (prefers-color-scheme: dark) {
      .vn-card {
        background: #151922;
        color: #f1f5f9;
        box-shadow: 
          0 24px 54px -8px rgba(0, 0, 0, 0.75),
          0 8px 24px -2px rgba(0, 0, 0, 0.5),
          0 0 0 1px rgba(255, 255, 255, 0.12);
      }
    }

    /* HEADER */
    .vn-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      background: #f1f5fb;
      border-bottom: 1px solid #dce5f2;
      flex-shrink: 0;
    }

    @media (prefers-color-scheme: dark) {
      .vn-header {
        background: #1c2230;
        border-color: rgba(255, 255, 255, 0.08);
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
    }

    .vn-app-icon svg {
      width: 13px;
      height: 13px;
      fill: #ffffff;
    }

    .vn-header-title {
      font-size: 13px;
      font-weight: 700;
      color: #0050cc;
      letter-spacing: -0.2px;
    }

    @media (prefers-color-scheme: dark) {
      .vn-header-title {
        color: #60a5fa;
      }
    }

    /* Thanh cờ ngôn ngữ (CỜ SVG + TÊN NGÔN NGỮ) */
    .vn-lang-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      border-radius: 20px;
      background: #ffffff;
      border: 1px solid #c7d8ee;
      font-size: 11.5px;
      font-weight: 600;
      color: #1e3a8a;
    }

    @media (prefers-color-scheme: dark) {
      .vn-lang-badge {
        background: #242c3d;
        border-color: #3b4763;
        color: #93c5fd;
      }
    }

    .vn-lang-item {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    .vn-swap-icon {
      width: 18px;
      height: 18px;
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

    .vn-header-btns {
      display: flex;
      align-items: center;
      gap: 3px;
    }

    .vn-tool-btn {
      width: 26px;
      height: 26px;
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

    /* THÂN HỘP DỊCH */
    .vn-body {
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      overflow-y: auto;
      flex: 1;
      min-height: 0;
    }

    .vn-body::-webkit-scrollbar {
      width: 6px;
    }
    .vn-body::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }

    @media (prefers-color-scheme: dark) {
      .vn-body::-webkit-scrollbar-thumb {
        background: #334155;
      }
    }

    /* KHỐI BẢN DỊCH */
    .vn-result-box {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .vn-result-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .vn-result-tag {
      font-size: 11.5px;
      font-weight: 700;
      color: #0068ff;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    @media (prefers-color-scheme: dark) {
      .vn-result-tag {
        color: #60a5fa;
      }
    }

    .vn-result-text {
      font-size: 15px;
      font-weight: 450;
      line-height: 1.65;
      color: #0f172a;
      word-break: break-word;
      user-select: text;
    }

    @media (prefers-color-scheme: dark) {
      .vn-result-text {
        color: #f1f5f9;
      }
    }

    /* Phiên âm IPA */
    .vn-ipa-wrap {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      color: #0284c7;
      font-family: ui-monospace, Consolas, monospace;
      background: #e0f2fe;
      padding: 2px 7px;
      border-radius: 5px;
      width: fit-content;
      margin-top: 2px;
    }

    @media (prefers-color-scheme: dark) {
      .vn-ipa-wrap {
        background: #0c2842;
        color: #38bdf8;
      }
    }

    /* VĂN BẢN GỐC THU GỌN ACCORDION */
    .vn-source-accordion {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #f8fafc;
      overflow: hidden;
      margin-top: 2px;
    }

    @media (prefers-color-scheme: dark) {
      .vn-source-accordion {
        border-color: rgba(255, 255, 255, 0.08);
        background: #1a202c;
      }
    }

    .vn-source-toggle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 10px;
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      cursor: pointer;
      user-select: none;
      background: transparent;
    }

    .vn-source-toggle:hover {
      background: rgba(0, 0, 0, 0.03);
    }

    @media (prefers-color-scheme: dark) {
      .vn-source-toggle:hover {
        background: rgba(255, 255, 255, 0.04);
      }
    }

    .vn-source-content {
      padding: 8px 10px;
      border-top: 1px solid #e2e8f0;
      font-size: 12.5px;
      line-height: 1.5;
      color: #475569;
      word-break: break-word;
      max-height: 100px;
      overflow-y: auto;
      user-select: text;
    }

    @media (prefers-color-scheme: dark) {
      .vn-source-content {
        border-color: rgba(255, 255, 255, 0.08);
        color: #94a3b8;
      }
    }

    /* TỪ ĐIỂN TỪ LOẠI */
    .vn-dict-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
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

    .vn-pos-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 1.5px 6px;
      border-radius: 4px;
      width: fit-content;
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

    /* FOOTER THAO TÁC CỐ ĐỊNH */
    .vn-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 9px 14px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      flex-shrink: 0;
      gap: 8px;
    }

    @media (prefers-color-scheme: dark) {
      .vn-footer {
        background: #181d28;
        border-color: rgba(255, 255, 255, 0.08);
      }
    }

    .vn-select-box {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 7px;
      padding: 2px 6px;
    }

    @media (prefers-color-scheme: dark) {
      .vn-select-box {
        background: #242c3d;
        border-color: #3a4659;
      }
    }

    .vn-select-lang {
      font-size: 11.5px;
      font-weight: 600;
      padding: 3px 2px;
      border: none;
      background: transparent;
      color: #1e293b;
      cursor: pointer;
      outline: none;
    }

    @media (prefers-color-scheme: dark) {
      .vn-select-lang {
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
      padding: 5px 10px;
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

    .vn-btn-primary {
      background: #0068ff !important;
      color: #ffffff !important;
      border: none !important;
      box-shadow: 0 2px 6px rgba(0, 104, 255, 0.35);
    }

    .vn-btn-primary:hover {
      background: #0052cc !important;
    }

    .vn-btn-primary.copied {
      background: #16a34a !important;
    }

    .vn-btn svg {
      width: 13px;
      height: 13px;
      fill: currentColor;
    }

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
      0% { opacity: 0; transform: translateY(6px) scale(0.98); }
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

  function speak(text, lang) {
    if (!text || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = TTS_VOICES[lang] || lang || "vi-VN";
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  }

  function hideUI() {
    container.innerHTML = "";
    container.style.display = "none";
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  // ĐỊNH VỊ THÔNG MINH - KHÔNG BAO GIỜ BỊ ẨN KHÚC DƯỚI
  function position(elem, rect) {
    container.style.display = "block";
    container.style.visibility = "hidden";

    requestAnimationFrame(() => {
      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      const isLongText = (activeSelectionText || "").length > 80;
      const targetWidth = isLongText ? Math.min(540, viewportW - 32) : Math.min(420, viewportW - 32);
      elem.style.width = `${targetWidth}px`;

      const maxAllowedH = Math.min(viewportH - 32, 480);
      elem.style.maxHeight = `${maxAllowedH}px`;

      const elemW = elem.offsetWidth || targetWidth;
      const elemH = elem.offsetHeight || 300;

      // Căn chỉnh trục ngang
      let left = rect.left + scrollX;
      if (left + elemW > scrollX + viewportW - 16) {
        left = scrollX + viewportW - elemW - 16;
      }
      if (left < scrollX + 16) {
        left = scrollX + 16;
      }

      // Căn chỉnh trục dọc
      const spaceBelow = viewportH - rect.bottom;
      const spaceAbove = rect.top;

      let top = rect.bottom + 8 + scrollY;

      if (spaceBelow < elemH + 16) {
        if (spaceAbove >= elemH + 16 || spaceAbove > spaceBelow) {
          top = rect.top + scrollY - elemH - 8;
        } else {
          top = scrollY + viewportH - elemH - 14;
        }
      }

      if (top < scrollY + 12) {
        top = scrollY + 12;
      }

      container.style.left = `${Math.round(left)}px`;
      container.style.top = `${Math.round(top)}px`;
      container.style.visibility = "visible";
    });
  }

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

  // RENDER CARD VỚI CỜ SVG THẬT (KHÔNG CÓ US/VN)
  function render(text, rect, targetLangOverride) {
    const curTarget = targetLangOverride || settings.targetLang || "vi";
    const srcFlag = getFlagSvg(currentDetectedSourceLang);
    const srcName = getLangName(currentDetectedSourceLang);
    const trgFlag = getFlagSvg(curTarget);
    const trgName = getLangName(curTarget);

    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const isLongParagraph = text.length > 70;

    container.innerHTML = `
      <div class="vn-card">
        <!-- 1. Header (CỜ SVG + TÊN NGÔN NGỮ) -->
        <div class="vn-header">
          <div class="vn-header-left">
            <div class="vn-app-icon">${ICONS.book}</div>
            <span class="vn-header-title">Dịch Tiếng Việt</span>
          </div>

          <!-- Thanh ngôn ngữ: Cờ SVG + Tên nước -->
          <div class="vn-lang-badge">
            <span class="vn-lang-item" id="vn-src-lang-label">
              ${srcFlag}
              <span>${srcName}</span>
            </span>
            <button class="vn-swap-icon" id="vn-swap-btn" title="Đổi chiều ngôn ngữ">
              ${ICONS.swap}
            </button>
            <span class="vn-lang-item" id="vn-trg-lang-label">
              ${trgFlag}
              <span>${trgName}</span>
            </span>
          </div>

          <div class="vn-header-btns">
            <button class="vn-tool-btn ${isPinned ? "pinned" : ""}" id="vn-pin-btn" title="${isPinned ? "Bỏ ghim" : "Ghim cửa sổ"}">
              ${ICONS.pin}
            </button>
            <button class="vn-tool-btn" id="vn-close-btn" title="Đóng (Esc)">
              ${ICONS.close}
            </button>
          </div>
        </div>

        <!-- 2. Thân nội dung -->
        <div class="vn-body">
          <!-- BẢN DỊCH CHÍNH (CỜ SVG + BẢN DỊCH TIẾNG ...) -->
          <div class="vn-result-box">
            <div class="vn-result-header">
              <span class="vn-result-tag" id="vn-result-title-tag">
                ${trgFlag}
                <span>Bản dịch ${trgName}</span>
              </span>
              <button class="vn-tool-btn" id="vn-tts-res" title="Phát âm bản dịch" style="display:none;">
                ${ICONS.speaker}
              </button>
            </div>
            <div id="vn-res-content">
              <div class="vn-shimmer-bar" style="width: 88%;"></div>
              <div class="vn-shimmer-bar" style="width: 60%;"></div>
            </div>
            <div id="vn-ipa-container" style="display:none;"></div>
          </div>

          <!-- VĂN BẢN GỐC (Thu gọn dạng Accordion) -->
          <div class="vn-source-accordion">
            <div class="vn-source-toggle" id="vn-src-toggle">
              <span>📄 Văn bản gốc (${wordCount} từ)</span>
              <div style="display: flex; align-items: center; gap: 4px;">
                <button class="vn-tool-btn" id="vn-tts-src" title="Phát âm bản gốc" style="width:20px;height:20px;">
                  ${ICONS.speaker}
                </button>
                <span id="vn-src-arrow">▾</span>
              </div>
            </div>
            <div class="vn-source-content" id="vn-src-content" style="${isLongParagraph ? 'display:none;' : 'display:block;'}">
              ${escapeHtml(text)}
            </div>
          </div>

          <!-- TỪ ĐIỂN TỪ LOẠI -->
          <div id="vn-dict-container" style="display:none;"></div>
        </div>

        <!-- 3. Footer Cố Định -->
        <div class="vn-footer">
          <div class="vn-select-box">
            <span id="vn-footer-flag">${trgFlag}</span>
            <select class="vn-select-lang" id="vn-lang-select">
              <option value="vi" ${curTarget === "vi" ? "selected" : ""}>Tiếng Việt</option>
              <option value="en" ${curTarget === "en" ? "selected" : ""}>Tiếng Anh</option>
              <option value="zh-CN" ${curTarget === "zh-CN" ? "selected" : ""}>Tiếng Trung (Giản)</option>
              <option value="zh-TW" ${curTarget === "zh-TW" ? "selected" : ""}>Tiếng Trung (Phồn)</option>
              <option value="ja" ${curTarget === "ja" ? "selected" : ""}>Tiếng Nhật</option>
              <option value="ko" ${curTarget === "ko" ? "selected" : ""}>Tiếng Hàn</option>
              <option value="fr" ${curTarget === "fr" ? "selected" : ""}>Tiếng Pháp</option>
              <option value="de" ${curTarget === "de" ? "selected" : ""}>Tiếng Đức</option>
              <option value="es" ${curTarget === "es" ? "selected" : ""}>Tây Ban Nha</option>
              <option value="ru" ${curTarget === "ru" ? "selected" : ""}>Tiếng Nga</option>
              <option value="th" ${curTarget === "th" ? "selected" : ""}>Tiếng Thái</option>
              <option value="it" ${curTarget === "it" ? "selected" : ""}>Tiếng Ý</option>
            </select>
          </div>

          <div class="vn-actions-right">
            <button class="vn-btn" id="vn-replace-btn" title="Thay thế chữ đang chọn trên web (Ctrl+Enter)">
              ${ICONS.replace}
              <span>Thay thế</span>
            </button>
            <button class="vn-btn vn-btn-primary" id="vn-copy-btn" title="Sao chép kết quả">
              ${ICONS.copy}
              <span>Sao chép</span>
            </button>
            <button class="vn-tool-btn" id="vn-ext-btn" title="Mở trên Google Dịch">
              ${ICONS.external}
            </button>
          </div>
        </div>
      </div>
    `;

    const card = container.querySelector(".vn-card");
    position(card, rect);

    // Accordion Toggle
    const srcToggle = container.querySelector("#vn-src-toggle");
    const srcContent = container.querySelector("#vn-src-content");
    const srcArrow = container.querySelector("#vn-src-arrow");
    srcToggle.addEventListener("click", (e) => {
      if (e.target.closest("#vn-tts-src")) return;
      const isHidden = srcContent.style.display === "none";
      srcContent.style.display = isHidden ? "block" : "none";
      srcArrow.textContent = isHidden ? "▴" : "▾";
      position(card, rect);
    });

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

    container.querySelector("#vn-tts-src").addEventListener("click", (e) => {
      e.stopPropagation();
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

  // GỌI DỊCH
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
        const srcLangLabel = container.querySelector("#vn-src-lang-label");

        if (!resContent) return;

        if (res && res.success && res.data) {
          const d = res.data;
          container.dataset.translatedText = d.translatedText;
          currentDetectedSourceLang = d.sourceLang || "en";

          // Cập nhật Cờ SVG & Tên ngôn ngữ nguồn đã nhận diện
          if (srcLangLabel) {
            srcLangLabel.innerHTML = `
              ${getFlagSvg(currentDetectedSourceLang)}
              <span>${getLangName(currentDetectedSourceLang)}</span>
            `;
          }

          // Hiển thị bản dịch
          resContent.innerHTML = `<div class="vn-result-text">${escapeHtml(d.translatedText)}</div>`;
          if (ttsRes) ttsRes.style.display = "flex";

          // Phiên âm IPA
          if (d.transliteration && ipaContainer) {
            ipaContainer.style.display = "block";
            ipaContainer.innerHTML = `<div class="vn-ipa-wrap">🔊 [${escapeHtml(d.transliteration)}]</div>`;
          }

          // Tra từ loại nếu có
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
                    ${item.terms.map(t => `<span class="vn-syn-chip" title="Bấm để chép">${escapeHtml(t)}</span>`).join("")}
                  </div>
                </div>
              `;
            }
            dictHtml += `</div>`;
            dictContainer.innerHTML = dictHtml;
            dictContainer.style.display = "flex";

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

  // Bắt bôi đen chuột
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

    activeSelectionText = text;

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
      let rect = { left: window.innerWidth / 2 - 200, top: 120, right: window.innerWidth / 2 + 200, bottom: 140 };
      if (sel && sel.rangeCount > 0) {
        rect = sel.getRangeAt(0).getBoundingClientRect();
      }
      activeSelectionText = msg.text;
      translate(msg.text, rect);
    }
  });
})();
