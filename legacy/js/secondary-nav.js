// js/secondary-nav.js
// Construye la barra de navegación secundaria dinámicamente desde data/productos.js
(function(){
  function buildSecondaryNav(){
    const navs = document.querySelectorAll('.secondary-nav');
    if (!navs.length) return;

    const path = (location.pathname || '').replace(/\\/g, '/');
    const inTienda = path.includes('/pages/tienda/');
    const tiendaBase = inTienda ? '' : 'pages/tienda/';
    const rootIndexHref = inTienda ? '../../index.html' : 'index.html';

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
          `  <form role="search" action="${tiendaBase}busqueda.html" method="get" aria-label="Buscar productos">`,
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

    // Eliminar/evitar dropdown de "Categorías" en la barra superior (solo debe ser un link en desktop)
    ;(function disableTopNavDropdown(){
      const topNav = document.querySelector('.top-nav');
      if (!topNav) return;
      const navList = topNav.querySelector('.navbar-nav');
      if (!navList) return;
      const li = navList.querySelector('a.nav-link[href$="categorias.html"]')?.closest('li');
      if (!li) return;
      // Quitar cualquier rastro de dropdown previo
      li.classList.remove('dropdown');
      const a = li.querySelector('a.nav-link[href$="categorias.html"]');
      if (a){
        a.classList.remove('dropdown-toggle');
        a.removeAttribute('data-bs-toggle');
        a.removeAttribute('role');
        a.removeAttribute('aria-expanded');
      }
      li.querySelectorAll('.dropdown-menu').forEach(m => m.remove());
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
        // En móvil, incluir los enlaces de la barra superior y anidar las categorías dentro de "Categorías"
        `    <ul class="navbar-nav w-100 d-lg-none mb-2">`,
        `      <li class="nav-item"><a class="nav-link" href="${rootIndexHref}">Inicio</a></li>`,
        `      <li class="nav-item">`,
        `        <button class="nav-link w-100 text-start d-flex align-items-center justify-content-between" type="button" data-bs-toggle="collapse" data-bs-target="#mobileCategories-${idx}" aria-expanded="false" aria-controls="mobileCategories-${idx}">`,
        `          Categorías <i class="bi bi-chevron-down ms-2"></i>`,
        `        </button>`,
        `        <div class="collapse mobile-cats-collapse mt-2" id="mobileCategories-${idx}">`,
        `          <ul class="navbar-nav ps-3">`,
        ...cats.map(cat => `            <li class="nav-item"><a class="nav-link" href="${tiendaBase}categoria.html?categoria=${encodeURIComponent(cat)}">${cat}</a></li>`),
        `          </ul>`,
        `        </div>`,
        `      </li>`,
        `      <li class="nav-item"><a class="nav-link" href="${tiendaBase}nosotros.html">Nosotros</a></li>`,
        `      <li class="nav-item"><a class="nav-link" href="${tiendaBase}comunidad.html">Comunidad</a></li>`,
        `      <li class="nav-item"><a class="nav-link" href="${tiendaBase}contacto.html">Contacto</a></li>`,
        `    </ul>`,
        // En desktop, mantener barra horizontal de categorías
        '    <ul class="navbar-nav justify-content-center w-100 secondary-nav-list d-none d-lg-flex">',
        ...cats.map(cat => `      <li class="nav-item"><a class="nav-link" href="${tiendaBase}categoria.html?categoria=${encodeURIComponent(cat)}">${cat}</a></li>`),
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
