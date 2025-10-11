// js/tienda/producto.js
// Render dinámico de detalle de producto con ?codigo= o ?nombre=
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
      if (window.LevelUpAssets && typeof window.LevelUpAssets.resolveProductImage === 'function'){
        return window.LevelUpAssets.resolveProductImage(p, { byCategory: IMG_BY_CATEGORY });
      }
    } catch {}
    try {
      const raw = p && p.url ? String(p.url) : '';
      if (raw) {
        if (window.location && String(window.location.pathname).includes('/pages/tienda/') && raw.startsWith('../assets/')){
          return raw.replace('../assets/', '../../assets/');
        }
        return raw;
      }
    } catch {}
    return IMG_BY_CATEGORY[p?.categoria] || '../../assets/gamer.jpg';
  }

  function getQuery(){
    const usp = new URLSearchParams(window.location.search);
    return {
      codigo: usp.get('codigo'),
      nombre: usp.get('nombre')
    };
  }

  function findProducto(){
    const list = Array.isArray(window.productos) ? window.productos : [];
    const { codigo, nombre } = getQuery();
    if (codigo){
      const byCode = list.find(p => String(p.codigo) === String(codigo));
      if (byCode) return byCode;
    }
    if (nombre){
      const lower = String(nombre).toLowerCase();
      const byName = list.find(p => String(p.nombre).toLowerCase() === lower);
      if (byName) return byName;
    }
    return null;
  }

  function renderRelated(actual){
    const grid = document.getElementById('related-grid');
    if (!grid) return;
    const list = (window.productos||[]).filter(p => p.categoria === actual.categoria && p.codigo !== actual.codigo).slice(0,4);
    grid.innerHTML = list.map(p => {
      const img = resolveImg(p);
      return `
        <div class="col">
          <div class="card h-100" data-producto data-codigo="${p.codigo}" data-nombre="${p.nombre}" data-precio="${p.precio}">
            <img src="${img}" class="card-img-top" alt="${p.nombre}">
            <div class="card-body d-flex flex-column text-center">
              <h5 class="card-title">${p.nombre}</h5>
              <p class="card-text">${p.categoria}</p>
              <div class="mt-auto">
                <h4 class="fw-bold mb-3" style="color: var(--color-accent-neon);">${CLP.format(p.precio)}</h4>
                <a href="producto.html?codigo=${encodeURIComponent(p.codigo)}" class="btn btn-view-product w-100">Ver Producto</a>
              </div>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  function render(){
    const p = findProducto();
    if (!p){
      // Si no hay producto válido, redirigir a categorías
      window.location.replace('categorias.html');
      return;
    }
  const img = resolveImg(p);
    // Breadcrumbs
    const bcCat = document.getElementById('bc-categoria');
    const bcProd = document.getElementById('bc-producto');
    if (bcCat) { bcCat.textContent = p.categoria; bcCat.href = `categoria.html?categoria=${encodeURIComponent(p.categoria)}`; }
    if (bcProd) { bcProd.textContent = p.nombre; }

    // Header
  document.getElementById('product-image').src = img;
    document.getElementById('product-image').alt = p.nombre;
    document.getElementById('product-title').textContent = p.nombre;
    document.getElementById('product-code').textContent = `Código: ${p.codigo}`;
    // Detectar descuento DUOC (20%) por sesión
    function hasDuocDiscount(){
      try {
        const ses = window.Session && typeof window.Session.get==='function' ? window.Session.get() : null;
        if (!ses) return false;
        const correo = String(ses.correo||'').toLowerCase();
        if (correo.endsWith('@duoc.cl')) return true;
        // Buscar en usuarios fusionados si existe flag descuentoVitalicio
        const lista = Array.isArray(window.usuarios) ? window.usuarios : [];
        const u = lista.find(x => String(x.correo||'').toLowerCase() === correo);
        return !!(u && u.descuentoVitalicio);
      } catch { return false; }
    }
    const hasDiscount = hasDuocDiscount();
    const priceEl = document.getElementById('product-price');
    const basePrice = Number(p.precio)||0;
    const discounted = hasDiscount ? Math.round(basePrice * 0.8) : basePrice;
    if (hasDiscount){
      priceEl.innerHTML = `<span class="text-decoration-line-through text-secondary me-2">${CLP.format(basePrice)}</span> <span>${CLP.format(discounted)} CLP</span> <span class="badge bg-success ms-2">-20% DUOC</span>`;
    } else {
      priceEl.textContent = `${CLP.format(basePrice)} CLP`;
    }

  const desc = document.getElementById('product-desc');
  const descLong = document.getElementById('desc-long');
  const d = (p.descripcion && String(p.descripcion).trim()) || null;
  if (desc) desc.textContent = d || `Categoría: ${p.categoria}. Stock disponible: ${p.stock}.`;
  if (descLong) descLong.textContent = d || `${p.nombre} es parte de nuestra categoría ${p.categoria}.`;

  // Fabricante y Distribuidor
  const makerEl = document.getElementById('product-maker');
  const supplierEl = document.getElementById('product-supplier');
  if (makerEl) makerEl.textContent = (p.fabricante && String(p.fabricante).trim()) || '—';
  if (supplierEl) supplierEl.textContent = 'Level-Up Gamer';

    // Specs (placeholder amigable)
    const specs = document.getElementById('specs-list');
    if (specs){
      const maker = (p.fabricante && String(p.fabricante).trim()) || '';
      const supplier = 'Level-Up Gamer';
      specs.innerHTML = `
        <li><strong>Categoría:</strong> ${p.categoria}</li>
        <li><strong>Stock:</strong> ${p.stock}</li>
        <li><strong>Código:</strong> ${p.codigo}</li>
        <li><strong>Precio:</strong> ${CLP.format(p.precio)}</li>
        ${maker ? `<li><strong>Fabricante:</strong> ${maker}</li>` : ''}
        <li><strong>Distribuidor:</strong> ${supplier}</li>
      `;
    }

    // Cantidad y botón agregar
    const qtyInput = document.getElementById('qty');
    const btnAdd = document.getElementById('btn-add');
    const qtyBox = document.getElementById('qty-box');
    const earnEl = document.getElementById('lug-earn-points');
    function updateEarn(){
      try {
  if (maxStock <= 0) { if (earnEl) earnEl.textContent = `+0 EXP`; return; }
        const qty = Math.max(1, Number(qtyInput?.value||1)||1);
        const unit = Number(discounted)||0;
        const total = unit * qty;
        const pts = Math.floor(total / 1000) * ((window.LevelUpPoints && LevelUpPoints.CONFIG && Number.isFinite(LevelUpPoints.CONFIG.COMPRA_POR_1000)) ? LevelUpPoints.CONFIG.COMPRA_POR_1000 : 1);
  if (earnEl) earnEl.textContent = `+${pts} EXP`;
  } catch { if (earnEl) earnEl.textContent = '+0 EXP'; }
    }
    // Límite por stock
    const maxStock = Number(p.stock)||0;
    if (qtyInput){
      qtyInput.max = String(Math.max(1, maxStock));
      if (maxStock <= 0){
        qtyInput.value = 0;
        if (btnAdd){ btnAdd.disabled = true; btnAdd.textContent = 'Sin stock'; btnAdd.classList.add('disabled'); }
      }
    }
    if (qtyBox){
      qtyBox.addEventListener('click', (e)=>{
        if (e.target.closest('[data-action="dec"]')){
          let v = Number(qtyInput.value||1);
          v = Math.max(1, v-1);
          if (maxStock > 0) v = Math.min(v, maxStock);
          qtyInput.value = v; btnAdd.setAttribute('data-cantidad', String(v)); updateEarn();
        }
        if (e.target.closest('[data-action="inc"]')){
          let v = Number(qtyInput.value||1);
          v = v+1;
          if (maxStock > 0) v = Math.min(v, maxStock);
          qtyInput.value = v; btnAdd.setAttribute('data-cantidad', String(v)); updateEarn();
        }
      });
      qtyInput.addEventListener('input', ()=>{
        let v = Number(qtyInput.value||1);
        if (!Number.isFinite(v) || v<1) v = 1;
        if (maxStock > 0) v = Math.min(v, maxStock);
        qtyInput.value = v; btnAdd.setAttribute('data-cantidad', String(v)); updateEarn();
      });
    }
    if (btnAdd){
      btnAdd.setAttribute('data-codigo', p.codigo);
      btnAdd.setAttribute('data-nombre', p.nombre);
      btnAdd.setAttribute('data-precio', String(discounted));
      btnAdd.setAttribute('data-cantidad', String(Number(qtyInput?.value||1)||1));
    }

    // Inicializar vista de puntos que acumulas
    updateEarn();

    // Productos relacionados
    renderRelated(p);

    // Marcar activa la categoría del producto en la secondary nav (los links ya los genera secondary-nav.js)
    const nav = document.querySelector('.secondary-nav');
    if (nav){
      // Marcar como activa la categoría del producto actual
      const prodCatLower = String(p.categoria||'').toLowerCase();
      nav.querySelectorAll('a.nav-link').forEach(a => {
        const label = (a.textContent||'').trim().toLowerCase();
        a.classList.toggle('active', label === prodCatLower);
      });
    }
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
