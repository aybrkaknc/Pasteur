// content.js - Pasteur
// Shadow DOM isolated notification + quick search + optional manual copy mode

let shadowRoot = null;
let notificationElement = null;
let currentSelectedText = '';
let lastHandledText = ''; // Prevents handling the same selection twice
let settings = { ...DEFAULT_SETTINGS };

loadSettings().then((s) => { settings = s; });
api.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  for (const key in changes) settings[key] = changes[key].newValue;
});

// Cross-origin iframes cannot read the top hostname; they fall back to their own.
function getPageHostname() {
  try {
    return window.top.location.hostname;
  } catch (e) {
    return location.hostname;
  }
}

const NOTIF_STYLES = `
  #pasteur-notif {
    position: fixed;
    color: #ffffff;
    padding: 4px;
    height: 40px;
    border-radius: 12px;
    z-index: 2147483647;
    opacity: 0;
    transform: scale(0.9) translateY(10px) translateX(-50%);
    transition: opacity 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275),
                transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    pointer-events: auto;
    box-shadow: 0 12px 24px -6px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.15);
    display: flex;
    align-items: center;
    gap: 2px;
    left: 50%;
  }

  /* Screen-reader only status text */
  .notif-text {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  .icon-btn {
    cursor: pointer;
    background: transparent;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border-radius: 8px;
    transition: background-color 0.2s ease;
    user-select: none;
  }

  .icon-btn:hover { background-color: rgba(255, 255, 255, 0.12); }
  .icon-btn:focus-visible { outline: 2px solid #5fa8ff; outline-offset: -2px; }

  .icon-btn svg {
    width: 18px;
    height: 18px;
    fill: #ffffff;
    display: block;
  }

  /* Copy button: clipboard by default, check mark after a successful copy */
  .icon-btn svg.ic-check { display: none; fill: #66d17a; }
  #pasteur-notif.success .ic-clip { display: none; }
  #pasteur-notif.success .ic-check { display: block; }
  #pasteur-notif.error .ic-clip { fill: #ff8a80; }

  /* Highlight pen: painted in the current color; trash icon when the bubble is on a highlight */
  .hl-wrap { position: relative; display: flex; }
  #notif-hl-btn svg.ic-pen { fill: var(--hl, #ffd60a); }
  .icon-btn svg.ic-trash { display: none; fill: #ff8a80; }
  #pasteur-notif.on-highlight .ic-pen { display: none; }
  #pasteur-notif.on-highlight .ic-trash { display: block; }
  #pasteur-notif.on-highlight .hl-colors,
  #pasteur-notif.no-hl .hl-wrap { display: none; }

  /* Color picker above the pen (below it when the bubble is near the top edge) */
  .hl-colors {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%) translateY(4px);
    padding-bottom: 8px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease, transform 0.2s ease;
  }
  #pasteur-notif.dots-below .hl-colors {
    bottom: auto;
    top: 100%;
    padding-bottom: 0;
    padding-top: 8px;
    transform: translateX(-50%) translateY(-4px);
  }
  .hl-wrap:hover .hl-colors,
  .hl-wrap:focus-within .hl-colors {
    opacity: 1;
    pointer-events: auto;
    transform: translateX(-50%);
  }
  .hl-dots {
    display: flex;
    gap: 6px;
    padding: 6px 8px;
    background: #1a1c1e;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 10px;
    box-shadow: 0 8px 16px -6px rgba(0, 0, 0, 0.3);
  }
  .hl-dot {
    width: 16px;
    height: 16px;
    padding: 0;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    transition: transform 0.15s ease;
  }
  .hl-dot:hover { transform: scale(1.15); }
  .hl-dot.active { border-color: #ffffff; }
  .hl-dot:focus-visible { outline: 2px solid #5fa8ff; outline-offset: 1px; }

  #pasteur-panel {
    position: fixed;
    width: 340px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    background: #1a1c1e;
    box-shadow: 0 12px 24px -6px rgba(0, 0, 0, 0.3);
    z-index: 2147483647;
    color-scheme: dark;
    opacity: 0;
    transition: opacity 0.25s ease,
                transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275),
                height 0.2s ease;
  }
  /* Slide in from the bubble's direction */
  #pasteur-panel.side-below { transform: translateY(-8px) scale(0.96); transform-origin: top center; }
  #pasteur-panel.side-above { transform: translateY(8px) scale(0.96); transform-origin: bottom center; }
  #pasteur-panel.side-right { transform: translateX(-8px) scale(0.96); transform-origin: center left; }
  #pasteur-panel.side-left { transform: translateX(8px) scale(0.96); transform-origin: center right; }
  #pasteur-panel.open { opacity: 1; transform: none; }

  /* Caret linking the panel to the gear; drawn over the panel border, pointing at the bubble */
  #pasteur-arrow {
    position: fixed;
    width: 12px;
    height: 12px;
    background: #1a1c1e;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-right: none;
    border-bottom: none;
    z-index: 2147483647;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.25s ease 0.05s;
  }
  #pasteur-arrow.side-below { transform: rotate(45deg); }
  #pasteur-arrow.side-above { transform: rotate(225deg); }
  #pasteur-arrow.side-right { transform: rotate(-45deg); }
  #pasteur-arrow.side-left { transform: rotate(135deg); }
  #pasteur-arrow.open { opacity: 1; }

  #pasteur-notif.success,
  #pasteur-notif.offer { background-color: #1a1c1e; }
  #pasteur-notif.error { background-color: #2c1a1a; border-color: rgba(255, 0, 0, 0.2); }
  #pasteur-notif.show { opacity: 1; transform: scale(1) translateY(0) translateX(-50%); }
  #pasteur-notif.hide { pointer-events: none; opacity: 0; transform: scale(0.95) translateY(-5px) translateX(-50%); }
`;

