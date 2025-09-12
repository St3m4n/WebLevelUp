// js/tienda/login.js
// Maneja el inicio de sesión de clientes comparando contra usuarios registrados en localStorage (usuariosExtra)
// y semilla (data/usuarios.js). Para usuarios sembrados sin contraseña, se pedirá registrarse.

(function(){
  // Utilidades compatibles con js/script.js
  function safeParseJSON(text, fallback) { try { return JSON.parse(text); } catch { return fallback; } }
  function getUsuariosExtra() {
    const raw = (() => { try { return localStorage.getItem('usuariosExtra'); } catch { return null; } })();
    const arr = safeParseJSON(raw || '[]', []);
    return Array.isArray(arr) ? arr : [];
  }
  function mergeUsuarios(seed, extras) {
    const byCorreo = new Map();
    const byRun = new Map();
    const out = [];
    const pushUser = (u) => {
      const correo = String(u.correo || '').toLowerCase();
      const runNorm = String(u.run || '');
      if (correo && !byCorreo.has(correo) && runNorm && !byRun.has(runNorm)) {
        byCorreo.set(correo, true);
        byRun.set(runNorm, true);
        out.push(u);
      }
    };
    (Array.isArray(seed) ? seed : []).forEach(pushUser);
    (Array.isArray(extras) ? extras : []).forEach(pushUser);
    return out;
  }

  // Crypto helpers (SHA-256)
  async function sha256(bytes) {
    const buf = await crypto.subtle.digest('SHA-256', bytes);
    return new Uint8Array(buf);
  }
  function fromBase64(b64) {
    const binary = atob(String(b64||''));
    const out = new Uint8Array(binary.length);
    for (let i=0;i<binary.length;i++) out[i] = binary.charCodeAt(i);
    return out;
  }
  function toBase64(bytes) {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }
  async function hashWithSalt(saltB64, password) {
    const salt = fromBase64(saltB64);
    const encoder = new TextEncoder();
    const pwBytes = encoder.encode(String(password || ''));
    const combined = new Uint8Array(salt.length + pwBytes.length);
    combined.set(salt, 0);
    combined.set(pwBytes, salt.length);
    const digest = await sha256(combined);
    return toBase64(digest);
  }

  function showToastOrAlert(msg, iconClass = 'bi-check-circle-fill', colorClass = 'text-success') {
    try { if (typeof showNotification === 'function') return showNotification(msg, iconClass, colorClass); } catch {}
    alert(msg);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('clientLoginForm');
    if (!form) return;

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberInput = document.getElementById('rememberMe');
    const errorBox = document.getElementById('login-error');

    function setInvalid(input, invalid) {
      if (!input) return; input.classList.toggle('is-invalid', invalid);
    }
    function showError(msg) {
      if (errorBox) { errorBox.textContent = msg; errorBox.classList.remove('d-none'); }
      showToastOrAlert(msg, 'bi-x-octagon-fill', 'text-danger');
    }
    function clearError() {
      if (errorBox) { errorBox.textContent = ''; errorBox.classList.add('d-none'); }
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearError();

      const correo = String(emailInput?.value || '').trim().toLowerCase();
      const password = String(passwordInput?.value || '');

      setInvalid(emailInput, !correo);
      setInvalid(passwordInput, !password);
      if (!correo || !password) {
        showError('Completa correo y contraseña.');
        return;
      }

      // Cargar usuarios
  const seed = Array.isArray(window.usuarios) ? window.usuarios : [];
      const extras = getUsuariosExtra();
      const merged = mergeUsuarios(seed, extras);

      // Buscar en extras (porque son los que tienen hash y salt)
      const extraUser = extras.find(u => String(u.correo||'').toLowerCase() === correo);
      if (extraUser && extraUser.passwordSalt && extraUser.passwordHash) {
        try {
          const computed = await hashWithSalt(extraUser.passwordSalt, password);
          if (computed === extraUser.passwordHash) {
            // Sesión unificada
            const remember = !!(rememberInput && rememberInput.checked);
            try { if (window.Session && typeof window.Session.set === 'function') { window.Session.set({ correo, nombre: extraUser.nombre, perfil: 'Cliente', remember }); } } catch {}
            // Back-compat: mantener antiguo clienteLogueado solo si remember
            try { if (remember) localStorage.setItem('clienteLogueado', JSON.stringify({ correo, nombre: extraUser.nombre, perfil: 'Cliente' })); } catch {}
            showToastOrAlert('Bienvenido de vuelta, ' + (extraUser.nombre || 'Jugador') + '!', 'bi-check-circle-fill', 'text-success');
            // Redirigir a home o perfil
            window.location.href = 'index.html';
            return;
          }
        } catch {}
        showError('Contraseña incorrecta.');
        setInvalid(passwordInput, true);
        return;
      }

      // Si existe en semilla pero no en extras, no hay contraseña para verificar
      const seedUser = merged.find(u => String(u.correo||'').toLowerCase() === correo && String(u.perfil||'') !== 'Administrador');
      if (seedUser) {
        showError('Este usuario fue precargado y no tiene contraseña. Por favor regístrate para crear una.');
        setInvalid(emailInput, true);
        return;
      }

      // Usuario no encontrado
      showError('Usuario no encontrado. ¿Aún no tienes cuenta? Regístrate.');
      setInvalid(emailInput, true);
    });
  });
})();
