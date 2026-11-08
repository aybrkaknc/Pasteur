const toggles = ['enabled', 'autoCopy', 'copyInFields'];
const statusEl = document.getElementById('status');
const disableSiteEl = document.getElementById('disableSite');
const siteHostEl = document.getElementById('siteHost');
let statusTimeout = null;

// Embedded as the in-page panel: report height and close on Escape
if (window.top !== window) {
  const postSize = () => parent.postMessage({ copy2select: 'size', height: document.documentElement.scrollHeight }, '*');
  new ResizeObserver(postSize).observe(document.body);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') parent.postMessage({ copy2select: 'close' }, '*');
  });
}

// aria-label for switches that have no visible <label>
document.querySelectorAll('[data-i18n-label]').forEach((el) => {
  el.setAttribute('aria-label', api.i18n.getMessage(el.dataset.i18nLabel));
});

function clampNumber(el, fallback) {
  const n = parseInt(el.value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(Math.max(n, Number(el.min)), Number(el.max));
}

function parseSites(value) {
  return value.split('\n')
    .map(s => s.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, ''))
    .filter(Boolean);
}

function save() {
  const data = {
    duration: clampNumber(document.getElementById('duration'), DEFAULT_SETTINGS.duration),
    minLength: clampNumber(document.getElementById('minLength'), DEFAULT_SETTINGS.minLength),
    searchEngine: document.getElementById('searchEngine').value,
    position: document.getElementById('position').value,
    offsetX: clampNumber(document.getElementById('offsetX'), DEFAULT_SETTINGS.offsetX),
    offsetY: clampNumber(document.getElementById('offsetY'), DEFAULT_SETTINGS.offsetY),
    excludedSites: parseSites(document.getElementById('excludedSites').value)
  };
  toggles.forEach((id) => { data[id] = document.getElementById(id).checked; });

  api.storage.sync.set(data).then(() => {
    statusEl.textContent = api.i18n.getMessage('optSaved');
    clearTimeout(statusTimeout);
    statusTimeout = setTimeout(() => { statusEl.textContent = ''; }, 1500);
  });
}

Promise.all([loadSettings(), api.tabs.query({ active: true, currentWindow: true })]).then(([s, tabs]) => {
  toggles.forEach((id) => { document.getElementById(id).checked = s[id]; });
  document.getElementById('duration').value = s.duration;
  document.getElementById('minLength').value = s.minLength;
  document.getElementById('searchEngine').value = s.searchEngine;
  document.getElementById('excludedSites').value = s.excludedSites.join('\n');
  document.getElementById('offsetX').value = s.offsetX;
  document.getElementById('offsetY').value = s.offsetY;

  const positionEl = document.getElementById('position');
  const customOffsetEl = document.getElementById('customOffset');
  positionEl.value = s.position;
  customOffsetEl.hidden = s.position !== 'custom';
  positionEl.addEventListener('change', () => { customOffsetEl.hidden = positionEl.value !== 'custom'; });

  document.querySelectorAll('#enabled, #autoCopy, #copyInFields, #duration, #minLength, #searchEngine, #position, #offsetX, #offsetY, #excludedSites')
    .forEach((el) => el.addEventListener('change', save));

  // The in-page panel passes the hostname; the toolbar popup reads it from the active tab
  let hostname = new URLSearchParams(location.search).get('host') || '';
  if (!hostname) {
    try {
      const url = new URL(tabs[0].url);
      if (url.protocol === 'http:' || url.protocol === 'https:') hostname = url.hostname;
    } catch (e) {
      // No URL for this tab (e.g. privileged page)
    }
  }

  if (!hostname) {
    disableSiteEl.disabled = true;
    siteHostEl.textContent = api.i18n.getMessage('popupUnavailable');
    return;
  }

  siteHostEl.textContent = hostname;
  disableSiteEl.checked = isHostExcluded(hostname, s.excludedSites);
  disableSiteEl.addEventListener('change', () => {
    loadSettings().then((current) => {
      // Unchecking removes every entry that covers this host (domain or parent domain)
      const sites = disableSiteEl.checked
        ? [...current.excludedSites, hostname]
        : current.excludedSites.filter(d => !isHostExcluded(hostname, [d]));
      api.storage.sync.set({ excludedSites: sites }).then(() => {
        document.getElementById('excludedSites').value = sites.join('\n');
      });
    });
  });
});
