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

/* --------- Iconos SVG pequeños (inline) --------- */
/* --------- Iconos pequeños desde archivos .svg --------- */
function svg(name){
  const map = {
    insta:    'instagram.svg',
    x:        'x.svg',
    tiktok:   'tiktok.svg',
    threads:  'threads.svg',
    pin:      'pin.svg',
    plus:     'plus.svg'
  };
  const file = map[name] || 'pin.svg';
  // Usa ruta relativa para que funcione igual en tu PC y en GitHub Pages
  return `<img class="icon" src="./icons/${file}" alt="" aria-hidden="true">`;
}


function iconFor(red=''){
  const r = String(red).toLowerCase();
  if (r.includes('insta'))      return svg('insta');
  if (r.includes('tiktok'))     return svg('tiktok');
  if (r.includes('threads'))    return svg('threads');
  if (r.includes('face')||r.includes('fb')) return svg('fb');
  if (r.includes('twitter')||r === 'x')     return svg('x');
  return svg(); // fallback
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

    const userIcon = iconFor(p.red_social).replace('class="icon"', 'class="icon user"');
    const pinIcon  = svg('pin').replace('class="icon"', 'class="icon pin"');
    const plusIcon = svg('plus').replace('class="icon"', 'class="icon plus"');

    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <img class="ph" src="${p.foto || ''}" alt="${(nombre||'').replace(/"/g,'&quot;')}">
      <div class="meta">
        <div class="name display">${nombre}</div>

        <div class="row user">
          ${userIcon} <span>${usuario}</span>
        </div>

        <div class="row">
          ${pinIcon} <span>${ubicacion}</span>
        </div>

        <div class="row kms" title="Acumulado: ${new Intl.NumberFormat('es-ES').format(p.km_acumulados || 0)} km">
          ${plusIcon} <span>${new Intl.NumberFormat('es-ES').format(kmsAdd)} km</span>
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
console.log("app.js v1 cargado");

document.getElementById('toggle-shops').addEventListener('click', ()=>{
  const box = document.getElementById('shops');
  box.hidden = !box.hidden;
});