function initializeNotification() {
  if (notificationElement && notificationElement.isConnected) return;
  const staleHost = document.getElementById('pasteur-host');
  if (staleHost) staleHost.remove();

  const host = document.createElement('div');
  host.id = 'pasteur-host';
  document.body.appendChild(host);

  shadowRoot = host.attachShadow({ mode: 'open' });

  const styleTag = document.createElement('style');
  styleTag.textContent = NOTIF_STYLES;
  shadowRoot.appendChild(styleTag);

  notificationElement = document.createElement('div');
  notificationElement.id = 'pasteur-notif';
  notificationElement.setAttribute('role', 'status');
  notificationElement.setAttribute('aria-live', 'polite');

  const textSpan = document.createElement('span');
  textSpan.className = 'notif-text';

  const svgNS = 'http://www.w3.org/2000/svg';
  function makeIconButton(id, title, paths) {
    const btn = document.createElement('button');
    btn.id = id;
    btn.className = 'icon-btn';
    btn.title = title;
    btn.setAttribute('aria-label', title);
    paths.forEach(({ d, cls }) => {
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('aria-hidden', 'true');
      if (cls) svg.setAttribute('class', cls);
      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', d);
      svg.appendChild(path);
      btn.appendChild(svg);
    });
    return btn;
  }

  const copyBtn = makeIconButton('notif-copy-btn', api.i18n.getMessage('copyAction'), [
    { cls: 'ic-clip', d: 'M19 2h-4.18C14.4.84 13.3 0 12 0c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 18H5V4h2v3h10V4h2v16z' },
    { cls: 'ic-check', d: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z' }
  ]);
  const searchBtn = makeIconButton('notif-search-btn', api.i18n.getMessage('searchTitle'), [
    { d: 'M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z' }
  ]);
  const hlBtn = makeIconButton('notif-hl-btn', api.i18n.getMessage('highlightAction'), [
    { cls: 'ic-pen', d: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z' },
    { cls: 'ic-trash', d: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z' }
  ]);
  const hlWrap = document.createElement('div');
  hlWrap.className = 'hl-wrap';
  const hlColors = document.createElement('div');
  hlColors.className = 'hl-colors';
  const hlDots = document.createElement('div');
  hlDots.className = 'hl-dots';
  for (const name in HIGHLIGHT_COLORS) {
    const dot = document.createElement('button');
    dot.className = 'hl-dot';
    dot.dataset.color = name;
    dot.style.backgroundColor = HIGHLIGHT_COLORS[name];
    const label = api.i18n.getMessage('color' + name[0].toUpperCase() + name.slice(1));
    dot.title = label;
    dot.setAttribute('aria-label', label);
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      settings.highlightColor = name;
      api.storage.sync.set({ highlightColor: name });
      applyHighlight(name);
    });
    hlDots.appendChild(dot);
  }
  hlColors.appendChild(hlDots);
  hlWrap.appendChild(hlBtn);
  hlWrap.appendChild(hlColors);

  const gearBtn = makeIconButton('notif-gear-btn', api.i18n.getMessage('settingsTitle'), [
    { d: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z' }
  ]);

  notificationElement.appendChild(textSpan);
  notificationElement.appendChild(copyBtn);
  notificationElement.appendChild(searchBtn);
  notificationElement.appendChild(hlWrap);
  notificationElement.appendChild(gearBtn);

  // Keep the page selection when clicking inside the bubble
  notificationElement.addEventListener('mousedown', (e) => e.preventDefault());

  copyBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    copyText(currentSelectedText, null);
  });

  searchBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentSelectedText) {
      const base = SEARCH_ENGINES[settings.searchEngine] || SEARCH_ENGINES.google;
      window.open(base + encodeURIComponent(currentSelectedText), '_blank', 'noopener,noreferrer');
    }
  });

  hlBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (hitHighlightId) {
      hlRemove(hitHighlightId);
      hideNotification();
      return;
    }
    applyHighlight(settings.highlightColor);
  });

  gearBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (settingsFrame) {
      closeSettingsPanel();
      return;
    }
    api.runtime.sendMessage('open-settings')
      .then((opened) => { if (!opened) openSettingsPanel(); })
      .catch(() => openSettingsPanel());
  });

  shadowRoot.appendChild(notificationElement);
}

