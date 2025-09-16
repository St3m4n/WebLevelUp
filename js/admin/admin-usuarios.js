// /js/admin/admin-usuarios.js

// --- Storage helpers ---
const LS_KEY_USU = "usuarios";

function loadUsuarios() {
  // 1) intenta desde localStorage
  try {
    const raw = localStorage.getItem(LS_KEY_USU);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length > 0) {
        // Asegurar usuario system
        const hasSystem = arr.some(u => u && (u.isSystem || String(u.correo||'').toLowerCase()==='system@levelup.local'));
        if (!hasSystem) {
          arr.unshift({ run:"000000000", nombre:"System", apellidos:"", correo:"system@levelup.local", perfil:"Administrador", fechaNacimiento:null, region:"", comuna:"", direccion:"", descuentoVitalicio:false, isSystem:true });
          localStorage.setItem(LS_KEY_USU, JSON.stringify(arr));
        }
        return arr; // hay datos guardados
      }
    }
  } catch (e) { /* ignore */ }

  // 2) fallback: usar seed global (si existe) y sembrar en LS
  if (Array.isArray(window.usuarios) && window.usuarios.length > 0) {
    // Asegurar que exista el usuario system en seed
    const seed = [...window.usuarios];
    const hasSystem = seed.some(u => u && (u.isSystem || String(u.correo||'').toLowerCase()==='system@levelup.local'));
    if (!hasSystem) seed.unshift({ run:"000000000", nombre:"System", apellidos:"", correo:"system@levelup.local", perfil:"Administrador", fechaNacimiento:null, region:"", comuna:"", direccion:"", descuentoVitalicio:false, isSystem:true });
    localStorage.setItem(LS_KEY_USU, JSON.stringify(seed));
    return seed;
  }

  // 3) nada de nada
  return [];
}

function saveUsuarios(arr) {
  // Fixed key: use LS_KEY_USU consistently
  localStorage.setItem(LS_KEY_USU, JSON.stringify(arr));
}

function el(q, ctx=document){ return ctx.querySelector(q); }
function els(q, ctx=document){ return [...ctx.querySelectorAll(q)]; }

function formatRunDisplay(runRaw){
  const clean = String(runRaw || "").toUpperCase().replace(/[^0-9K]/g,'');
  if (clean.length < 2) return clean;
  const body = clean.slice(0,-1), dv = clean.slice(-1);
  let out = '', cnt=0;
  for (let i=body.length-1; i>=0; i--){
    out = body[i] + out; cnt++;
    if (cnt===3 && i!==0){ out = '.' + out; cnt=0; }
  }
  return `${out}-${dv}`;
}

let dataUsuarios = loadUsuarios();
let sortState = { activos: { key: 'run', dir: 'asc' }, eliminados: { key: 'deletedAt', dir: 'desc' } };

