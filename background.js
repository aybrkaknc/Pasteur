// Shows a badge on the toolbar icon of tabs whose page blocks right click or selection.
// Tab-specific badge values reset by themselves when the tab navigates.
const api = globalThis.browser || globalThis.chrome;

api.runtime.onMessage.addListener((msg, sender) => {
  if (!msg || !sender.tab) return;
  const tabId = sender.tab.id;
  if (msg.pasteur === 'blocked') {
    api.action.setBadgeText({ tabId, text: '!' });
    api.action.setBadgeBackgroundColor({ tabId, color: '#e8590c' });
  } else if (msg.pasteur === 'unblocked') {
    api.action.setBadgeText({ tabId, text: '' });
  }
});
