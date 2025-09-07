/**********************************************************
 * KM0 – Front JS (Cloudinary + Apps Script vía FormData)
 **********************************************************/

// === Config (cambia SOLO si lo necesitas) ===
const CLOUD_NAME      = "drhkixsov";
const UPLOAD_PRESET   = "km0_public";
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxEn9EIxVBbXbrv4BrRhm7kRZHalUtWUU66jbtY80scAkRdqZQSztQfnDt7G0GrUU/exec";
const API_SECRET      = "km0"; // Debe coincidir con SECRET en Apps Script

/* ========== UI: abrir/cerrar formulario ========== */
const joinSec = document.getElementById('join');
document.getElementById('ctaLink')?.addEventListener('click', (e)=>{
  e.preventDefault();
  joinSec.classList.toggle('open');
  joinSec.setAttribute('aria-hidden', joinSec.classList.contains('open') ? 'false' : 'true');
  if (joinSec.classList.contains('open')) joinSec.scrollIntoView({ behavior:'smooth', block:'center' });
});

/* ========== Vista previa de imagen ========== */
const fileInput = document.querySelector('input[name="foto"]');
const preview   = document.getElementById('preview');
fileInput?.addEventListener('change', ()=>{
  const f = fileInput.files[0];
  preview.src = f ? URL.createObjectURL(f) : '';
});

/* ========== Subida a Cloudinary ========== */
async function uploadToCloudinary(file){
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', UPLOAD_PRESET);

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  const res = await fetch(url, { method:'POST', body: fd });
  if(!res.ok){
    const txt = await res.text().catch(()=> '');
    throw new Error('Cloudinary: ' + (txt || res.status));
  }

  const j = await res.json();
  if(!j.secure_url) throw new Error('Cloudinary no devolvió URL');
  return j.secure_url;
}

/* ========== Enviar a Apps Script (FormData sin headers) ========== */
document.getElementById('joinForm')?.addEventListener('submit', async (ev)=>{
  ev.preventDefault();
  const f   = ev.currentTarget;
  const msg = document.getElementById('joinMsg');
  const btn = f.querySelector('button[type="submit"]');

  try{
    btn.disabled = true;

    // 1) Sube la foto a Cloudinary
    msg.textContent = 'Subiendo foto...';
    const file = f.foto.files[0];
    if(!file) throw new Error('Selecciona una imagen');
    const fotoUrl = await uploadToCloudinary(file);

    // 2) Enviar datos a Apps Script con FormData (evita preflight CORS)
    msg.textContent = 'Guardando datos...';
    const payload = {
      secret: API_SECRET,
      nombre: f.nombre.value.trim(),
      red_social: f.red_social.value,
      usuario: '@' + f.usuario.value.replace(/^@/,'').trim(),
      ciudad: f.ciudad.value.trim(),
      pais:   f.pais.value.trim(),
      foto:   fotoUrl
    };

    const fd2 = new FormData();
    Object.entries(payload).forEach(([k,v]) => fd2.append(k, v));

    // ¡OJO! Sin headers manuales. El navegador añade multipart/form-data.
    const r = await fetch(APPS_SCRIPT_URL, { method:'POST', body: fd2 });

    if(!r.ok){
      const txt = await r.text().catch(()=> '');
      throw new Error(`Apps Script ${r.status}. ${txt || ''}`.trim());
    }
    const out = await r.json().catch(()=> ({}));
    if(out.ok !== true) throw new Error(out.error || 'No se pudo guardar');

    msg.textContent = '¡Enviado! Tu alta queda pendiente de aprobación.';
    f.reset(); preview.src='';

    // (Opcional) cerrar el formulario al cabo de 2s
    setTimeout(()=> joinSec.classList.remove('open'), 2000);

  }catch(err){
    console.error(err);
    msg.textContent = 'Error: ' + err.message;
  }finally{
    btn.disabled = false;
  }
});

