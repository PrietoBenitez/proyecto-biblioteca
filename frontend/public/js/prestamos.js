// Formatea fecha a DD/MM/AAAA
function formatearFechaDMY(fechaStr) {
    const fecha = new Date(fechaStr);
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
}


document.addEventListener('DOMContentLoaded', () => {
    cargarPrestamos();
    cargarSocios();
    cargarMateriales();
    cargarBibliotecarios();
    // Filtros
    document.getElementById('inputFiltroTexto').addEventListener('input', filtrarPrestamos);
    document.getElementById('inputFiltroEstado').addEventListener('change', filtrarPrestamos);
    document.getElementById('inputFiltroDevolucion').addEventListener('change', filtrarPrestamos);
    
    const form = document.getElementById('prestamo-form');
    const cancelarBtn = document.getElementById('cancelar-btn');
    form.addEventListener('submit', guardarPrestamo);
    cancelarBtn.addEventListener('click', resetForm);

    // Oculta el campo fecha-real-devolucion al iniciar
    const grupoFechaRealDevolucion = document.getElementById('grupo-fecha-real-devolucion');
    if (grupoFechaRealDevolucion) grupoFechaRealDevolucion.style.display = 'none';

    // --- Apertura automática del modal si la URL contiene ?modal=nuevo ---
    const params = new URLSearchParams(window.location.search);
    if (params.get('modal') === 'nuevo') {
        setTimeout(() => {
            const modal = new bootstrap.Modal(document.getElementById('modalPrestamo'));
            resetForm(); // Limpia el formulario antes de mostrar
            const grupoFechaRealDevolucion = document.getElementById('grupo-fecha-real-devolucion');
            if (grupoFechaRealDevolucion) grupoFechaRealDevolucion.style.display = 'none';
            modal.show();
        }, 300);
    }
});

// Botón "Nuevo Préstamo"
const nuevoBtn = document.querySelector('button[data-bs-toggle="modal"][data-bs-target="#modalPrestamo"]');
if (nuevoBtn) {
    nuevoBtn.addEventListener('click', () => {
        resetForm();
        // Al crear: Ocultar campos de devolución y botón sanciones
        const grupoFechaRealDevolucion = document.getElementById('grupo-fecha-real-devolucion');
        const grupoEstadoDevolucion = document.getElementById('grupo-estado-devolucion');
        const grupoComentarioEstado = document.getElementById('grupo-comentario-estado');
        const btnSancionesModal = document.getElementById('btnSancionesModal');
        
        if (grupoFechaRealDevolucion) grupoFechaRealDevolucion.style.display = 'none';
        if (grupoEstadoDevolucion) grupoEstadoDevolucion.style.display = 'none';
        if (grupoComentarioEstado) grupoComentarioEstado.style.display = 'none';
        if (btnSancionesModal) btnSancionesModal.style.display = 'none';
        
        // Cambiar título del modal
        document.getElementById('modalTitulo').textContent = 'Nuevo Préstamo';
    });
}

let prestamosData = [];

function cargarPrestamos() {
    fetch('/api/prestamos', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
        .then(async res => {
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || errorData.message || 'Error al cargar préstamos');
            }
            return res.json();
        })
        .then(data => {
            prestamosData = data;
            mostrarPrestamos(data);
        })
        .catch(err => {
            console.error('Error cargando préstamos:', err);
            mostrarAlerta('Error al cargar préstamos: ' + err.message, 'danger');
        });
}

