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

  function splitCategorias(list){
    return {
      activas: list.filter(c => !(c && c.name && c.deletedAt)).map(c => typeof c === 'string' ? { name:c } : c),
      eliminadas: list.filter(c => (c && c.deletedAt)).map(c => typeof c === 'string' ? { name:c, deletedAt:null } : c)
    };
  }

  function normalize(list){
    // soporta array de strings anterior o objetos {name, deletedAt}
    return (list||[]).map(c => typeof c === 'string' ? { name:c } : { name:String(c.name||''), deletedAt:c.deletedAt||null });
  }

  categorias = normalize(categorias);

  function saveCats(){ saveCategorias(categorias.map(c => c.deletedAt ? { name:c.name, deletedAt:c.deletedAt } : c.name)); }

  function renderTablas(){
    const tbodyA = $('[data-ref="tbody-cat-activas"]');
    const tbodyE = $('[data-ref="tbody-cat-eliminadas"]');
    const rowEmptyA = $('[data-ref="row-empty-act"]');
    const rowEmptyE = $('[data-ref="row-empty-del"]');
    if (!tbodyA || !tbodyE) return;

    const {activas, eliminadas} = splitCategorias(categorias);

    // activas
    tbodyA.innerHTML = '';
    if (!activas.length){ if(rowEmptyA) rowEmptyA.style.display=''; }
    else {
      if(rowEmptyA) rowEmptyA.style.display='none';
      activas
        .slice().sort((a,b)=> a.name.localeCompare(b.name))
        .forEach(c => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${c.name}</td>
            <td class="text-end">
              <button class="btn btn-sm btn-outline-danger" data-action="del" data-id="${encodeURIComponent(c.name)}">Eliminar</button>
            </td>`;
          tbodyA.appendChild(tr);
        });
    }

    // eliminadas
    tbodyE.innerHTML = '';
    if (!eliminadas.length){ if(rowEmptyE) rowEmptyE.style.display=''; }
    else {
      if(rowEmptyE) rowEmptyE.style.display='none';
      eliminadas
        .slice().sort((a,b)=> new Date(b.deletedAt||0) - new Date(a.deletedAt||0))
        .forEach(c => {
          const tr = document.createElement('tr');
          const fecha = c.deletedAt ? new Date(c.deletedAt).toLocaleString() : '';
          tr.innerHTML = `
            <td>${c.name}</td>
            <td>${fecha}</td>
            <td class="text-end">
              <button class="btn btn-sm btn-outline-success" data-action="restore" data-id="${encodeURIComponent(c.name)}">Restaurar</button>
            </td>`;
          tbodyE.appendChild(tr);
        });
    }
  }

  function addCategoria(nombre) {
    const clean = String(nombre || '').trim();
    if (!clean) return { ok:false, msg:'Nombre requerido' };
    if (clean.length > 100) return { ok:false, msg:'Máximo 100 caracteres' };
    if (categorias.some(c => c.toLowerCase() === clean.toLowerCase())) return { ok:false, msg:'La categoría ya existe' };
    categorias = [...categorias, clean];
    saveCategorias(categorias);
    try { window.audit?.log({ entity:'categoria', action:'create', target: clean }); } catch {}
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
  renderTablas();

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
      renderTablas();
    });

    // Eliminar lógico / Restaurar
    document.addEventListener('click', (e) => {
      const delBtn = e.target.closest('button[data-action="del"]');
      const resBtn = e.target.closest('button[data-action="restore"]');
      if (delBtn){
        const id = decodeURIComponent(delBtn.getAttribute('data-id')||'');
        const idx = categorias.findIndex(c => c.name === id && !c.deletedAt);
        if (idx<0) return;
        const runConfirm = (opts) => typeof window.confirmAction === 'function'
          ? window.confirmAction(opts)
          : Promise.resolve(window.confirm((opts.message||'¿Confirmar?').replace(/<[^>]*>/g, '')));
        runConfirm({
          title:'Eliminar categoría',
          message:`¿Eliminar la categoría <strong>${id}</strong>?`,
          confirmText:'Eliminar', cancelText:'Cancelar', variant:'danger'
        }).then(ok => {
          if(!ok) return;
          categorias[idx].deletedAt = new Date().toISOString();
          saveCats();
          try { window.audit?.log({ entity:'categoria', action:'delete', target: id }); } catch {}
          renderTablas();
        });
        return;
      }
      if (resBtn){
        const id = decodeURIComponent(resBtn.getAttribute('data-id')||'');
        const idx = categorias.findIndex(c => c.name === id && c.deletedAt);
        if (idx<0) return;
        const runConfirm = (opts) => typeof window.confirmAction === 'function'
          ? window.confirmAction(opts)
          : Promise.resolve(window.confirm((opts.message||'¿Confirmar?').replace(/<[^>]*>/g, '')));
        runConfirm({
          title:'Restaurar categoría',
          message:`¿Restaurar la categoría <strong>${id}</strong>?`,
          confirmText:'Restaurar', cancelText:'Cancelar', variant:'success'
        }).then(ok => {
          if(!ok) return;
          delete categorias[idx].deletedAt;
          saveCats();
          try { window.audit?.log({ entity:'categoria', action:'restore', target: id }); } catch {}
          renderTablas();
        });
      }
    });

    // Re-render al cambiar tab
    document.querySelectorAll('#categoriasTabs button[data-bs-toggle="tab"]').forEach(btn => {
      btn.addEventListener('shown.bs.tab', () => renderTablas());
    });
  });
})();
