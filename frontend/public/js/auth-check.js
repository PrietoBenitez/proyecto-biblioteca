// =============================
// 🔐 auth-check.js - Frontend
// =============================
// Este script valida la existencia y vigencia del token JWT.
// Si no hay token o está expirado, redirige al login (/).
// También muestra el nombre de usuario en el navbar (si existe).
// Archivo: frontend/public/js/auth-check.js
// Autor: Sistema GestLib
// =============================




// frontend/public/js/auth-check.js
// Redirige al login si no hay token o si el token está expirado
(function() {
    const token = localStorage.getItem('token');

    // Si no hay token, redirige al login

    if (!token) {
        window.location.href = '/';
        return;
    }
    // Validar expiración del token JWT
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // Solo redirigir si el token expiró
        //Verificar expiración
        if (payload.exp && Date.now() / 1000 > payload.exp) {
            // Mostrar mensaje solo si la expiración es real
            alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
            localStorage.removeItem('token');
            window.location.href = '/';
        }
        // Mostrar usuario en navbar si existe
        if (payload.usuario) {
            const userSpan = document.getElementById('navbar-usuario');
            if (userSpan) {
                userSpan.textContent = payload.usuario;
            }
        }
    } catch (e) {
        // Si el token está corrupto, solo redirigir
        localStorage.removeItem('token');
        window.location.href = '/';
    }
})();
