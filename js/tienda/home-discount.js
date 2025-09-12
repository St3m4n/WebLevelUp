// js/tienda/home-discount.js
// Ajusta precios mostrados en tarjetas destacadas del home si aplica descuento DUOC
(function(){
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
  const CLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

  function parsePrice(text){
    if (!text) return 0;
    const m = text.replace(/\s|CLP|\$/g,'').match(/([\d.]+)/);
    const n = m ? Number(m[1].replaceAll('.','')) : 0;
    return Number.isFinite(n) ? n : 0;
  }

  function apply(){
    if (!hasDuocDiscount()) return;
    // Featured product tiles: look for price boxes inside .category-card .category-price-box strong
    document.querySelectorAll('.category-card .category-price-box strong').forEach(str => {
      const base = parsePrice(str.textContent || '');
      if (!base) return;
      const discounted = Math.round(base * 0.8);
      // Replace with strikethrough + discounted + badge
      const wrapper = str.parentElement;
      if (!wrapper) return;
      wrapper.innerHTML = `<span>desde:</span> <span class="text-decoration-line-through text-secondary ms-1">${CLP.format(base)}</span> <strong>${CLP.format(discounted)}</strong> <span class="badge bg-success ms-1">-20% DUOC</span>`;
    });

    // "Te recomendamos" product cards: h4.fw-bold contains price
    document.querySelectorAll('.card .fw-bold.mb-3').forEach(h4 => {
      const base = parsePrice(h4.textContent || '');
      if (!base) return;
      const discounted = Math.round(base * 0.8);
      h4.innerHTML = `<span class="text-decoration-line-through text-secondary me-2">${CLP.format(base)}</span> ${CLP.format(discounted)} <span class="badge bg-success ms-1">-20% DUOC</span>`;
      // Ensure potential add-to-cart buttons carry discounted data-precio if present
      const card = h4.closest('.card');
      const btn = card?.querySelector('.btn-add-cart');
      if (btn){ btn.setAttribute('data-precio', String(discounted)); }
    });
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }
})();
