/**
 * InstantTranslate - Popup Script
 * Manages configuration, storage synchronization, and live translation testing.
 */

document.addEventListener("DOMContentLoaded", async () => {
  // Elements
  const toggleEnabled = document.getElementById("toggle-enabled");
  const selectTargetLang = document.getElementById("select-target-lang");
  const checkShowDict = document.getElementById("check-show-dict");
  const checkAutoTts = document.getElementById("check-auto-tts");
  const triggerModeRadios = document.querySelectorAll('input[name="triggerMode"]');
  const saveToast = document.getElementById("save-toast");

  // Tab elements
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  // Test Box elements
  const testInput = document.getElementById("test-input");
  const testTargetLang = document.getElementById("test-target-lang");
  const btnRunTest = document.getElementById("btn-run-test");
  const testResultWrapper = document.getElementById("test-result-wrapper");
  const testResultText = document.getElementById("test-result-text");
  const testResultTag = document.getElementById("test-result-tag");
  const btnTestTts = document.getElementById("btn-test-tts");
  const btnTestCopy = document.getElementById("btn-test-copy");

  let currentSettings = {
    enabled: true,
    targetLang: "vi",
    sourceLang: "auto",
    triggerMode: "auto",
    showDict: true,
    autoTts: false
  };

  let toastTimer = null;
  let lastTestResult = null;

  // Show Toast
  function showToast(msg = "Đã lưu cấu hình") {
    saveToast.textContent = msg;
    saveToast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      saveToast.classList.remove("show");
    }, 1600);
  }

  // Load Settings
  async function loadSettings() {
    try {
      const res = await chrome.storage.local.get("settings");
      if (res && res.settings) {
        currentSettings = { ...currentSettings, ...res.settings };
      }
    } catch (err) {
      console.warn("Error reading storage:", err);
    }

    // Populate UI
    toggleEnabled.checked = currentSettings.enabled !== false;
    selectTargetLang.value = currentSettings.targetLang || "vi";
    checkShowDict.checked = currentSettings.showDict !== false;
    checkAutoTts.checked = Boolean(currentSettings.autoTts);

    // Set triggerMode radio
    const activeMode = currentSettings.triggerMode || "auto";
    triggerModeRadios.forEach((radio) => {
      radio.checked = radio.value === activeMode;
    });

    // Sync test box default target lang
    if (testTargetLang) {
      testTargetLang.value = currentSettings.targetLang || "vi";
    }
  }

  // Save Settings
  async function saveSettings(silent = false) {
    const selectedRadio = document.querySelector('input[name="triggerMode"]:checked');

    currentSettings = {
      ...currentSettings,
      enabled: toggleEnabled.checked,
      targetLang: selectTargetLang.value,
      triggerMode: selectedRadio ? selectedRadio.value : "auto",
      showDict: checkShowDict.checked,
      autoTts: checkAutoTts.checked
    };

    try {
      await chrome.storage.local.set({ settings: currentSettings });
      if (!silent) showToast();
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
  }

  // Event Listeners for Settings Auto-Save
  toggleEnabled.addEventListener("change", () => saveSettings());
  selectTargetLang.addEventListener("change", () => {
    saveSettings();
    if (testTargetLang) testTargetLang.value = selectTargetLang.value;
  });
  checkShowDict.addEventListener("change", () => saveSettings());
  checkAutoTts.addEventListener("change", () => saveSettings());
  triggerModeRadios.forEach((r) => r.addEventListener("change", () => saveSettings()));

  // Tab Switching
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");
      tabButtons.forEach((b) => b.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));

      btn.classList.add("active");
      const targetContent = document.getElementById(`tab-${targetTab}`);
      if (targetContent) targetContent.classList.add("active");
    });
  });

  // Test Translation Runner
  async function runTestTranslation() {
    const text = testInput.value.trim();
    if (!text) {
      testInput.focus();
      return;
    }

    const targetLang = testTargetLang.value;
    btnRunTest.disabled = true;
    btnRunTest.textContent = "Đang dịch...";
    testResultWrapper.style.display = "flex";
    testResultText.textContent = "Đang gửi yêu cầu dịch...";
    testResultTag.textContent = "Đang dịch";

    chrome.runtime.sendMessage(
      {
        action: "TRANSLATE",
        text,
        sourceLang: "auto",
        targetLang
      },
      (res) => {
        btnRunTest.disabled = false;
        btnRunTest.innerHTML = `
          <svg viewBox="0 0 24 24" class="btn-icon">
            <path d="M12.87 15.07l-2.54-2.51.03-.08c1.74-1.94 2.98-4.17 3.71-6.49H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
          </svg>
          Dịch ngay
        `;

        if (res && res.success && res.data) {
          lastTestResult = res.data;
          testResultText.textContent = res.data.translatedText;
          testResultTag.textContent = `${res.data.sourceLang.toUpperCase()} → ${res.data.targetLang.toUpperCase()}`;
        } else {
          testResultTag.textContent = "Lỗi";
          testResultText.textContent = res?.error || "Không thể dịch đoạn văn bản này.";
        }
      }
    );
  }

  btnRunTest.addEventListener("click", runTestTranslation);

  testInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      runTestTranslation();
    }
  });

  // TTS in Test Box
  btnTestTts.addEventListener("click", () => {
    if (!lastTestResult || !lastTestResult.translatedText) return;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(lastTestResult.translatedText);
      u.lang = lastTestResult.targetLang || "vi-VN";
      window.speechSynthesis.speak(u);
    }
  });

  // Copy in Test Box
  btnTestCopy.addEventListener("click", async () => {
    if (!lastTestResult || !lastTestResult.translatedText) return;
    try {
      await navigator.clipboard.writeText(lastTestResult.translatedText);
      showToast("Đã chép bản dịch vào clipboard!");
    } catch (e) {
      console.warn("Copy failed:", e);
    }
  });

  // Initial load
  await loadSettings();
});
