// content/selection.js - reading, trimming and reacting to the page selection

// Returns { text, rect } for the current selection, including inside input/textarea.
function getSelectedText() {
  const el = document.activeElement;
  if (el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT')) {
    if (el.type === 'password' || !settings.copyInFields) return { text: '', rect: null };
    try {
      const text = el.value.substring(el.selectionStart, el.selectionEnd).trim();
      return { text, rect: el.getBoundingClientRect() };
    } catch (e) {
      // Some input types (email, number) do not expose selectionStart
      return { text: '', rect: null };
    }
  }
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return { text: '', rect: null };
  return { text: selection.toString().trim(), rect: selection.getRangeAt(0).getBoundingClientRect() };
}

// Address of the link the selection is about, or '' (links inside form fields do not exist).
// The selection must sit inside a link, or be mostly one link; a long text that merely
// contains a link is treated as plain text.
function getSelectionLink() {
  const el = document.activeElement;
  if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return '';
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return '';
  const range = sel.getRangeAt(0);
  const node = range.commonAncestorContainer;
  const root = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  if (!root) return '';
  let a = root.closest('a[href]');
  if (!a) {
    const links = Array.from(root.querySelectorAll('a[href]')).filter((l) => range.intersectsNode(l));
    const selLength = sel.toString().trim().length;
    const linkLength = links.length === 1 ? links[0].textContent.trim().length : 0;
    // Exactly one link that makes up at least half of the selected text
    if (linkLength && linkLength * 2 >= selLength) a = links[0];
  }
  return a && /^(https?:|mailto:|tel:)/i.test(a.href) ? a.href : '';
}

// Removes leading/trailing spaces from the selection itself (a stray space picked up at the end
// of a drag), in the page and inside text fields, keeping the selection direction.
function trimSelectionWhitespace() {
  const el = document.activeElement;
  if (el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT')) {
    if (el.type === 'password') return;
    try {
      const { selectionStart: s, selectionEnd: e, value } = el;
      if (s === null || s === e) return;
      const seg = value.slice(s, e);
      const lead = seg.length - seg.trimStart().length;
      const trail = seg.length - seg.trimEnd().length;
      if ((lead || trail) && lead + trail < seg.length) {
        el.setSelectionRange(s + lead, e - trail, el.selectionDirection);
      }
    } catch (err) {
      // Input types without a selection (email, number): nothing to trim
    }
    return;
  }

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
  const range = sel.getRangeAt(0).cloneRange();
  const backward = sel.anchorNode !== range.startContainer || sel.anchorOffset !== range.startOffset;
  if (!trimRangeWhitespace(range)) return;
  if (backward) sel.setBaseAndExtent(range.endContainer, range.endOffset, range.startContainer, range.startOffset);
  else sel.setBaseAndExtent(range.startContainer, range.startOffset, range.endContainer, range.endOffset);
}

function handleSelection() {
  if (!settings.enabled || isHostExcluded(getPageHostname(), settings.excludedSites)) return;

  trimSelectionWhitespace();
  const { text, rect } = getSelectedText();
  if (text.length < settings.minLength || !document.hasFocus() || text === lastHandledText) return;

  currentSelectedText = text;
  lastHandledText = text;
  hitHighlightId = null;
  currentLinkUrl = getSelectionLink();
  // A selection with a link is never copied silently: the bubble asks for text or link
  if (settings.autoCopy && !currentLinkUrl) {
    copyText(text, rect);
  } else {
    showStatusNotification(rect, 'offer');
  }
}

let mouseIsDown = false;
let selectionTimeout = null;
let lastPointer = null; // Mouse position of the last mouse selection, null for keyboard

document.addEventListener('mousedown', () => { mouseIsDown = true; });
document.addEventListener('mouseup', (e) => {
  mouseIsDown = false;
  lastPointer = { x: e.clientX, y: e.clientY };
  clearTimeout(selectionTimeout);
  handleSelection();

  const sel = window.getSelection();
  if (!sel || !sel.isCollapsed || !notificationElement) return;
  if (e.composedPath().includes(notificationElement)) return;
  if (!settings.enabled || isHostExcluded(getPageHostname(), settings.excludedSites)) return;
  const hit = hlHitTest(e.clientX, e.clientY);
  if (hit) showHighlightBubble(hit);
});

// Keyboard/touch selection; also resets dedupe when the selection is cleared
document.addEventListener('selectionchange', () => {
  if (getSelectedText().text.length === 0) lastHandledText = '';
  if (mouseIsDown) return;
  clearTimeout(selectionTimeout);
  selectionTimeout = setTimeout(() => {
    lastPointer = null;
    handleSelection();
  }, 400);
});
