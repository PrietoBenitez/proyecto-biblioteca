// frontend/public/js/prestamos.js

document.addEventListener('DOMContentLoaded', () => {
    cargarPrestamos();
    cargarSocios();
    cargarMateriales();
    cargarBibliotecarios();
    
    const form = document.getElementById('prestamo-form');
    const cancelarBtn = document.getElementById('cancelar-btn');
    form.addEventListener('submit', guardarPrestamo);
    cancelarBtn.addEventListener('click', resetForm);
});

function cargarPrestamos() {
    fetch('/api/prestamos')
        .then(res => res.json())
        .then(data => mostrarPrestamos(data))
        .catch(err => console.error('Error cargando préstamos:', err));
}

function mostrarPrestamos(prestamos) {
    const tbody = document.querySelector('#prestamos-table tbody');
    tbody.innerHTML = '';
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
            <td>${prestamo.PRESTAMO_ID}</td>
            <td>${prestamo.NOMBRE_SOCIO || ''} ${prestamo.APELLIDO_SOCIO || ''}</td>
            <td>${prestamo.NOMBRE_MATERIAL || ''}</td>
            <td>${prestamo.NOMBRE_BIBLIOTECARIO || ''} ${prestamo.APELLIDO_BIBLIOTECARIO || ''}</td>
            <td>${prestamo.TIPO_PRESTAMO || ''}</td>
            <td>${prestamo.FECHA_PRESTAMO ? prestamo.FECHA_PRESTAMO.split('T')[0] : ''}</td>
            <td>${prestamo.LIMITE_DEVOLUCION ? prestamo.LIMITE_DEVOLUCION.split('T')[0] : ''}</td>
            <td>${prestamo.FECHA_DEVOLUCION ? prestamo.FECHA_DEVOLUCION.split('T')[0] : ''}</td>
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

function guardarPrestamo(e) {
    e.preventDefault();
    const id = document.getElementById('prestamo-id').value;
    const socio_id = document.getElementById('socio-select').value;
    const numero_id = document.getElementById('material-select').value;
    const bibliotecario_id = document.getElementById('bibliotecario-select').value;
    const fecha_prestamo = document.getElementById('fecha-prestamo').value;
    const fecha_devolucion = document.getElementById('fecha-devolucion').value;
    const comentario = document.getElementById('comentario').value;
    // Si tienes un campo para tipo_prestamo, úsalo. Si no, por defecto 'I'
    const tipo_prestamo = 'I';
    // Los siguientes campos no están en el formulario, pero deben enviarse
    const devolucion = null;
    const estado_devolucion = null;
    const comentario_estado = '';
    const data = {
        SOCIO_ID: socio_id,
        NUMERO_ID: numero_id,
        BIBLIOTECARIO_ID: bibliotecario_id,
        FECHA_PRESTAMO: fecha_prestamo,
        LIMITE_DEVOLUCION: fecha_devolucion,
        COMENTARIO: comentario || '',
        TIPO_PRESTAMO: tipo_prestamo,
        DEVOLUCION: devolucion,
        ESTADO_DEVOLUCION: estado_devolucion,
        COMENTARIO_ESTADO: comentario_estado
    };
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
    .then(res => res.json())
    .then(resp => {
        if (!resp.error) {
            mostrarMensajeExito(id ? 'Préstamo actualizado correctamente' : 'Préstamo creado correctamente');
            cargarPrestamos();
            resetForm();
            // Cierra el modal si está abierto
            const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalPrestamo'));
            modal.hide();
        } else {
            alert('Error: ' + resp.error);
        }
    })
    .catch(err => alert('Error guardando préstamo: ' + err));
}

function editarPrestamo(id) {
    fetch(`/api/prestamos/${id}`)
        .then(res => res.json())
        .then(prestamo => {
            document.getElementById('prestamo-id').value = prestamo.PRESTAMO_ID;
            document.getElementById('socio-select').value = prestamo.SOCIO_ID;
            document.getElementById('material-select').value = prestamo.NUMERO_ID;
            document.getElementById('bibliotecario-select').value = prestamo.BIBLIOTECARIO_ID;
            document.getElementById('fecha-prestamo').value = prestamo.FECHA_PRESTAMO ? prestamo.FECHA_PRESTAMO.split('T')[0] : '';
            document.getElementById('fecha-devolucion').value = prestamo.FECHA_DEVOLUCION ? prestamo.FECHA_DEVOLUCION.split('T')[0] : '';
            document.getElementById('cancelar-btn').style.display = '';
        });
}

function eliminarPrestamo(id) {
    if (!confirm('¿Está seguro de eliminar este préstamo?')) return;
    fetch(`/api/prestamos/${id}`, { method: 'DELETE' })
        .then(() => cargarPrestamos());
}

function resetForm() {
    document.getElementById('prestamo-form').reset();
    document.getElementById('prestamo-id').value = '';
    document.getElementById('cancelar-btn').style.display = 'none';
}
