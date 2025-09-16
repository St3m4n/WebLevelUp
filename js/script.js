document.addEventListener('DOMContentLoaded', () => {

    // =========================================================================
    // --- 1. SISTEMA CENTRAL DE NOTIFICACIONES (TOAST) ---
    // =========================================================================
    const toastElement = document.getElementById('notificationToast');
    const toastBody = document.getElementById('toast-body');
    const toastIcon = document.getElementById('toast-icon');
    const notificationToast = toastElement ? new bootstrap.Toast(toastElement) : null;

    // Función REUTILIZABLE para mostrar todas las notificaciones del sitio (expuesta globalmente)
    window.showNotification = function(message, iconClass, colorClass) {
        if (!notificationToast) {
            console.error("El elemento del Toast no se encontró en la página.");
            return; 
        }
        toastBody.textContent = message;
        toastIcon.className = `bi ${iconClass} ${colorClass} me-2`; // Reemplaza clases anteriores
        notificationToast.show();
    };

    // =========================================================================
    // --- 2. NOTIFICACIÓN DE CARRITO ---
    // =========================================================================
    // La notificación se dispara desde el manejador global en js/tienda/carrito.js,
    // que invoca window.showNotification tras añadir al carrito. Aquí no se agregan
    // listeners por botón para evitar duplicidad.

    // =========================================================================
    // --- 3. LÓGICA PARA LA PÁGINA DE PERFIL ---
    // =========================================================================
    // Nota: la lógica de guardado de nombre/apellido y direcciones vive en js/tienda/perfil.js

    // --- Lógica para Direcciones ---
    // La lógica completa y persistente de direcciones vive en `js/tienda/perfil.js`.
    // Se eliminan handlers genéricos aquí para evitar conflictos y duplicación.

    // --- Lógica para Cambiar Contraseña ---
    function setupPasswordToggle(inputId, buttonId) {
        const passwordInput = document.getElementById(inputId);
        const toggleButton = document.getElementById(buttonId);
        if (passwordInput && toggleButton) {
            toggleButton.addEventListener('click', () => {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                const icon = toggleButton.querySelector('i');
                icon.classList.toggle('bi-eye');
                icon.classList.toggle('bi-eye-slash');
            });
        }
    }
    setupPasswordToggle('newPassword', 'toggleNewPassword');
    setupPasswordToggle('confirmPassword', 'toggleConfirmPassword');

    const updatePasswordButton = document.getElementById('updatePasswordButton');
    if (updatePasswordButton) {
        updatePasswordButton.addEventListener('click', () => {
            const form = document.getElementById('changePasswordForm');
            const currentPassword = document.getElementById('currentPassword');
            const newPassword = document.getElementById('newPassword');
            const confirmPassword = document.getElementById('confirmPassword');
            const newPasswordFeedback = document.getElementById('newPasswordFeedback');
            let isValid = true;
            [currentPassword, newPassword, confirmPassword].forEach(input => input.classList.remove('is-invalid', 'is-valid'));

            if (currentPassword.value.trim() === '') {
                currentPassword.classList.add('is-invalid');
                isValid = false;
            } else {
                currentPassword.classList.add('is-valid');
            }
            if (newPassword.value.length < 8) {
                newPassword.classList.add('is-invalid');
                newPasswordFeedback.textContent = 'La contraseña debe tener al menos 8 caracteres.';
                isValid = false;
            } else if (newPassword.value !== confirmPassword.value) {
                newPassword.classList.add('is-invalid');
                confirmPassword.classList.add('is-invalid');
                newPasswordFeedback.textContent = 'Las contraseñas no coinciden.';
                isValid = false;
            } else {
                newPassword.classList.add('is-valid');
                confirmPassword.classList.add('is-valid');
            }
            if (isValid) {
                const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
                if (modal) modal.hide();
                showNotification('Contraseña actualizada con éxito.', 'bi-check-circle-fill', 'text-success');
                form.reset();
                [currentPassword, newPassword, confirmPassword].forEach(input => input.classList.remove('is-valid'));
            }
        });
    }
    // =========================================================================
    // --- 4. LÓGICA PARA DETALLES DEL PEDIDO (MODAL) ---
    // =========================================================================
    const viewDetailButtons = document.querySelectorAll('.btn-ver-detalles'); // Asegúrate que esta clase exista en tus botones HTML

    if (viewDetailButtons) {
        viewDetailButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Obtener los datos del pedido (esto es un ejemplo, deberías obtenerlos de donde estén almacenados)
                // Para este ejemplo, simulemos que los datos están en atributos data- del botón o del tr.
                // Idealmente, en un sistema real, cargarías esto de una base de datos o API.

                const row = this.closest('tr'); // Obtiene la fila completa del pedido
                const orderId = row.querySelector('td:nth-child(1)').textContent; // Primer td es el ID
                const orderDate = row.querySelector('td:nth-child(2)').textContent; // Segundo td es la Fecha
                const orderTotal = row.querySelector('td:nth-child(3)').textContent; // Tercer td es el Total
                const orderStatus = row.querySelector('td:nth-child(4)').textContent; // Cuarto td es el Estado

                // Rellenar el modal con la información
                document.getElementById('modalOrderId').textContent = orderId;
                document.getElementById('modalOrderDate').textContent = orderDate;
                document.getElementById('modalOrderTotal').textContent = orderTotal;
                document.getElementById('modalOrderStatus').textContent = orderStatus;

                // Ejemplo de cómo llenar los productos (esto sería más complejo en un caso real)
                const productList = document.getElementById('modalOrderProducts');
                productList.innerHTML = ''; // Limpiar productos anteriores

                // Simulamos algunos productos para el pedido (adaptar según tus necesidades)
                if (orderId === '#12345') {
                    productList.innerHTML += '<li>Consola de última generación - Cantidad: 1 - $45.000</li>';
                    productList.innerHTML += '<li>Controlador Pro - Cantidad: 1 - $9.980</li>';
                } else if (orderId === '#12301') {
                    productList.innerHTML += '<li>Tarjeta de Regalo $29.990 - Cantidad: 1</li>';
                } else if (orderId === '#12250') {
                    productList.innerHTML += '<li>Juego AAA Edición Coleccionista - Cantidad: 1 - $79.990</li>';
                } else {
                    productList.innerHTML += '<li>No hay productos detallados para este pedido.</li>';
                }

                // Mostrar el modal
                const orderDetailModal = new bootstrap.Modal(document.getElementById('orderDetailModal'));
                orderDetailModal.show();
            });
        });
    }

    // =========================================================================
    // --- 5. FUSIÓN DE USUARIOS (semilla + localStorage) ---
    // =========================================================================
    function safeParseJSON(text, fallback) {
        try { return JSON.parse(text); } catch { return fallback; }
    }
    function getUsuariosExtra() {
        const raw = (() => { try { return localStorage.getItem('usuariosExtra'); } catch { return null; } })();
        const arr = safeParseJSON(raw || '[]', []);
        return Array.isArray(arr) ? arr : [];
    }
    function normalizeRun(run) {
        return String(run || '').replace(/[^0-9kK]/g, '').toUpperCase();
    }
    function computeDv(rutDigits) {
        const digits = String(rutDigits || '').replace(/\D/g, '');
        let sum = 0, mul = 2;
        for (let i = digits.length - 1; i >= 0; i--) {
            sum += parseInt(digits[i], 10) * mul;
            mul = mul === 7 ? 2 : mul + 1;
        }
        const res = 11 - (sum % 11);
        if (res === 11) return '0';
        if (res === 10) return 'K';
        return String(res);
    }
    function isValidRUN(raw) {
        const clean = normalizeRun(raw);
        if (clean.length < 2) return false;
        const body = clean.slice(0, -1);
        const dv = clean.slice(-1);
        return computeDv(body) === dv;
    }
    function formatRUN(raw) {
        const clean = normalizeRun(raw);
        if (clean.length < 2) return clean;
        const body = clean.slice(0, -1);
        const dv = clean.slice(-1);
        let out = '';
        let cnt = 0;
        for (let i = body.length - 1; i >= 0; i--) {
            out = body[i] + out;
            cnt++;
            if (cnt === 3 && i !== 0) { out = '.' + out; cnt = 0; }
        }
        return `${out}-${dv}`;
    }
    function mergeUsuarios(seed, extras) {
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
        // Preferir overrides del localStorage primero
        (Array.isArray(extras) ? extras : []).forEach(e => {
            const { passwordHash, passwordSalt, ...safe } = e || {};
            pushUser(safe);
        });
        // Luego semilla estática, evitando duplicados
        (Array.isArray(seed) ? seed : []).forEach(pushUser);
        return out;
    }
    // Exponer lista fusionada
    try {
        const extras = getUsuariosExtra();
        window.usuarios = mergeUsuarios(window.usuarios || [], extras);
    } catch {}

    // =========================================================================
    // --- 6. POBLAR REGIÓN/COMUNA EN REGISTRO ---
    // =========================================================================
    (function setupRegionComuna() {
        const regionSelect = document.getElementById('region');
        const comunaSelect = document.getElementById('comuna');
        if (!regionSelect || !comunaSelect) return;

        const regiones = (window.regiones && typeof window.regiones === 'object') ? window.regiones : {};
        // Poblar regiones
        Object.keys(regiones).forEach(reg => {
            const opt = document.createElement('option');
            opt.value = reg;
            opt.textContent = reg;
            regionSelect.appendChild(opt);
        });

        regionSelect.addEventListener('change', () => {
            const sel = regionSelect.value;
            comunaSelect.innerHTML = '<option value="" selected disabled>Selecciona comuna</option>';
            const comunas = Array.isArray(regiones[sel]) ? regiones[sel] : [];
            comunas.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c;
                opt.textContent = c;
                comunaSelect.appendChild(opt);
            });
            comunaSelect.disabled = comunas.length === 0;
        });
    })();

    // =========================================================================
    // --- 7. RUN: Formateo visual y validación (registro) ---
    // =========================================================================
    (function setupRunFormatting() {
        const runInput = document.getElementById('run');
        if (!runInput) return;
        // Sanitiza en cada input: solo dígitos y K, toUpperCase, máx 9, preservando caret
        runInput.addEventListener('input', (e) => {
            const el = e.target;
            const original = String(el.value || '');
            const selStart = el.selectionStart ?? original.length;
            const beforeCaret = original.slice(0, selStart);
            // saneamos por separado lo previo al caret para calcular posición
            const sanitizedBefore = beforeCaret.replace(/[^0-9kK]/g, '').toUpperCase().slice(0, 9);
            // saneamos todo el valor y lo acotamos a 9
            const cleanedAll = original.replace(/[^0-9kK]/g, '').toUpperCase();
            const trimmedAll = cleanedAll.slice(0, 9);
            const newCaret = Math.min(sanitizedBefore.length, trimmedAll.length);
            if (el.value !== trimmedAll) {
                el.value = trimmedAll;
            }
            try { el.setSelectionRange(newCaret, newCaret); } catch {}
        });
        // Formateamos en blur para mostrar puntos y guion
        runInput.addEventListener('blur', () => {
            const clean = normalizeRun(runInput.value);
            if (!clean) return;
            runInput.value = formatRUN(clean);
        });
    })();

    // =========================================================================
    // --- 8. REGISTRO DE USUARIO (validación + hash) ---
    // =========================================================================
    async function sha256(bytes) {
        const buf = await crypto.subtle.digest('SHA-256', bytes);
        return new Uint8Array(buf);
    }
    function toBase64(bytes) {
        let binary = '';
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        return btoa(binary);
    }
    async function hashPassword(password) {
        const salt = new Uint8Array(16);
        crypto.getRandomValues(salt);
        const encoder = new TextEncoder();
        const pwBytes = encoder.encode(String(password || ''));
        const combined = new Uint8Array(salt.length + pwBytes.length);
        combined.set(salt, 0);
        combined.set(pwBytes, salt.length);
        const digest = await sha256(combined);
        return { salt: toBase64(salt), hash: toBase64(digest) };
    }

    function setInvalid(input, invalid, feedbackId, message) {
        if (!input) return;
        input.classList.toggle('is-invalid', invalid);
        input.classList.toggle('is-valid', !invalid && input.value);
        // Marcar también el input-group para que el borde rojo abarque todo el grupo (icono ojo, etc.)
        try {
            const ig = input.closest('.input-group');
            if (ig) ig.classList.toggle('is-invalid', invalid);
        } catch {}
        // Mostrar/ocultar pistas de límite solo cuando hay error
        try {
            const container = input.closest('.mb-3, .col-md-6, .col-md-4, .col-12') || input.parentNode;
            container.querySelectorAll('.limit-hint').forEach(h => h.classList.toggle('d-none', !invalid));
        } catch {}
        // Gestionar el texto y la visibilidad del feedback explícitamente (por si el markup no es hermano directo)
        if (feedbackId) {
            const fb = document.getElementById(feedbackId);
            if (fb) {
                if (message && invalid) fb.textContent = message;
                if (invalid) {
                    fb.classList.add('d-block');
                    fb.classList.remove('d-none');
                } else {
                    fb.classList.remove('d-block');
                    fb.classList.add('d-none');
                }
            }
        }
    }

    function calcAge(dateStr) {
        const dob = new Date(dateStr);
        if (isNaN(dob.getTime())) return 0;
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
        return age;
    }

    function getMergedUsuariosCurrent() {
        try { return mergeUsuarios(window.usuarios || [], getUsuariosExtra()); } catch { return window.usuarios || []; }
    }

    function showToastOrAlert(msg, iconClass = 'bi-check-circle-fill', colorClass = 'text-success') {
        try { if (typeof showNotification === 'function') return showNotification(msg, iconClass, colorClass); } catch {}
        alert(msg);
    }

    // Toggle de contraseña en registro
    setupPasswordToggle('password', 'toggleRegPassword');
    setupPasswordToggle('confirmPassword', 'toggleRegConfirm');

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        // Limitar rango de fecha (18–120 años) a nivel de input[type=date]
        (function setDateRangeLimits(){
            try {
                const fechaInput = document.getElementById('fechaNacimiento');
                if (!fechaInput) return;
                const today = new Date();
                const y = today.getFullYear();
                const m = String(today.getMonth()+1).padStart(2,'0');
                const d = String(today.getDate()).padStart(2,'0');
                const maxYear = y - 18;   // máximo permitido: 18 años
                const minYear = y - 120;  // mínimo permitido: 120 años
                fechaInput.setAttribute('max', `${maxYear}-${m}-${d}`);
                fechaInput.setAttribute('min', `${minYear}-${m}-${d}`);
            } catch {}
        })();
        // Pre-cargar código de referido desde la URL si viene (?ref=)
        (function preloadRefFromURL(){
            try {
                const url = new URL(window.location.href);
                const ref = url.searchParams.get('ref');
                if (ref) {
                    const refInput = document.getElementById('referido');
                    if (refInput && !refInput.value) refInput.value = ref;
                }
            } catch {}
        })();
        // Hint dinámico para correo @duoc.cl
        const emailInput = document.getElementById('email');
        const duocHint = document.getElementById('duoc-hint');
        if (emailInput && duocHint) {
            const toggleHint = () => {
                const email = String(emailInput.value||'').trim().toLowerCase();
                const domain = email.split('@')[1] || '';
                duocHint.classList.toggle('d-none', domain !== 'duoc.cl');
            };
            emailInput.addEventListener('input', toggleHint);
            emailInput.addEventListener('blur', toggleHint);
            toggleHint();
        }
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const runInput = document.getElementById('run');
            const emailInput = document.getElementById('email');
            const nombresInput = document.getElementById('nombres');
            const apellidosInput = document.getElementById('apellidos');
            const passwordInput = document.getElementById('password');
            const confirmInput = document.getElementById('confirmPassword');
            const fechaInput = document.getElementById('fechaNacimiento');
            const regionSelect = document.getElementById('region');
            const comunaSelect = document.getElementById('comuna');
            const direccionInput = document.getElementById('direccion');
            const terminosCheck = document.getElementById('terminos');

            [runInput, emailInput, nombresInput, apellidosInput, passwordInput, confirmInput, fechaInput, regionSelect, comunaSelect, direccionInput, terminosCheck]
                .forEach(i => i && i.classList.remove('is-invalid'));

            const runNorm = normalizeRun(runInput?.value);
            const email = String(emailInput?.value || '').trim().toLowerCase();
            const nombres = String(nombresInput?.value || '').trim();
            const apellidos = String(apellidosInput?.value || '').trim();
            const password = String(passwordInput?.value || '');
            const confirm = String(confirmInput?.value || '');
            const fecha = String(fechaInput?.value || '');
            const region = String(regionSelect?.value || '');
            const comuna = String(comunaSelect?.value || '');
            const direccion = String(direccionInput?.value || '').trim();
            const terminos = !!terminosCheck?.checked;
            const refInput = document.getElementById('referido');
            const refCode = String(refInput?.value || '').trim();

            let valid = true;
            // RUN: largo 7-9 (cuerpo+DV) y DV correcto (sin puntos ni guion)
            const lenBody = normalizeRun(runInput?.value).length;
            if (lenBody < 7 || lenBody > 9) { valid = false; setInvalid(runInput, true, 'e-run', 'El RUN debe tener entre 7 y 9 caracteres (incluye DV).'); }
            else if (!isValidRUN(runInput?.value)) { valid = false; setInvalid(runInput, true, 'e-run', 'El dígito verificador (DV) no es válido.'); }
            // Email: requerido, max 100, dominios permitidos
            const allowedDomains = ['duoc.cl','profesor.duoc.cl','gmail.com'];
            if (!email || email.length>100) { valid = false; setInvalid(emailInput, true, 'e-email', 'Correo requerido y máximo 100 caracteres.'); }
            else {
                const m = email.match(/^[^@\s]+@([^@\s]+)$/);
                const domain = m ? m[1].toLowerCase() : '';
                if (!allowedDomains.includes(domain)) { valid = false; setInvalid(emailInput, true, 'e-email', 'Dominio no permitido. Usa duoc.cl, profesor.duoc.cl o gmail.com.'); }
            }
            // Nombres y apellidos con límites
            if (!nombres || nombres.length>50) { valid = false; setInvalid(nombresInput, true, 'e-nombres', 'Nombre requerido (máx. 50).'); }
            if (!apellidos || apellidos.length>100) { valid = false; setInvalid(apellidosInput, true, 'e-apellidos', 'Apellidos requeridos (máx. 100).'); }
            // Password
            if (password.length < 8) { valid = false; setInvalid(passwordInput, true, 'e-password', 'La contraseña debe tener al menos 8 caracteres.'); }
            // Confirmación: mensaje claro según caso
            if (confirm.length === 0) { valid = false; setInvalid(confirmInput, true, 'e-confirm', 'Confirma tu contraseña.'); }
            else if (password !== confirm) { valid = false; setInvalid(confirmInput, true, 'e-confirm', 'Las contraseñas no coinciden.'); }
            // Fecha de nacimiento obligatoria: rango 18–120
            {
                const age = calcAge(fecha);
                if (!fecha || age < 18 || age > 120) { valid = false; setInvalid(fechaInput, true, 'e-fecha', 'Debes tener entre 18 y 120 años.'); }
            }
            // Dirección
            if (!region) { valid = false; setInvalid(regionSelect, true, 'e-region', 'Selecciona una región.'); }
            if (!comuna) { valid = false; setInvalid(comunaSelect, true, 'e-comuna', 'Selecciona una comuna.'); }
            if (!direccion || direccion.length>300) { valid = false; setInvalid(direccionInput, true, 'e-direccion', 'Dirección requerida (máx. 300).'); }
            // Términos y Condiciones obligatorios
            if (!terminos) { valid = false; setInvalid(terminosCheck, true, 'e-terminos', 'Debes aceptar los Términos y Condiciones.'); }

            const usuariosMerged = getMergedUsuariosCurrent();
            // Unicidad por correo y RUN
            if (usuariosMerged.some(u => String(u.correo || '').toLowerCase() === email)) {
                valid = false; setInvalid(emailInput, true, 'e-email', 'Este correo ya está registrado.');
            }
            if (usuariosMerged.some(u => normalizeRun(u.run) === runNorm)) {
                valid = false; setInvalid(runInput, true, 'e-run', 'Este RUN ya está registrado.');
            }
            if (!valid) {
                showToastOrAlert('Revisa los campos resaltados.', 'bi-exclamation-triangle-fill', 'text-warning');
                return;
            }

            // Formatear visualmente el RUN antes de continuar
            try { if (runInput) runInput.value = formatRUN(runNorm); } catch {}

            // Hash de contraseña
            let salted;
            try { salted = await hashPassword(password); }
            catch {
                showToastOrAlert('No se pudo proteger la contraseña en este navegador.', 'bi-x-octagon-fill', 'text-danger');
                return;
            }

            // Persistir en localStorage (sin sobreescribir el archivo estático)
            const nuevo = {
                run: runNorm,
                nombre: nombres,
                apellidos: apellidos,
                correo: email,
                perfil: 'Cliente', // rol automático
                fechaNacimiento: fecha,
                region,
                comuna,
                direccion,
                passwordHash: salted.hash,
                passwordSalt: salted.salt,
                descuentoVitalicio: email.endsWith('@duoc.cl') ? true : false
            };
            const extras = getUsuariosExtra();
            extras.push(nuevo);
            try { localStorage.setItem('usuariosExtra', JSON.stringify(extras)); } catch {}

            // LevelUpPoints: asegurar referralCode propio y aplicar beneficios si ingresó uno
            let myRefCode = '';
            try {
                if (window.LevelUpPoints && typeof window.LevelUpPoints.ensureReferralCode === 'function') {
                    myRefCode = window.LevelUpPoints.ensureReferralCode(runNorm) || '';
                }
            } catch {}
            if (refCode && window.LevelUpPoints && typeof window.LevelUpPoints.applyReferralOnRegistration === 'function') {
                try {
                    const resRef = window.LevelUpPoints.applyReferralOnRegistration({ newUserRun: runNorm, referralCodeUsado: refCode });
                    if (resRef && resRef.ok) {
                        showToastOrAlert('¡Registro exitoso! ¡Ganaste +100 EXP por usar un código!', 'bi-stars', 'text-info');
                        // Notificar al referente (opcional, local)
                    } else if (resRef && resRef.reason === 'code-not-found') {
                        showToastOrAlert('Código de referido no válido o expirado.', 'bi-info-circle', 'text-secondary');
                    } else if (resRef && resRef.reason === 'self-ref') {
                        showToastOrAlert('No puedes usar tu propio código de referido.', 'bi-exclamation-triangle-fill', 'text-warning');
                    }
                } catch {}
            }

            // Actualizar vista fusionada en memoria
            try { window.usuarios = mergeUsuarios(window.usuarios || [], [nuevo]); } catch {}

            showToastOrAlert('Cuenta creada con éxito. Ahora puedes iniciar sesión.', 'bi-check-circle-fill', 'text-success');
            // Señal para mostrar notificación en la página de login tras el redirect
            try { sessionStorage.setItem('registrationSuccess', JSON.stringify({ t: Date.now(), email, refCode: myRefCode })); } catch {}
            setTimeout(() => { window.location.href = 'login.html'; }, 800);
        });

        // --------------------------------------------------------------
        // 7b. Validación por campo (on-blur / on-change / on-input)
        // --------------------------------------------------------------
        const runEl = document.getElementById('run');
        const nombresEl = document.getElementById('nombres');
        const apellidosEl = document.getElementById('apellidos');
        const passwordEl = document.getElementById('password');
        const confirmEl = document.getElementById('confirmPassword');
        const fechaEl = document.getElementById('fechaNacimiento');
        const regionEl = document.getElementById('region');
        const comunaEl = document.getElementById('comuna');
        const direccionEl = document.getElementById('direccion');
        const terminosEl = document.getElementById('terminos');

        function setValidity(el, ok, feedbackId, msg){
            if (!el) return false;
            el.classList.toggle('is-invalid', !ok);
            el.classList.toggle('is-valid', !!ok);
            // Sincronizar estado del input-group contenedor si existe
            try {
                const ig = el.closest('.input-group');
                if (ig) ig.classList.toggle('is-invalid', !ok);
            } catch {}
            // Mostrar/ocultar hints de límite
            try {
                const container = el.closest('.mb-3, .col-md-6, .col-md-4, .col-12') || el.parentNode;
                container.querySelectorAll('.limit-hint').forEach(h => h.classList.toggle('d-none', !!ok));
            } catch {}
            // Control explícito del feedback
            if (feedbackId){
                const fb = document.getElementById(feedbackId);
                if (fb){
                    if (!ok && msg) fb.textContent = msg;
                    if (!ok) {
                        fb.classList.add('d-block');
                        fb.classList.remove('d-none');
                    } else {
                        fb.classList.remove('d-block');
                        fb.classList.add('d-none');
                    }
                }
            }
            return !!ok;
        }

        function validateRunField(){
            const v = String(runEl?.value || '');
            const len = normalizeRun(v).length;
            if (len < 7 || len > 9) return setValidity(runEl, false, 'e-run', 'El RUN debe tener entre 7 y 9 caracteres (incluye DV).');
            if (!isValidRUN(v)) return setValidity(runEl, false, 'e-run', 'El dígito verificador (DV) no es válido.');
            // unicidad si ya existe lista
            try {
                const merged = getMergedUsuariosCurrent();
                const runNorm = normalizeRun(v);
                const exists = merged.some(u => normalizeRun(u.run) === runNorm);
                if (exists) return setValidity(runEl, false, 'e-run', 'Este RUN ya está registrado.');
            } catch {}
            return setValidity(runEl, true);
        }
        function validateEmailField(){
            const email = String(emailInput?.value || '').trim().toLowerCase();
            if (!email || email.length>100) return setValidity(emailInput, false, 'e-email', 'Correo requerido y máximo 100 caracteres.');
            const m = email.match(/^[^@\s]+@([^@\s]+)$/);
            const domain = m ? m[1].toLowerCase() : '';
            const allowed = ['duoc.cl','profesor.duoc.cl','gmail.com'];
            if (!allowed.includes(domain)) return setValidity(emailInput, false, 'e-email', 'Dominio no permitido. Usa duoc.cl, profesor.duoc.cl o gmail.com.');
            // unicidad por correo
            try {
                const merged = getMergedUsuariosCurrent();
                const exists = merged.some(u => String(u.correo||'').toLowerCase() === email);
                if (exists) return setValidity(emailInput, false, 'e-email', 'Este correo ya está registrado.');
            } catch {}
            return setValidity(emailInput, true);
        }
        function validateNombreField(){
            const v = String(nombresEl?.value || '').trim();
            if (!v || v.length>50) return setValidity(nombresEl, false, 'e-nombres', 'Nombre requerido (máx. 50).');
            return setValidity(nombresEl, true);
        }
        function validateApellidosField(){
            const v = String(apellidosEl?.value || '').trim();
            if (!v || v.length>100) return setValidity(apellidosEl, false, 'e-apellidos', 'Apellidos requeridos (máx. 100).');
            return setValidity(apellidosEl, true);
        }
        function validatePasswordField(){
            const v = String(passwordEl?.value || '');
            if (v.length < 8) return setValidity(passwordEl, false, 'e-password', 'La contraseña debe tener al menos 8 caracteres.');
            return setValidity(passwordEl, true, 'e-password');
        }
        function validateConfirmField(opts={}){
            const from = opts.from || 'confirm'; // 'confirm' | 'password' | 'blur' | 'submit'
            const p = String(passwordEl?.value || '');
            const c = String(confirmEl?.value || '');
            // Si está vacío, no mostrar error mientras escribe la contraseña o en foco inicial
            if (c.length === 0) {
                if (from === 'submit') return setValidity(confirmEl, false, 'e-confirm', 'Confirma tu contraseña.');
                // Limpiar errores visuales si viene desde password typing o confirm typing sin contenido
                setValidity(confirmEl, true, 'e-confirm');
                return true;
            }
            if (p !== c) return setValidity(confirmEl, false, 'e-confirm', 'Las contraseñas no coinciden.');
            return setValidity(confirmEl, true, 'e-confirm');
        }
        function validateFechaField(){
            const v = String(fechaEl?.value || '');
            const age = calcAge(v);
            if (!v || age < 18 || age > 120) return setValidity(fechaEl, false, 'e-fecha', 'Debes tener entre 18 y 120 años.');
            return setValidity(fechaEl, true, 'e-fecha');
        }
        function validateRegionField(){
            const v = String(regionEl?.value || '');
            if (!v) return setValidity(regionEl, false, 'e-region', 'Selecciona una región.');
            return setValidity(regionEl, true);
        }
        function validateComunaField(){
            const v = String(comunaEl?.value || '');
            if (!v) return setValidity(comunaEl, false, 'e-comuna', 'Selecciona una comuna.');
            return setValidity(comunaEl, true);
        }
        function validateDireccionField(){
            const v = String(direccionEl?.value || '').trim();
            if (!v || v.length>300) return setValidity(direccionEl, false, 'e-direccion', 'Dirección requerida (máx. 300).');
            return setValidity(direccionEl, true);
        }
        function validateTerminosField(){
            const ok = !!terminosEl?.checked;
            return setValidity(terminosEl, ok, 'e-terminos', 'Debes aceptar los Términos y Condiciones.');
        }

        runEl?.addEventListener('blur', validateRunField);
        emailInput?.addEventListener('blur', validateEmailField);
        nombresEl?.addEventListener('blur', validateNombreField);
        apellidosEl?.addEventListener('blur', validateApellidosField);
        passwordEl?.addEventListener('input', () => {
            validatePasswordField();
            // Solo revalidar confirmación si el usuario ya escribió algo en confirm
            if (confirmEl && confirmEl.value && confirmEl.value.length > 0) validateConfirmField({ from: 'password' });
        });
        confirmEl?.addEventListener('input', () => validateConfirmField({ from: 'confirm' }));
        confirmEl?.addEventListener('blur', () => validateConfirmField({ from: 'blur' }));
        fechaEl?.addEventListener('change', validateFechaField);
        regionEl?.addEventListener('change', () => { validateRegionField(); validateComunaField(); });
        comunaEl?.addEventListener('change', validateComunaField);
        direccionEl?.addEventListener('blur', validateDireccionField);
        terminosEl?.addEventListener('change', validateTerminosField);
    }

    // =========================================================================
    // --- 8. LOGIN ADMIN (VALIDACIÓN CON usuarios.js + REDIRECCIÓN) ---
    // =========================================================================
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('adminUser');
            const pass = document.getElementById('adminPass');

            const correo = (user?.value || '').trim().toLowerCase();
            const password = (pass?.value || '').trim();

            // Validación base
            const userOk = correo !== '';
            const passOk = password !== '';
            if (user) user.classList.toggle('is-invalid', !userOk);
            if (pass) pass.classList.toggle('is-invalid', !passOk);
            if (!userOk || !passOk) {
                try { if (typeof showNotification === 'function') showNotification('Completa usuario y contraseña.', 'bi-exclamation-triangle-fill', 'text-warning'); } catch {}
                return;
            }

            // Verificar que el correo corresponda a un usuario Administrador en window.usuarios (fusionado)
            const lista = Array.isArray(window.usuarios) ? window.usuarios : [];
            const admin = lista.find(u => String(u.correo || '').toLowerCase() === correo && String(u.perfil || '') === 'Administrador');

            if (!admin) {
                // Usuario no es admin o no existe
                try { if (typeof showNotification === 'function') showNotification('Usuario no autorizado. Debe ser Administrador.', 'bi-x-octagon-fill', 'text-danger'); } catch {}
                if (user) user.classList.add('is-invalid');
                return;
            }

            // Credenciales válidas para demo (no hay verificación real de password)
            // Sesión unificada + back-compat
            try { if (window.Session && typeof window.Session.set === 'function') { window.Session.set({ correo: admin.correo || 'admin@local', nombre: admin.nombre || 'Administrador', perfil: 'Administrador', remember: true }); } } catch {}
            try { localStorage.setItem('isAdmin', '1'); } catch {}
            window.location.href = '../admin/index.html';
        });
    }

    // =========================================================================
    // --- 9. BUSCADOR GLOBAL DEL NAVBAR ---
    // =========================================================================
    (function setupGlobalNavbarSearch(){
        const forms = document.querySelectorAll('form[role="search"]');
        if (!forms || forms.length === 0) return;

        const norm = (s) => String(s || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();

        const getUniqueCategories = (list) => {
            const seen = new Set();
            const out = [];
            (Array.isArray(list) ? list : []).forEach(p => {
                const c = p && p.categoria ? String(p.categoria).trim() : '';
                if (c && !seen.has(c)) { seen.add(c); out.push(c); }
            });
            return out;
        };

    const productos = Array.isArray(window.productos) ? window.productos : [];
    const categorias = getUniqueCategories(productos);

        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                // Bloquear cualquier comportamiento por defecto y otros handlers
                try { e.preventDefault(); } catch {}
                try { e.stopPropagation(); } catch {}
                try { e.stopImmediatePropagation(); } catch {}

                try {
                    const input = form.querySelector('input[type="search"]');
                    const raw = input ? input.value : '';
                    const q = String(raw || '').trim();
                    if (!q) return; // no buscar vacío
                    // Unificar experiencia: siempre ir a la página de resultados
                    window.location.href = `busqueda.html?q=${encodeURIComponent(q)}`;
                } catch {
                    // Cualquier error: llevar a la página de búsqueda con el término ingresado
                    try {
                        const input = form.querySelector('input[type="search"]');
                        const raw = input ? input.value : '';
                        const q = String(raw || '').trim();
                        if (q) window.location.href = `busqueda.html?q=${encodeURIComponent(q)}`;
                    } catch {}
                }
            }, true); // captura primero y evita conflictos
        });
    })();
});