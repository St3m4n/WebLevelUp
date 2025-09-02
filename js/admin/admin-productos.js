// js/admin/admin-productos.js

// --- Utilidades ---
const fmtCLP = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0
});

function el(q, ctx = document) { return ctx.querySelector(q); }
function els(q, ctx = document) { return [...ctx.querySelectorAll(q)]; }

// Layover para esta página
let data = Array.isArray(productos) ? [...productos] : [];

// --- Render tabla ---
function renderTabla(list) {
  const tbody = el("table tbody");
  if (!tbody) return;

  tbody.innerHTML = list.map(p => `
    <tr>
      <td>${p.codigo}</td>
      <td>${p.nombre}</td>
      <td>${p.categoria}</td>
      <td class="text-end">${fmtCLP.format(p.precio)}</td>
      <td class="text-end ${p.stockCritico != null && p.stock <= p.stockCritico ? 'text-warning' : ''}">${p.stock}</td>
      <td class="text-end">
        <a class="btn btn-sm btn-outline-primary" href="./producto-form.html?id=${encodeURIComponent(p.codigo)}">Editar</a>
        <button class="btn btn-sm btn-outline-danger" data-action="del" data-id="${p.codigo}">Eliminar</button>
      </td>
    </tr>
  `).join("");
}

// --- Filtros (búsqueda + categoría) ---
function aplicarFiltros() {
  const q = (el('[data-ref="busqueda"]')?.value || "").trim().toLowerCase();
  const cat = (el('[data-ref="categoria"]')?.value || "").trim();

  let list = [...data];

  if (q) {
    list = list.filter(p =>
      p.codigo.toLowerCase().includes(q) ||
      p.nombre.toLowerCase().includes(q) ||
      (p.categoria || "").toLowerCase().includes(q)
    );
  }
  if (cat) {
    list = list.filter(p => p.categoria === cat);
  }
  renderTabla(list);
}

// --- Eliminar (en memoria por ahora) ---
function onTablaClick(e) {
  const btn = e.target.closest('button[data-action="del"]');
  if (!btn) return;

  const id = btn.getAttribute("data-id");
  if (!id) return;

  if (confirm(`¿Eliminar producto ${id}?`)) {
    data = data.filter(p => p.codigo !== id);
    aplicarFiltros();
    // Próxima etapa: persistir en localStorage
  }
}

// --- Inicialización ---
document.addEventListener("DOMContentLoaded", () => {
  // Rellenar select de categorías a partir de los datos (evita desincronización)
  const selCat = el('[data-ref="categoria"]');
  if (selCat) {
    const cats = [...new Set(data.map(p => p.categoria))].sort();
    selCat.innerHTML = ['<option value="">Todas las categorías</option>', ...cats.map(c => `<option>${c}</option>`)].join('');
  }

  // Pintar tabla inicial
  renderTabla(data);

  // Listeners filtros
  el('[data-ref="busqueda"]')?.addEventListener("input", aplicarFiltros);
  el('[data-ref="categoria"]')?.addEventListener("change", aplicarFiltros);

  // Botones Filtrar / Limpiar (si los usas)
  el('[data-ref="btn-filtrar"]')?.addEventListener("click", aplicarFiltros);
  el('[data-ref="btn-limpiar"]')?.addEventListener("click", () => {
    if (el('[data-ref="busqueda"]')) el('[data-ref="busqueda"]').value = "";
    if (el('[data-ref="categoria"]')) el('[data-ref="categoria"]').value = "";
    aplicarFiltros();
  });

  // Acciones de tabla
  document.addEventListener("click", onTablaClick);
});