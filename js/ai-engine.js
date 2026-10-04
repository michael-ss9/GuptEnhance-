/* ============================================
   GuptEnhance — AI ENGINE (Real-ESRGAN)
   Browser mein asli AI super-resolution.
   Model: models/realesrgan-x4plus.onnx
   Library: onnxruntime-web (CDN se aati hai)
   ============================================ */
window.GUPT = window.GUPT || {};

(function(){
  'use strict';

  const MODEL_URL = 'models/realesrgan-x4plus.onnx';
  const MAX_INPUT_DIM = 512;
  const TILE = 128;
  const PAD = 16;

  let session = null;
  let loadingPromise = null;
  let spec = null;

  const $ = id => document.getElementById(id);

  function setStatus(msg){
    const el = $('status');
    if(el) el.textContent = msg;
  }

  async function getSession(){
    if(session) return session;
    if(loadingPromise) return loadingPromise;
    if(!window.ort) throw new Error('ONNX library load nahi hui — internet check karo, phir page refresh.');

    loadingPromise = (async () => {
      setStatus('🤖 AI model download ho raha hai (pehli baar ~67MB — WiFi pe karo)…');
      const resp = await fetch(MODEL_URL);
      if(!resp.ok) throw new Error('Model file nahi mili: repo mein models/realesrgan-x4plus.onnx upload karo.');
      const buf = await resp.arrayBuffer();
      setStatus('🤖 AI model load ho raha hai… (10-30 sec)');
      session = await ort.InferenceSession.create(buf, {executionProviders:['wasm']});
      return session;
    })();
    return loadingPromise;
  }

  async function detectSpec(sess){
    if(spec) return spec;
    for(const size of [16, TILE]){
      try{
        const probe = new ort.Tensor('float32', new Float32Array(1*3*size*size), [1,3,size,size]);
        const out = await sess.run({[sess.inputNames[0]]: probe});
        const t = out[sess.outputNames[0]];
        spec = {tile: TILE, scale: Math.max(1, Math.round(t.dims[2]/size))};
        return spec;
      }catch(e){ /* fixed-size model — bada try karo */ }
    }
    throw new Error('Model ka input format samajh nahi aaya.');
  }

  async function enhanceAI(img){
    const sess = await getSession();
    const sp = await detectSpec(sess);

    const w = img.naturalWidth, h = img.naturalHeight;
    const k = Math.min(1, MAX_INPUT_DIM/Math.max(w,h));
    const iw = Math.max(1, Math.round(w*k)), ih = Math.max(1, Math.round(h*k));

    const src = document.createElement('canvas');
    src.width = iw; src.height = ih;
    src.getContext('2d').drawImage(img, 0, 0, iw, ih);
    const srcData = src.getContext('2d').getImageData(0,0,iw,ih).data;

    const ow = iw*sp.scale, oh = ih*sp.scale;
    const out = new ImageData(ow, oh);
    const outData = out.data;

    const T = sp.tile, P = PAD;
    const TW = T+2*P, ARR = TW*TW;
    const inArr = new Float32Array(3*ARR);
    const C1 = ARR, C2 = 2*ARR;
    const inName = sess.inputNames[0], outName = sess.outputNames[0];

    const tilesX = Math.ceil(iw/T), tilesY = Math.ceil(ih/T);
    let done = 0;

    for(let ty=0; ty<tilesY; ty++){
      for(let tx=0; tx<tilesX; tx++){
        let n=0;
        for(let y=0; y<TW; y++){
          const sy = Math.min(ih-1, Math.max(0, ty*T + y - P));
          for(let x=0; x<TW; x++){
            const sx = Math.min(iw-1, Math.max(0, tx*T + x - P));
            const si = (sy*iw + sx)*4;
            inArr[n]    = srcData[si]/255;
            inArr[C1+n] = srcData[si+1]/255;
            inArr[C2+n] = srcData[si+2]/255;
            n++;
          }
        }
        const input = new ort.Tensor('float32', inArr, [1,3,TW,TW]);
        const res = await sess.run({[inName]: input});
        const t = res[outName];
        const td = t.data;
        const os = sp.scale;
        const tOut = TW*os;
        const area = tOut*tOut;
        for(let y=0; y<T*os; y++){
          const oy = ty*T*os + y;
          if(oy>=oh) break;
          for(let x=0; x<T*os; x++){
            const ox = tx*T*os + x;
            if(ox>=ow) break;
            const sy2 = y + P*os, sx2 = x + P*os;
            const ti = sy2*tOut + sx2;
            const oi = (oy*ow + ox)*4;
            outData[oi]   = Math.min(255, Math.max(0, td[ti]*255));
            outData[oi+1] = Math.min(255, Math.max(0, td[ti+area]*255));
            outData[oi+2] = Math.min(255, Math.max(0, td[ti+2*area]*255));
            outData[oi+3] = 255;
          }
        }
        done++;
        setStatus(`🤖 AI enhance: tile ${done}/${tilesX*tilesY}…`);
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = ow; canvas.height = oh;
    canvas.getContext('2d').putImageData(out, 0, 0);
    return canvas;
  }

  function wire(){
    const btn = $('aiBtn');
    if(!btn) return;
    btn.addEventListener('click', async ()=>{
      const orig = window.GUPT && GUPT.getOriginal ? GUPT.getOriginal() : null;
      if(!orig){ setStatus('⚠️ Pehle image upload karo.'); return; }
      btn.disabled = true;
      const oldText = btn.textContent;
      btn.textContent = '⏳ AI…';
      try{
        const result = await enhanceAI(orig.img);
        GUPT.showAIResult(result);
        setStatus(`✨ AI Enhance done — ${result.width}×${result.height}px (asli AI detail!)`);
      }catch(err){
        console.error(err);
        setStatus('❌ AI Error: ' + err.message);
      }
      btn.disabled = false;
      btn.textContent = oldText;
    });
  }
  wire();
})();
        
