// frontend/public/js/auth-check.js
// Redirige al login si no hay token o si el token está expirado
(function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return;
    }
    // Validar expiración del token JWT
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // Solo redirigir si el token expiró
        if (payload.exp && Date.now() / 1000 > payload.exp) {
            // Mostrar mensaje solo si la expiración es real
            alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
            localStorage.removeItem('token');
            window.location.href = '/';
        }
    } catch (e) {
        // Si el token está corrupto, solo redirigir
        localStorage.removeItem('token');
        window.location.href = '/';
    }
})();
