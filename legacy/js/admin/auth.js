(function(){
  function readSesActual(){
    try { const s = sessionStorage.getItem('sesionActual'); if (s) return JSON.parse(s); } catch {}
    try { const l = localStorage.getItem('sesionActual'); if (l) return JSON.parse(l); } catch {}
    return null;
  }
  // Guard: unified session o back-compat bandera isAdmin
  const ses = readSesActual();
  const isAdminUnified = ses && ses.perfil === 'Administrador';
  const isAdminLegacy = (()=>{ try { return localStorage.getItem('isAdmin') === '1'; } catch { return false; } })();

  // Si no hay sesión admin, redirigir a login de admin (ruta relativa desde /pages/admin/*)
  if (!isAdminUnified && !isAdminLegacy) {
    // Evita bucle si ya estamos intentando ir al login
    const loginUrl = '../tienda/login_admin.html';
    if (typeof window !== 'undefined' && window.location) {
      // Permite que archivos locales funcionen bien
      window.location.replace(loginUrl);
    }
    return;
  }

  // Logout helper: cualquier botón con data-action="logout" limpiará sesión
  function setupLogout(){
    const buttons = document.querySelectorAll('[data-action="logout"], .js-admin-logout');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        try { localStorage.removeItem('isAdmin'); } catch {}
        try { sessionStorage.removeItem('sesionActual'); } catch {}
        try { localStorage.removeItem('sesionActual'); } catch {}
        window.location.replace('../tienda/login_admin.html');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupLogout);
  } else {
    setupLogout();
  }
})();