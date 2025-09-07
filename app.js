// ==== CONFIG ====
// Pon aquí tu URL de Apps Script (la que termina en /exec)
const API_URL = "https://script.google.com/macros/s/AKfycbxEn9EIxVBKVbXbrv4BrRhm7kRZHalUtWUU66jbtY80scAkRdqZQSztQfnDt7G0GrUU/exec";

// Si ya tienes el enlace al Form, ponlo aquí:
const FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSd8qj8zg588IjgEm7OqW8xxD8mmbSJSeKcXBKAp_-37C1yA6w/viewform";

// ====== ICONOS SVG ======
const ICONS = {
  Instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5A5.5 5.5 0 1 1 6.5 13 5.5 5.5 0 0 1 12 7.5zm5.75-2.5a1.25 1.25 0 1 1-1.25 1.25A1.25 1.25 0 0 1 17.75 5z"/></svg>',
  "X (Twitter)": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h4.6l5.2 6.6L18.4 3H21l-7.2 8.8L21 21h-4.6l-5.3-6.7L5.6 21H3l7.4-9L3 3z"/></svg>',
  TikTok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3c1.1 1.6 2.4 2.7 4.6 2.9V9c-1.8-.1-3.3-.6-4.6-1.5V15a6 6 0 1 1-6-6 6.1 6.1 0 0 1 1 .1V11a3.5 3.5 0 1 0 2.5 3.3V3h2.5z"/></svg>',
  Threads: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.9 2 3 5.9 3 11s3.9 9 9 9 9-3.9 9-9S17.1 2 12 2zm0 2c5 0 7 3.6 7 7s-2 7-7 7-7-3.6-7-7 2-7 7-7zm3.4 8.5c-.2 1.6-1.5 3-3.7 3-2.6 0-4.2-1.8-4.2-3.7 0-2.1 1.7-3.8 4.2-3.8 1.8 0 3.1.7 3.7 1.9l-1.6.9c-.3-.7-1-1.1-2.1-1.1-1.3 0-2.2.9-2.2 2.1s.9 2.1 2.2 2.1c1.1 0 1.8-.5 2-1.2h-2v-1.5h3.9c.1.4.1.8.1 1.3z"/></svg>',
  Facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 9h3V6h-3c-2.2 0-4 1.8-4 4v2H6v3h3v7h3v-7h3l1-3h-4v-2c0-.6.4-1 1-1z"/></svg>',
  Bluesky: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 13c2.7-3.6 6.5-6.3 8.5-6.7.7-.1 1.5.2 1.5 1.2 0 3.2-3.4 6.5-6.8 7.6 3 .7 4.8 2.4 4.8 4.2 0 .9-.6 1.5-1.6 1.5-2.3 0-4.6-2.2-5.9-3.9-1.3 1.7-3.6 3.9-5.9 3.9-1 0-1.6-.6-1.6-1.5 0-1.8 1.8-3.5 4.8-4.2C5.4 14 2 10.7 2 7.5c0-1 .8-1.4 1.5-1.2C5.5 6.7 9.3 9.4 12 13z"/></svg>',
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z"/></svg>',
  cal: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h2v2h6V2h2v2h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3V2zm13 8H4v10h16V10z"/></svg>'
};

function renderUser(red, usuario){
  const icon = ICONS[red] || ICONS['Instagram'];
  const at = usuario && usuario.startsWith('@') ? usuario : (usuario ? '@'+usuario : '');
  return at ? `<span class="user">${icon}<span>${at}</span></span>` : '';
}
const kmEl = document.getElementById("kmTotal");
const cardsEl = document.getElementById("cards");
const ctaLink = document.getElementById("ctaLink");
ctaLink.href = FORM_URL;

function fmtDate(ts){ try{ return new Date(ts).toLocaleDateString('es-ES'); }catch(_){ return ts||''; } }

// Animación del contador
function countUp(el, to, ms=1200){
  const start = performance.now(), from = 0;
  function step(t){
    const p = Math.min(1, (t-start)/ms);
    const val = Math.round(from + (to-from)*p);
    el.textContent = val.toLocaleString('es-ES');
    if(p<1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

async function load(){
  try{
    const resp = await fetch(API_URL + "?t=" + Date.now());
    const data = await resp.json();

    const total = Number(data.totalKm||0);
    countUp(kmEl, total);

    const list = data.pasajeros || [];
    if(!list.length){
      cardsEl.innerHTML = '<p style="opacity:.7">Aún no hay pasajeros aprobados.</p>';
      return;
    }

    const html = list.slice().reverse().map(item=>{
      const foto = item.foto || '';
      const nombre = item.nombre || 'Pasajer@';
      const usuario = item.usuario || '';
      const red = item.red_social || '';
      const ubic = item.ubicacion || '';
      const kms = Number(item.km_desde_anterior||0);
      const fecha = fmtDate(item.timestamp);

      return `
      <article class="card">
        ${foto ? `<img class="ph" loading="lazy" src="${foto}" alt="Foto de ${nombre} con el disco KM0" onerror="this.style.display='none'">` : `<div class="ph"></div>`}
        <div class="meta">
          <div class="name">${nombre}</div>
          <div class="row">${renderUser(red, usuario)}</div>
          <div class="row">${ICONS.pin} <span>${ubic}</span></div>
          <div class="row kms">${ICONS.plus} <span>${kms.toLocaleString('es-ES')} km</span></div>
          <div class="row">${ICONS.cal} <span>${fecha}</span></div>
        </div>
      </article>`;
    }).join('');
    cardsEl.innerHTML = html;
  }catch(err){
    console.error(err);
    kmEl.textContent = '—';
    cardsEl.innerHTML = '<p style="color:#c00">No se pudo cargar la ruta. Revisa la URL del API.</p>';
  }
}
load();