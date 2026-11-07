const checkboxes = ['enabled', 'autoCopy', 'copyInFields'];
const statusEl = document.getElementById('status');
let statusTimeout = null;

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
    excludedSites: parseSites(document.getElementById('excludedSites').value)
  };
  checkboxes.forEach((id) => { data[id] = document.getElementById(id).checked; });

  browser.storage.sync.set(data).then(() => {
    statusEl.textContent = browser.i18n.getMessage('optSaved');
    clearTimeout(statusTimeout);
    statusTimeout = setTimeout(() => { statusEl.textContent = ''; }, 1500);
  });
}

loadSettings().then((s) => {
  checkboxes.forEach((id) => { document.getElementById(id).checked = s[id]; });
  document.getElementById('duration').value = s.duration;
  document.getElementById('minLength').value = s.minLength;
  document.getElementById('searchEngine').value = s.searchEngine;
  document.getElementById('excludedSites').value = s.excludedSites.join('\n');

  document.querySelectorAll('input, select, textarea').forEach((el) => {
    el.addEventListener('change', save);
  });
});

// Popup changes (auto copy, this site) while the options page is open
browser.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  if (changes.autoCopy) document.getElementById('autoCopy').checked = changes.autoCopy.newValue;
  if (changes.excludedSites) document.getElementById('excludedSites').value = changes.excludedSites.newValue.join('\n');
});
