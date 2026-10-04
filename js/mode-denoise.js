/* ============================================
   GuptEnhance — MODE: Denoise (Cleanup Expert)
   Grain aur color noise hatata hai — texture
   aur edges bilkul safe. Low-light photos rescue.
   ============================================ */
window.GUPT = window.GUPT || {};
GUPT.MODE_INFO = GUPT.MODE_INFO || {};
GUPT.modes = GUPT.modes || {};

GUPT.MODE_INFO.denoise = {emoji:'🌫️', name:'Denoise', nick:'Cleanup Expert',
  desc:'Grain aur color noise hatata hai — texture aur edges bilkul safe. Low-light photos rescue.'};

GUPT.modes.denoise = {denoise:0.75, levels:0.6, contrast:0.4, sat:1.10, sharpen:0.6, gamma:0, highlights:0.1, passes:1};
