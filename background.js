/**
 * InstantTranslate - Background Service Worker
 * Handles translation API calls with fallback, context menu, and preferences.
 */

const DEFAULT_SETTINGS = {
  enabled: true,
  targetLang: "vi",
  sourceLang: "auto",
  triggerMode: "auto", // "auto" | "icon" | "ctrl" | "alt"
  showDict: true,
  autoTts: false,
  theme: "auto", // "auto" | "light" | "dark"
  excludedDomains: []
};

// Initialize settings on install
chrome.runtime.onInstalled.addListener(async (details) => {
  const current = await chrome.storage.local.get("settings");
  if (!current.settings) {
    await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  }

  // Create Context Menu
  try {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: "instant-translate-selection",
        title: "Dịch nhanh bằng InstantTranslate",
        contexts: ["selection"]
      });
    });
  } catch (err) {
    console.warn("Context menu initialization error:", err);
  }
});

// Context menu click listener
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "instant-translate-selection" && info.selectionText && tab?.id) {
    try {
      await chrome.tabs.sendMessage(tab.id, {
        action: "TRIGGER_SELECTION_TRANSLATE",
        text: info.selectionText.trim()
      });
    } catch (e) {
      console.warn("Could not send context menu message to tab:", e);
    }
  }
});

// Primary Google Translate endpoint (Public gtx client - Zero Config, No API key)
async function translateWithGoogleGtx(text, sourceLang = "auto", targetLang = "vi") {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
    sourceLang
  )}&tl=${encodeURIComponent(targetLang)}&dt=t&dt=bd&dt=rm&q=${encodeURIComponent(text)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Google Translate responded with HTTP ${response.status}`);
  }

  const data = await response.json();
  let translatedText = "";
  let transliteration = "";

  if (Array.isArray(data[0])) {
    for (const chunk of data[0]) {
      if (chunk && chunk[0]) {
        translatedText += chunk[0];
      }
      if (chunk && chunk[3]) {
        transliteration = chunk[3];
      }
    }
  }

  const detectedSourceLang = data[2] || (sourceLang === "auto" ? "en" : sourceLang);

  // Parse dictionary parts of speech if single word / short phrase
  const dict = [];
  if (Array.isArray(data[1])) {
    for (const posGroup of data[1]) {
      const posName = posGroup[0]; // e.g. "noun", "verb"
      const terms = Array.isArray(posGroup[1]) ? posGroup[1].slice(0, 5) : [];
      if (posName && terms.length > 0) {
        dict.push({ pos: posName, terms });
      }
    }
  }

  return {
    translatedText: translatedText.trim(),
    sourceLang: detectedSourceLang,
    targetLang,
    transliteration,
    dict,
    engine: "google-gtx"
  };
}

// Fallback 1: Google Chrome extension client
async function translateWithGoogleFallback(text, sourceLang = "auto", targetLang = "vi") {
  const sl = sourceLang === "auto" ? "auto" : sourceLang;
  const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${encodeURIComponent(
    sl
  )}&tl=${encodeURIComponent(targetLang)}&q=${encodeURIComponent(text)}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Fallback HTTP ${response.status}`);
  }

  const data = await response.json();
  let translatedText = "";
  let detectedSource = sourceLang;

  if (Array.isArray(data)) {
    if (typeof data[0] === "string") {
      translatedText = data[0];
    } else if (Array.isArray(data[0])) {
      translatedText = data[0].join(" ");
    }
    if (data[1]) detectedSource = data[1];
  } else if (typeof data === "string") {
    translatedText = data;
  }

  return {
    translatedText: translatedText.trim(),
    sourceLang: detectedSource,
    targetLang,
    dict: [],
    engine: "google-dict-fallback"
  };
}

// Fallback 2: MyMemory API
async function translateWithMyMemory(text, sourceLang = "auto", targetLang = "vi") {
  const sl = sourceLang === "auto" ? "en" : sourceLang;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
    text
  )}&langpair=${encodeURIComponent(sl)}|${encodeURIComponent(targetLang)}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`MyMemory HTTP ${response.status}`);
  const data = await response.json();

  if (data?.responseData?.translatedText) {
    return {
      translatedText: data.responseData.translatedText.trim(),
      sourceLang: sl,
      targetLang,
      dict: [],
      engine: "mymemory-fallback"
    };
  }
  throw new Error("MyMemory translation empty");
}

// Master Translation Coordinator with robust fallback
async function handleTranslation(text, sourceLang = "auto", targetLang = "vi") {
  if (!text || !text.trim()) {
    throw new Error("Văn bản cần dịch rỗng");
  }

  const cleanText = text.trim();

  // Try Primary Google GTX
  try {
    return await translateWithGoogleGtx(cleanText, sourceLang, targetLang);
  } catch (err1) {
    console.warn("Primary Google GTX failed, trying fallback 1:", err1.message);
    try {
      return await translateWithGoogleFallback(cleanText, sourceLang, targetLang);
    } catch (err2) {
      console.warn("Fallback 1 failed, trying fallback 2 (MyMemory):", err2.message);
      try {
        return await translateWithMyMemory(cleanText, sourceLang, targetLang);
      } catch (err3) {
        console.error("All translation engines failed:", err3.message);
        throw new Error("Không thể kết nối đến máy chủ dịch thuật. Vui lòng kiểm tra lại kết nối mạng!");
      }
    }
  }
}

// Handle runtime messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "TRANSLATE") {
    handleTranslation(request.text, request.sourceLang || "auto", request.targetLang || "vi")
      .then((result) => sendResponse({ success: true, data: result }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }

  if (request.action === "GET_SETTINGS") {
    chrome.storage.local.get("settings").then((res) => {
      sendResponse({ settings: res.settings || DEFAULT_SETTINGS });
    });
    return true;
  }
});
