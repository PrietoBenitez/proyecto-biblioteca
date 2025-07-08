// donantes.js - CRUD Donantes con UI y alertas flotantes

document.addEventListener('DOMContentLoaded', function() {
    const tablaDonantes = document.getElementById('tablaDonantes');
    const formDonante = document.getElementById('formDonante');
    const modalDonante = new bootstrap.Modal(document.getElementById('modalDonante'));
    const btnNuevoDonante = document.getElementById('btnNuevoDonante');
    const alertasDonantes = document.getElementById('alertasDonantes');
    let donanteIdEdit = null;

    cargarDonantes();

    // Mostrar modal para nuevo donante
    btnNuevoDonante.addEventListener('click', () => {
        limpiarFormulario();
        donanteIdEdit = null;
        document.getElementById('modalDonanteLabel').textContent = 'Nuevo Donante';
        modalDonante.show();
    });

    // Guardar donante (crear o editar)
    formDonante.addEventListener('submit', async function(e) {
        e.preventDefault();
        const donante = obtenerDatosFormulario();
        if (!donante.NOMBRE || !donante.APELLIDO) {
            mostrarAlerta('Nombre y Apellido son obligatorios', 'danger');
            return;
        }
        try {
            let resp;
            if (donanteIdEdit) {
                resp = await fetch(`/api/donantes/${donanteIdEdit}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(donante)
                });
            } else {
                resp = await fetch('/api/donantes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(donante)
                });
            }
            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error || data.message || 'Error desconocido');
            mostrarAlerta(data.message || 'Donante guardado exitosamente', 'success');
            modalDonante.hide();
            cargarDonantes();
        } catch (err) {
            mostrarAlerta(err.message, 'danger');
        }
    });

    // Editar donante
    tablaDonantes.addEventListener('click', async function(e) {
        if (e.target.closest('.editar')) {
            const id = e.target.closest('.editar').dataset.id;
            try {
                const resp = await fetch(`/api/donantes/${id}`);
                const donante = await resp.json();
                if (!resp.ok) throw new Error(donante.error || donante.message || 'No encontrado');
                llenarFormulario(donante);
                donanteIdEdit = id;
                document.getElementById('modalDonanteLabel').textContent = 'Editar Donante';
                modalDonante.show();
            } catch (err) {
                mostrarAlerta(err.message, 'danger');
            }
        }
        // Eliminar donante
        if (e.target.closest('.eliminar')) {
            const id = e.target.closest('.eliminar').dataset.id;
            if (confirm('¿Seguro que desea eliminar este donante?')) {
                try {
                    const resp = await fetch(`/api/donantes/${id}`, { method: 'DELETE' });
                    const data = await resp.json();
                    if (!resp.ok) throw new Error(data.error || data.message || 'Error al eliminar');
                    mostrarAlerta(data.message || 'Donante eliminado', 'success');
                    cargarDonantes();
                } catch (err) {
                    mostrarAlerta(err.message, 'danger');
                }
            }
        }
    });

    // Cargar donantes en tabla
    async function cargarDonantes() {
        try {
            const resp = await fetch('/api/donantes');
            const donantes = await resp.json();
            tablaDonantes.querySelector('tbody').innerHTML = '';
            donantes.forEach(donante => {
                const fila = document.createElement('tr');
                fila.innerHTML = `
                    <td>${donante.NOMBRE}</td>
                    <td>${donante.APELLIDO}</td>
                    <td>${donante.CORREO || '-'}</td>
                    <td>${donante.TELEFONO || '-'}</td>
                    <td>${donante.DIRECCION || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary editar" data-id="${donante.DONANTE_ID}"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-outline-danger eliminar" data-id="${donante.DONANTE_ID}"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                tablaDonantes.querySelector('tbody').appendChild(fila);
            });
        } catch (err) {
            mostrarAlerta('Error al cargar donantes', 'danger');
        }
    }

    function obtenerDatosFormulario() {
        return {
            NOMBRE: document.getElementById('nombre').value.trim(),
            APELLIDO: document.getElementById('apellido').value.trim(),
            CORREO: document.getElementById('correo').value.trim(),
            TELEFONO: document.getElementById('telefono').value.trim(),
            DIRECCION: document.getElementById('direccion').value.trim()
        };
    }

    function llenarFormulario(donante) {
        document.getElementById('donanteId').value = donante.DONANTE_ID || '';
        document.getElementById('nombre').value = donante.NOMBRE || '';
        document.getElementById('apellido').value = donante.APELLIDO || '';
        document.getElementById('correo').value = donante.CORREO || '';
        document.getElementById('telefono').value = donante.TELEFONO || '';
        document.getElementById('direccion').value = donante.DIRECCION || '';
    }

    function limpiarFormulario() {
        formDonante.reset();
        document.getElementById('donanteId').value = '';
    }

    // Alertas flotantes
    function mostrarAlerta(mensaje, tipo = 'info', tiempo = 3500) {
        const alerta = document.createElement('div');
        alerta.className = `alerta-flotante alert alert-${tipo}`;
        alerta.innerHTML = `<i class="fas fa-info-circle"></i> ${mensaje}`;
        alertasDonantes.appendChild(alerta);
        setTimeout(() => {
            alerta.remove();
        }, tiempo);
    }
});