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
const COUNTRIES = ["Afganistán","Albania","Alemania","Andorra","Angola","Antigua y Barbuda","Arabia Saudí","Argelia","Argentina","Armenia","Australia","Austria","Azerbaiyán","Bahamas","Bangladés","Barbados","Baréin","Bélgica","Belice","Benín","Bielorrusia","Birmania (Myanmar)","Bolivia","Bosnia y Herzegovina","Botsuana","Brasil","Brunéi","Bulgaria","Burkina Faso","Burundi","Bután","Cabo Verde","Camboya","Camerún","Canadá","Catar","Chad","Chile","China","Chipre","Colombia","Comoras","Congo","Corea del Norte","Corea del Sur","Costa de Marfil","Costa Rica","Croacia","Cuba","Dinamarca","Dominica","Ecuador","Egipto","El Salvador","Emiratos Árabes Unidos","Eritrea","Eslovaquia","Eslovenia","España","Estados Unidos","Estonia","Esuatini","Etiopía","Filipinas","Finlandia","Fiyi","Francia","Gabón","Gambia","Georgia","Ghana","Granada","Grecia","Guatemala","Guyana","Guinea","Guinea Ecuatorial","Guinea-Bisáu","Haití","Honduras","Hungría","India","Indonesia","Irak","Irán","Irlanda","Islandia","Islas Marshall","Islas Salomón","Israel","Italia","Jamaica","Japón","Jordania","Kazajistán","Kenia","Kirguistán","Kiribati","Kuwait","Laos","Lesoto","Letonia","Líbano","Liberia","Libia","Liechtenstein","Lituania","Luxemburgo","Madagascar","Malasia","Malaui","Maldivas","Malí","Malta","Marruecos","Mauricio","Mauritania","México","Micronesia","Moldavia","Mónaco","Mongolia","Montenegro","Mozambique","Namibia","Nauru","Nepal","Nicaragua","Níger","Nigeria","Noruega","Nueva Zelanda","Omán","Países Bajos","Pakistán","Palaos","Panamá","Papúa Nueva Guinea","Paraguay","Perú","Polonia","Portugal","Reino Unido","República Centroafricana","República Checa","República del Congo","República Democrática del Congo","República Dominicana","Ruanda","Rumanía","Rusia","Samoa","San Cristóbal y Nieves","San Marino","San Vicente y las Granadinas","Santa Lucía","Santo Tomé y Príncipe","Senegal","Serbia","Seychelles","Sierra Leona","Singapur","Siria","Somalia","Sri Lanka","Sudáfrica","Sudán","Sudán del Sur","Suecia","Suiza","Surinam","Tailandia","Tanzania","Tayikistán","Timor Oriental","Togo","Tonga","Trinidad y Tobago","Túnez","Turkmenistán","Turquía","Tuvalu","Ucrania","Uganda","Uruguay","Uzbekistán","Vanuatu","Venezuela","Vietnam","Yemen","Yibuti","Zambia","Zimbabue"];
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

