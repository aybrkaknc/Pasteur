// highlight/frames.js - counting/clearing highlights across nested frames

// Counts (and optionally clears) highlights in this frame and every nested frame.
// Child frames answer through postMessage; frames without the script just time out.
function hlCollect(clear) {
  if (clear) hlClearAll();
  const own = hlStore.length;
  const children = [];
  for (let i = 0; i < window.frames.length; i++) {
    const frame = window.frames[i];
    if (typeof settingsFrame !== 'undefined' && settingsFrame && frame === settingsFrame.contentWindow) continue;
    children.push(frame);
  }
  if (!children.length) return Promise.resolve(own);

  return new Promise((resolve) => {
    const id = Math.random().toString(36).slice(2);
    let total = own;
    let pending = children.length;
    const finish = () => {
      window.removeEventListener('message', onReply);
      clearTimeout(timer);
      resolve(total);
    };
    function onReply(e) {
      if (!e.data || e.data.pasteur !== 'hl-frame-res' || e.data.id !== id) return;
      if (!children.includes(e.source)) return;
      total += Number(e.data.count) || 0;
      if (--pending === 0) finish();
    }
    const timer = setTimeout(finish, 300);
    window.addEventListener('message', onReply);
    children.forEach((f) => f.postMessage({ pasteur: 'hl-frame-req', id, clear: !!clear }, '*'));
  });
}

// Nested frames answer their parent's count/clear request
window.addEventListener('message', (e) => {
  if (window === window.top || e.source !== window.parent) return;
  if (!e.data || e.data.pasteur !== 'hl-frame-req') return;
  hlCollect(!!e.data.clear).then((count) => {
    e.source.postMessage({ pasteur: 'hl-frame-res', id: e.data.id, count }, '*');
  });
});
