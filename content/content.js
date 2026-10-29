/**
 * InstantTranslate - Content Script (V2 - Ultra Premium Edition)
 * Isolated via Closed Shadow DOM to ensure 100% immune from host page CSS.
 */

(function () {
  if (window.__instantTranslateLoaded) return;
  window.__instantTranslateLoaded = true;

  // Language mapping with flags & names
  const LANG_DATA = {
    vi: { name: "Tiếng Việt", flag: "🇻🇳", tts: "vi-VN" },
    en: { name: "Tiếng Anh", flag: "🇺🇸", tts: "en-US" },
    "zh-CN": { name: "Tiếng Trung (Giản)", flag: "🇨🇳", tts: "zh-CN" },
    "zh-TW": { name: "Tiếng Trung (Phồn)", flag: "🇹🇼", tts: "zh-TW" },
    ja: { name: "Tiếng Nhật", flag: "🇯🇵", tts: "ja-JP" },
    ko: { name: "Tiếng Hàn", flag: "🇰🇷", tts: "ko-KR" },
    fr: { name: "Tiếng Pháp", flag: "🇫🇷", tts: "fr-FR" },
    de: { name: "Tiếng Đức", flag: "🇩🇪", tts: "de-DE" },
    es: { name: "Tiếng T.B.Nha", flag: "🇪🇸", tts: "es-ES" },
    ru: { name: "Tiếng Nga", flag: "🇷🇺", tts: "ru-RU" },
    th: { name: "Tiếng Thái", flag: "🇹🇭", tts: "th-TH" },
    it: { name: "Tiếng Ý", flag: "🇮🇹", tts: "it-IT" },
    auto: { name: "Tự động nhận diện", flag: "🌐", tts: "en-US" }
  };

  // State
  let settings = {
    enabled: true,
    targetLang: "vi",
    sourceLang: "auto",
    triggerMode: "auto", // "auto" | "icon" | "ctrl" | "alt"
    showDict: true,
    autoTts: false,
    theme: "auto", // "auto" | "light" | "dark"
    enableReplace: true,
    doubleClickToTranslate: false,
    excludedDomains: []
  };

  let isPinned = false;
  let activeRange = null;
  let activeInputElement = null;
  let activeSelectionText = "";
  let currentDetectedSourceLang = "en";
  let activeTranslateRequest = 0;
  let isSpeaking = false;

  // Load and listen for settings
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

  // Create isolated container host
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

  // Attach Closed Shadow DOM
  const shadow = host.attachShadow({ mode: "closed" });

  // Inject Styles into Shadow DOM
  const styleEl = document.createElement("style");
  styleEl.textContent = `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", "Helvetica Neue", Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
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
      width: 32px;
      height: 32px;
      border-radius: 10px;
      background: linear-gradient(135deg, #6366f1 0%, #3b82f6 50%, #06b6d4 100%);
      box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4), 0 2px 4px rgba(0,0,0,0.1);
      border: 1.5px solid rgba(255, 255, 255, 0.9);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
      animation: itFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .it-trigger-btn:hover {
      transform: scale(1.16) translateY(-2px);
      box-shadow: 0 8px 22px rgba(99, 102, 241, 0.55);
    }

    .it-trigger-btn svg {
      width: 17px;
      height: 17px;
      fill: #ffffff;
    }

    /* Popover Card - Modern Glassmorphism */
    .it-popover {
      position: absolute;
      width: 380px;
      min-width: 300px;
      max-width: 92vw;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.96);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      color: #0f172a;
      box-shadow: 
        0 20px 48px -8px rgba(0, 0, 0, 0.18),
        0 8px 20px -4px rgba(0, 0, 0, 0.08),
        0 0 0 1px rgba(226, 232, 240, 0.85);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: itPopIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
      transition: box-shadow 0.2s ease;
    }

    @media (prefers-color-scheme: dark) {
      .it-popover {
        background: rgba(18, 22, 34, 0.96);
        color: #f8fafc;
        box-shadow: 
          0 24px 56px -8px rgba(0, 0, 0, 0.65),
          0 8px 24px -4px rgba(0, 0, 0, 0.4),
          0 0 0 1px rgba(255, 255, 255, 0.1);
      }
    }

    /* Popover Header */
    .it-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      background: linear-gradient(180deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.8) 100%);
      border-bottom: 1px solid rgba(226, 232, 240, 0.8);
      gap: 8px;
    }

    @media (prefers-color-scheme: dark) {
      .it-header {
        background: linear-gradient(180deg, rgba(28, 33, 48, 0.95) 0%, rgba(22, 26, 40, 0.9) 100%);
        border-color: rgba(255, 255, 255, 0.08);
      }
    }

    .it-brand {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 13px;
      font-weight: 700;
      color: #4338ca;
      letter-spacing: -0.2px;
    }

    @media (prefers-color-scheme: dark) {
      .it-brand {
        color: #a5b4fc;
      }
    }

    .it-brand-logo {
      width: 22px;
      height: 22px;
      border-radius: 6px;
      background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(99, 102, 241, 0.35);
    }

    .it-brand-logo svg {
      width: 13px;
      height: 13px;
      fill: #ffffff;
    }

    /* Language Swap Indicator Pill */
    .it-lang-swap-pill {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 3px 8px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.85);
      border: 1px solid rgba(203, 213, 225, 0.8);
      font-size: 11px;
      font-weight: 600;
      color: #334155;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }

    @media (prefers-color-scheme: dark) {
      .it-lang-swap-pill {
        background: rgba(30, 37, 54, 0.85);
        border-color: rgba(255, 255, 255, 0.12);
        color: #cbd5e1;
      }
    }

    .it-swap-btn {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: none;
      background: transparent;
      color: #6366f1;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .it-swap-btn:hover {
      background: rgba(99, 102, 241, 0.15);
      transform: rotate(180deg);
    }

    .it-swap-btn svg {
      width: 11px;
      height: 11px;
      fill: currentColor;
    }

    .it-header-actions {
      display: flex;
      align-items: center;
      gap: 3px;
    }

    .it-btn-icon {
      width: 26px;
      height: 26px;
      border-radius: 7px;
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
      color: #0f172a;
    }

    @media (prefers-color-scheme: dark) {
      .it-btn-icon {
        color: #94a3b8;
      }
      .it-btn-icon:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
      }
    }

    .it-btn-icon.active {
      color: #4f46e5;
      background: #e0e7ff;
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.25);
    }

    @media (prefers-color-scheme: dark) {
      .it-btn-icon.active {
        color: #818cf8;
        background: rgba(99, 102, 241, 0.25);
      }
    }

    .it-btn-icon svg {
      width: 14px;
      height: 14px;
      fill: currentColor;
    }

    /* Popover Body */
    .it-body {
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 420px;
      overflow-y: auto;
    }

    .it-body::-webkit-scrollbar {
      width: 5px;
    }
    .it-body::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }

    /* Source Text Section (Compact & Clean) */
    .it-source-card {
      background: rgba(248, 250, 252, 0.7);
      border: 1px solid rgba(226, 232, 240, 0.8);
      border-radius: 10px;
      padding: 7px 10px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    @media (prefers-color-scheme: dark) {
      .it-source-card {
        background: rgba(25, 30, 44, 0.6);
        border-color: rgba(255, 255, 255, 0.06);
      }
    }

    .it-source-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 10.5px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #94a3b8;
    }

    .it-source-text {
      font-size: 12.5px;
      line-height: 1.45;
      color: #475569;
      word-break: break-word;
      max-height: 65px;
      overflow-y: auto;
      user-select: text;
    }

    @media (prefers-color-scheme: dark) {
      .it-source-text {
        color: #94a3b8;
      }
    }

    /* HERO TRANSLATION CARD (Trọng tâm hiển thị đẹp) */
    .it-hero-card {
      background: linear-gradient(145deg, #f0f7ff 0%, #f5f3ff 100%);
      border: 1.5px solid #dbeafe;
      border-radius: 12px;
      padding: 12px 14px;
      box-shadow: 0 3px 10px rgba(59, 130, 246, 0.05);
      display: flex;
      flex-direction: column;
      gap: 6px;
      position: relative;
    }

    @media (prefers-color-scheme: dark) {
      .it-hero-card {
        background: linear-gradient(145deg, rgba(30, 41, 69, 0.7) 0%, rgba(27, 32, 54, 0.9) 100%);
        border-color: rgba(99, 102, 241, 0.35);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      }
    }

    .it-hero-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .it-hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      font-weight: 700;
      color: #2563eb;
      letter-spacing: 0.2px;
    }

    @media (prefers-color-scheme: dark) {
      .it-hero-badge {
        color: #60a5fa;
      }
    }

    .it-result-text {
      font-size: 15.5px;
      font-weight: 600;
      line-height: 1.6;
      color: #0f172a;
      word-break: break-word;
      user-select: text;
      letter-spacing: -0.1px;
    }

    @media (prefers-color-scheme: dark) {
      .it-result-text {
        color: #ffffff;
      }
    }

    /* Phonetic IPA Tag */
    .it-phonetic-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      color: #0284c7;
      background: rgba(2, 132, 199, 0.1);
      padding: 2px 7px;
      border-radius: 6px;
      width: fit-content;
      margin-top: 2px;
    }

    @media (prefers-color-scheme: dark) {
      .it-phonetic-badge {
        color: #38bdf8;
        background: rgba(56, 189, 248, 0.15);
      }
    }

    /* Skeleton Loading Bar */
    .it-skeleton {
      height: 18px;
      border-radius: 6px;
      background: linear-gradient(90deg, #e2e8f0 25%, #cbd5e1 50%, #e2e8f0 75%);
      background-size: 200% 100%;
      animation: itShimmer 1.4s infinite;
      margin: 4px 0;
    }

    @media (prefers-color-scheme: dark) {
      .it-skeleton {
        background: linear-gradient(90deg, #1e2436 25%, #2c354e 50%, #1e2436 75%);
        background-size: 200% 100%;
      }
    }

    /* Dictionary Breakdown Section */
    .it-dict-container {
      display: flex;
      flex-direction: column;
      gap: 7px;
      margin-top: 2px;
      padding-top: 8px;
      border-top: 1px dashed rgba(203, 213, 225, 0.8);
    }

    @media (prefers-color-scheme: dark) {
      .it-dict-container {
        border-color: rgba(255, 255, 255, 0.1);
      }
    }

    .it-dict-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .it-pos-label {
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 1px 6px;
      border-radius: 4px;
      width: fit-content;
      letter-spacing: 0.3px;
    }

    .it-pos-noun { background: #dcfce7; color: #15803d; }
    .it-pos-verb { background: #ede9fe; color: #6d28d9; }
    .it-pos-adj { background: #fef3c7; color: #b45309; }
    .it-pos-other { background: #f1f5f9; color: #475569; }

    @media (prefers-color-scheme: dark) {
      .it-pos-noun { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
      .it-pos-verb { background: rgba(168, 85, 247, 0.2); color: #c084fc; }
      .it-pos-adj { background: rgba(245, 158, 11, 0.2); color: #fcd34d; }
      .it-pos-other { background: rgba(255, 255, 255, 0.1); color: #cbd5e1; }
    }

    .it-synonyms-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .it-syn-pill {
      font-size: 11.5px;
      padding: 2px 7px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.7);
      border: 1px solid rgba(203, 213, 225, 0.8);
      color: #334155;
      cursor: pointer;
      transition: all 0.12s ease;
    }

    .it-syn-pill:hover {
      background: #4f46e5;
      color: #ffffff;
      border-color: #4f46e5;
      transform: translateY(-1px);
    }

    @media (prefers-color-scheme: dark) {
      .it-syn-pill {
        background: rgba(30, 36, 52, 0.8);
        border-color: rgba(255, 255, 255, 0.1);
        color: #cbd5e1;
      }
      .it-syn-pill:hover {
        background: #6366f1;
        color: #ffffff;
      }
    }

    /* Footer Toolbar */
    .it-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 9px 14px;
      background: rgba(248, 250, 252, 0.95);
      border-top: 1px solid rgba(226, 232, 240, 0.85);
      gap: 8px;
    }

    @media (prefers-color-scheme: dark) {
      .it-footer {
        background: rgba(20, 24, 36, 0.95);
        border-color: rgba(255, 255, 255, 0.08);
      }
    }

    .it-footer-left {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .it-target-select {
      font-size: 11.5px;
      font-weight: 600;
      padding: 4px 7px;
      border-radius: 7px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #1e293b;
      cursor: pointer;
      outline: none;
      transition: border-color 0.15s ease;
    }

    .it-target-select:focus {
      border-color: #6366f1;
    }

    @media (prefers-color-scheme: dark) {
      .it-target-select {
        background: #1c2234;
        border-color: #334155;
        color: #f1f5f9;
      }
    }

    .it-footer-actions {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .it-action-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11.5px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 7px;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      color: #334155;
      cursor: pointer;
      transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    }

    .it-action-btn:hover {
      background: #f1f5f9;
      color: #0f172a;
      border-color: #cbd5e1;
      transform: translateY(-1px);
    }

    .it-action-btn:active {
      transform: translateY(0);
    }

    @media (prefers-color-scheme: dark) {
      .it-action-btn {
        background: #1c2234;
        border-color: rgba(255, 255, 255, 0.1);
        color: #cbd5e1;
      }
      .it-action-btn:hover {
        background: #283048;
        color: #ffffff;
      }
    }

    .it-action-btn.primary {
      background: linear-gradient(135deg, #4f46e5, #0ea5e9);
      color: #ffffff;
      border: none;
    }

    .it-action-btn.primary:hover {
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35);
      color: #ffffff;
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

    /* Soundwave animation for speaking */
    .it-speaking-wave {
      display: inline-flex;
      align-items: flex-end;
      gap: 2px;
      height: 12px;
      margin-left: 2px;
    }
    .it-wave-bar {
      width: 2px;
      background: currentColor;
      border-radius: 1px;
      animation: itSoundWave 0.8s ease-in-out infinite alternate;
    }
    .it-wave-bar:nth-child(1) { height: 4px; animation-delay: 0.1s; }
    .it-wave-bar:nth-child(2) { height: 11px; animation-delay: 0.3s; }
    .it-wave-bar:nth-child(3) { height: 7px; animation-delay: 0.2s; }

    /* Error Toast */
    .it-error-card {
      padding: 10px 12px;
      border-radius: 8px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    @media (prefers-color-scheme: dark) {
      .it-error-card {
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
      from { opacity: 0; transform: translateY(8px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes itShimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    @keyframes itSoundWave {
      0% { height: 3px; }
      100% { height: 12px; }
    }
  `;
  shadow.appendChild(styleEl);

  // Root container in shadow
  const container = document.createElement("div");
  container.className = "it-wrapper";
  shadow.appendChild(container);

  // SVG Icons
  const ICONS = {
    translate: `<svg viewBox="0 0 24 24"><path d="M12.87 15.07l-2.54-2.51.03-.08c1.74-1.94 2.98-4.17 3.71-6.49H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>`,
    speaker: `<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`,
    copy: `<svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`,
    check: `<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`,
    pin: `<svg viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>`,
    close: `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
    replace: `<svg viewBox="0 0 24 24"><path d="M19 8l-4 4h3c0 3.31-2.69 6-6 6-1.01 0-1.97-.25-2.8-.7l-1.46 1.46C8.97 19.54 10.43 20 12 20c4.42 0 8-3.58 8-8h3l-4-4zM6 12c0-3.31 2.69-6 6-6 1.01 0 1.97.25 2.8.7l1.46-1.46C15.03 4.46 13.57 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4H6z"/></svg>`,
    external: `<svg viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>`,
    swap: `<svg viewBox="0 0 24 24"><path d="M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z"/></svg>`
  };

  // Text-To-Speech with animation
  function speakText(text, langCode, triggerBtn) {
    if (!text || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const langConfig = LANG_DATA[langCode];
    utterance.lang = langConfig?.tts || langCode || "vi-VN";
    utterance.rate = 0.95;

    if (triggerBtn) {
      triggerBtn.innerHTML = `
        <span class="it-speaking-wave">
          <span class="it-wave-bar"></span>
          <span class="it-wave-bar"></span>
          <span class="it-wave-bar"></span>
        </span>
      `;
    }

    utterance.onend = () => {
      if (triggerBtn) triggerBtn.innerHTML = ICONS.speaker;
    };
    utterance.onerror = () => {
      if (triggerBtn) triggerBtn.innerHTML = ICONS.speaker;
    };

    window.speechSynthesis.speak(utterance);
  }

  // Hide UI
  function hideUI() {
    container.innerHTML = "";
    container.style.display = "none";
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  // Smart Collision Detection Positioning
  function positionElement(elem, rect) {
    container.style.display = "block";
    container.style.visibility = "hidden";

    requestAnimationFrame(() => {
      const popoverWidth = elem.offsetWidth || 380;
      const popoverHeight = elem.offsetHeight || 260;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      const MARGIN = 12;

      // Horizontal
      let left = rect.left + scrollX;
      if (left + popoverWidth > scrollX + viewportWidth - MARGIN) {
        left = scrollX + viewportWidth - popoverWidth - MARGIN;
      }
      if (left < scrollX + MARGIN) {
        left = scrollX + MARGIN;
      }

      // Vertical (prefer below)
      let top = rect.bottom + 8 + scrollY;
      const spaceBelow = viewportHeight - rect.bottom;

      if (spaceBelow < popoverHeight + 16 && rect.top > popoverHeight + 16) {
        top = rect.top - popoverHeight - 8 + scrollY;
      }

      container.style.left = `${Math.round(left)}px`;
      container.style.top = `${Math.round(top)}px`;
      container.style.visibility = "visible";
    });
  }

  // Replace text in host page (Supports input, textarea, contenteditable, and standard DOM)
  function replaceSelectedText(newText) {
    if (!newText) return;

    // 1. If inside an input or textarea
    if (activeInputElement && typeof activeInputElement.selectionStart === "number") {
      const start = activeInputElement.selectionStart;
      const end = activeInputElement.selectionEnd;
      const val = activeInputElement.value;
      activeInputElement.value = val.slice(0, start) + newText + val.slice(end);
      activeInputElement.setSelectionRange(start + newText.length, start + newText.length);
      activeInputElement.dispatchEvent(new Event("input", { bubbles: true }));
      hideUI();
      return;
    }

    // 2. If in contentEditable or standard DOM range
    if (activeRange) {
      try {
        activeRange.deleteContents();
        const textNode = document.createTextNode(newText);
        activeRange.insertNode(textNode);
        
        // Re-select inserted text
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          const newRange = document.createRange();
          newRange.selectNodeContents(textNode);
          sel.addRange(newRange);
        }
        hideUI();
        return;
      } catch (err) {
        console.warn("DOM replacement error:", err);
      }
    }

    // 3. Fallback: Copy to clipboard if replacement isn't possible
    navigator.clipboard.writeText(newText);
  }

  // Render Floating Trigger Button
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

    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    let left = rect.right + 6 + scrollX;
    let top = rect.bottom + 4 + scrollY;

    if (left + 38 > scrollX + window.innerWidth) {
      left = rect.right - 36 + scrollX;
    }

    container.style.left = `${Math.round(left)}px`;
    container.style.top = `${Math.round(top)}px`;
    container.style.display = "block";
    container.style.visibility = "visible";
  }

  // Escape HTML helper
  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Render Modern Popover Card
  function renderPopover(text, rect, targetLangOverride) {
    const currentTargetLang = targetLangOverride || settings.targetLang || "vi";
    const srcData = LANG_DATA[currentDetectedSourceLang] || { flag: "🌐", name: currentDetectedSourceLang };
    const trgData = LANG_DATA[currentTargetLang] || { flag: "🌐", name: currentTargetLang };

    container.innerHTML = `
      <div class="it-popover">
        <!-- Header -->
        <div class="it-header">
          <div class="it-brand">
            <div class="it-brand-logo">${ICONS.translate}</div>
            <span>InstantTranslate</span>
          </div>

          <!-- Language Swap Pill -->
          <div class="it-lang-swap-pill">
            <span id="it-src-flag">${srcData.flag}</span>
            <span id="it-src-name">${srcData.name.split(" ")[0]}</span>
            <button class="it-swap-btn" id="it-swap-lang-btn" title="Đảo chiều ngôn ngữ">
              ${ICONS.swap}
            </button>
            <span id="it-trg-flag">${trgData.flag}</span>
            <span id="it-trg-name">${trgData.name.split(" ")[0]}</span>
          </div>

          <!-- Actions -->
          <div class="it-header-actions">
            <button class="it-btn-icon ${isPinned ? "active" : ""}" id="it-pin-btn" title="${isPinned ? "Bỏ ghim" : "Ghim cửa sổ"}">
              ${ICONS.pin}
            </button>
            <button class="it-btn-icon" id="it-close-btn" title="Đóng (Esc)">
              ${ICONS.close}
            </button>
          </div>
        </div>

        <!-- Body -->
        <div class="it-body">
          <!-- Source Card -->
          <div class="it-source-card">
            <div class="it-source-meta">
              <span>VĂN BẢN GỐC</span>
              <button class="it-btn-icon" id="it-tts-source" title="Phát âm bản gốc">
                ${ICONS.speaker}
              </button>
            </div>
            <div class="it-source-text">${escapeHtml(text)}</div>
          </div>

          <!-- HERO TRANSLATION CARD -->
          <div class="it-hero-card">
            <div class="it-hero-meta">
              <span class="it-hero-badge">
                ${trgData.flag} BẢN DỊCH TIẾNG ${trgData.name.toUpperCase()}
              </span>
              <button class="it-btn-icon" id="it-tts-result" title="Phát âm bản dịch" style="display:none;">
                ${ICONS.speaker}
              </button>
            </div>

            <div id="it-result-container">
              <div class="it-skeleton" style="width: 90%;"></div>
              <div class="it-skeleton" style="width: 65%;"></div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="it-footer">
          <div class="it-footer-left">
            <select class="it-target-select" id="it-lang-select">
              <option value="vi" ${currentTargetLang === "vi" ? "selected" : ""}>🇻🇳 Tiếng Việt</option>
              <option value="en" ${currentTargetLang === "en" ? "selected" : ""}>🇺🇸 Tiếng Anh</option>
              <option value="zh-CN" ${currentTargetLang === "zh-CN" ? "selected" : ""}>🇨🇳 Tiếng Trung (Giản)</option>
              <option value="zh-TW" ${currentTargetLang === "zh-TW" ? "selected" : ""}>🇹🇼 Tiếng Trung (Phồn)</option>
              <option value="ja" ${currentTargetLang === "ja" ? "selected" : ""}>🇯🇵 Tiếng Nhật</option>
              <option value="ko" ${currentTargetLang === "ko" ? "selected" : ""}>🇰🇷 Tiếng Hàn</option>
              <option value="fr" ${currentTargetLang === "fr" ? "selected" : ""}>🇫🇷 Tiếng Pháp</option>
              <option value="de" ${currentTargetLang === "de" ? "selected" : ""}>🇩🇪 Tiếng Đức</option>
              <option value="es" ${currentTargetLang === "es" ? "selected" : ""}>🇪🇸 Tiếng T.B.Nha</option>
              <option value="ru" ${currentTargetLang === "ru" ? "selected" : ""}>🇷🇺 Tiếng Nga</option>
              <option value="th" ${currentTargetLang === "th" ? "selected" : ""}>🇹🇭 Tiếng Thái</option>
              <option value="it" ${currentTargetLang === "it" ? "selected" : ""}>🇮🇹 Tiếng Ý</option>
            </select>
          </div>

          <div class="it-footer-actions">
            <!-- Replace Button (Cực hữu ích) -->
            <button class="it-action-btn" id="it-replace-btn" title="Thay thế chữ gốc bằng bản dịch (Ctrl+Enter)">
              ${ICONS.replace}
              <span>Thay thế</span>
            </button>

            <!-- Copy Button -->
            <button class="it-action-btn primary" id="it-copy-btn" title="Sao chép bản dịch (Ctrl+C)">
              ${ICONS.copy}
              <span>Chép</span>
            </button>

            <!-- Google Translate External Tab -->
            <button class="it-btn-icon" id="it-ext-btn" title="Mở trên Google Translate">
              ${ICONS.external}
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

    // Language Dropdown change
    const langSelect = container.querySelector("#it-lang-select");
    langSelect.addEventListener("change", (e) => {
      executeTranslation(text, rect, e.target.value);
    });

    // Swap Language Button (e.g., EN -> VI becomes VI -> EN)
    const swapBtn = container.querySelector("#it-swap-lang-btn");
    swapBtn.addEventListener("click", () => {
      const newTarget = currentDetectedSourceLang === "vi" ? "en" : currentDetectedSourceLang;
      executeTranslation(text, rect, newTarget);
    });

    // TTS Buttons
    const ttsSourceBtn = container.querySelector("#it-tts-source");
    ttsSourceBtn.addEventListener("click", () => {
      speakText(text, currentDetectedSourceLang, ttsSourceBtn);
    });

    const ttsResultBtn = container.querySelector("#it-tts-result");
    ttsResultBtn.addEventListener("click", () => {
      speakText(container.dataset.translatedText || "", currentTargetLang, ttsResultBtn);
    });

    // Copy Button
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
          copyBtn.innerHTML = `${ICONS.copy} <span>Chép</span>`;
        }, 1600);
      } catch (err) {
        console.warn("Clipboard failed:", err);
      }
    });

    // Replace Button
    const replaceBtn = container.querySelector("#it-replace-btn");
    replaceBtn.addEventListener("click", () => {
      const translated = container.dataset.translatedText;
      if (translated) {
        replaceSelectedText(translated);
      }
    });

    // External Button
    const extBtn = container.querySelector("#it-ext-btn");
    extBtn.addEventListener("click", () => {
      const url = `https://translate.google.com/?sl=auto&tl=${currentTargetLang}&text=${encodeURIComponent(text)}&op=translate`;
      window.open(url, "_blank");
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
        if (requestId !== activeTranslateRequest) return;

        const resultContainer = container.querySelector("#it-result-container");
        const ttsResultBtn = container.querySelector("#it-tts-result");
        const srcFlagEl = container.querySelector("#it-src-flag");
        const srcNameEl = container.querySelector("#it-src-name");
        const trgFlagEl = container.querySelector("#it-trg-flag");
        const trgNameEl = container.querySelector("#it-trg-name");

        if (!resultContainer) return;

        if (response && response.success && response.data) {
          const data = response.data;
          container.dataset.translatedText = data.translatedText;
          container.dataset.sourceLang = data.sourceLang;
          currentDetectedSourceLang = data.sourceLang || "en";

          // Update Lang Pill
          const sData = LANG_DATA[data.sourceLang] || { flag: "🌐", name: data.sourceLang };
          const tData = LANG_DATA[data.targetLang] || { flag: "🌐", name: data.targetLang };
          if (srcFlagEl) srcFlagEl.textContent = sData.flag;
          if (srcNameEl) srcNameEl.textContent = sData.name.split(" ")[0];
          if (trgFlagEl) trgFlagEl.textContent = tData.flag;
          if (trgNameEl) trgNameEl.textContent = tData.name.split(" ")[0];

          let html = `<div class="it-result-text">${escapeHtml(data.translatedText)}</div>`;

          if (data.transliteration) {
            html += `<div class="it-phonetic-badge">🔊 /${escapeHtml(data.transliteration)}/</div>`;
          }

          // Dictionary breakdown with stylish color badges
          if (settings.showDict && data.dict && data.dict.length > 0) {
            html += `<div class="it-dict-container">`;
            for (const item of data.dict) {
              const posLower = (item.pos || "").toLowerCase();
              let posClass = "it-pos-other";
              let posVi = item.pos;
              if (posLower.includes("noun")) { posClass = "it-pos-noun"; posVi = "Danh từ"; }
              else if (posLower.includes("verb")) { posClass = "it-pos-verb"; posVi = "Động từ"; }
              else if (posLower.includes("adj")) { posClass = "it-pos-adj"; posVi = "Tính từ"; }

              html += `
                <div class="it-dict-row">
                  <span class="it-pos-label ${posClass}">${escapeHtml(posVi)}</span>
                  <div class="it-synonyms-wrap">
                    ${item.terms.map(t => `<span class="it-syn-pill" title="Click để copy">${escapeHtml(t)}</span>`).join("")}
                  </div>
                </div>
              `;
            }
            html += `</div>`;
          }

          resultContainer.innerHTML = html;
          if (ttsResultBtn) ttsResultBtn.style.display = "flex";

          // Click on synonym pill copies it
          resultContainer.querySelectorAll(".it-syn-pill").forEach(pill => {
            pill.addEventListener("click", () => {
              navigator.clipboard.writeText(pill.textContent);
              const old = pill.textContent;
              pill.textContent = "✓ Đã chép";
              setTimeout(() => { pill.textContent = old; }, 1200);
            });
          });

          // Auto-TTS if enabled
          if (settings.autoTts) {
            speakText(data.translatedText, data.targetLang, ttsResultBtn);
          }

          // Re-calculate bounds
          const popoverElem = container.querySelector(".it-popover");
          if (popoverElem) positionElement(popoverElem, rect);
        } else {
          const errMsg = response?.error || "Không thể kết nối đến máy chủ dịch";
          resultContainer.innerHTML = `
            <div class="it-error-card">
              ⚠️ ${escapeHtml(errMsg)}
            </div>
          `;
        }
      }
    );
  }

  // Handle Selection Change
  function handleSelection(event) {
    if (!settings.enabled) return;

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
    if (!selectedText || selectedText.length < 1 || selectedText.length > 5000) {
      if (!isPinned) hideUI();
      return;
    }

    // Save active element & active range for replacement
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
      if (activeEl.type === "password") return;
      activeInputElement = activeEl;
    } else {
      activeInputElement = null;
    }

    activeRange = selection.getRangeAt(0).cloneRange();
    const rect = activeRange.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    activeSelectionText = selectedText;

    const mode = settings.triggerMode || "auto";

    if (mode === "ctrl" && !event.ctrlKey && !event.metaKey) return;
    if (mode === "alt" && !event.altKey) return;

    if (mode === "icon") {
      showTriggerIcon(selectedText, rect);
    } else {
      executeTranslation(selectedText, rect);
    }
  }

  // Global mouseup listener
  document.addEventListener("mouseup", (e) => {
    // If click was inside shadow root, don't trigger or close
    if (e.composedPath().includes(host)) return;

    setTimeout(() => {
      handleSelection(e);
    }, 20);
  });

  // Double Click listener (optional quick translate for single words)
  document.addEventListener("dblclick", (e) => {
    if (!settings.enabled || !settings.doubleClickToTranslate) return;
    if (e.composedPath().includes(host)) return;

    setTimeout(() => {
      handleSelection(e);
    }, 30);
  });

  // Click outside to close (if not pinned)
  document.addEventListener("mousedown", (e) => {
    if (e.composedPath().includes(host)) return;
    if (!isPinned && container.style.display === "block") {
      hideUI();
    }
  });

  // Global Keyboard Shortcuts
  document.addEventListener("keydown", (e) => {
    if (container.style.display !== "block") return;

    // Esc closes popover
    if (e.key === "Escape") {
      isPinned = false;
      hideUI();
      return;
    }

    // Ctrl+Enter replaces text
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      const translated = container.dataset.translatedText;
      if (translated) {
        e.preventDefault();
        replaceSelectedText(translated);
      }
    }
  });

  // Listen for context menu trigger from background
  chrome.runtime?.onMessage?.addListener((msg) => {
    if (msg.action === "TRIGGER_SELECTION_TRANSLATE" && msg.text) {
      const sel = window.getSelection();
      let rect = { left: window.innerWidth / 2 - 190, top: 120, right: window.innerWidth / 2 + 190, bottom: 140 };
      if (sel && sel.rangeCount > 0) {
        rect = sel.getRangeAt(0).getBoundingClientRect();
      }
      executeTranslation(msg.text, rect);
    }
  });
})();
