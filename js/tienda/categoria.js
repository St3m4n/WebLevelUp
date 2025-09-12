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

  function getParamCategoria(){
    const usp = new URLSearchParams(window.location.search);
    const cat = usp.get('categoria');
    return cat ? decodeURIComponent(cat) : null;
  }

  function uniqueCategories(list){
    const s = new Set();
    const out = [];
    for (const p of list){ if (p?.categoria && !s.has(p.categoria)){ s.add(p.categoria); out.push(p.categoria); } }
    return out;
  }

  function renderHeader(categoria, count){
    const titleEl = document.getElementById('category-title');
    const countEl = document.getElementById('category-count');
    if (titleEl) titleEl.textContent = categoria;
    if (countEl) countEl.textContent = `Mostrando ${count} de ${count} productos`;
  }

  function productCard(prod, categoria){
    const img = IMG_BY_CATEGORY[categoria] || '../../assets/gamer.jpg';
    const precioFmt = CLP.format(Number(prod.precio)||0);
    return `
    <div class="col">
      <div class="card h-100 position-relative" data-producto data-codigo="${prod.codigo}" data-nombre="${prod.nombre}" data-precio="${prod.precio}">
        <img src="${img}" class="card-img-top" alt="${prod.nombre}">
        <div class="card-body d-flex flex-column text-center">
          <h5 class="card-title">${prod.categoria}</h5>
          <p class="card-text">
            <a href="#" class="stretched-link text-white text-decoration-none">${prod.nombre}</a>
          </p>
          <div class="mt-auto">
            <h4 class="fw-bold mb-3" style="color: var(--color-accent-neon);">${precioFmt}</h4>
            <a href="#" class="btn btn-add-cart w-100" data-codigo="${prod.codigo}" data-nombre="${prod.nombre}" data-precio="${prod.precio}"><i class="bi bi-cart-plus-fill me-2"></i>Agregar al carrito</a>
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

  function updateSecondaryNavLinks(){
    const nav = document.querySelector('.secondary-nav');
    const productos = Array.isArray(window.productos) ? window.productos : [];
    const cats = uniqueCategories(productos);
    if (!nav) return;
    const links = nav.querySelectorAll('a.nav-link');
    links.forEach((a, idx)=>{
      const cat = cats[idx] || a.textContent?.trim() || '';
      a.href = `categoria.html?categoria=${encodeURIComponent(cat)}`;
    });
  }

  function render(){
    const productos = Array.isArray(window.productos) ? window.productos : [];
    if (!productos.length) return;
    updateSecondaryNavLinks();

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

    const applyRender = () => {
      const mode = sortSel?.value || '0';
      const mustStock = stockChk?.checked;
      const minV = Number(minInput?.value || 0) || 0;
      const maxV = Number(maxInput?.value || 0) || 0;
      const q = (searchInput?.value || '').trim().toLowerCase();

      let filtered = baseList.filter(p => {
        if (mustStock && !(Number(p.stock) > 0)) return false;
        if (minV && Number(p.precio) < minV) return false;
        if (maxV && Number(p.precio) > maxV) return false;
        if (q && !String(p.nombre).toLowerCase().includes(q)) return false;
        return true;
      });

      const sorted = sortProducts(filtered, mode);
      grid.innerHTML = sorted.map(p=>productCard(p, categoria)).join('');
      renderHeader(categoria, sorted.length);
      try { if (window.Carrito) window.Carrito.renderBadge(); } catch {}
    };

  sortSel?.addEventListener('change', applyRender);
  stockChk?.addEventListener('change', applyRender);
  minInput?.addEventListener('input', applyRender);
  maxInput?.addEventListener('input', applyRender);
  searchInput?.addEventListener('input', applyRender);
    applyRender();
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