function mostrarPrestamos(prestamos) {
    const tbody = document.querySelector('#prestamos-table tbody');
    tbody.innerHTML = '';
    if (prestamos.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="11" class="text-center text-muted">No hay registros que coincidan con los filtros seleccionados.</td>`;
        tbody.appendChild(tr);
        return;
    }
    prestamos.forEach(prestamo => {
        let estadoBadge = '';
        if (prestamo.ESTADO_DEVOLUCION === 'B') {
            estadoBadge = '<span class="badge badge-success">Bueno</span>';
        } else if (prestamo.ESTADO_DEVOLUCION) {
            estadoBadge = '<span class="badge badge-danger">' + (prestamo.ESTADO_DEVOLUCION === 'R' ? 'Regular' : 'Dañado') + '</span>';
        } else {
            estadoBadge = '';
        }
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${prestamo.NOMBRE_SOCIO || ''} ${prestamo.APELLIDO_SOCIO || ''}</td>
            <td>${prestamo.NOMBRE_MATERIAL || ''}</td>
            <td>${prestamo.NOMBRE_BIBLIOTECARIO || ''} ${prestamo.APELLIDO_BIBLIOTECARIO || ''}</td>
            <td>${prestamo.TIPO_PRESTAMO || ''}</td>
            <td>${prestamo.FECHA_PRESTAMO ? formatearFechaDMY(prestamo.FECHA_PRESTAMO) : ''}</td>
            <td>${prestamo.LIMITE_DEVOLUCION ? formatearFechaDMY(prestamo.LIMITE_DEVOLUCION) : ''}</td>
            <td>${prestamo.DEVOLUCION ? formatearFechaDMY(prestamo.DEVOLUCION) : ''}</td>
            <td>${prestamo.COMENTARIO || ''}</td>
            <td>${prestamo.COMENTARIO_ESTADO || ''}</td>
            <td>${estadoBadge}</td>
            <td>
                <div class="d-flex gap-2 justify-content-center">
                    <button class="btn btn-sm btn-outline-primary" data-bs-toggle="modal" data-bs-target="#modalPrestamo" onclick="editarPrestamo(${prestamo.PRESTAMO_ID})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="eliminarPrestamo(${prestamo.PRESTAMO_ID})"><i class="fas fa-trash-alt"></i></button>
                    <button class="btn btn-sm btn-warning ver-sanciones-prestamo" data-socio-id="${prestamo.SOCIO_ID}" data-prestamo-id="${prestamo.PRESTAMO_ID}">
                        <i class="fas fa-ban"></i> Sanciones
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Agregar event listeners para los botones de sanciones
    document.querySelectorAll('.ver-sanciones-prestamo').forEach(button => {
        button.addEventListener('click', function() {
            const socioId = this.getAttribute('data-socio-id');
            const prestamoId = this.getAttribute('data-prestamo-id');
            mostrarSancionesPrestamo(socioId, prestamoId);
        });
    });
}

function cargarSocios() {
    fetch('/api/socios')
        .then(res => res.json())
        .then(data => {
            const select = document.getElementById('socio-select');
            select.innerHTML = '<option value="">Seleccione un socio</option>';
            data.forEach(socio => {
                select.innerHTML += `<option value="${socio.SOCIO_ID}">${socio.NOMBRE}</option>`;
            });
        });
}

function cargarMateriales() {
    fetch('/api/materiales')
        .then(res => res.json())
        .then(data => {
            const select = document.getElementById('material-select');
            select.innerHTML = '<option value="">Seleccione un material</option>';
            data.forEach(mat => {
                select.innerHTML += `<option value="${mat.NUMERO_ID}">${mat.NOMBRE}</option>`;
            });
        });
}

function cargarBibliotecarios() {
    fetch('/api/bibliotecarios')
        .then(res => res.json())
        .then(data => {
            const select = document.getElementById('bibliotecario-select');
            select.innerHTML = '<option value="">Seleccione un bibliotecario</option>';
            data.forEach(bib => {
                select.innerHTML += `<option value="${bib.BIBLIOTECARIO_ID}">${bib.NOMBRE} ${bib.APELLIDO || ''}</option>`;
            });
        });
}

function mostrarMensajeExito(msg) {
    let alert = document.getElementById('alert-exito');
    if (!alert) {
        alert = document.createElement('div');
        alert.id = 'alert-exito';
        alert.className = 'alert alert-success position-fixed top-0 start-50 translate-middle-x mt-3 shadow';
        alert.style.zIndex = 2000;
        document.body.appendChild(alert);
    }
    alert.textContent = msg;
    alert.style.display = 'block';
    setTimeout(() => { alert.style.display = 'none'; }, 2500);
}

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

function guardarPrestamo(e) {
    e.preventDefault();
    const id = document.getElementById('prestamo-id').value;
    const socio_id = parseInt(document.getElementById('socio-select').value) || null;
    const numero_id = parseInt(document.getElementById('material-select').value) || null;
    const bibliotecario_id = parseInt(document.getElementById('bibliotecario-select').value) || null;
    const tipo_prestamo = document.getElementById('tipo-prestamo').value;
    const fecha_prestamo = document.getElementById('fecha-prestamo').value;
    const fecha_devolucion = document.getElementById('fecha-devolucion').value;
    const fecha_real_devolucion = document.getElementById('fecha-real-devolucion').value;
    const estado_devolucion = document.getElementById('estado-devolucion').value;
    const comentario = document.getElementById('comentario').value;
    const comentario_estado = document.getElementById('comentario-estado').value;
    // Validación obligatoria para comentario
    if (!comentario || comentario.trim() === '') {
        mostrarAlerta('El campo Comentario es obligatorio.', 'danger');
        return;
    }
    const data = {
        SOCIO_ID: socio_id,
        NUMERO_ID: numero_id,
        BIBLIOTECARIO_ID: bibliotecario_id,
        TIPO_PRESTAMO: tipo_prestamo,
        FECHA_PRESTAMO: fecha_prestamo,
        LIMITE_DEVOLUCION: fecha_devolucion,
        COMENTARIO: comentario,
        COMENTARIO_ESTADO: comentario_estado !== undefined && comentario_estado !== null ? comentario_estado : ''
    };
    if (fecha_real_devolucion) data.DEVOLUCION = fecha_real_devolucion;
    if (estado_devolucion) data.ESTADO_DEVOLUCION = estado_devolucion;
    let url = '/api/prestamos';
    let method = 'POST';
    if (id) {
        url += `/${id}`;
        method = 'PUT';
    }
    fetch(url, {
        method,
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
    })
    .then(async res => {
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || errorData.message || 'Error desconocido');
        }
        return res.json();
    })
    .then(resp => {
        mostrarAlerta(id ? 'Préstamo actualizado correctamente' : 'Préstamo creado correctamente', 'success');
        cargarPrestamos();
        resetForm();
        const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalPrestamo'));
        modal.hide();
    })
    .catch(err => {
        console.error('Error en operación:', err);
        mostrarAlerta(err.message, 'danger');
    });
}

function editarPrestamo(id) {
    console.log('🔍 EDITAR PRESTAMO - ID:', id);
    
    fetch(`/api/prestamos/${id}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
        .then(async res => {
            console.log('🔍 EDITAR PRESTAMO - Response status:', res.status);
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || errorData.message || 'Error al cargar préstamo');
            }
            return res.json();
        })
        .then(prestamo => {
            console.log('🔍 EDITAR PRESTAMO - Datos recibidos:', prestamo);
            
            document.getElementById('prestamo-id').value = prestamo.PRESTAMO_ID;
            document.getElementById('socio-select').value = prestamo.SOCIO_ID;
            document.getElementById('material-select').value = prestamo.NUMERO_ID;
            document.getElementById('bibliotecario-select').value = prestamo.BIBLIOTECARIO_ID;
            document.getElementById('tipo-prestamo').value = prestamo.TIPO_PRESTAMO || 'I';
            let fechaPrestamo = '';
            if (prestamo.FECHA_PRESTAMO) {
                const d = new Date(prestamo.FECHA_PRESTAMO);
                if (!isNaN(d)) fechaPrestamo = d.toISOString().slice(0, 10);
            }
            let fechaLimite = '';
            if (prestamo.LIMITE_DEVOLUCION) {
                // Acepta tanto formato string como Date
                let d = new Date(prestamo.LIMITE_DEVOLUCION);
                if (!isNaN(d)) {
                    fechaLimite = d.toISOString().slice(0, 10);
                } else if (typeof prestamo.LIMITE_DEVOLUCION === 'string' && prestamo.LIMITE_DEVOLUCION.length >= 10) {
                    fechaLimite = prestamo.LIMITE_DEVOLUCION.slice(0, 10);
                }
            }
            let fechaDevolucion = '';
            if (prestamo.DEVOLUCION) {
                const d = new Date(prestamo.DEVOLUCION);
                if (!isNaN(d)) fechaDevolucion = d.toISOString().slice(0, 10);
            }
            document.getElementById('fecha-prestamo').value = fechaPrestamo;
            document.getElementById('fecha-devolucion').value = fechaLimite;
            document.getElementById('fecha-real-devolucion').value = fechaDevolucion;
            document.getElementById('estado-devolucion').value = prestamo.ESTADO_DEVOLUCION || '';
            document.getElementById('comentario').value = prestamo.COMENTARIO || '';
            document.getElementById('comentario-estado').value = prestamo.COMENTARIO_ESTADO || '';
            document.getElementById('cancelar-btn').style.display = '';
            
            // Al editar: Mostrar TODOS los campos incluyendo los de devolución
            const grupoFechaRealDevolucion = document.getElementById('grupo-fecha-real-devolucion');
            const grupoEstadoDevolucion = document.getElementById('grupo-estado-devolucion');
            const grupoComentarioEstado = document.getElementById('grupo-comentario-estado');
            
            if (grupoFechaRealDevolucion) grupoFechaRealDevolucion.style.display = '';
            if (grupoEstadoDevolucion) grupoEstadoDevolucion.style.display = '';
            if (grupoComentarioEstado) grupoComentarioEstado.style.display = '';
            
            // Cambiar título del modal
            document.getElementById('modalTitulo').textContent = 'Editar Préstamo';
        })
        .catch(err => {
            console.error('❌ EDITAR PRESTAMO - Error:', err);
            mostrarAlerta('Error al cargar datos del préstamo: ' + err.message, 'danger');
        });
        
    // Mostrar los campos de devolución cuando se edita (redundante pero asegura que se muestren)
    const grupoFechaRealDevolucion = document.getElementById('grupo-fecha-real-devolucion');
    if (grupoFechaRealDevolucion) grupoFechaRealDevolucion.style.display = '';
}

