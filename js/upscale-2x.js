/* ============================================
   GuptEnhance — UPSCALE: 2x (Fast + Light)
   Double resolution — quick enhance, light
   cleanup. Medium quality photos ke liye best.
   ============================================ */
window.GUPT = window.GUPT || {};
GUPT.UPSCALE_INFO = GUPT.UPSCALE_INFO || {};
GUPT.upscales = GUPT.upscales || {};

GUPT.UPSCALE_INFO['2'] = {nick:'Fast + Light',
  desc:'Double resolution — quick enhance, light cleanup. Medium quality photos ke liye best.'};
GUPT.upscales['2'] = {denoise:0.10, extraSharpen:0.25, passes:1, blurR:1};
