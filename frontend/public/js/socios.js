// Formatea fecha a DD/MM/AAAA
function formatearFechaDMY(fechaStr) {
    const fecha = new Date(fechaStr);
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
}


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
                    <td>${socio.FECHA_NACIMIENTO ? formatearFechaDMY(socio.FECHA_NACIMIENTO) : '-'}</td>
                    <td>${socio.FECHA_INSCRIPCION ? formatearFechaDMY(socio.FECHA_INSCRIPCION) : '-'}</td>
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

    // Función para mostrar alertas flotantes (igual que préstamos)
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

    // Extrae mensaje de RAISERROR Sybase (igual que préstamos)
    function extraerMensajeRaiserror(resp) {
        let msg = resp && resp.error ? resp.error : '';
        
        // Primero revisar si hay errores ODBC específicos
        if (resp && resp.odbcErrors && Array.isArray(resp.odbcErrors) && resp.odbcErrors.length > 0) {
            const raiserror = resp.odbcErrors.find(e => e.message && e.message.includes('RAISERROR executed:'));
            if (raiserror) {
                let after = raiserror.message.split('RAISERROR executed:')[1];
                let endIdx = after ? after.search(/(\\n|\n|\r|\r\n|$)/) : -1;
                if (endIdx !== -1) {
                    msg = after.slice(0, endIdx).trim();
                } else {
                    msg = after ? after.trim() : msg;
                }
            } else {
                // Si no hay RAISERROR, usar el primer mensaje ODBC disponible
                msg = resp.odbcErrors[0].message || msg;
            }
        } else if (msg && msg.includes('RAISERROR executed:')) {
            let after = msg.split('RAISERROR executed:')[1];
            let endIdx = after ? after.search(/(\\n|\n|\r|\r\n|$)/) : -1;
            if (endIdx !== -1) {
                msg = after.slice(0, endIdx).trim();
            } else {
                msg = after ? after.trim() : msg;
            }
        }
        
        // Si el mensaje contiene información de clave foránea, limpiarlo un poco
        if (msg && msg.toLowerCase().includes('primary key') && msg.toLowerCase().includes('foreign key')) {
            // Mantener el mensaje tal como está para que coincida con nuestro mapeo
            msg = msg.trim();
        }
        
        return msg;
    }
    function normalizarMensaje(s) {
        return s ? s.replace(/\s+/g, ' ').trim().toLowerCase() : '';
    }
    // Mensajes personalizados para triggers de socios (puedes ampliar)
    const mensajesTriggers = {
        'el socio ya existe.': 'Ya existe un socio con esos datos.',
        'no se puede eliminar el socio porque tiene préstamos activos.': 'No puedes eliminar un socio con préstamos activos.',
        'no se puede eliminar el socio porque tiene sanciones activas.': 'No puedes eliminar un socio con sanciones activas.',
        'primary key for row in table \'socios\' is referenced by foreign key \'fk_sancione_reference_socios\' in table \'sanciones': 'No se puede eliminar el socio porque tiene sanciones asociadas. Debe eliminar primero todas las sanciones del socio.',
        '[sybase][odbc driver][sql anywhere]primary key for row in table \'socios\' is referenced by foreign key \'fk_sancione_reference_socios\' in table \'sanciones': 'No se puede eliminar el socio porque tiene sanciones asociadas. Debe eliminar primero todas las sanciones del socio.',
        'primary key for row in table socios is referenced by foreign key': 'No se puede eliminar el socio porque tiene registros asociados en otras tablas.',
        'referenced by foreign key': 'No se puede eliminar el socio porque tiene registros asociados.'
    };

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
            let resp;
            try {
                resp = await response.json();
            } catch (e) {
                mostrarAlerta('Error inesperado del servidor.', 'danger');
                throw e;
            }
            if (!resp.error) {
                mostrarAlerta(`Socio ${socioId ? 'actualizado' : 'creado'} correctamente`, 'success');
                modalSocio.hide();
                cargarSocios();
            } else {
                let msg = extraerMensajeRaiserror(resp);
                const msgNorm = normalizarMensaje(msg);
                if (mensajesTriggers[msgNorm]) {
                    mostrarAlerta(mensajesTriggers[msgNorm], 'danger');
                } else {
                    mostrarAlerta(msg, 'danger');
                }
            }
        } catch (error) {
            mostrarAlerta('Error al guardar socio.', 'danger');
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
        const socioId = e.target.closest('button').dataset.id;
        const fila = e.target.closest('tr');
        
        // Obtener información del socio desde la fila de la tabla
        const celdas = fila.querySelectorAll('td');
        const nombre = celdas[0]?.textContent?.trim() || 'Socio desconocido';
        const documento = celdas[1]?.textContent?.trim() || 'Sin documento';
        const fechaInscripcion = celdas[5]?.textContent?.trim() || 'Sin fecha';
        
        let titulo = '¿Eliminar socio?';
        let mensaje = `<strong>${nombre}</strong><br><small class="text-muted">Doc: ${documento} • Inscripción: ${fechaInscripcion}</small>`;
        
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
        
        if (!result.isConfirmed) return;
        
        try {
            console.log('🗑️ ELIMINAR SOCIO - Iniciando eliminación de socio ID:', socioId);
            
            const response = await fetch(`/api/socios/${socioId}`, {
                method: 'DELETE'
            });
            
            console.log('🗑️ ELIMINAR SOCIO - Response status:', response.status);
            console.log('🗑️ ELIMINAR SOCIO - Response ok:', response.ok);
            
            let resp;
            try {
                resp = await response.json();
                console.log('🗑️ ELIMINAR SOCIO - Response JSON:', resp);
            } catch (e) {
                console.error('❌ ELIMINAR SOCIO - Error parseando JSON:', e);
                console.log('🗑️ ELIMINAR SOCIO - Response text:', await response.text());
                Swal.fire({
                    title: 'Error',
                    text: 'Error inesperado del servidor.',
                    icon: 'error',
                    width: '300px',
                    padding: '1rem'
                });
                throw e;
            }
            
            if (!resp.error) {
                console.log('✅ ELIMINAR SOCIO - Eliminación exitosa');
                Swal.fire({
                    title: '¡Eliminado!',
                    text: `Socio eliminado: ${nombre}`,
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    width: '300px',
                    padding: '1rem'
                });
                cargarSocios();
            } else {
                console.error('❌ ELIMINAR SOCIO - Error en respuesta:', resp);
                console.log('🔍 ELIMINAR SOCIO - Error completo:', JSON.stringify(resp, null, 2));
                
                // Analizar errores ODBC específicos
                if (resp.odbcErrors && Array.isArray(resp.odbcErrors)) {
                    console.log('🔍 ELIMINAR SOCIO - Errores ODBC encontrados:', resp.odbcErrors.length);
                    resp.odbcErrors.forEach((odbcError, index) => {
                        console.log(`🔍 ELIMINAR SOCIO - ODBC Error ${index + 1}:`, odbcError);
                        console.log(`  - State: ${odbcError.state}`);
                        console.log(`  - Code: ${odbcError.code}`);
                        console.log(`  - Message: ${odbcError.message}`);
                    });
                }
                
                let msg = extraerMensajeRaiserror(resp);
                console.log('🔍 ELIMINAR SOCIO - Mensaje extraído:', msg);
                
                const msgNorm = normalizarMensaje(msg);
                console.log('🔍 ELIMINAR SOCIO - Mensaje normalizado:', msgNorm);
                
                // Lógica para detectar errores de clave foránea de sanciones
                let mensajeFinal = '';
                if (msgNorm.includes('fk_sancione_reference_socios') || 
                    (msgNorm.includes('primary key') && msgNorm.includes('socios') && msgNorm.includes('sanciones'))) {
                    mensajeFinal = 'No se puede eliminar el socio porque tiene sanciones asociadas. Debe eliminar primero todas las sanciones del socio.';
                    console.log('🔍 ELIMINAR SOCIO - Detectado error de sanciones, usando mensaje personalizado');
                } else if (mensajesTriggers[msgNorm]) {
                    mensajeFinal = mensajesTriggers[msgNorm];
                    console.log('🔍 ELIMINAR SOCIO - Usando mensaje personalizado del mapeo:', mensajeFinal);
                } else {
                    mensajeFinal = msg;
                    console.log('🔍 ELIMINAR SOCIO - Usando mensaje original:', msg);
                }
                
                Swal.fire({
                    title: 'Error',
                    text: mensajeFinal,
                    icon: 'error',
                    width: '300px',
                    padding: '1rem'
                });
            }
        } catch (error) {
            console.error('❌ ELIMINAR SOCIO - Error general:', error);
            console.log('🔍 ELIMINAR SOCIO - Error stack:', error.stack);
            Swal.fire({
                title: 'Error',
                text: 'Error al eliminar socio.',
                icon: 'error',
                width: '300px',
                padding: '1rem'
            });
        }
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