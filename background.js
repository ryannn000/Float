// Toolbar icon toggles the floating buttons on/off (remembered across pages).
chrome.action.onClicked.addListener(async (tab) => {
  const { isVisible } = await chrome.storage.local.get('isVisible');
  const next = !isVisible;
  await chrome.storage.local.set({ isVisible: next });
  if (tab && tab.id != null) {
    chrome.tabs.sendMessage(tab.id, { action: 'toggle', isVisible: next }).catch(() => {});
  }
});
