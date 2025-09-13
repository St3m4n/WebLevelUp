(function(){
  'use strict';

  // Utilidad: trim seguro y normalización básica
  const trim = (s) => (s || '').trim();

  // Email regex razonable (no excesivamente estricta)
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // Límites
  const LIMITS = {
    nombre: 200,
    email: 254,
    asunto: 50,
    mensaje: 1000,
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
      // Agrega feedback si no existe
      let fb = el.nextElementSibling;
      if (!fb || !fb.classList.contains('invalid-feedback')) {
        fb = document.createElement('div');
        fb.className = 'invalid-feedback';
        el.parentNode.appendChild(fb);
      }
      fb.textContent = msg;
    };

    const clearError = (el) => {
      el.classList.remove('is-invalid');
      let fb = el.nextElementSibling;
      if (fb && fb.classList.contains('invalid-feedback')) {
        fb.textContent = '';
      }
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
      if (!EMAIL_RE.test(v)) { showError(email, 'Correo inválido.'); return false; }
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