function eliminarPrestamo(id) {
    // Buscar información del préstamo para mostrar mensaje más específico
    const prestamo = prestamosData.find(p => p.PRESTAMO_ID == id);
    
    let titulo = '¿Eliminar préstamo?';
    let mensaje = '¿Está seguro de eliminar este préstamo?';
    
    if (prestamo) {
        const socio = prestamo.NOMBRE_SOCIO ? `${prestamo.NOMBRE_SOCIO} ${prestamo.APELLIDO_SOCIO || ''}`.trim() : 'Socio desconocido';
        const material = prestamo.NOMBRE_MATERIAL || 'Material desconocido';
        const fecha = prestamo.FECHA_PRESTAMO ? formatearFechaDMY(prestamo.FECHA_PRESTAMO) : 'Fecha desconocida';
        
        mensaje = `<strong>${material}</strong><br><small class="text-muted">${socio} • ${fecha}</small>`;
    }
    
    Swal.fire({
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
    }).then((result) => {
        if (result.isConfirmed) {
            // Proceder con la eliminación
            fetch(`/api/prestamos/${id}`, { 
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            .then(async res => {
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || errorData.message || 'Error al eliminar préstamo');
                }
                return res.json();
            })
            .then(() => {
                const mensajeExito = prestamo ? 
                    `Préstamo eliminado: ${prestamo.NOMBRE_MATERIAL || 'Material'}` :
                    'Préstamo eliminado correctamente';
                
                Swal.fire({
                    title: '¡Eliminado!',
                    text: mensajeExito,
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    width: '300px',
                    padding: '1rem'
                });
                
                cargarPrestamos();
            })
            .catch(err => {
                console.error('Error al eliminar préstamo:', err);
                Swal.fire({
                    title: 'Error',
                    text: err.message,
                    icon: 'error',
                    width: '300px',
                    padding: '1rem'
                });
            });
        }
    });
}

