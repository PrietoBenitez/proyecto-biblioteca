// donantes.js - CRUD Donantes con UI y alertas flotantes

document.addEventListener('DOMContentLoaded', function() {
    const tablaDonantes = document.getElementById('tablaDonantes');
    const formDonante = document.getElementById('formDonante');
    const modalDonante = new bootstrap.Modal(document.getElementById('modalDonante'));
    const alertasDonantes = document.getElementById('alertasDonantes');
    let donanteIdEdit = null;
    // Filtro y paginación igual que socios
    let filtroActual = { texto: '' };
    let paginaActual = 1;
    const donantesPorPagina = 10;
    cargarDonantes();
    // Filtro de texto
    document.getElementById('inputFiltroTexto').addEventListener('input', function(e) {
        filtroActual.texto = e.target.value;
        cargarDonantes(1);
    });
    // Mostrar modal para nuevo donante
    document.getElementById('btnNuevoDonante').addEventListener('click', () => {
        limpiarFormulario();
        donanteIdEdit = null;
        document.getElementById('modalDonanteLabel').textContent = 'Nuevo Donante';
        modalDonante.show();
    });
    // Guardar donante (crear o editar)
    formDonante.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(formDonante);
        const donante = Object.fromEntries(formData.entries());
        try {
            const response = await fetch(donanteIdEdit ? `/api/donantes/${donanteIdEdit}` : '/api/donantes', {
                method: donanteIdEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(donante)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || data.message || 'Error desconocido');
            mostrarAlerta(data.message || 'Donante guardado exitosamente', 'success');
            modalDonante.hide();
            cargarDonantes();
        } catch (err) {
            mostrarAlerta(err.message, 'danger');
        }
    });
    // Editar o eliminar donante
    tablaDonantes.addEventListener('click', async function(e) {
        if (e.target.closest('.editar')) {
            const id = e.target.closest('.editar').dataset.id;
            try {
                const response = await fetch(`/api/donantes/${id}`);
                const donante = await response.json();
                if (!response.ok) throw new Error(donante.error || donante.message || 'No encontrado');
                llenarFormulario(donante);
                donanteIdEdit = id;
                document.getElementById('modalDonanteLabel').textContent = 'Editar Donante';
                modalDonante.show();
            } catch (err) {
                mostrarAlerta(err.message, 'danger');
            }
        }
        if (e.target.closest('.eliminar')) {
            const id = e.target.closest('.eliminar').dataset.id;
            const fila = e.target.closest('tr');
            
            // Obtener información del donante desde la fila de la tabla
            const celdas = fila.querySelectorAll('td');
            const cedula = celdas[0]?.textContent?.trim() || 'Sin cédula';
            const nombre = celdas[1]?.textContent?.trim() || 'Sin nombre';
            const apellido = celdas[2]?.textContent?.trim() || 'Sin apellido';
            
            let titulo = '¿Eliminar donante?';
            let mensaje = `<strong>${nombre} ${apellido}</strong><br><small class="text-muted">Cédula: ${cedula}</small>`;
            
            const result = await Swal.fire({
                title: titulo,
                html: mensaje,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc3545',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Eliminar',
                cancelButtonText: 'Cancelar',
                reverseButtons: true,
                focusCancel: true,
                width: '350px',
                padding: '1rem',
                customClass: {
                    popup: 'swal2-small',
                    title: 'swal2-title-small',
                    content: 'swal2-content-small'
                }
            });
            
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`/api/donantes/${id}`, { method: 'DELETE' });
                    const data = await response.json();
                    if (!response.ok) throw data; // Lanzar el objeto completo para conservar odbcErrors
                    
                    Swal.fire({
                        title: '¡Eliminado!',
                        text: `Donante eliminado: ${nombre} ${apellido}`,
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false,
                        width: '300px',
                        padding: '1rem'
                    });
                    
                    cargarDonantes();
                } catch (err) {
                    const msg = String(err.message || '');
                    // Revisar si hay errores ODBC y si el código es 23000 (violación de integridad referencial)
                    if (
                        (err.odbcErrors && Array.isArray(err.odbcErrors) && err.odbcErrors.some(e => e.state === '23000')) ||
                        msg.includes("Primary key for row in table 'DONANTES' is referenced by foreign key") ||
                        msg.includes('referenced by foreign key') ||
                        (msg.includes('Error executing the sql statement') && msg.includes('23000'))
                    ) {
                        Swal.fire({
                            title: 'Error',
                            text: 'No se pudo eliminar el donante porque tiene materiales asociados.',
                            icon: 'error',
                            width: '300px',
                            padding: '1rem'
                        });
                    } else {
                        Swal.fire({
                            title: 'Error',
                            text: msg,
                            icon: 'error',
                            width: '300px',
                            padding: '1rem'
                        });
                    }
                }
            }
        }
    });
    // Cargar donantes en tabla y paginación
    async function cargarDonantes(page = 1) {
        try {
            const params = new URLSearchParams();
            if (filtroActual.texto) params.append('texto', filtroActual.texto);
            params.append('page', page);
            params.append('limit', donantesPorPagina);
            const url = `/api/donantes/filtrados?${params.toString()}`;
            const response = await fetch(url);
            const data = await response.json();
            const donantes = Array.isArray(data.donantes) ? data.donantes : [];
            const total = data.total || 0;
            tablaDonantes.querySelector('tbody').innerHTML = '';
            if (!donantes || donantes.length === 0) {
                const filaVacia = document.createElement('tr');
                filaVacia.innerHTML = `<td colspan="4" class="text-center text-muted">No hay registros que coincidan con los filtros seleccionados.</td>`;
                tablaDonantes.querySelector('tbody').appendChild(filaVacia);
            } else {
                donantes.forEach(donante => {
                    const fila = document.createElement('tr');
                    fila.innerHTML = `
                        <td class="text-nowrap align-middle">${donante.cedula}</td>
                        <td class="text-nowrap align-middle">${donante.nombre}</td>
                        <td class="text-nowrap align-middle">${donante.apellido}</td>
                        <td class="text-center align-middle">
                            <button class="btn btn-outline-primary btn-sm editar" data-id="${donante.id}" title="Editar"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-outline-danger btn-sm eliminar" data-id="${donante.id}" title="Eliminar"><i class="fas fa-trash"></i></button>
                        </td>
                    `;
                    tablaDonantes.querySelector('tbody').appendChild(fila);
                });
            }
            renderizarPaginacion(total, page);
            paginaActual = page;
        } catch (error) {
            mostrarAlerta('Error cargando donantes', 'danger');
        }
    }
    // Paginación visual igual que socios
    function renderizarPaginacion(total, page) {
        const paginacion = document.getElementById('paginacion');
        paginacion.innerHTML = '';
        const totalPaginas = Math.ceil(total / donantesPorPagina);
        if (totalPaginas <= 1) return;
        for (let i = 1; i <= totalPaginas; i++) {
            const li = document.createElement('li');
            li.className = 'page-item' + (i === page ? ' active' : '');
            const a = document.createElement('a');
            a.className = 'page-link';
            a.href = '#';
            a.textContent = i;
            a.addEventListener('click', function(e) {
                e.preventDefault();
                if (paginaActual !== i) cargarDonantes(i);
            });
            li.appendChild(a);
            paginacion.appendChild(li);
        }
    }
    // Llenar y limpiar formulario
    function llenarFormulario(donante) {
        document.getElementById('donanteId').value = donante.id || '';
        document.getElementById('nombre').value = donante.nombre || '';
        document.getElementById('apellido').value = donante.apellido || '';
        document.getElementById('cedula').value = donante.cedula || '';
    }
    function limpiarFormulario() {
        formDonante.reset();
        document.getElementById('donanteId').value = '';
    }
    // Alertas flotantes igual que socios
    function mostrarAlerta(mensaje, tipo = 'success') {
        let alert = document.getElementById('alert-exito');
        if (!alert) {
            alert = document.createElement('div');
            alert.id = 'alert-exito';
            alert.className = 'alert position-fixed top-0 start-50 translate-middle-x mt-3 shadow';
            alert.style.zIndex = 2000;
            document.body.appendChild(alert);
        }
        alert.className = `alert alert-${tipo === 'danger' ? 'danger' : 'success'} position-fixed top-0 start-50 translate-middle-x mt-3 shadow`;
        alert.textContent = mensaje;
        alert.style.display = 'block';
        setTimeout(() => { alert.style.display = 'none'; }, 2500);
    }
});