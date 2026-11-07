// Shared by content script, options page and popup.
const DEFAULT_SETTINGS = {
  enabled: true,
  autoCopy: true,
  copyInFields: true,
  excludedSites: [],
  duration: 2500,
  minLength: 2,
  searchEngine: 'google'
};

const SEARCH_ENGINES = {
  google: 'https://www.google.com/search?q=',
  duckduckgo: 'https://duckduckgo.com/?q=',
  bing: 'https://www.bing.com/search?q=',
  yandex: 'https://yandex.com/search/?text='
};

// Matches the domain itself and its subdomains.
function isHostExcluded(hostname, excludedSites) {
  return excludedSites.some(d => hostname === d || hostname.endsWith('.' + d));
}

function loadSettings() {
  return browser.storage.sync.get(DEFAULT_SETTINGS);
}
