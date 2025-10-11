(function(){
  'use strict';
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('forgotForm');
    if (!form) return;
    const email = document.getElementById('email');
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function toggleHint(input, invalid){
      const parent = input.closest('.mb-4, .mb-3') || input.parentNode;
      parent.querySelectorAll('.limit-hint').forEach(h => h.classList.toggle('d-none', !invalid));
    }
    function setInvalid(input, invalid){
      input.classList.toggle('is-invalid', invalid);
      toggleHint(input, invalid);
    }

    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const val = String(email.value||'').trim();
      const ok = !!val && EMAIL_RE.test(val);
      setInvalid(email, !ok);
      if (!ok) return;
      try { if (typeof showNotification==='function') showNotification('Correo de confirmación enviado. Revisa tu bandeja de entrada.', 'bi-envelope-check', 'text-success'); } catch {}
    });
  });
})();
