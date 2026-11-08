// popup/main.js - start-up (loaded last)

Promise.all([loadSettings(), activeTab]).then(([s, tabs]) => {
  initForm(s);
  initHighlightsCard();
  initSiteToggle(s, tabs);
});