// In-page settings panel: popup.html in an iframe, used when the toolbar popup cannot be opened.
// It opens toward the free space around the bubble and never covers it.
let settingsFrame = null;
let settingsArrow = null;
let panelSide = 'below'; // below | above | right | left (side of the bubble the panel is on)
let panelBox = null; // { left, top, maxHeight } fixed edges for the chosen side
const PANEL_WIDTH = 340;
const PANEL_GAP = 14;
const PANEL_MIN_HEIGHT = 240;
const EDGE = 8;

function choosePanelSide(b) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const space = {
    below: vh - b.bottom - PANEL_GAP - EDGE,
    above: b.top - PANEL_GAP - EDGE,
    right: vw - b.right - PANEL_GAP - EDGE,
    left: b.left - PANEL_GAP - EDGE
  };

  // Vertical first: upper half opens down, lower half opens up
  const preferred = (b.top + b.height / 2) < vh / 2 ? 'below' : 'above';
  const other = preferred === 'below' ? 'above' : 'below';
  let side = null;
  if (space[preferred] >= PANEL_MIN_HEIGHT) side = preferred;
  else if (space[other] >= PANEL_MIN_HEIGHT) side = other;
  else if (Math.max(space.right, space.left) >= PANEL_WIDTH) side = space.right >= space.left ? 'right' : 'left';
  else side = space.below >= space.above ? 'below' : 'above'; // Tiny window: least bad option

  let left;
  let top;
  let maxHeight;
  if (side === 'below' || side === 'above') {
    // Left half of the screen extends right, right half extends left
    left = (b.left + b.width / 2) < vw / 2 ? b.left : b.right - PANEL_WIDTH;
    left = Math.min(Math.max(left, EDGE), vw - PANEL_WIDTH - EDGE);
    maxHeight = Math.max(space[side], 120);
    top = side === 'below' ? b.bottom + PANEL_GAP : null; // above: computed from height
  } else {
    left = side === 'right' ? b.right + PANEL_GAP : b.left - PANEL_GAP - PANEL_WIDTH;
    maxHeight = vh - 2 * EDGE;
    top = null; // centered on the bubble, computed from height
  }
  return { side, left, top, maxHeight };
}

