// js/secondary-nav.js
// Construye la barra de navegación secundaria dinámicamente desde data/productos.js
(function(){
  function buildSecondaryNav(){
    const navs = document.querySelectorAll('.secondary-nav');
    if (!navs.length) return;

    const productos = Array.isArray(window.productos) ? window.productos : [];
    const cats = [...new Set(productos.map(p => (p && p.categoria ? String(p.categoria).trim() : '')).filter(Boolean))];
    if (cats.length === 0) {
      // Si no hay categorías, no renderizamos nada
      return;
    }

    const usp = new URLSearchParams(window.location.search);
    const currentCat = (usp.get('categoria') || '').trim().toLowerCase();

    const inner = [
      '<div class="container">',
      '  <div class="collapse navbar-collapse">',
      '    <ul class="navbar-nav justify-content-center w-100">',
      ...cats.map(cat => `      <li class="nav-item"><a class="nav-link" href="categoria.html?categoria=${encodeURIComponent(cat)}">${cat}</a></li>`),
      '    </ul>',
      '  </div>',
      '</div>'
    ].join('\n');

    navs.forEach(nav => {
      nav.innerHTML = inner;
      if (currentCat) {
        nav.querySelectorAll('a.nav-link').forEach(a => {
          const label = (a.textContent || '').trim().toLowerCase();
          a.classList.toggle('active', label === currentCat);
        });
      }
    });
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', buildSecondaryNav);
  } else {
    buildSecondaryNav();
  }
})();
