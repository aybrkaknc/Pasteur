// Tries to open the toolbar popup when the in-page gear is clicked.
// Replies false when the browser refuses (Firefox requires a direct user action),
// so the content script can show the in-page settings panel instead.
const api = globalThis.browser || globalThis.chrome;

api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg !== 'open-settings') return false;
  Promise.resolve()
    .then(() => api.action.openPopup())
    .then(() => sendResponse(true), () => sendResponse(false));
  return true; // Keep the channel open for the async reply
});
