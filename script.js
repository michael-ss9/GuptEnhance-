/* GuptEnhance — client-side image enhancement
   Sab kuch browser mein hota hai: koi server, koi upload nahi. */
(function(){
  'use strict';

  const $ = id => document.getElementById(id);
  const dropZone=$('dropZone'), fileInput=$('fileInput'), controls=$('controls'),
        resultSection=$('resultSection'), enhanceBtn=$('enhanceBtn'), resetBtn=$('resetBtn'),
        strengthInput=$('strength'), strengthVal=$('strengthVal'), upscale2x=$('upscale2x'),
        statusEl=$('status'), compareWrap=$('compareWrap'), beforeImg=$('beforeImg'),
        afterImg=$('afterImg'), beforeClip=$('beforeClip'), cmpSlider=$('cmpSlider'),
        downloadBtn=$('downloadBtn');

  let originalImage=null, originalURL=null;

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
      setStatus(`✅ Image ready: ${w}×${h}px` + (w*h>9000000 ? ' — badi image hai, processing slow ho sakti hai.' : ''));
    };
    originalImage.onerror=()=>setStatus('⚠️ Image load nahi hui — file corrupt ya format support nahi.');
    originalImage.src=originalURL;
  }

  /* ---------- Controls ---------- */
  strengthInput.addEventListener('input', ()=>strengthVal.textContent=strengthInput.value+'%');

  enhanceBtn.addEventListener('click', ()=>{
    if(!originalImage) return;
    setBusy(true);
    setStatus('⏳ Enhance ho raha hai…');
    setTimeout(()=>{
      try{
        const t0=performance.now();
        const result=processImage(originalImage, strengthInput.value/100, upscale2x.checked);
        const t1=performance.now();
        showResult(result);
        setStatus(`✨ Done in ${((t1-t0)/1000).toFixed(1)}s — output: ${result.width}×${result.height}px`);
      }catch(err){
        console.error(err);
        setStatus('❌ Error: image process nahi ho payi. Chhoti image try karo ya page refresh karo.');
      }
      setBusy(false);
    }, 40);
  });

  resetBtn.addEventListener('click', ()=>{
    fileInput.value='';
    originalImage=null;
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

  /* ---------- Processing pipeline ---------- */
  function processImage(img, strength, doUpscale){
    const w=img.naturalWidth, h=img.naturalHeight;
    const src=document.createElement('canvas');
    src.width=w; src.height=h;
    const sctx=src.getContext('2d');
    sctx.drawImage(img,0,0);
    sctx.putImageData(autoLevels(sctx.getImageData(0,0,w,h), strength),0,0);

    if(doUpscale){
      const big=document.createElement('canvas');
      big.width=w*2; big.height=h*2;
      const bctx=big.getContext('2d');
      bctx.imageSmoothingEnabled=true;
      bctx.imageSmoothingQuality='high';
      bctx.drawImage(src,0,0,big.width,big.height);
      const r=Math.max(1,Math.round(w*0.002));
      bctx.putImageData(unsharpMask(bctx.getImageData(0,0,big.width,big.height), r, 0.2+0.5*strength),0,0);
      return big;
    }
    sctx.putImageData(unsharpMask(sctx.getImageData(0,0,w,h), 1, 0.15+0.6*strength),0,0);
    return src;
  }

  /* Auto levels: 1st–99th percentile stretch + contrast + saturation */
  function autoLevels(imageData, strength){
    const d=imageData.data, n=d.length/4;
    const step=Math.max(1,Math.floor(n/50000));
    const lum=[];
    for(let i=0;i<n;i+=step){
      const o=i*4;
      lum.push(0.299*d[o]+0.587*d[o+1]+0.114*d[o+2]);
    }
    lum.sort((a,b)=>a-b);
    const lo=lum[Math.floor(lum.length*0.01)];
    const hi=lum[Math.floor(lum.length*0.99)];
    if(hi-lo<12) return imageData; // already well-exposed
    const range=hi-lo;
    const contrastF=1+0.14*strength;
    const satF=1+0.20*strength;
    for(let i=0;i<d.length;i+=4){
      let r=(d[i]-lo)/range*255,
          g=(d[i+1]-lo)/range*255,
          b=(d[i+2]-lo)/range*255;
      r=(r-128)*contrastF+128; g=(g-128)*contrastF+128; b=(b-128)*contrastF+128;
      const l=0.299*r+0.587*g+0.114*b;
      d[i]=l+(r-l)*satF; d[i+1]=l+(g-l)*satF; d[i+2]=l+(b-l)*satF;
    }
    return imageData;
  }

  /* Unsharp mask: 3-pass box blur (≈gaussian) then add difference */
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

  /* ---------- Result / compare slider ---------- */
  function showResult(canvas){
    resultSection.classList.remove('hidden');
    beforeImg.src=originalURL;
    afterImg.src=canvas.toDataURL('image/jpeg',0.92);
    afterImg.dataset.name=`guptenhance_${canvas.width}x${canvas.height}.jpg`;
    cmpSlider.value=50;
    requestAnimationFrame(syncCompare);
    resultSection.scrollIntoView({behavior:'smooth'});
  }

  function syncCompare(){
    beforeImg.style.width=compareWrap.clientWidth+'px';
    beforeImg.style.height='auto';
    updateClip();
  }
  function updateClip(){ beforeClip.style.width=cmpSlider.value+'%'; }
  cmpSlider.addEventListener('input', updateClip);
  window.addEventListener('resize', ()=>{
    if(!resultSection.classList.contains('hidden')) syncCompare();
  });

  /* ---------- Helpers ---------- */
  function setStatus(msg){ statusEl.textContent=msg; }
  function setBusy(b){
    enhanceBtn.disabled=b;
    enhanceBtn.textContent=b?'⏳ Processing…':'✨ Enhance Karo';
  }
})();