// Only the height changes after opening; the edge facing the bubble stays put.
function placePanel(contentHeight) {
  const b = notificationElement.getBoundingClientRect();
  const h = Math.min(contentHeight, panelBox.maxHeight);
  let top;
  if (panelSide === 'below') top = panelBox.top;
  else if (panelSide === 'above') top = b.top - PANEL_GAP - h;
  else top = Math.min(Math.max(b.top + b.height / 2 - h / 2, EDGE), window.innerHeight - h - EDGE);

  settingsFrame.style.left = `${panelBox.left}px`;
  settingsFrame.style.top = `${top}px`;
  settingsFrame.style.height = `${h}px`;

  // The 12px caret sits centered on the panel edge facing the bubble and lines up with the gear
  const gear = shadowRoot.getElementById('notif-gear-btn').getBoundingClientRect();
  if (panelSide === 'below' || panelSide === 'above') {
    const x = Math.min(Math.max(gear.left + gear.width / 2, panelBox.left + 20), panelBox.left + PANEL_WIDTH - 20);
    settingsArrow.style.left = `${x - 6}px`;
    settingsArrow.style.top = `${(panelSide === 'below' ? top : top + h) - 6}px`;
  } else {
    const y = Math.min(Math.max(gear.top + gear.height / 2, top + 20), top + h - 20);
    settingsArrow.style.top = `${y - 6}px`;
    settingsArrow.style.left = `${(panelSide === 'right' ? panelBox.left : panelBox.left + PANEL_WIDTH) - 6}px`;
  }
}

function openSettingsPanel() {
  initializeNotification();
  clearTimeout(hideTimeout);
  notificationElement.classList.remove('hide');
  notificationElement.classList.add('show');

  panelBox = choosePanelSide(notificationElement.getBoundingClientRect());
  panelSide = panelBox.side;

  settingsFrame = document.createElement('iframe');
  settingsFrame.id = 'pasteur-panel';
  settingsFrame.className = `side-${panelSide}`;
  // Pages opened from the page (not the toolbar) get no activeTab access, so pass the hostname
  settingsFrame.src = api.runtime.getURL('popup.html') + '?host=' + encodeURIComponent(getPageHostname());

  settingsArrow = document.createElement('div');
  settingsArrow.id = 'pasteur-arrow';
  settingsArrow.className = `side-${panelSide}`;

  shadowRoot.appendChild(settingsFrame);
  shadowRoot.appendChild(settingsArrow);
  placePanel(480);

  // Animate in once the content is ready, so no empty frame flashes
  const frame = settingsFrame;
  const arrow = settingsArrow;
  frame.addEventListener('load', () => {
    requestAnimationFrame(() => {
      frame.classList.add('open');
      arrow.classList.add('open');
    });
  }, { once: true });
}

function closeSettingsPanel() {
  if (!settingsFrame) return;
  const frame = settingsFrame;
  const arrow = settingsArrow;
  settingsFrame = null;
  settingsArrow = null;
  frame.classList.remove('open');
  arrow.classList.remove('open');
  setTimeout(() => {
    frame.remove();
    arrow.remove();
  }, 250);

  if (bubbleActive && !bubbleOffscreen) startHideTimer(settings.duration);
}

