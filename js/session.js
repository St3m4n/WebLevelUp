// js/session.js
// Utilidades compartidas para manejar la sesión unificada entre cliente y administrador.
// Modelo: {
//   correo: string,
//   nombre: string,
//   perfil: 'Cliente' | 'Administrador' | 'Vendedor',
//   remember?: boolean
// }

(function(){
  function safeParseJSON(text, fallback) { try { return JSON.parse(text); } catch { return fallback; } }

  function readSesActual() {
    // Prioridad: sessionStorage -> localStorage
    try {
      const s = sessionStorage.getItem('sesionActual');
      if (s) return safeParseJSON(s, null);
    } catch {}
    try {
      const l = localStorage.getItem('sesionActual');
      if (l) return safeParseJSON(l, null);
    } catch {}
    return null;
  }

  function writeSesActual(sesion) {
    // Limpia ambas para evitar estados inconsistentes
    try { sessionStorage.removeItem('sesionActual'); } catch {}
    try { localStorage.removeItem('sesionActual'); } catch {}
    const payload = JSON.stringify(sesion || {});
    if (sesion && sesion.remember) {
      try { localStorage.setItem('sesionActual', payload); } catch {}
    } else {
      try { sessionStorage.setItem('sesionActual', payload); } catch {}
    }
  }

  function clearSesActual() {
    try { sessionStorage.removeItem('sesionActual'); } catch {}
    try { localStorage.removeItem('sesionActual'); } catch {}
  }

  function migrateLegacy() {
    // clienteLogueado -> sesionActual (Cliente)
    try {
      const c = localStorage.getItem('clienteLogueado');
      if (c && !readSesActual()) {
        const obj = safeParseJSON(c, null);
        if (obj && obj.correo) {
          writeSesActual({ correo: obj.correo, nombre: obj.nombre || 'Cliente', perfil: obj.perfil || 'Cliente', remember: true });
          try { localStorage.removeItem('clienteLogueado'); } catch {}
        }
      }
    } catch {}
    // isAdmin -> sesionActual (Administrador) — no correo disponible; usamos placeholder
    try {
      const a = localStorage.getItem('isAdmin');
      if (a && !readSesActual()) {
        writeSesActual({ correo: 'admin@local', nombre: 'Administrador', perfil: 'Administrador', remember: true });
        try { localStorage.removeItem('isAdmin'); } catch {}
      }
    } catch {}
  }

  function getUserDisplayName(sessionObj) {
    if (!sessionObj) return '';
    if (sessionObj.nombre) return sessionObj.nombre.split(' ')[0];
    if (sessionObj.correo) return sessionObj.correo.split('@')[0];
    return 'Usuario';
  }

  function updateNavbarWithSession() {
    const ses = readSesActual();
    const dropdown = document.querySelector('.nav-item.dropdown');
    if (!dropdown) return; // navbar no presente

    const menu = dropdown.querySelector('.dropdown-menu');
    if (!menu) return;

    // Limpieza y reconstrucción minimal según estado
    if (ses) {
      // Ocultar opciones de login/registro, mostrar Perfil y Cerrar Sesión
      menu.innerHTML = '';
      const nombre = getUserDisplayName(ses);
      const header = document.createElement('li');
      header.innerHTML = `<h6 class="dropdown-header">Hola, ${nombre}</h6>`;
      const perfil = document.createElement('li');
      perfil.innerHTML = `<a class="dropdown-item" href="${ses.perfil === 'Administrador' ? '../admin/index.html' : 'perfil.html'}">Perfil</a>`;
      const sep = document.createElement('li');
      sep.innerHTML = '<hr class="dropdown-divider">';
      const logout = document.createElement('li');
      logout.innerHTML = '<a class="dropdown-item" href="#" id="action-logout">Cerrar sesión</a>';
      menu.appendChild(header);
      menu.appendChild(perfil);
      menu.appendChild(sep);
      menu.appendChild(logout);

      // Bind logout
      const logoutBtn = menu.querySelector('#action-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          clearSesActual();
          // Feedback opcional
          try { if (typeof showNotification === 'function') showNotification('Sesión cerrada.', 'bi-door-closed-fill', 'text-secondary'); } catch {}
          // Recargar para reflejar estado
          window.location.reload();
        });
      }
    } else {
      // Estado no autenticado
      menu.innerHTML = '';
      const login = document.createElement('li');
      login.innerHTML = '<a class="dropdown-item" href="login.html">Iniciar sesión</a>';
      const registro = document.createElement('li');
      registro.innerHTML = '<a class="dropdown-item" href="registro.html">Registrarse</a>';
      const perfil = document.createElement('li');
      perfil.innerHTML = '<a class="dropdown-item" href="perfil.html">Perfil</a>';
      menu.appendChild(login);
      menu.appendChild(registro);
      menu.appendChild(perfil);
    }
  }

  // Nota: La barra secundaria ahora se genera y gestiona en js/secondary-nav.js.
  // Cualquier lógica previa para actualizar sus enlaces/estado fue retirada de este archivo.

  // Inicialización
  document.addEventListener('DOMContentLoaded', () => {
    migrateLegacy();
    updateNavbarWithSession();
  });

  // Expone API mínima global
  window.Session = {
    get: readSesActual,
    set: writeSesActual,
    clear: clearSesActual,
    updateNavbar: updateNavbarWithSession
  };
})();
