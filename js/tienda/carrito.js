// js/tienda/carrito.js
// Carrito de compras con LocalStorage

(function(){
  const LS_KEY = 'carrito';

  const CLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

  function loadCarrito(){
    try{
      const raw = localStorage.getItem(LS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    }catch{ return []; }
  }
  function saveCarrito(arr){
    localStorage.setItem(LS_KEY, JSON.stringify(arr || []));
    renderBadge();
  }

  function findProducto(codigo){
    const list = Array.isArray(window.productos) ? window.productos : [];
    return list.find(p => p.codigo === codigo);
  }

  function resolveImg(p){
    try {
      const raw = p && p.url ? String(p.url) : '';
      if (raw){
        if (window.location && String(window.location.pathname).includes('/pages/tienda/') && raw.startsWith('../assets/')){
          return raw.replace('../assets/', '../../assets/');
        }
        return raw;
      }
    } catch {}
    return '../../assets/gamer.jpg';
  }

  function addToCarrito({codigo, nombre, precio, cantidad=1}){
    const carrito = loadCarrito();
    const prod = findProducto(codigo);
    if (!prod) return { ok:false, error:'Producto no encontrado' };

    const idx = carrito.findIndex(i => i.codigo === codigo);
    const currentQty = idx >= 0 ? carrito[idx].cantidad : 0;
    const newQty = currentQty + cantidad;
    if (newQty > prod.stock) return { ok:false, error:'Supera el stock disponible' };

    if (idx >= 0){
      carrito[idx].cantidad = newQty;
      carrito[idx].precio = precio; // sync por si cambia
      carrito[idx].nombre = nombre;
    } else {
      carrito.push({ codigo, nombre, precio, cantidad:newQty });
    }
    saveCarrito(carrito);
    return { ok:true };
  }

  function removeFromCarrito(codigo){
    const carrito = loadCarrito();
    const next = carrito.filter(i => i.codigo !== codigo);
    saveCarrito(next);
  }

  function updateCantidad(codigo, cantidad){
    const carrito = loadCarrito();
    const prod = findProducto(codigo);
    const it = carrito.find(i => i.codigo === codigo);
    if (!it || !prod) return { ok:false };

    if (cantidad < 1) cantidad = 1;
    if (cantidad > prod.stock) cantidad = prod.stock;

    it.cantidad = cantidad;
    saveCarrito(carrito);
    return { ok:true };
  }

  function vaciarCarrito(){
    saveCarrito([]);
  }

  function renderBadge(){
    try {
      const carrito = loadCarrito();
      const total = carrito.reduce((acc,i)=>acc+i.cantidad,0);
      const icon = document.querySelector('.bi-cart');
      if (!icon) return;
      let badge = icon.parentElement?.querySelector('.cart-badge');
      if (!badge){
        badge = document.createElement('span');
        badge.className = 'cart-badge translate-middle badge rounded-pill bg-danger';
        badge.style.position = 'absolute';
        badge.style.fontSize = '0.65rem';
        icon.parentElement.style.position = 'relative';
        icon.parentElement.appendChild(badge);
      }
      badge.textContent = String(total);
      badge.style.display = total > 0 ? 'inline' : 'none';
    } catch {}
  }

  function renderCarrito(opts={}){
    const { containerSelector='.cart-container', resumenSelector='.cart-resumen' } = opts;
    const carrito = loadCarrito();

    const cont = document.querySelector(containerSelector);
    const res = document.querySelector(resumenSelector);
    if (!cont) return;

    if (!carrito.length){
      cont.innerHTML = '<div class="text-center text-secondary py-5">Tu carrito está vacío</div>';
      if (res) res.innerHTML = '';
      renderBadge();
      return;
    }

    cont.innerHTML = carrito.map(i => {
      const subtotal = i.precio * i.cantidad;
      const p = findProducto(i.codigo);
      const stock = p ? p.stock : 0;
      const img = p ? resolveImg(p) : '../../assets/gamer.jpg';
      return `
      <div class="cart-item-row" data-codigo="${i.codigo}">
        <img src="${img}" alt="${i.nombre}" class="cart-item-img">
        <div class="cart-item-details">
          <h5 class="card-title mb-1">${i.nombre}</h5>
          <p class="card-text text-secondary mb-2">${CLP.format(i.precio)} c/u</p>
          <div class="quantity-selector">
            <button class="btn btn-sm btn-outline-secondary" data-action="dec">-</button>
            <input type="number" class="form-control form-control-sm text-center" value="${i.cantidad}" min="1" max="${stock}">
            <button class="btn btn-sm btn-outline-secondary" data-action="inc">+</button>
          </div>
        </div>
        <div class="cart-item-price">
          <p class="mb-0">${CLP.format(subtotal)}</p>
          <button class="btn btn-remove-item" data-action="del"><i class="bi bi-trash3-fill"></i></button>
        </div>
      </div>
      <hr class="cart-hr">
      `;
    }).join('');

    const total = carrito.reduce((acc,i)=>acc + (i.precio*i.cantidad), 0);
    if (res){
      res.innerHTML = `
        <h2 class="mb-4">Resumen del Pedido</h2>
        <div class="d-flex justify-content-between mb-2">
          <span class="text-secondary">Subtotal</span>
          <span>${CLP.format(total)}</span>
        </div>
        <div class="d-flex justify-content-between mb-3">
          <span class="text-secondary">Despacho</span>
          <span>${CLP.format(4990)}</span>
        </div>
        <hr class="cart-hr">
        <div class="d-flex justify-content-between fw-bold fs-5 mb-4">
          <span>Total</span>
          <span>${CLP.format(total + 4990)}</span>
        </div>
        <button class="btn btn-neon w-100" data-action="pagar">Proceder al Pago</button>
        <button class="btn btn-outline-secondary w-100 mt-2" data-action="vaciar">Vaciar carrito</button>
      `;
    }

    // Delegación de eventos para +/-/del/vaciar (manejadores persistentes)
    const onContClick = (e)=>{
      const row = e.target.closest('.cart-item-row');
      if (!row) return;
      const codigo = row.getAttribute('data-codigo');
      if (e.target.closest('[data-action="dec"]')){
        const it = loadCarrito().find(x=>x.codigo===codigo);
        if (!it) return;
        updateCantidad(codigo, it.cantidad - 1);
        renderCarrito(opts);
      }
      if (e.target.closest('[data-action="inc"]')){
        const it = loadCarrito().find(x=>x.codigo===codigo);
        if (!it) return;
        updateCantidad(codigo, it.cantidad + 1);
        renderCarrito(opts);
      }
      if (e.target.closest('[data-action="del"]')){
        removeFromCarrito(codigo);
        renderCarrito(opts);
      }
    };
    if (cont._cartHandler) cont.removeEventListener('click', cont._cartHandler);
    cont.addEventListener('click', onContClick);
    cont._cartHandler = onContClick;

    const onResClick = (e)=>{
      if (e.target.closest('[data-action="vaciar"]')){
        vaciarCarrito();
        renderCarrito(opts);
      }
      if (e.target.closest('[data-action="pagar"]')){
        try {
          // Simular confirmación de compra: otorgar puntos al usuario actual
          const ses = (window.Session && typeof window.Session.get==='function') ? window.Session.get() : null;
          if (!ses || !ses.correo) {
            try { if (typeof window.showNotification==='function') window.showNotification('Inicia sesión para completar la compra.', 'bi-person-exclamation', 'text-warning'); } catch {}
            return;
          }
          const user = (function(){
            const lista = Array.isArray(window.usuarios) ? window.usuarios : [];
            const c = String(ses.correo||'').toLowerCase();
            return lista.find(u => String(u.correo||'').toLowerCase()===c) || null;
          })();
          if (!user) { alert('No se encontró el usuario de la sesión.'); return; }

          const carrito = loadCarrito();
          const total = carrito.reduce((acc,i)=>acc + (i.precio*i.cantidad), 0) + 4990; // incluye despacho mostrado
          if (window.LevelUpPoints && typeof window.LevelUpPoints.addPurchasePoints==='function'){
            const res = window.LevelUpPoints.addPurchasePoints({ run: user.run, totalCLP: total });
            const pts = res && res.ok ? res.pointsAdded : 0;
            try { if (typeof window.showNotification==='function') window.showNotification(`Compra registrada: +${pts} EXP.`, 'bi-gem', 'text-info'); } catch {}
            try { if (typeof window.LevelUpPoints.updateNavPointsBadge==='function') window.LevelUpPoints.updateNavPointsBadge(); } catch {}
          }
          // limpiar carrito y refrescar UI
          vaciarCarrito();
          renderCarrito(opts);
        } catch {
          alert('Ocurrió un error al procesar el pago.');
        }
      }
    };
    if (res){
      if (res._cartResHandler) res.removeEventListener('click', res._cartResHandler);
      res.addEventListener('click', onResClick);
      res._cartResHandler = onResClick;
    }

    renderBadge();
  }

  // Exponer API global sencilla
  window.Carrito = {
    loadCarrito,
    saveCarrito,
    addToCarrito,
    removeFromCarrito,
    updateCantidad,
    vaciarCarrito,
    renderCarrito,
    CLP
  };

  // Hook genérico para botones "Añadir al carrito"
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('.btn-add-cart');
    if (!btn) return;
    const card = btn.closest('[data-producto]');
    let codigo = btn.getAttribute('data-codigo') || card?.getAttribute('data-codigo');
    let nombre = btn.getAttribute('data-nombre') || card?.getAttribute('data-nombre');
    let precio = Number(btn.getAttribute('data-precio') || card?.getAttribute('data-precio')) || 0;
    let cantidad = Number(btn.getAttribute('data-cantidad') || 1) || 1;

    // fallback para páginas de detalle con DOM fijo
    if (!codigo){
      const codeText = document.querySelector('.product-title + p.text-secondary')?.textContent || '';
      codigo = (codeText.match(/Código:\s*(\w+)/) || [,''])[1];
      nombre = document.querySelector('.product-title')?.textContent || nombre;
      const priceText = document.querySelector('.price-highlight, .display-5')?.textContent || '';
      precio = Number((priceText.match(/([\d.]+)/)||[,'0'])[1].replaceAll('.','')) || precio;
    }

    // fallback general por nombre en tarjetas (index/listados)
    if (!codigo){
      const nameFromCard = nombre || card?.querySelector('.card-body a, .card-title + p a, .card-title, .product-title')?.textContent?.trim();
      if (nameFromCard){
        const prod = (window.productos||[]).find(p => String(p.nombre).toLowerCase() === nameFromCard.toLowerCase());
        if (prod){
          codigo = prod.codigo;
          nombre = prod.nombre;
          if (!precio) precio = Number(prod.precio)||0;
        }
      }
    }

    // intentar parsear precio desde la tarjeta si aún no hay precio
    if (!precio && card){
      const priceText = card.querySelector('.price-highlight, .fw-bold, h4')?.textContent || '';
      precio = Number((priceText.match(/([\d.]+)/)||[,'0'])[1].replaceAll('.','')) || 0;
    }

    const res = addToCarrito({codigo, nombre, precio, cantidad});
    if (res.ok){
      // Notificación universal (fallback si no está script.js)
      try {
        if (typeof window.showNotification === 'function') {
          window.showNotification('¡Producto añadido al carrito!', 'bi-check-circle-fill', 'text-success');
        } else {
          const toastEl = document.getElementById('notificationToast');
          if (toastEl && window.bootstrap && typeof window.bootstrap.Toast === 'function'){
            const toastBody = document.getElementById('toast-body');
            const toastIcon = document.getElementById('toast-icon');
            if (toastBody) toastBody.textContent = '¡Producto añadido al carrito!';
            if (toastIcon) toastIcon.className = 'bi bi-check-circle-fill text-success me-2';
            const instance = window.bootstrap.Toast.getOrCreateInstance(toastEl);
            instance.show();
          } else {
            alert('¡Producto añadido al carrito!');
          }
        }
      } catch {}
      renderBadge();
    } else {
      alert(res.error || 'No se pudo añadir al carrito');
    }
  });

  // Render automático en páginas de carrito
  document.addEventListener('DOMContentLoaded', ()=>{
    const isCarrito = !!document.querySelector('.cart-item-row, .cart-container');
    if (isCarrito){
      // Si la página tiene markup estático, reemplazamos por dinámico
      const container = document.querySelector('.cart-container') || (function(){
        const wrap = document.querySelector('.card.p-4');
        if (!wrap) return null;
        wrap.innerHTML = '<div class="cart-container"></div>';
        return wrap.querySelector('.cart-container');
      })();

      const resumenBox = document.querySelector('.cart-resumen') || (function(){
        const aside = document.querySelector('.col-lg-4 .card.p-4');
        if (!aside) return null;
        aside.innerHTML = '<div class="cart-resumen"></div>';
        return aside.querySelector('.cart-resumen');
      })();

      renderCarrito({ containerSelector:'.cart-container', resumenSelector:'.cart-resumen' });
    }
    renderBadge();
  });
})();
