// background.js for Quote Rich Text browser extension
// © 2025 John Navas, All rights reserved.

function injectAndQuote(tabId) {
  browser.tabs.executeScript(tabId, { file: "content.js" }, () => {
    browser.tabs.sendMessage(tabId, { action: "quote" });
  });
}

// Unified handler for all user triggers
function handleQuote(tab) {
  if (tab && tab.id) injectAndQuote(tab.id);
}

// Add context menu only if supported (desktop only)
if (browser.contextMenus && browser.contextMenus.create) {
  browser.contextMenus.create({
    id: "quote-rich-text",
    title: "Quote Rich Text",
    contexts: ["selection", "editable"]
  });

  browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "quote-rich-text") handleQuote(tab);
  });
}

// Browser action click handler (works on desktop toolbar and Android Extensions menu)
browser.browserAction.onClicked.addListener(handleQuote);

// Keyboard shortcut handler (desktop only)
if (browser.commands && browser.commands.onCommand) {
  browser.commands.onCommand.addListener((command) => {
    if (command === "quote-rich-text") {
      browser.tabs.query({ active: true, currentWindow: true }).then(tabs => handleQuote(tabs[0]));
    }
  });
}

// Onboarding and upboarding: open onboarding.html with query params on install/update
browser.runtime.onInstalled.addListener((details) => {
  const params = details.reason === "install" ? "?onboarding=1"
    : details.reason === "update" ? "?upboarding=1"
      : "";
  if (params) {
    browser.tabs.create({ url: browser.runtime.getURL("onboarding.html") + params });
  }
});
