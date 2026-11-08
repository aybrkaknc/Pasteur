// content/state.js - state shared by the content scripts and live settings

let shadowRoot = null;
let notificationElement = null;
let currentSelectedText = '';
let lastHandledText = ''; // Prevents handling the same selection twice
let settings = { ...DEFAULT_SETTINGS };
let hitHighlightId = null; // Set while the bubble belongs to a clicked highlight
let currentLinkUrl = ''; // Link address of the current selection, '' when there is none

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
