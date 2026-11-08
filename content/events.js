// content/events.js - page-level listeners: panel messages, outside click, scroll, Escape, popup

window.addEventListener('message', (e) => {
  if (!settingsFrame || e.source !== settingsFrame.contentWindow || !e.data) return;
  if (e.data.pasteur === 'close') closeSettingsPanel();
  if (e.data.pasteur === 'size') placePanel(e.data.height);
  const reply = handlePageRequest(e.data.pasteur);
  if (reply) {
    const frame = settingsFrame;
    const id = e.data.id;
    reply.then((value) => {
      frame.contentWindow.postMessage({ pasteur: 'hl-reply', id, value }, '*');
    });
  }
});

// Click outside the bubble and panel closes both
document.addEventListener('mousedown', (e) => {
  if (!notificationElement) return;
  const path = e.composedPath();
  if (path.includes(notificationElement) || (settingsFrame && path.includes(settingsFrame))) return;
  closeSettingsPanel();
  hideNotification();
}, true);

// Scrolling closes the panel and the bubble follows the selection. While the selected text is
// off-screen the bubble is hidden and its timer paused; it resumes when the text scrolls back.
document.addEventListener('scroll', () => {
  if (Date.now() < navScrollUntil) { // Our own jump to a highlight: the bubble follows, nothing closes
    followNavTarget();
    return;
  }
  if (!bubbleActive) return;
  closeSettingsPanel();
  let text;
  let rect;
  const hit = hitHighlightId && hlEntries.get(hitHighlightId);
  if (hit) {
    text = hit.data.exact;
    rect = hit.range.getBoundingClientRect();
  } else {
    ({ text, rect } = getSelectedText());
  }
  if (!text || text !== currentSelectedText || !rect) {
    hideNotification();
    return;
  }

  const visible = rect.bottom > 0 && rect.top < window.innerHeight;
  if (!visible) {
    if (!bubbleOffscreen) {
      bubbleOffscreen = true;
      hideRemaining = Math.max(0, hideDeadline - Date.now());
      clearTimeout(hideTimeout);
      notificationElement.classList.replace('show', 'hide');
    }
    return;
  }

  lastPointer = null; // The stored cursor position is stale after scrolling
  positionNotification(rect);
  if (bubbleOffscreen) {
    bubbleOffscreen = false;
    notificationElement.classList.replace('hide', 'show');
    startHideTimer(hideRemaining);
  }
}, { capture: true, passive: true });

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeSettingsPanel();
});

// Toolbar popup messages; only the top frame answers
api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || typeof msg !== 'object' || window !== window.top) return false;
  const reply = handlePageRequest(msg.pasteur);
  if (!reply) return false;
  reply.then(sendResponse);
  return true; // Async reply
});
