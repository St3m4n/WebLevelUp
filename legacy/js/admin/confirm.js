// /js/admin/confirm.js
// Reusable Bootstrap confirm modal returning a Promise<boolean>
(function(){
  'use strict';
  function ensureModal(){
    if (document.getElementById('confirmModal')) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = `
<div class="modal fade" id="confirmModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content bg-dark text-white">
      <div class="modal-header border-secondary">
        <h5 class="modal-title" data-ref="title">Confirmar</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
      </div>
      <div class="modal-body">
        <div data-ref="message">¿Estás seguro?</div>
      </div>
      <div class="modal-footer border-secondary">
        <button type="button" class="btn btn-outline-secondary" data-ref="btn-cancel">Cancelar</button>
        <button type="button" class="btn btn-danger" data-ref="btn-ok">Confirmar</button>
      </div>
    </div>
  </div>
</div>`;
    document.body.appendChild(wrap.firstElementChild);
  }

  window.confirmAction = function(opts){
    ensureModal();
    const modalEl = document.getElementById('confirmModal');
    const mdl = new bootstrap.Modal(modalEl);
    const $ = (sel, ctx=modalEl) => ctx.querySelector(sel);
    const prevFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const title = opts?.title || 'Confirmar';
    const message = opts?.message || '¿Estás seguro?';
    const confirmText = opts?.confirmText || 'Confirmar';
    const cancelText = opts?.cancelText || 'Cancelar';
    const variant = opts?.variant || 'danger'; // primary|danger|success|warning

    $('[data-ref="title"]').textContent = title;
    $('[data-ref="message"]').innerHTML = message;

    const btnOk = $('[data-ref="btn-ok"]');
    const btnCancel = $('[data-ref="btn-cancel"]');

    // reset classes
    btnOk.className = 'btn';
    btnOk.classList.add('btn-' + variant);
    btnOk.textContent = confirmText;

    btnCancel.textContent = cancelText;

    return new Promise(resolve => {
      function cleanup(){
        btnOk.removeEventListener('click', onOk);
        btnCancel.removeEventListener('click', onCancel);
        modalEl.removeEventListener('hidden.bs.modal', onHidden);
      }
      function blurActive(){ try{ (document.activeElement && document.activeElement instanceof HTMLElement) && document.activeElement.blur(); }catch{} }
      function onOk(){ cleanup(); blurActive(); mdl.hide(); resolve(true); }
      function onCancel(){ cleanup(); blurActive(); mdl.hide(); resolve(false); }
      function onHidden(){ cleanup(); try{ prevFocus && prevFocus.focus && prevFocus.focus(); }catch{} resolve(false); }

      btnOk.addEventListener('click', onOk, { once:true });
      btnCancel.addEventListener('click', onCancel, { once:true });
      modalEl.addEventListener('hidden.bs.modal', onHidden, { once:true });

      mdl.show();
      // Move initial focus to confirm button for accessibility
      try{ btnOk.focus(); }catch{}
    });
  };
})();
