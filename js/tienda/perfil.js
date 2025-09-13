// js/tienda/perfil.js
(function(){
  'use strict';

  function safeParseJSON(text, fb){ try { return JSON.parse(text); } catch { return fb; } }

  function readSession(){
    try {
      const s = sessionStorage.getItem('sesionActual');
      if (s) return safeParseJSON(s, null);
    } catch {}
    try {
      const l = localStorage.getItem('sesionActual');
      if (l) return safeParseJSON(l, null);
    } catch {}
    return null;
  }

  function findUserByCorreo(correo){
    const lista = Array.isArray(window.usuarios) ? window.usuarios : [];
    const c = String(correo||'').toLowerCase();
    return lista.find(u => String(u.correo||'').toLowerCase() === c) || null;
  }

  function formatMemberSince(dateStr){
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      // Ej: 12 Sep, 2025 (local)
      const day = String(d.getDate()).padStart(2,'0');
      const month = d.toLocaleString('es-CL', { month: 'short' });
      const year = d.getFullYear();
      return `${day} ${month}, ${year}`;
    } catch { return ''; }
  }

  function init(){
    const ses = (window.Session && typeof window.Session.get==='function') ? window.Session.get() : readSession();
    if (!ses || !ses.correo) {
      // no autenticado -> redirigir a login
      window.location.href = 'login.html';
      return;
    }

    const user = findUserByCorreo(ses.correo) || { nombre: ses.nombre || 'Usuario', apellidos: '', correo: ses.correo };

    // Panel izquierdo
    const nameEl = document.getElementById('profileName');
    const emailTxt = document.getElementById('profileEmailText');
    const memberSince = document.getElementById('memberSinceText');
    if (nameEl) nameEl.textContent = `${user.nombre || ''} ${user.apellidos || ''}`.trim() || (ses.nombre || 'Usuario');
    if (emailTxt) emailTxt.textContent = user.correo || ses.correo;

    // Si quisiéramos mostrar "Miembro desde" usando fechaNacimiento como referencia (aprox)
    if (memberSince) {
      const f = user.fechaNacimiento ? formatMemberSince(user.fechaNacimiento) : '';
      if (f) {
        memberSince.style.display = '';
        memberSince.querySelector('small').textContent = `Miembro desde: ${f}`;
      } else {
        memberSince.style.display = 'none';
      }
    }

  // Detalles
    const dNom = document.getElementById('detailNombre');
    const dApe = document.getElementById('detailApellido');
    const dCor = document.getElementById('detailCorreo');
    if (dNom) dNom.textContent = user.nombre || (ses.nombre || '—');
    if (dApe) dApe.textContent = user.apellidos || '—';
    if (dCor) dCor.textContent = user.correo || ses.correo || '—';

    // Ajustar modal de edición con datos reales
    const iFirst = document.getElementById('profileFirstName');
    const iLast  = document.getElementById('profileLastName');
    const iEmail = document.getElementById('profileEmail');
    if (iFirst) iFirst.value = user.nombre || (ses.nombre || '');
    if (iLast)  iLast.value = user.apellidos || '';
    if (iEmail) iEmail.value = user.correo || ses.correo || '';

    // Guardar cambios de nombre/apellido
    const saveBtn = document.getElementById('saveProfileButton');
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        const first = document.getElementById('profileFirstName');
        const last  = document.getElementById('profileLastName');
        const inputs = [first, last];
        let ok = true;
        inputs.forEach(inp => { if (!inp) return; inp.classList.remove('is-invalid','is-valid'); if (String(inp.value||'').trim()===''){ inp.classList.add('is-invalid'); ok=false; } else { inp.classList.add('is-valid'); }});
        if (!ok) return;

        // Persistir en usuariosExtra (por correo)
        const correoKey = String(user.correo || ses.correo || '').toLowerCase();
        const safeParse = (t,fb)=>{ try { return JSON.parse(t); } catch { return fb; } };
        const extrasRaw = (()=>{ try { return localStorage.getItem('usuariosExtra'); } catch { return '[]'; } })();
        const extras = Array.isArray(safeParse(extrasRaw,'[]')) ? safeParse(extrasRaw,'[]') : [];
        const idx = extras.findIndex(u => String((u?.correo)||'').toLowerCase() === correoKey);
        if (idx >= 0) {
          extras[idx] = { ...extras[idx], nombre: String(first.value).trim(), apellidos: String(last.value).trim() };
        } else {
          // Si no existe en extras, crear override mínimo para este correo
          extras.push({
            run: user.run || '',
            nombre: String(first.value).trim(),
            apellidos: String(last.value).trim(),
            correo: correoKey,
            perfil: user.perfil || 'Cliente',
            fechaNacimiento: user.fechaNacimiento || '',
            region: user.region || '',
            comuna: user.comuna || '',
            direccion: user.direccion || ''
          });
        }
        try { localStorage.setItem('usuariosExtra', JSON.stringify(extras)); } catch {}

        // Refrescar window.usuarios usando merge definido en js/script.js
        try {
          const merged = (function(){
            // Reutiliza helpers de script.js si existen
            const normalizeRun = (v)=> String(v || '').replace(/[^0-9kK]/g, '').toUpperCase();
            function mergeUsuarios(seed, extras){
              const byCorreo = new Map();
              const byRun = new Map();
              const out = [];
              const pushUser = (u) => {
                const correo = String(u.correo || '').toLowerCase();
                const runNorm = normalizeRun(u.run);
                if (correo && !byCorreo.has(correo) && runNorm && !byRun.has(runNorm)) {
                  byCorreo.set(correo, true);
                  byRun.set(runNorm, true);
                  out.push(u);
                }
              };
              (Array.isArray(extras)?extras:[]).forEach(e=>{ const {passwordHash,passwordSalt,...safe}=e||{}; pushUser(safe); });
              (Array.isArray(seed)?seed:[]).forEach(pushUser);
              return out;
            }
            const seed = Array.isArray(window.usuarios) ? window.usuarios.filter(u=>!(extras.find(e=>String(e.correo||'').toLowerCase()===String(u.correo||'').toLowerCase()))) : (window.usuarios||[]);
            return mergeUsuarios(seed, extras);
          })();
          if (Array.isArray(merged) && merged.length) window.usuarios = merged;
        } catch {}

        // Actualizar UI inmediata
        const fullName = `${String(first.value).trim()} ${String(last.value).trim()}`.trim();
        if (nameEl) nameEl.textContent = fullName || nameEl.textContent;
        if (dNom) dNom.textContent = String(first.value).trim();
        if (dApe) dApe.textContent = String(last.value).trim();

        // Actualizar nombre visible de la sesión para navbar
        try {
          if (window.Session && typeof window.Session.get==='function' && typeof window.Session.set==='function'){
            const current = window.Session.get() || {};
            const updated = { ...current, nombre: fullName || current.nombre };
            // Mantener el flag remember si existía
            if (current.remember) updated.remember = true;
            window.Session.set(updated);
            // refrescar menú
            if (typeof window.Session.updateNavbar==='function') window.Session.updateNavbar();
          }
        } catch {}

        // Cerrar modal y feedback
        try { const modal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal')); if (modal) modal.hide(); } catch {}
        try { if (typeof showNotification==='function') showNotification('Perfil actualizado con éxito.', 'bi-check-circle-fill', 'text-success'); } catch {}
        try { inputs.forEach(i=>i && i.classList.remove('is-valid')); } catch {}
      });
    }

    // ================================================================
    // Preferencias: medio de pago predeterminado (persistencia local)
    // ================================================================
    const prefSelect = document.getElementById('defaultPayment');
    const savePrefBtn = document.getElementById('savePreferencesButton');
    function getExtras(){
      const raw = (()=>{ try { return localStorage.getItem('usuariosExtra'); } catch { return '[]'; } })();
      const arr = safeParseJSON(raw||'[]', []);
      return Array.isArray(arr) ? arr : [];
    }
    function setExtras(arr){ try { localStorage.setItem('usuariosExtra', JSON.stringify(Array.isArray(arr)?arr:[])); } catch {} }
    function upsertExtraPatch(correoKey, patch){
      const extras = getExtras();
      const idx = extras.findIndex(u => String((u?.correo)||'').toLowerCase()===correoKey);
      if (idx>=0) {
        const prev = extras[idx]||{};
        const prevPrefs = prev.preferencias || {};
        extras[idx] = { ...prev, preferencias: { ...prevPrefs, ...((patch && patch.preferencias)||{}) }, ...patch };
      } else {
        extras.push({ correo: correoKey, ...patch });
      }
      setExtras(extras);
      return extras;
    }
    const correoKey = String(user.correo || ses.correo || '').toLowerCase();
    // Cargar valor inicial de preferencias
    if (prefSelect) {
      try {
        const extras = getExtras();
        const me = extras.find(e => String((e?.correo)||'').toLowerCase()===correoKey) || {};
        const pago = me?.preferencias?.pagoPredeterminado || '';
        prefSelect.value = pago || '';
      } catch {}
    }
    if (savePrefBtn && prefSelect) {
      savePrefBtn.addEventListener('click', () => {
        const val = String(prefSelect.value || '').trim();
        upsertExtraPatch(correoKey, { preferencias: { pagoPredeterminado: val } });
        try { if (typeof showNotification==='function') showNotification('Preferencias guardadas.', 'bi-check-circle-fill', 'text-success'); } catch {}
      });
    }

    // ==============================================
    // Referidos: generar y compartir código + conteo
    // ==============================================
    const refCodeInput = document.getElementById('refCodeValue');
    const genRefBtn = document.getElementById('generateRefCodeButton');
    const copyRefBtn = document.getElementById('copyRefLinkButton');
    const shareRefBtn = document.getElementById('shareRefButton');
    const mailRefBtn = document.getElementById('mailRefButton');
    const tweetRefBtn = document.getElementById('tweetRefButton');
    const refCountEl = document.getElementById('refCountValue');
  const refListBody = document.getElementById('refListBody');
  const refListEmpty = document.getElementById('refListEmpty');

    function ensureRefCode(){
      const extras = getExtras();
      const idx = extras.findIndex(e => String((e?.correo)||'').toLowerCase()===correoKey);
      const make = () => `LU-${Math.random().toString(36).slice(2,7).toUpperCase()}-${Date.now().toString(36).slice(-3).toUpperCase()}`;
      if (idx>=0) {
        if (!extras[idx].refCode) {
          extras[idx].refCode = make();
          setExtras(extras);
        }
        return extras[idx].refCode;
      } else {
        const refCode = make();
        extras.push({ correo: correoKey, refCode, referidos: { count: 0, users: [] } });
        setExtras(extras);
        return refCode;
      }
    }
    function getMyRefData(){
      const extras = getExtras();
      const me = extras.find(e => String((e?.correo)||'').toLowerCase()===correoKey) || {};
      // Estructura nueva: users es array de objetos { email, date }
      let users = [];
      if (Array.isArray(me?.referidos?.users)) {
        users = me.referidos.users.map(u => {
          if (typeof u === 'string') return { email: u, date: '' };
          const email = String(u?.email || '').trim();
          const date = String(u?.date || '');
          return { email, date };
        });
      }
      const count = me?.referidos?.count || users.length || 0;
      const code = me?.refCode || '';
      return { count, users, code };
    }
    function updateRefUI(){
      const { count, code } = getMyRefData();
      if (refCountEl) refCountEl.textContent = String(count);
      if (refCodeInput) refCodeInput.value = code || '';
  const base = 'registro.html';
  const link = code ? `${base}?ref=${encodeURIComponent(code)}` : base;
      if (mailRefBtn) mailRefBtn.href = `mailto:?subject=${encodeURIComponent('Únete a Level-Up Gamer')}&body=${encodeURIComponent('Regístrate con mi código y gana beneficios: ' + link)}`;
      if (tweetRefBtn) tweetRefBtn.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent('Únete a Level-Up Gamer con mi código: ' + link)}`;
      // Guardar para copy/share
      updateRefUI.currentLink = link;
      // Render listado
      renderRefList();
    }
    function maskEmail(email){
      const e = String(email||'');
      const [user, domain] = e.split('@');
      if (!user || !domain) return '***';
      const head = user.slice(0,2);
      const tail = user.length>2 ? user.slice(-1) : '';
      const maskedUser = `${head}${'*'.repeat(Math.max(1, user.length-3))}${tail}`;
      const domParts = domain.split('.');
      const domHead = domParts[0] || '';
      const maskedDomHead = domHead.length>2 ? `${domHead[0]}${'*'.repeat(domHead.length-2)}${domHead.slice(-1)}` : `${domHead[0]||''}*`;
      const rest = domParts.slice(1).join('.') || '';
      return `${maskedUser}@${maskedDomHead}${rest?'.'+rest:''}`;
    }
    function formatDate(d){ try { const dt = d? new Date(d) : null; if (!dt || isNaN(dt)) return ''; return dt.toLocaleDateString('es-CL'); } catch { return ''; } }
    function renderRefList(){
      if (!refListBody) return;
      const { users } = getMyRefData();
      const list = Array.isArray(users) ? users.slice() : [];
      // ordenar por fecha descendente si hay
      list.sort((a,b)=> new Date(b.date||0) - new Date(a.date||0));
      refListBody.innerHTML = '';
      if (refListEmpty) refListEmpty.classList.toggle('d-none', list.length>0);
      if (list.length === 0){
        if (refListEmpty && !refListEmpty.parentElement){
          const tr = document.createElement('tr');
          tr.id='refListEmpty';
          tr.innerHTML = `<td colspan="2" class="text-secondary text-center">Aún no tienes referidos.</td>`;
          refListBody.appendChild(tr);
        }
        return;
      }
      list.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${maskEmail(item.email)}</td><td class="text-end">${formatDate(item.date)}</td>`;
        refListBody.appendChild(tr);
      });
    }
    updateRefUI();
    if (genRefBtn) {
      genRefBtn.addEventListener('click', (e)=>{
        e.preventDefault();
        const code = ensureRefCode();
        updateRefUI();
        try { if (typeof showNotification==='function') showNotification('Código de referido generado.', 'bi-stars', 'text-info'); } catch {}
      });
    }
    if (copyRefBtn) {
      copyRefBtn.addEventListener('click', async (e)=>{
        e.preventDefault();
        const link = updateRefUI.currentLink || '';
        try { await navigator.clipboard.writeText(link); if (typeof showNotification==='function') showNotification('Enlace copiado al portapapeles.', 'bi-clipboard-check', 'text-success'); } catch { alert('Copia: '+link); }
      });
    }
    if (shareRefBtn) {
      shareRefBtn.addEventListener('click', async (e)=>{
        e.preventDefault();
        const link = updateRefUI.currentLink || '';
        if (navigator.share) {
          try { await navigator.share({ title:'Level-Up Gamer', text:'Regístrate con mi código y gana beneficios', url: link }); } catch {}
        } else {
          try { await navigator.clipboard.writeText(link); if (typeof showNotification==='function') showNotification('Compartir no soportado: enlace copiado.', 'bi-clipboard', 'text-secondary'); } catch {}
        }
      });
    }

  // =====================================================================
    // Direcciones: Persistencia local (CRUD) por usuario
    // =====================================================================
    // Regiones/Comunas helpers
    function populateRegions(selectEl){
      if (!selectEl) return;
      const regiones = (window.regiones && typeof window.regiones==='object') ? window.regiones : {};
      const opts = ['<option value="">Selecciona…</option>', ...Object.keys(regiones).map(r=>`<option>${r}</option>`)];
      selectEl.innerHTML = opts.join('');
    }
    function populateComunas(selectRegion, selectComuna, preselect){
      const regiones = (window.regiones && typeof window.regiones==='object') ? window.regiones : {};
      const r = selectRegion?.value || '';
      const comunas = Array.isArray(regiones[r]) ? regiones[r] : [];
      selectComuna.innerHTML = ['<option value="">Selecciona…</option>', ...comunas.map(c=>`<option>${c}</option>`)].join('');
      selectComuna.disabled = comunas.length === 0;
      if (preselect && comunas.includes(preselect)) selectComuna.value = preselect; else selectComuna.value = '';
    }

    const ADDR_KEY = (correo) => `user:addresses:${String(correo||'').toLowerCase()}`;
    const addrContainer = document.getElementById('addresses-container');
    const addrEmpty = document.getElementById('addresses-empty');
    const addBtnRow = addrContainer ? addrContainer.querySelector('.col-12.d-flex') : null;

    function loadAddresses(){
      try {
        const raw = localStorage.getItem(ADDR_KEY(user.correo || ses.correo));
        const arr = safeParseJSON(raw || '[]', []);
        return Array.isArray(arr) ? arr : [];
      } catch { return []; }
    }
    function saveAddresses(list){
      try { localStorage.setItem(ADDR_KEY(user.correo || ses.correo), JSON.stringify(Array.isArray(list)?list:[])); } catch {}
    }
    function genId(){ return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`; }

    function ensureSeedIfEmpty(list){
      const out = Array.isArray(list) ? list.slice() : [];
      const maybeAddress = {
        id: genId(),
        fullName: `${user.nombre || ''} ${user.apellidos || ''}`.trim() || (ses.nombre || 'Usuario'),
        line1: user.direccion || '',
        city: user.comuna || '',
        region: user.region || '',
        country: 'Chile',
        isPrimary: true,
      };
      const hasSeed = !!(maybeAddress.line1 && (maybeAddress.city || maybeAddress.region));
      if (out.length === 0 && hasSeed) out.push(maybeAddress);
      // Garantizar que haya solo 0 o 1 principal
      let primarySeen = false;
      out.forEach(a => { if (a.isPrimary && !primarySeen) { primarySeen = true; } else { a.isPrimary = false; } });
      if (out.length > 0 && !primarySeen) out[0].isPrimary = true;
      return out;
    }

    function clearRenderedAddresses(){
      if (!addrContainer) return;
      // Eliminar todas las tarjetas previamente generadas (col-md-6) manteniendo el alert y el botón añadir
      const cards = addrContainer.querySelectorAll('.col-md-6');
      cards.forEach(c => c.remove());
    }

    function renderAddresses(list){
      if (!addrContainer) return;
      clearRenderedAddresses();
      const arr = Array.isArray(list) ? list : [];
      if (addrEmpty) addrEmpty.classList.toggle('d-none', arr.length > 0);
      arr.forEach(addr => {
        const col = document.createElement('div');
        col.className = 'col-md-6';
        const title = addr.isPrimary ? 'Dirección Principal' : 'Dirección';
        const place = [addr.city, addr.region].filter(Boolean).join(', ');
        const country = addr.country || 'Chile';
        const canDelete = arr.length > 1; // Si solo hay una, no mostrar eliminar
        col.innerHTML = `
          <div class="card card-body">
            <h4 class="h6 d-flex align-items-center justify-content-between">
              <span>${title}</span>
              ${addr.isPrimary ? '<span class="badge bg-success">Principal</span>' : ''}
            </h4>
            <p class="text-secondary mb-1">
              ${addr.fullName || ''}<br>
              ${addr.line1 || ''}<br>
              ${place}<br>
              ${country}
            </p>
            <div class="mt-2">
              <a href="#" class="form-text link-edit-address" data-id="${addr.id}" data-bs-toggle="modal" data-bs-target="#editAddressModal">Editar</a>
              ${canDelete ? ` | <a href="#" class="form-text text-danger link-delete-address" data-id="${addr.id}" data-bs-toggle="modal" data-bs-target="#deleteAddressModal">Eliminar</a>` : ''}
              ${addr.isPrimary ? '' : ` | <a href="#" class="form-text link-make-primary" data-id="${addr.id}">Hacer principal</a>`}
            </div>
          </div>`;
        addrContainer.insertBefore(col, addBtnRow || null);
      });
    }

    // Estado en memoria
    let addresses = ensureSeedIfEmpty(loadAddresses());
    saveAddresses(addresses);
    renderAddresses(addresses);

    // Handlers: Añadir dirección
    const saveAddressButton = document.getElementById('saveAddressButton');
    if (saveAddressButton) {
      // preparar selects al abrir modal (una vez DOM listo)
      const addRegion = document.getElementById('addAddressRegion');
      const addCity = document.getElementById('addAddressCity');
      populateRegions(addRegion);
      if (addRegion && !addRegion.dataset.bound){
        addRegion.addEventListener('change', ()=> populateComunas(addRegion, addCity));
        addRegion.dataset.bound = '1';
      }

      saveAddressButton.addEventListener('click', (e) => {
        e.preventDefault();
        const fullName = document.getElementById('addAddressFullName');
        const line1 = document.getElementById('addAddressLine1');
        const region = document.getElementById('addAddressRegion');
        const city = document.getElementById('addAddressCity');
        const inputs = [fullName, line1, region, city];
        let valid = true;
        inputs.forEach(inp => { if (!inp) return; inp.classList.remove('is-invalid','is-valid'); if (String(inp.value||'').trim()===''){ inp.classList.add('is-invalid'); valid=false; } else { inp.classList.add('is-valid'); } });
        if (!valid) return;
        const addr = {
          id: genId(),
          fullName: String(fullName.value).trim(),
          line1: String(line1.value).trim(),
          city: String(city.value).trim(),
          region: String(region.value).trim(),
          country: 'Chile',
          isPrimary: addresses.length === 0
        };
        addresses.push(addr);
        // Asegurar único principal
        if (addr.isPrimary) { addresses.forEach(a => { if (a.id !== addr.id) a.isPrimary = false; }); }
        saveAddresses(addresses);
        renderAddresses(addresses);
        try { const modal = bootstrap.Modal.getInstance(document.getElementById('addAddressModal')); if (modal) modal.hide(); } catch {}
        try { 
          const f = document.getElementById('addAddressForm');
          f.reset();
          document.querySelectorAll('#addAddressForm input, #addAddressForm select').forEach(i=>i.classList.remove('is-valid'));
          if (addCity) { addCity.innerHTML = '<option value="">Selecciona…</option>'; addCity.disabled = true; }
        } catch {}
        try { if (typeof showNotification==='function') showNotification('Nueva dirección guardada.', 'bi-check-circle-fill', 'text-success'); } catch {}
      });
    }

    // Handlers: Editar y Eliminar (delegados)
    let currentEditId = null;
    let currentDeleteId = null;
    if (addrContainer) {
      addrContainer.addEventListener('click', (ev) => {
        const a = ev.target.closest('a');
        if (!a) return;
        // Editar
        if (a.classList.contains('link-edit-address')) {
          ev.preventDefault();
          currentEditId = a.getAttribute('data-id');
          const found = addresses.find(x => x.id === currentEditId);
          if (found) {
            const fn = document.getElementById('editAddressFullName');
            const l1 = document.getElementById('editAddressLine1');
            const re = document.getElementById('editAddressRegion');
            const ci = document.getElementById('editAddressCity');
            if (fn) fn.value = found.fullName || '';
            if (l1) l1.value = found.line1 || '';
            // Popular selects region/comuna
            populateRegions(re);
            if (re) { re.value = found.region || ''; }
            if (re && ci) { populateComunas(re, ci, found.city || ''); }
            if (re && !re.dataset.bound){
              re.addEventListener('change', ()=> populateComunas(re, ci));
              re.dataset.bound = '1';
            }
            document.querySelectorAll('#editAddressForm input, #editAddressForm select').forEach(i=>i.classList.remove('is-invalid','is-valid'));
          }
          return;
        }
        // Eliminar
        if (a.classList.contains('link-delete-address')) {
          ev.preventDefault();
          currentDeleteId = a.getAttribute('data-id');
          return;
        }
        // Hacer principal
        if (a.classList.contains('link-make-primary')) {
          ev.preventDefault();
          const id = a.getAttribute('data-id');
          let changed = false;
          addresses.forEach(x => { if (x.id === id && !x.isPrimary) { x.isPrimary = true; changed = true; } else if (x.id !== id) { x.isPrimary = false; } });
          if (changed) {
            saveAddresses(addresses);
            renderAddresses(addresses);
            try { if (typeof showNotification==='function') showNotification('Dirección marcada como principal.', 'bi-check-circle-fill', 'text-success'); } catch {}
          }
          return;
        }
      });
    }

    const updateAddressButton = document.getElementById('updateAddressButton');
    if (updateAddressButton) {
      updateAddressButton.addEventListener('click', (e) => {
        e.preventDefault();
        if (!currentEditId) return;
        const fn = document.getElementById('editAddressFullName');
        const l1 = document.getElementById('editAddressLine1');
        const re = document.getElementById('editAddressRegion');
        const ci = document.getElementById('editAddressCity');
        const inputs = [fn,l1,re,ci];
        let valid = true;
        inputs.forEach(inp => { if (!inp) return; inp.classList.remove('is-invalid','is-valid'); if (String(inp.value||'').trim()===''){ inp.classList.add('is-invalid'); valid=false; } else { inp.classList.add('is-valid'); } });
        if (!valid) return;
        const idx = addresses.findIndex(x => x.id === currentEditId);
        if (idx !== -1) {
          addresses[idx] = { ...addresses[idx], fullName: fn.value.trim(), line1: l1.value.trim(), city: ci.value.trim(), region: re.value.trim() };
          saveAddresses(addresses);
          renderAddresses(addresses);
          try { const modal = bootstrap.Modal.getInstance(document.getElementById('editAddressModal')); if (modal) modal.hide(); } catch {}
          try { if (typeof showNotification==='function') showNotification('Dirección actualizada correctamente.', 'bi-check-circle-fill', 'text-success'); } catch {}
        }
      });
    }

    const confirmDeleteAddressButton = document.getElementById('confirmDeleteAddressButton');
    if (confirmDeleteAddressButton) {
      confirmDeleteAddressButton.addEventListener('click', (e) => {
        e.preventDefault();
        if (!currentDeleteId) return;
        // Blindaje: no permitir eliminar si quedaría en 0 direcciones
        if (addresses.length <= 1) {
          try { const modal = bootstrap.Modal.getInstance(document.getElementById('deleteAddressModal')); if (modal) modal.hide(); } catch {}
          try { if (typeof showNotification==='function') showNotification('No puedes eliminar tu única dirección.', 'bi-exclamation-triangle-fill', 'text-warning'); } catch {}
          return;
        }
        const wasPrimary = (addresses.find(x => x.id === currentDeleteId)?.isPrimary) || false;
        addresses = addresses.filter(x => x.id !== currentDeleteId);
        if (addresses.length > 0) {
          // Si eliminaste la principal, asigna otra
          if (wasPrimary && !addresses.some(a => a.isPrimary)) addresses[0].isPrimary = true;
          // Garantizar único principal
          let seen = false; addresses.forEach(a => { if (a.isPrimary && !seen) { seen = true; } else { a.isPrimary = false; } });
        }
        saveAddresses(addresses);
        renderAddresses(addresses);
        currentDeleteId = null;
        try { const modal = bootstrap.Modal.getInstance(document.getElementById('deleteAddressModal')); if (modal) modal.hide(); } catch {}
        try { if (typeof showNotification==='function') showNotification('Dirección eliminada correctamente.', 'bi-trash-fill', 'text-danger'); } catch {}
      });
    }

    // Cerrar sesión
    const logout = document.getElementById('logoutBtn');
    if (logout) {
      logout.addEventListener('click', (e) => {
        e.preventDefault();
        try { if (window.Session && typeof window.Session.clear==='function') window.Session.clear(); } catch {}
        try { if (typeof showNotification === 'function') showNotification('Sesión cerrada.', 'bi-door-closed-fill', 'text-secondary'); } catch {}
        window.location.href = 'index.html';
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
