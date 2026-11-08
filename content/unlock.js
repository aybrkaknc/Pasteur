// content/unlock.js - lets right click, text selection and copying work on pages that block them

const UNLOCK_EVENTS = ['contextmenu', 'selectstart', 'copy', 'cut'];
const UNLOCK_STYLE_ID = 'pasteur-unlock-style';

let unlockedNow = false; // Unlocked from the popup for this page load only
let pageBlocked = false; // The page tried to cancel a right click or a selection

function unlockAllowed() {
  return settings.enabled && !isHostExcluded(getPageHostname(), settings.excludedSites);
}

function unlockActive() {
  return unlockAllowed() && (unlockedNow || settings.unlockPage);
}

// The page's handlers run after this capture listener; once the event has finished,
// defaultPrevented tells whether one of them cancelled it.
function detectBlock(e) {
  if (pageBlocked || !unlockAllowed() || window !== window.top) return;
  setTimeout(() => {
    if (!e.defaultPrevented) return;
    pageBlocked = true;
    api.runtime.sendMessage({ pasteur: 'blocked' }).catch(() => {});
  }, 0);
}

// Capture on window runs before the page's own handlers, so they never see the event
// and cannot call preventDefault() on it.
UNLOCK_EVENTS.forEach((type) => {
  window.addEventListener(type, (e) => {
    if (unlockActive()) e.stopImmediatePropagation();
    else if (type === 'contextmenu' || type === 'selectstart') detectBlock(e);
  }, true);
});

// Pages also block selection with CSS (user-select: none)
function syncUnlockStyle() {
  let style = document.getElementById(UNLOCK_STYLE_ID);
  if (!unlockActive()) {
    if (style) style.remove();
    return;
  }
  if (style) return;
  style = document.createElement('style');
  style.id = UNLOCK_STYLE_ID;
  style.textContent = '*, *::before, *::after { -webkit-user-select: text !important; user-select: text !important; }';
  document.documentElement.appendChild(style);
}

// state.js updates `settings` in its own storage listener, which is registered first
loadSettings().then((s) => {
  settings = s;
  syncUnlockStyle();
});
api.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  syncUnlockStyle();
  // Switching the setting on also answers the warning badge
  if (pageBlocked && unlockActive()) {
    pageBlocked = false;
    api.runtime.sendMessage({ pasteur: 'unblocked' }).catch(() => {});
  }
});

// Requests from the popup: is the page blocking, and unlock it for this page load
function handleUnlockRequest(type) {
  if (type === 'unlock-now') {
    unlockedNow = true;
    pageBlocked = false;
    syncUnlockStyle();
    api.runtime.sendMessage({ pasteur: 'unblocked' }).catch(() => {});
  }
  return { blocked: pageBlocked && !unlockActive() };
}
