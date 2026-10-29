/**
 * InstantTranslate - Content Script
 * Isolated via Shadow DOM (closed mode) to guarantee host page CSS never impacts the popup.
 */

(function () {
  // Prevent duplicate script execution
  if (window.__instantTranslateLoaded) return;
  window.__instantTranslateLoaded = true;

  // Language display dictionary
  const LANG_NAMES = {
    vi: "Tiếng Việt",
    en: "Tiếng Anh",
    "zh-CN": "Tiếng Trung (Giản thể)",
    "zh-TW": "Tiếng Trung (Phồn thể)",
    ja: "Tiếng Nhật",
    ko: "Tiếng Hàn",
    fr: "Tiếng Pháp",
    de: "Tiếng Đức",
    es: "Tiếng T.B.Nha",
    ru: "Tiếng Nga",
    th: "Tiếng Thái",
    it: "Tiếng Ý",
    auto: "Tự động phát hiện"
  };

  const TTS_VOICE_MAP = {
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

  // State
  let settings = {
    enabled: true,
    targetLang: "vi",
    sourceLang: "auto",
    triggerMode: "auto", // "auto" | "icon" | "ctrl" | "alt"
    showDict: true,
    autoTts: false,
    theme: "auto",
    excludedDomains: []
  };

  let isPinned = false;
  let lastSelectedText = "";
  let lastSelectionCoords = null;
  let activeTranslateRequest = 0;
  let debounceTimer = null;

  // Load settings from storage
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

  // Listen for storage changes in real time
  if (chrome?.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes.settings) {
        settings = { ...settings, ...changes.settings.newValue };
      }
    });
  }

  // Create isolated container host
  const host = document.createElement("div");
  host.id = "instant-translate-host";
  host.style.position = "absolute";
  host.style.top = "0";
  host.style.left = "0";
  host.style.width = "0";
  host.style.height = "0";
  host.style.zIndex = "2147483647"; // Max z-index
  host.style.pointerEvents = "none";
  document.documentElement.appendChild(host);

  // Attach Closed Shadow DOM for bulletproof CSS isolation
  const shadow = host.attachShadow({ mode: "closed" });

  // Inject Styles into Shadow DOM
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

    .it-wrapper {
      position: absolute;
      pointer-events: auto;
      z-index: 2147483647;
      user-select: none;
    }

    /* Floating Trigger Button */
    .it-trigger-btn {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4f46e5, #0ea5e9);
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4), 0 1px 3px rgba(0,0,0,0.2);
      border: 1.5px solid rgba(255, 255, 255, 0.8);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.18s ease;
      animation: itFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .it-trigger-btn:hover {
      transform: scale(1.15) translateY(-2px);
      box-shadow: 0 6px 16px rgba(79, 70, 229, 0.55);
    }

    .it-trigger-btn svg {
      width: 17px;
      height: 17px;
      fill: #ffffff;
    }

    /* Translation Popover Card */
    .it-popover {
      position: absolute;
      width: 350px;
      min-width: 280px;
      max-width: 90vw;
      border-radius: 14px;
      background: #ffffff;
      color: #1e293b;
      box-shadow: 0 10px 30px -4px rgba(0, 0, 0, 0.18), 0 4px 12px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(226, 232, 240, 0.95);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: itPopIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
      backdrop-filter: blur(12px);
    }

    @media (prefers-color-scheme: dark) {
      .it-popover {
        background: #181b26;
        color: #f1f5f9;
        border-color: rgba(255, 255, 255, 0.1);
        box-shadow: 0 14px 40px -4px rgba(0, 0, 0, 0.55), 0 4px 16px rgba(0, 0, 0, 0.3);
      }
    }

    /* Popover Header */
    .it-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      background: rgba(248, 250, 252, 0.9);
      border-bottom: 1px solid #e2e8f0;
    }

    @media (prefers-color-scheme: dark) {
      .it-header {
        background: rgba(30, 34, 48, 0.85);
        border-color: rgba(255, 255, 255, 0.08);
      }
    }

    .it-brand {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 13px;
      font-weight: 700;
      color: #4f46e5;
      letter-spacing: -0.2px;
    }

    @media (prefers-color-scheme: dark) {
      .it-brand {
        color: #818cf8;
      }
    }

    .it-brand-logo {
      width: 18px;
      height: 18px;
      border-radius: 5px;
      background: linear-gradient(135deg, #4f46e5, #0ea5e9);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .it-brand-logo svg {
      width: 11px;
      height: 11px;
      fill: #fff;
    }

    .it-lang-tag {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 12px;
      background: #e0e7ff;
      color: #3730a3;
      white-space: nowrap;
    }

    @media (prefers-color-scheme: dark) {
      .it-lang-tag {
        background: rgba(79, 70, 229, 0.25);
        color: #a5b4fc;
      }
    }

    .it-header-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .it-btn-icon {
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

    .it-btn-icon:hover {
      background: rgba(0, 0, 0, 0.06);
      color: #1e293b;
    }

    @media (prefers-color-scheme: dark) {
      .it-btn-icon {
        color: #94a3b8;
      }
      .it-btn-icon:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #f8fafc;
      }
    }

    .it-btn-icon.active {
      color: #4f46e5;
      background: #e0e7ff;
    }

    @media (prefers-color-scheme: dark) {
      .it-btn-icon.active {
        color: #818cf8;
        background: rgba(79, 70, 229, 0.3);
      }
    }

    .it-btn-icon svg {
      width: 15px;
      height: 15px;
      fill: currentColor;
    }

    /* Popover Content Body */
    .it-body {
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 380px;
      overflow-y: auto;
    }

    .it-body::-webkit-scrollbar {
      width: 5px;
    }
    .it-body::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }

    /* Source Text Box */
    .it-source-section {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .it-section-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #94a3b8;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .it-source-text {
      font-size: 13px;
      line-height: 1.45;
      color: #475569;
      font-style: italic;
      word-break: break-word;
      max-height: 72px;
      overflow-y: auto;
      user-select: text;
    }

    @media (prefers-color-scheme: dark) {
      .it-source-text {
        color: #94a3b8;
      }
    }

    .it-divider {
      height: 1px;
      background: #f1f5f9;
      margin: 2px 0;
    }

    @media (prefers-color-scheme: dark) {
      .it-divider {
        background: rgba(255, 255, 255, 0.06);
      }
    }

    /* Result Translation Box */
    .it-result-section {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .it-result-text {
      font-size: 15px;
      font-weight: 500;
      line-height: 1.5;
      color: #0f172a;
      word-break: break-word;
      user-select: text;
    }

    @media (prefers-color-scheme: dark) {
      .it-result-text {
        color: #f8fafc;
      }
    }

    .it-phonetic {
      font-size: 12px;
      color: #0ea5e9;
      font-family: monospace;
      margin-top: -2px;
    }

    /* Loading Shimmer Animation */
    .it-loading-bar {
      height: 16px;
      border-radius: 4px;
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: itShimmer 1.5s infinite;
      margin: 4px 0;
    }

    @media (prefers-color-scheme: dark) {
      .it-loading-bar {
        background: linear-gradient(90deg, #1e2230 25%, #2a3044 50%, #1e2230 75%);
        background-size: 200% 100%;
      }
    }

    /* Dictionary Entries */
    .it-dict-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 4px;
      padding-top: 8px;
      border-top: 1px dashed #e2e8f0;
    }

    @media (prefers-color-scheme: dark) {
      .it-dict-list {
        border-color: rgba(255, 255, 255, 0.08);
      }
    }

    .it-dict-item {
      font-size: 12px;
      display: flex;
      gap: 6px;
      align-items: baseline;
    }

    .it-pos-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 4px;
      background: #f1f5f9;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    @media (prefers-color-scheme: dark) {
      .it-pos-badge {
        background: #232838;
        color: #94a3b8;
      }
    }

    .it-dict-terms {
      color: #334155;
      line-height: 1.35;
    }

    @media (prefers-color-scheme: dark) {
      .it-dict-terms {
        color: #cbd5e1;
      }
    }

    /* Footer Toolbar */
    .it-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 14px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
    }

    @media (prefers-color-scheme: dark) {
      .it-footer {
        background: rgba(24, 27, 38, 0.95);
        border-color: rgba(255, 255, 255, 0.08);
      }
    }

    .it-footer-left {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .it-target-select {
      font-size: 11px;
      font-weight: 500;
      padding: 3px 6px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #334155;
      cursor: pointer;
      outline: none;
    }

    @media (prefers-color-scheme: dark) {
      .it-target-select {
        background: #1e2230;
        border-color: #334155;
        color: #f1f5f9;
      }
    }

    .it-footer-right {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .it-action-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      color: #475569;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .it-action-btn:hover {
      background: #f1f5f9;
      color: #0f172a;
      border-color: #cbd5e1;
    }

    @media (prefers-color-scheme: dark) {
      .it-action-btn {
        background: #1e2230;
        border-color: rgba(255, 255, 255, 0.1);
        color: #cbd5e1;
      }
      .it-action-btn:hover {
        background: #2a3044;
        color: #ffffff;
      }
    }

    .it-action-btn.copied {
      background: #10b981 !important;
      border-color: #10b981 !important;
      color: #ffffff !important;
    }

    .it-action-btn svg {
      width: 13px;
      height: 13px;
      fill: currentColor;
    }

    /* Error Message */
    .it-error-banner {
      padding: 8px 10px;
      border-radius: 6px;
      background: #fef2f2;
      border: 1px solid #fee2e2;
      color: #b91c1c;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    @media (prefers-color-scheme: dark) {
      .it-error-banner {
        background: rgba(185, 28, 28, 0.15);
        border-color: rgba(185, 28, 28, 0.3);
        color: #fca5a5;
      }
    }

    /* Keyframes */
    @keyframes itFadeIn {
      from { opacity: 0; transform: scale(0.85); }
      to { opacity: 1; transform: scale(1); }
    }

    @keyframes itPopIn {
      from { opacity: 0; transform: translateY(6px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes itShimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `;
  shadow.appendChild(styleEl);

  // Root container in shadow
  const container = document.createElement("div");
  container.className = "it-wrapper";
  shadow.appendChild(container);

  // SVG Icons library
  const ICONS = {
    translate: `<svg viewBox="0 0 24 24"><path d="M12.87 15.07l-2.54-2.51.03-.08c1.74-1.94 2.98-4.17 3.71-6.49H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>`,
    speaker: `<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`,
    copy: `<svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`,
    check: `<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`,
    pin: `<svg viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>`,
    close: `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`
  };

  // Text-To-Speech function
  function speakText(text, langCode) {
    if (!text) return;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = TTS_VOICE_MAP[langCode] || langCode || "en-US";
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  }

  // Remove UI from screen
  function hideUI() {
    container.innerHTML = "";
    container.style.display = "none";
  }

  // Smart Collision Detection Positioning
  function positionElement(elem, rect) {
    container.style.display = "block";
    container.style.visibility = "hidden"; // Render to calculate layout bounds

    requestAnimationFrame(() => {
      const popoverWidth = elem.offsetWidth || 350;
      const popoverHeight = elem.offsetHeight || 220;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      const MARGIN = 12;

      // Calculate Horizontal Position (align with left of selection by default)
      let left = rect.left + scrollX;
      if (left + popoverWidth > scrollX + viewportWidth - MARGIN) {
        left = scrollX + viewportWidth - popoverWidth - MARGIN;
      }
      if (left < scrollX + MARGIN) {
        left = scrollX + MARGIN;
      }

      // Calculate Vertical Position
      // Prefer below the selection
      let top = rect.bottom + 8 + scrollY;
      const spaceBelow = viewportHeight - (rect.bottom);

      // If not enough room below, position above
      if (spaceBelow < popoverHeight + 16 && rect.top > popoverHeight + 16) {
        top = rect.top - popoverHeight - 8 + scrollY;
      }

      container.style.left = `${Math.round(left)}px`;
      container.style.top = `${Math.round(top)}px`;
      container.style.visibility = "visible";
    });
  }

  // Render Trigger Icon Mode
  function showTriggerIcon(text, rect) {
    container.innerHTML = "";
    const btn = document.createElement("button");
    btn.className = "it-trigger-btn";
    btn.title = "Dịch đoạn này bằng InstantTranslate";
    btn.innerHTML = ICONS.translate;

    btn.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      e.preventDefault();
      executeTranslation(text, rect);
    });

    container.appendChild(btn);

    // Place trigger icon right next to selection end
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    let left = rect.right + 4 + scrollX;
    let top = rect.bottom + 4 + scrollY;

    if (left + 36 > scrollX + window.innerWidth) {
      left = rect.right - 34 + scrollX;
    }

    container.style.left = `${Math.round(left)}px`;
    container.style.top = `${Math.round(top)}px`;
    container.style.display = "block";
    container.style.visibility = "visible";
  }

  // Render Translation Popover Card
  function renderPopover(text, rect, targetLangOverride) {
    const currentTargetLang = targetLangOverride || settings.targetLang || "vi";

    container.innerHTML = `
      <div class="it-popover">
        <div class="it-header">
          <div class="it-brand">
            <div class="it-brand-logo">${ICONS.translate}</div>
            <span>InstantTranslate</span>
            <span class="it-lang-tag" id="it-lang-indicator">Đang dịch...</span>
          </div>
          <div class="it-header-actions">
            <button class="it-btn-icon ${isPinned ? "active" : ""}" id="it-pin-btn" title="${isPinned ? "Bỏ ghim" : "Ghim cửa sổ"}">
              ${ICONS.pin}
            </button>
            <button class="it-btn-icon" id="it-close-btn" title="Đóng">
              ${ICONS.close}
            </button>
          </div>
        </div>

        <div class="it-body">
          <div class="it-source-section">
            <div class="it-section-label">
              <span>Bản gốc</span>
              <button class="it-btn-icon" id="it-tts-source" title="Phát âm bản gốc">
                ${ICONS.speaker}
              </button>
            </div>
            <div class="it-source-text">${escapeHtml(text)}</div>
          </div>

          <div class="it-divider"></div>

          <div class="it-result-section">
            <div class="it-section-label">
              <span>Bản dịch</span>
              <button class="it-btn-icon" id="it-tts-result" title="Phát âm bản dịch" style="display:none;">
                ${ICONS.speaker}
              </button>
            </div>
            <div id="it-result-container">
              <div class="it-loading-bar" style="width: 85%;"></div>
              <div class="it-loading-bar" style="width: 60%;"></div>
            </div>
          </div>
        </div>

        <div class="it-footer">
          <div class="it-footer-left">
            <select class="it-target-select" id="it-lang-select">
              <option value="vi" ${currentTargetLang === "vi" ? "selected" : ""}>Tiếng Việt</option>
              <option value="en" ${currentTargetLang === "en" ? "selected" : ""}>Tiếng Anh</option>
              <option value="zh-CN" ${currentTargetLang === "zh-CN" ? "selected" : ""}>Tiếng Trung (Giản)</option>
              <option value="ja" ${currentTargetLang === "ja" ? "selected" : ""}>Tiếng Nhật</option>
              <option value="ko" ${currentTargetLang === "ko" ? "selected" : ""}>Tiếng Hàn</option>
              <option value="fr" ${currentTargetLang === "fr" ? "selected" : ""}>Tiếng Pháp</option>
              <option value="de" ${currentTargetLang === "de" ? "selected" : ""}>Tiếng Đức</option>
              <option value="es" ${currentTargetLang === "es" ? "selected" : ""}>Tiếng T.B.Nha</option>
              <option value="ru" ${currentTargetLang === "ru" ? "selected" : ""}>Tiếng Nga</option>
              <option value="th" ${currentTargetLang === "th" ? "selected" : ""}>Tiếng Thái</option>
            </select>
          </div>
          <div class="it-footer-right">
            <button class="it-action-btn" id="it-copy-btn" title="Sao chép bản dịch">
              ${ICONS.copy}
              <span id="it-copy-text">Sao chép</span>
            </button>
          </div>
        </div>
      </div>
    `;

    const popoverElem = container.querySelector(".it-popover");
    positionElement(popoverElem, rect);

    // Event Listeners
    const pinBtn = container.querySelector("#it-pin-btn");
    pinBtn.addEventListener("click", () => {
      isPinned = !isPinned;
      pinBtn.classList.toggle("active", isPinned);
      pinBtn.title = isPinned ? "Bỏ ghim" : "Ghim cửa sổ";
    });

    const closeBtn = container.querySelector("#it-close-btn");
    closeBtn.addEventListener("click", () => {
      isPinned = false;
      hideUI();
    });

    const langSelect = container.querySelector("#it-lang-select");
    langSelect.addEventListener("change", (e) => {
      executeTranslation(text, rect, e.target.value);
    });

    const ttsSourceBtn = container.querySelector("#it-tts-source");
    ttsSourceBtn.addEventListener("click", () => {
      speakText(text, container.dataset.sourceLang || "en");
    });

    const ttsResultBtn = container.querySelector("#it-tts-result");
    ttsResultBtn.addEventListener("click", () => {
      speakText(container.dataset.translatedText || "", currentTargetLang);
    });

    const copyBtn = container.querySelector("#it-copy-btn");
    copyBtn.addEventListener("click", async () => {
      const translated = container.dataset.translatedText;
      if (!translated) return;
      try {
        await navigator.clipboard.writeText(translated);
        copyBtn.classList.add("copied");
        copyBtn.innerHTML = `${ICONS.check} <span>Đã chép!</span>`;
        setTimeout(() => {
          copyBtn.classList.remove("copied");
          copyBtn.innerHTML = `${ICONS.copy} <span>Sao chép</span>`;
        }, 1600);
      } catch (err) {
        console.warn("Clipboard write failed:", err);
      }
    });

    return currentTargetLang;
  }

  // Execute translation via Background Service Worker
  function executeTranslation(text, rect, targetLangOverride) {
    const targetLang = targetLangOverride || settings.targetLang || "vi";
    renderPopover(text, rect, targetLang);

    const requestId = ++activeTranslateRequest;

    chrome.runtime.sendMessage(
      {
        action: "TRANSLATE",
        text: text,
        sourceLang: "auto",
        targetLang: targetLang
      },
      (response) => {
        if (requestId !== activeTranslateRequest) return; // Stale request

        const resultContainer = container.querySelector("#it-result-container");
        const langIndicator = container.querySelector("#it-lang-indicator");
        const ttsResultBtn = container.querySelector("#it-tts-result");

        if (!resultContainer) return;

        if (response && response.success && response.data) {
          const data = response.data;
          container.dataset.translatedText = data.translatedText;
          container.dataset.sourceLang = data.sourceLang;

          const srcLabel = LANG_NAMES[data.sourceLang] || data.sourceLang.toUpperCase();
          const trgLabel = LANG_NAMES[data.targetLang] || data.targetLang.toUpperCase();
          if (langIndicator) {
            langIndicator.textContent = `${srcLabel} → ${trgLabel}`;
          }

          let html = `<div class="it-result-text">${escapeHtml(data.translatedText)}</div>`;

          if (data.transliteration) {
            html += `<div class="it-phonetic">${escapeHtml(data.transliteration)}</div>`;
          }

          // Show Dictionary breakdown if available
          if (settings.showDict && data.dict && data.dict.length > 0) {
            html += `<div class="it-dict-list">`;
            for (const item of data.dict) {
              html += `
                <div class="it-dict-item">
                  <span class="it-pos-badge">${escapeHtml(item.pos)}</span>
                  <span class="it-dict-terms">${escapeHtml(item.terms.join(", "))}</span>
                </div>
              `;
            }
            html += `</div>`;
          }

          resultContainer.innerHTML = html;
          if (ttsResultBtn) ttsResultBtn.style.display = "flex";

          // Auto-TTS if enabled
          if (settings.autoTts) {
            speakText(data.translatedText, data.targetLang);
          }

          // Re-position slightly in case height changed
          const popoverElem = container.querySelector(".it-popover");
          if (popoverElem) positionElement(popoverElem, rect);
        } else {
          const errMsg = response?.error || "Lỗi kết nối dịch thuật";
          resultContainer.innerHTML = `
            <div class="it-error-banner">
              ⚠️ ${escapeHtml(errMsg)}
            </div>
          `;
          if (langIndicator) langIndicator.textContent = "Lỗi";
        }
      }
    );
  }

  // Handle Selection Change & Mouseup
  function handleSelection(event) {
    if (!settings.enabled) return;

    // Check excluded domains
    const currentHost = window.location.hostname;
    if (settings.excludedDomains && settings.excludedDomains.includes(currentHost)) {
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      if (!isPinned && container.style.display === "block") {
        hideUI();
      }
      return;
    }

    const selectedText = selection.toString().trim();
    if (!selectedText || selectedText.length < 1 || selectedText.length > 4000) {
      if (!isPinned) hideUI();
      return;
    }

    // Ignore if selection is inside an editable input / password if desired, or allow everywhere
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === "INPUT" && activeEl.type === "password")) {
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    lastSelectedText = selectedText;
    lastSelectionCoords = rect;

    // Check Trigger Mode
    const mode = settings.triggerMode || "auto";

    if (mode === "ctrl" && !event.ctrlKey && !event.metaKey) {
      return;
    }
    if (mode === "alt" && !event.altKey) {
      return;
    }

    if (mode === "icon") {
      showTriggerIcon(selectedText, rect);
    } else {
      executeTranslation(selectedText, rect);
    }
  }

  // Debounced listener on mouseup
  document.addEventListener("mouseup", (e) => {
    // If click was inside our host / shadow, ignore
    if (e.target === host || host.contains(e.target)) return;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      handleSelection(e);
    }, 180);
  });

  // Handle clicking outside to dismiss (when not pinned)
  document.addEventListener("mousedown", (e) => {
    if (isPinned) return;
    if (e.target === host || host.contains(e.target)) return;
    hideUI();
  });

  // Keyboard shortcut: Escape to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      isPinned = false;
      hideUI();
    }
  });

  // Listen for context menu triggers from background.js
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "TRIGGER_SELECTION_TRANSLATE" && msg.text) {
      const selection = window.getSelection();
      let rect = {
        left: window.innerWidth / 2 - 175,
        right: window.innerWidth / 2 + 175,
        top: 150,
        bottom: 200,
        width: 350,
        height: 50
      };

      if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
        rect = selection.getRangeAt(0).getBoundingClientRect();
      }

      executeTranslation(msg.text, rect);
      sendResponse({ received: true });
    }
  });

  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
