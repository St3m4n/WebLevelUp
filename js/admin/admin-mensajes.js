(function(){
  'use strict';

  // Storage keys
  const MSG_KEY = 'contacto:mensajes';

  // Helpers
  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
  const parseJSON = (val, def) => { try { return JSON.parse(val); } catch { return def; } };
  const fmtDate = (iso) => {
    try { const d = new Date(iso); return d.toLocaleString(); } catch { return iso || ''; }
  };

  // State
  let mensajes = [];
  let filtroTexto = '';
  let filtroEstado = '';
  let selectedIndex = null;

  // Elements
  const tbody = $('[data-ref="tbody"]');
  const rowEmpty = $('[data-ref="row-empty"]');
  const txtBusqueda = $('[data-ref="busqueda"]');
  const selEstado = $('[data-ref="estado"]');
  const btnFiltrar = $('[data-ref="btn-filtrar"]');
  const btnLimpiar = $('[data-ref="btn-limpiar"]');

  // Modal elements
  const modalEl = $('#msgModal');
  const modal = modalEl ? new bootstrap.Modal(modalEl) : null;
  const mNombre = $('[data-ref="m-nombre"]');
  const mEmail = $('[data-ref="m-email"]');
  const mAsunto = $('[data-ref="m-asunto"]');
  const mMensaje = $('[data-ref="m-mensaje"]');
  const mRespuesta = $('[data-ref="m-respuesta"]');
  const btnResponder = $('[data-ref="btn-responder"]');

  function loadMensajes(){
    const arr = parseJSON(localStorage.getItem(MSG_KEY), []);
    // Normalize: ensure fields and status
    mensajes = (arr || []).map(x => ({
      nombre: x.nombre || '',
      email: x.email || '',
      asunto: x.asunto || '',
      mensaje: x.mensaje || '',
      fecha: x.fecha || new Date().toISOString(),
      estado: x.estado || 'pendiente',
      respuesta: x.respuesta || ''
    })).sort((a,b)=> new Date(b.fecha) - new Date(a.fecha));
  }

  function saveMensajes(){
    localStorage.setItem(MSG_KEY, JSON.stringify(mensajes));
  }

  function applyFilters(list){
    let out = list;
    const t = filtroTexto.trim().toLowerCase();
    if(t){
      out = out.filter(m =>
        m.nombre.toLowerCase().includes(t) ||
        m.email.toLowerCase().includes(t) ||
        m.asunto.toLowerCase().includes(t) ||
        m.mensaje.toLowerCase().includes(t)
      );
    }
    if(filtroEstado){
      out = out.filter(m => (m.estado === filtroEstado));
    }
    return out;
  }

  function render(){
    tbody.innerHTML = '';
    const items = applyFilters(mensajes);
    if(!items.length){
      tbody.appendChild(rowEmpty);
      rowEmpty.style.display = '';
      return;
    }
    rowEmpty.style.display = 'none';
    items.forEach((m, idx) => {
      const tr = document.createElement('tr');
      const badge = m.estado === 'respondido' ? '<span class="badge text-bg-success">Respondido</span>' : '<span class="badge text-bg-warning">Pendiente</span>';
      tr.innerHTML = `
        <td>${fmtDate(m.fecha)}</td>
        <td>${escapeHtml(m.nombre)}</td>
        <td><a href="mailto:${encodeURIComponent(m.email)}">${escapeHtml(m.email)}</a></td>
        <td>${escapeHtml(m.asunto)}</td>
        <td>${badge}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-primary" data-action="ver" data-index="${idx}">Ver</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function escapeHtml(s){
    const str = (s === undefined || s === null) ? '' : String(s);
    return str.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }

  function openModal(indexInFiltered){
    const items = applyFilters(mensajes);
    const msg = items[indexInFiltered];
    if(!msg) return;
    // Map to actual index in mensajes (in case of filters)
    const realIndex = mensajes.findIndex(m => m.fecha === msg.fecha && m.email === msg.email && m.asunto === msg.asunto);
    selectedIndex = realIndex >= 0 ? realIndex : indexInFiltered;

    mNombre.textContent = msg.nombre;
    mEmail.textContent = msg.email;
    mEmail.href = `mailto:${encodeURIComponent(msg.email)}?subject=${encodeURIComponent('Re: ' + msg.asunto)}`;
    mAsunto.textContent = msg.asunto;
    mMensaje.textContent = msg.mensaje;
    mRespuesta.value = msg.respuesta || '';

    if(modal) modal.show();
  }

  // Events
  btnFiltrar?.addEventListener('click', () => {
    filtroTexto = txtBusqueda.value;
    filtroEstado = selEstado.value;
    render();
  });
  btnLimpiar?.addEventListener('click', () => {
    filtroTexto = '';
    filtroEstado = '';
    txtBusqueda.value = '';
    selEstado.value = '';
    render();
  });
  txtBusqueda?.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ filtroTexto = txtBusqueda.value; render(); }});
  selEstado?.addEventListener('change', ()=>{ filtroEstado = selEstado.value; render(); });

  tbody?.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-action="ver"]');
    if(!btn) return;
    const idx = Number(btn.getAttribute('data-index'));
    openModal(idx);
  });

  btnResponder?.addEventListener('click', ()=>{
    if(selectedIndex == null) return;
    const resp = mRespuesta.value.trim();
    confirmAction({
      title: 'Marcar como respondido',
      message: '¿Deseas marcar este mensaje como respondido?',
      confirmText: 'Sí, marcar',
      cancelText: 'Cancelar',
      variant: 'success'
    }).then(ok => {
      if(!ok) return;
      mensajes[selectedIndex].respuesta = resp;
      mensajes[selectedIndex].estado = 'respondido';
      saveMensajes();
  try { window.audit?.log({ entity:'mensaje', action:'respond', target: mensajes[selectedIndex].email, meta: { asunto: mensajes[selectedIndex].asunto } }); } catch {}
      if(window.showNotification){ window.showNotification('Respuesta registrada (demo localStorage)'); }
      render();
      modal?.hide();
    });
  });

  // Init
  loadMensajes();
  render();
})();
