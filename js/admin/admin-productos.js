// /js/admin/admin-productos.js
(() => {
  // --- Helpers ---
  const fmtCLP = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
  const $ = (s, ctx = document) => ctx.querySelector(s);

  // --- Storage ---
  const LS_KEY = "productos";

  function loadProductosFromLS() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length > 0) return arr;
      }
    } catch (e) {}
    return [];
  }
  function seedFromWindowProductos() {
    const seed = Array.isArray(window.productos) ? [...window.productos] : [];
    if (seed.length > 0) {
      localStorage.setItem(LS_KEY, JSON.stringify(seed));
      return seed;
    }
    return [];
  }
  function loadProductos() {
    // 1) intenta LS
    const ls = loadProductosFromLS();
    if (ls.length > 0) return ls;
    // 2) si LS vacío, intenta seed inmediato
    return seedFromWindowProductos();
  }
  function saveProductos(arr) {
    localStorage.setItem(LS_KEY, JSON.stringify(arr));
  }

  // --- Datos base (única fuente en este archivo) ---
  let productosData = loadProductos();

  // Asegura que si el seed llegó después (por orden de scripts), lo siembre al cargar el DOM
  function ensureSeedIfEmpty() {
    if ((!Array.isArray(productosData) || productosData.length === 0) && Array.isArray(window.productos) && window.productos.length > 0) {
      productosData = [...window.productos];
      saveProductos(productosData);
      console.info("[admin-productos] Sembrado desde window.productos:", productosData.length, "items");
      aplicarFiltros(); // repintar
    }
  }

  // --- Render tabla ---
  function renderTabla(list) {
    const tbody = $("table tbody") || $('[data-ref="tbody"]');
    if (!tbody) {
      console.warn("[admin-productos] No se encontró <tbody> para renderizar");
      return;
    }
    tbody.innerHTML = list.map(p => `
      <tr>
        <td>${p.codigo}</td>
        <td>${p.nombre}</td>
        <td>${p.categoria ?? ""}</td>
        <td class="text-end">${fmtCLP.format(Number(p.precio) || 0)}</td>
        <td class="text-end ${p.stockCritico != null && Number(p.stock) <= Number(p.stockCritico) ? 'text-warning' : ''}"
            title="${(p.stockCritico != null && Number(p.stock) <= Number(p.stockCritico)) ? 'Stock bajo' : ''}">
          ${Number(p.stock) || 0}
        </td>
        <td class="text-end">
          <a class="btn btn-sm btn-outline-primary" href="./producto-form.html?id=${encodeURIComponent(p.codigo)}">Editar</a>
          <button class="btn btn-sm btn-outline-danger" data-action="del" data-id="${p.codigo}">Eliminar</button>
        </td>
      </tr>
    `).join("");
  }

  // --- Filtros ---
  function aplicarFiltros() {
    const q = ($('[data-ref="busqueda"]')?.value || "").trim().toLowerCase();
    const cat = ($('[data-ref="categoria"]')?.value || "").trim();

    let list = [...productosData];

    if (q) {
      list = list.filter(p =>
        String(p.codigo).toLowerCase().includes(q) ||
        String(p.nombre).toLowerCase().includes(q) ||
        String(p.categoria || "").toLowerCase().includes(q)
      );
    }
    if (cat) {
      list = list.filter(p => String(p.categoria) === cat);
    }
    renderTabla(list);
  }

  // --- Eliminar (persistente) ---
  function onTablaClick(e) {
    const btn = e.target.closest('button[data-action="del"]');
    if (!btn) return;
    const id = btn.getAttribute("data-id");
    if (!id) return;

    if (confirm(`¿Eliminar producto ${id}?`)) {
      productosData = productosData.filter(p => p.codigo !== id);
      saveProductos(productosData);
      aplicarFiltros();
    }
  }

  // --- Init ---
  document.addEventListener("DOMContentLoaded", () => {
    // 1) Siembra tardía si aplica
    ensureSeedIfEmpty();

    // 2) Completar categorías desde datos disponibles
    const selCat = $('[data-ref="categoria"]');
    if (selCat) {
      const base = (productosData.length ? productosData : (Array.isArray(window.productos) ? window.productos : []));
      const cats = [...new Set(base.map(p => p.categoria).filter(Boolean))].sort();
      selCat.innerHTML = ['<option value="">Todas las categorías</option>', ...cats.map(c => `<option>${c}</option>`)].join('');
    }

    // 3) Pintar y enganchar eventos
    renderTabla(productosData);
    $('[data-ref="busqueda"]')?.addEventListener("input", aplicarFiltros);
    $('[data-ref="categoria"]')?.addEventListener("change", aplicarFiltros);
    $('[data-ref="btn-filtrar"]')?.addEventListener("click", aplicarFiltros);
    $('[data-ref="btn-limpiar"]')?.addEventListener("click", () => {
      const b = $('[data-ref="busqueda"]');
      const c = $('[data-ref="categoria"]');
      if (b) b.value = "";
      if (c) c.value = "";
      aplicarFiltros();
    });

    document.addEventListener("click", onTablaClick);
  });
})();
