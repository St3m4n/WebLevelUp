// js/tienda/home-recommendations.js
// Renderiza 4 productos aleatorios en el Home ("Te recomendamos")
(function(){
  const CLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

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
      if (raw){
        if (window.location && String(window.location.pathname).includes('/pages/tienda/') && raw.startsWith('../assets/')){
          return raw.replace('../assets/', '../../assets/');
        }
        return raw;
      }
    } catch {}
    return IMG_BY_CATEGORY[p?.categoria] || '../../assets/gamer.jpg';
  }

  function pickRandom(list, n){
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, n);
  }

  function card(p){
    const img = resolveImg(p);
    const price = CLP.format(p.precio);
    return `
      <div class="col">
        <div class="card h-100" data-producto data-codigo="${p.codigo}" data-nombre="${p.nombre}" data-precio="${p.precio}">
          <img src="${img}" class="card-img-top" alt="${p.nombre}">
          <div class="card-body d-flex flex-column text-center">
            <h5 class="card-title">${p.nombre}</h5>
            <p class="card-text">
              <a href="producto.html?codigo=${encodeURIComponent(p.codigo)}" class="stretched-link text-decoration-none text-reset">Ver detalle</a>
            </p>
            <div class="mt-auto">
              <h4 class="fw-bold mb-3" style="color: var(--color-accent-neon);">${price}</h4>
              <a href="#" class="btn btn-add-cart w-100" data-codigo="${p.codigo}" data-nombre="${p.nombre}" data-precio="${p.precio}">
                <i class="bi bi-cart-plus-fill me-2"></i>Agregar al carro
              </a>
            </div>
          </div>
        </div>
      </div>`;
  }

  function render(){
    const grid = document.getElementById('recommendations-grid');
    if (!grid) return;
    const productos = Array.isArray(window.productos) ? window.productos : [];
    if (productos.length === 0){ grid.innerHTML = ''; return; }
    const items = pickRandom(productos, 4);
    grid.innerHTML = items.map(card).join('');
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
