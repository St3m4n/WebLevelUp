// /js/admin/admin-usuario-direcciones.js
// Gestiona direcciones del usuario en el formulario admin de edición.
(function(){
  'use strict';

  const $ = (q, ctx=document)=>ctx.querySelector(q);
  const $$ = (q, ctx=document)=>[...ctx.querySelectorAll(q)];
  const LS_KEY_USUARIOS = 'usuarios';
  const addrKey = (correo) => `user:addresses:${String(correo||'').toLowerCase()}`;

  function loadUsuarios(){
    try{ const raw = localStorage.getItem(LS_KEY_USUARIOS); const arr = JSON.parse(raw||'[]'); return Array.isArray(arr)?arr:[]; }catch{ return []; }
  }
  function loadAddresses(correo){
    try{ const raw = localStorage.getItem(addrKey(correo)); const arr = JSON.parse(raw||'[]'); return Array.isArray(arr)?arr:[]; }catch{ return []; }
  }
  function saveAddresses(correo, list){
    try{ localStorage.setItem(addrKey(correo), JSON.stringify(Array.isArray(list)?list:[])); }catch{}
  }
  function genId(){ return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`; }

  function ensureSinglePrimary(list){
    let seen=false; list.forEach(a=>{ if(a.isPrimary && !seen){ seen=true; } else { a.isPrimary=false; } });
    if (!list.some(a=>a.isPrimary) && list.length>0) list[0].isPrimary = true;
    return list;
  }

  function renderTable(tbody, list){
    const empty = $('[data-ref="row-empty"]', tbody.parentElement);
    tbody.innerHTML = '';
    if (!list || list.length===0){ if (empty) empty.classList.remove('d-none'); return; }
    if (empty) empty.classList.add('d-none');
    list.forEach(a=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${a.fullName||''}</td>
        <td>${a.line1||''}</td>
        <td>${a.city||''}</td>
        <td>${a.region||''}</td>
        <td>${a.isPrimary ? '<span class="badge bg-success">Principal</span>' : ''}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary" data-act="edit" data-id="${a.id}">Editar</button>
          ${list.length>1 ? `<button class="btn btn-sm btn-outline-danger" data-act="del" data-id="${a.id}">Eliminar</button>` : ''}
          ${a.isPrimary ? '' : `<button class="btn btn-sm btn-outline-secondary" data-act="make" data-id="${a.id}">Hacer principal</button>`}
        </td>`;
      tbody.appendChild(tr);
    });
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    const params = new URLSearchParams(location.search);
    const id = params.get('id'); // RUN si es edición
    const usuarios = loadUsuarios();
    const user = usuarios.find(u => (u && String(u.run||'').toUpperCase().replace(/[^0-9K]/g,'') ) === (String(id||'').toUpperCase().replace(/[^0-9K]/g,'')) );

    // Si no es edición o no hay user, ocultar card direcciones
    const card = document.querySelector('[data-ref="card-direcciones"]');
    if (!id || !user){ if (card) card.classList.add('d-none'); return; }

    const correo = user.correo;
    const tbody = document.querySelector('[data-ref="tbody-dir"]');
    const btnAdd = document.querySelector('[data-ref="btn-add-dir"]');

    let list = ensureSinglePrimary(loadAddresses(correo));

    function refresh(){ saveAddresses(correo, list); renderTable(tbody, list); }

    refresh();

    btnAdd?.addEventListener('click', ()=>{
      const fullName = prompt('Nombre y Apellido:'); if (!fullName) return;
      const line1 = prompt('Dirección:'); if (!line1) return;
      const city = prompt('Ciudad:'); if (!city) return;
      const region = prompt('Región:'); if (!region) return;
      const addr = { id: genId(), fullName, line1, city, region, country:'Chile', isPrimary: list.length===0 };
      list.push(addr);
      list = ensureSinglePrimary(list);
      refresh();
    });

    tbody?.addEventListener('click', (e)=>{
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      const act = btn.getAttribute('data-act');
      const id = btn.getAttribute('data-id');
      const idx = list.findIndex(a=>a.id===id);
      if (idx<0) return;
      if (act==='edit'){
        const cur = list[idx];
        const fullName = prompt('Nombre y Apellido:', cur.fullName||''); if (!fullName) return;
        const line1 = prompt('Dirección:', cur.line1||''); if (!line1) return;
        const city = prompt('Ciudad:', cur.city||''); if (!city) return;
        const region = prompt('Región:', cur.region||''); if (!region) return;
        list[idx] = { ...cur, fullName, line1, city, region };
        refresh();
      } else if (act==='del'){
        if (list.length<=1){ alert('No puedes eliminar la única dirección.'); return; }
        if (!confirm('¿Eliminar dirección?')) return;
        const wasPrimary = !!list[idx].isPrimary;
        list.splice(idx,1);
        if (wasPrimary && list.length>0) list[0].isPrimary = true;
        list = ensureSinglePrimary(list);
        refresh();
      } else if (act==='make'){
        list = list.map((a,i)=> ({...a, isPrimary: a.id===id}));
        refresh();
      }
    });
  });
})();
