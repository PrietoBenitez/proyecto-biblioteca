// frontend/public/js/login.js
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const usuario = document.getElementById('usuario').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    errorDiv.textContent = '';
    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, password })
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('token', data.token);
            window.location.href = '/index';
        } else {
            errorDiv.textContent = data.message || 'Error de autenticación';
        }
    } catch (err) {
        errorDiv.textContent = 'Error de red o servidor';
    }
});
