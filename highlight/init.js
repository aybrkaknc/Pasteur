// highlight/init.js - restores the saved highlights when the page loads (loaded last)

function hlInit() {
  if (!HL_SUPPORTED) return;
  hlCheckNavigation().then(() => {
    if (!hlStore.length || !document.body) return;
    // Pages that render late: retry while the DOM changes, for up to 10 seconds
    let timer = null;
    const observer = new MutationObserver(() => {
      if (hlEntries.size >= hlStore.length) return;
      clearTimeout(timer);
      timer = setTimeout(hlRestore, 500);
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    setTimeout(() => observer.disconnect(), 10000);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', hlInit);
} else {
  hlInit();
}
