// === Config (cámbia SOLO API_SECRET si no coincide) ===
const CLOUD_NAME      = "drhkixsov";
const UPLOAD_PRESET   = "km0_public";
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxEn9EIxVBKVbXbrv4BrRhm7kRZHalUtWUU66jbtY80scAkRdqZQSztQfnDt7G0GrUU/exec";
const API_SECRET      = "km0"; // Debe ser el mismo que en tu Apps Script

// 1) Abrir/cerrar el formulario
const joinSec = document.getElementById('join');
document.getElementById('ctaLink')?.addEventListener('click', (e)=>{
  e.preventDefault();
  joinSec.classList.toggle('open');
  joinSec.setAttribute('aria-hidden', joinSec.classList.contains('open') ? 'false' : 'true');
  if(joinSec.classList.contains('open')) joinSec.scrollIntoView({behavior:'smooth', block:'center'});
});

// 2) Vista previa de la imagen
const fileInput = document.querySelector('input[name="foto"]');
const preview   = document.getElementById('preview');
fileInput?.addEventListener('change', ()=>{
  const f = fileInput.files[0];
  preview.src = f ? URL.createObjectURL(f) : '';
});

// 3) Subida a Cloudinary
async function uploadToCloudinary(file){
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', UPLOAD_PRESET);
  // Opcional: tu preset ya guarda en la carpeta km0/, no hace falta pasar 'folder'
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, {
    method:'POST', body: fd
  });
  if(!res.ok) throw new Error('Error subiendo la imagen');
  const j = await res.json();
  return j.secure_url; // URL pública
}

// 4) Enviar a Apps Script
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

    // 4.1 Sube a Cloudinary
    const fotoUrl = await uploadToCloudinary(file);

    // 4.2 Envía datos a tu Apps Script
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

    const r = await fetch(APPS_SCRIPT_URL, {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify(payload)
    });
    const out = await r.json();
    if(out.ok !== true) throw new Error(out.error || 'No se pudo guardar');

    msg.textContent = '¡Enviado! Tu alta queda pendiente de aprobación.';
    f.reset(); preview.src='';

    // (Opcional) Cerrar el formulario al cabo de 2s
    setTimeout(()=> joinSec.classList.remove('open'), 2000);

  }catch(err){
    console.error(err);
    msg.textContent = 'Error: ' + err.message;
  }finally{
    btn.disabled = false;
  }
});
