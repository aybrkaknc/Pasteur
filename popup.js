const autoCopyEl = document.getElementById('autoCopy');
const disableSiteEl = document.getElementById('disableSite');
const siteHostEl = document.getElementById('siteHost');

document.getElementById('openOptions').addEventListener('click', () => {
  browser.runtime.openOptionsPage();
  window.close();
});

Promise.all([loadSettings(), browser.tabs.query({ active: true, currentWindow: true })]).then(([s, tabs]) => {
  autoCopyEl.checked = s.autoCopy;
  autoCopyEl.addEventListener('change', () => {
    browser.storage.sync.set({ autoCopy: autoCopyEl.checked });
  });

  let hostname = '';
  try {
    const url = new URL(tabs[0].url);
    if (url.protocol === 'http:' || url.protocol === 'https:') hostname = url.hostname;
  } catch (e) {
    // No URL for this tab (e.g. privileged page)
  }

  if (!hostname) {
    disableSiteEl.disabled = true;
    siteHostEl.textContent = browser.i18n.getMessage('popupUnavailable');
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
      browser.storage.sync.set({ excludedSites: sites });
    });
  });
});
