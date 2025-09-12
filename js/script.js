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
});