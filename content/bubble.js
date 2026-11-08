// content/bubble.js - bubble show/hide, timers, positioning and per-state appearance

// Pen color and the active dot follow the given color (the clicked highlight's, or the default)
function updateBubbleColor(color) {
  notificationElement.querySelector('.hl-wrap').style.setProperty('--hl', HIGHLIGHT_COLORS[color] || HIGHLIGHT_COLORS.yellow);
  notificationElement.querySelectorAll('.hl-dot').forEach((d) => d.classList.toggle('active', d.dataset.color === color));
}

let hideTimeout = null;
let hideDeadline = 0;
let hideRemaining = 0;
let bubbleActive = false; // Bubble is logically open (it may be hidden while its text is off-screen)
let bubbleOffscreen = false;

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
  notificationElement.classList.toggle('dots-below', y < (window.matchMedia('(pointer: coarse)').matches ? 80 : 56));
}

function hideNotification() {
  clearTimeout(hideTimeout);
  bubbleActive = false;
  bubbleOffscreen = false;
  hitHighlightId = null;
  if (notificationElement) notificationElement.classList.replace('show', 'hide');
}

// type: 'success' | 'error' | 'offer' (asks the user); via: 'text' | 'link'
function showStatusNotification(rect, type, via = 'text') {
  initializeNotification();
  if (!notificationElement) return;

  const textSpan = notificationElement.querySelector('.notif-text');

  // A bubble that is already visible stays visible (no fade out and in) when its state changes
  const wasShown = notificationElement.classList.contains('show');
  const dotsBelow = notificationElement.classList.contains('dots-below');
  notificationElement.className = '';
  notificationElement.classList.add(type, `via-${via}`);
  if (wasShown) notificationElement.classList.add('show');
  if (dotsBelow) notificationElement.classList.add('dots-below'); // positionNotification() updates it when rect is given
  notificationElement.classList.toggle('has-link', !!currentLinkUrl);
  const textLabel = api.i18n.getMessage(currentLinkUrl ? 'copyTextAction' : 'copyAction');
  const copyButton = notificationElement.querySelector('#notif-copy-btn');
  copyButton.title = textLabel;
  copyButton.setAttribute('aria-label', textLabel);
  notificationElement.querySelector('.hl-wrap').classList.remove('dots-open');
  if (hitHighlightId) {
    const st = hlState();
    const pos = api.i18n.getMessage('hlPosition', [String(st.index), String(st.total)]);
    [['#notif-prev-btn', 'hlPrevious'], ['#notif-next-btn', 'hlNext']].forEach(([sel, key]) => {
      const b = notificationElement.querySelector(sel);
      const label = `${api.i18n.getMessage(key)} (${pos})`;
      b.title = label;
      b.setAttribute('aria-label', label);
    });
  }

  // Pen: hidden for form fields (ranges cannot mark their text) and unsupported browsers
  const el = document.activeElement;
  const inField = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA');
  notificationElement.classList.toggle('no-hl', !HL_SUPPORTED || (inField && !hitHighlightId));
  notificationElement.classList.toggle('on-highlight', !!hitHighlightId);
  const hit = hitHighlightId && hlEntries.get(hitHighlightId);
  const hlBtn = notificationElement.querySelector('#notif-hl-btn');
  const hlLabel = api.i18n.getMessage('highlightAction');
  updateBubbleColor(hit ? hit.data.color : settings.highlightColor);
  hlBtn.title = hlLabel;
  hlBtn.setAttribute('aria-label', hlLabel);
  // Up/down only when another highlight exists to jump to
  notificationElement.classList.toggle('has-nav', hlEntries.size > (hitHighlightId ? 1 : 0));

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
