document.addEventListener('DOMContentLoaded', () => {

    // =========================================================================
    // --- 1. SISTEMA CENTRAL DE NOTIFICACIONES (TOAST) ---
    // =========================================================================
    const toastElement = document.getElementById('notificationToast');
    const toastBody = document.getElementById('toast-body');
    const toastIcon = document.getElementById('toast-icon');
    const notificationToast = toastElement ? new bootstrap.Toast(toastElement) : null;

    // Función REUTILIZABLE para mostrar todas las notificaciones del sitio
    function showNotification(message, iconClass, colorClass) {
        if (!notificationToast) {
            console.error("El elemento del Toast no se encontró en la página.");
            return; 
        }
        toastBody.textContent = message;
        toastIcon.className = `bi ${iconClass} ${colorClass} me-2`; // Reemplaza clases anteriores
        notificationToast.show();
    }

    // =========================================================================
    // --- 2. LÓGICA PARA AÑADIR PRODUCTOS AL CARRITO ---
    // =========================================================================
    const addToCartButtons = document.querySelectorAll('.btn-add-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            showNotification('¡Producto añadido al carrito exitosamente!', 'bi-check-circle-fill', 'text-success');
        });
    });

    // =========================================================================
    // --- 3. LÓGICA PARA LA PÁGINA DE PERFIL ---
    // =========================================================================

    // --- Lógica para editar Información Personal ---
    const saveProfileButton = document.getElementById('saveProfileButton');
    if (saveProfileButton) {
        saveProfileButton.addEventListener('click', () => {
            const firstName = document.getElementById('profileFirstName');
            const lastName = document.getElementById('profileLastName');
            let isValid = true;
            [firstName, lastName].forEach(input => input.classList.remove('is-invalid', 'is-valid'));
            if (firstName.value.trim() === '') {
                firstName.classList.add('is-invalid');
                isValid = false;
            } else {
                firstName.classList.add('is-valid');
            }
            if (lastName.value.trim() === '') {
                lastName.classList.add('is-invalid');
                isValid = false;
            } else {
                lastName.classList.add('is-valid');
            }
            if (isValid) {
                const modal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
                if (modal) modal.hide();
                showNotification('Perfil actualizado con éxito.', 'bi-check-circle-fill', 'text-success');
                [firstName, lastName].forEach(input => input.classList.remove('is-valid'));
            }
        });
    }

    // --- Lógica para Direcciones (Añadir, Editar, Eliminar) ---
    function validateAddressForm(formId) {
        const inputs = document.querySelectorAll(`#${formId} input`);
        let isValid = true;
        inputs.forEach(input => {
            input.classList.remove('is-invalid', 'is-valid');
            if (input.value.trim() === '') {
                input.classList.add('is-invalid');
                isValid = false;
            } else {
                input.classList.add('is-valid');
            }
        });
        return isValid;
    }

    const saveAddressButton = document.getElementById('saveAddressButton');
    if (saveAddressButton) {
        saveAddressButton.addEventListener('click', () => {
            if (validateAddressForm('addAddressForm')) {
                const modal = bootstrap.Modal.getInstance(document.getElementById('addAddressModal'));
                if (modal) modal.hide();
                showNotification('Nueva dirección guardada.', 'bi-check-circle-fill', 'text-success');
                document.getElementById('addAddressForm').reset();
                document.querySelectorAll('#addAddressForm input').forEach(input => input.classList.remove('is-valid'));
            }
        });
    }

    const updateAddressButton = document.getElementById('updateAddressButton');
    if (updateAddressButton) {
        updateAddressButton.addEventListener('click', () => {
            if (validateAddressForm('editAddressForm')) {
                const modal = bootstrap.Modal.getInstance(document.getElementById('editAddressModal'));
                if (modal) modal.hide();
                showNotification('Dirección actualizada correctamente.', 'bi-check-circle-fill', 'text-success');
            }
        });
    }

    const confirmDeleteAddressButton = document.getElementById('confirmDeleteAddressButton');
    if (confirmDeleteAddressButton) {
        confirmDeleteAddressButton.addEventListener('click', () => {
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteAddressModal'));
            if (modal) modal.hide();
            showNotification('Dirección eliminada correctamente.', 'bi-trash-fill', 'text-danger');
        });
    }

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
        (Array.isArray(seed) ? seed : []).forEach(pushUser);
        // No exponer hashes en window.usuarios
        (Array.isArray(extras) ? extras : []).forEach(e => {
            const { passwordHash, passwordSalt, ...safe } = e || {};
            pushUser(safe);
        });
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
        // Sanitiza caracteres al teclear (solo dígitos y K/k)
        runInput.addEventListener('input', () => {
            const before = runInput.value;
            const clean = normalizeRun(before);
            // No formateamos aquí para no mover el cursor; solo limpiamos K mayúscula si aplica
            // Permitimos que el usuario vea lo que escribe; formateamos al salir del campo.
            // Reinsertamos posibles guiones/puntos solo al blur.
            // Si el usuario pegó texto con símbolos, mostramos versión limpia sin símbolos.
            // Para minimizar saltos de cursor, solo reemplazamos si cambió sustancialmente.
            const justChars = before.replace(/[^0-9kK]/g, '').toUpperCase();
            if (justChars !== clean) {
                runInput.value = clean;
            }
        });
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
        if (!invalid) return;
        if (feedbackId && message) {
            const el = document.getElementById(feedbackId);
            if (el) el.textContent = message;
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

            [runInput, emailInput, nombresInput, apellidosInput, passwordInput, confirmInput, fechaInput, regionSelect, comunaSelect, direccionInput]
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

            let valid = true;
            // RUN: largo 7-9 (cuerpo+DV) y DV correcto
            const lenBody = normalizeRun(runInput?.value).length;
            if (lenBody < 7 || lenBody > 9) { valid = false; setInvalid(runInput, true, 'e-run', 'El RUN debe tener entre 7 y 9 caracteres.'); }
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
            if (password !== confirm) { valid = false; setInvalid(confirmInput, true, 'e-confirm', 'Las contraseñas no coinciden.'); }
            // Fecha de nacimiento obligatoria y 18+
            if (!fecha || calcAge(fecha) < 18) { valid = false; setInvalid(fechaInput, true, 'e-fecha', 'Debes tener 18 años o más.'); }
            // Dirección
            if (!region) { valid = false; setInvalid(regionSelect, true, 'e-region', 'Selecciona una región.'); }
            if (!comuna) { valid = false; setInvalid(comunaSelect, true, 'e-comuna', 'Selecciona una comuna.'); }
            if (!direccion || direccion.length>300) { valid = false; setInvalid(direccionInput, true, 'e-direccion', 'Dirección requerida (máx. 300).'); }

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

            // Actualizar vista fusionada en memoria
            try { window.usuarios = mergeUsuarios(window.usuarios || [], [nuevo]); } catch {}

            showToastOrAlert('Cuenta creada con éxito. Ahora puedes iniciar sesión.', 'bi-check-circle-fill', 'text-success');
            setTimeout(() => { window.location.href = 'login.html'; }, 800);
        });
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
            try { localStorage.setItem('isAdmin', '1'); } catch {}
            window.location.href = '../admin/index.html';
        });
    }
});