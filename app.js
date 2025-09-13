/**********************************************************
 * KM0 – Front JS (Cloudinary + Apps Script)
 **********************************************************/
const CLOUD_NAME      = "drhkixsov";
const UPLOAD_PRESET   = "km0_public";
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxEn9EIxVBKVbXbrv4BrRhm7kRZHalUtWUU66jbtY80scAkRdqZQSztQfnDt7G0GrUU/exec";
const API_SECRET      = "km0";

/* --------- UI: abrir/cerrar formulario --------- */
const joinSec = document.getElementById('join');
document.getElementById('ctaLink')?.addEventListener('click', (e)=>{
  e.preventDefault();
  joinSec.classList.toggle('open');
  joinSec.setAttribute('aria-hidden', joinSec.classList.contains('open') ? 'false' : 'true');
  if (joinSec.classList.contains('open')) joinSec.scrollIntoView({ behavior:'smooth', block:'center' });
});

/* --------- Vista previa --------- */
const fileInput = document.querySelector('input[name="foto"]');
const preview   = document.getElementById('preview');
fileInput?.addEventListener('change', ()=>{
  const f = fileInput.files[0];
  preview.src = f ? URL.createObjectURL(f) : '';
});

/* --------- Subida a Cloudinary --------- */
async function uploadToCloudinary(file){
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', UPLOAD_PRESET);
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  const res = await fetch(url, { method:'POST', body: fd });
  if(!res.ok) throw new Error('Cloudinary: ' + (await res.text().catch(()=>res.status)));
  const j = await res.json();
  if(!j.secure_url) throw new Error('Cloudinary no devolvió URL');
  return j.secure_url;
}

/* --------- Envío a Apps Script (FormData, sin headers) --------- */
document.getElementById('joinForm')?.addEventListener('submit', async (ev)=>{
  ev.preventDefault();
  const f   = ev.currentTarget;
  const msg = document.getElementById('joinMsg');
  const btn = f.querySelector('button[type="submit"]');

  try{
    btn.disabled = true;
    msg.textContent = 'Subiendo foto...';
    const file = f.foto.files[0];
    if(!file) throw new Error('Selecciona una imagen');
    const fotoUrl = await uploadToCloudinary(file);

    msg.textContent = 'Guardando datos...';
    const fd2 = new FormData();
    fd2.append('secret', API_SECRET);
    fd2.append('nombre', f.nombre.value.trim());
    fd2.append('red_social', f.red_social.value);
    fd2.append('usuario', '@' + f.usuario.value.replace(/^@/,'').trim());
    fd2.append('ciudad', f.ciudad.value.trim());
    fd2.append('pais',   f.pais.value.trim());
    fd2.append('foto',   fotoUrl);

    const r = await fetch(APPS_SCRIPT_URL, { method:'POST', body: fd2 });
    if(!r.ok) throw new Error(`Apps Script ${r.status}`);
    const out = await r.json().catch(()=> ({}));
    if(out.ok !== true) throw new Error(out.error || 'No se pudo guardar');

    msg.textContent = '¡Enviado! Tu alta queda pendiente de aprobación.';
    f.reset(); preview.src='';
    setTimeout(()=> joinSec.classList.remove('open'), 1500);
  }catch(err){
    console.error(err);
    msg.textContent = 'Error: ' + err.message;
  }finally{
    btn.disabled = false;
  }
});

/* --------- Poblado de países + sugerencias --------- */
const COUNTRIES = [/* … (tu lista igual que antes) … */];
function populateCountries(){
  const sel = document.getElementById('pais');
  if(!sel) return;
  const frag = document.createDocumentFragment();
  COUNTRIES.forEach(c=>{
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    frag.appendChild(opt);
  });
  sel.appendChild(frag);
}
document.addEventListener('DOMContentLoaded', populateCountries);

const CITY_SUGGESTIONS = { /* … (tu objeto igual que antes) … */ };
function updateCitySuggestions(){
  const selPais = document.getElementById('pais');
  const dl = document.getElementById('ciudadSuggestions');
  const inputCiudad = document.getElementById('ciudad');
  if(!selPais || !dl) return;
  const list = CITY_SUGGESTIONS[selPais.value] || [];
  dl.innerHTML = '';
  if(list.length){
    const frag = document.createDocumentFragment();
    list.forEach(c=>{
      const opt = document.createElement('option');
      opt.value = c; frag.appendChild(opt);
    });
    dl.appendChild(frag);
    inputCiudad.placeholder = "Empieza a escribir o elige de la lista…";
  }else{
    inputCiudad.placeholder = "Escribe tu ciudad";
  }
}
document.getElementById('pais')?.addEventListener('change', updateCitySuggestions);
document.addEventListener('DOMContentLoaded', updateCitySuggestions);

