// highlight/store.js - persistent text highlights via the CSS Custom Highlight API.
// The page DOM is never modified: ranges are registered in CSS.highlights and painted by
// highlight.css. Each highlight is stored as a text quote (exact + surrounding context)
// per page in storage.local and re-anchored when the page is opened again.

const HL_SUPPORTED = typeof CSS !== 'undefined' && !!CSS.highlights && typeof Highlight === 'function';
const HL_CONTEXT = 32; // Characters of context saved before and after the quote
const hlEntries = new Map(); // id -> { data, range } for highlights painted on the page
let hlStore = []; // Saved records for the current page
let hlKey = '';
let hlLoading = null; // Storage read for hlKey; everyone waits for the same one
let hlCurrentId = null; // Highlight last jumped to or clicked
let hlFlashTimer = null;

// Query and hash are ignored so the same article keeps its highlights
function hlPageKey() {
  return 'hl:' + location.origin + location.pathname;
}

function hlRegistry(color) {
  const name = 'pasteur-' + color;
  let h = CSS.highlights.get(name);
  if (!h) {
    h = new Highlight();
    CSS.highlights.set(name, h);
  }
  return h;
}

function hlSave() {
  if (hlStore.length) api.storage.local.set({ [hlKey]: hlStore });
  else api.storage.local.remove(hlKey);
}

function hlAdd(data, range) {
  hlRegistry(data.color).add(range);
  hlEntries.set(data.id, { data, range });
}

function hlRestore() {
  const index = hlBuildIndex();
  for (const data of hlStore) {
    if (hlEntries.has(data.id)) continue;
    const i = hlFind(index, data);
    if (i === -1) continue; // Text no longer on the page: skipped silently
    const r = hlRangeFromOffsets(index, i, i + data.exact.length);
    if (r) hlAdd(data, r);
  }
}

// Single-page apps change the URL without reloading; switch to that page's highlights
function hlCheckNavigation() {
  const key = hlPageKey();
  if (key === hlKey) return hlLoading;
  for (const e of hlEntries.values()) hlRegistry(e.data.color).delete(e.range);
  hlEntries.clear();
  hlCurrentId = null;
  hlStore = [];
  hlKey = key;
  hlLoading = api.storage.local.get(key).then((res) => {
    if (hlKey !== key) return; // The page changed again while reading
    hlStore = res[key] || [];
    hlRestore();
  });
  return hlLoading;
}

// Resolves to the new record, or null when the selection cannot be highlighted
function hlCreateFromSelection(color) {
  const sel = window.getSelection();
  if (!HL_SUPPORTED || !sel || sel.rangeCount === 0 || sel.isCollapsed) return Promise.resolve(null);
  const range = sel.getRangeAt(0).cloneRange();
  trimRangeWhitespace(range);

  return hlCheckNavigation().then(() => {
    const index = hlBuildIndex();
    const start = hlOffsetOf(index, range.startContainer, range.startOffset);
    const end = hlOffsetOf(index, range.endContainer, range.endOffset);
    if (end <= start) return null;
    const exact = index.text.slice(start, end);
    if (!exact.trim()) return null;

    const data = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      color,
      exact,
      prefix: index.text.slice(Math.max(0, start - HL_CONTEXT), start),
      suffix: index.text.slice(end, end + HL_CONTEXT)
    };
    const r = hlRangeFromOffsets(index, start, end);
    if (!r) return null;

    // Highlighting the same text again replaces the old one (e.g. a color change)
    const dup = hlStore.find(d => d.exact === exact && d.prefix === data.prefix && d.suffix === data.suffix);
    if (dup) hlRemove(dup.id, false);

    hlAdd(data, r);
    hlStore.push(data);
    hlSave();
    return data;
  });
}

function hlRemove(id, save = true) {
  const e = hlEntries.get(id);
  if (e) {
    hlRegistry(e.data.color).delete(e.range);
    hlEntries.delete(id);
  }
  hlStore = hlStore.filter(d => d.id !== id);
  if (hlCurrentId === id) hlCurrentId = null;
  if (save) hlSave();
}

// Changes the color of one highlight and saves it
function hlRecolor(id, color) {
  const e = hlEntries.get(id);
  if (!e || e.data.color === color) return;
  hlRegistry(e.data.color).delete(e.range);
  e.data.color = color;
  hlRegistry(color).add(e.range);
  hlSave();
}

function hlClearAll() {
  for (const e of hlEntries.values()) hlRegistry(e.data.color).delete(e.range);
  hlEntries.clear();
  hlStore = [];
  hlCurrentId = null;
  hlSave();
}

// Highlight under a viewport point, or null
function hlHitTest(x, y) {
  for (const e of hlEntries.values()) {
    for (const r of e.range.getClientRects()) {
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return e;
    }
  }
  return null;
}
