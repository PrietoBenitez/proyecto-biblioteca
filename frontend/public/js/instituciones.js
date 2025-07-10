// frontend/public/js/instituciones.js
// CRUD de instituciones adaptado para NO mostrar ni pedir el ID

document.addEventListener('DOMContentLoaded', function() {
    const tabla = document.getElementById('tablaInstituciones');
    const form = document.getElementById('formInstitucion');
    const modal = new bootstrap.Modal(document.getElementById('modalInstitucion'));
    const alertas = document.getElementById('alertasInstituciones');
    const inputFiltro = document.getElementById('inputFiltroTexto');
    const btnNueva = document.getElementById('btnNuevaInstitucion');
    let institucionIdEdit = null;
    let filtroActual = { texto: '' };
    let paginaActual = 1;
    const institucionesPorPagina = 10;

    cargarInstituciones();

    inputFiltro.addEventListener('input', function(e) {
        filtroActual.texto = e.target.value;
        cargarInstituciones(1);
    });

    btnNueva.addEventListener('click', () => {
        limpiarFormulario();
        institucionIdEdit = null;
        document.getElementById('modalInstitucionLabel').textContent = 'Nueva Institución';
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const nombre = document.getElementById('nombreInstitucion').value.trim();
        if (!nombre) {
            mostrarAlerta('El nombre es obligatorio', 'danger');
            return;
        }
        try {
            if (institucionIdEdit) {
                await fetch(`/api/instituciones/${institucionIdEdit}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ INSTITUCION: nombre })
                });
                mostrarAlerta('Institución actualizada correctamente');
            } else {
                await fetch('/api/instituciones', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ INSTITUCION: nombre })
                });
                mostrarAlerta('Institución agregada correctamente');
            }
            modal.hide();
            cargarInstituciones();
        } catch (err) {
            mostrarAlerta('Error al guardar la institución', 'danger');
        }
    });

    tabla.querySelector('tbody').addEventListener('click', function(e) {
        if (e.target.classList.contains('editar')) {
            const fila = e.target.closest('tr');
            institucionIdEdit = fila.dataset.id;
            document.getElementById('nombreInstitucion').value = fila.querySelector('.nombre').textContent;
            document.getElementById('modalInstitucionLabel').textContent = 'Editar Institución';
            modal.show();
        } else if (e.target.classList.contains('eliminar')) {
            const fila = e.target.closest('tr');
            const id = fila.dataset.id;
            if (confirm('¿Seguro que deseas eliminar esta institución?')) {
                eliminarInstitucion(id);
            }
        }
    });

    async function cargarInstituciones(page = 1) {
        try {
            const params = new URLSearchParams();
            if (filtroActual.texto) params.append('texto', filtroActual.texto);
            params.append('page', page);
            params.append('limit', institucionesPorPagina);
            const url = `/api/instituciones?${params.toString()}`;
            const res = await fetch(url);
            const data = await res.json();
            renderizarTabla(Array.isArray(data) ? data : (data.instituciones || []));
        } catch {
            renderizarTabla([]);
            mostrarAlerta('Error al cargar instituciones', 'danger');
        }
    }

    function renderizarTabla(instituciones) {
        const tbody = tabla.querySelector('tbody');
        tbody.innerHTML = '';
        if (!instituciones.length) {
            const fila = document.createElement('tr');
            fila.innerHTML = `<td colspan="2" class="text-center text-muted">No se encontraron instituciones que coincidan con los filtros seleccionados.</td>`;
            tbody.appendChild(fila);
            return;
        }
        instituciones.forEach(inst => {
            const fila = document.createElement('tr');
            fila.dataset.id = inst.INSTITUCION_ID;
            fila.innerHTML = `
                <td class="nombre text-nowrap align-middle">${inst.INSTITUCION}</td>
                <td class="text-center align-middle">
                    <button class="btn btn-outline-primary btn-sm editar" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-outline-danger btn-sm eliminar" title="Eliminar"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(fila);
        });
    }

    async function eliminarInstitucion(id) {
        try {
            await fetch(`/api/instituciones/${id}`, { method: 'DELETE' });
            mostrarAlerta('Institución eliminada correctamente');
            cargarInstituciones();
        } catch {
            mostrarAlerta('Error al eliminar la institución', 'danger');
        }
    }

    function limpiarFormulario() {
        form.reset();
        institucionIdEdit = null;
    }

    function mostrarAlerta(msg, tipo = 'success') {
        alertas.innerHTML = `<div class="alert alert-${tipo} alert-dismissible fade show alerta-flotante" role="alert">
            ${msg}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`;
    }
});
