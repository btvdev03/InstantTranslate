/**
 * InstantTranslate - Popup Script
 * Handles settings tabs, quick testing, and history review.
 */

document.addEventListener("DOMContentLoaded", async () => {
  // DOM Elements
  const masterEnable = document.getElementById("master-enable");
  const targetLangSelect = document.getElementById("target-lang");
  const triggerModeRadios = document.querySelectorAll('input[name="triggerMode"]');
  const doubleClickCheck = document.getElementById("double-click");
  const enableReplaceCheck = document.getElementById("enable-replace");
  const showDictCheck = document.getElementById("show-dict");
  const autoTtsCheck = document.getElementById("auto-tts");
  const toast = document.getElementById("toast");

  // Quick Test Elements
  const quickInput = document.getElementById("quick-input");
  const quickCharCount = document.getElementById("quick-char-count");
  const quickBtn = document.getElementById("quick-btn-translate");
  const quickCard = document.getElementById("quick-result-card");
  const quickText = document.getElementById("quick-result-text");
  const quickPhonetic = document.getElementById("quick-phonetic-text");
  const quickLangTag = document.getElementById("quick-lang-tag");
  const quickTtsBtn = document.getElementById("quick-tts-btn");
  const quickCopyBtn = document.getElementById("quick-copy-btn");

  // History Elements
  const historyList = document.getElementById("history-list");
  const historyCount = document.getElementById("history-count");
  const clearHistoryBtn = document.getElementById("btn-clear-history");

  let lastTranslatedQuickText = "";

  // 1. Tab Switching
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-pane").forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");
      const targetTab = document.getElementById(btn.dataset.tab);
      if (targetTab) targetTab.classList.add("active");

      if (btn.dataset.tab === "tab-history") {
        loadHistory();
      }
    });
  });

  // 2. Load Settings from chrome.storage.local
  const res = await chrome.storage.local.get("settings");
  const s = res.settings || {};

  masterEnable.checked = s.enabled !== false;
  if (s.targetLang) targetLangSelect.value = s.targetLang;

  triggerModeRadios.forEach((r) => {
    if (r.value === (s.triggerMode || "auto")) r.checked = true;
  });

  doubleClickCheck.checked = s.doubleClickToTranslate === true;
  enableReplaceCheck.checked = s.enableReplace !== false;
  showDictCheck.checked = s.showDict !== false;
  autoTtsCheck.checked = s.autoTts === true;

  // 3. Save Settings function with toast
  function saveSettings(showNotification = true) {
    let selectedMode = "auto";
    triggerModeRadios.forEach((r) => {
      if (r.checked) selectedMode = r.value;
    });

    const newSettings = {
      enabled: masterEnable.checked,
      targetLang: targetLangSelect.value,
      triggerMode: selectedMode,
      doubleClickToTranslate: doubleClickCheck.checked,
      enableReplace: enableReplaceCheck.checked,
      showDict: showDictCheck.checked,
      autoTts: autoTtsCheck.checked
    };

    chrome.storage.local.set({ settings: newSettings }, () => {
      if (showNotification) showToast("Đã lưu cài đặt!");
    });
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 1500);
  }

  // Attach event listeners for instant auto-save
  masterEnable.addEventListener("change", () => saveSettings(true));
  targetLangSelect.addEventListener("change", () => saveSettings(true));
  triggerModeRadios.forEach((r) => r.addEventListener("change", () => saveSettings(true)));
  doubleClickCheck.addEventListener("change", () => saveSettings(true));
  enableReplaceCheck.addEventListener("change", () => saveSettings(true));
  showDictCheck.addEventListener("change", () => saveSettings(true));
  autoTtsCheck.addEventListener("change", () => saveSettings(true));

  // 4. Quick Test Logic
  quickInput.addEventListener("input", () => {
    quickCharCount.textContent = `${quickInput.value.length} ký tự`;
  });

  async function executeQuickTest() {
    const text = quickInput.value.trim();
    if (!text) return;

    quickBtn.disabled = true;
    quickBtn.textContent = "Đang dịch...";

    chrome.runtime.sendMessage(
      {
        action: "TRANSLATE",
        text: text,
        sourceLang: "auto",
        targetLang: targetLangSelect.value
      },
      (response) => {
        quickBtn.disabled = false;
        quickBtn.innerHTML = `
          <svg viewBox="0 0 24 24"><path d="M12.87 15.07l-2.54-2.51.03-.08c1.74-1.94 2.98-4.17 3.71-6.49H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>
          <span>Dịch ngay</span>
        `;

        if (response && response.success && response.data) {
          const d = response.data;
          lastTranslatedQuickText = d.translatedText;
          quickCard.style.display = "flex";
          quickText.textContent = d.translatedText;
          quickLangTag.textContent = (d.targetLang || "VI").toUpperCase();

          if (d.transliteration) {
            quickPhonetic.style.display = "block";
            quickPhonetic.textContent = `/${d.transliteration}/`;
          } else {
            quickPhonetic.style.display = "none";
          }
        } else {
          quickCard.style.display = "flex";
          quickText.textContent = "Lỗi: " + (response?.error || "Không thể dịch");
          quickPhonetic.style.display = "none";
        }
      }
    );
  }

  quickBtn.addEventListener("click", executeQuickTest);
  quickInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      executeQuickTest();
    }
  });

  quickCopyBtn.addEventListener("click", async () => {
    if (lastTranslatedQuickText) {
      await navigator.clipboard.writeText(lastTranslatedQuickText);
      showToast("Đã chép vào bộ nhớ tạm!");
    }
  });

  quickTtsBtn.addEventListener("click", () => {
    if (lastTranslatedQuickText && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(lastTranslatedQuickText);
      u.lang = targetLangSelect.value === "vi" ? "vi-VN" : targetLangSelect.value;
      window.speechSynthesis.speak(u);
    }
  });

  // 5. History Tab Logic
  async function loadHistory() {
    chrome.runtime.sendMessage({ action: "GET_HISTORY" }, (res) => {
      const history = (res && res.history) || [];
      historyCount.textContent = `${history.length} mục đã lưu`;

      if (history.length === 0) {
        historyList.innerHTML = `
          <div class="history-empty">
            <p>Chưa có lịch sử dịch nào.</p>
            <span>Hãy bôi đen chữ trên trang web để bắt đầu dịch!</span>
          </div>
        `;
        return;
      }

      let html = "";
      for (const item of history) {
        const timeStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        html += `
          <div class="history-item" data-id="${item.id}">
            <div class="history-item-header">
              <span class="history-item-langs">${(item.sourceLang || "AUTO").toUpperCase()} → ${(item.targetLang || "VI").toUpperCase()}</span>
              <span>${timeStr}</span>
            </div>
            <div class="history-item-original" title="${escapeHtml(item.originalText)}">${escapeHtml(item.originalText)}</div>
            <div class="history-item-translated">${escapeHtml(item.translatedText)}</div>
            <div class="history-item-actions">
              <button class="btn-icon-sm btn-hist-copy" title="Sao chép">
                <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
              </button>
              <button class="btn-icon-sm btn-hist-del" title="Xóa mục này">
                <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
              </button>
            </div>
          </div>
        `;
      }

      historyList.innerHTML = html;

      // Attach copy listeners
      historyList.querySelectorAll(".btn-hist-copy").forEach((b) => {
        b.addEventListener("click", (e) => {
          const itemEl = e.target.closest(".history-item");
          const trText = itemEl.querySelector(".history-item-translated").textContent;
          navigator.clipboard.writeText(trText);
          showToast("Đã chép bản dịch!");
        });
      });

      // Attach delete listeners
      historyList.querySelectorAll(".btn-hist-del").forEach((b) => {
        b.addEventListener("click", (e) => {
          const itemEl = e.target.closest(".history-item");
          const id = itemEl.dataset.id;
          chrome.runtime.sendMessage({ action: "DELETE_HISTORY_ITEM", id }, () => {
            loadHistory();
          });
        });
      });
    });
  }

  clearHistoryBtn.addEventListener("click", () => {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử dịch?")) {
      chrome.runtime.sendMessage({ action: "CLEAR_HISTORY" }, () => {
        loadHistory();
        showToast("Đã xóa toàn bộ lịch sử!");
      });
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
});
