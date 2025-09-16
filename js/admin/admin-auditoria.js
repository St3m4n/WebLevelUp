// /js/admin/admin-auditoria.js
(function(){
  const $ = (s, ctx=document)=>ctx.querySelector(s);

  async function render(){
    const listEl = $('[data-ref="audit-list"]');
    const emptyEl= $('[data-ref="audit-empty"]');
    const qActor = String($('[data-ref="f-actor"]')?.value||'').trim();
    const qEntity= String($('[data-ref="f-entity"]')?.value||'');
    const qAction= String($('[data-ref="f-action"]')?.value||'');

    // Prefer async/remote when available
    let items = [];
    if (window.audit && typeof window.audit.loadAsync==='function'){
      const filters = {};
      if (qActor){
        // server can accept either; send as provided
        if (qActor.includes('@')) filters.actorEmail = qActor; else filters.actorRun = qActor;
      }
      if (qEntity) filters.entity = qEntity;
      if (qAction) filters.action = qAction;
      filters.limit = 200;
      try { items = await window.audit.loadAsync(filters); } catch { items = []; }
    } else if (window.audit && typeof window.audit.load==='function') {
      items = window.audit.load();
      // apply local filters if needed
      if (qActor){
        const runUp = qActor.toUpperCase();
        const emailLo = qActor.toLowerCase();
        items = items.filter(x => (x.actorRun && String(x.actorRun).toUpperCase()===runUp) || (x.actorEmail && String(x.actorEmail).toLowerCase()===emailLo));
      }
      if (qEntity){ items = items.filter(x => x.entity === qEntity); }
      if (qAction){ items = items.filter(x => x.action === qAction); }
    }

    if (!items.length){
      listEl.classList.add('d-none');
      emptyEl.classList.remove('d-none');
      return;
    }

    emptyEl.classList.add('d-none');
    listEl.classList.remove('d-none');

    listEl.innerHTML = items.slice(0,200).map(x => {
      const d = new Date(x.at); const f = d.toLocaleString();
      const actor = x.actorEmail || x.actorRun || '—';
      const action = (x.action||'').toUpperCase();
      const target = x.target || '';
      const meta = x.meta ? `<div class="small text-muted">${Object.entries(x.meta).map(([k,v])=>`${k}: ${v}`).join(' · ')}</div>` : '';
      return `<li class="list-group-item d-flex justify-content-between align-items-center">
        <div>
          <div class="small text-muted">${f}</div>
          <div><b>${action}</b> · ${x.entity} · ${target}</div>
          ${meta}
        </div>
        <span class="badge text-bg-secondary">${actor}</span>
      </li>`;
    }).join('');
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    try {
      if (window.LEVELUP_API_BASE && window.audit && typeof window.audit.configure==='function'){
        window.audit.configure({ mode:'remote', endpoint: String(window.LEVELUP_API_BASE).replace(/\/$/,'') + '/audit' });
      }
    } catch {}
    render();
    $('[data-ref="btn-filtrar"]').addEventListener('click', render);
    ['f-actor','f-entity','f-action'].forEach(ref => {
      const el = document.querySelector(`[data-ref="${ref}"]`);
      el?.addEventListener('keydown', (e)=>{ if (e.key==='Enter') render(); });
      el?.addEventListener('change', render);
    });
  });
})();
