// js/tienda/categorias.js
// Renderiza dinámicamente las tarjetas de categorías usando los datos de window.productos
(function () {
  const ICONS = {
    'Juegos de Mesa': 'bi-dice-5-fill',
    'Accesorios': 'bi-joystick',
    'Consolas': 'bi-controller',
    'Computadores Gamers': 'bi-pc-display-horizontal',
    'Sillas Gamers': 'bi-person-workspace',
    'Mouse': 'bi-mouse2-fill',
    'Mousepad': 'bi-aspect-ratio-fill',
    'Poleras Personalizadas': 'bi-person-bounding-box',
    'Polerones Gamers Personalizados': 'bi-person-square'
  };

  function uniqueCategories(productos) {
    const seen = new Set();
    const out = [];
    for (const p of productos) {
      if (!p || !p.categoria) continue;
      if (!seen.has(p.categoria)) {
        seen.add(p.categoria);
        out.push(p.categoria);
      }
    }
    return out;
  }

  function groupByCategory(productos) {
    const map = new Map();
    for (const p of productos) {
      if (!p || !p.categoria) continue;
      if (!map.has(p.categoria)) map.set(p.categoria, []);
      map.get(p.categoria).push(p);
    }
    return map;
  }

  function createCategoryCard(categoria, productos) {
    const col = document.createElement('div');
    col.className = 'col-lg-4 col-md-6 mb-4';

    const card = document.createElement('div');
    card.className = 'card category-card h-100';

    const body = document.createElement('div');
    body.className = 'card-body';

    const header = document.createElement('div');
    header.className = 'd-flex justify-content-between align-items-center mb-3';

    const h5 = document.createElement('h5');
    h5.className = 'card-title mb-0';

    const link = document.createElement('a');
    link.className = 'stretched-link text-decoration-none text-reset';
    // Pasamos la categoría como query param para uso futuro en categoria.html
    link.href = `categoria.html?categoria=${encodeURIComponent(categoria)}`;
    link.textContent = categoria;
    h5.appendChild(link);

    const icon = document.createElement('i');
    icon.className = `bi ${ICONS[categoria] || 'bi-list-ul'} category-icon`;

    header.appendChild(h5);
    header.appendChild(icon);

    const ul = document.createElement('ul');
    ul.className = 'list-unstyled';

    // Mostrar hasta 2 productos de ejemplo por categoría
    const ejemplos = [...productos].slice(0, 2);
    for (const prod of ejemplos) {
      const li = document.createElement('li');
      li.textContent = prod.nombre;
      ul.appendChild(li);
    }

    body.appendChild(header);
    body.appendChild(ul);
    card.appendChild(body);
    col.appendChild(card);
    return col;
  }

  function render() {
    const grid = document.getElementById('categories-grid');
    if (!grid) return;

    const productos = Array.isArray(window.productos) ? window.productos : [];
    const byCat = groupByCategory(productos);
    const cats = uniqueCategories(productos);

    // Vaciar grid (por si hay contenido estático)
    grid.innerHTML = '';

    for (const cat of cats) {
      const prods = byCat.get(cat) || [];
      const card = createCategoryCard(cat, prods);
      grid.appendChild(card);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
