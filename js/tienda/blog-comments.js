(function(){
  const POST_KEY = 'comments:blog_1';
  const form = document.getElementById('comment-form');
  const list = document.getElementById('comments-list');

  function load() {
    try { return JSON.parse(localStorage.getItem(POST_KEY) || '[]'); }
    catch { return []; }
  }
  function save(comments){ localStorage.setItem(POST_KEY, JSON.stringify(comments)); }

  function escapeHtml(str){
    return str.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
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
      const data = new FormData(form);
      const name = (data.get('name')||'').toString().trim();
      const email = (data.get('email')||'').toString().trim();
      const message = (data.get('message')||'').toString().trim();

      if(!name || !email || !message){
        alert('Por favor completa todos los campos.');
        return;
      }
      // Validación simple de correo
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
        alert('Por favor ingresa un correo válido.');
        return;
      }

      const comments = load();
      comments.unshift({ name, email, message, date: new Date().toISOString() });
      save(comments);
      form.reset();
      render();
    });
  }

  // El script se carga al final del body, el DOM ya está listo
  seedIfEmpty();
  render();
})();
