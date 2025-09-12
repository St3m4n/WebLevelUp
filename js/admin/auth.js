(function(){
  // Simple guard: requiere bandera isAdmin en localStorage
  const isAdmin = (()=>{
    try { return localStorage.getItem('isAdmin') === '1'; } catch { return false; }
  })();

  // Si no hay flag, redirigir a login de admin (ruta relativa desde /pages/admin/*)
  if (!isAdmin) {
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