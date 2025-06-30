document.addEventListener('DOMContentLoaded', function() {
    const tablaSocios = document.getElementById('tablaSocios');
    const formSocio = document.getElementById('formSocio');
    const modalSocio = new bootstrap.Modal(document.getElementById('modalSocio'));

    // Referencias para el modal de sanciones ====
    const modalSanciones = new bootstrap.Modal(document.getElementById('modalSanciones'));
    const modalSancionesBody = document.getElementById('modalSancionesBody');
    const btnAgregarSancionModal = document.getElementById('btnAgregarSancionModal');
    const formAgregarSancionContainer = document.getElementById('formAgregarSancionContainer');
    const formAgregarSancion = document.getElementById('formAgregarSancion');
    const btnCancelarAgregarSancion = document.getElementById('btnCancelarAgregarSancion');
    let socioIdActualSancion = null;
    // =======================================================

    // Variable para filtros (ahora texto y estado)
    let filtroActual = { texto: '', estado: '' };

    // Variables para paginación
    let paginaActual = 1;
    const sociosPorPagina = 10;

    // Cargar socios al iniciar     
    cargarSocios();

    // Función para cargar socios (con o sin filtro y paginación)
    async function cargarSocios(page = 1) {
        try {
            const params = new URLSearchParams();
            if (filtroActual.texto) params.append('texto', filtroActual.texto);
            if (filtroActual.estado) params.append('estado', filtroActual.estado);
            params.append('page', page);
            params.append('limit', sociosPorPagina);

            const url = `/api/socios/filtrados?${params.toString()}`;
            const response = await fetch(url);
            const data = await response.json();
            const socios = data.socios || [];
            const total = data.total || 0;

            // Limpiar tabla
            tablaSocios.querySelector('tbody').innerHTML = '';

            // Llenar tabla
            socios.forEach(socio => {
                const fila = document.createElement('tr');
                let estadoHtml = '';
                if (socio.sancionado) {
                    const motivo = socio.sancion_activa?.motivo || '';
                    const fechaFin = socio.sancion_activa?.fecha_final ? `Hasta: ${socio.sancion_activa.fecha_final}` : 'Indefinida';
                    estadoHtml = `<span class="badge bg-danger" title="${motivo ? 'Motivo: ' + motivo + ' - ' : ''}${fechaFin}">Sancionado</span>`;
                } else {
                    estadoHtml = '<span class="badge bg-success">Activo</span>';
                }
                fila.innerHTML = `
                    <td>${socio.CEDULA}</td>
                    <td>${socio.NOMBRE}</td>
                    <td>${socio.APELLIDO}</td>
                    <td>${socio.CORREO || '-'}</td>
                    <td>${socio.DIRECCION || '-'}</td>
                    <td>${socio.FECHA_NACIMIENTO ? socio.FECHA_NACIMIENTO.split('T')[0] : '-'}</td>
                    <td>${socio.FECHA_INSCRIPCION ? socio.FECHA_INSCRIPCION.split('T')[0] : '-'}</td>
                    <td>${socio.NACIONALIDAD_NOMBRE || '-'}</td>
                    <td>${socio.EDUCACION_NOMBRE || '-'}</td>
                    <td>${socio.PROFESION_NOMBRE || '-'}</td>
                    <td>${socio.INSTITUCION_NOMBRE || '-'}</td>
                    <td>${estadoHtml}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary editar" data-id="${socio.SOCIO_ID}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger eliminar" data-id="${socio.SOCIO_ID}">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="btn btn-sm btn-warning ver-sanciones" data-id="${socio.SOCIO_ID}">
                            <i class="fas fa-ban"></i> Sanciones
                        </button>
                    </td>
                `;
                tablaSocios.querySelector('tbody').appendChild(fila);
            });

            // Agregar eventos a los botones
            document.querySelectorAll('.editar').forEach(btn => {
                btn.addEventListener('click', cargarSocioParaEditar);
            });
            document.querySelectorAll('.eliminar').forEach(btn => {
                btn.addEventListener('click', eliminarSocio);
            });

            //Evento para los botones "Ver Sanciones"
            document.querySelectorAll('.ver-sanciones').forEach(btn => {
                btn.addEventListener('click', function() {
                    const socioId = this.dataset.id;
                    mostrarSanciones(socioId);
                });
            });

            // Paginación visual
            renderizarPaginacion(total, page);
            paginaActual = page;
        } catch (error) {
            console.error('Error al cargar socios:', error);
            mostrarAlerta('Error al cargar socios', 'danger');
        }
    }

    //Función para mostrar sanciones activas en modal (con días restantes)
    async function mostrarSanciones(socioId) {
        socioIdActualSancion = socioId;
        formAgregarSancionContainer.style.display = 'none';
        btnAgregarSancionModal.style.display = 'none';
        modalSancionesBody.innerHTML = `<div class="text-center"><div class="spinner-border" role="status"></div></div>`;
        modalSanciones.show();

        try {
            // Usar el nuevo endpoint que trae solo sanciones activas
            const response = await fetch(`/api/socios/${socioId}/sanciones-y-estado`);
            if (!response.ok) throw new Error('No se pudo cargar sanciones activas.');

            const data = await response.json();
            const sanciones = data.sanciones;

            let html = '';
            if (!sanciones || sanciones.length === 0) {
                html = '<p class="text-success">Sin sanciones activas</p>';
                btnAgregarSancionModal.style.display = '';
            } else {
                btnAgregarSancionModal.style.display = 'none';
                // Mostrar todas las sanciones activas (normalmente solo una)
                html = sanciones.map(sancion => {
                    // Calcular días restantes (INCLUSIVO)
                    let diasRestantes = '';
                    if (sancion.fecha_fin) {
                        const hoy = new Date();
                        const fechaFin = new Date(sancion.fecha_fin);
                        // Diferencia en milisegundos
                        const diffMs = fechaFin.setHours(0,0,0,0) - hoy.setHours(0,0,0,0);
                        let diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1; // Inclusivo: suma 1
                        if (diffDias > 1) {
                            diasRestantes = `Quedan <b>${diffDias}</b> días de sanción.`;
                        } else if (diffDias === 1) {
                            diasRestantes = 'Queda <b>1</b> día de sanción.';
                        } else if (diffDias === 0) {
                            diasRestantes = 'La sanción termina hoy.';
                        } else {
                            diasRestantes = 'La sanción terminó.';
                        }
                    } else {
                        diasRestantes = 'Sanción indefinida.';
                    }
                    return `<div class="mb-3 p-3 border rounded bg-dark bg-opacity-10">
                        <div><b>Motivo:</b> ${sancion.motivo}</div>
                        <div><b>Fecha inicio:</b> ${sancion.fecha_inicio ? sancion.fecha_inicio.split('T')[0] : '-'}</div>
                        <div><b>Fecha fin:</b> ${sancion.fecha_fin ? sancion.fecha_fin.split('T')[0] : 'Indefinida'}</div>
                        <div class="mt-2">${diasRestantes}</div>
                    </div>`;
                }).join('');
            }

            modalSancionesBody.innerHTML = html;
        } catch (error) {
            modalSancionesBody.innerHTML = `<div class="alert alert-danger">Error al cargar sanciones.</div>`;
        }
        formAgregarSancionContainer.style.display = 'none';
        formAgregarSancion.reset();
    }

    // Evento para mostrar formulario de sanción
    btnAgregarSancionModal.addEventListener('click', function() {
        formAgregarSancionContainer.style.display = '';
        btnAgregarSancionModal.style.display = 'none';
    });
    btnCancelarAgregarSancion.addEventListener('click', function(e) {
        e.preventDefault();
        formAgregarSancionContainer.style.display = 'none';
        btnAgregarSancionModal.style.display = '';
    });

    // Enviar nueva sanción
    formAgregarSancion.addEventListener('submit', async function(e) {
        e.preventDefault();
        const motivo = document.getElementById('motivoSancion').value;
        const fecha_inicio = document.getElementById('fechaInicioSancion').value;
        const fecha_fin = document.getElementById('fechaFinSancion').value;
        try {
            const resp = await fetch(`/api/socios/${socioIdActualSancion}/sancionar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ motivo, fecha_inicio, fecha_fin: fecha_fin || null })
            });
            if (!resp.ok) throw new Error('No se pudo agregar la sanción');
            formAgregarSancionContainer.style.display = 'none';
            modalSanciones.hide(); // Cerrar el modal tras agregar sanción
            // Opcional: mostrar alerta de éxito
            mostrarAlerta('Sanción agregada correctamente', 'success');
            // Opcional: recargar socios para reflejar estado
            cargarSocios();
        } catch (err) {
            alert('Error al agregar sanción: ' + err.message);
        }
    });

    // Renderizar paginación
    function renderizarPaginacion(total, page) {
        const paginacion = document.getElementById('paginacion');
        paginacion.innerHTML = '';
        const totalPaginas = Math.ceil(total / sociosPorPagina);
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
                if (paginaActual !== i) cargarSocios(i);
            });
            li.appendChild(a);
            paginacion.appendChild(li);
        }
    }

    // Formulario submit (crear/actualizar)
    formSocio.addEventListener('submit', async function(e) {
        e.preventDefault();

        const socioId = document.getElementById('socioId').value;
        const url = socioId ? `/api/socios/${socioId}` : '/api/socios';
        const method = socioId ? 'PUT' : 'POST';

        const socioData = {
            NOMBRE: document.getElementById('NOMBRE').value,
            APELLIDO: document.getElementById('APELLIDO').value,
            CEDULA: document.getElementById('CEDULA').value,
            CORREO: document.getElementById('CORREO').value || null,
            DIRECCION: document.getElementById('DIRECCION').value || null,
            FECHA_NACIMIENTO: document.getElementById('FECHA_NACIMIENTO').value,
            FECHA_INSCRIPCION: document.getElementById('FECHA_INSCRIPCION').value,
            NACIONALIDAD: document.getElementById('NACIONALIDAD').value || null,
            EDUCACION_ID: document.getElementById('EDUCACION_ID').value || null,
            PROFESION_ID: document.getElementById('PROFESION_ID').value || null,
            INSTITUCION_ID: document.getElementById('INSTITUCION_ID').value || null
        };

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(socioData)
            });

            if (!response.ok) throw new Error(await response.text());

            mostrarAlerta(`Socio ${socioId ? 'actualizado' : 'creado'} correctamente`, 'success');
            modalSocio.hide();
            cargarSocios();

        } catch (error) {
            console.error('Error al guardar socio:', error);
            mostrarAlerta(error.message, 'danger');
        }
    });

    // Limpiar formulario y preparar modal para nuevo socio
    document.querySelector('[data-bs-target="#modalSocio"]').addEventListener('click', async function() {
        formSocio.reset();
        document.getElementById('socioId').value = '';
        document.getElementById('modalTitulo').textContent = 'Nuevo Socio';
        await cargarOpcionesSelects(); // Asegura que los selects estén llenos siempre
    });

    // Cargar socio para editar
    async function cargarSocioParaEditar(e) {
        const socioId = e.target.closest('button').dataset.id;

        try {
            // Primero carga los selects y espera a que estén listos
            await cargarOpcionesSelects();
            const response = await fetch(`/api/socios/${socioId}`);
            if (!response.ok) throw new Error('Socio no encontrado');

            const socio = await response.json();

            // Llenar formulario
            document.getElementById('socioId').value = socio.SOCIO_ID;
            document.getElementById('NOMBRE').value = socio.NOMBRE || '';
            document.getElementById('APELLIDO').value = socio.APELLIDO || '';
            document.getElementById('CEDULA').value = socio.CEDULA || '';
            document.getElementById('CORREO').value = socio.CORREO || '';
            document.getElementById('DIRECCION').value = socio.DIRECCION || '';
            document.getElementById('FECHA_NACIMIENTO').value = socio.FECHA_NACIMIENTO ? socio.FECHA_NACIMIENTO.split('T')[0] : '';
            document.getElementById('FECHA_INSCRIPCION').value = socio.FECHA_INSCRIPCION ? socio.FECHA_INSCRIPCION.split('T')[0] : '';
            document.getElementById('NACIONALIDAD').value = socio.NACIONALIDAD || '';
            document.getElementById('EDUCACION_ID').value = socio.EDUCACION_ID || '';
            document.getElementById('PROFESION_ID').value = socio.PROFESION_ID || '';
            document.getElementById('INSTITUCION_ID').value = socio.INSTITUCION_ID || '';

            // Cambiar título del modal
            document.getElementById('modalTitulo').textContent = 'Editar Socio';
            modalSocio.show();
        } catch (error) {
            console.error('Error al cargar socio:', error);
            mostrarAlerta('Error al cargar socio', 'danger');
        }
    }

    // Eliminar socio
    async function eliminarSocio(e) {
        if (!confirm('¿Estás seguro de eliminar este socio?')) return;

        const socioId = e.target.closest('button').dataset.id;

        try {
            const response = await fetch(`/api/socios/${socioId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error(await response.text());

            mostrarAlerta('Socio eliminado correctamente', 'success');
            cargarSocios();

        } catch (error) {
            console.error('Error al eliminar socio:', error);
            mostrarAlerta('Error al eliminar socio', 'danger');
        }
    }

    // Función para mostrar alertas
    function mostrarAlerta(mensaje, tipo) {
        // Implementar según tu sistema de alertas preferido
        alert(`${tipo.toUpperCase()}: ${mensaje}`);
    }

    // Escuchar cambios en los filtros
    document.getElementById('inputFiltroTexto').addEventListener('input', function(e) {
        filtroActual.texto = e.target.value;
        cargarSocios(1);
    });
    document.getElementById('filtroEstadoSocio').addEventListener('change', function(e) {
        filtroActual.estado = e.target.value;
        cargarSocios(1);
    });

    // Modal simple para agregar sanción (AJUSTADO: usa el endpoint correcto)
    function mostrarModalAgregarSancion(socioId) {
        // Cerrar modal sanciones
        modalSanciones.hide();

        // Crear modal dinámico
        let modal = document.getElementById('modalAgregarSancion');
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'modalAgregarSancion';
        modal.tabIndex = -1;
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <form id="formAgregarSancion">
                        <div class="modal-header">
                            <h5 class="modal-title">Agregar Sanción</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Motivo*</label>
                                <input type="text" class="form-control" id="motivoSancion" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Fecha inicio*</label>
                                <input type="date" class="form-control" id="fechaInicioSancion" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Fecha fin</label>
                                <input type="date" class="form-control" id="fechaFinSancion">
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Guardar Sanción</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const modalBootstrap = new bootstrap.Modal(modal);
        modalBootstrap.show();

        // Al cerrar, eliminar el modal del DOM
        modal.addEventListener('hidden.bs.modal', function() {
            modal.remove();
        });

        // Submit del formulario de sanción
        document.getElementById('formAgregarSancion').addEventListener('submit', async function(e) {
            e.preventDefault();
            const motivo = document.getElementById('motivoSancion').value.trim();
            const fecha_inicio = document.getElementById('fechaInicioSancion').value;
            const fecha_fin = document.getElementById('fechaFinSancion').value || null;

            if (!motivo || !fecha_inicio) {
                alert('Completa los campos obligatorios.');
                return;
            }

            try {
                // Usa el endpoint correcto del backend
                const resp = await fetch(`/api/socios/${socioId}/sancionar`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        motivo,
                        fecha_inicio,
                        fecha_fin
                    })
                });
                if (!resp.ok) throw new Error(await resp.text());

                mostrarAlerta('Sanción agregada correctamente', 'success');
                modalBootstrap.hide();
                cargarSocios();
            } catch (err) {
                mostrarAlerta('Error al agregar sanción: ' + err.message, 'danger');
            }
        });
    }

    // Cargar opciones de selects de referencia
    async function cargarOpcionesSelects() {
        // Nacionalidades
        const nacionalidadSelect = document.getElementById('NACIONALIDAD');
        nacionalidadSelect.innerHTML = '<option value="">Seleccione...</option>';
        const nacionalidades = await fetch('/api/socios/nacionalidades').then(r => r.json());
        nacionalidades.forEach(n => {
            nacionalidadSelect.innerHTML += `<option value="${n.NACIONALIDAD}">${n.PAIS}</option>`;
        });
        // Educaciones
        const educacionSelect = document.getElementById('EDUCACION_ID');
        educacionSelect.innerHTML = '<option value="">Seleccione...</option>';
        const educaciones = await fetch('/api/socios/educaciones').then(r => r.json());
        educaciones.forEach(e => {
            educacionSelect.innerHTML += `<option value="${e.EDUCACION_ID}">${e.NIVEL_EDUCATIVO}</option>`;
        });
        // Profesiones
        const profesionSelect = document.getElementById('PROFESION_ID');
        profesionSelect.innerHTML = '<option value="">Seleccione...</option>';
        const profesiones = await fetch('/api/socios/profesiones').then(r => r.json());
        profesiones.forEach(p => {
            profesionSelect.innerHTML += `<option value="${p.PROFESION_ID}">${p.PROFESION}</option>`;
        });
        // Instituciones
        const institucionSelect = document.getElementById('INSTITUCION_ID');
        institucionSelect.innerHTML = '<option value="">Seleccione...</option>';
        const instituciones = await fetch('/api/socios/instituciones').then(r => r.json());
        instituciones.forEach(i => {
            institucionSelect.innerHTML += `<option value="${i.INSTITUCION_ID}">${i.INSTITUCION}</option>`;
        });
    }

    // Llamar al cargar la página
    cargarOpcionesSelects();

});