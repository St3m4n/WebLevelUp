// /js/admin/admin-usuarios.js

const LS_KEY_USUARIOS = "usuarios";

function loadUsuarios() {
  try {
    const raw = localStorage.getItem(LS_KEY_USUARIOS);
    if (raw) {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    }
  } catch (e) { /* ignore */ }
  return Array.isArray(window.usuarios) ? [...window.usuarios] : [];
}

function saveUsuarios(arr) {
  localStorage.setItem(LS_KEY_USUARIOS, JSON.stringify(arr));
}

function el(q, ctx=document){ return ctx.querySelector(q); }
function els(q, ctx=document){ return [...ctx.querySelectorAll(q)]; }

let dataUsuarios = loadUsuarios();

function renderTabla(list){
  const tbody = el("table tbody");
  if (!tbody) return;
  tbody.innerHTML = list.map(u=>`
    <tr>
      <td>${u.run}</td>
      <td>${u.nombre}</td>
      <td>${u.apellidos}</td>
      <td>${u.correo}</td>
      <td>${u.perfil}</td>
      <td>${u.region}</td>
      <td>${u.comuna}</td>
      <td class="text-end">
        <a class="btn btn-sm btn-outline-primary" href="./usuario-form.html?id=${encodeURIComponent(u.run)}">Editar</a>
        <button class="btn btn-sm btn-outline-danger" data-action="del" data-id="${u.run}">Eliminar</button>
      </td>
    </tr>
  `).join("");
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
