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

  // Insertar barra de búsqueda móvil fija bajo el header (una sola vez)
    (function ensureMobileSearchBelowHeader(){
      const hasWrapper = document.querySelector('.mobile-search-wrapper');
      const header = document.querySelector('header');
      const secNav = document.querySelector('nav.secondary-nav');
      if (!hasWrapper && header && secNav) {
        const wrapper = document.createElement('div');
        wrapper.className = 'mobile-search-wrapper d-lg-none';
        wrapper.innerHTML = [
          '<div class="container py-2">',
          '  <form role="search" action="busqueda.html" method="get" aria-label="Buscar productos">',
          '    <div class="mobile-search input-group">',
          '      <input class="form-control mobile-search-input" type="search" placeholder="Buscar productos..." name="q" aria-label="Buscar">',
          '      <button class="btn mobile-search-btn" type="submit" aria-label="Buscar"><i class="bi bi-search"></i></button>',
          '    </div>',
          '  </form>',
          '</div>'
        ].join('\n');
        header.insertBefore(wrapper, secNav);
      }
    })();

    // Insertar botón hamburguesa en la barra principal para controlar el colapso de categorías (solo móvil)
    (function ensurePrimaryHamburger(){
      const primaryContainer = document.querySelector('.primary-nav .container');
      const existing = primaryContainer && primaryContainer.querySelector('.mobile-cat-toggler');
      if (!primaryContainer || existing) return;

      // Usaremos un ID de colapso fijo en la barra secundaria
      const collapseId = 'secNavCollapse';

      const brand = primaryContainer.querySelector('.navbar-brand');
      const btn = document.createElement('button');
      btn.className = 'navbar-toggler d-lg-none me-2 mobile-cat-toggler';
      btn.type = 'button';
      btn.setAttribute('data-bs-toggle', 'collapse');
      btn.setAttribute('data-bs-target', `#${collapseId}`);
      btn.setAttribute('aria-controls', collapseId);
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Abrir categorías');
      btn.innerHTML = '<span class="navbar-toggler-icon"></span>';

      if (brand) {
        primaryContainer.insertBefore(btn, brand);
      } else {
        primaryContainer.prepend(btn);
      }
    })();

    navs.forEach((nav, idx) => {
      // Asegurar estilo oscuro para el ícono del toggler
      if (!nav.classList.contains('navbar-dark')) {
        nav.classList.add('navbar-dark');
      }
      // Usar un ID fijo para que el botón de la barra principal pueda controlarlo
      const collapseId = 'secNavCollapse';

      const inner = [
        '<div class="container">',
        `  <div class="collapse navbar-collapse" id="${collapseId}">`,
        '    <ul class="navbar-nav justify-content-center w-100 secondary-nav-list">',
        ...cats.map(cat => `      <li class="nav-item"><a class="nav-link" href="categoria.html?categoria=${encodeURIComponent(cat)}">${cat}</a></li>`),
        '    </ul>',
        '  </div>',
        '</div>'
      ].join('\n');

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
