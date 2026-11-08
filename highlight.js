// highlight.js - persistent text highlights via the CSS Custom Highlight API.
// The page DOM is never modified: ranges are registered in CSS.highlights and painted by
// highlight.css. Each highlight is stored as a text quote (exact + surrounding context)
// per page in storage.local and re-anchored when the page is opened again.

const HL_SUPPORTED = typeof CSS !== 'undefined' && !!CSS.highlights && typeof Highlight === 'function';
const HL_CONTEXT = 32; // Characters of context saved before and after the quote
const hlEntries = new Map(); // id -> { data, range } for highlights painted on the page
let hlStore = []; // Saved records for the current page
let hlKey = '';

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

// Flat text of the page with each text node's start offset; skips non-visible text and our own UI
function hlBuildIndex() {
  const nodes = [];
  const starts = new Map();
  let text = '';
  if (!document.body) return { text, nodes, starts };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const p = n.parentElement;
      if (!p || p.closest('script, style, noscript, textarea, template, #pasteur-host')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    nodes.push({ node: n, start: text.length });
    starts.set(n, text.length);
    text += n.data;
  }
  return { text, nodes, starts };
}

// Converts a Range boundary to an offset in the flat text
function hlOffsetOf(index, container, offset) {
  if (container.nodeType === Node.TEXT_NODE && index.starts.has(container)) {
    return index.starts.get(container) + offset;
  }
  // Element boundary (or unindexed text): first indexed text node at or after the point
  const probe = document.createRange();
  probe.setStart(container, offset);
  probe.collapse(true);
  for (const e of index.nodes) {
    if (probe.comparePoint(e.node, 0) >= 0) return e.start;
  }
  return index.text.length;
}

function hlLocate(index, pos, isEnd) {
  for (const e of index.nodes) {
    const len = e.node.data.length;
    const inside = isEnd ? (pos > e.start && pos <= e.start + len) : (pos >= e.start && pos < e.start + len);
    if (inside) return { node: e.node, offset: pos - e.start };
  }
  return null;
}

function hlRangeFromOffsets(index, start, end) {
  const a = hlLocate(index, start, false);
  const b = hlLocate(index, end, true);
  if (!a || !b) return null;
  const r = document.createRange();
  r.setStart(a.node, a.offset);
  r.setEnd(b.node, b.offset);
  return r;
}

// Best occurrence of the quote: the one whose saved prefix/suffix still match
function hlFind(index, data) {
  let best = -1;
  let bestScore = -1;
  let from = 0;
  for (;;) {
    const i = index.text.indexOf(data.exact, from);
    if (i === -1) break;
    let score = 0;
    if (index.text.slice(Math.max(0, i - data.prefix.length), i) === data.prefix) score += 1;
    const end = i + data.exact.length;
    if (index.text.slice(end, end + data.suffix.length) === data.suffix) score += 1;
    if (score > bestScore) {
      best = i;
      bestScore = score;
      if (score === 2) break;
    }
    from = i + 1;
  }
  return best;
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
  if (key === hlKey) return Promise.resolve();
  for (const e of hlEntries.values()) hlRegistry(e.data.color).delete(e.range);
  hlEntries.clear();
  hlKey = key;
  return api.storage.local.get(key).then((res) => {
    hlStore = res[key] || [];
    hlRestore();
  });
}

// Resolves to the new record, or null when the selection cannot be highlighted
function hlCreateFromSelection(color) {
  const sel = window.getSelection();
  if (!HL_SUPPORTED || !sel || sel.rangeCount === 0 || sel.isCollapsed) return Promise.resolve(null);
  const range = sel.getRangeAt(0).cloneRange();

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
  if (save) hlSave();
}

function hlClearAll() {
  for (const e of hlEntries.values()) hlRegistry(e.data.color).delete(e.range);
  hlEntries.clear();
  hlStore = [];
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
