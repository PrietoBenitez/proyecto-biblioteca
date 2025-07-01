// frontend/public/js/prestamos.js

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
});

let prestamosData = [];

function cargarPrestamos() {
    fetch('/api/prestamos')
        .then(res => res.json())
        .then(data => {
            prestamosData = data;
            mostrarPrestamos(data);
        })
        .catch(err => console.error('Error cargando préstamos:', err));
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
            <td>${prestamo.FECHA_PRESTAMO ? prestamo.FECHA_PRESTAMO.split('T')[0] : ''}</td>
            <td>${prestamo.LIMITE_DEVOLUCION ? prestamo.LIMITE_DEVOLUCION.split('T')[0] : ''}</td>
            <td>${prestamo.DEVOLUCION ? prestamo.DEVOLUCION.split('T')[0] : ''}</td>
            <td>${prestamo.COMENTARIO || ''}</td>
            <td>${prestamo.COMENTARIO_ESTADO || ''}</td>
            <td>${estadoBadge}</td>
            <td>
                <div class="d-flex gap-2 justify-content-center">
                    <button class="btn btn-sm btn-outline-primary" data-bs-toggle="modal" data-bs-target="#modalPrestamo" onclick="editarPrestamo(${prestamo.PRESTAMO_ID})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="eliminarPrestamo(${prestamo.PRESTAMO_ID})"><i class="fas fa-trash-alt"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(async res => {
        let resp;
        try {
            resp = await res.json();
        } catch (e) {
            // Si la respuesta no es JSON (por ejemplo, error HTML), muestra mensaje genérico
            mostrarAlerta('Error inesperado del servidor.', 'danger');
            throw e;
        }
        return resp;
    })
    .then(resp => {
        if (!resp.error) {
            mostrarAlerta(id ? 'Préstamo actualizado correctamente' : 'Préstamo creado correctamente', 'success');
            cargarPrestamos();
            resetForm();
            const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalPrestamo'));
            modal.hide();
        } else {
            // Extrae y normaliza el mensaje de RAISERROR
            let msg = extraerMensajeRaiserror(resp);
            const msgNorm = normalizarMensaje(msg);
            if (mensajesTriggers[msgNorm]) {
                mostrarAlerta(mensajesTriggers[msgNorm], 'danger');
            } else {
                mostrarAlerta(msg, 'danger');
            }
        }
    })
    .catch(err => {
        if (typeof err === 'string') {
            mostrarAlerta('Error guardando préstamo: ' + err, 'danger');
        } else {
            mostrarAlerta('Error guardando préstamo.', 'danger');
        }
    });
}

function editarPrestamo(id) {
    fetch(`/api/prestamos/${id}`)
        .then(res => res.json())
        .then(prestamo => {
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
        });
}

function eliminarPrestamo(id) {
    if (!confirm('¿Está seguro de eliminar este préstamo?')) return;
    fetch(`/api/prestamos/${id}`, { method: 'DELETE' })
        .then(res => {
            if (!res.ok) throw new Error('Error al eliminar préstamo');
            mostrarMensajeExito('Préstamo eliminado correctamente');
            cargarPrestamos();
        })
        .catch(() => {
            mostrarMensajeExito('Error al eliminar préstamo');
        });
}

function resetForm() {
    document.getElementById('prestamo-form').reset();
    document.getElementById('prestamo-id').value = '';
    document.getElementById('comentario-estado').value = '';
    document.getElementById('cancelar-btn').style.display = 'none';
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
