// frontend/public/js/login-redirect.js
// Si ya hay sesión activa, redirige al dashboard automáticamente
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (!payload.exp || Date.now() / 1000 < payload.exp) {
                window.location.href = '/index';
            }
        } catch (e) {
            // Token corrupto, no redirigir
        }
    }
});
