// popup/main.js - start-up (loaded last)

Promise.all([loadSettings(), activeTab]).then(([s, tabs]) => {
  initForm(s);
  initHighlightsCard();
  initUnlockCard();
  initSiteToggle(s, tabs);
});
