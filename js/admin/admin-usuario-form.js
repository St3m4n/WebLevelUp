// /js/admin/admin-usuario-form.js

const $ = (q, ctx=document)=>ctx.querySelector(q);
const $$ = (q, ctx=document)=>[...ctx.querySelectorAll(q)];

const LS_KEY_USUARIOS = "usuarios";

function loadUsuarios(){
  try{
    const raw = localStorage.getItem(LS_KEY_USUARIOS);
    if (raw){
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    }
  }catch(e){}
  return Array.isArray(window.usuarios) ? [...window.usuarios] : [];
}
function saveUsuarios(arr){
  localStorage.setItem(LS_KEY_USUARIOS, JSON.stringify(arr));
}

// ---------------- RUN (RUT) utils ----------------
// Valida sin puntos ni guion. DV puede ser 0-9 o K.
// Implementación estándar módulo 11.
function normalizarRun(run){
  return String(run || "").toUpperCase().replace(/[^0-9K]/g,'');
}
function formatearRun(runRaw){
  const clean = normalizarRun(runRaw);
  if (clean.length < 2) return clean;
  const cuerpo = clean.slice(0, -1);
  const dv = clean.slice(-1);
  let out = '';
  let cnt = 0;
  for (let i = cuerpo.length - 1; i >= 0; i--){
    out = cuerpo[i] + out;
    cnt++;
    if (cnt === 3 && i !== 0){ out = '.' + out; cnt = 0; }
  }
  return `${out}-${dv}`;
}
function validarRun(runRaw){
  const run = normalizarRun(runRaw);
  if (run.length < 7 || run.length > 9) return false;

  // separar cuerpo y dígito
  const dv = run.slice(-1);
  const cuerpo = run.slice(0, -1);
  if (!/^\d+$/.test(cuerpo)) return false;

  let suma = 0, m = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--){
    suma += parseInt(cuerpo[i],10) * m;
    m = (m === 7) ? 2 : (m + 1);
  }
  const res = 11 - (suma % 11);
  let dvCalc = (res === 11) ? '0' : (res === 10 ? 'K' : String(res));
  return dv === dvCalc;
}

// ---------------- Email domain ----------------
const ALLOWED_DOMAINS = ["duoc.cl", "profesor.duoc.cl", "gmail.com"];
function validarCorreo(email){
  if (!email) return false;
  if (email.length > 100) return false;
  const m = email.match(/^[^@\s]+@([^@\s]+\.[^@\s]+)$/);
  if (!m) return false;
  const domain = m[1].toLowerCase();
  return ALLOWED_DOMAINS.includes(domain);
}

// ---------------- Región / Comuna ----------------
function loadRegiones(){
  const regiones = window.regiones || {};
  const selRegion = $('#region');
  const selComuna = $('#comuna');

  // poblar regiones
  const nombres = Object.keys(regiones);
  selRegion.innerHTML = ['<option value="">Selecciona…</option>', ...nombres.map(r=>`<option>${r}</option>`)].join('');

  selRegion.addEventListener('change', ()=>{
    const r = selRegion.value;
    const comunas = regiones[r] || [];
    selComuna.innerHTML = ['<option value="">Selecciona…</option>', ...comunas.map(c=>`<option>${c}</option>`)].join('');
    selComuna.disabled = comunas.length === 0;
    // limpiar comuna si cambio región
    selComuna.value = "";
  });
}

