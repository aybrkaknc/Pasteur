// content/clipboard.js - copying text or a link address to the clipboard

// rect is null when called from the bubble; the bubble then stays in place.
// via: 'text' or 'link' - which button shows the check mark
function copyText(text, rect, via = 'text') {
  navigator.clipboard.writeText(text)
    .then(() => {
      showStatusNotification(rect, 'success', via);
    })
    .catch((err) => {
      // Chrome blocks the Clipboard API in cross-origin iframes; execCommand copies the live selection
      // (only valid for the selected text, not for a link address)
      if (via === 'text' && document.execCommand('copy')) {
        showStatusNotification(rect, 'success', via);
        return;
      }
      console.error('Copy Failed:', err);
      showStatusNotification(rect, 'error', via);
    });
}