/* --------- Iconos SVG pequeños --------- */
function svg(name){
  switch(name){
    case 'insta': 
      return `<svg class="icon" viewBox="0 0 72 72" aria-hidden="true" fill="currentColor">
        <path d="M36 18c-9.94 0-18 8.06-18 18s8.06 18 18 18 18-8.06 18-18-8.06-18-18-18zm0 29.4c-6.31 0-11.4-5.09-11.4-11.4S29.69 24.6 36 24.6 47.4 29.69 47.4 36 42.31 47.4 36 47.4zm22.2-29.82c0 2.44-1.98 4.42-4.42 4.42s-4.42-1.98-4.42-4.42 1.98-4.42 4.42-4.42 4.42 1.98 4.42 4.42z"/>
      </svg>`;
    case 'x': 
      return `<svg class="icon" viewBox="0 0 72 72" aria-hidden="true" fill="currentColor">
        <path d="M17 15l17.88 22.5L17 57h8.5l12.5-14.5L50.5 57H65L46.62 34.5 64 15H55.5L44 28.5 32.12 15H17z"/>
      </svg>`;
    case 'tiktok': 
      return `<svg class="icon" viewBox="0 0 72 72" aria-hidden="true" fill="currentColor">
        <path d="M45 6h9c0 7.2 5.8 13 13 13v9c-7.2 0-13-5.8-13-13h-9v29c0 7.2-5.8 13-13 13s-13-5.8-13-13 5.8-13 13-13c1.2 0 2.3.2 3.3.5V22c-1.1-.2-2.2-.3-3.3-.3-12.2 0-22 9.8-22 22s9.8 22 22 22 22-9.8 22-22V6z"/>
      </svg>`;
    case 'threads': 
      return `<svg class="icon" viewBox="0 0 72 72" aria-hidden="true" fill="currentColor">
        <path d="M36 6C19.43 6 6 19.43 6 36s13.43 30 30 30 30-13.43 30-30S52.57 6 36 6zm0 54c-13.25 0-24-10.75-24-24S22.75 12 36 12s24 10.75 24 24-10.75 24-24 24z"/>
        <path d="M42 47c-3 3-9 2-11-2-1-2-1-4 0-6 2-4 8-5 11-2l4-4c-4-5-14-5-18 0-3 4-3 10 0 14 5 6 15 6 19 0l-5-4z"/>
      </svg>`;
    case 'fb': 
      return `<svg class="icon" viewBox="0 0 72 72" aria-hidden="true" fill="currentColor">
        <path d="M36 6C19.4 6 6 19.4 6 36c0 15 10.8 27.4 25 30v-21h-7v-9h7v-6c0-7 4-11 10-11 3 0 6 .2 7 .3v8h-5c-3 0-4 2-4 4v5h9l-1 9h-8v21c14.2-2.6 25-15 25-30 0-16.6-13.4-30-30-30z"/>
      </svg>`;
    case 'pin':
      return `<svg class="icon" viewBox="0 0 72 72" aria-hidden="true" fill="currentColor">
        <path d="M36 6C25 6 16 15 16 26c0 14 20 40 20 40s20-26 20-40c0-11-9-20-20-20zm0 28a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"/>
      </svg>`;
    case 'plus':
      return `<svg class="icon" viewBox="0 0 72 72" aria-hidden="true" fill="currentColor">
        <path d="M36 16v40M16 36h40" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>
      </svg>`;
    default:
      return `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>`;
  }
}

function iconFor(red=''){
  const r = String(red).toLowerCase();
  if (r.includes('insta') || r.includes('ig'))           return svg('insta');
  if (r.includes('tiktok'))                               return svg('tiktok');
  if (r.includes('threads'))                              return svg('threads');
  if (r.includes('facebook') || r.includes('fb'))         return svg('fb');
  if (r.includes('x') || r.includes('twitter'))           return svg('x');
  return svg(); // por defecto
}


