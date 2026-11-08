// content/icons.js - SVG icon shapes (24x24 viewBox) and the helper that builds an icon button

const ICONS = {
  // Clipboard outline shared by the text and link buttons
  clipboard: 'M19 2h-4.18C14.4.84 13.3 0 12 0c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 18H5V4h2v3h10V4h2v16z',
  textLines: 'M8 10h8v1.5H8zM8 13h8v1.5H8zM8 16h5v1.5H8z',
  // Globe: ring (outer circle clockwise, inner counter-clockwise) plus equator and meridian bars
  globe: 'M16.5 14.2a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0zM15.5 14.2a3.5 3.5 0 1 0-7 0 3.5 3.5 0 0 0 7 0zM8.2 13.6h7.6v1.2H8.2zM11.4 9.9h1.2v8.6h-1.2z',
  check: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
  search: 'M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
  up: 'M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6z',
  down: 'M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z',
  pen: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  // The X drawn over the pen on the remove-highlight button
  penX: 'M13.5 11 16.8 14.35 20.1 11 22.6 13.5 19.25 16.8 22.6 20.1 20.1 22.6 16.8 19.25 13.5 22.6 11 20.1 14.35 16.8 11 13.5z',
  close: 'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  gear: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z'
};

const SVG_NS = 'http://www.w3.org/2000/svg';

// paths: [{ d, cls?, d2? }] - one <svg> per entry; d2 is a second shape in its own color (class "x")
function makeIconButton(id, title, paths) {
  const btn = document.createElement('button');
  btn.id = id;
  btn.className = 'icon-btn';
  btn.title = title;
  btn.setAttribute('aria-label', title);
  paths.forEach(({ d, cls, d2 }) => {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    if (cls) svg.setAttribute('class', cls);
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    svg.appendChild(path);
    if (d2) {
      const extra = document.createElementNS(SVG_NS, 'path');
      extra.setAttribute('d', d2);
      extra.setAttribute('class', 'x');
      svg.appendChild(extra);
    }
    btn.appendChild(svg);
  });
  return btn;
}
