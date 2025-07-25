document.addEventListener('DOMContentLoaded', function() {
    const tablaBibliotecarios = document.getElementById('tablaBibliotecarios');
    const formBibliotecario = document.getElementById('formBibliotecario');
    const modalBibliotecario = new bootstrap.Modal(document.getElementById('modalBibliotecario'));

    // Variable para filtros
    let filtroActual = { texto: '' };

    // Variables para paginación
    let paginaActual = 1;
    const bibliotecariosPorPagina = 10;

    // Cargar bibliotecarios al iniciar     
    cargarBibliotecarios();

    // Función para cargar bibliotecarios (con o sin filtro y paginación)
    async function cargarBibliotecarios(page = 1) {
        try {
            const params = new URLSearchParams();
            if (filtroActual.texto) params.append('texto', filtroActual.texto);
            params.append('page', page);
            params.append('limit', bibliotecariosPorPagina);

            const url = `/api/bibliotecarios/filtrados?${params.toString()}`;
            const response = await fetch(url);
            const data = await response.json();
            const bibliotecarios = data.bibliotecarios || [];
            const total = data.total || 0;

            // Limpiar tabla
            tablaBibliotecarios.querySelector('tbody').innerHTML = '';

            // Llenar tabla
            bibliotecarios.forEach(bibliotecario => {
                const fila = document.createElement('tr');
                
                // Badge para privilegios
                let privilegiosHtml = '';
                if (bibliotecario.PRIVILEGIOS === 'S') {
                    privilegiosHtml = '<span class="badge bg-danger badge-privilegios">Super Admin</span>';
                } else if (bibliotecario.PRIVILEGIOS === 'Y') {
                    privilegiosHtml = '<span class="badge bg-warning text-dark badge-privilegios">Administrador</span>';
                } else {
                    privilegiosHtml = '<span class="badge bg-secondary badge-privilegios">Normal</span>';
                }
                
                fila.innerHTML = `
                    <td>${bibliotecario.USUARIO}</td>
                    <td>${bibliotecario.NOMBRE}</td>
                    <td>${bibliotecario.APELLIDO}</td>
                    <td>${bibliotecario.CEDULA}</td>
                    <td>${privilegiosHtml}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary editar" data-id="${bibliotecario.BIBLIOTECARIO_ID}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger eliminar" data-id="${bibliotecario.BIBLIOTECARIO_ID}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tablaBibliotecarios.querySelector('tbody').appendChild(fila);
            });

            // Agregar eventos a los botones
            document.querySelectorAll('.editar').forEach(btn => {
                btn.addEventListener('click', cargarBibliotecarioParaEditar);
            });
            document.querySelectorAll('.eliminar').forEach(btn => {
                btn.addEventListener('click', eliminarBibliotecario);
            });

            // Paginación visual
            renderizarPaginacion(total, page);
            paginaActual = page;
        } catch (error) {
            console.error('Error al cargar bibliotecarios:', error);
            mostrarAlerta('Error al cargar bibliotecarios', 'danger');
        }
    }

    // Renderizar paginación
    function renderizarPaginacion(total, page) {
        const paginacion = document.getElementById('paginacion');
        paginacion.innerHTML = '';
        const totalPaginas = Math.ceil(total / bibliotecariosPorPagina);
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
                if (paginaActual !== i) cargarBibliotecarios(i);
            });
            li.appendChild(a);
            paginacion.appendChild(li);
        }
    }

    // Función para mostrar alertas flotantes
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

    // Extrae mensaje de RAISERROR Sybase
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
        
        return msg;
    }

    function normalizarMensaje(s) {
        return s ? s.replace(/\s+/g, ' ').trim().toLowerCase() : '';
    }

    // Mensajes personalizados para triggers de bibliotecarios
    const mensajesTriggers = {
        'el bibliotecario ya existe.': 'Ya existe un bibliotecario con esos datos.',
        'usuario ya existe': 'Ya existe un bibliotecario con ese usuario.',
        'cedula ya existe': 'Ya existe un bibliotecario con esa cédula.',
        'referenced by foreign key': 'No se puede eliminar el bibliotecario porque tiene registros asociados.'
    };

    // Formulario submit (crear/actualizar)
    formBibliotecario.addEventListener('submit', async function(e) {
        e.preventDefault();
        const bibliotecarioId = document.getElementById('bibliotecarioId').value;
        const url = bibliotecarioId ? `/api/bibliotecarios/${bibliotecarioId}` : '/api/bibliotecarios';
        const method = bibliotecarioId ? 'PUT' : 'POST';
        
        const bibliotecarioData = {
            USUARIO: document.getElementById('USUARIO').value,
            PRIVILEGIOS: document.getElementById('PRIVILEGIOS').value,
            NOMBRE: document.getElementById('NOMBRE').value,
            APELLIDO: document.getElementById('APELLIDO').value,
            CEDULA: document.getElementById('CEDULA').value,
            CONTRASENA: document.getElementById('CONTRASENA').value
        };

        // Para edición, solo incluir contraseña si se proporcionó
        if (bibliotecarioId && !bibliotecarioData.CONTRASENA.trim()) {
            delete bibliotecarioData.CONTRASENA;
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bibliotecarioData)
            });
            
            let resp;
            try {
                resp = await response.json();
            } catch (e) {
                mostrarAlerta('Error inesperado del servidor.', 'danger');
                throw e;
            }
            
            if (!resp.error) {
                mostrarAlerta(`Bibliotecario ${bibliotecarioId ? 'actualizado' : 'creado'} correctamente`, 'success');
                modalBibliotecario.hide();
                cargarBibliotecarios();
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
            mostrarAlerta('Error al guardar bibliotecario.', 'danger');
        }
    });

    // Limpiar formulario y preparar modal para nuevo bibliotecario
    document.querySelector('[data-bs-target="#modalBibliotecario"]').addEventListener('click', function() {
        formBibliotecario.reset();
        document.getElementById('bibliotecarioId').value = '';
        document.getElementById('modalTitulo').textContent = 'Nuevo Bibliotecario';
        document.getElementById('passwordHelp').style.display = 'none';
        document.getElementById('CONTRASENA').setAttribute('required', 'required');
    });

    // Cargar bibliotecario para editar
    async function cargarBibliotecarioParaEditar(e) {
        const bibliotecarioId = e.target.closest('button').dataset.id;

        try {
            const response = await fetch(`/api/bibliotecarios/${bibliotecarioId}`);
            if (!response.ok) throw new Error('Bibliotecario no encontrado');

            const bibliotecario = await response.json();

            // Llenar formulario
            document.getElementById('bibliotecarioId').value = bibliotecario.BIBLIOTECARIO_ID;
            document.getElementById('USUARIO').value = bibliotecario.USUARIO || '';
            document.getElementById('PRIVILEGIOS').value = bibliotecario.PRIVILEGIOS || 'N';
            document.getElementById('NOMBRE').value = bibliotecario.NOMBRE || '';
            document.getElementById('APELLIDO').value = bibliotecario.APELLIDO || '';
            document.getElementById('CEDULA').value = bibliotecario.CEDULA || '';
            document.getElementById('CONTRASENA').value = '';

            // Cambiar título del modal y mostrar ayuda de contraseña
            document.getElementById('modalTitulo').textContent = 'Editar Bibliotecario';
            document.getElementById('passwordHelp').style.display = 'block';
            document.getElementById('CONTRASENA').removeAttribute('required');
            modalBibliotecario.show();
        } catch (error) {
            console.error('Error al cargar bibliotecario:', error);
            mostrarAlerta('Error al cargar bibliotecario', 'danger');
        }
    }

    // Eliminar bibliotecario
    async function eliminarBibliotecario(e) {
        const bibliotecarioId = e.target.closest('button').dataset.id;
        const fila = e.target.closest('tr');
        
        // Obtener información del bibliotecario desde la fila de la tabla
        const celdas = fila.querySelectorAll('td');
        const usuario = celdas[0]?.textContent?.trim() || 'Usuario desconocido';
        const nombre = celdas[1]?.textContent?.trim() || '';
        const apellido = celdas[2]?.textContent?.trim() || '';
        const cedula = celdas[3]?.textContent?.trim() || 'Sin cédula';
        
        let titulo = '¿Eliminar bibliotecario?';
        let mensaje = `<strong>${usuario}</strong><br><small class="text-muted">${nombre} ${apellido} • Cédula: ${cedula}</small>`;
        
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
            console.log('🗑️ ELIMINAR BIBLIOTECARIO - Iniciando eliminación de bibliotecario ID:', bibliotecarioId);
            
            const response = await fetch(`/api/bibliotecarios/${bibliotecarioId}`, {
                method: 'DELETE'
            });
            
            console.log('🗑️ ELIMINAR BIBLIOTECARIO - Response status:', response.status);
            console.log('🗑️ ELIMINAR BIBLIOTECARIO - Response ok:', response.ok);
            
            let resp;
            try {
                resp = await response.json();
                console.log('🗑️ ELIMINAR BIBLIOTECARIO - Response JSON:', resp);
            } catch (e) {
                console.error('❌ ELIMINAR BIBLIOTECARIO - Error parseando JSON:', e);
                console.log('🗑️ ELIMINAR BIBLIOTECARIO - Response text:', await response.text());
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
                console.log('✅ ELIMINAR BIBLIOTECARIO - Eliminación exitosa');
                Swal.fire({
                    title: '¡Eliminado!',
                    text: `Bibliotecario eliminado: ${usuario}`,
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    width: '300px',
                    padding: '1rem'
                });
                cargarBibliotecarios();
            } else {
                console.error('❌ ELIMINAR BIBLIOTECARIO - Error en respuesta:', resp);
                console.log('🔍 ELIMINAR BIBLIOTECARIO - Error completo:', JSON.stringify(resp, null, 2));
                
                // Analizar errores ODBC específicos
                if (resp.odbcErrors && Array.isArray(resp.odbcErrors)) {
                    console.log('🔍 ELIMINAR BIBLIOTECARIO - Errores ODBC encontrados:', resp.odbcErrors.length);
                    resp.odbcErrors.forEach((odbcError, index) => {
                        console.log(`🔍 ELIMINAR BIBLIOTECARIO - ODBC Error ${index + 1}:`, odbcError);
                        console.log(`  - State: ${odbcError.state}`);
                        console.log(`  - Code: ${odbcError.code}`);
                        console.log(`  - Message: ${odbcError.message}`);
                    });
                }
                
                let msg = extraerMensajeRaiserror(resp);
                console.log('🔍 ELIMINAR BIBLIOTECARIO - Mensaje extraído:', msg);
                
                const msgNorm = normalizarMensaje(msg);
                console.log('🔍 ELIMINAR BIBLIOTECARIO - Mensaje normalizado:', msgNorm);
                
                // Lógica inteligente para detectar errores de clave foránea
                let mensajeFinal = '';
                if (msgNorm.includes('referenced by foreign key')) {
                    mensajeFinal = 'No se puede eliminar el bibliotecario porque tiene registros asociados en otras tablas.';
                    console.log('🔍 ELIMINAR BIBLIOTECARIO - Detectado error de clave foránea, usando mensaje personalizado');
                } else if (mensajesTriggers[msgNorm]) {
                    mensajeFinal = mensajesTriggers[msgNorm];
                    console.log('🔍 ELIMINAR BIBLIOTECARIO - Usando mensaje personalizado del mapeo:', mensajeFinal);
                } else {
                    mensajeFinal = msg;
                    console.log('🔍 ELIMINAR BIBLIOTECARIO - Usando mensaje original:', msg);
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
            console.error('❌ ELIMINAR BIBLIOTECARIO - Error general:', error);
            console.log('🔍 ELIMINAR BIBLIOTECARIO - Error stack:', error.stack);
            Swal.fire({
                title: 'Error',
                text: 'Error al eliminar bibliotecario.',
                icon: 'error',
                width: '300px',
                padding: '1rem'
            });
        }
    }

    // Escuchar cambios en el filtro de texto
    document.getElementById('inputFiltroTexto').addEventListener('input', function(e) {
        filtroActual.texto = e.target.value;
        cargarBibliotecarios(1);
    });
});