function resetForm() {
    document.getElementById('prestamo-form').reset();
    document.getElementById('prestamo-id').value = '';
    document.getElementById('comentario-estado').value = '';
    document.getElementById('cancelar-btn').style.display = 'none';

    const grupoFechaRealDevolucion = document.getElementById('grupo-fecha-real-devolucion');
    if (grupoFechaRealDevolucion) grupoFechaRealDevolucion.style.display = 'none';
}

function filtrarPrestamos() {
    const texto = document.getElementById('inputFiltroTexto').value.toLowerCase();
    const tipo = document.getElementById('inputFiltroEstado').value;
    const devolucion = document.getElementById('inputFiltroDevolucion').value.toLowerCase().replace(/\s/g, '_');
    let filtrados = prestamosData.filter(p => {
        let coincideTexto =
            (p.NOMBRE_SOCIO && p.NOMBRE_SOCIO.toLowerCase().includes(texto)) ||
            (p.APELLIDO_SOCIO && p.APELLIDO_SOCIO.toLowerCase().includes(texto)) ||
            (p.NOMBRE_MATERIAL && p.NOMBRE_MATERIAL.toLowerCase().includes(texto));
        if (texto && !coincideTexto) return false;
        if (tipo && p.TIPO_PRESTAMO !== tipo) return false;
        // Considera devuelto si DEVOLUCION tiene valor no vacío/no nulo/no undefined
        const estaDevuelto = p.DEVOLUCION !== null && p.DEVOLUCION !== undefined && String(p.DEVOLUCION).trim() !== '';
        if (devolucion === 'devuelto' && !estaDevuelto) return false;
        if (devolucion === 'sin_devolver' && estaDevuelto) return false;
        return true;
    });
    mostrarPrestamos(filtrados);
}