window.addEventListener('message', (e) => {
  if (!settingsFrame || e.source !== settingsFrame.contentWindow || !e.data) return;
  if (e.data.pasteur === 'close') closeSettingsPanel();
  if (e.data.pasteur === 'size') placePanel(e.data.height);
  if (e.data.pasteur === 'hl-count' || e.data.pasteur === 'hl-clear') {
    if (e.data.pasteur === 'hl-clear') hlClearAll();
    settingsFrame.contentWindow.postMessage({ pasteur: 'hl-reply', count: hlStore.length }, '*');
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeNotification);
} else {
  initializeNotification();
}

// Returns { text, rect } for the current selection, including inside input/textarea.
function getSelectedText() {
  const el = document.activeElement;
  if (el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT')) {
    if (el.type === 'password' || !settings.copyInFields) return { text: '', rect: null };
    try {
      const text = el.value.substring(el.selectionStart, el.selectionEnd).trim();
      return { text, rect: el.getBoundingClientRect() };
    } catch (e) {
      // Some input types (email, number) do not expose selectionStart
      return { text: '', rect: null };
    }
  }
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return { text: '', rect: null };
  return { text: selection.toString().trim(), rect: selection.getRangeAt(0).getBoundingClientRect() };
}

// rect is null when called from the bubble; the bubble then stays in place.
function copyText(text, rect) {
  navigator.clipboard.writeText(text)
    .then(() => {
      showStatusNotification(rect, 'success');
    })
    .catch((err) => {
      // Chrome blocks the Clipboard API in cross-origin iframes; execCommand copies the live selection
      if (document.execCommand('copy')) {
        showStatusNotification(rect, 'success');
        return;
      }
      console.error('Copy Failed:', err);
      showStatusNotification(rect, 'error');
    });
}

function handleSelection() {
  if (!settings.enabled || isHostExcluded(getPageHostname(), settings.excludedSites)) return;

  const { text, rect } = getSelectedText();
  if (text.length < settings.minLength || !document.hasFocus() || text === lastHandledText) return;

  currentSelectedText = text;
  lastHandledText = text;
  hitHighlightId = null;
  if (settings.autoCopy) {
    copyText(text, rect);
  } else {
    showStatusNotification(rect, 'offer');
  }
}

let mouseIsDown = false;
let selectionTimeout = null;
let lastPointer = null; // Mouse position of the last mouse selection, null for keyboard

document.addEventListener('mousedown', () => { mouseIsDown = true; });
document.addEventListener('mouseup', (e) => {
  mouseIsDown = false;
  lastPointer = { x: e.clientX, y: e.clientY };
  clearTimeout(selectionTimeout);
  handleSelection();

  const sel = window.getSelection();
  if (!sel || !sel.isCollapsed || !notificationElement) return;
  if (e.composedPath().includes(notificationElement)) return;
  if (!settings.enabled || isHostExcluded(getPageHostname(), settings.excludedSites)) return;
  const hit = hlHitTest(e.clientX, e.clientY);
  if (hit) showHighlightBubble(hit);
});

// Bubble for a clicked highlight: copy and search use its text, the pen becomes a remove button
function showHighlightBubble(entry) {
  currentSelectedText = entry.data.exact;
  hitHighlightId = entry.data.id;
  showStatusNotification(entry.range.getBoundingClientRect(), 'offer');
}

function applyHighlight(color) {
  hlCreateFromSelection(color).then((data) => {
    if (!data) return;
    window.getSelection().removeAllRanges();
    hideNotification();
  });
}

// Messages from the settings popup (toolbar or in-page panel); the top frame answers
api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || typeof msg !== 'object') return false;
  if (msg.pasteur === 'hl-clear') hlClearAll();
  if ((msg.pasteur === 'hl-count' || msg.pasteur === 'hl-clear') && window === window.top) {
    sendResponse(hlStore.length);
  }
  return false;
});

// Keyboard/touch selection; also resets dedupe when the selection is cleared
document.addEventListener('selectionchange', () => {
  if (getSelectedText().text.length === 0) lastHandledText = '';
  if (mouseIsDown) return;
  clearTimeout(selectionTimeout);
  selectionTimeout = setTimeout(() => {
    lastPointer = null;
    handleSelection();
  }, 400);
});

