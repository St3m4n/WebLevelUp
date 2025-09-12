'use strict';
(function(){
  const CLP = (window.Carrito && window.Carrito.CLP) || new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

  const IMG_BY_CATEGORY = {
    'Juegos de Mesa': '../../assets/catan.webp',
    'Accesorios': '../../assets/teclados.avif',
    'Consolas': '../../assets/play5.webp',
    'Computadores Gamers': '../../assets/pcgamer.png',
    'Sillas Gamers': '../../assets/sillasecretlab.jpg',
    'Mouse': '../../assets/gamer.jpg',
    'Mousepad': '../../assets/gamer.jpg',
    'Poleras Personalizadas': '../../assets/gamer.jpg',
    'Polerones Gamers Personalizados': '../../assets/gamer.jpg'
  };

  const norm = (s) => String(s||'')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  const getQ = () => {
    const usp = new URLSearchParams(window.location.search);
    const q = usp.get('q');
    return q ? decodeURIComponent(q) : '';
  };

  function getMatches(q){
    const productos = Array.isArray(window.productos) ? window.productos : [];
    const qn = norm(q);
    if (!qn) return { items: [], cats: [] };

    // Coincidir por código exacto (sin normalizar; códigos suelen ser case-sensitive, pero permitimos case-insensitive)
    const byCode = productos.filter(p => String(p.codigo).toLowerCase() === qn);

    // Por nombre (parcial, insensible a acentos/mayúsculas)
    const byName = productos.filter(p => norm(p.nombre).includes(qn));

    // Por categoría (parcial)
    const byCat = productos.filter(p => norm(p.categoria).includes(qn));

    // Unir sin duplicados (prioridad: código > nombre > categoría)
    const seen = new Set();
    const items = [];
    const push = (p) => { const k = p.codigo; if (!seen.has(k)) { seen.add(k); items.push(p); } };
    byCode.forEach(push); byName.forEach(push); byCat.forEach(push);

    // Categorías relacionadas con conteos
    const catCount = new Map();
    items.forEach(p => {
      const c = p.categoria; catCount.set(c, (catCount.get(c)||0)+1);
    });
    const cats = Array.from(catCount.entries()).sort((a,b)=>b[1]-a[1]).map(([c,count])=>({ categoria:c, count }));

    return { items, cats };
  }

  function card(p){
    const img = IMG_BY_CATEGORY[p.categoria] || '../../assets/gamer.jpg';
    return `
      <div class="col">
        <div class="card h-100" data-producto data-codigo="${p.codigo}" data-nombre="${p.nombre}" data-precio="${p.precio}">
          <img src="${img}" class="card-img-top" alt="${p.nombre}">
          <div class="card-body d-flex flex-column text-center">
            <h5 class="card-title">${p.nombre}</h5>
            <p class="text-secondary">${p.categoria}</p>
            <div class="mt-auto">
              <h4 class="fw-bold mb-3" style="color: var(--color-accent-neon);">${CLP.format(p.precio)}</h4>
              <a href="producto.html?codigo=${encodeURIComponent(p.codigo)}" class="btn btn-view-product w-100">Ver Producto</a>
            </div>
          </div>
        </div>
      </div>`;
  }

  function paginate(arr, page, pageSize){
    const total = arr.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const p = Math.min(Math.max(1, page), totalPages);
    const start = (p - 1) * pageSize;
    const end = Math.min(start + pageSize, total);
    return { page: p, total, totalPages, items: arr.slice(start, end) };
  }

  function render(){
    const q = getQ();
    const msg = document.getElementById('search-msg');
    const grid = document.getElementById('results-grid');
    const catsList = document.getElementById('cats-list');
    const suggestBlock = document.getElementById('suggest-block');
    const suggestGrid = document.getElementById('suggest-grid');
    const input = document.getElementById('search-input');
    const paginationUl = document.getElementById('pagination');

    if (input) input.value = q;

    const { items, cats } = getMatches(q);
    const pageSize = 9;
    let currentPage = 1;

    function updateCats(){
      if (!catsList) return;
      catsList.innerHTML = cats.length ? cats.map(c => `<li class="mb-2"><a href="categoria.html?categoria=${encodeURIComponent(c.categoria)}&q=${encodeURIComponent(q)}" class="text-decoration-none">${c.categoria} <span class="badge bg-secondary">${c.count}</span></a></li>`).join('') : '<li class="text-secondary">Sin categorías relacionadas</li>';
    }

    function updatePagination(total){
      if (!paginationUl) return;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const mkLi = (label, page, disabled=false, active=false) => `
        <li class="page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}">
          <a class="page-link" href="#" data-page="${page}">${label}</a>
        </li>`;
      const itemsLi = [];
      itemsLi.push(mkLi('«', currentPage-1, currentPage===1));
      const windowSize = 2;
      const start = Math.max(1, currentPage - windowSize);
      const end = Math.min(totalPages, currentPage + windowSize);
      for (let p = start; p <= end; p++) itemsLi.push(mkLi(String(p), p, false, p===currentPage));
      itemsLi.push(mkLi('»', currentPage+1, currentPage===totalPages));
      paginationUl.innerHTML = itemsLi.join('');
      paginationUl.querySelectorAll('a.page-link').forEach(a => {
        a.addEventListener('click', (e)=>{
          e.preventDefault();
          const p = Number(a.getAttribute('data-page'));
          if (!Number.isFinite(p)) return;
          if (p < 1) return;
          currentPage = p;
          applyRender();
        });
      });
    }

    function applyRender(){
      if (msg) {
        const n = items.length;
        msg.textContent = q ? `Mostrando ${n} resultado${n!==1?'s':''} para "${q}"` : `Mostrando ${n} resultados`;
      }
      if (grid) {
        const pg = paginate(items, currentPage, pageSize);
        grid.innerHTML = pg.items.map(card).join('');
        updatePagination(items.length);
      }
      updateCats();

      if (items.length === 0 && suggestBlock && suggestGrid){
        suggestBlock.style.display = '';
        const productos = Array.isArray(window.productos) ? window.productos : [];
        suggestGrid.innerHTML = productos.slice(0,4).map(card).join('');
      } else if (suggestBlock){
        suggestBlock.style.display = 'none';
      }
    }

    const form = document.getElementById('search-again');
    if (form){
      form.addEventListener('submit', (e)=>{
        e.preventDefault();
        const raw = input ? input.value : '';
        const q2 = String(raw||'').trim();
        if (!q2) return;
        window.location.href = `busqueda.html?q=${encodeURIComponent(q2)}`;
      });
    }

    applyRender();
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
