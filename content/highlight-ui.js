// content/highlight-ui.js - bubble actions for highlights: create, open, navigate, popup requests

// Bubble for a clicked highlight: copy and search use its text, the pen becomes a remove button
function showHighlightBubble(entry) {
  currentSelectedText = entry.data.exact;
  currentLinkUrl = '';
  hitHighlightId = entry.data.id;
  hlCurrentId = entry.data.id;
  showStatusNotification(entry.range.getBoundingClientRect(), 'offer');
}

function applyHighlight(color) {
  hlCreateFromSelection(color).then((data) => {
    if (!data) return;
    window.getSelection().removeAllRanges();
    hideNotification();
  });
}

let navScrollUntil = 0; // Scroll events before this time come from a highlight jump

// Keeps a highlight's bubble on its highlight while the page scrolls to it
function followNavTarget() {
  const e = hitHighlightId && hlEntries.get(hitHighlightId);
  if (e && bubbleActive) positionNotification(e.range.getBoundingClientRect());
}

// Jumps to the next/previous highlight. A bubble that belongs to a highlight moves to the new one
// and keeps following it during the smooth scroll; its pen menu stays open for the next jump.
function goToHighlight(dir) {
  const followBubble = bubbleActive && !!hitHighlightId;
  navScrollUntil = Date.now() + 900;
  const res = hlGo(dir);
  if (!res) return hlState();
  if (followBubble) {
    const wrap = notificationElement.querySelector('.hl-wrap');
    const menuOpen = wrap.classList.contains('dots-open');
    showHighlightBubble(res.entry);
    if (menuOpen) wrap.classList.add('dots-open');
    if (res.scrolled) setTimeout(followNavTarget, 950); // Final position once the scroll has ended
  }
  return hlState();
}

// Requests from the settings popup or panel; resolves to the reply value, null when unknown
function handlePageRequest(type) {
  if (type === 'hl-count' || type === 'hl-clear') return hlCollect(type === 'hl-clear');
  if (type === 'hl-next') return Promise.resolve(goToHighlight(1));
  if (type === 'hl-prev') return Promise.resolve(goToHighlight(-1));
  if (type === 'hl-state') return Promise.resolve(hlState());
  if (type === 'unlock-state' || type === 'unlock-now') return Promise.resolve(handleUnlockRequest(type));
  return null;
}
