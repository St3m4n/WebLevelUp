// /js/admin/perfil.js
(function(){
  const LS_USU = "usuarios";
  const LS_LOG = "auditLog";
  const LS_CUR = "currentUserRun"; // quien está “logueado”
  const DOM = (sel, ctx=document)=>ctx.querySelector(sel);

  // helpers
  const dominiosOK = ["@duoc.cl", "@profesor.duoc.cl", "@gmail.com"];
  const correoValido = (v)=>{
    if (!v) return false;
    const s = String(v).trim().toLowerCase();
    if (s.length>100) return false;
    return dominiosOK.some(d => s.endsWith(d));
  };

  function loadLS(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    }catch(e){}
    return fallback;
  }
  function saveLS(key, data){ localStorage.setItem(key, JSON.stringify(data)); }

  function getUsuarios(){
    const seed = Array.isArray(window.usuarios) ? [...window.usuarios] : [];
    const fromLS = loadLS(LS_USU, []);
    if (Array.isArray(fromLS) && fromLS.length>0) return fromLS;
    // sembrar y devolver
    saveLS(LS_USU, seed);
    return seed;
  }

  function getCurrentAdmin(usuarios){
    const run = localStorage.getItem(LS_CUR);
    let u = null;
    if (run) u = usuarios.find(x => String(x.run).toUpperCase() === String(run).toUpperCase());
    if (!u) u = usuarios.find(x => String(x.perfil).toLowerCase() === "administrador") || usuarios[0];
    return u || null;
  }

  // regiones y comunas
  function fillRegiones(select){
    const regiones = Object.keys(window.regiones || {});
    select.innerHTML = regiones.map(r => `<option>${r}</option>`).join("");
  }
  function fillComunas(select, region){
    const comunas = (window.regiones && window.regiones[region]) ? window.regiones[region] : [];
    select.innerHTML = comunas.map(c => `<option>${c}</option>`).join("");
  }

  // pintar header
  function paintHeader(u){
    DOM('[data-ref="nombre-completo"]').textContent = `${u.nombre} ${u.apellidos}`;
    DOM('[data-ref="run"]').textContent = u.run;
    DOM('[data-ref="correo"]').textContent = u.correo;
    DOM('[data-ref="perfil"]').textContent = u.perfil;
  }

  // cargar form
  function paintForm(u){
    DOM('[data-ref="i-nombre"]').value    = u.nombre || "";
    DOM('[data-ref="i-apellidos"]').value = u.apellidos || "";
    DOM('[data-ref="i-correo"]').value    = u.correo || "";
    const selR = DOM('[data-ref="i-region"]');
    const selC = DOM('[data-ref="i-comuna"]');
    fillRegiones(selR);
    selR.value = u.region || selR.value;
    fillComunas(selC, selR.value);
    selC.value = u.comuna || selC.value;
    DOM('[data-ref="i-direccion"]').value = u.direccion || "";
    selR.addEventListener('change', ()=>{
      fillComunas(selC, selR.value);
    });
  }

  function invalid(input, msgRef, msg){
    input.classList.add('is-invalid');
    DOM(msgRef).textContent = msg;
  }
  function clearInvalid(){
    document.querySelectorAll('.is-invalid').forEach(el=>el.classList.remove('is-invalid'));
  }

  // validar y guardar
  function onGuardar(uActual, usuarios){
    clearInvalid();
    const iNom  = DOM('[data-ref="i-nombre"]');
    const iApe  = DOM('[data-ref="i-apellidos"]');
    const iCor  = DOM('[data-ref="i-correo"]');
    const iReg  = DOM('[data-ref="i-region"]');
    const iCom  = DOM('[data-ref="i-comuna"]');
    const iDir  = DOM('[data-ref="i-direccion"]');

    let ok = true;
    if (!iNom.value.trim() || iNom.value.length>50){ ok=false; invalid(iNom,'[data-ref="e-nombre"]','Requerido, máx 50.'); }
    if (!iApe.value.trim() || iApe.value.length>100){ ok=false; invalid(iApe,'[data-ref="e-apellidos"]','Requerido, máx 100.'); }
    if (!correoValido(iCor.value)){ ok=false; invalid(iCor,'[data-ref="e-correo"]','Correo inválido o dominio no permitido.'); }
    if (!iReg.value){ ok=false; invalid(iReg,'[data-ref="e-region"]','Seleccione región.'); }
    if (!iCom.value){ ok=false; invalid(iCom,'[data-ref="e-comuna"]','Seleccione comuna.'); }
    if (!iDir.value.trim() || iDir.value.length>300){ ok=false; invalid(iDir,'[data-ref="e-direccion"]','Requerido, máx 300.'); }
    if (!ok) return;

    // persistir: actualizamos SOLO su registro
    const idx = usuarios.findIndex(x => x.run === uActual.run);
    if (idx !== -1){
      usuarios[idx] = {
        ...usuarios[idx],
        nombre: iNom.value.trim(),
        apellidos: iApe.value.trim(),
        correo: iCor.value.trim(),
        region: iReg.value,
        comuna: iCom.value,
        direccion: iDir.value.trim(),
      };
      saveLS(LS_USU, usuarios);
      // actualizar header
      paintHeader(usuarios[idx]);
      // log
      pushAudit({ actor: uActual.run, entity:"perfil", action:"update", target: uActual.run });
      renderAudit(uActual.run);
      alert("Perfil actualizado ✅");
    }
  }

  // audit
  function loadAudit(){ return loadLS(LS_LOG, []); }
  function saveAudit(log){ saveLS(LS_LOG, log); }
  function pushAudit(entry){
    const log = loadAudit();
    log.unshift({ ...entry, at: new Date().toISOString() });
    saveAudit(log.slice(0,50)); // limita a 50
  }
  function renderAudit(run){
    const list = DOM('[data-ref="audit-list"]');
    const empty= DOM('[data-ref="audit-empty"]');
    const log = loadAudit().filter(x => !x.actor || x.actor===run).slice(0,10);
    if (log.length===0){
      list.classList.add('d-none'); empty.classList.remove('d-none');
      return;
    }
    empty.classList.add('d-none'); list.classList.remove('d-none');
    list.innerHTML = log.map(x=>{
      const d = new Date(x.at);
      const f = d.toLocaleString();
      return `<li class="list-group-item d-flex justify-content-between align-items-center">
        <div>
          <div class="small text-muted">${f}</div>
          <div><b>${x.action.toUpperCase()}</b> · ${x.entity} · ${x.target ?? ""}</div>
        </div>
        <span class="badge text-bg-secondary">${x.actor || "—"}</span>
      </li>`;
    }).join('');
  }

  // init
  document.addEventListener('DOMContentLoaded', ()=>{
    const usuarios = getUsuarios();
    const u = getCurrentAdmin(usuarios);
    if (!u){ alert("No hay usuario admin disponible."); return; }

    paintHeader(u);
    paintForm(u);
    renderAudit(u.run);

    DOM('[data-ref="btn-guardar"]').addEventListener('click', ()=> onGuardar(u, usuarios));
    DOM('[data-ref="btn-limpiar-log"]').addEventListener('click', ()=>{
      saveAudit([]); renderAudit(u.run);
    });
  });
})();
