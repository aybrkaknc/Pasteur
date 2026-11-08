// popup/form.js - the settings form: fill from storage, save on change

const toggles = ['enabled', 'autoCopy', 'copyInFields', 'unlockPage'];
const statusEl = document.getElementById('status');
let statusTimeout = null;

// aria-label for switches that have no visible <label>
document.querySelectorAll('[data-i18n-label]').forEach((el) => {
  el.setAttribute('aria-label', api.i18n.getMessage(el.dataset.i18nLabel));
  if (el.tagName === 'BUTTON') el.title = el.getAttribute('aria-label');
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
    highlightColor: document.getElementById('highlightColor').value,
    excludedSites: parseSites(document.getElementById('excludedSites').value)
  };
  toggles.forEach((id) => { data[id] = document.getElementById(id).checked; });

  api.storage.sync.set(data).then(() => {
    statusEl.textContent = api.i18n.getMessage('optSaved');
    clearTimeout(statusTimeout);
    statusTimeout = setTimeout(() => { statusEl.textContent = ''; }, 1500);
  });
}

function initForm(s) {
  toggles.forEach((id) => { document.getElementById(id).checked = s[id]; });
  document.getElementById('duration').value = s.duration;
  document.getElementById('minLength').value = s.minLength;
  document.getElementById('searchEngine').value = s.searchEngine;
  document.getElementById('excludedSites').value = s.excludedSites.join('\n');
  document.getElementById('offsetX').value = s.offsetX;
  document.getElementById('offsetY').value = s.offsetY;
  document.getElementById('highlightColor').value = s.highlightColor;

  const positionEl = document.getElementById('position');
  const customOffsetEl = document.getElementById('customOffset');
  positionEl.value = s.position;
  customOffsetEl.hidden = s.position !== 'custom';
  positionEl.addEventListener('change', () => { customOffsetEl.hidden = positionEl.value !== 'custom'; });

  document.querySelectorAll('#enabled, #autoCopy, #copyInFields, #unlockPage, #duration, #minLength, #searchEngine, #position, #offsetX, #offsetY, #highlightColor, #excludedSites')
    .forEach((el) => el.addEventListener('change', save));
}
