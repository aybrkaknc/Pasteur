// shared/settings.js - defaults, constants and helpers shared by the content scripts and the popup.
// Firefox exposes `browser`, Chrome only `chrome`; both return promises in MV3.
const api = globalThis.browser || globalThis.chrome;

const DEFAULT_SETTINGS = {
  enabled: true,
  autoCopy: true,
  copyInFields: true,
  excludedSites: [],
  duration: 2500,
  minLength: 2,
  searchEngine: 'google',
  // above | below | cursor | top-left | top-right | bottom-left | bottom-right | custom
  position: 'above',
  // custom: bubble top-center relative to the selection's top-center, in px
  offsetX: 0,
  offsetY: -50,
  highlightColor: 'yellow'
};

// Solid colors for the UI (pen icon, color dots); page paint colors are in highlight.css
const HIGHLIGHT_COLORS = {
  yellow: '#ffd60a',
  green: '#66d17a',
  pink: '#ff7eb6',
  blue: '#5fa8ff'
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
  return api.storage.sync.get(DEFAULT_SETTINGS);
}