function addrKey(correo){ return `user:addresses:${String(correo||'').toLowerCase()}`; }
function loadAddressesByCorreo(correo){
  try {
    const raw = localStorage.getItem(addrKey(correo));
    const arr = JSON.parse(raw || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function getPrimaryAddressFor(correo){
  const list = loadAddressesByCorreo(correo);
  if (!list.length) return null;
  const pri = list.find(a => a && a.isPrimary) || list[0];
  return pri || null;
}

function normStr(v){ return String(v||'').toLowerCase(); }
function cmp(a,b){ return a<b?-1:a>b?1:0; }
function sortList(list, tab){
  const state = tab==='eliminados' ? sortState.eliminados : sortState.activos;
  const key = state.key; const dir = state.dir==='desc'?-1:1;
  const arr = [...list];
  arr.sort((u1,u2)=>{
    let v1, v2;
    if (key==='run') { v1 = normStr(u1.run); v2 = normStr(u2.run); }
    else if (key==='nombre') { v1 = normStr(u1.nombre); v2 = normStr(u2.nombre); }
    else if (key==='apellidos') { v1 = normStr(u1.apellidos); v2 = normStr(u2.apellidos); }
    else if (key==='correo') { v1 = normStr(u1.correo); v2 = normStr(u2.correo); }
    else if (key==='perfil') { v1 = normStr(u1.perfil); v2 = normStr(u2.perfil); }
    else if (key==='descuento') {
      const d1 = !!u1.descuentoVitalicio || (String(u1.correo||'').toLowerCase().endsWith('@duoc.cl') && u1.perfil==='Cliente');
      const d2 = !!u2.descuentoVitalicio || (String(u2.correo||'').toLowerCase().endsWith('@duoc.cl') && u2.perfil==='Cliente');
      v1 = d1?1:0; v2 = d2?1:0;
    } else if (key==='deletedAt') {
      v1 = u1.deletedAt ? new Date(u1.deletedAt).getTime() : 0;
      v2 = u2.deletedAt ? new Date(u2.deletedAt).getTime() : 0;
    } else { v1 = normStr(u1.run); v2 = normStr(u2.run); }
    return cmp(v1, v2) * dir;
  });
  return arr;
}

function applySortCtaindicators(){
  // Limpia indicadores
  document.querySelectorAll('#tabActivos thead th .sort-caret, #tabEliminados thead th .sort-caret').forEach(s=>{ s.textContent=''; });
  const a = sortState.activos; const e = sortState.eliminados;
  const thA = document.querySelector(`#tabActivos thead th[data-sort="${a.key}"] .sort-caret`);
  const thE = document.querySelector(`#tabEliminados thead th[data-sort="${e.key}"] .sort-caret`);
  if (thA) thA.textContent = a.dir==='asc' ? '▲' : '▼';
  if (thE) thE.textContent = e.dir==='asc' ? '▲' : '▼';
}

function renderTabla(list){
  const tbodyAct = el('[data-ref="tbody-activos"]');
  const tbodyDel = el('[data-ref="tbody-eliminados"]');
  if (!tbodyAct || !tbodyDel) return;

  let activos = list.filter(u => !u.deletedAt);
  let eliminados = list.filter(u => !!u.deletedAt);

  // Ordenar según estado actual
  activos = sortList(activos, 'activos');
  eliminados = sortList(eliminados, 'eliminados');

  tbodyAct.innerHTML = activos.map(u=>{
    const domain = String(u.correo||'').toLowerCase().split('@')[1] || '';
    const hasDiscount = !!u.descuentoVitalicio || (u.perfil === 'Cliente' && domain === 'duoc.cl');
    const badge = hasDiscount ? '<span class="badge bg-success">20% DUOC</span>' : '';
    return `
    <tr>
      <td>${formatRunDisplay(u.run)}</td>
      <td>${u.nombre}</td>
      <td>${u.apellidos}</td>
      <td>${u.correo}</td>
      <td>${u.perfil}</td>
      <td>${badge}</td>
      <td class="text-end">
        <div class="d-inline-flex gap-1 align-items-center">
          <button class="btn btn-sm btn-outline-light" data-action="view" data-id="${u.run}"><i class="bi bi-eye"></i> Ver</button>
          ${u.isSystem 
            ? '<button class="btn btn-sm btn-outline-secondary" disabled title="Usuario protegido">Editar</button>'
            : `<a class="btn btn-sm btn-outline-primary" href="./usuario-form.html?id=${encodeURIComponent(u.run)}">Editar</a>`}
          ${u.isSystem ? '<button class="btn btn-sm btn-outline-secondary" disabled title="Usuario protegido">Eliminar</button>' : `<button class="btn btn-sm btn-outline-danger" data-action="del" data-id="${u.run}">Eliminar</button>`}
        </div>
      </td>
    </tr>
    `;
  }).join("");

  tbodyDel.innerHTML = eliminados.map(u=>{
    const fecha = new Date(u.deletedAt).toLocaleString();
    return `
    <tr>
      <td>${formatRunDisplay(u.run)}</td>
      <td>${u.correo}</td>
      <td>${u.perfil}</td>
      <td>${fecha}</td>
      <td class="text-end">
        <div class="d-inline-flex gap-2 align-items-center">
          <button class="btn btn-sm btn-outline-light" data-action="view" data-id="${u.run}"><i class="bi bi-eye"></i> Ver</button>
          <button class="btn btn-sm btn-outline-success" data-action="restore" data-id="${u.run}"><i class="bi bi-arrow-counterclockwise"></i> Restaurar</button>
        </div>
      </td>
    </tr>
    `;
  }).join("");

  applySortCtaindicators();
}

function aplicarFiltros(){
  const q = (el('[data-ref="busqueda"]')?.value || "").trim().toLowerCase();
  const perfil = (el('[data-ref="perfil"]')?.value || "").trim();

  let list = [...dataUsuarios];

  if (q){
    list = list.filter(u =>
      u.run.toLowerCase().includes(q) ||
      u.nombre.toLowerCase().includes(q) ||
      u.apellidos.toLowerCase().includes(q) ||
      u.correo.toLowerCase().includes(q)
    );
  }
  if (perfil){
    list = list.filter(u => u.perfil === perfil);
  }

  renderTabla(list);
}

function onTablaClick(e){
  const delBtn = e.target.closest('button[data-action="del"]');
  const viewBtn = e.target.closest('button[data-action="view"]');
  const restoreBtn = e.target.closest('button[data-action="restore"]');

  // Eliminar (lógico)
  if (delBtn){
    const id = delBtn.getAttribute("data-id");
    if (!id) return;
    const u = dataUsuarios.find(x => x.run === id);
    if (!u) return;
    if (u.isSystem || String(u.correo||'').toLowerCase()==='system@levelup.local'){
      alert('Este usuario está protegido y no puede eliminarse.');
      return;
    }
    if (confirm(`¿Eliminar usuario ${id}?`)){
      u.deletedAt = new Date().toISOString();
      saveUsuarios(dataUsuarios);
      aplicarFiltros();
    }
    return;
  }

  // Ver (solo lectura)
  if (viewBtn){
    const id = viewBtn.getAttribute('data-id');
    const u = dataUsuarios.find(x => x.run === id);
    if (!u) return;
    try {
      const m = new bootstrap.Modal(document.getElementById('userViewModal'));
      // Poblar datos básicos
      el('[data-ref="view-run"]').textContent = formatRunDisplay(u.run);
      el('[data-ref="view-correo"]').textContent = u.correo || '';
      el('[data-ref="view-nombre"]').textContent = u.nombre || '';
      el('[data-ref="view-apellidos"]').textContent = u.apellidos || '';
      el('[data-ref="view-perfil"]').textContent = u.perfil || '';
      // Preferir dirección principal
      const pri = getPrimaryAddressFor(u.correo);
      el('[data-ref="view-region"]').textContent = pri?.region || u.region || '';
      el('[data-ref="view-comuna"]').textContent = pri?.city || u.comuna || '';

      // Historial de pedidos
      const tbody = document.getElementById('user-orders-body');
      const empty = document.getElementById('user-orders-empty');
      if (tbody){
        // limpiar filas previas
        [...tbody.querySelectorAll('tr')].forEach(tr=>{ if (tr.id !== 'user-orders-empty') tr.remove(); });
        const key = `user:orders:${String(u.correo||'').toLowerCase()}`;
        let orders = [];
        try { const raw = localStorage.getItem(key); orders = raw ? JSON.parse(raw) : []; if (!Array.isArray(orders)) orders = []; } catch { orders = []; }
        if (!orders.length){ if (empty) empty.style.display=''; } else {
          if (empty) empty.style.display='none';
          const CLP = new Intl.NumberFormat('es-CL',{ style:'currency', currency:'CLP' });
          orders.forEach(o => {
            const tr = document.createElement('tr');
            const fecha = o.date ? new Date(o.date).toLocaleString() : '';
            tr.innerHTML = `
              <td>${String(o.id||'')}</td>
              <td>${fecha}</td>
              <td>${CLP.format(Number(o.total||0))}</td>
              <td>${String(o.estado||'Pagado')}</td>
            `;
            tbody.appendChild(tr);
          });
        }
      }
      m.show();
    } catch {}
    return;
  }

  // Restaurar
  if (restoreBtn){
    const id = restoreBtn.getAttribute('data-id');
    const u = dataUsuarios.find(x => x.run === id);
    if (!u) return;
    if (confirm(`¿Restaurar usuario ${formatRunDisplay(u.run)}?`)){
      delete u.deletedAt;
      saveUsuarios(dataUsuarios);
      aplicarFiltros();
    }
    return;
  }
}

document.addEventListener("DOMContentLoaded", ()=>{
  renderTabla(dataUsuarios);

  el('[data-ref="busqueda"]')?.addEventListener("input", aplicarFiltros);
  el('[data-ref="perfil"]')?.addEventListener("change", aplicarFiltros);
  el('[data-ref="btn-filtrar"]')?.addEventListener("click", aplicarFiltros);
  el('[data-ref="btn-limpiar"]')?.addEventListener("click", ()=>{
    el('[data-ref="busqueda"]').value = "";
    el('[data-ref="perfil"]').value = "";
    aplicarFiltros();
  });

  document.addEventListener("click", onTablaClick);

  // Re-render on tab switch to ensure latest data is shown
  els('#usuariosTabs button[data-bs-toggle="tab"]').forEach(btn => {
    btn.addEventListener('shown.bs.tab', () => aplicarFiltros());
  });

  // Sort handlers
  function onSortClick(ev){
    const th = ev.target.closest('th[data-sort]');
    if (!th) return;
    const key = th.getAttribute('data-sort');
    const isElim = th.closest('#tabEliminados') ? true : false;
    const state = isElim ? sortState.eliminados : sortState.activos;
    if (state.key === key){ state.dir = state.dir==='asc'?'desc':'asc'; }
    else { state.key = key; state.dir = key==='deletedAt' ? 'desc' : 'asc'; }
    aplicarFiltros();
  }
  document.querySelectorAll('#tabActivos thead, #tabEliminados thead').forEach(thead=>{
    thead.addEventListener('click', onSortClick);
  });
});
