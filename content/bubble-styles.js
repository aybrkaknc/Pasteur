// content/bubble-styles.js - CSS of the bubble, the pen menu, touch sizes and the settings panel (shadow DOM).
// The sections are joined in this order; later sections can override earlier ones.

// Bubble: container, icon buttons, copy/link states, visibility
const BUBBLE_STYLES = `
  #pasteur-notif {
    position: fixed;
    color: #ffffff;
    padding: 4px;
    height: 40px;
    border-radius: 12px;
    z-index: 2147483647;
    opacity: 0;
    transform: scale(0.9) translateY(10px) translateX(-50%);
    transition: opacity 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275),
                transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    pointer-events: auto;
    box-shadow: 0 12px 24px -6px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.15);
    display: flex;
    align-items: center;
    gap: 2px;
    left: 50%;
  }

  /* Screen-reader only status text */
  .notif-text {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  .icon-btn {
    cursor: pointer;
    background: transparent;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border-radius: 8px;
    transition: background-color 0.2s ease;
    user-select: none;
  }

  .icon-btn:hover { background-color: rgba(255, 255, 255, 0.12); }
  .icon-btn:focus-visible { outline: 2px solid #5fa8ff; outline-offset: -2px; }

  .icon-btn svg {
    width: 18px;
    height: 18px;
    fill: #ffffff;
    display: block;
  }

  /* Copy buttons: clipboard icon, check mark on the button that was used after a successful copy */
  .icon-btn svg.ic-check { display: none; fill: #66d17a; }
  #pasteur-notif.success.via-text #notif-copy-btn .ic-clip,
  #pasteur-notif.success.via-link #notif-link-btn .ic-link { display: none; }
  #pasteur-notif.success.via-text #notif-copy-btn .ic-check,
  #pasteur-notif.success.via-link #notif-link-btn .ic-check { display: block; }
  #pasteur-notif.error .ic-clip,
  #pasteur-notif.error .ic-link { fill: #ff8a80; }
  #pasteur-notif:not(.has-link) #notif-link-btn { display: none; }

  /* States */
  #pasteur-notif.success,
  #pasteur-notif.offer { background-color: #1a1c1e; }
  #pasteur-notif.error { background-color: #2c1a1a; border-color: rgba(255, 0, 0, 0.2); }
  #pasteur-notif.show { opacity: 1; transform: scale(1) translateY(0) translateX(-50%); }
  #pasteur-notif.hide { pointer-events: none; opacity: 0; transform: scale(0.95) translateY(-5px) translateX(-50%); }
`;

// Pen menu: up/down, color dots, remove
const PEN_MENU_STYLES = `
  /* Highlight pen: always a pen in the current color; its menu holds colors, remove and up/down */
  .hl-wrap { position: relative; display: flex; }
  #notif-hl-btn svg.ic-pen,
  .icon-btn svg.ic-unpen { fill: var(--hl, #ffd60a); }
  /* Remove button: the pen with a bright X and a bubble-colored halo so the X stands out */
  .ic-unpen .x { fill: #ff5252; stroke: #1a1c1e; stroke-width: 1.6px; paint-order: stroke; stroke-linejoin: round; }
  #pasteur-notif.no-hl .hl-wrap { display: none; }
  /* Menu parts by state: remove only on a clicked highlight, up/down only if there is somewhere to go */
  #pasteur-notif:not(.on-highlight) .hl-remove,
  #pasteur-notif:not(.on-highlight) .hl-sep-rm,
  #pasteur-notif:not(.has-nav) .nav-btn,
  #pasteur-notif:not(.has-nav) .hl-sep-nav { display: none; }

  /* Color picker above the pen (below it when the bubble is near the top edge) */
  .hl-colors {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%) translateY(4px);
    padding-bottom: 8px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease, transform 0.2s ease;
  }
  #pasteur-notif.dots-below .hl-colors {
    bottom: auto;
    top: 100%;
    padding-bottom: 0;
    padding-top: 8px;
    transform: translateX(-50%) translateY(-4px);
  }
  .hl-wrap.dots-open .hl-colors {
    opacity: 1;
    pointer-events: auto;
    transform: translateX(-50%);
  }
  .hl-dots {
    display: flex;
    gap: 6px;
    padding: 6px 8px;
    background: #1a1c1e;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 10px;
    box-shadow: 0 8px 16px -6px rgba(0, 0, 0, 0.3);
  }
  .hl-dots { align-items: center; }
  .hl-dots .icon-btn { width: 28px; height: 28px; border-radius: 8px; }
  .hl-sep { width: 1px; height: 18px; background: rgba(255, 255, 255, 0.2); }
  .hl-dot {
    width: 16px;
    height: 16px;
    padding: 0;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    transition: transform 0.15s ease;
  }
  .hl-dot:hover { transform: scale(1.15); }
  .hl-dot.active { border-color: #ffffff; }
  .hl-dot:focus-visible { outline: 2px solid #5fa8ff; outline-offset: 1px; }
`;

// Touch screens: larger targets for the bubble and its menu
const TOUCH_STYLES = `
  /* Touch screens: larger targets */
  @media (pointer: coarse) {
    #pasteur-notif { height: 52px; border-radius: 14px; }
    .icon-btn { width: 44px; height: 44px; border-radius: 10px; }
    .icon-btn svg { width: 22px; height: 22px; }
    .hl-dots { gap: 10px; padding: 8px 10px; }
    .hl-dots .icon-btn { width: 44px; height: 44px; }
    .hl-dot { width: 28px; height: 28px; }
  }
`;

// In-page settings panel and the caret pointing at the gear
const PANEL_STYLES = `
  #pasteur-panel {
    position: fixed;
    width: 340px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    background: #1a1c1e;
    box-shadow: 0 12px 24px -6px rgba(0, 0, 0, 0.3);
    z-index: 2147483647;
    color-scheme: dark;
    opacity: 0;
    transition: opacity 0.25s ease,
                transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275),
                height 0.2s ease;
  }
  /* Slide in from the bubble's direction */
  #pasteur-panel.side-below { transform: translateY(-8px) scale(0.96); transform-origin: top center; }
  #pasteur-panel.side-above { transform: translateY(8px) scale(0.96); transform-origin: bottom center; }
  #pasteur-panel.side-right { transform: translateX(-8px) scale(0.96); transform-origin: center left; }
  #pasteur-panel.side-left { transform: translateX(8px) scale(0.96); transform-origin: center right; }
  #pasteur-panel.open { opacity: 1; transform: none; }

  /* Caret linking the panel to the gear; drawn over the panel border, pointing at the bubble */
  #pasteur-arrow {
    position: fixed;
    width: 12px;
    height: 12px;
    background: #1a1c1e;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-right: none;
    border-bottom: none;
    z-index: 2147483647;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.25s ease 0.05s;
  }
  #pasteur-arrow.side-below { transform: rotate(45deg); }
  #pasteur-arrow.side-above { transform: rotate(225deg); }
  #pasteur-arrow.side-right { transform: rotate(-45deg); }
  #pasteur-arrow.side-left { transform: rotate(135deg); }
  #pasteur-arrow.open { opacity: 1; }
`;

const NOTIF_STYLES = BUBBLE_STYLES + PEN_MENU_STYLES + TOUCH_STYLES + PANEL_STYLES;
