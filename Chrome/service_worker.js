// service_worker.js for Quote Rich Text browser extension (MV3)
// © 2025 John Navas, All rights reserved.

const ext = typeof browser !== "undefined" ? browser : chrome;

async function injectAndQuote(tabId) {
  try {
    await ext.scripting.executeScript({
      target: { tabId },
      files: ["content.js"]
    });
    await ext.tabs.sendMessage(tabId, { action: "quote" });
  } catch (e) {
    // Restricted pages (e.g., edge://, chrome://, about:) cannot be scripted
  }
}

// Unified handler for all user triggers
function handleQuote(tab) {
  if (tab && tab.id) injectAndQuote(tab.id);
}

// Context menu click handler (desktop only)
if (ext.contextMenus && ext.contextMenus.onClicked) {
  ext.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "quote-rich-text") handleQuote(tab);
  });
}

// Action click handler (works on desktop toolbar and Android Extensions menu)
ext.action.onClicked.addListener(handleQuote);

// Keyboard shortcut handler (desktop only)
if (ext.commands && ext.commands.onCommand) {
  ext.commands.onCommand.addListener(async (command) => {
    if (command === "quote-rich-text") {
      const tabs = await ext.tabs.query({ active: true, currentWindow: true });
      handleQuote(tabs[0]);
    }
  });
}

// Onboarding, upboarding, and context menu setup on install/update
ext.runtime.onInstalled.addListener((details) => {
  // Add context menu only if supported (desktop only)
  if (ext.contextMenus && ext.contextMenus.create) {
    ext.contextMenus.create({
      id: "quote-rich-text",
      title: "Quote Rich Text",
      contexts: ["selection", "editable"]
    }, () => void ext.runtime.lastError);
  }

  const params = details.reason === "install" ? "?onboarding=1"
    : details.reason === "update" ? "?upboarding=1"
      : "";
  if (params) {
    ext.tabs.create({ url: ext.runtime.getURL("onboarding.html") + params });
  }
});