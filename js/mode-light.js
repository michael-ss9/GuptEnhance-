/* ============================================
   GuptEnhance — MODE: Lighting (Light Magician)
   Dark photos roshan, overexposed control —
   shadows mein detail, highlights balanced.
   ============================================ */
window.GUPT = window.GUPT || {};
GUPT.MODE_INFO = GUPT.MODE_INFO || {};
GUPT.modes = GUPT.modes || {};

GUPT.MODE_INFO.light = {emoji:'💡', name:'Lighting', nick:'Light Magician',
  desc:'Dark photos roshan, overexposed control — shadows mein detail, highlights balanced.'};

GUPT.modes.light = {denoise:0.20, levels:1.0, contrast:0.35, sat:1.15, sharpen:0.8, gamma:0.78, highlights:0.6, passes:1};
