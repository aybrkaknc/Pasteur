// popup/bridge.js - talking to the page: in-page panel size/Escape reporting, active tab, askPage()

// Embedded as the in-page panel: report height and close on Escape
if (window.top !== window) {
  const postSize = () => parent.postMessage({ pasteur: 'size', height: document.documentElement.scrollHeight }, '*');
  new ResizeObserver(postSize).observe(document.body);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') parent.postMessage({ pasteur: 'close' }, '*');
  });
}

// Embedded in a web page the extension frame has no tabs API; the page's content script
// supplies the hostname and answers highlight requests through postMessage instead.
const embedded = window.top !== window;
const activeTab = embedded || !api.tabs
  ? Promise.resolve([])
  : api.tabs.query({ active: true, currentWindow: true }).catch(() => []);

// Asks the page for highlight data: tabs messaging in the toolbar popup, postMessage in the panel
function askPage(type) {
  if (!embedded) {
    return activeTab.then((tabs) => {
      if (!tabs[0]) throw new Error('no tab');
      return api.tabs.sendMessage(tabs[0].id, { pasteur: type });
    });
  }
  return new Promise((resolve, reject) => {
    const id = Math.random().toString(36).slice(2);
    const timer = setTimeout(() => {
      window.removeEventListener('message', onReply);
      reject(new Error('no reply'));
    }, 1500);
    function onReply(e) {
      if (e.source !== parent || !e.data || e.data.pasteur !== 'hl-reply' || e.data.id !== id) return;
      clearTimeout(timer);
      window.removeEventListener('message', onReply);
      resolve(e.data.value);
    }
    window.addEventListener('message', onReply);
    parent.postMessage({ pasteur: type, id }, '*');
  });
}