/* --------- Normalizaciones de texto --------- */
// @usuario en minúsculas (dejando el @)
function normalizeHandle(u = '') {
  u = String(u).trim();
  if (!u) return '';
  if (!u.startsWith('@')) u = '@' + u;
  return '@' + u.slice(1).toLocaleLowerCase('es-ES');
}
// Title Case “inteligente” para es-ES
function titleCaseEs(str = '') {
  const small = new Set(['de','del','la','las','los','y','en','el','al','a','o']);
  return String(str)
    .toLocaleLowerCase('es-ES')
    .split(/\s+/)
    .map((w,i) => {
      const ww = w.normalize('NFC');
      if (i>0 && small.has(ww)) return ww;
      return ww.charAt(0).toLocaleUpperCase('es-ES') + ww.slice(1);
    })
    .join(' ')
    .replace(/\s*,\s*/g, ', ');
}

/* --------- Carga de datos + pintado --------- */
window.addEventListener('load', loadData);

async function loadData(){
  const url = APPS_SCRIPT_URL + '?_=' + Date.now();
  const res = await fetch(url, { cache:'no-store' });
  const data = await res.json();

  // contador de km
  drawCounter(data.totalKm || 0);

  // ordena por fecha (más reciente primero); si falta fecha, cae al acumulado
  const list = (data.pasajeros || []).slice().sort((a,b)=>{
    const tb = Date.parse(b.timestamp || '') || 0;
    const ta = Date.parse(a.timestamp || '') || 0;
    if (tb !== ta) return tb - ta;
    return (b.km_acumulados||0) - (a.km_acumulados||0);
  });

  // pinta tarjetas (con paginación simple)
  drawPaged(list);

  // badge con número de pasajeros junto al título
  const h = document.querySelector('.gallery h2');
  if (h){
    let badge = h.querySelector('.count-badge');
    if (!badge){
      badge = document.createElement('span');
      badge.className = 'count-badge';
      h.appendChild(badge);
    }
    badge.textContent = String(list.length);
  }
}

function drawCounter(km){
  const el = document.getElementById('kmTotal');
  if (el){
    el.textContent = new Intl.NumberFormat('es-ES').format(km);
    el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
  }
}

/* --------- Tarjetas --------- */
function drawCards(list){
  const wrap = document.getElementById('cards');
  if (!wrap) return;

  wrap.innerHTML = '';
  const frag = document.createDocumentFragment();

  list.forEach(p=>{
    const nombre     = (p.nombre || '').trim();
    const usuario    = normalizeHandle(p.usuario || '');
    const ubicacion  = titleCaseEs(p.ubicacion || '');
    const kmsAdd     = Number(p.km_desde_anterior || 0);

    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <img class="ph" src="${p.foto || ''}" alt="${(nombre||'').replace(/"/g,'&quot;')}">
      <div class="meta">
        <div class="name display">${nombre}</div>

        <div class="row user">
          ${iconFor(p.red_social)} <span>${usuario}</span>
        </div>

        <div class="row">
          ${svg('pin')} <span>${ubicacion}</span>
        </div>

        <div class="row kms" title="Acumulado: ${new Intl.NumberFormat('es-ES').format(p.km_acumulados || 0)} km">
          ${svg('plus')} <span>${new Intl.NumberFormat('es-ES').format(kmsAdd)} km</span>
        </div>
      </div>`;
    frag.appendChild(card);
  });

  wrap.appendChild(frag);
}

/* --------- Paginación simple --------- */
const PAGE_SIZE = 12;
let page = 1;
let fullList = [];

function drawPaged(list){
  // guarda lista completa y dibuja hasta PAGE_SIZE*page
  fullList = list.slice();
  const slice = fullList.slice(0, PAGE_SIZE * page);
  drawCards(slice);

  // botón cargar más
  let more = document.getElementById('loadMore');
  if (!more){
    more = document.createElement('button');
    more.id = 'loadMore';
    more.className = 'cta';
    more.textContent = 'Cargar más';
    document.querySelector('.gallery-inner')?.appendChild(more);
    more.addEventListener('click', ()=>{
      page++;
      const next = fullList.slice(0, PAGE_SIZE * page);
      drawCards(next);
      if (next.length >= fullList.length) more.style.display = 'none';
    });
  }
  more.style.display = (slice.length < fullList.length) ? 'inline-block' : 'none';
}
