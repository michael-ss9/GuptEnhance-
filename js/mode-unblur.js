/* ============================================
   GuptEnhance — MODE: Unblur (Blur Fighter)
   Blurry/shaky photos ka last hope — strongest
   multi-pass sharpening. Honest reconstruction.
   ============================================ */
window.GUPT = window.GUPT || {};
GUPT.MODE_INFO = GUPT.MODE_INFO || {};
GUPT.modes = GUPT.modes || {};

GUPT.MODE_INFO.unblur = {emoji:'🔧', name:'Unblur', nick:'Blur Fighter',
  desc:'Blurry/shaky photos ka last hope — strongest multi-pass sharpening. Honest reconstruction.'};

GUPT.modes.unblur = {denoise:0.25, levels:0.9, contrast:0.9, sat:1.20, sharpen:2.2, gamma:0, highlights:0.2, passes:2};
