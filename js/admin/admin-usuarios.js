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
        return arr; // hay datos guardados
      }
    }
  } catch (e) { /* ignore */ }

  // 2) fallback: usar seed global (si existe) y sembrar en LS
  if (Array.isArray(window.usuarios) && window.usuarios.length > 0) {
    localStorage.setItem(LS_KEY_USU, JSON.stringify(window.usuarios));
    return [...window.usuarios];
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

function renderTabla(list){
  const tbody = el("table tbody");
  if (!tbody) return;
  tbody.innerHTML = list.map(u=>{
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
      <td>${u.region}</td>
      <td>${u.comuna}</td>
      <td>${badge}</td>
      <td class="text-end">
        <a class="btn btn-sm btn-outline-primary" href="./usuario-form.html?id=${encodeURIComponent(u.run)}">Editar</a>
        <button class="btn btn-sm btn-outline-danger" data-action="del" data-id="${u.run}">Eliminar</button>
      </td>
    </tr>
    `;
  }).join("");
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
  const btn = e.target.closest('button[data-action="del"]');
  if (!btn) return;
  const id = btn.getAttribute("data-id");
  if (!id) return;
  if (confirm(`¿Eliminar usuario ${id}?`)){
    dataUsuarios = dataUsuarios.filter(u => u.run !== id);
    saveUsuarios(dataUsuarios);
    aplicarFiltros();
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
});