// ---------------- Init ----------------
document.addEventListener('DOMContentLoaded', ()=>{
  const params = new URLSearchParams(location.search);
  const id = params.get('id'); // RUN cuando es edición
  const form = $('[data-ref="form"]');
  const btnGuardar = $('[data-ref="btn-guardar"]');
  const titulo = $('[data-ref="titulo"]');
  const badgeDuoc = $('[data-ref="badge-duoc"]');

  // inputs
  const iRun = $('#run');
  const iNombre = $('#nombre');
  const iApellidos = $('#apellidos');
  const iCorreo = $('#correo');
  const iFecha = $('#fechaNacimiento');
  const iPerfil = $('#perfil');
  const iRegion = $('#region');
  const iComuna = $('#comuna');
  const iDireccion = $('#direccion');

  loadRegiones();
  let data = loadUsuarios();
  let editing = false;
  let originalRun = null;

  // ---- Modo edición
  if (id){
    const found = data.find(u => normalizarRun(u.run) === normalizarRun(id));
    if (found){
      editing = true;
      originalRun = found.run;
      // Mostrar correo en el título cuando se edita
      titulo.textContent = `Editar usuario: ${found.correo || found.run}`;

  // Mostrar RUN formateado (puntos y guion) en edición
  iRun.value = formatearRun(found.run);
      iRun.setAttribute('readonly','readonly'); // clave primaria
      iNombre.value = found.nombre || "";
      iApellidos.value = found.apellidos || "";
      iCorreo.value = found.correo || "";
      if (found.fechaNacimiento) iFecha.value = found.fechaNacimiento;

      iPerfil.value = found.perfil || "";

      // set Región
      iRegion.value = found.region || "";
      // disparar cambio para poblar comunas
      iRegion.dispatchEvent(new Event('change'));
      iComuna.disabled = false;
      iComuna.value = found.comuna || "";

      iDireccion.value = found.direccion || "";

      // Mostrar badge si aplica
      const domain = String(found.correo||'').split('@')[1]?.toLowerCase()||'';
      const hasDesc = !!found.descuentoVitalicio || (String(found.perfil)==='Cliente' && domain==='duoc.cl');
      if (badgeDuoc) badgeDuoc.classList.toggle('d-none', !hasDesc);
    } else {
      titulo.textContent = "Nuevo usuario";
      if (badgeDuoc) badgeDuoc.classList.add('d-none');
    }
  } else {
    titulo.textContent = "Nuevo usuario";
    if (badgeDuoc) badgeDuoc.classList.add('d-none');
  }

  // ---- Validaciones básicas en tiempo real
  function toggleHint(el, invalid){
    const parent = el.closest('.col-sm-4, .col-sm-6, .col-12') || el.parentNode;
    if (!parent) return;
    parent.querySelectorAll('.limit-hint').forEach(h => h.classList.toggle('d-none', !invalid));
  }
  [iRun, iNombre, iApellidos, iCorreo, iPerfil, iRegion, iComuna, iDireccion].forEach(inp=>{
    inp.addEventListener('input', ()=>{ inp.classList.remove('is-invalid'); toggleHint(inp, false); });
    inp.addEventListener('change', ()=>{ inp.classList.remove('is-invalid'); toggleHint(inp, false); });
  });

  // Toggle badge en tiempo real segun correo/perfil
  function updateBadgeRealtime(){
    const email = String(iCorreo.value||'').trim().toLowerCase();
    const domain = email.split('@')[1] || '';
    const isCliente = iPerfil.value === 'Cliente';
    const show = isCliente && domain.toLowerCase()==='duoc.cl';
    if (badgeDuoc) badgeDuoc.classList.toggle('d-none', !show);
  }
  iCorreo.addEventListener('input', updateBadgeRealtime);
  iPerfil.addEventListener('change', updateBadgeRealtime);

  // RUN: sanitiza mientras escribe y formatea en blur
  iRun.addEventListener('input', ()=>{
    const before = iRun.value;
    const clean = normalizarRun(before);
    // Evitar saltos de cursor: solo reescribe si hay cambios ajenos (espacios, signos)
    if (before.replace(/[^0-9kK]/g,'').toUpperCase() !== clean){
      iRun.value = clean;
    }
  });
  iRun.addEventListener('blur', ()=>{
    iRun.value = formatearRun(iRun.value);
  });

  function setInvalid(el){ el.classList.add('is-invalid'); toggleHint(el, true); return false; }
  function clearInvalid(el){ el.classList.remove('is-invalid'); toggleHint(el, false); }

  function validar(){
    let ok = true;

    // RUN
    const runVal = iRun.value.trim();
    if (editing){
      // En edición no exigimos DV por compatibilidad con datos legados; campo es solo lectura
      clearInvalid(iRun);
    } else {
      if (!validarRun(runVal)) ok = setInvalid(iRun); else {
        // duplicado solo si estamos creando
        const dup = data.some(u => normalizarRun(u.run) === normalizarRun(runVal));
        if (dup) ok = setInvalid(iRun); else clearInvalid(iRun);
      }
    }

    // Nombre / Apellidos
    if (!iNombre.value.trim() || iNombre.value.length > 50) ok = setInvalid(iNombre); else clearInvalid(iNombre);
    if (!iApellidos.value.trim() || iApellidos.value.length > 100) ok = setInvalid(iApellidos); else clearInvalid(iApellidos);

    // Correo permitido
    if (!validarCorreo(iCorreo.value.trim())) ok = setInvalid(iCorreo); else clearInvalid(iCorreo);

    // Fecha de nacimiento (opcional, pero si existe debe ser ≥ 18)
    const f = String(iFecha.value || '').trim();
    if (f) {
      try {
        const hoy = new Date();
        const d = new Date(f + 'T00:00:00');
        let edad = hoy.getFullYear() - d.getFullYear();
        const m = hoy.getMonth() - d.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < d.getDate())) edad--;
        if (edad < 18) ok = setInvalid(iFecha); else clearInvalid(iFecha);
      } catch { ok = setInvalid(iFecha); }
    } else {
      clearInvalid(iFecha);
    }

    // Perfil / Región / Comuna
    if (!iPerfil.value) ok = setInvalid(iPerfil); else clearInvalid(iPerfil);
    if (!iRegion.value) ok = setInvalid(iRegion); else clearInvalid(iRegion);
    if (!iComuna.value) ok = setInvalid(iComuna); else clearInvalid(iComuna);

    // Dirección
    const dir = iDireccion.value.trim();
    if (!dir || dir.length > 300) ok = setInvalid(iDireccion); else clearInvalid(iDireccion);

    return ok;
  }

  btnGuardar.addEventListener('click', ()=>{
    if (!validar()){
      const first = $('.is-invalid', form);
      first?.focus();
      return;
    }

    const payload = {
      run: normalizarRun(iRun.value),
      nombre: iNombre.value.trim(),
      apellidos: iApellidos.value.trim(),
      correo: iCorreo.value.trim(),
      fechaNacimiento: iFecha.value || null,
      perfil: iPerfil.value,
      region: iRegion.value,
      comuna: iComuna.value,
      direccion: iDireccion.value.trim()
    };

      // Descuento vitalicio para Clientes con correo @duoc.cl
      try {
        const domain = (payload.correo.split('@')[1] || '').toLowerCase();
        if (payload.perfil === 'Cliente' && domain === 'duoc.cl') {
          payload.descuentoVitalicio = true;
        }
      } catch (e) { /* ignore */ }

    if (editing){
      data = data.map(u => normalizarRun(u.run) === normalizarRun(originalRun) ? {...u, ...payload, run: originalRun} : u);
    } else {
      data = [...data, payload];
    }
    saveUsuarios(data);
    location.href = "./usuarios.html";
  });
});