document.addEventListener('DOMContentLoaded', function() {
    const tablaSocios = document.getElementById('tablaSocios');
    const formSocio = document.getElementById('formSocio');
    const modalSocio = new bootstrap.Modal(document.getElementById('modalSocio'));

    // Referencias para el modal de sanciones ====
    const modalSanciones = new bootstrap.Modal(document.getElementById('modalSanciones'));
    const modalSancionesBody = document.getElementById('modalSancionesBody');
    // =======================================================

    // Variable para filtros
    let filtroActual = { texto: '', estado: '' };

    // Variables para paginación
    let paginaActual = 1;
    const sociosPorPagina = 10;

    // Cargar socios al iniciar     
    cargarSocios();
    cargarEstadosUnicos();

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
                fila.innerHTML = `
                    <td>${socio.documento_identidad}</td>
                    <td>${socio.nombre_completo}</td>
                    <td>${socio.email || '-'}</td>
                    <td><span class="badge ${getEstadoClass(socio.estado)}">${socio.estado}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary editar" data-id="${socio.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger eliminar" data-id="${socio.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="btn btn-sm btn-warning ver-sanciones" data-id="${socio.id}">
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

    //Función para mostrar sanciones activas en modal **y mostrar el botón Agregar Sanción si corresponde**
    async function mostrarSanciones(socioId) {
        modalSancionesBody.innerHTML = `<div class="text-center"><div class="spinner-border" role="status"></div></div>`;
        modalSanciones.show();

        try {
            // Usar el nuevo endpoint que trae sanciones activas y estado
            const response = await fetch(`/api/socios/${socioId}/sanciones-y-estado`);
            if (!response.ok) throw new Error('No se pudo cargar sanciones activas.');

            const data = await response.json();
            const sanciones = data.sanciones;
            const estado = data.estado;

            let html = '';
            if (!sanciones || sanciones.length === 0) {
                html = '<p class="text-success">Sin sanciones activas</p>';
            } else {
                html = '<ul class="list-group">';
                sanciones.forEach(s => {
                    html += `<li class="list-group-item">
                        <b>Motivo:</b> ${s.motivo}<br>
                        <b>Desde:</b> ${s.fecha_inicio} <b>hasta</b> ${s.fecha_fin ?? 'Indefinida'}<br>
                        <b>Días restantes:</b> ${s.dias_restantes_sancion}
                    </li>`;
                });
                html += '</ul>';
            }

            // Si el socio está ACTIVO, mostrar el botón "Agregar Sanción"
            if (estado === 'activo') {
                html += `
                    <div class="mt-3 text-end">
                        <button class="btn btn-primary" id="btnAgregarSancion" data-id="${socioId}">
                            <i class="fas fa-plus"></i> Agregar Sanción
                        </button>
                    </div>
                `;
            }

            modalSancionesBody.innerHTML = html;

            // Evento para el botón "Agregar Sanción"
            if (estado === 'activo') {
                document.getElementById('btnAgregarSancion').addEventListener('click', function() {
                    mostrarModalAgregarSancion(socioId);
                });
            }

        } catch (error) {
            modalSancionesBody.innerHTML = `<div class="alert alert-danger">Error al cargar sanciones.</div>`;
        }
    }

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

    // Función auxiliar para clases de estado
    function getEstadoClass(estado) {
        const clases = {
            'activo': 'bg-success',
            'inactivo': 'bg-secondary',
            'suspendido': 'bg-warning text-dark',
            'sancionado': 'bg-danger'
        };
        return clases[estado] || 'bg-light text-dark';
    }

    // Formulario submit (crear/actualizar)
    formSocio.addEventListener('submit', async function(e) {
        e.preventDefault();

        const socioId = document.getElementById('socioId').value;
        const url = socioId ? `/api/socios/${socioId}` : '/api/socios';
        const method = socioId ? 'PUT' : 'POST';

        const socioData = {
            documento_identidad: document.getElementById('documento_identidad').value,
            nombre_completo: document.getElementById('nombre_completo').value,
            fecha_nacimiento: document.getElementById('fecha_nacimiento').value,
            fecha_inscripcion: document.getElementById('fecha_inscripcion').value,
            email: document.getElementById('email').value || null,
            estado: document.getElementById('estado').value,
            direccion: document.getElementById('direccion').value || null,
            nacionalidad: document.getElementById('nacionalidad').value || null,
            nivel_educativo: document.getElementById('nivel_educativo').value || null,
            profesion: document.getElementById('profesion').value || null,
            institucion_referente: document.getElementById('institucion_referente').value || null
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

    // Cargar socio para editar
    async function cargarSocioParaEditar(e) {
        const socioId = e.target.closest('button').dataset.id;

        try {
            const response = await fetch(`/api/socios/${socioId}`);
            if (!response.ok) throw new Error('Socio no encontrado');

            const socio = await response.json();

            // Llenar formulario
            document.getElementById('socioId').value = socio.id;
            document.getElementById('documento_identidad').value = socio.documento_identidad;
            document.getElementById('nombre_completo').value = socio.nombre_completo;
            document.getElementById('fecha_nacimiento').value = socio.fecha_nacimiento.split('T')[0];
            document.getElementById('fecha_inscripcion').value = socio.fecha_inscripcion.split('T')[0];
            document.getElementById('email').value = socio.email || '';
            document.getElementById('estado').value = socio.estado;
            document.getElementById('direccion').value = socio.direccion || '';
            document.getElementById('nacionalidad').value = socio.nacionalidad || '';
            document.getElementById('nivel_educativo').value = socio.nivel_educativo || '';
            document.getElementById('profesion').value = socio.profesion || '';
            document.getElementById('institucion_referente').value = socio.institucion_referente || '';

            // Cambiar título del modal
            document.getElementById('modalTitulo').textContent = 'Editar Socio';

            // Mostrar modal
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

    // Cargar estados únicos para el filtro y el formulario
    async function cargarEstadosUnicos() {
        // Filtro
        const selectFiltro = document.getElementById('inputFiltroEstado');
        if (selectFiltro) selectFiltro.innerHTML = '<option value="">Todos</option>';
        // Formulario
        const selectForm = document.getElementById('estado');
        if (selectForm) selectForm.innerHTML = '';
        try {
            const response = await fetch('/api/socios/estados');
            const estados = await response.json();
            estados.forEach(e => {
                const valor = e.estado || e.ESTADO;
                // Filtro
                if (selectFiltro) selectFiltro.innerHTML += `<option value="${valor}">${valor.charAt(0).toUpperCase() + valor.slice(1)}</option>`;
                // Formulario
                if (selectForm) selectForm.innerHTML += `<option value="${valor}">${valor.charAt(0).toUpperCase() + valor.slice(1)}</option>`;
            });
        } catch (err) {
            if (selectFiltro) selectFiltro.innerHTML += '<option value="">(Error al cargar)</option>';
            if (selectForm) selectForm.innerHTML += '<option value="">(Error al cargar)</option>';
        }
    }

    // Escuchar cambios en los filtros
    document.getElementById('inputFiltroTexto').addEventListener('input', function(e) {
        filtroActual.texto = e.target.value;
        cargarSocios(1);
    });
    document.getElementById('inputFiltroEstado').addEventListener('change', function(e) {
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

}); 