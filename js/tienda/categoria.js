// js/tienda/categoria.js
// Renderiza dinámicamente los productos de una categoría usando window.productos
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

  function resolveImg(p){
    try {
      const raw = p && p.url ? String(p.url) : '';
      if (raw){
        if (window.location && String(window.location.pathname).includes('/pages/tienda/') && raw.startsWith('../assets/')){
          return raw.replace('../assets/', '../../assets/');
        }
        return raw;
      }
    } catch {}
    return IMG_BY_CATEGORY[p?.categoria] || '../../assets/gamer.jpg';
  }

  // Detecta si el usuario actual tiene beneficio DUOC (-20%)
  function hasDuocDiscount(){
    try {
      const ses = window.Session && typeof window.Session.get==='function' ? window.Session.get() : null;
      if (!ses) return false;
      const correo = String(ses.correo||'').toLowerCase();
      if (correo.endsWith('@duoc.cl')) return true;
      const lista = Array.isArray(window.usuarios) ? window.usuarios : [];
      const u = lista.find(x => String(x.correo||'').toLowerCase() === correo);
      return !!(u && u.descuentoVitalicio);
    } catch { return false; }
  }

  function norm(s){
    return String(s||'')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function getParamCategoria(){
    const usp = new URLSearchParams(window.location.search);
    const cat = usp.get('categoria');
    return cat ? decodeURIComponent(cat) : null;
  }

  function getParamQuery(){
    const usp = new URLSearchParams(window.location.search);
    const q = usp.get('q');
    return q ? decodeURIComponent(q) : '';
  }

  function uniqueCategories(list){
    const s = new Set();
    const out = [];
    for (const p of list){ if (p?.categoria && !s.has(p.categoria)){ s.add(p.categoria); out.push(p.categoria); } }
    return out;
  }

  function renderHeader(categoria, count, from=0, to=0){
    const titleEl = document.getElementById('category-title');
    const countEl = document.getElementById('category-count');
    if (titleEl) titleEl.textContent = categoria;
    if (countEl) {
      if (count > 0 && to >= from && to > 0) {
        countEl.textContent = `Mostrando ${from}-${to} de ${count} productos`;
      } else {
        countEl.textContent = `Mostrando ${count} de ${count} productos`;
      }
    }
  }

  function productCard(prod, categoria){
    const img = resolveImg(prod);
    const base = Number(prod.precio)||0;
    const duoc = hasDuocDiscount();
    const discounted = duoc ? Math.round(base * 0.8) : base;
    const precioFmt = CLP.format(discounted);
    return `
    <div class="col">
      <div class="card h-100 position-relative" data-producto data-codigo="${prod.codigo}" data-nombre="${prod.nombre}" data-precio="${discounted}">
        <img src="${img}" class="card-img-top" alt="${prod.nombre}">
        <div class="card-body d-flex flex-column text-center">
          <h5 class="card-title">${prod.categoria}</h5>
          <p class="card-text">
            <a href="producto.html?codigo=${encodeURIComponent(prod.codigo)}" class="stretched-link text-white text-decoration-none">${prod.nombre}</a>
          </p>
          <div class="mt-auto">
            <h4 class="fw-bold mb-3" style="color: var(--color-accent-neon);">
              ${duoc ? `<span class="text-decoration-line-through text-secondary me-2">${CLP.format(base)}</span> ${CLP.format(discounted)} <span class="badge bg-success ms-1">-20% DUOC</span>` : `${CLP.format(base)}`}
            </h4>
            <a href="#" class="btn btn-add-cart w-100" data-codigo="${prod.codigo}" data-nombre="${prod.nombre}" data-precio="${discounted}"><i class="bi bi-cart-plus-fill me-2"></i>Agregar al carrito</a>
          </div>
        </div>
      </div>
    </div>`;
  }

  function sortProducts(list, mode){
    const arr = [...list];
    if (mode === '1'){ // menor a mayor
      arr.sort((a,b)=>Number(a.precio)-Number(b.precio));
    } else if (mode === '2'){ // mayor a menor
      arr.sort((a,b)=>Number(b.precio)-Number(a.precio));
    }
    return arr;
  }

  function render(){
    const productos = Array.isArray(window.productos) ? window.productos : [];
    if (!productos.length) return;

    let categoria = getParamCategoria();
    const cats = uniqueCategories(productos);
    if (!categoria || !cats.includes(categoria)){
      categoria = cats[0] || 'Productos';
      const usp = new URLSearchParams(window.location.search);
      if (!usp.get('categoria')){
        history.replaceState(null, '', `?categoria=${encodeURIComponent(categoria)}`);
      }
    }

  const baseList = productos.filter(p => p.categoria === categoria);

    const grid = document.getElementById('products-grid');
    if (!grid) return;

    // sort init
  const sortSel = document.getElementById('sort-by');
  const stockChk = document.getElementById('f-stock');
  const minInput = document.getElementById('f-price-min');
  const maxInput = document.getElementById('f-price-max');
  const searchInput = document.getElementById('f-search');
    const pageSizeSel = document.getElementById('page-size');
    const paginationUl = document.getElementById('pagination');

    let currentPage = 1;

    function renderPagination(totalItems, pageSize){
      if (!paginationUl) return;
      const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
      if (currentPage > totalPages) currentPage = totalPages;
      const mkLi = (label, page, disabled=false, active=false) => `
        <li class="page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}">
          <a class="page-link" href="#" data-page="${page}">${label}</a>
        </li>`;
      const items = [];
      items.push(mkLi('«', currentPage-1, currentPage===1));
      const windowSize = 2;
      const start = Math.max(1, currentPage - windowSize);
      const end = Math.min(totalPages, currentPage + windowSize);
      for (let p = start; p <= end; p++) items.push(mkLi(String(p), p, false, p===currentPage));
      items.push(mkLi('»', currentPage+1, currentPage===totalPages));
      paginationUl.innerHTML = items.join('');
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

    // Inicializar búsqueda desde q (si viene de la barra global)
    const initialQ = getParamQuery();
    if (searchInput && initialQ) {
      searchInput.value = initialQ;
    }

    const applyRender = () => {
      const mode = sortSel?.value || '0';
      const mustStock = stockChk?.checked;
      const minV = Number(minInput?.value || 0) || 0;
      const maxV = Number(maxInput?.value || 0) || 0;
      const q = (searchInput?.value || '').trim();
      const qn = norm(q);

      let filtered = baseList.filter(p => {
        if (mustStock && !(Number(p.stock) > 0)) return false;
        if (minV && Number(p.precio) < minV) return false;
        if (maxV && Number(p.precio) > maxV) return false;
        if (qn && !norm(p.nombre).includes(qn)) return false;
        return true;
      });

      const sorted = sortProducts(filtered, mode);
      const pageSize = Number(pageSizeSel?.value || 9) || 9;
      const total = sorted.length;
      const fromIdx = total ? (currentPage - 1) * pageSize : 0;
      const toIdx = total ? Math.min(fromIdx + pageSize, total) : 0;
      const pageItems = sorted.slice(fromIdx, toIdx);
      grid.innerHTML = pageItems.map(p=>productCard(p, categoria)).join('');
      renderHeader(categoria, total, total ? fromIdx+1 : 0, total ? toIdx : 0);
      renderPagination(total, pageSize);
      try { if (window.Carrito) window.Carrito.renderBadge(); } catch {}
    };

    sortSel?.addEventListener('change', ()=>{ currentPage = 1; applyRender(); });
    stockChk?.addEventListener('change', ()=>{ currentPage = 1; applyRender(); });
    minInput?.addEventListener('input', ()=>{ currentPage = 1; applyRender(); });
    maxInput?.addEventListener('input', ()=>{ currentPage = 1; applyRender(); });
    searchInput?.addEventListener('input', ()=>{ currentPage = 1; applyRender(); });
    pageSizeSel?.addEventListener('change', ()=>{ currentPage = 1; applyRender(); });
    applyRender();
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
