/* Bulk watermarking — client-only */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const state = {
  images: [], // {file, url, imgEl, canvas, ctx}
  watermark: null, // HTMLImageElement
  settings: {
    sizePct: 20,
    opacity: 0.9,
    corner: 'top-right',
    offsetX: -20,
    offsetY: 20,
    allowDrag: false,
    drag: { active:false, x:0, y:0 }
  }
};

// UI elements
const inputImages = $('#input-images');
const inputWatermark = $('#input-watermark');
const countImages = $('#count-images');
const gallery = $('#gallery');
const results = $('#results');

const sizePct = $('#sizePct');
const sizePctOut = $('#sizePctOut');
const opacity = $('#opacity');
const opacityOut = $('#opacityOut');
const corner = $('#corner');
const offsetX = $('#offsetX');
const offsetY = $('#offsetY');
const allowDrag = $('#allowDrag');

const applyAllBtn = $('#applyAll');
const downloadAllBtn = $('#downloadAll');
const resetBtn = $('#resetBtn');

// Helpers
function loadImageFromURL(url){
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function initWatermark(){
  if (state.watermark) return;
  state.watermark = await loadImageFromURL('assets/watermark.png');
}

function readableSize(bytes){
  const units = ['B','KB','MB','GB'];
  let i = 0; let b = bytes;
  while(b>=1024 && i<units.length-1){ b/=1024; i++; }
  return `${b.toFixed(1)} ${units[i]}`;
}

function addThumb(file, url){
  const wrap = document.createElement('div');
  wrap.className = 'thumb';
  const img = document.createElement('img');
  img.alt = file.name;
  img.src = url;
  wrap.appendChild(img);
  gallery.appendChild(wrap);
}

function addResultCard(canvas, filename){
  const card = document.createElement('div');
  card.className = 'result-card';
  const prev = document.createElement('div');
  prev.className = 'result-preview';
  prev.appendChild(canvas);

  // drag handling for first preview (apply to global offsets)
  if (allowDrag.checked){
    enableDrag(prev, canvas);
  }

  const actions = document.createElement('div');
  actions.className = 'result-actions';

  const dl = document.createElement('button');
  dl.className = 'btn';
  dl.textContent = 'Download';
  dl.onclick = () => {
    canvas.toBlob((blob) => {
      const a = document.createElement('a');
      a.download = filename;
      a.href = URL.createObjectURL(blob);
      a.click();
    }, 'image/png', 0.95);
  };

  const info = document.createElement('div');
  info.className = 'btn ghost';
  info.textContent = filename;

  actions.appendChild(dl);
  actions.appendChild(info);

  card.appendChild(prev);
  card.appendChild(actions);
  results.appendChild(card);
}

function computePosition(imgW, imgH, wmW, wmH){
  // Base position for placement
  let x=0, y=0;
  const c = state.settings.corner;
  if (c === 'top-left'){ x = 0; y = 0; }
  if (c === 'top-right'){ x = imgW - wmW; y = 0; }
  if (c === 'bottom-left'){ x = 0; y = imgH - wmH; }
  if (c === 'bottom-right'){ x = imgW - wmW; y = imgH - wmH; }
  if (c === 'center'){ x = (imgW - wmW)/2; y = (imgH - wmH)/2; }

  x += Number(offsetX.value || 0);
  y += Number(offsetY.value || 0);
  return {x,y};
}

function drawWatermarkOnCanvas(baseImg, wmImg){
  const cnv = document.createElement('canvas');
  const ctx = cnv.getContext('2d');
  const w = baseImg.naturalWidth;
  const h = baseImg.naturalHeight;
  cnv.width = w; cnv.height = h;

  // draw base image
  ctx.drawImage(baseImg, 0, 0, w, h);

  // scale watermark
  const pct = Number(sizePct.value);
  const targetW = Math.max(8, Math.round(w * (pct/100)));
  const aspect = wmImg.naturalHeight / wmImg.naturalWidth;
  const targetH = Math.round(targetW * aspect);

  const {x,y} = computePosition(w, h, targetW, targetH);

  ctx.globalAlpha = Number(opacity.value)/100;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(wmImg, x, y, targetW, targetH);
  ctx.globalAlpha = 1.0;

  return cnv;
}

function enableDrag(container, canvas){
  let isDown = false;
  let start = {x:0, y:0};
  container.onpointerdown = (e)=>{
    isDown = true;
    start = {x: e.clientX, y: e.clientY};
    container.setPointerCapture(e.pointerId);
  };
  container.onpointermove = (e)=>{
    if(!isDown) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    start = {x: e.clientX, y: e.clientY};
    // Update offsets globally
    offsetX.value = Number(offsetX.value) + dx;
    offsetY.value = Number(offsetY.value) + dy;
    renderAllPreviews(); // refresh
  };
  container.onpointerup = ()=>{ isDown=false; };
  container.onpointercancel = ()=>{ isDown=false; };
}

// Load images
inputImages.addEventListener('change', async (e)=>{
  gallery.innerHTML = '';
  results.innerHTML = '';
  const files = Array.from(e.target.files || []);
  state.images = [];
  await initWatermark();
  countImages.textContent = files.length;

  for (const file of files){
    const url = URL.createObjectURL(file);
    addThumb(file, url);
    const img = await loadImageFromURL(url);
    state.images.push({file, url, img});
  }
  renderAllPreviews();
});

// Watermark override
inputWatermark.addEventListener('change', async (e)=>{
  const file = e.target.files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  state.watermark = await loadImageFromURL(url);
  renderAllPreviews();
});

// Controls
function attachRange(rangeEl, outEl, fmt = (v)=>v){
  const update = () => { outEl.textContent = fmt(rangeEl.value); renderAllPreviews(); };
  rangeEl.addEventListener('input', update);
  update();
}
attachRange(sizePct, sizePctOut, (v)=> `${v}%`);
attachRange(opacity, opacityOut, (v)=> (Number(v)/100).toFixed(2));

corner.addEventListener('change', renderAllPreviews);
offsetX.addEventListener('change', renderAllPreviews);
offsetY.addEventListener('change', renderAllPreviews);
allowDrag.addEventListener('change', renderAllPreviews);

function renderAllPreviews(){
  if (!state.images.length || !state.watermark) return;
  results.innerHTML = '';
  for (const item of state.images){
    const cnv = drawWatermarkOnCanvas(item.img, state.watermark);
    const name = item.file ? item.file.name.replace(/\.(\w+)$/i, '_wm.png') : 'image_wm.png';
    addResultCard(cnv, name);
  }
}

// Process & download all
applyAllBtn.addEventListener('click', renderAllPreviews);

downloadAllBtn.addEventListener('click', async ()=>{
  const zipAvailable = typeof JSZip !== 'undefined' && typeof saveAs !== 'undefined';
  if (!zipAvailable){
    alert('ZIP library not loaded. You can still download images one by one.');
    return;
  }
  if (!state.images.length) return;

  const zip = new JSZip();
  const folder = zip.folder('watermarked');

  // ensure previews are up-to-date
  renderAllPreviews();

  const canvases = $$('.result-preview canvas');
  for (let i=0; i<canvases.length; i++){
    const canvas = canvases[i];
    const baseName = state.images[i]?.file?.name || `image_${i+1}.png`;
    const outName = baseName.replace(/\.(\w+)$/i, '_wm.png');
    const blob = await new Promise(res => canvas.toBlob(res, 'image/png', 0.95));
    const buff = await blob.arrayBuffer();
    folder.file(outName, buff);
  }

  const content = await zip.generateAsync({type: 'blob'});
  saveAs(content, 'watermarked_images.zip');
});

resetBtn.addEventListener('click', (e)=>{
  e.preventDefault();
  inputImages.value = '';
  inputWatermark.value = '';
  state.images = [];
  state.watermark = null;
  countImages.textContent = '0';
  gallery.innerHTML = '';
  results.innerHTML = '';
  sizePct.value = 20; sizePctOut.textContent = '20%';
  opacity.value = 90; opacityOut.textContent = '0.90';
  corner.value = 'top-right';
  offsetX.value = -20; offsetY.value = 20;
  allowDrag.checked = false;
  initWatermark();
});

// Initialize default watermark if user doesn't pick one
initWatermark();
