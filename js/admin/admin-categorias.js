// js/admin/admin-categorias.js
(() => {
  const $ = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => [...ctx.querySelectorAll(s)];

  const LS_KEY_CATS = 'categorias';
  const LS_KEY_PRODS = 'productos';

  function loadCategorias() {
    try {
      const raw = localStorage.getItem(LS_KEY_CATS);
      if (raw) {
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
      }
    } catch {}
    return [];
  }
  function saveCategorias(arr) {
    try { localStorage.setItem(LS_KEY_CATS, JSON.stringify(arr)); } catch {}
  }
  function loadProductosSeedOrLS() {
    try {
      const raw = localStorage.getItem(LS_KEY_PRODS);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr;
      }
    } catch {}
    return Array.isArray(window.productos) ? window.productos : [];
  }

  let categorias = loadCategorias();

  function renderTabla() {
    const tbody = $('[data-ref="tbody"]');
    const rowEmpty = $('[data-ref="row-empty"]');
    if (!tbody) return;

    if (!Array.isArray(categorias) || categorias.length === 0) {
      if (rowEmpty) rowEmpty.classList.remove('d-none');
      tbody.querySelectorAll('tr:not([data-ref="row-empty"])').forEach(tr => tr.remove());
      return;
    }
    if (rowEmpty) rowEmpty.classList.add('d-none');

    tbody.querySelectorAll('tr:not([data-ref="row-empty"])').forEach(tr => tr.remove());
    categorias
      .slice()
      .sort((a,b) => a.localeCompare(b))
      .forEach(nombre => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${nombre}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-danger" data-action="del" data-id="${encodeURIComponent(nombre)}">Eliminar</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
  }

  function addCategoria(nombre) {
    const clean = String(nombre || '').trim();
    if (!clean) return { ok:false, msg:'Nombre requerido' };
    if (clean.length > 100) return { ok:false, msg:'Máximo 100 caracteres' };
    if (categorias.some(c => c.toLowerCase() === clean.toLowerCase())) return { ok:false, msg:'La categoría ya existe' };
    categorias = [...categorias, clean];
    saveCategorias(categorias);
    return { ok:true };
  }

  function delCategoria(nombre) {
    const clean = String(nombre || '').trim();
    categorias = categorias.filter(c => c !== clean);
    saveCategorias(categorias);
  }

  function seedFromProductos() {
    const prods = loadProductosSeedOrLS();
    const set = new Set(categorias);
    prods.forEach(p => { if (p && p.categoria) set.add(String(p.categoria)); });
    categorias = [...set];
    saveCategorias(categorias);
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Render inicial
    renderTabla();

    // Botón agregar
    $('[data-ref="btn-agregar"]').addEventListener('click', () => {
      const input = $('[data-ref="i-nombre"]');
      const error = $('[data-ref="e-nombre"]');
      input.classList.remove('is-invalid');
      if (error) error.textContent = '';
      const nombre = input.value;
      const res = addCategoria(nombre);
      if (!res.ok) {
        input.classList.add('is-invalid');
        if (error) error.textContent = res.msg;
        input.focus();
        return;
      }
      input.value = '';
      renderTabla();
    });

    // Sembrar desde catálogo
    $('[data-ref="btn-seed"]').addEventListener('click', () => {
      seedFromProductos();
      renderTabla();
    });

    // Eliminar
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action="del"]');
      if (!btn) return;
      const id = decodeURIComponent(btn.getAttribute('data-id') || '');
      if (!id) return;
      if (confirm(`¿Eliminar la categoría "${id}"?`)) {
        delCategoria(id);
        renderTabla();
      }
    });
  });
})();
