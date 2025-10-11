// /js/admin/index.js
(function(){
  // --- helpers / storage ---
  const LS_KEY_PROD = "productos";
  const LS_KEY_USU = "usuarios";

  function loadLS(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      if (raw){
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : fallback;
      }
    }catch(e){}
    return fallback;
  }

  function loadProductos(){
    const seed = Array.isArray(window.productos) ? [...window.productos] : [];
    return loadLS(LS_KEY_PROD, seed);
  }
  function loadUsuarios(){
    const seed = Array.isArray(window.usuarios) ? [...window.usuarios] : [];
    return loadLS(LS_KEY_USU, seed);
  }

  // --- datos ---
  const prods = loadProductos();
  const users = loadUsuarios();

  const totalCatalogo = prods.length;
  const criticos = prods
    .filter(p => p.stockCritico != null && Number(p.stock) <= Number(p.stockCritico));

  const totalStockBajo = criticos.length;
  const totalUsuarios  = users.length;

  // --- pintar métricas ---
  const q  = (s)=>document.querySelector(s);
  const qs = (s)=>[...document.querySelectorAll(s)];

  const mCat = q('[data-ref="metric-catalogo"]');
  const mLow = q('[data-ref="metric-stock-bajo"]');
  const mUsr = q('[data-ref="metric-usuarios"]');

  if (mCat) mCat.textContent = String(totalCatalogo);
  if (mLow) mLow.textContent = String(totalStockBajo);
  if (mUsr) mUsr.textContent = String(totalUsuarios);

  // --- lista de stock crítico (top 5) ---
  const ul   = q('[data-ref="low-stock-list"]');
  const empty= q('[data-ref="low-stock-empty"]');

  if (ul){
    if (criticos.length === 0){
      ul.classList.add('d-none');
      empty?.classList.remove('d-none');
    } else {
      empty?.classList.add('d-none');
      ul.classList.remove('d-none');

      // ordenar por stock asc y tomar 5
      const top = [...criticos].sort((a,b)=>Number(a.stock)-Number(b.stock)).slice(0,5);

      ul.innerHTML = top.map(p => `
        <li class="list-group-item d-flex justify-content-between align-items-center">
          <div>
            <div class="fw-semibold">${p.nombre}</div>
            <div class="small text-muted">${p.codigo} · ${p.categoria}</div>
          </div>
          <span class="badge bg-warning text-dark" title="Stock ≤ crítico">
            ${p.stock}/${p.stockCritico ?? 0}
          </span>
        </li>
      `).join('');
    }
  }
})();
