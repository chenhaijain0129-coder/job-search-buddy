chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "open-dashboard") chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
});
