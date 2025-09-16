(function(){
  // Centralized sidebar/offcanvas rendering for admin pages
  if (typeof document === 'undefined') return;

  function isActive(pathFrag){
    try {
      const p = window.location.pathname.replace(/\\/g,'/');
      return p.endsWith(pathFrag);
    } catch { return false; }
  }

  function menuLink(href, icon, text, opts={}){
    const active = opts.active ? ' active' : '';
    return `<a href="${href}" class="nav-link${active}"><i class="bi ${icon} me-1"></i>${text}</a>`;
  }

  function buildDesktopSidebar(){
    const productosOpen = isActive('productos.html') || isActive('producto-form.html');
    const usuariosOpen  = isActive('usuarios.html') || isActive('usuario-form.html');

    return `
      <a href="./index.html" class="d-flex align-items-center mb-3 text-decoration-none">
        <img src="../../assets/logo2.png" alt="Level-Up" class="lup-logo me-2">
      </a>
      <hr class="border-secondary">
      <ul class="nav nav-pills flex-column mb-auto gap-1" id="lup-menu">
        <li class="nav-item">${menuLink('./index.html','bi-house-door','Dashboard',{active:isActive('index.html')})}</li>
        <li>${menuLink('./mensajes.html','bi-envelope','Mensajes',{active:isActive('mensajes.html')})}</li>
        <li>
          <a class="nav-link d-flex justify-content-between align-items-center" data-bs-toggle="collapse" href="#menuProductos" role="button" aria-expanded="${productosOpen}" aria-controls="menuProductos">
            <span><i class="bi bi-bag me-1"></i>Productos</span>
            <i class="bi bi-caret-down"></i>
          </a>
          <div class="collapse ${productosOpen ? 'show':''}" id="menuProductos">
            <ul class="nav flex-column ms-3 my-1 small">
              <li>${menuLink('./productos.html','bi-list','Listado',{active:isActive('productos.html')})}</li>
              <li>${menuLink('./producto-form.html','bi-plus-circle','Nuevo producto',{active:isActive('producto-form.html')})}</li>
            </ul>
          </div>
        </li>
        <li>
          <a class="nav-link d-flex justify-content-between align-items-center" data-bs-toggle="collapse" href="#menuUsuarios" role="button" aria-expanded="${usuariosOpen}" aria-controls="menuUsuarios">
            <span><i class="bi bi-people me-1"></i>Usuarios</span>
            <i class="bi bi-caret-down"></i>
          </a>
          <div class="collapse ${usuariosOpen ? 'show':''}" id="menuUsuarios">
            <ul class="nav flex-column ms-3 my-1 small">
              <li>${menuLink('./usuarios.html','bi-list','Listado',{active:isActive('usuarios.html')})}</li>
              <li>${menuLink('./usuario-form.html','bi-plus-circle','Nuevo usuario',{active:isActive('usuario-form.html')})}</li>
            </ul>
          </div>
        </li>
        <li>${menuLink('./categorias.html','bi-tags','Categorías',{active:isActive('categorias.html')})}</li>
        <li>${menuLink('./auditoria.html','bi-clipboard-data','Auditoría',{active:isActive('auditoria.html')})}</li>
      </ul>
      <hr class="border-secondary mt-2">
      <div class="small text-secondary">Administrador</div>
      <div class="d-flex gap-2 w-100 mt-2">
        <a href="./perfil.html" class="btn btn-outline-light w-50${isActive('perfil.html')?' active':''}" role="button"><i class="bi bi-person me-1"></i> Perfil</a>
        <a href="#" class="btn btn-danger w-50 js-admin-logout" data-action="logout" role="button"><i class="bi bi-box-arrow-right me-1"></i> Cerrar sesión</a>
      </div>`;
  }

  function buildMobileOffcanvas(){
    const productosOpen = isActive('productos.html') || isActive('producto-form.html');
    const usuariosOpen  = isActive('usuarios.html') || isActive('usuario-form.html');

    return `
      <div class="offcanvas-header">
        <div class="d-flex align-items-center">
          <img src="../../assets/logo2.png" alt="Level-Up" class="lup-logo me-2">
        </div>
        <button type="button" class="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Cerrar"></button>
      </div>
      <div class="offcanvas-body d-flex flex-column">
        <ul class="nav nav-pills flex-column mb-auto gap-1">
          <li class="nav-item">${menuLink('./index.html','bi-house-door','Dashboard',{active:isActive('index.html')})}</li>
          <li>${menuLink('./mensajes.html','bi-envelope','Mensajes',{active:isActive('mensajes.html')})}</li>
          <li>
            <a class="nav-link d-flex justify-content-between align-items-center" data-bs-toggle="collapse" href="#menuProductosMobile" role="button" aria-expanded="${productosOpen}" aria-controls="menuProductosMobile">
              <span><i class="bi bi-bag me-1"></i>Productos</span>
              <i class="bi bi-caret-down"></i>
            </a>
            <div class="collapse ${productosOpen ? 'show':''}" id="menuProductosMobile">
              <ul class="nav flex-column ms-3 my-1 small">
                <li>${menuLink('./productos.html','bi-list','Listado',{active:isActive('productos.html')})}</li>
                <li>${menuLink('./producto-form.html','bi-plus-circle','Nuevo producto',{active:isActive('producto-form.html')})}</li>
              </ul>
            </div>
          </li>
          <li>
            <a class="nav-link d-flex justify-content-between align-items-center" data-bs-toggle="collapse" href="#menuUsuariosMobile" role="button" aria-expanded="${usuariosOpen}" aria-controls="menuUsuariosMobile">
              <span><i class="bi bi-people me-1"></i>Usuarios</span>
              <i class="bi bi-caret-down"></i>
            </a>
            <div class="collapse ${usuariosOpen ? 'show':''}" id="menuUsuariosMobile">
              <ul class="nav flex-column ms-3 my-1 small">
                <li>${menuLink('./usuarios.html','bi-list','Listado',{active:isActive('usuarios.html')})}</li>
                <li>${menuLink('./usuario-form.html','bi-plus-circle','Nuevo usuario',{active:isActive('usuario-form.html')})}</li>
              </ul>
            </div>
          </li>
          <li>${menuLink('./categorias.html','bi-tags','Categorías',{active:isActive('categorias.html')})}</li>
          <li>${menuLink('./auditoria.html','bi-clipboard-data','Auditoría',{active:isActive('auditoria.html')})}</li>
        </ul>
        <hr class="border-secondary mt-2">
        <div class="small text-secondary">Administrador</div>
        <div class="d-flex gap-2 w-100 mt-2">
          <a href="./perfil.html" class="btn btn-outline-dark w-50${isActive('perfil.html')?' active':''}" role="button"><i class="bi bi-person me-1"></i> Perfil</a>
          <a href="#" class="btn btn-danger w-50 js-admin-logout" data-action="logout" role="button"><i class="bi bi-box-arrow-right me-1"></i> Cerrar sesión</a>
        </div>
      </div>`;
  }

  function mount(){
    // Desktop sidebar content replacement
    const aside = document.querySelector('aside.lup-sidebar');
    if (aside) aside.innerHTML = buildDesktopSidebar();

    // Mobile offcanvas body replacement
    const offcanvas = document.querySelector('#mobileMenu');
    if (offcanvas) offcanvas.innerHTML = buildMobileOffcanvas();

    // Ensure logout works even after DOM replacement (event delegation)
    document.addEventListener('click', function(ev){
      const btn = ev.target && ev.target.closest && ev.target.closest('.js-admin-logout');
      if (btn){
        ev.preventDefault();
        try { localStorage.removeItem('isAdmin'); } catch {}
        try { sessionStorage.removeItem('sesionActual'); } catch {}
        try { localStorage.removeItem('sesionActual'); } catch {}
        window.location.replace('../tienda/login_admin.html');
      }
    }, { once: true });
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
