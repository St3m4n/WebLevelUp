(function(){
  'use strict';

  // Utilidad: trim seguro y normalización básica
  const trim = (s) => (s || '').trim();

  // Email regex razonable (no excesivamente estricta) + dominios permitidos
  const BASIC_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const ALLOWED_DOMAINS = new Set(['duoc.cl', 'profesor.duoc.cl', 'gmail.com']);

  // Límites
  const LIMITS = {
    nombre: 100,
    email: 100,
    asunto: 50,
    mensaje: 500,
  };

  function setUp() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const nombre = document.getElementById('nombre');
    const email = document.getElementById('email');
    const asunto = document.getElementById('asunto');
    const mensaje = document.getElementById('mensaje');
    const countEl = document.getElementById('mensaje-count');

    // Contador en vivo para mensaje
    const updateCounter = () => {
      const len = trim(mensaje.value).length;
      countEl.textContent = `${len}/${LIMITS.mensaje}`;
    };
    mensaje.addEventListener('input', updateCounter);
    updateCounter();

    // Validaciones básicas por input
    const showError = (el, msg) => {
      el.classList.add('is-invalid');
      const parent = el.parentNode;
      // Reutiliza un único feedback por campo
      let fb = parent.querySelector('.invalid-feedback');
      if (!fb) {
        fb = document.createElement('div');
        fb.className = 'invalid-feedback';
        // Si existe un .form-text como hijo directo, inserta el feedback antes; si no, al final
        const directHelp = Array.from(parent.children).find(ch => ch.classList && ch.classList.contains('form-text'));
        if (directHelp) {
          parent.insertBefore(fb, directHelp);
        } else {
          parent.appendChild(fb);
        }
      } else {
        // Si por alguna razón hay múltiples, deja solo el primero
        const all = parent.querySelectorAll('.invalid-feedback');
        for (let i = 1; i < all.length; i++) all[i].remove();
      }
      fb.textContent = msg;
      // Mostrar pistas de límite si existen
      parent.querySelectorAll('.limit-hint').forEach(h => h.classList.remove('d-none'));
    };

    const clearError = (el) => {
      el.classList.remove('is-invalid');
      const parent = el.parentNode;
      const fb = parent.querySelector('.invalid-feedback');
      if (fb) fb.textContent = '';
      // Ocultar pistas de límite cuando no hay error
      parent.querySelectorAll('.limit-hint').forEach(h => h.classList.add('d-none'));
    };

    const validateNombre = () => {
      const v = trim(nombre.value);
      if (!v) { showError(nombre, 'Ingresa tu nombre completo.'); return false; }
      if (v.length > LIMITS.nombre) { showError(nombre, `Máximo ${LIMITS.nombre} caracteres.`); return false; }
      clearError(nombre); return true;
    };

    const validateEmail = () => {
      const v = trim(email.value);
      if (!v) { showError(email, 'Ingresa tu correo electrónico.'); return false; }
      if (v.length > LIMITS.email) { showError(email, `Máximo ${LIMITS.email} caracteres.`); return false; }
      if (!BASIC_EMAIL_RE.test(v)) { showError(email, 'Ingresa un correo electrónico válido.'); return false; }
      const domain = v.split('@').pop().toLowerCase();
      if (!ALLOWED_DOMAINS.has(domain)) {
        showError(email, 'Dominios permitidos: @duoc.cl, @profesor.duoc.cl o @gmail.com.');
        return false;
      }
      clearError(email); return true;
    };

    const validateAsunto = () => {
      const v = trim(asunto.value);
      if (!v) { showError(asunto, 'Ingresa un asunto.'); return false; }
      if (v.length > LIMITS.asunto) { showError(asunto, `Máximo ${LIMITS.asunto} caracteres.`); return false; }
      clearError(asunto); return true;
    };

    const validateMensaje = () => {
      const v = trim(mensaje.value);
      if (!v) { showError(mensaje, 'Ingresa un mensaje.'); return false; }
      if (v.length > LIMITS.mensaje) { showError(mensaje, `Máximo ${LIMITS.mensaje} caracteres.`); return false; }
      clearError(mensaje); return true;
    };

    nombre.addEventListener('blur', validateNombre);
    email.addEventListener('blur', validateEmail);
    asunto.addEventListener('blur', validateAsunto);
    mensaje.addEventListener('blur', validateMensaje);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const ok = [validateNombre(), validateEmail(), validateAsunto(), validateMensaje()].every(Boolean);
      if (!ok) return;

      // Guardar en localStorage
      const payload = {
        nombre: trim(nombre.value),
        email: trim(email.value),
        asunto: trim(asunto.value),
        mensaje: trim(mensaje.value),
        fecha: new Date().toISOString(),
      };

      try {
        const key = 'contacto:mensajes';
        const arr = JSON.parse(localStorage.getItem(key) || '[]');
        arr.push(payload);
        localStorage.setItem(key, JSON.stringify(arr));
      } catch (err) {
        console.error('Error guardando en localStorage', err);
      }

      // Feedback al usuario
      form.reset();
      updateCounter();
      [nombre, email, asunto, mensaje].forEach(clearError);

      // Mostrar un toast/bootstrap alert simple
      const alert = document.createElement('div');
      alert.className = 'alert alert-success mt-3';
      alert.role = 'alert';
      alert.textContent = '¡Mensaje enviado! Te responderemos a la brevedad.';
      form.appendChild(alert);
      setTimeout(() => alert.remove(), 4000);
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setUp, { once: true });
  } else {
    setUp();
  }
})();
