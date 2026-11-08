// highlight/nav.js - moving between highlights in document order

// Painted highlights in document order (recomputed each time; ranges move with the page)
function hlSorted() {
  return Array.from(hlEntries.values())
    .sort((a, b) => a.range.compareBoundaryPoints(Range.START_TO_START, b.range));
}

// 1-based position of the current highlight; index 0 means none chosen yet
function hlState() {
  const list = hlSorted();
  return { index: list.findIndex(e => e.data.id === hlCurrentId) + 1, total: list.length };
}

// Briefly emphasizes one range with the pasteur-current highlight (see highlight.css)
function hlFlash(range) {
  const h = hlRegistry('current');
  h.priority = 1;
  h.clear();
  h.add(range);
  clearTimeout(hlFlashTimer);
  hlFlashTimer = setTimeout(() => h.clear(), 1200);
}

// Moves to the next (dir = 1) or previous (dir = -1) highlight, wrapping around.
// Without a current one it starts from the viewport. Returns { entry, scrolled } or null.
function hlGo(dir) {
  const list = hlSorted();
  if (!list.length) return null;
  let i = list.findIndex(e => e.data.id === hlCurrentId);
  if (i === -1) {
    if (dir > 0) {
      i = list.findIndex(e => e.range.getBoundingClientRect().top >= 0);
      if (i === -1) i = 0;
    } else {
      i = list.length - 1;
      for (let k = list.length - 1; k >= 0; k--) {
        if (list[k].range.getBoundingClientRect().top < 0) { i = k; break; }
      }
    }
  } else {
    i = (i + dir + list.length) % list.length;
  }

  const entry = list[i];
  hlCurrentId = entry.data.id;
  const r = entry.range.getBoundingClientRect();
  const scrolled = r.top < 0 || r.bottom > window.innerHeight;
  if (scrolled) {
    const el = entry.range.startContainer.parentElement;
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  hlFlash(entry.range);
  return { entry, scrolled };
}