let hideTimeout = null;
let hideDeadline = 0;
let hideRemaining = 0;
let bubbleActive = false; // Bubble is logically open (it may be hidden while its text is off-screen)
let bubbleOffscreen = false;
let hitHighlightId = null; // Set while the bubble belongs to a clicked highlight

function startHideTimer(ms) {
  clearTimeout(hideTimeout);
  hideDeadline = Date.now() + ms;
  hideTimeout = setTimeout(hideNotification, ms);
}

// x is the bubble's horizontal center (CSS applies translateX(-50%)), y is its top edge
function positionNotification(rect) {
  const w = notificationElement.offsetWidth;
  const h = notificationElement.offsetHeight;
  const center = rect.left + (rect.width / 2);
  const corner = 16;
  let x;
  let y;
  switch (settings.position) {
    case 'below':
      x = center; y = rect.bottom + 10; break;
    case 'cursor':
      x = lastPointer ? lastPointer.x : center;
      y = (lastPointer ? lastPointer.y : rect.top) - h - 12;
      break;
    case 'top-left':
      x = w / 2 + corner; y = corner; break;
    case 'top-right':
      x = window.innerWidth - w / 2 - corner; y = corner; break;
    case 'bottom-left':
      x = w / 2 + corner; y = window.innerHeight - h - corner; break;
    case 'bottom-right':
      x = window.innerWidth - w / 2 - corner; y = window.innerHeight - h - corner; break;
    case 'custom':
      x = center + settings.offsetX; y = rect.top + settings.offsetY; break;
    default: // above
      x = center; y = rect.top - h - 10;
  }
  // Keep at least 8px from the viewport edges
  x = Math.min(Math.max(x, w / 2 + 8), window.innerWidth - w / 2 - 8);
  y = Math.min(Math.max(y, 8), window.innerHeight - h - 8);
  notificationElement.style.left = `${x}px`;
  notificationElement.style.top = `${y}px`;
  notificationElement.classList.toggle('dots-below', y < 56);
}

function hideNotification() {
  clearTimeout(hideTimeout);
  bubbleActive = false;
  bubbleOffscreen = false;
  hitHighlightId = null;
  if (notificationElement) notificationElement.classList.replace('show', 'hide');
}

// type: 'success' | 'error' | 'offer' (manual mode, shows the copy button)
function showStatusNotification(rect, type) {
  initializeNotification();

  const textSpan = notificationElement.querySelector('.notif-text');

  notificationElement.className = '';
  notificationElement.classList.add(type);

  // Pen: hidden for form fields (ranges cannot mark their text) and unsupported browsers
  const el = document.activeElement;
  const inField = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA');
  notificationElement.classList.toggle('no-hl', !HL_SUPPORTED || (inField && !hitHighlightId));
  notificationElement.classList.toggle('on-highlight', !!hitHighlightId);
  const color = settings.highlightColor;
  const hlBtn = notificationElement.querySelector('#notif-hl-btn');
  const hlLabel = api.i18n.getMessage(hitHighlightId ? 'highlightRemove' : 'highlightAction');
  hlBtn.style.setProperty('--hl', HIGHLIGHT_COLORS[color] || HIGHLIGHT_COLORS.yellow);
  hlBtn.title = hlLabel;
  hlBtn.setAttribute('aria-label', hlLabel);
  notificationElement.querySelectorAll('.hl-dot').forEach((d) => d.classList.toggle('active', d.dataset.color === color));

  // Visual feedback comes from the icons; the text is for screen readers only
  textSpan.textContent = type === 'success' ? api.i18n.getMessage('copiedMessage')
    : type === 'error' ? api.i18n.getMessage('failedMessage') : '';

  if (rect) positionNotification(rect);

  requestAnimationFrame(() => {
    notificationElement.classList.add('show');
  });

  bubbleActive = true;
  bubbleOffscreen = false;
  startHideTimer(settings.duration);
}