/* ===================== Países ===================== */
const COUNTRIES = [
  "Afganistán","Albania","Alemania","Andorra","Angola","Antigua y Barbuda","Arabia Saudí",
  "Argelia","Argentina","Armenia","Australia","Austria","Azerbaiyán","Bahamas","Bangladés",
  "Barbados","Baréin","Bélgica","Belice","Benín","Bielorrusia","Birmania (Myanmar)","Bolivia",
  "Bosnia y Herzegovina","Botsuana","Brasil","Brunéi","Bulgaria","Burkina Faso","Burundi",
  "Bután","Cabo Verde","Camboya","Camerún","Canadá","Catar","Chad","Chile","China","Chipre",
  "Colombia","Comoras","Congo","Corea del Norte","Corea del Sur","Costa de Marfil","Costa Rica",
  "Croacia","Cuba","Dinamarca","Dominica","Ecuador","Egipto","El Salvador","Emiratos Árabes Unidos",
  "Eritrea","Eslovaquia","Eslovenia","España","Estados Unidos","Estonia","Esuatini","Etiopía",
  "Filipinas","Finlandia","Fiyi","Francia","Gabón","Gambia","Georgia","Ghana","Granada","Grecia",
  "Guatemala","Guyana","Guinea","Guinea Ecuatorial","Guinea-Bisáu","Haití","Honduras","Hungría",
  "India","Indonesia","Irak","Irán","Irlanda","Islandia","Islas Marshall","Islas Salomón",
  "Israel","Italia","Jamaica","Japón","Jordania","Kazajistán","Kenia","Kirguistán","Kiribati",
  "Kuwait","Laos","Lesoto","Letonia","Líbano","Liberia","Libia","Liechtenstein","Lituania",
  "Luxemburgo","Madagascar","Malasia","Malaui","Maldivas","Malí","Malta","Marruecos","Mauricio",
  "Mauritania","México","Micronesia","Moldavia","Mónaco","Mongolia","Montenegro","Mozambique",
  "Namibia","Nauru","Nepal","Nicaragua","Níger","Nigeria","Noruega","Nueva Zelanda","Omán",
  "Países Bajos","Pakistán","Palaos","Panamá","Papúa Nueva Guinea","Paraguay","Perú","Polonia",
  "Portugal","Reino Unido","República Centroafricana","República Checa","República del Congo",
  "República Democrática del Congo","República Dominicana","Ruanda","Rumanía","Rusia","Samoa",
  "San Cristóbal y Nieves","San Marino","San Vicente y las Granadinas","Santa Lucía","Santo Tomé y Príncipe",
  "Senegal","Serbia","Seychelles","Sierra Leona","Singapur","Siria","Somalia","Sri Lanka","Sudáfrica",
  "Sudán","Sudán del Sur","Suecia","Suiza","Surinam","Tailandia","Tanzania","Tayikistán","Timor Oriental",
  "Togo","Tonga","Trinidad y Tobago","Túnez","Turkmenistán","Turquía","Tuvalu","Ucrania","Uganda",
  "Uruguay","Uzbekistán","Vanuatu","Venezuela","Vietnam","Yemen","Yibuti","Zambia","Zimbabue"
];

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
  // sel.value = "España"; // si quieres por defecto
}
document.addEventListener('DOMContentLoaded', populateCountries);

/* ===== Placeholder de ciudad según país ===== */
const paisSel = document.getElementById('pais');
const ciudadInput = document.getElementById('ciudad');
paisSel?.addEventListener('change', ()=>{
  const p = paisSel.value;
  if(ciudadInput){
    ciudadInput.placeholder = (p === "España")
      ? "Madrid, Sevilla, Barcelona…"
      : "Escribe tu ciudad";
  }
});

/* ====== Sugerencias de ciudades por país ====== */
const CITY_SUGGESTIONS = {
  "España": [
    "Madrid","Barcelona","Valencia","Sevilla","Zaragoza","Málaga","Murcia","Palma",
    "Las Palmas de Gran Canaria","Bilbao","Alicante","Córdoba","Valladolid","Vigo",
    "Gijón","Hospitalet de Llobregat","A Coruña","Vitoria-Gasteiz","Granada","Elche",
    "Oviedo","Santa Cruz de Tenerife","Badalona","Cartagena","Terrassa","Jerez de la Frontera",
    "Sabadell","Móstoles","Alcalá de Henares","Pamplona","Fuenlabrada","Almería","Leganés",
    "Donostia / San Sebastián","Burgos","Santander","Castellón de la Plana","Getafe","Albacete"
  ],
  "México": [
    "Ciudad de México","Guadalajara","Monterrey","Puebla","Tijuana","León","Querétaro","Toluca",
    "Mérida","San Luis Potosí","Aguascalientes","Hermosillo","Chihuahua","Saltillo","Morelia",
    "Culiacán","Cancún","Veracruz","Villahermosa","Durango","Acapulco","Torreón","Xalapa","Tepic"
  ],
  "Argentina": [
    "Buenos Aires","Córdoba","Rosario","Mendoza","La Plata","Mar del Plata","San Miguel de Tucumán",
    "Salta","Santa Fe","Corrientes","Bahía Blanca","Resistencia","Posadas","San Salvador de Jujuy",
    "Neuquén","Santiago del Estero","Paraná"
  ],
  "Chile": [
    "Santiago","Valparaíso","Viña del Mar","Concepción","La Serena","Antofagasta","Temuco",
    "Rancagua","Iquique","Puerto Montt","Talca","Arica","Copiapó","Osorno","Chillán"
  ],
  "Colombia": [
    "Bogotá","Medellín","Cali","Barranquilla","Cartagena","Cúcuta","Bucaramanga","Soacha",
    "Ibagué","Soledad","Santa Marta","Villavicencio","Pereira","Bello","Valledupar","Montería"
  ]
};

function updateCitySuggestions(){
  const selPais = document.getElementById('pais');
  const dl = document.getElementById('ciudadSuggestions');
  const inputCiudad = document.getElementById('ciudad');
  if(!selPais || !dl) return;

  const pais = selPais.value;
  const list = CITY_SUGGESTIONS[pais] || [];
  dl.innerHTML = '';

  if(list.length){
    const frag = document.createDocumentFragment();
    list.forEach(c=>{
      const opt = document.createElement('option');
      opt.value = c;
      frag.appendChild(opt);
    });
    dl.appendChild(frag);
    inputCiudad.placeholder = "Empieza a escribir o elige de la lista…";
  }else{
    inputCiudad.placeholder = "Escribe tu ciudad";
  }
}
document.getElementById('pais')?.addEventListener('change', updateCitySuggestions);
document.addEventListener('DOMContentLoaded', updateCitySuggestions);
