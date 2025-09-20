(function(){
  function getSlugFromPath(){
    try {
      const path = String(window.location && window.location.pathname || '');
      const base = path.substring(path.lastIndexOf('/')+1);
      const name = base.split('?')[0].split('#')[0];
      return name.replace(/\.html?$/i,'') || 'post';
    } catch { return 'post'; }
  }
  function getPostKey(){
    const container = document.getElementById('comments') || document.getElementById('comment-form') || document.body;
    const dataKey = container ? container.getAttribute('data-post-key') : null;
    const meta = document.querySelector('meta[name="post-key"]');
    const raw = (dataKey && String(dataKey).trim()) || (meta && String(meta.content||'').trim()) || getSlugFromPath();
    return `comments:blog:${raw}`;
  }
  const POST_KEY = getPostKey();
  const form = document.getElementById('comment-form');
  const list = document.getElementById('comments-list');

  function getSession(){
    try { return (window.Session && typeof window.Session.get==='function') ? window.Session.get() : null; } catch { return null; }
  }
  function getDisplayName(ses){
    if (!ses) return '';
    if (ses.nombre) return String(ses.nombre).split(' ')[0];
    if (ses.correo) return String(ses.correo).split('@')[0];
    return 'Usuario';
  }

  function load() {
    try { return JSON.parse(localStorage.getItem(POST_KEY) || '[]'); }
    catch { return []; }
  }
  function save(comments){ localStorage.setItem(POST_KEY, JSON.stringify(comments)); }

  function escapeHtml(str){
    return String(str||'').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }

  function render(){
    const comments = load();
    if(!comments.length){
      list.innerHTML = '<div class="text-muted">No hay comentarios todavía. ¡Sé el primero en opinar!</div>';
      return;
    }
    list.innerHTML = comments.map(c => `
      <div class="card bg-transparent border rounded-3 mb-3">
        <div class="card-body">
          <div class="d-flex align-items-center justify-content-between mb-1">
            <strong>${escapeHtml(c.name)}</strong>
            <small class="text-muted">${new Date(c.date).toLocaleString()}</small>
          </div>
          <div class="small text-muted mb-2">${escapeHtml(c.email)}</div>
          <div style="white-space: pre-wrap;">${escapeHtml(c.message)}</div>
        </div>
      </div>`).join('');
  }

  function setupAuthGate(){
    if (!form) return;
    const ses = getSession();
    const submitBtn = form.querySelector('button[type="submit"]');
    const msgInput = form.querySelector('textarea[name="message"]');
    const nameInput = document.getElementById('c-name');
    const emailInput = document.getElementById('c-email');
    const nameGroup = nameInput ? nameInput.closest('.col-md-6, .col-12') : null;
    const emailGroup = emailInput ? emailInput.closest('.col-md-6, .col-12') : null;

    // Crear/ubicar mensaje de autenticación
    let authMsg = document.getElementById('comment-auth-msg');
    if (!authMsg) {
      authMsg = document.createElement('div');
      authMsg.id = 'comment-auth-msg';
      authMsg.className = 'col-12';
      // Insertar antes del primer grupo
      if (nameGroup && nameGroup.parentNode) {
        nameGroup.parentNode.insertBefore(authMsg, nameGroup);
      } else {
        form.insertBefore(authMsg, form.firstChild);
      }
    }

    // Ocultar nombre/correo siempre (se autocompletan/usan desde la sesión)
    if (nameGroup) nameGroup.style.display = 'none';
    if (emailGroup) emailGroup.style.display = 'none';

    if (!ses){
      if (msgInput) msgInput.disabled = true;
      if (submitBtn) submitBtn.disabled = true;
      authMsg.style.display = '';
      authMsg.innerHTML = '<div class="alert alert-warning bg-transparent border-warning text-warning mb-0">Debes iniciar sesión para comentar. <a href="login.html" class="alert-link">Inicia sesión aquí</a>.</div>';
    } else {
      if (nameInput) { nameInput.value = ses.nombre || getDisplayName(ses); nameInput.readOnly = true; nameInput.disabled = true; }
      if (emailInput) { emailInput.value = ses.correo || ''; emailInput.readOnly = true; emailInput.disabled = true; }
      if (msgInput) msgInput.disabled = false;
      if (submitBtn) submitBtn.disabled = false;
      authMsg.innerHTML = '';
      authMsg.style.display = 'none';
    }
  }

  function seedIfEmpty(){
    const existing = load();
    if(existing.length === 0){
      const now = new Date();
      const sample = [
        { name: 'María López', email: 'maria@example.com', message: 'Excelente resumen, me ayudó a decidir mi próximo teclado.', date: now.toISOString() },
        { name: 'Juan Pérez', email: 'juan@example.com', message: '¿Alguno con switches silenciosos que recomienden?', date: new Date(now.getTime()-5*60*1000).toISOString() }
      ];
      save(sample);
    }
  }

  if(form){
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const ses = getSession();
      if (!ses){
        alert('Debes iniciar sesión para publicar un comentario.');
        try { window.location.href = 'login.html'; } catch {}
        return;
      }
      const data = new FormData(form);
      const message = (data.get('message')||'').toString().trim();
      const name = ses.nombre || getDisplayName(ses);
      const email = ses.correo || '';
      if(!message){ alert('Escribe tu comentario.'); return; }
      if(!email){ alert('Tu cuenta no tiene correo asociado.'); return; }

      const comments = load();
      comments.unshift({ name, email, message, date: new Date().toISOString() });
      save(comments);
      form.reset();
      setupAuthGate();
      render();
    });
  }

  // Init
  seedIfEmpty();
  setupAuthGate();
  render();
})();
