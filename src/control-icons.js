// A single stroke/grid keeps action symbols legible at touch-control sizes.
const paths = {
  jump: '<circle cx="13" cy="4" r="2"/><path d="m11 8-3 4-4-1m7-3 4 2 4-3m-8 1 1 7-5 3m5-3 5 3 1 3M4 5V1m-2 2 2-2 2 2"/>',
  crawl: '<circle cx="17" cy="9" r="2"/><path d="m14 12-6 1-3 5H2m12-6 3 5h4M8 13l4 5-4 3M2 4h20"/>',
  stand: '<circle cx="12" cy="4" r="2"/><path d="M12 8v7m-5 8 5-8 5 8M6 12l6-4 6 4"/>',
  pickup: '<path d="m4 13 8 4 8-4m-16 0 8-4 8 4v6l-8 4-8-4zm8 4v6M12 1v5m-3-3 3 3 3-3"/>',
  throw: '<path d="m2 17 4-3 4 3-4 3zm8-7c3-7 9-7 12-2m-5-1 5 1-1-5M11 15l2-2"/>',
  action: '<path d="M9 12V5a2 2 0 0 1 4 0v6l2-1 5 3v5l-3 4h-6l-6-7a2 2 0 0 1 3-2l1 1"/>',
  open: '<path d="M4 22V3l13-2v21M4 22h17V5h-4M13 12h.01"/>',
  operate: '<path d="M12 2v8m-6-5a9 9 0 1 0 12 0"/>',
  rescue: '<path d="M12 21 3 12a5 5 0 0 1 9-7 5 5 0 0 1 9 7z"/>',
  exit: '<path d="M9 3H3v18h6m6-16 7 7-7 7M7 12h15"/>',
  back: '<path d="M15 3h6v18h-6M9 5l-7 7 7 7m8-7H2"/>',
  board: '<path d="M3 15h18l-4 6H7zm9 0V2l8 10h-8M2 23l3-1 4 1 3-1 3 1 4-1 3 1"/>',
  possess: '<circle cx="6" cy="5" r="3"/><circle cx="18" cy="5" r="3"/><path d="M2 20v-6a4 4 0 0 1 6-3m14 9v-6a4 4 0 0 0-6-3M6 17h12m-4-4 4 4-4 4"/>',
  return: '<circle cx="7" cy="5" r="3"/><path d="M2 22v-7a5 5 0 0 1 10 0v7m10-5H7m4-4-4 4 4 4M18 3a5 5 0 0 1 0 10"/>',
  cancel: '<path d="m6 6 12 12M6 18 18 6"/>',
  pause: '<path d="M8 4v16M16 4v16"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9 8a3 3 0 0 1 6 0c0 3-3 2-3 5m0 4h.01"/>',
};

export const controlIcon = name => `<svg class="control-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name] || paths.action}</svg>`;
