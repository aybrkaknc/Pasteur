// content.js - copy2select
// Shadow DOM isolated notification + quick search + optional manual copy mode

let shadowRoot = null;
let notificationElement = null;
let currentSelectedText = '';
let lastHandledText = ''; // Prevents handling the same selection twice
let settings = { ...DEFAULT_SETTINGS };

loadSettings().then((s) => { settings = s; });
browser.storage.onChanged.addListener((changes, area) => {
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
  #copy2select-notif {
    position: fixed;
    color: #ffffff;
    padding: 0 8px 0 16px;
    height: 38px;
    border-radius: 12px;
    font-family: 'Inter', -apple-system, system-ui, sans-serif;
    font-size: 13px;
    font-weight: 600;
    z-index: 2147483647;
    opacity: 0;
    transform: scale(0.9) translateY(10px) translateX(-50%);
    transition: opacity 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275),
                transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    pointer-events: auto;
    white-space: nowrap;
    box-shadow: 0 12px 24px -6px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.15);
    display: flex;
    align-items: center;
    gap: 12px;
    left: 50%;
  }

  .separator {
    width: 1px;
    height: 20px;
    background-color: rgba(255, 255, 255, 0.2);
  }

  #notif-copy-btn {
    cursor: pointer;
    background: transparent;
    border: none;
    color: #ffffff;
    font: inherit;
    padding: 4px 6px;
    margin-left: -6px;
    border-radius: 6px;
    transition: background-color 0.2s ease;
  }

  #notif-search-btn {
    cursor: pointer;
    background: transparent;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    border-radius: 6px;
    transition: background-color 0.2s ease;
    user-select: none;
  }

  #notif-copy-btn:hover,
  #notif-search-btn:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  #notif-search-btn svg {
    width: 18px;
    height: 18px;
    fill: #ffffff;
    display: block;
  }

  #copy2select-notif.success,
  #copy2select-notif.offer { background-color: #1a1c1e; }
  #copy2select-notif.error { background-color: #2c1a1a; border-color: rgba(255, 0, 0, 0.2); }
  #copy2select-notif.show { opacity: 1; transform: scale(1) translateY(0) translateX(-50%); }
  #copy2select-notif.hide { pointer-events: none; opacity: 0; transform: scale(0.95) translateY(-5px) translateX(-50%); }
`;

function initializeNotification() {
  if (notificationElement && notificationElement.isConnected) return;
  const staleHost = document.getElementById('copy2select-host');
  if (staleHost) staleHost.remove();

  const host = document.createElement('div');
  host.id = 'copy2select-host';
  document.body.appendChild(host);

  shadowRoot = host.attachShadow({ mode: 'open' });

  const styleTag = document.createElement('style');
  styleTag.textContent = NOTIF_STYLES;
  shadowRoot.appendChild(styleTag);

  notificationElement = document.createElement('div');
  notificationElement.id = 'copy2select-notif';
  notificationElement.setAttribute('role', 'status');
  notificationElement.setAttribute('aria-live', 'polite');

  const textSpan = document.createElement('span');
  textSpan.className = 'notif-text';

  const copyBtn = document.createElement('button');
  copyBtn.id = 'notif-copy-btn';
  copyBtn.textContent = browser.i18n.getMessage('copyAction');

  const separator = document.createElement('div');
  separator.className = 'separator';

  const searchBtn = document.createElement('button');
  searchBtn.id = 'notif-search-btn';
  searchBtn.title = browser.i18n.getMessage('searchTitle');
  searchBtn.setAttribute('aria-label', browser.i18n.getMessage('searchTitle'));

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');

  const path = document.createElementNS(svgNS, 'path');
  path.setAttribute('d', 'M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z');

  svg.appendChild(path);
  searchBtn.appendChild(svg);

  notificationElement.appendChild(textSpan);
  notificationElement.appendChild(copyBtn);
  notificationElement.appendChild(separator);
  notificationElement.appendChild(searchBtn);

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

  shadowRoot.appendChild(notificationElement);
}

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
  if (settings.autoCopy) {
    copyText(text, rect);
  } else {
    showStatusNotification(rect, 'offer');
  }
}

let mouseIsDown = false;
let selectionTimeout = null;

document.addEventListener('mousedown', () => { mouseIsDown = true; });
document.addEventListener('mouseup', () => {
  mouseIsDown = false;
  clearTimeout(selectionTimeout);
  handleSelection();
});

// Keyboard/touch selection; also resets dedupe when the selection is cleared
document.addEventListener('selectionchange', () => {
  if (getSelectedText().text.length === 0) lastHandledText = '';
  if (mouseIsDown) return;
  clearTimeout(selectionTimeout);
  selectionTimeout = setTimeout(handleSelection, 400);
});

let hideTimeout = null;

// type: 'success' | 'error' | 'offer' (manual mode, shows the copy button)
function showStatusNotification(rect, type) {
  initializeNotification();

  const textSpan = notificationElement.querySelector('.notif-text');
  const copyBtn = notificationElement.querySelector('#notif-copy-btn');
  const separator = notificationElement.querySelector('.separator');
  const searchBtn = notificationElement.querySelector('#notif-search-btn');

  notificationElement.className = '';
  notificationElement.classList.add(type);

  textSpan.style.display = type === 'offer' ? 'none' : 'inline';
  copyBtn.style.display = type === 'offer' ? 'inline' : 'none';
  if (type === 'success') textSpan.textContent = browser.i18n.getMessage('copiedMessage');
  if (type === 'error') textSpan.textContent = browser.i18n.getMessage('failedMessage');

  const showSearch = type !== 'error';
  separator.style.display = showSearch ? 'block' : 'none';
  searchBtn.style.display = showSearch ? 'flex' : 'none';

  if (rect) {
    // Keep at least 8px from the viewport edges
    notificationElement.style.top = `${Math.max(8, rect.top - 50)}px`;
    const halfWidth = notificationElement.offsetWidth / 2;
    const center = rect.left + (rect.width / 2);
    const left = Math.min(Math.max(center, halfWidth + 8), window.innerWidth - halfWidth - 8);
    notificationElement.style.left = `${left}px`;
  }

  requestAnimationFrame(() => {
    notificationElement.classList.add('show');
  });

  if (hideTimeout) clearTimeout(hideTimeout);
  hideTimeout = setTimeout(() => {
    notificationElement.classList.replace('show', 'hide');
  }, settings.duration);
}
