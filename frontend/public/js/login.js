// Modal registrar usuario
const btnRegistrar = document.getElementById('btnRegistrar');
const modalRegistrar = document.getElementById('modalRegistrar');
const closeRegistrar = document.getElementById('closeRegistrar');
btnRegistrar.addEventListener('click', () => { modalRegistrar.style.display = 'block'; });
closeRegistrar.addEventListener('click', () => { modalRegistrar.style.display = 'none'; });
window.addEventListener('click', (e) => { if (e.target === modalRegistrar) modalRegistrar.style.display = 'none'; });

document.getElementById('registrarForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const usuario = document.getElementById('regUsuario').value;
    const contrasena = document.getElementById('regContrasena').value;
    const nombre = document.getElementById('regNombre').value;
    const apellido = document.getElementById('regApellido').value;
    const cedula = document.getElementById('regCedula').value;
    const privilegios = document.getElementById('regPrivilegios').value || 'N';
    const errorDiv = document.getElementById('registrarError');
    errorDiv.textContent = '';
    errorDiv.style.display = 'none';
    try {
        const res = await fetch('/api/bibliotecarios/registrar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, contrasena, nombre, apellido, cedula, privilegios })
        });
        const data = await res.json();
        if (res.ok) {
            modalRegistrar.style.display = 'none';
            mostrarAlerta('Usuario registrado correctamente', 'success');
        } else {
            errorDiv.textContent = data.message || 'Error al registrar usuario';
            errorDiv.style.display = 'block';
        }
// Mensaje flotante reutilizable
function mostrarAlerta(mensaje, tipo = 'success') {
    let alert = document.getElementById('alert-exito');
    if (!alert) {
        alert = document.createElement('div');
        alert.id = 'alert-exito';
        alert.className = 'alert position-fixed top-0 start-50 translate-middle-x mt-3 shadow';
        alert.style.zIndex = 2000;
        document.body.appendChild(alert);
    }
    alert.className = `alert alert-${tipo === 'danger' ? 'danger' : 'primary'} position-fixed top-0 start-50 translate-middle-x mt-3 shadow`;
    alert.textContent = mensaje;
    alert.style.display = 'block';
    setTimeout(() => { alert.style.display = 'none'; }, 2500);
}
    } catch (err) {
        errorDiv.textContent = 'Error de red o servidor';
        errorDiv.style.display = 'block';
    }
});
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
