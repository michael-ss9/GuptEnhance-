/* GuptEnhance v3 — mobile-first
   5 enhancement modes + 2x/4x/8x upscale + drag-to-compare
   Sab processing browser mein: koi server, koi upload nahi. */
(function(){
  'use strict';

  const $ = id => document.getElementById(id);
  const dropZone=$('dropZone'), fileInput=$('fileInput'), controls=$('controls'),
        resultSection=$('resultSection'), enhanceBtn=$('enhanceBtn'), resetBtn=$('resetBtn'),
        statusEl=$('status'), thumb=$('thumb'), previewName=$('previewName'),
        previewDims=$('previewDims'), scaleHint=$('scaleHint'),
        compareWrap=$('compareWrap'), beforeImg=$('beforeImg'), afterImg=$('afterImg'),
        beforeClip=$('beforeClip'), compareLine=$('compareLine'),
        compareHandle=$('compareHandle'), downloadBtn=$('downloadBtn');

  /* Mode presets: sat ab direct multiplier hai (0=grayscale, 1=unchanged) */
  const MODES={
    hd:      {denoise:0.15, levels:0.8, contrast:0.6, sat:1.40, sharpen:1.0, gamma:0},
    ultra:   {denoise:0.25, levels:1.0, contrast:1.0, sat:1.50, sharpen:1.6, gamma:0},
    denoise: {denoise:0.65, levels:0.7, contrast:0.5, sat:1.25, sharpen:0.7, gamma:0},
    text:    {denoise:0.20, levels:1.0, contrast:1.3, sat:0.00, sharpen:1.8, gamma:0},
    light:   {denoise:0.10, levels:1.1, contrast:0.3, sat:1.35, sharpen:0.8, gamma:0.80}
  };

  /* Browser/mobile safe output cap (~24 megapixels) */
  const MAX_OUT_PIXELS=24000000;

  let originalImage=null, originalURL=null;
  let selectedMode='hd', selectedMult=1;

  /* ---------- Mode / scale chips ---------- */
  document.querySelectorAll('#modeChips .chip').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('#modeChips .chip').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      selectedMode=btn.dataset.mode;
    });
  });
  document.querySelectorAll('#scaleChips .chip').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('#scaleChips .chip').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      selectedMult=parseInt(btn.dataset.mult,10);
      updateScaleHint();
    });
  });

  /* ---------- Upload ---------- */
  dropZone.addEventListener('click', ()=>fileInput.click());
  dropZone.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){e.preventDefault();fileInput.click();} });
  fileInput.addEventListener('change', e=>handleFile(e.target.files[0]));
  ['dragenter','dragover'].forEach(ev=>dropZone.addEventListener(ev,e=>{
    e.preventDefault();dropZone.classList.add('drag');
  }));
  ['dragleave','drop'].forEach(ev=>dropZone.addEventListener(ev,e=>{
    e.preventDefault();dropZone.classList.remove('drag');
  }));
  dropZone.addEventListener('drop', e=>handleFile(e.dataTransfer.files[0]));

  function handleFile(file){
    if(!file || !file.type.startsWith('image/')){ setStatus('⚠️ Sirf image file daalo (JPG / PNG / WebP).'); return; }
    if(originalURL) URL.revokeObjectURL(originalURL);
    originalURL=URL.createObjectURL(file);
    originalImage=new Image();
    originalImage.onload=()=>{
      const w=originalImage.naturalWidth, h=originalImage.naturalHeight;
      controls.classList.remove('hidden');
      resultSection.classList.add('hidden');
      thumb.src=originalURL;
      previewName.textContent=file.name;
      previewDims.textContent=`${w} × ${h}px`;
      updateScaleHint();
      setStatus('✅ Image ready — mode aur upscale select karo, phir Enhance dabao.');
    };
    originalImage.onerror=()=>setStatus('⚠️ Image load nahi hui — file corrupt ya format support nahi.');
    originalImage.src=originalURL;
  }

  function updateScaleHint(){
    if(!originalImage) return;
    const w=originalImage.naturalWidth, h=originalImage.naturalHeight;
    const outW=w*selectedMult, outH=h*selectedMult;
    let msg=`Output: ${outW}×${outH}px`;
    if(outW*outH>MAX_OUT_PIXELS) msg+=' — bahut bada hai, auto-adjust ho jayega';
    scaleHint.textContent=msg;
  }

  /* ---------- Enhance ---------- */
  enhanceBtn.addEventListener('click', ()=>{
    if(!originalImage) return;
    setBusy(true);
    setStatus('⏳ Enhance ho raha hai… thoda wait karo');
    setTimeout(()=>{
      try{
        const w=originalImage.naturalWidth, h=originalImage.naturalHeight;
        let mult=selectedMult, adjusted=false;
        while(mult>1 && w*h*mult*mult>MAX_OUT_PIXELS){ mult/=2; adjusted=true; }
        const t0=performance.now();
        const result=processImage(originalImage, MODES[selectedMode], mult);
        const t1=performance.now();
        showResult(result, mult);
        setStatus(`✨ Done in ${((t1-t0)/1000).toFixed(1)}s — ${result.width}×${result.height}px` +
                  (adjusted?` (bada upscale tha, auto ${mult}x kiya)`:''));
      }catch(err){
        console.error(err);
        setStatus('❌ Error: image process nahi ho payi. Chhoti image try karo.');
      }
      setBusy(false);
    }, 40);
  });

  resetBtn.addEventListener('click', ()=>{
    fileInput.value='';
    originalImage=null;
    thumb.src='';
    controls.classList.add('hidden');
    resultSection.classList.add('hidden');
    setStatus('Koi image upload nahi hui abhi.');
    window.scrollTo({top:0,behavior:'smooth'});
  });

  downloadBtn.addEventListener('click', ()=>{
    const a=document.createElement('a');
    a.href=afterImg.src;
    a.download=afterImg.dataset.name||'guptenhance.jpg';
    document.body.appendChild(a); a.click(); a.remove();
  });

  /* ---------- Pipeline ---------- */
  function processImage(img, cfg, mult){
    const w=img.naturalWidth, h=img.naturalHeight;
    const src=document.createElement('canvas');
    src.width=w; src.height=h;
    const sctx=src.getContext('2d');
    sctx.drawImage(img,0,0);
    sctx.putImageData(enhanceBase(sctx.getImageData(0,0,w,h), cfg),0,0);

    if(mult>1){
      const big=document.createElement('canvas');
      big.width=w*mult; big.height=h*mult;
      const bctx=big.getContext('2d');
      bctx.imageSmoothingEnabled=true;
      bctx.imageSmoothingQuality='high';
      bctx.drawImage(src,0,0,big.width,big.height);
      const r=Math.max(1,Math.round(mult/2));
      let bd=bctx.getImageData(0,0,big.width,big.height);
      bd=blendBlur(bd, r, 0.10);
      bd=unsharpMask(bd, r, 0.35+0.55*cfg.sharpen);
      bctx.putImageData(bd,0,0);
      return big;
    }

    let d=sctx.getImageData(0,0,w,h);
    if(cfg.denoise>0) d=blendBlur(d, 1, cfg.denoise);
    d=unsharpMask(d, 2, 0.30+0.55*cfg.sharpen);
    sctx.putImageData(d,0,0);
    return src;
  }

  /* Base enhancement: levels stretch + gamma + S-curve contrast + saturation */
  function enhanceBase(imageData, cfg){
    const d=imageData.data, n=d.length/4;
    const step=Math.max(1,Math.floor(n/50000));
    const lum=new Array(Math.ceil(n/step));
    let li=0;
    for(let i=0;i<n;i+=step){
      const o=i*4;
      lum[li++]=0.299*d[o]+0.587*d[o+1]+0.114*d[o+2];
    }
    lum.length=li;
    lum.sort((a,b)=>a-b);
    const lo=lum[Math.floor(li*0.01)];
    const hi=lum[Math.floor(li*0.99)];
    const span=hi-lo;

    // Flat image pe levels stretch kharab karega — skip
    const s=span<10 ? 0 : Math.min(1, 0.30+0.90*cfg.levels);
    const range=Math.max(span,1);
    const contrastF=0.35*cfg.contrast;
    const satF=cfg.sat;
    const gamma=cfg.gamma||0;

    for(let i=0;i<d.length;i+=4){
      let r=d[i], g=d[i+1], b=d[i+2];

      r=r+(((r-lo)/range*255)-r)*s;
      g=g+(((g-lo)/range*255)-g)*s;
      b=b+(((b-lo)/range*255)-b)*s;

      if(gamma){
        r=255*Math.pow(Math.max(r,0)/255,gamma);
        g=255*Math.pow(Math.max(g,0)/255,gamma);
        b=255*Math.pow(Math.max(b,0)/255,gamma);
      }

      r=(r/255-0.5)*(1+contrastF)+0.5; r*=255;
      g=(g/255-0.5)*(1+contrastF)+0.5; g*=255;
      b=(b/255-0.5)*(1+contrastF)+0.5; b*=255;

      const l=0.299*r+0.587*g+0.114*b;
      r=l+(r-l)*satF;
      g=l+(g-l)*satF;
      b=l+(b-l)*satF;

      d[i]  =r<0?0:r>255?255:r;
      d[i+1]=g<0?0:g>255?255:g;
      d[i+2]=b<0?0:b>255?255:b;
    }
    return imageData;
  }

  /* Blend blurred version into image (noise reduction) */
  function blendBlur(imageData, radius, amount){
    const {data,width,height}=imageData;
    const blurred=boxBlur(data,width,height,radius);
    const keep=1-amount;
    for(let i=0;i<data.length;i+=4){
      data[i]  =data[i]  *keep+blurred[i]  *amount;
      data[i+1]=data[i+1]*keep+blurred[i+1]*amount;
      data[i+2]=data[i+2]*keep+blurred[i+2]*amount;
    }
    return imageData;
  }

  /* Separable box blur */
  function boxBlur(src,w,h,radius){
    const tmp=new Float32Array(w*h*4), dst=new Uint8ClampedArray(w*h*4);
    const r=radius;
    for(let y=0;y<h;y++){
      const row=y*w*4;
      let s0=0,s1=0,s2=0,s3=0;
      for(let x=-r;x<=r;x++){
        const o=row+Math.min(w-1,Math.max(0,x))*4;
        s0+=src[o];s1+=src[o+1];s2+=src[o+2];s3+=src[o+3];
      }
      const c=2*r+1;
      for(let x=0;x<w;x++){
        const o=row+x*4;
        tmp[o]=s0/c;tmp[o+1]=s1/c;tmp[o+2]=s2/c;tmp[o+3]=s3/c;
        const oa=row+Math.min(w-1,x+r+1)*4, os=row+Math.max(0,x-r)*4;
        s0+=src[oa]-src[os];s1+=src[oa+1]-src[os+1];
        s2+=src[oa+2]-src[os+2];s3+=src[oa+3]-src[os+3];
      }
    }
    for(let x=0;x<w;x++){
      let s0=0,s1=0,s2=0,s3=0;
      for(let y=-r;y<=r;y++){
        const o=Math.min(h-1,Math.max(0,y))*w*4+x*4;
        s0+=tmp[o];s1+=tmp[o+1];s2+=tmp[o+2];s3+=tmp[o+3];
      }
      const c=2*r+1;
      for(let y=0;y<h;y++){
        const o=y*w*4+x*4;
        dst[o]=s0/c;dst[o+1]=s1/c;dst[o+2]=s2/c;dst[o+3]=s3/c;
        const oa=Math.min(h-1,y+r+1)*w*4+x*4, os=Math.max(0,y-r)*w*4+x*4;
        s0+=tmp[oa]-tmp[os];s1+=tmp[oa+1]-tmp[os+1];
        s2+=tmp[oa+2]-tmp[os+2];s3+=tmp[oa+3]-tmp[os+3];
      }
    }
    return dst;
  }

  function unsharpMask(imageData, radius, amount){
    const {data,width,height}=imageData;
    const blurred=boxBlur(data,width,height,radius);
    for(let i=0;i<data.length;i+=4){
      data[i]  =data[i]  +(data[i]  -blurred[i])  *amount;
      data[i+1]=data[i+1]+(data[i+1]-blurred[i+1])*amount;
      data[i+2]=data[i+2]+(data[i+2]-blurred[i+2])*amount;
    }
    return imageData;
  }

  /* ---------- Result / drag compare ---------- */
  function showResult(canvas, mult){
    resultSection.classList.remove('hidden');
    beforeImg.src=originalURL;
    afterImg.src=canvas.toDataURL('image/jpeg',0.92);
    afterImg.dataset.name=`guptenhance-${selectedMode}-${mult}x-${canvas.width}x${canvas.height}.jpg`;
    requestAnimationFrame(syncCompare);
    resultSection.scrollIntoView({behavior:'smooth'});
  }

  function syncCompare(){
    beforeImg.style.width=compareWrap.clientWidth+'px';
    beforeImg.style.height='auto';
    setCompare(50);
  }
  function setCompare(pct){
    pct=Math.max(0,Math.min(100,pct));
    beforeClip.style.width=pct+'%';
    compareHandle.style.left=pct+'%';
    compareLine.style.left=pct+'%';
  }
  let dragging=false;
  function compareFromX(clientX){
    const rect=compareWrap.getBoundingClientRect();
    setCompare((clientX-rect.left)/rect.width*100);
  }
  compareWrap.addEventListener('pointerdown',e=>{
    dragging=true;
    try{compareWrap.setPointerCapture(e.pointerId);}catch(_){}
    compareFromX(e.clientX);
  });
  compareWrap.addEventListener('pointermove',e=>{
    if(dragging) compareFromX(e.clientX);
  });
  ['pointerup','pointercancel'].forEach(ev=>compareWrap.addEventListener(ev,()=>dragging=false));
  window.addEventListener('resize',()=>{
    if(!resultSection.classList.contains('hidden')) syncCompare();
  });

  /* ---------- Helpers ---------- */
  function setStatus(msg){ statusEl.textContent=msg; }
  function setBusy(b){
    enhanceBtn.disabled=b;
    enhanceBtn.textContent=b?'⏳ Processing…':'✨ Enhance Karo';
  }
})();
         
