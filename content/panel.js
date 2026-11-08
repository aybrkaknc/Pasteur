// content/panel.js - in-page settings panel (popup.html in an iframe) placed around the bubble

// In-page settings panel: popup.html in an iframe opened by the gear.
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
  if (!notificationElement) return;
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