const CITY_SUGGESTIONS = {
  "España": ["Madrid","Barcelona","Valencia","Sevilla","Zaragoza","Málaga","Murcia","Palma","Las Palmas de Gran Canaria","Bilbao","Alicante","Córdoba","Valladolid","Vigo","Gijón","Hospitalet de Llobregat","A Coruña","Vitoria-Gasteiz","Granada","Elche","Oviedo","Santa Cruz de Tenerife","Badalona","Cartagena","Terrassa","Jerez de la Frontera","Sabadell","Móstoles","Alcalá de Henares","Pamplona","Fuenlabrada","Almería","Leganés","Donostia / San Sebastián","Burgos","Santander","Castellón de la Plana","Getafe","Albacete"],
  "México": ["Ciudad de México","Guadalajara","Monterrey","Puebla","Tijuana","León","Querétaro","Toluca","Mérida","San Luis Potosí","Aguascalientes","Hermosillo","Chihuahua","Saltillo","Morelia","Culiacán","Cancún","Veracruz","Villahermosa","Durango","Acapulco","Torreón","Xalapa","Tepic"],
  "Argentina": ["Buenos Aires","Córdoba","Rosario","Mendoza","La Plata","Mar del Plata","San Miguel de Tucumán","Salta","Santa Fe","Corrientes","Bahía Blanca","Resistencia","Posadas","San Salvador de Jujuy","Neuquén","Santiago del Estero","Paraná"],
  "Chile": ["Santiago","Valparaíso","Viña del Mar","Concepción","La Serena","Antofagasta","Temuco","Rancagua","Iquique","Puerto Montt","Talca","Arica","Copiapó","Osorno","Chillán"],
  "Colombia": ["Bogotá","Medellín","Cali","Barranquilla","Cartagena","Cúcuta","Bucaramanga","Soacha","Ibagué","Soledad","Santa Marta","Villavicencio","Pereira","Bello","Valledupar","Montería"]
};
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
  const base = 'class="icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"';
  switch(name){
    case 'insta': return `<svg ${base} fill="currentColor"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.2-.6a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/></svg>`;
    case 'x':     return `<svg ${base} fill="currentColor"><path d="M3 3h4.5l6 7.5L18 3h3l-7 9 7 9h-4.5l-6-7.5L6 21H3l7-9-7-9z"/></svg>`;
    case 'tiktok':return `<svg ${base} fill="currentColor"><path d="M14 2c1.1 2.3 2.9 3.6 5 3.8V9c-1.8-.1-3.4-.7-5-1.8V15a7 7 0 1 1-7-7h1v3h-1a4 4 0 1 0 4 4V2h3z"/></svg>`;
    case 'pin':   return `<svg ${base} fill="currentColor"><path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13s-7-8-7-13a7 7 0 0 1 7-7zm0 9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/></svg>`;
    default:      return `<svg ${base} fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>`;
  }
}
function iconFor(red=''){
  const r = red.toLowerCase();
  if (r.includes('insta'))  return svg('insta');
  if (r.includes('tiktok'))  return svg('tiktok');
  if (r.includes('x') || r.includes('twitter')) return svg('x');
  return svg();
}

// Normaliza el @usuario a minúsculas (no tocamos el @)
function normalizeHandle(u = '') {
  u = String(u).trim();
  if (!u) return '';
  if (!u.startsWith('@')) u = '@' + u;
  return '@' + u.slice(1).toLocaleLowerCase('es-ES');
}

// Title Case "inteligente" para es-ES (evita poner en mayúsculas preposiciones cortas)
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
    .replace(/\s*,\s*/g, ', '); // limpia comas
}

/* --------- Carga de datos + pintado --------- */
async function loadData(){
  const url = APPS_SCRIPT_URL + '?_=' + Date.now();
  const res = await fetch(url, { cache:'no-store' });
  const data = await res.json();
  drawCounter(data.totalKm || 0);
  drawPaged(data.pasajeros || []);
}
// Muestra el número de pasajeros aprobados junto al título
const h = document.querySelector('.gallery h2');
if (h) {
  let badge = h.querySelector('.count-badge');
  if (!badge) {
    badge = document.createElement('span');
    badge.className = 'count-badge';
    h.appendChild(badge);
  }
  badge.textContent = `${(data.pasajeros || []).length}`;
}


function drawCounter(km){
  const el = document.getElementById('kmTotal');
  if (el){
    el.textContent = new Intl.NumberFormat('es-ES').format(km);
    el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
  }
}

function drawCards(list){
list.forEach(p=>{
  const nombre     = (p.nombre || '').trim();                 // ya lo muestras en Superlumina (en mayúsculas)
  const usuario    = normalizeHandle(p.usuario || '');
  const ubicacion  = titleCaseEs(p.ubicacion || '');          // "Berlin, Alemania" → "Berlin, Alemania"
  const kmsAdd     = p.km_desde_anterior || 0;

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

window.addEventListener('load', loadData);

// Paginación simple
const PAGE_SIZE = 12;
let page = 1;
let current = [];

// Llama a esto en loadData, en vez de drawCards(data.pasajeros)
function drawPaged(list){
  current = list.slice(0, PAGE_SIZE * page);
  drawCards(current);

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
      drawPaged(list);
    });
  }
  more.style.display = (current.length < list.length) ? 'inline-block' : 'none';
}

