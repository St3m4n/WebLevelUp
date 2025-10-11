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

  // Detecta si el usuario actual tiene beneficio DUOC (-20%)
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

  function resolveImg(p){
    try {
      if (window.LevelUpAssets && typeof window.LevelUpAssets.resolveProductImage === 'function'){
        return window.LevelUpAssets.resolveProductImage(p);
      }
    } catch {}
  // Resolutor local (equivalente a la lógica global) si aún no existe LevelUpAssets
    try {
      const desiredBase = (function(){
        const path = String(window.location && window.location.pathname || '');
        return path.includes('/pages/') ? '../../assets/' : 'assets/';
      })();
      const raw = p && p.url ? String(p.url) : '';
      if (raw){
        if (/^https?:\/\//i.test(raw)) return raw;
        let cleaned = raw.replace(/^\/+/, '');
        cleaned = cleaned.replace(/^(\.\.\/)+assets\//, 'assets/');
        cleaned = cleaned.replace(/^\.\/assets\//, 'assets/');
        if (cleaned.startsWith('assets/')) return cleaned.replace(/^assets\//, desiredBase);
        if (cleaned.startsWith('/assets/')) return cleaned.replace(/^\/assets\//, desiredBase);
        return cleaned;
      }
      return desiredBase + 'gamer.jpg';
    } catch {
      return '../../assets/gamer.jpg';
    }
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

  // Órdenes por usuario (correo)
  const ORDERS_KEY = (correo) => `user:orders:${String(correo||'').toLowerCase()}`;
  function loadOrders(correo){
    try {
      const raw = localStorage.getItem(ORDERS_KEY(correo));
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }
  function saveOrders(correo, list){
    try { localStorage.setItem(ORDERS_KEY(correo), JSON.stringify(Array.isArray(list)?list:[])); } catch {}
  }

  // Utilidad: confirmación mínima con estilo toast, reutilizando el contenedor global si existe
  function confirmToast(message, { okText='Aceptar', cancelText='Cancelar' }={}){
    return new Promise((resolve)=>{
      try {
        const toastEl = document.getElementById('notificationToast');
        const toastBody = document.getElementById('toast-body');
        const toastIcon = document.getElementById('toast-icon');
        if (!toastEl || !window.bootstrap) throw new Error('no-toast');

  // Construir contenido temporal con botones
        const prev = { body: toastBody?.innerHTML || '', icon: toastIcon?.className || '' };
        if (toastIcon) toastIcon.className = 'bi bi-question-circle-fill text-warning me-2';
        if (toastBody){
          toastBody.innerHTML = `
            <div class="d-flex flex-column">
              <span>${message}</span>
              <div class="mt-2 d-flex gap-2">
                <button type="button" class="btn btn-sm btn-danger" id="toast-confirm-ok">${okText}</button>
                <button type="button" class="btn btn-sm btn-outline-secondary" id="toast-confirm-cancel">${cancelText}</button>
              </div>
            </div>`;
        }
        const inst = window.bootstrap.Toast.getOrCreateInstance(toastEl);
        const cleanup = (val)=>{
          try {
            if (toastBody) toastBody.innerHTML = prev.body;
            if (toastIcon) toastIcon.className = prev.icon;
          } catch {}
          resolve(val);
        };
  // Listeners de botones
        setTimeout(()=>{
          const okBtn = document.getElementById('toast-confirm-ok');
          const cancelBtn = document.getElementById('toast-confirm-cancel');
          okBtn?.addEventListener('click', ()=>{ try { inst.hide(); } catch {}; cleanup(true); }, { once:true });
          cancelBtn?.addEventListener('click', ()=>{ try { inst.hide(); } catch {}; cleanup(false); }, { once:true });
        }, 0);
        inst.show();
      } catch {
  // Fallback al confirm nativo si no hay toast
        const ok = window.confirm(message);
        resolve(ok);
      }
    });
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

    const duoc = hasDuocDiscount();
    cont.innerHTML = carrito.map(i => {
      const subtotal = i.precio * i.cantidad;
      const p = findProducto(i.codigo);
      const stock = p ? p.stock : 0;
      const img = p ? resolveImg(p) : '../../assets/gamer.jpg';
      const baseUnit = Number(p?.precio)||Number(i.precio)||0;
      const unit = duoc ? Math.round(baseUnit * 0.8) : baseUnit;
      const itemSubtotal = unit * i.cantidad;
      const mult = (window.LevelUpPoints && window.LevelUpPoints.CONFIG && Number.isFinite(window.LevelUpPoints.CONFIG.COMPRA_POR_1000)) ? window.LevelUpPoints.CONFIG.COMPRA_POR_1000 : 1;
      const ptsItem = Math.floor(itemSubtotal / 1000) * mult;
      return `
      <div class="cart-item-row" data-codigo="${i.codigo}">
        <img src="${img}" alt="${i.nombre}" class="cart-item-img">
        <div class="cart-item-details">
          <h5 class="card-title mb-1">${i.nombre}</h5>
          <p class="card-text text-secondary mb-2">
            ${duoc ? `<span class="text-decoration-line-through text-secondary me-2">${CLP.format(baseUnit)}</span> ${CLP.format(unit)} <span class="badge bg-success ms-1">-20% DUOC</span>` : `${CLP.format(unit)} c/u`}
          </p>
          <div class="quantity-selector">
            <button class="btn btn-sm btn-outline-secondary" data-action="dec">-</button>
            <input type="number" class="form-control form-control-sm text-center" value="${i.cantidad}" min="1" max="${stock}">
            <button class="btn btn-sm btn-outline-secondary" data-action="inc">+</button>
          </div>
        </div>
        <div class="cart-item-price">
          <p class="mb-0">${CLP.format(itemSubtotal)}</p>
          <small class="text-info d-block">+${ptsItem} EXP</small>
          <button class="btn btn-remove-item" data-action="del"><i class="bi bi-trash3-fill"></i></button>
        </div>
      </div>
      <hr class="cart-hr">
      `;
    }).join('');

    const total = carrito.reduce((acc,i)=>{
      const p = findProducto(i.codigo);
      const baseUnit = Number(p?.precio)||Number(i.precio)||0;
      const unit = hasDuocDiscount() ? Math.round(baseUnit * 0.8) : baseUnit;
      return acc + (unit * i.cantidad);
    }, 0);
    const despacho = 4990;
    const mult = (window.LevelUpPoints && window.LevelUpPoints.CONFIG && Number.isFinite(window.LevelUpPoints.CONFIG.COMPRA_POR_1000)) ? window.LevelUpPoints.CONFIG.COMPRA_POR_1000 : 1;
    const ptsTotal = Math.floor((total + despacho) / 1000) * mult;
    if (res){
      res.innerHTML = `
        <h2 class="mb-4">Resumen del Pedido</h2>
        <div class="d-flex justify-content-between mb-2">
          <span class="text-secondary">Subtotal</span>
          <span>${CLP.format(total)}</span>
        </div>
        <div class="d-flex justify-content-between mb-3">
          <span class="text-secondary">Despacho</span>
          <span>${CLP.format(despacho)}</span>
        </div>
        <hr class="cart-hr">
        <div class="d-flex justify-content-between fw-bold fs-5 mb-4">
          <span>Total</span>
          <span>${CLP.format(total + despacho)}</span>
        </div>
        <div class="d-flex justify-content-between mb-4 text-info">
          <span>EXP estimado</span>
          <span>+${ptsTotal} EXP</span>
        </div>
        <button class="btn btn-neon w-100" data-action="pagar">Proceder al Pago</button>
        <button class="btn btn-outline-secondary w-100 mt-2" data-action="vaciar">Vaciar carrito</button>
      `;
    }

  // Delegación de eventos para +/-/eliminar/vaciar (manejadores persistentes)
    const onContClick = async (e)=>{
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
        // Confirmación visual tipo toast antes de eliminar
        const nombre = row.querySelector('.card-title')?.textContent || 'este producto';
        const ok = await confirmToast(`¿Eliminar "${nombre}" del carrito?`, { okText: 'Eliminar', cancelText: 'Cancelar' });
        if (!ok) return;
        removeFromCarrito(codigo);
        renderCarrito(opts);
      }
    };
    if (cont._cartHandler) cont.removeEventListener('click', cont._cartHandler);
    cont.addEventListener('click', onContClick);
    cont._cartHandler = onContClick;

    // Sanitizar inputs de cantidad: solo números, mínimo 1 y máximo stock
    const onQtyInput = (e)=>{
      const input = e.target.closest('.quantity-selector input[type="number"]');
      if (!input) return;
  // Limpiar caracteres no numéricos mientras escribe
      const raw = String(input.value || '');
      const digits = raw.replace(/\D+/g, '');
      let v = parseInt(digits, 10);
      if (!Number.isFinite(v) || v < 1) v = 1;
      const maxAttr = Number(input.getAttribute('max')) || 0;
      if (maxAttr > 0) v = Math.min(v, maxAttr);
      input.value = String(v);
    };
    const onQtyKeyDown = (e)=>{
      const input = e.target.closest('.quantity-selector input[type="number"]');
      if (!input) return;
      const allowed = ['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'];
      if (allowed.includes(e.key)) return;
      if (/^[0-9]$/.test(e.key)) return;
  // Bloquear letras, signos, etc.
      e.preventDefault();
    };
    const onQtyCommit = (e)=>{
      const input = e.target.closest('.quantity-selector input[type="number"]');
      if (!input) return;
      const row = input.closest('.cart-item-row');
      if (!row) return;
      const codigo = row.getAttribute('data-codigo');
      const maxAttr = Number(input.getAttribute('max')) || 0;
      let v = parseInt(String(input.value||'').replace(/\D+/g,''), 10);
      if (!Number.isFinite(v) || v < 1) v = 1;
      if (maxAttr > 0) v = Math.min(v, maxAttr);
      input.value = String(v);
      updateCantidad(codigo, v);
      renderCarrito(opts);
    };
  // Limpiar handlers previos para evitar duplicaciones al re-render
    if (cont._qtyInputHandler) cont.removeEventListener('input', cont._qtyInputHandler);
    if (cont._qtyKeyHandler) cont.removeEventListener('keydown', cont._qtyKeyHandler);
    if (cont._qtyChangeHandler) cont.removeEventListener('change', cont._qtyChangeHandler);
    if (cont._qtyBlurHandler) cont.removeEventListener('blur', cont._qtyBlurHandler, true);
    cont.addEventListener('input', onQtyInput);
    cont.addEventListener('keydown', onQtyKeyDown);
    cont.addEventListener('change', onQtyCommit);
    cont.addEventListener('blur', onQtyCommit, true);
    cont._qtyInputHandler = onQtyInput;
    cont._qtyKeyHandler = onQtyKeyDown;
    cont._qtyChangeHandler = onQtyCommit;
    cont._qtyBlurHandler = onQtyCommit;

    const onResClick = async (e)=>{
      if (e.target.closest('[data-action="vaciar"]')){
        const ok = await confirmToast('¿Vaciar todo el carrito?', { okText: 'Vaciar', cancelText: 'Cancelar' });
        if (!ok) return;
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
          // Construir detalle de ítems con precio aplicado (descuento si corresponde)
          const duoc = hasDuocDiscount();
          const items = carrito.map(i=>{
            const p = findProducto(i.codigo);
            const baseUnit = Number(p?.precio)||Number(i.precio)||0;
            const unit = duoc ? Math.round(baseUnit * 0.8) : baseUnit;
            const cantidad = i.cantidad;
            return {
              codigo: i.codigo,
              nombre: i.nombre,
              cantidad,
              unit,
              subtotal: unit * cantidad
            };
          });
          const subtotal = items.reduce((a,x)=>a+x.subtotal, 0);
          const despacho = 4990;
          const totalCompra = carrito.reduce((acc,i)=>{
            const p = findProducto(i.codigo);
            const baseUnit = Number(p?.precio)||Number(i.precio)||0;
            const unit = hasDuocDiscount() ? Math.round(baseUnit * 0.8) : baseUnit;
            return acc + (unit * i.cantidad);
          }, 0) + despacho; // incluye despacho mostrado
          if (window.LevelUpPoints && typeof window.LevelUpPoints.addPurchasePoints==='function'){
            const res = window.LevelUpPoints.addPurchasePoints({ run: user.run, totalCLP: totalCompra });
            const pts = res && res.ok ? res.pointsAdded : 0;
            try { if (typeof window.showNotification==='function') window.showNotification(`¡Compra exitosa! +${pts} EXP.`, 'bi-bag-check-fill', 'text-success'); } catch {}
            try { if (typeof window.LevelUpPoints.updateNavPointsBadge==='function') window.LevelUpPoints.updateNavPointsBadge(); } catch {}
          }
          // Registrar pedido en LocalStorage del usuario y redirigir a perfil
          const correoKey = String(user.correo || ses.correo || '').toLowerCase();
          const orders = loadOrders(correoKey);
          const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
          // Obtener dirección principal guardada en perfil
          const ADDR_KEY = (correo) => `user:addresses:${String(correo||'').toLowerCase()}`;
          function loadAddresses(correo){
            try { const raw = localStorage.getItem(ADDR_KEY(correo)); const arr = raw ? JSON.parse(raw) : []; return Array.isArray(arr) ? arr : []; } catch { return []; }
          }
          function pickPrimaryAddress(list){
            const arr = Array.isArray(list) ? list : [];
            const primary = arr.find(a => a.isPrimary) || arr[0] || null;
            if (!primary) return null;
            const place = [primary.city, primary.region].filter(Boolean).join(', ');
            return {
              fullName: primary.fullName || '',
              line1: primary.line1 || '',
              city: primary.city || '',
              region: primary.region || '',
              country: primary.country || 'Chile',
              display: `${primary.fullName || ''}, ${primary.line1 || ''}${place?`, ${place}`:''}${primary.country?`, ${primary.country}`:''}`
            };
          }
          const addrList = loadAddresses(correoKey);
          const entrega = pickPrimaryAddress(addrList);
          const order = {
            id: orderId,
            date: new Date().toISOString(),
            estado: 'Pagado',
            items,
            subtotal,
            despacho,
            total: totalCompra,
            entrega
          };
          orders.unshift(order);
          saveOrders(correoKey, orders);
          // Señal para mostrar notificación y seleccionar la pestaña de pedidos en perfil
          try { sessionStorage.setItem('orderSuccess', JSON.stringify({ id: orderId, total: totalCompra })); } catch {}
          // limpiar carrito y redirigir
          vaciarCarrito();
          window.location.href = 'perfil.html#orders';
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
  // Evita que anclas con href="#" o botones dentro de enlaces provoquen scroll al tope
    try { e.preventDefault(); } catch {}
    try { e.stopPropagation(); } catch {}
    const card = btn.closest('[data-producto]');
    let codigo = btn.getAttribute('data-codigo') || card?.getAttribute('data-codigo');
    let nombre = btn.getAttribute('data-nombre') || card?.getAttribute('data-nombre');
    let precio = Number(btn.getAttribute('data-precio') || card?.getAttribute('data-precio')) || 0;
    let cantidad = Number(btn.getAttribute('data-cantidad') || 1) || 1;

  // Fallback para páginas de detalle con DOM fijo
    if (!codigo){
      const codeText = document.querySelector('.product-title + p.text-secondary')?.textContent || '';
      codigo = (codeText.match(/Código:\s*(\w+)/) || [,''])[1];
      nombre = document.querySelector('.product-title')?.textContent || nombre;
      const priceText = document.querySelector('.price-highlight, .display-5')?.textContent || '';
      precio = Number((priceText.match(/([\d.]+)/)||[,'0'])[1].replaceAll('.','')) || precio;
    }

  // Fallback general por nombre en tarjetas (index/listados)
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

  // Intentar parsear precio desde la tarjeta si aún no hay precio
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
