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

    navs.forEach((nav, idx) => {
      // Asegurar estilo oscuro para el ícono del toggler
      if (!nav.classList.contains('navbar-dark')) {
        nav.classList.add('navbar-dark');
      }
      const collapseId = `secNavCollapse-${idx}`;

      const inner = [
        '<div class="container">',
        `  <button class="navbar-toggler d-lg-none ms-auto" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-controls="${collapseId}" aria-expanded="false" aria-label="Toggle categories">`,
        '    <span class="navbar-toggler-icon"></span>',
        '    <span class="ms-2">Categorías</span>',
        '  </button>',
        `  <div class="collapse navbar-collapse" id="${collapseId}">`,
        '    <form class="d-lg-none my-3" role="search" action="busqueda.html" method="get">',
        '      <div class="input-group">',
        '        <input class="form-control" type="search" placeholder="Buscar productos..." name="q" aria-label="Search">',
        '        <button class="btn btn-outline-light" type="submit"><i class="bi bi-search"></i></button>',
        '      </div>',
        '    </form>',
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
