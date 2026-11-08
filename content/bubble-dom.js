// content/bubble-dom.js - builds the bubble (shadow DOM host, icon buttons, pen menu) and wires its buttons

function initializeNotification() {
  if (notificationElement && notificationElement.isConnected) return;
  if (!document.body) return; // SVG/XML documents: no place for the bubble
  const staleHost = document.getElementById('pasteur-host');
  if (staleHost) staleHost.remove();

  const host = document.createElement('div');
  host.id = 'pasteur-host';
  document.body.appendChild(host);

  shadowRoot = host.attachShadow({ mode: 'open' });

  const styleTag = document.createElement('style');
  styleTag.textContent = NOTIF_STYLES;
  shadowRoot.appendChild(styleTag);

  notificationElement = document.createElement('div');
  notificationElement.id = 'pasteur-notif';
  notificationElement.setAttribute('role', 'status');
  notificationElement.setAttribute('aria-live', 'polite');

  const textSpan = document.createElement('span');
  textSpan.className = 'notif-text';

  const copyBtn = makeIconButton('notif-copy-btn', api.i18n.getMessage('copyAction'), [
    { cls: 'ic-clip', d: ICONS.clipboard + ICONS.textLines },
    { cls: 'ic-check', d: ICONS.check }
  ]);
  const linkBtn = makeIconButton('notif-link-btn', api.i18n.getMessage('copyLinkAction'), [
    { cls: 'ic-link', d: ICONS.clipboard + ICONS.globe },
    { cls: 'ic-check', d: ICONS.check }
  ]);
  const searchBtn = makeIconButton('notif-search-btn', api.i18n.getMessage('searchTitle'), [
    { d: ICONS.search }
  ]);
  // Up/down between highlights; they sit in the pen's popover together with the colors
  const prevBtn = makeIconButton('notif-prev-btn', api.i18n.getMessage('hlPrevious'), [{ d: ICONS.up }]);
  const nextBtn = makeIconButton('notif-next-btn', api.i18n.getMessage('hlNext'), [{ d: ICONS.down }]);

  const hlBtn = makeIconButton('notif-hl-btn', api.i18n.getMessage('highlightAction'), [
    { cls: 'ic-pen', d: ICONS.pen }
  ]);
  const hlWrap = document.createElement('div');
  hlWrap.className = 'hl-wrap';
  const hlColors = document.createElement('div');
  hlColors.className = 'hl-colors';
  const hlDots = document.createElement('div');
  hlDots.className = 'hl-dots';
  prevBtn.classList.add('nav-btn');
  nextBtn.classList.add('nav-btn');
  hlDots.appendChild(prevBtn);
  hlDots.appendChild(nextBtn);
  const sepNav = document.createElement('div');
  sepNav.className = 'hl-sep hl-sep-nav';
  hlDots.appendChild(sepNav);
  for (const name in HIGHLIGHT_COLORS) {
    const dot = document.createElement('button');
    dot.className = 'hl-dot';
    dot.dataset.color = name;
    dot.style.backgroundColor = HIGHLIGHT_COLORS[name];
    const label = api.i18n.getMessage('color' + name[0].toUpperCase() + name.slice(1));
    dot.title = label;
    dot.setAttribute('aria-label', label);
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      // On a clicked highlight a color only recolors that highlight; the default color is untouched
      if (hitHighlightId) {
        hlRecolor(hitHighlightId, name);
        updateBubbleColor(name);
        return;
      }
      settings.highlightColor = name;
      api.storage.sync.set({ highlightColor: name });
      applyHighlight(name);
    });
    hlDots.appendChild(dot);
  }
  const sepRm = document.createElement('div');
  sepRm.className = 'hl-sep hl-sep-rm';
  hlDots.appendChild(sepRm);
  const removeBtn = makeIconButton('notif-remove-btn', api.i18n.getMessage('highlightRemove'), [
    { cls: 'ic-unpen', d: ICONS.pen, d2: ICONS.penX }
  ]);
  removeBtn.classList.add('hl-remove');
  hlDots.appendChild(removeBtn);
  hlColors.appendChild(hlDots);
  hlWrap.appendChild(hlBtn);
  hlWrap.appendChild(hlColors);

  const gearBtn = makeIconButton('notif-gear-btn', api.i18n.getMessage('settingsTitle'), [
    { d: ICONS.gear }
  ]);

  notificationElement.appendChild(textSpan);
  notificationElement.appendChild(copyBtn);
  notificationElement.appendChild(linkBtn);
  notificationElement.appendChild(searchBtn);
  notificationElement.appendChild(hlWrap);
  notificationElement.appendChild(gearBtn);

  // Keep the page selection when clicking inside the bubble
  notificationElement.addEventListener('mousedown', (e) => e.preventDefault());

  copyBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    copyText(currentSelectedText, null, 'text');
  });

  linkBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentLinkUrl) copyText(currentLinkUrl, null, 'link');
  });

  searchBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentSelectedText) {
      const base = SEARCH_ENGINES[settings.searchEngine] || SEARCH_ENGINES.google;
      window.open(base + encodeURIComponent(currentSelectedText), '_blank', 'noopener,noreferrer');
    }
  });

  prevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    goToHighlight(-1);
  });
  nextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    goToHighlight(1);
  });

  // The pen opens its menu; picking a color highlights (or recolors), the X removes
  hlBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    hlWrap.classList.toggle('dots-open');
  });

  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (hitHighlightId) hlRemove(hitHighlightId);
    hideNotification();
  });

  gearBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (settingsFrame) {
      closeSettingsPanel();
      return;
    }
    openSettingsPanel();
  });

  shadowRoot.appendChild(notificationElement);
}
