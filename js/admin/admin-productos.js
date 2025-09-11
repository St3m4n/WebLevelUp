// /js/admin/admin-productos.js

// --- Formato CLP ---
const fmtCLP = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0
});

// --- Utils DOM ---
function el(q, ctx = document) { return ctx.querySelector(q); }
function els(q, ctx = document) { return [...ctx.querySelectorAll(q)]; }

// --- Storage helpers (productos) ---
const LS_KEY = "productos";

function loadProductos() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    }
  } catch (e) { /* ignore */ }
  // fallback a la semilla global si no hay LS
  return Array.isArray(window.productos) ? [...window.productos] : [];
}

function saveProductos(arr) {
  localStorage.setItem(LS_KEY, JSON.stringify(arr));
}

// --- Datos base (usar nombre distinto a "data" para evitar conflictos) ---
let productosData = loadProductos();

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

  let list = [...productosData];

  if (q) {
    list = list.filter(p =>
      String(p.codigo).toLowerCase().includes(q) ||
      String(p.nombre).toLowerCase().includes(q) ||
      String(p.categoria || "").toLowerCase().includes(q)
    );
  }
  if (cat) {
    list = list.filter(p => p.categoria === cat);
  }
  renderTabla(list);
}

// --- Eliminar (persistiendo en localStorage) ---
function onTablaClick(e) {
  const btn = e.target.closest('button[data-action="del"]');
  if (!btn) return;

  const id = btn.getAttribute("data-id");
  if (!id) return;

  if (confirm(`¿Eliminar producto ${id}?`)) {
    productosData = productosData.filter(p => p.codigo !== id);
    saveProductos(productosData);   // <-- persistir
    aplicarFiltros();
  }
}

// --- Inicialización ---
document.addEventListener("DOMContentLoaded", () => {
  // Rellenar select de categorías a partir de los datos (evita desincronización)
  const selCat = el('[data-ref="categoria"]');
  if (selCat) {
    const cats = [...new Set(productosData.map(p => p.categoria))].sort();
    selCat.innerHTML = ['<option value="">Todas las categorías</option>', ...cats.map(c => `<option>${c}</option>`)].join('');
  }

  // Pintar tabla inicial
  renderTabla(productosData);

  // Listeners filtros
  el('[data-ref="busqueda"]')?.addEventListener("input", aplicarFiltros);
  el('[data-ref="categoria"]')?.addEventListener("change", aplicarFiltros);

  // Botones Filtrar / Limpiar
  el('[data-ref="btn-filtrar"]')?.addEventListener("click", aplicarFiltros);
  el('[data-ref="btn-limpiar"]')?.addEventListener("click", () => {
    if (el('[data-ref="busqueda"]')) el('[data-ref="busqueda"]').value = "";
    if (el('[data-ref="categoria"]')) el('[data-ref="categoria"]').value = "";
    aplicarFiltros();
  });

  // Acciones de tabla
  document.addEventListener("click", onTablaClick);
});