function extraerMensajeRaiserror(resp) {
    // Busca en odbcErrors o en el mensaje plano
    let msg = resp && resp.error ? resp.error : '';
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

const mensajesTriggers = {
    'este préstamo ya fue devuelto. no se puede modificar la devolución nuevamente.': 'No puedes modificar la devolución de un préstamo ya devuelto.',
    'el material ya está prestado y no está disponible para préstamo.': 'El material seleccionado no está disponible para préstamo.',
    'el socio ha alcanzado el límite de préstamos permitidos para su rango/categoría.': 'Límite de préstamos alcanzado para el rango/categoría del socio.',
    'el socio no cumple con la antigüedad mínima requerida para realizar préstamos.': 'El socio no cumple la antigüedad mínima para realizar préstamos.',
    'este material es restringido y solo puede ser prestado a socios internos.': 'Material restringido: solo socios internos pueden solicitarlo.',
    'no cumple con las condiciones para prestar este material restringido.': 'No cumples con las condiciones para este material restringido.',
    'se ha aplicado una sanción por devolución tardía.': 'Atención: se aplicó una sanción por devolución tardía.',
    'el socio ya tiene el máximo de sanciones permitidas.': 'El socio ya tiene el máximo de sanciones permitidas.'
};

// =================== FUNCIONALIDAD DE SANCIONES ===================
let socioIdActualSancion = null;
let prestamoIdActualSancion = null;

async function mostrarSancionesPrestamo(socioId, prestamoId) {
    socioIdActualSancion = socioId;
    prestamoIdActualSancion = prestamoId;
    
    const modalSanciones = new bootstrap.Modal(document.getElementById('modalSanciones'));
    const modalSancionesBody = document.getElementById('modalSancionesBody');
    const btnAgregarSancionModal = document.getElementById('btnAgregarSancionModal');
    const formAgregarSancionContainer = document.getElementById('formAgregarSancionContainer');
    
    // Resetear el estado del modal
    if (formAgregarSancionContainer) formAgregarSancionContainer.style.display = 'none';
    if (btnAgregarSancionModal) btnAgregarSancionModal.style.display = 'none';
    
    modalSancionesBody.innerHTML = `<div class="text-center"><div class="spinner-border" role="status"></div></div>`;
    modalSanciones.show();

    try {
        const response = await fetch(`/api/socios/${socioId}/sanciones-y-estado`);
        if (!response.ok) throw new Error('No se pudo cargar sanciones activas.');

        const data = await response.json();
        const sanciones = data.sanciones;

        let html = '';
        if (!sanciones || sanciones.length === 0) {
            html = '<p class="text-success">Sin sanciones activas</p>';
            if (btnAgregarSancionModal) btnAgregarSancionModal.style.display = '';
        } else {
            if (btnAgregarSancionModal) btnAgregarSancionModal.style.display = 'none';
            html = sanciones.map(sancion => {
                let diasRestantes = '';
                if (sancion.fecha_fin) {
                    const hoy = new Date();
                    const fechaFin = new Date(sancion.fecha_fin);
                    const diffMs = fechaFin.setHours(0,0,0,0) - hoy.setHours(0,0,0,0);
                    let diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;
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
    
    if (formAgregarSancionContainer) formAgregarSancionContainer.style.display = 'none';
    const formAgregarSancion = document.getElementById('formAgregarSancion');
    if (formAgregarSancion) formAgregarSancion.reset();
}

// Event listeners para el modal de sanciones (se ejecutan una sola vez)
document.addEventListener('DOMContentLoaded', function() {
    const btnAgregarSancionModal = document.getElementById('btnAgregarSancionModal');
    const btnCancelarAgregarSancion = document.getElementById('btnCancelarAgregarSancion');
    const formAgregarSancion = document.getElementById('formAgregarSancion');
    const formAgregarSancionContainer = document.getElementById('formAgregarSancionContainer');

    if (btnAgregarSancionModal) {
        btnAgregarSancionModal.addEventListener('click', function() {
            formAgregarSancionContainer.style.display = '';
            btnAgregarSancionModal.style.display = 'none';
        });
    }

    if (btnCancelarAgregarSancion) {
        btnCancelarAgregarSancion.addEventListener('click', function(e) {
            e.preventDefault();
            formAgregarSancionContainer.style.display = 'none';
            btnAgregarSancionModal.style.display = '';
        });
    }

    if (formAgregarSancion) {
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
                const modalSanciones = bootstrap.Modal.getInstance(document.getElementById('modalSanciones'));
                modalSanciones.hide();
                
                mostrarAlerta('Sanción agregada correctamente', 'success');
                cargarPrestamos(); // Recargar para reflejar cambios
            } catch (err) {
                mostrarAlerta('Error al agregar sanción: ' + err.message, 'danger');
            }
        });
    }
});
