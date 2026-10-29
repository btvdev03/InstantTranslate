/**
 * InstantTranslate - Content Script (V3 - Boutique Masterpiece Edition)
 * Inspired by Raycast, Arc Browser & macOS design languages.
 * Isolated via Closed Shadow DOM for zero-conflict rendering.
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
    auto: { name: "Tự động phát hiện", flag: "🌐", tts: "en-US" }
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

  // Inject High-End Styles
  const styleEl = document.createElement("style");
  styleEl.textContent = `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, "Inter", sans-serif;
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

    /* Floating Trigger Button (Gleaming Gemstone style) */
    .it-trigger-btn {
      width: 34px;
      height: 34px;
      border-radius: 11px;
      background: linear-gradient(135deg, #6366f1 0%, #3b82f6 50%, #06b6d4 100%);
      box-shadow: 0 4px 18px rgba(99, 102, 241, 0.45), 0 2px 6px rgba(0, 0, 0, 0.15);
      border: 1.5px solid rgba(255, 255, 255, 0.95);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.22s ease;
      animation: itScaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .it-trigger-btn:hover {
      transform: scale(1.18) translateY(-2px);
      box-shadow: 0 8px 26px rgba(99, 102, 241, 0.6);
    }

    .it-trigger-btn svg {
      width: 17px;
      height: 17px;
      fill: #ffffff;
      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
    }

    /* Master Popover Card - Boutique Frosted Glass */
    .it-popover {
      position: absolute;
      width: 400px;
      min-width: 320px;
      max-width: 94vw;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(28px) saturate(190%);
      -webkit-backdrop-filter: blur(28px) saturate(190%);
      color: #0f172a;
      box-shadow: 
        0 28px 64px -12px rgba(15, 23, 42, 0.22),
        0 10px 24px -4px rgba(15, 23, 42, 0.08),
        0 0 0 1px rgba(226, 232, 240, 0.85);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: itSpringIn 0.26s cubic-bezier(0.175, 0.885, 0.32, 1.15);
      transition: box-shadow 0.2s ease, transform 0.2s ease;
    }

    @media (prefers-color-scheme: dark) {
      .it-popover {
        background: rgba(15, 18, 30, 0.92);
        color: #f8fafc;
        box-shadow: 
          0 32px 72px -12px rgba(0, 0, 0, 0.75),
          0 12px 30px -4px rgba(0, 0, 0, 0.45),
          0 0 0 1px rgba(255, 255, 255, 0.12),
          inset 0 1px 0 rgba(255, 255, 255, 0.08);
      }
    }

    /* Popover Header */
    .it-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.5) 100%);
      border-bottom: 1px solid rgba(226, 232, 240, 0.7);
      gap: 10px;
    }

    @media (prefers-color-scheme: dark) {
      .it-header {
        background: linear-gradient(180deg, rgba(26, 31, 48, 0.8) 0%, rgba(18, 22, 36, 0.6) 100%);
        border-color: rgba(255, 255, 255, 0.07);
      }
    }

    .it-brand {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .it-brand-logo {
      width: 24px;
      height: 24px;
      border-radius: 7px;
      background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
    }

    .it-brand-logo svg {
      width: 14px;
      height: 14px;
      fill: #ffffff;
    }

    .it-brand-title {
      font-size: 13.5px;
      font-weight: 700;
      color: #312e81;
      letter-spacing: -0.3px;
    }

    @media (prefers-color-scheme: dark) {
      .it-brand-title {
        color: #c7d2fe;
      }
    }

    /* Language Switcher Capsule */
    .it-lang-capsule {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 30px;
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid rgba(203, 213, 225, 0.7);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
      font-size: 11.5px;
      font-weight: 600;
      color: #334155;
    }

    @media (prefers-color-scheme: dark) {
      .it-lang-capsule {
        background: rgba(26, 32, 50, 0.85);
        border-color: rgba(255, 255, 255, 0.12);
        color: #cbd5e1;
      }
    }

    .it-swap-btn {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: none;
      background: rgba(99, 102, 241, 0.1);
      color: #4f46e5;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.22s ease;
    }

    .it-swap-btn:hover {
      background: #4f46e5;
      color: #ffffff;
      transform: rotate(180deg) scale(1.1);
    }

    @media (prefers-color-scheme: dark) {
      .it-swap-btn {
        background: rgba(99, 102, 241, 0.25);
        color: #a5b4fc;
      }
      .it-swap-btn:hover {
        background: #6366f1;
        color: #ffffff;
      }
    }

    .it-swap-btn svg {
      width: 11px;
      height: 11px;
      fill: currentColor;
    }

    /* Header Tools */
    .it-header-tools {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .it-btn-round {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      border: none;
      background: transparent;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.16s ease;
    }

    .it-btn-round:hover {
      background: rgba(0, 0, 0, 0.06);
      color: #0f172a;
    }

    @media (prefers-color-scheme: dark) {
      .it-btn-round {
        color: #94a3b8;
      }
      .it-btn-round:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
      }
    }

    .it-btn-round.active {
      color: #4f46e5;
      background: #e0e7ff;
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.3);
    }

    @media (prefers-color-scheme: dark) {
      .it-btn-round.active {
        color: #818cf8;
        background: rgba(99, 102, 241, 0.3);
      }
    }

    .it-btn-round svg {
      width: 14px;
      height: 14px;
      fill: currentColor;
    }

    /* Body Container */
    .it-body {
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 440px;
      overflow-y: auto;
    }

    .it-body::-webkit-scrollbar {
      width: 5px;
    }
    .it-body::-webkit-scrollbar-thumb {
      background: rgba(148, 163, 184, 0.5);
      border-radius: 4px;
    }

    /* Source Quote Card */
    .it-source-quote {
      position: relative;
      background: rgba(248, 250, 252, 0.7);
      border-left: 3.5px solid #6366f1;
      border-radius: 0 10px 10px 0;
      padding: 8px 12px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    @media (prefers-color-scheme: dark) {
      .it-source-quote {
        background: rgba(23, 28, 44, 0.6);
        border-left-color: #818cf8;
      }
    }

    .it-source-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.6px;
      color: #64748b;
      text-transform: uppercase;
    }

    .it-source-text {
      font-size: 13px;
      line-height: 1.5;
      color: #334155;
      font-style: normal;
      word-break: break-word;
      max-height: 60px;
      overflow-y: auto;
      user-select: text;
    }

    @media (prefers-color-scheme: dark) {
      .it-source-text {
        color: #94a3b8;
      }
    }

    /* ========================================================
       MASTER HERO TRANSLATION CARD (NÂNG CẤP ĐỈNH CAO THẨM MỸ)
       ======================================================== */
    .it-hero-card {
      position: relative;
      background: linear-gradient(145deg, rgba(238, 242, 255, 0.85) 0%, rgba(240, 249, 255, 0.95) 100%);
      border: 1.5px solid rgba(199, 210, 254, 0.7);
      border-radius: 14px;
      padding: 14px 16px;
      box-shadow: 
        0 4px 16px rgba(79, 70, 229, 0.08),
        0 1px 3px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    @media (prefers-color-scheme: dark) {
      .it-hero-card {
        background: linear-gradient(145deg, rgba(25, 32, 54, 0.85) 0%, rgba(20, 24, 42, 0.95) 100%);
        border-color: rgba(99, 102, 241, 0.38);
        box-shadow: 
          0 6px 20px rgba(0, 0, 0, 0.35),
          inset 0 1px 0 rgba(255, 255, 255, 0.06);
      }
    }

    .it-hero-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .it-hero-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.4px;
      color: #4338ca;
      text-transform: uppercase;
    }

    @media (prefers-color-scheme: dark) {
      .it-hero-pill {
        color: #93c5fd;
      }
    }

    .it-hero-pill-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
      animation: itPulse 2s infinite;
    }

    /* Translated Text Typography */
    .it-hero-text {
      font-size: 16.5px;
      font-weight: 600;
      line-height: 1.62;
      color: #0f172a;
      letter-spacing: -0.2px;
      word-break: break-word;
      user-select: text;
    }

    @media (prefers-color-scheme: dark) {
      .it-hero-text {
        color: #ffffff;
      }
    }

    /* Phonetic Audio Badge */
    .it-phonetic-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      color: #0284c7;
      background: rgba(2, 132, 199, 0.1);
      border: 1px solid rgba(2, 132, 199, 0.2);
      padding: 3px 9px;
      border-radius: 7px;
      width: fit-content;
      margin-top: 2px;
    }

    @media (prefers-color-scheme: dark) {
      .it-phonetic-badge {
        color: #38bdf8;
        background: rgba(56, 189, 248, 0.15);
        border-color: rgba(56, 189, 248, 0.25);
      }
    }

    /* Loading Shimmer Bar */
    .it-skeleton-bar {
      height: 20px;
      border-radius: 6px;
      background: linear-gradient(90deg, #e0e7ff 25%, #c7d2fe 50%, #e0e7ff 75%);
      background-size: 200% 100%;
      animation: itShimmer 1.4s infinite;
      margin: 4px 0;
    }

    @media (prefers-color-scheme: dark) {
      .it-skeleton-bar {
        background: linear-gradient(90deg, #1e253c 25%, #2a3454 50%, #1e253c 75%);
        background-size: 200% 100%;
      }
    }

    /* Dictionary & Synonyms Section */
    .it-dict-box {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 4px;
      padding-top: 10px;
      border-top: 1px dashed rgba(203, 213, 225, 0.8);
    }

    @media (prefers-color-scheme: dark) {
      .it-dict-box {
        border-color: rgba(255, 255, 255, 0.1);
      }
    }

    .it-dict-row {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .it-pos-tag {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 2px 7px;
      border-radius: 5px;
      width: fit-content;
    }

    .it-pos-noun { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .it-pos-verb { background: #ede9fe; color: #5b21b6; border: 1px solid #ddd6fe; }
    .it-pos-adj  { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .it-pos-other { background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0; }

    @media (prefers-color-scheme: dark) {
      .it-pos-noun { background: rgba(34, 197, 94, 0.18); color: #4ade80; border-color: rgba(34, 197, 94, 0.3); }
      .it-pos-verb { background: rgba(168, 85, 247, 0.18); color: #c084fc; border-color: rgba(168, 85, 247, 0.3); }
      .it-pos-adj  { background: rgba(245, 158, 11, 0.18); color: #fcd34d; border-color: rgba(245, 158, 11, 0.3); }
      .it-pos-other { background: rgba(255, 255, 255, 0.1); color: #cbd5e1; border-color: rgba(255, 255, 255, 0.15); }
    }

    .it-synonyms-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }

    .it-syn-bubble {
      font-size: 11.5px;
      font-weight: 500;
      padding: 3px 9px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.85);
      border: 1px solid rgba(203, 213, 225, 0.7);
      color: #334155;
      cursor: pointer;
      transition: all 0.16s ease;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    }

    .it-syn-bubble:hover {
      background: #4f46e5;
      color: #ffffff;
      border-color: #4f46e5;
      transform: translateY(-1.5px);
      box-shadow: 0 3px 8px rgba(79, 70, 229, 0.25);
    }

    @media (prefers-color-scheme: dark) {
      .it-syn-bubble {
        background: rgba(28, 35, 54, 0.8);
        border-color: rgba(255, 255, 255, 0.1);
        color: #cbd5e1;
      }
      .it-syn-bubble:hover {
        background: #6366f1;
        color: #ffffff;
      }
    }

    /* Footer Toolbar */
    .it-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      background: rgba(248, 250, 252, 0.8);
      border-top: 1px solid rgba(226, 232, 240, 0.75);
      gap: 8px;
    }

    @media (prefers-color-scheme: dark) {
      .it-footer {
        background: rgba(18, 22, 34, 0.8);
        border-color: rgba(255, 255, 255, 0.07);
      }
    }

    .it-select-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .it-target-select {
      appearance: none;
      -webkit-appearance: none;
      font-size: 12px;
      font-weight: 600;
      padding: 5px 24px 5px 9px;
      border-radius: 9px;
      border: 1px solid rgba(203, 213, 225, 0.8);
      background: #ffffff;
      color: #1e293b;
      cursor: pointer;
      outline: none;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      transition: all 0.16s ease;
    }

    .it-target-select:hover {
      border-color: #6366f1;
    }

    @media (prefers-color-scheme: dark) {
      .it-target-select {
        background: #1c2236;
        border-color: rgba(255, 255, 255, 0.14);
        color: #f1f5f9;
      }
    }

    .it-select-arrow {
      position: absolute;
      right: 7px;
      pointer-events: none;
      width: 10px;
      height: 10px;
      fill: #64748b;
    }

    .it-footer-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .it-btn-action {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      font-weight: 600;
      padding: 5px 10px;
      border-radius: 9px;
      border: 1px solid rgba(226, 232, 240, 0.9);
      background: #ffffff;
      color: #334155;
      cursor: pointer;
      transition: all 0.16s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }

    .it-btn-action:hover {
      background: #f1f5f9;
      color: #0f172a;
      border-color: #cbd5e1;
      transform: translateY(-1px);
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
    }

    .it-btn-action:active {
      transform: translateY(0);
    }

    @media (prefers-color-scheme: dark) {
      .it-btn-action {
        background: #1c2236;
        border-color: rgba(255, 255, 255, 0.12);
        color: #cbd5e1;
      }
      .it-btn-action:hover {
        background: #27304a;
        color: #ffffff;
      }
    }

    /* Primary Radiant Button (Copy) */
    .it-btn-action.primary {
      background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%);
      color: #ffffff;
      border: none;
      box-shadow: 0 3px 12px rgba(99, 102, 241, 0.35);
    }

    .it-btn-action.primary:hover {
      background: linear-gradient(135deg, #4f46e5 0%, #2563eb 100%);
      box-shadow: 0 5px 16px rgba(99, 102, 241, 0.5);
      color: #ffffff;
    }

    .it-btn-action.copied {
      background: #10b981 !important;
      border-color: #10b981 !important;
      color: #ffffff !important;
      box-shadow: 0 3px 12px rgba(16, 185, 129, 0.4) !important;
    }

    .it-btn-action svg {
      width: 13px;
      height: 13px;
      fill: currentColor;
    }

    /* Keyboard shortcut badge */
    .it-kbd {
      font-size: 9.5px;
      font-family: inherit;
      padding: 1px 4px;
      border-radius: 4px;
      background: rgba(0, 0, 0, 0.08);
      color: inherit;
      opacity: 0.75;
    }

    @media (prefers-color-scheme: dark) {
      .it-kbd {
        background: rgba(255, 255, 255, 0.14);
      }
    }

    /* Soundwave animation for speaking */
    .it-speaking-wave {
      display: inline-flex;
      align-items: flex-end;
      gap: 2.5px;
      height: 12px;
      margin-left: 2px;
    }
    .it-wave-bar {
      width: 2.5px;
      background: currentColor;
      border-radius: 1.5px;
      animation: itSoundWave 0.75s ease-in-out infinite alternate;
    }
    .it-wave-bar:nth-child(1) { height: 4px; animation-delay: 0.1s; }
    .it-wave-bar:nth-child(2) { height: 12px; animation-delay: 0.3s; }
    .it-wave-bar:nth-child(3) { height: 7px; animation-delay: 0.2s; }

    /* Error Toast */
    .it-error-card {
      padding: 10px 14px;
      border-radius: 10px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
      font-size: 12.5px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    @media (prefers-color-scheme: dark) {
      .it-error-card {
        background: rgba(185, 28, 28, 0.16);
        border-color: rgba(185, 28, 28, 0.35);
        color: #fca5a5;
      }
    }

    /* Keyframes */
    @keyframes itScaleIn {
      from { opacity: 0; transform: scale(0.8); }
      to { opacity: 1; transform: scale(1); }
    }

    @keyframes itSpringIn {
      0% { opacity: 0; transform: translateY(12px) scale(0.95); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes itShimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    @keyframes itSoundWave {
      0% { height: 3px; }
      100% { height: 12px; }
    }

    @keyframes itPulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.85); }
    }
  `;
  shadow.appendChild(styleEl);

  // Root container in shadow
  const container = document.createElement("div");
  container.className = "it-wrapper";
  shadow.appendChild(container);

  // SVG Icons Library
  const ICONS = {
    translate: `<svg viewBox="0 0 24 24"><path d="M12.87 15.07l-2.54-2.51.03-.08c1.74-1.94 2.98-4.17 3.71-6.49H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>`,
    speaker: `<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`,
    copy: `<svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`,
    check: `<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`,
    pin: `<svg viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>`,
    close: `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
    replace: `<svg viewBox="0 0 24 24"><path d="M19 8l-4 4h3c0 3.31-2.69 6-6 6-1.01 0-1.97-.25-2.8-.7l-1.46 1.46C8.97 19.54 10.43 20 12 20c4.42 0 8-3.58 8-8h3l-4-4zM6 12c0-3.31 2.69-6 6-6 1.01 0 1.97.25 2.8.7l1.46-1.46C15.03 4.46 13.57 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4H6z"/></svg>`,
    external: `<svg viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>`,
    swap: `<svg viewBox="0 0 24 24"><path d="M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z"/></svg>`,
    arrowDown: `<svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>`
  };

  // Text-To-Speech with wave animation
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

    const resetBtn = () => {
      if (triggerBtn) triggerBtn.innerHTML = ICONS.speaker;
    };

    utterance.onend = resetBtn;
    utterance.onerror = resetBtn;

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
      const popoverWidth = elem.offsetWidth || 400;
      const popoverHeight = elem.offsetHeight || 280;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      const MARGIN = 14;

      // Horizontal
      let left = rect.left + scrollX;
      if (left + popoverWidth > scrollX + viewportWidth - MARGIN) {
        left = scrollX + viewportWidth - popoverWidth - MARGIN;
      }
      if (left < scrollX + MARGIN) {
        left = scrollX + MARGIN;
      }

      // Vertical (prefer below)
      let top = rect.bottom + 10 + scrollY;
      const spaceBelow = viewportHeight - rect.bottom;

      if (spaceBelow < popoverHeight + 20 && rect.top > popoverHeight + 20) {
        top = rect.top - popoverHeight - 10 + scrollY;
      }

      container.style.left = `${Math.round(left)}px`;
      container.style.top = `${Math.round(top)}px`;
      container.style.visibility = "visible";
    });
  }

  // Replace text in host page
  function replaceSelectedText(newText) {
    if (!newText) return;

    // 1. Input or Textarea
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

    // 2. ContentEditable or standard DOM range
    if (activeRange) {
      try {
        activeRange.deleteContents();
        const textNode = document.createTextNode(newText);
        activeRange.insertNode(textNode);
        
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
        console.warn("DOM replacement fallback:", err);
      }
    }

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

    if (left + 40 > scrollX + window.innerWidth) {
      left = rect.right - 38 + scrollX;
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

  // Render Master Popover Card
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
            <span class="it-brand-title">InstantTranslate</span>
          </div>

          <!-- Language Switcher Capsule -->
          <div class="it-lang-capsule">
            <span id="it-src-flag">${srcData.flag}</span>
            <span id="it-src-name">${srcData.name.split(" ")[0]}</span>
            <button class="it-swap-btn" id="it-swap-lang-btn" title="Đảo chiều ngôn ngữ">
              ${ICONS.swap}
            </button>
            <span id="it-trg-flag">${trgData.flag}</span>
            <span id="it-trg-name">${trgData.name.split(" ")[0]}</span>
          </div>

          <!-- Header Tools -->
          <div class="it-header-tools">
            <button class="it-btn-round ${isPinned ? "active" : ""}" id="it-pin-btn" title="${isPinned ? "Bỏ ghim" : "Ghim cửa sổ"}">
              ${ICONS.pin}
            </button>
            <button class="it-btn-round" id="it-close-btn" title="Đóng (Esc)">
              ${ICONS.close}
            </button>
          </div>
        </div>

        <!-- Body -->
        <div class="it-body">
          <!-- Source Quote Box -->
          <div class="it-source-quote">
            <div class="it-source-header">
              <span>VĂN BẢN GỐC</span>
              <button class="it-btn-round" id="it-tts-source" title="Phát âm văn bản gốc">
                ${ICONS.speaker}
              </button>
            </div>
            <div class="it-source-text">${escapeHtml(text)}</div>
          </div>

          <!-- HERO TRANSLATION CARD (NÂNG CẤP ĐẲNG CẤP) -->
          <div class="it-hero-card">
            <div class="it-hero-top">
              <span class="it-hero-pill">
                <span class="it-hero-pill-dot"></span>
                <span>${trgData.flag} BẢN DỊCH TIẾNG ${trgData.name.toUpperCase()}</span>
              </span>
              <button class="it-btn-round" id="it-tts-result" title="Phát âm bản dịch" style="display:none;">
                ${ICONS.speaker}
              </button>
            </div>

            <div id="it-result-container">
              <div class="it-skeleton-bar" style="width: 92%;"></div>
              <div class="it-skeleton-bar" style="width: 68%;"></div>
            </div>
          </div>
        </div>

        <!-- Footer Toolbar -->
        <div class="it-footer">
          <div class="it-select-wrap">
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
            <div class="it-select-arrow">${ICONS.arrowDown}</div>
          </div>

          <div class="it-footer-actions">
            <!-- Replace Button -->
            <button class="it-btn-action" id="it-replace-btn" title="Thay thế chữ gốc trên web (Ctrl+Enter)">
              ${ICONS.replace}
              <span>Thay thế</span>
              <span class="it-kbd">↵</span>
            </button>

            <!-- Copy Button -->
            <button class="it-btn-action primary" id="it-copy-btn" title="Sao chép bản dịch (Ctrl+C)">
              ${ICONS.copy}
              <span>Chép</span>
              <span class="it-kbd">C</span>
            </button>

            <!-- Google Translate Link -->
            <button class="it-btn-round" id="it-ext-btn" title="Mở trang Google Translate">
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

    const langSelect = container.querySelector("#it-lang-select");
    langSelect.addEventListener("change", (e) => {
      executeTranslation(text, rect, e.target.value);
    });

    // Language Swap Button
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

    // Copy Button with Micro-Interaction
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
          copyBtn.innerHTML = `${ICONS.copy} <span>Chép</span> <span class="it-kbd">C</span>`;
        }, 1600);
      } catch (err) {
        console.warn("Clipboard copy failed:", err);
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

    // External Tab
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

          // Update Lang Capsule
          const sData = LANG_DATA[data.sourceLang] || { flag: "🌐", name: data.sourceLang };
          const tData = LANG_DATA[data.targetLang] || { flag: "🌐", name: data.targetLang };
          if (srcFlagEl) srcFlagEl.textContent = sData.flag;
          if (srcNameEl) srcNameEl.textContent = sData.name.split(" ")[0];
          if (trgFlagEl) trgFlagEl.textContent = tData.flag;
          if (trgNameEl) trgNameEl.textContent = tData.name.split(" ")[0];

          let html = `<div class="it-hero-text">${escapeHtml(data.translatedText)}</div>`;

          if (data.transliteration) {
            html += `<div class="it-phonetic-badge">🔊 /${escapeHtml(data.transliteration)}/</div>`;
          }

          // Dictionary breakdown with stylish color badges
          if (settings.showDict && data.dict && data.dict.length > 0) {
            html += `<div class="it-dict-box">`;
            for (const item of data.dict) {
              const posLower = (item.pos || "").toLowerCase();
              let posClass = "it-pos-other";
              let posVi = item.pos;
              if (posLower.includes("noun")) { posClass = "it-pos-noun"; posVi = "Danh từ"; }
              else if (posLower.includes("verb")) { posClass = "it-pos-verb"; posVi = "Động từ"; }
              else if (posLower.includes("adj")) { posClass = "it-pos-adj"; posVi = "Tính từ"; }

              html += `
                <div class="it-dict-row">
                  <span class="it-pos-tag ${posClass}">${escapeHtml(posVi)}</span>
                  <div class="it-synonyms-grid">
                    ${item.terms.map(t => `<span class="it-syn-bubble" title="Click để copy">${escapeHtml(t)}</span>`).join("")}
                  </div>
                </div>
              `;
            }
            html += `</div>`;
          }

          resultContainer.innerHTML = html;
          if (ttsResultBtn) ttsResultBtn.style.display = "flex";

          // Click on synonym pill copies it
          resultContainer.querySelectorAll(".it-syn-bubble").forEach(pill => {
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
    if (e.composedPath().includes(host)) return;
    setTimeout(() => {
      handleSelection(e);
    }, 20);
  });

  // Double Click listener
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

  // Keyboard Shortcuts
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
      let rect = { left: window.innerWidth / 2 - 200, top: 120, right: window.innerWidth / 2 + 200, bottom: 140 };
      if (sel && sel.rangeCount > 0) {
        rect = sel.getRangeAt(0).getBoundingClientRect();
      }
      executeTranslation(msg.text, rect);
    }
  });
})();
