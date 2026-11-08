// popup/site.js - "disable on this site" switch

const disableSiteEl = document.getElementById('disableSite');
const siteHostEl = document.getElementById('siteHost');

function initSiteToggle(s, tabs) {
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
}
