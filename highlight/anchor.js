// highlight/anchor.js - maps between page text and Ranges (text index, quote search, trimming)

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

// Shrinks a range so it starts at the first and ends after the last non-space character.
// Returns true when the range was changed, false when it was already tight or has no text.
function trimRangeWhitespace(range) {
  const node = range.commonAncestorContainer;
  const root = node.nodeType === Node.ELEMENT_NODE ? node : node.parentNode;
  if (!root) return false;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let first = null;
  let last = null;
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!range.intersectsNode(n)) continue;
    const s = n === range.startContainer ? range.startOffset : 0;
    const e = n === range.endContainer ? range.endOffset : n.data.length;
    const seg = n.data.slice(s, e);
    const m = seg.match(/\S/);
    if (!m) continue;
    if (!first) first = { n, off: s + m.index };
    last = { n, off: s + seg.search(/\s*$/) };
  }
  if (!first) return false;
  const changed = first.n !== range.startContainer || first.off !== range.startOffset
    || last.n !== range.endContainer || last.off !== range.endOffset;
  if (changed) {
    range.setStart(first.n, first.off);
    range.setEnd(last.n, last.off);
  }
  return changed;
}
