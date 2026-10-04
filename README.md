# GuptEnhance-
✨ GuptEnhance

100% Free Image Enhancer — sab processing aapke browser mein hoti hai.
Koi server nahi, koi upload nahi, koi limit nahi, koi watermark nahi.

Features
- Auto brightness/contrast fix (histogram stretching)
- Color boost (saturation)
- Smart sharpening (unsharp mask)
- Optional 2x upscaling
- Before/After comparison slider
- Instant download — koi sign-up nahi

GitHub Pages pe Deploy Kaise Karein (5 minute)

1. github.com pe jao → New repository → naam: `guptenhance` → Public → Create
2. "uploading an existing file" pe click karo → ye 3 files upload karo:
   - `index.html`
   - `style.css`
   - `script.js`
   - Commit changes
3. Repo mein Settings → Pages pe jao
4. Source: Deploy from a branch → Branch: `main` → Folder: `/(root)` → Save
5. 2–3 minute mein site live: `https://<aapka-username>.github.io/guptenhance/`

Roadmap (future versions)
- Real AI upscaling (Real-ESRGAN via ONNX Runtime Web)
- Batch processing (multiple images)
- Noise removal (denoising)
- Custom domain

Note
Ye v1 hai — enhancement classic image-processing pipeline se hota hai.
Asli "AI" (deep learning) model wala version v2 mein aa sakta hai
(Real-ESRGAN browser mein chalta hai, 2-4MB model file GitHub repo mein rakhni hogi).
