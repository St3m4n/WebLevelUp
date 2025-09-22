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
  const COLLAPSE_KEY = `${POST_KEY}:collapsed`;
  const SLICE_KEY = `${POST_KEY}:slice-expanded`;
  const REPLIES_SLICE = 5;
  const BORRADO_USER = '[borrado por el usuario]';
  const BORRADO_ADMIN = '[borrado por un administrador]';

  function getSession(){
    try { return (window.Session && typeof window.Session.get==='function') ? window.Session.get() : null; } catch { return null; }
  }
  function getDisplayName(ses){
    if (!ses) return '';
    if (ses.nombre) return String(ses.nombre).split(' ')[0];
    if (ses.correo) return String(ses.correo).split('@')[0];
    return 'Usuario';
  }

  function isAdmin(ses){ try { return !!ses && String(ses.perfil||'') === 'Administrador'; } catch { return false; } }
  function canModerate(ses, comment){
    if (!ses || !comment) return false;
    if (isAdmin(ses)) return true;
    try { return !!ses.correo && !!comment.email && String(ses.correo) === String(comment.email); } catch { return false; }
  }

  function load() {
    try { return JSON.parse(localStorage.getItem(POST_KEY) || '[]'); }
    catch { return []; }
  }
  function save(comments){ localStorage.setItem(POST_KEY, JSON.stringify(comments)); }

  // Cargar/guardar mapa de hilos contraídos (persistencia por publicación)
  function loadCollapsed(){
    try { return JSON.parse(localStorage.getItem(COLLAPSE_KEY) || '{}'); }
    catch { return {}; }
  }
  function saveCollapsed(map){ localStorage.setItem(COLLAPSE_KEY, JSON.stringify(map||{})); }
  function isCollapsed(id){ const m = loadCollapsed(); return !!m[id]; }
  function setCollapsed(id, v){ const m = loadCollapsed(); if (v) m[id]=true; else delete m[id]; saveCollapsed(m); }
  function collapseAll(nodes){ const m = {}; function walk(arr){ for (const n of arr){ m[n.id]=true; if (n.replies?.length) walk(n.replies); } } walk(nodes); saveCollapsed(m); }
  function expandAll(){ saveCollapsed({}); }
  function anyExpanded(nodes){
    const m = loadCollapsed();
    let expanded = false; (function walk(arr){ for (const n of arr){ if (!m[n.id]) { expanded = true; return; } if (n.replies?.length) walk(n.replies); if (expanded) return; } })(nodes);
    return expanded;
  }

  // Cargar/guardar estado de expansión de "mostrar más respuestas" por hilo
  function loadSlices(){ try { return JSON.parse(localStorage.getItem(SLICE_KEY) || '{}'); } catch { return {}; } }
  function saveSlices(m){ localStorage.setItem(SLICE_KEY, JSON.stringify(m||{})); }
  function isSlicedExpanded(id){ const m = loadSlices(); return !!m[id]; }
  function expandSlice(id){ const m = loadSlices(); m[id] = true; saveSlices(m); }

  function escapeHtml(str){
    return String(str||'').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }

  function uid(){
    try { return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`; } catch { return String(Date.now()); }
  }

  function normalizeComments(arr){
    let changed = false;
    function normalizeNode(node){
      const cc = { ...node };
      if (!cc.id){ cc.id = uid(); changed = true; }
      if (!Array.isArray(cc.replies)){ cc.replies = []; changed = true; }
      if (typeof cc.edited !== 'boolean'){ cc.edited = false; changed = true; }
      if (typeof cc.deleted !== 'boolean'){ cc.deleted = false; changed = true; }
  // Normalizar recursivamente las respuestas hijas
      const newReplies = [];
      for (const r of cc.replies){
        const nn = normalizeNode(r);
        newReplies.push(nn);
      }
      cc.replies = newReplies;
      return cc;
    }
    const out = (Array.isArray(arr) ? arr : []).map(normalizeNode);
    return { list: out, changed };
  }

  function loadNormalized(){
    const raw = load();
    const { list, changed } = normalizeComments(raw);
    if (changed) save(list);
    return list;
  }

  function render(){
    const comments = loadNormalized();
    if (!comments.length){
      list.innerHTML = '<div class="text-muted">No hay comentarios todavía. ¡Sé el primero en opinar!</div>';
      return;
    }
  // Contar respuestas descendientes totales (para etiqueta de contraído)
  function countDesc(n){
      let total = 0;
      const children = Array.isArray(n.replies) ? n.replies : [];
      for (const ch of children){ total += 1 + countDesc(ch); }
      return total;
    }

  // Render recursivo del comentario con sus respuestas
  function commentHTML(c, depth){
      const indentWrapStart = depth > 0 ? '<div class="lu-replies" data-replies>' : '';
      const indentWrapEnd = depth > 0 ? '</div>' : '';
      const children = (Array.isArray(c.replies) ? c.replies : []);
      const isTop = depth === 0;
      const outerClasses = isTop ? 'lu-comment card bg-transparent border rounded-3 mb-3' : 'lu-comment mb-2';
      const bodyClass = isTop ? 'card-body' : '';
      const collapsed = isCollapsed(c.id);
      const descCount = collapsed ? countDesc(c) : 0;
      const toggleLabel = collapsed ? `▸ ${descCount}` : '▾';
      const ses = getSession();
      const admin = isAdmin(ses);
      const canEditDelete = canModerate(ses, c) && (!c.deleted || admin);
  const editedBadge = c.edited ? '<span class="lu-edited small">· editado</span>' : '';
      const msgHtml = c.deleted ? `<em class="text-secondary">${escapeHtml(c.message || BORRADO_USER)}</em>` : escapeHtml(c.message);
      return `${indentWrapStart}
        <div class="${outerClasses}${collapsed ? ' collapsed' : ''}" data-comment-id="${c.id}" data-depth="${depth}">
          <div class="${bodyClass}${!isTop ? '' : ''}">
            <div class="d-flex align-items-center justify-content-between mb-1">
              <div class="d-inline-flex align-items-center gap-2">
                <button type="button" class="btn btn-link btn-sm p-0 lu-toggle" data-action="toggle-thread" data-id="${c.id}" aria-expanded="${!collapsed}">${toggleLabel}</button>
                <strong class="lu-author" title="${escapeHtml(c.email)}">${escapeHtml(c.name)}</strong>
                <span class="lu-date small text-muted">${new Date(c.date).toLocaleString()}</span>${editedBadge}
              </div>
            </div>
            ${collapsed ? `
              <div class="text-muted small">Comentario contraído • ${descCount} ${descCount===1?'respuesta':'respuestas'}</div>
            ` : `
              <div style="white-space: pre-wrap;" data-message-container>${msgHtml}</div>
              <div class="mt-2 d-flex gap-3 align-items-center">
                <button type="button" class="btn btn-link btn-sm p-0 lu-action" data-action="reply" data-id="${c.id}"><i class="bi bi-reply me-1"></i>Responder</button>
                ${canEditDelete ? `<button type="button" class="btn btn-link btn-sm p-0 lu-action" data-action="edit" data-id="${c.id}"><i class="bi bi-pencil-square me-1"></i>Editar</button>` : ''}
                ${canEditDelete ? `<button type="button" class="btn btn-link btn-sm p-0 lu-action lu-action-danger" data-action="delete" data-id="${c.id}"><i class="bi bi-trash3 me-1"></i>Eliminar</button>` : ''}
              </div>
              <div class="mt-2" data-edit-form-container></div>
              <div class="mt-2" data-reply-form-container></div>
              ${(() => {
                const expandedSlice = isSlicedExpanded(c.id);
                const visible = expandedSlice ? children : children.slice(0, REPLIES_SLICE);
                const remaining = Math.max(0, children.length - visible.length);
                const htmlChildren = visible.map(child => commentHTML(child, depth+1)).join('');
                const showMore = remaining > 0 ? `<button type="button" class="btn btn-link btn-sm p-0 text-secondary" data-action="expand-replies" data-id="${c.id}">Mostrar ${remaining} ${remaining===1?'respuesta más':'respuestas más'}</button>` : '';
                return htmlChildren + showMore;
              })()}
            `}
          </div>
        </div>
      ${indentWrapEnd}`;
    }
    list.innerHTML = comments.map(c => commentHTML(c, 0)).join('');
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
    const formChildren = Array.from(form.children || []);

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
      // Ocultar todos los elementos del formulario excepto el mensaje de autenticación
      formChildren.forEach(ch => { if (ch !== authMsg) ch.style.display = 'none'; });
      form.classList.add('lu-locked');
    } else {
      if (nameInput) { nameInput.value = ses.nombre || getDisplayName(ses); nameInput.readOnly = true; nameInput.disabled = true; }
      if (emailInput) { emailInput.value = ses.correo || ''; emailInput.readOnly = true; emailInput.disabled = true; }
      if (msgInput) msgInput.disabled = false;
      if (submitBtn) submitBtn.disabled = false;
      authMsg.innerHTML = '';
      authMsg.style.display = 'none';
      // Mostrar nuevamente los campos (luego ocultamos nombre/correo como arriba)
      formChildren.forEach(ch => { if (ch !== authMsg) ch.style.display = ''; });
      form.classList.remove('lu-locked');
    }
  }

  function seedIfEmpty(){
    const existing = load();
    if(existing.length === 0){
      const now = new Date();
      const sample = [
        { id: uid(), name: 'María López', email: 'maria@example.com', message: 'Excelente resumen, me ayudó a decidir mi próximo teclado.', date: now.toISOString(), replies: [] },
        { id: uid(), name: 'Juan Pérez', email: 'juan@example.com', message: '¿Alguno con switches silenciosos que recomienden?', date: new Date(now.getTime()-5*60*1000).toISOString(), replies: [] }
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

      const comments = loadNormalized();
      comments.unshift({ id: uid(), name, email, message, date: new Date().toISOString(), replies: [] });
      save(comments);
      form.reset();
      setupAuthGate();
      render();
    });
  }

  // Manejadores de respuesta mediante delegación (funciona a cualquier profundidad)
  if (list){
    list.addEventListener('click', (e)=>{
      const toggler = e.target.closest('[data-action="toggle-thread"]');
      if (toggler){
        const id = toggler.getAttribute('data-id');
        setCollapsed(id, toggler.getAttribute('aria-expanded') === 'true');
        render();
        return;
      }
      const expandBtn = e.target.closest('[data-action="expand-replies"]');
      if (expandBtn){
        const id = expandBtn.getAttribute('data-id');
        expandSlice(id);
        render();
        return;
      }
      // Editar comentario
      const editBtn = e.target.closest('[data-action="edit"]');
      if (editBtn){
        const ses = getSession();
        const id = editBtn.getAttribute('data-id');
        const data = loadNormalized();
        function find(nodes){ for (const n of nodes){ if (n.id===id) return n; const r = find(n.replies||[]); if (r) return r; } return null; }
        const node = find(data);
        if (!node) return;
        if (!canModerate(ses, node)) { alert('No tienes permisos para editar este comentario.'); return; }
        const card = editBtn.closest('[data-comment-id]');
        if (!card) return;
        const container = card.querySelector('[data-edit-form-container]');
        if (!container) return;
        if (container.querySelector('form[data-edit-form]')) return; // ya abierto
        const original = String(node.message||'');
        container.innerHTML = `
          <form data-edit-form class="row g-2">
            <div class="col-12">
              <textarea class="form-control" rows="3">${original.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</textarea>
            </div>
            <div class="col-12 d-flex gap-2">
              <button type="submit" class="btn btn-sm btn-outline-light" data-action="save-edit">Guardar</button>
              <button type="button" class="btn btn-sm btn-outline-secondary" data-action="cancel-edit">Cancelar</button>
            </div>
          </form>`;
        const formEdit = container.querySelector('form[data-edit-form]');
        formEdit.addEventListener('submit', (ev)=>{
          ev.preventDefault();
          const ta = formEdit.querySelector('textarea');
          const msg = (ta?.value||'').toString().trim();
          if (!msg){ alert('El mensaje no puede estar vacío.'); return; }
          node.message = msg;
          node.edited = true;
          node.editedAt = new Date().toISOString();
          save(data);
          render();
        });
        const cancelBtn = formEdit.querySelector('[data-action="cancel-edit"]');
        cancelBtn?.addEventListener('click', ()=>{ container.innerHTML = ''; });
        return;
      }

      // Eliminar comentario
      const delBtn = e.target.closest('[data-action="delete"]');
      if (delBtn){
        const ses = getSession();
        const id = delBtn.getAttribute('data-id');
        const data = loadNormalized();
        function removeOrSoft(nodes){
          for (let i=0;i<nodes.length;i++){
            const n = nodes[i];
            if (n.id === id){
              if (!canModerate(ses, n)) { alert('No tienes permisos para eliminar este comentario.'); return true; }
              const hasReplies = Array.isArray(n.replies) && n.replies.length>0;
              if (hasReplies){
                n.message = isAdmin(ses) ? BORRADO_ADMIN : BORRADO_USER;
                n.deleted = true;
                save(data);
                return true;
              } else {
                nodes.splice(i,1);
                save(data);
                return true;
              }
            }
            if (Array.isArray(n.replies) && n.replies.length){ if (removeOrSoft(n.replies)) return true; }
          }
          return false;
        }
        if (confirm('¿Eliminar este comentario?')){
          removeOrSoft(data);
          render();
        }
        return;
      }

      // Responder comentario
      const btn = e.target.closest('[data-action="reply"]');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      const ses = getSession();
      if (!ses){ alert('Debes iniciar sesión para responder.'); try { window.location.href = 'login.html'; } catch {}; return; }
      const card = btn.closest('[data-comment-id]');
      if (!card) return;
      const container = card.querySelector('[data-reply-form-container]');
      if (!container) return;
      const existing = container.querySelector('form[data-reply-form]');
      if (existing) { existing.querySelector('textarea')?.focus(); return; }
      container.innerHTML = `
        <form data-reply-form class="row g-2">
          <div class="col-12">
            <textarea class="form-control" rows="3" placeholder="Escribe tu respuesta..."></textarea>
          </div>
          <div class="col-12 d-flex gap-2">
            <button type="submit" class="btn btn-sm btn-outline-light">Publicar respuesta</button>
            <button type="button" class="btn btn-sm btn-outline-secondary" data-action="cancel-reply">Cancelar</button>
          </div>
        </form>`;
      container.querySelector('textarea')?.focus();

      const formReply = container.querySelector('form[data-reply-form]');
      if (formReply){
        formReply.addEventListener('submit', (ev)=>{
          ev.preventDefault();
          const ses2 = getSession();
          if (!ses2){ alert('Debes iniciar sesión para responder.'); try { window.location.href = 'login.html'; } catch {}; return; }
          const ta = formReply.querySelector('textarea');
          const msg = (ta?.value||'').toString().trim();
          if (!msg){ alert('Escribe tu respuesta.'); return; }
          const name = ses2.nombre || getDisplayName(ses2);
          const email = ses2.correo || '';
          const listData = loadNormalized();
          const replyNode = { id: uid(), name, email, message: msg, date: new Date().toISOString(), replies: [] };
          function addReplyById(nodes, targetId){
            for (const n of nodes){
              if (n.id === targetId){
                if (!Array.isArray(n.replies)) n.replies = [];
                n.replies.unshift(replyNode);
                return true;
              }
              if (Array.isArray(n.replies) && n.replies.length){
                if (addReplyById(n.replies, targetId)) return true;
              }
            }
            return false;
          }
          if (addReplyById(listData, id)){
            save(listData);
            render();
          }
        });
        const cancelBtn = formReply.querySelector('[data-action="cancel-reply"]');
        cancelBtn?.addEventListener('click', ()=>{ container.innerHTML = ''; });
      }
    });
  }

  // Init
  seedIfEmpty();
  setupAuthGate();
  render();
})();
