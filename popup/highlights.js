// popup/highlights.js - "highlights on this page" card: count, clear, up/down

function initHighlightsCard() {
  // Highlights on this page: the content script answers with the count (no answer = unsupported page)
  const hlCountEl = document.getElementById('hlCount');
  const hlClearEl = document.getElementById('hlClear');
  const showCount = (n) => {
    hlCountEl.textContent = n > 0
      ? api.i18n.getMessage('optHighlightsCount', [String(n)])
      : api.i18n.getMessage('optHighlightsNone');
    hlClearEl.disabled = !(n > 0);
  };
  askPage('hl-count').then(showCount, () => showCount(0));

  // Up/down between the highlights of the page, with an "index / total" label
  const hlPosEl = document.getElementById('hlPos');
  const hlPrevEl = document.getElementById('hlPrev');
  const hlNextEl = document.getElementById('hlNext');
  const showPos = (st) => {
    const total = st && st.total ? st.total : 0;
    hlPosEl.textContent = total ? api.i18n.getMessage('hlPosition', [String(st.index), String(total)]) : '';
    hlPrevEl.disabled = !total;
    hlNextEl.disabled = !total;
  };
  askPage('hl-state').then(showPos, () => showPos(null));
  hlPrevEl.addEventListener('click', () => askPage('hl-prev').then(showPos, () => showPos(null)));
  hlNextEl.addEventListener('click', () => askPage('hl-next').then(showPos, () => showPos(null)));
  // Clearing deletes saved data, so it takes a second click to confirm
  let armed = false;
  hlClearEl.addEventListener('click', () => {
    if (!armed) {
      armed = true;
      hlClearEl.textContent = api.i18n.getMessage('optHighlightsConfirm');
      hlClearEl.classList.add('danger');
      return;
    }
    armed = false;
    hlClearEl.textContent = api.i18n.getMessage('optHighlightsClear');
    hlClearEl.classList.remove('danger');
    askPage('hl-clear').then(showCount, () => showCount(0));
    showPos(null);
  });
}
