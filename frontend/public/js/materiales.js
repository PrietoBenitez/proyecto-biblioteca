// Formatea fecha a DD/MM/AAAA
function formatearFechaDMY(fechaStr) {
    const fecha = new Date(fechaStr);
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
}


document.addEventListener('DOMContentLoaded', function() {
    const tablaMateriales = document.getElementById('tablaMateriales');
    const formMaterial = document.getElementById('formMaterial');
    const modalMaterial = new bootstrap.Modal(document.getElementById('modalMaterial'));

    // Inicializar filtroActual con los tres filtros
    let filtroActual = { texto: '', estado: '', condicion: '' };
    let paginaActual = 1;
    const materialesPorPagina = 10;

    cargarMateriales();
    // cargarEstadosUnicos();

    async function cargarMateriales(page = 1) {
        try {
            const params = new URLSearchParams();
            if (filtroActual.texto) params.append('texto', filtroActual.texto);
            if (filtroActual.estado) params.append('estado', filtroActual.estado);
            if (filtroActual.condicion) params.append('condicion', filtroActual.condicion);
            params.append('page', page);
            params.append('limit', materialesPorPagina);

            const url = `/api/materiales/filtrados?${params.toString()}`;
            const response = await fetch(url);
            const data = await response.json();
            // Asegurar que materiales sea siempre un array
            const materiales = Array.isArray(data.materiales) ? data.materiales : [];
            const total = data.total || 0;

            tablaMateriales.querySelector('tbody').innerHTML = '';
            if (!materiales || materiales.length === 0) {
                const filaVacia = document.createElement('tr');
                filaVacia.innerHTML = `<td colspan="17" class="text-center text-muted">No hay registros que coincidan con los filtros seleccionados.</td>`;
                tablaMateriales.querySelector('tbody').appendChild(filaVacia);
            } else {
                materiales.forEach(material => {
                    const estadoBadge = {
                        'D': '<span class="badge bg-success">Disponible</span>',
                        'P': '<span class="badge bg-danger">Prestado</span>',
                        'M': '<span class="badge bg-info text-dark">Mantenimiento</span>',
                        'R': '<span class="badge bg-secondary">Reservado</span>'
                    }[material.estado] || `<span class="badge bg-light text-dark">${material.estado || ''}</span>`;
                    const condicionBadge = {
                        'B': '<span class="badge bg-primary">Bueno</span>',
                        'R': '<span class="badge bg-warning text-dark">Regular</span>',
                        'D': '<span class="badge bg-danger">Dañado</span>'
                    }[material.condicion] || `<span class="badge bg-light text-dark">${material.condicion || ''}</span>`;
                    const formatoDesc = {
                        'C': 'Colección',
                        'T': 'Texto',
                        'P': 'Publicación'
                    }[material.formato] || '';
                    const fila = document.createElement('tr');
                    fila.innerHTML = `
                        <td>${material.nombre}</td>
                        <td>${material.categoria_desc || ''}</td>
                        <td>${material.subtipo_desc || ''}</td>
                        <td>${material.tipo_material || ''}</td>
                        <td>${formatoDesc}</td>
                        <td>${material.ubicacion || ''}</td>
                        <td>${material.valor_estimado || ''}</td>
                        <td>${material.pais_desc || ''}</td>
                        <td>${material.descripcion || ''}</td>
                        <td>${estadoBadge}</td>
                        <td>${material.es_restringido === 'S' ? 'Sí' : 'No'}</td>
                        <td>${material.donado === 'S' ? 'Sí' : 'No'}</td>
                        <td>${(material.donante_nombre || '') + (material.donante_apellido ? ' ' + material.donante_apellido : '')}</td>
                        <td>${material.fecha_donacion ? formatearFechaDMY(material.fecha_donacion) : ''}</td>
                        <td>${material.estado_al_donar || ''}</td>
                        <td>${condicionBadge}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary editar" data-id="${material.id}" title="Editar"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-sm btn-outline-danger eliminar" data-id="${material.id}" title="Eliminar"><i class="fas fa-trash"></i></button>
                        </td>
                    `;
                    tablaMateriales.querySelector('tbody').appendChild(fila);
                });
            }

            document.querySelectorAll('.editar').forEach(btn => {
                btn.addEventListener('click', cargarMaterialParaEditar);
            });
            document.querySelectorAll('.eliminar').forEach(btn => {
                btn.addEventListener('click', eliminarMaterial);
            });

            renderizarPaginacion(total, page);
            paginaActual = page;
        } catch (error) {
            mostrarAlerta('Error al cargar materiales', 'danger');
        }
    }

    function renderizarPaginacion(total, page) {
        const paginacion = document.getElementById('paginacion');
        paginacion.innerHTML = '';
        const totalPaginas = Math.ceil(total / materialesPorPagina);
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
                if (paginaActual !== i) cargarMateriales(i);
            });
            li.appendChild(a);
            paginacion.appendChild(li);
        }
    }

    function getEstadoClass(estado) {
        const clases = {
            'disponible': 'bg-success',
            'prestado': 'bg-warning text-dark',
            'reservado': 'bg-info',
            'en_restauracion': 'bg-secondary',
            'restringido': 'bg-danger'
        };
        return clases[estado] || 'bg-light text-dark';
    }

    formMaterial.addEventListener('submit', async function(e) {
        e.preventDefault();
        const materialId = document.getElementById('materialId').value;
        const url = materialId ? `/api/materiales/${materialId}` : '/api/materiales';
        const method = materialId ? 'PUT' : 'POST';
        // Convierte IDs a número o null
        const subtipo_id = parseInt(document.getElementById('subtipo').value) || null;
        const nacionalidad = parseInt(document.getElementById('pais_origen').value) || null;
        let donante_id = document.getElementById('nombre_donante').value;
        donante_id = donante_id && !isNaN(donante_id) ? Number(donante_id) : null;
        // Validación básica de campos obligatorios
        if (!document.getElementById('nombre').value.trim() || !subtipo_id || !document.getElementById('tipo_material').value.trim()) {
            mostrarAlerta('Complete todos los campos obligatorios (*)', 'danger');
            return;
        }
        // Construcción del objeto materialData con tipos correctos y exclusión de vacíos
        const materialDataRaw = {
            NOMBRE: document.getElementById('nombre').value.trim(),
            SUBTIPO_ID: subtipo_id,
            NACIONALIDAD: nacionalidad,
            DONANTE_ID: donante_id,
            FORMATO: document.getElementById('formato').value.trim() || null,
            UBICACION: document.getElementById('ubicacion').value.trim() || null,
            VALOR_GS: document.getElementById('valor_estimado').value ? Number(document.getElementById('valor_estimado').value) : null,
            TIPO_MATERIAL: document.getElementById('tipo_material').value.trim(),
            CONDICION: document.getElementById('condicion').value || 'B',
            DESCRIPCION: document.getElementById('descripcion').value.trim() || null,
            DISPONIBILIDAD: document.getElementById('estado') ? document.getElementById('estado').value : null,
            RESTRINGIDO: document.getElementById('es_restringido').value || 'N',
            DONADO: document.getElementById('donado').value || 'N',
            FECHA_DONACION: document.getElementById('fecha_donacion').value || null,
            ESTADO_DONACION: document.getElementById('estado_al_donar').value.trim() || null
        };
        // Excluir campos vacíos, nulos o NaN
        const materialData = {};
        for (const [key, value] of Object.entries(materialDataRaw)) {
            if (value === undefined || value === null || value === '' || (typeof value === 'number' && isNaN(value))) continue;
            materialData[key] = value;
        }
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch(url, {
                method: method,
                headers: headers,
                body: JSON.stringify(materialData)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || errorData.message || 'Error desconocido');
            }
            mostrarAlerta(`Material ${materialId ? 'actualizado' : 'creado'} correctamente`, 'success');
            modalMaterial.hide();
            cargarMateriales();
        } catch (error) {
            console.error('Error en operación:', error);
            mostrarAlerta(error.message, 'danger');
        }
    });

    // Cargar selects dinámicos para el formulario de materiales
    async function cargarOpcionesSelectsMateriales() {
        // Categorías
        const categoriaSelect = document.getElementById('categoria');
        if (categoriaSelect) {
            categoriaSelect.innerHTML = '<option value="">Seleccione...</option>';
            try {
                const categorias = await fetch('/api/materiales/categorias').then(r => r.json());
                categorias.forEach(c => {
                    categoriaSelect.innerHTML += `<option value="${c.CATEGORIA_ID}">${c.CATEGORIA}</option>`;
                });
            } catch {}
        }
        // Subtipos
        const subtipoSelect = document.getElementById('subtipo');
        if (subtipoSelect) {
            subtipoSelect.innerHTML = '<option value="">Seleccione...</option>';
            try {
                const subtipos = await fetch('/api/materiales/subtipos').then(r => r.json());
                subtipos.forEach(s => {
                    subtipoSelect.innerHTML += `<option value="${s.SUBTIPO_ID}">${s.SUBTIPO}</option>`;
                });
            } catch {}
        }
        // Países
        const paisSelect = document.getElementById('pais_origen');
        if (paisSelect) {
            paisSelect.innerHTML = '<option value="">Seleccione...</option>';
            try {
                const paises = await fetch('/api/materiales/paises').then(r => r.json());
                paises.forEach(p => {
                    paisSelect.innerHTML += `<option value="${p.NACIONALIDAD}">${p.PAIS}</option>`;
                });
            } catch {}
        }
        // Donantes
        const donanteSelect = document.getElementById('nombre_donante');
        if (donanteSelect) {
            donanteSelect.innerHTML = '<option value="">Seleccione...</option>';
            try {
                const donantes = await fetch('/api/materiales/donantes').then(r => r.json());
                donantes.forEach(d => {
                    donanteSelect.innerHTML += `<option value="${d.DONANTE_ID}">${d.NOMBRE} ${d.APELLIDO || ''}</option>`;
                });
            } catch {}
        }
    }

    // Limpiar y preparar modal para nuevo material
    document.querySelector('[data-bs-target="#modalMaterial"]').addEventListener('click', async function() {
        formMaterial.reset();
        document.getElementById('materialId').value = '';
        document.getElementById('modalTitulo').textContent = 'Nuevo Material';
        await cargarOpcionesSelectsMateriales();
        // Asegura selects en valor vacío
        if(document.getElementById('categoria')) document.getElementById('categoria').value = '';
        if(document.getElementById('subtipo')) document.getElementById('subtipo').value = '';
        if(document.getElementById('pais_origen')) document.getElementById('pais_origen').value = '';
    });

    // Al editar, cargar selects y luego setear valores
    async function cargarMaterialParaEditar(e) {
        const materialId = e.target.closest('button').dataset.id;
        try {
            const response = await fetch(`/api/materiales/${materialId}`);
            if (!response.ok) throw new Error('Material no encontrado');
            const material = await response.json();
            await cargarOpcionesSelectsMateriales(); // Esperar a que los selects estén llenos

            document.getElementById('materialId').value = material.id;
            document.getElementById('nombre').value = material.nombre || '';

            // Setear subtipo y categoría por ID
            const subtipoSelect = document.getElementById('subtipo');
            if (subtipoSelect) {
                subtipoSelect.value = material.subtipo_id || material.subtipo || '';
            }
            const categoriaSelect = document.getElementById('categoria');
            if (categoriaSelect) {
                categoriaSelect.value = material.categoria_id || material.categoria || '';
            }
            document.getElementById('tipo_material').value = material.tipo_material || '';
            document.getElementById('formato').value = material.formato || '';
            document.getElementById('ubicacion').value = material.ubicacion || '';
            document.getElementById('valor_estimado').value = material.valor_estimado || '';

            const paisSelect = document.getElementById('pais_origen');
            if (paisSelect) {
                paisSelect.value = material.nacionalidad || material.pais_origen || '';
            }
            document.getElementById('descripcion').value = material.descripcion || '';
            if(document.getElementById('estado')) document.getElementById('estado').value = material.disponibilidad || material.estado || 'D';
            if(document.getElementById('es_restringido')) document.getElementById('es_restringido').value = material.restringido || material.es_restringido || 'N';
            if(document.getElementById('donado')) document.getElementById('donado').value = material.donado || 'N';

            // Donante por ID, null si no hay
            const donanteSelect = document.getElementById('nombre_donante');
            if (donanteSelect) {
                let donanteValue = material.donante_id || material.nombre_donante || '';
                donanteSelect.value = donanteValue && !isNaN(donanteValue) ? donanteValue : '';
            }
            document.getElementById('fecha_donacion').value = material.fecha_donacion ? material.fecha_donacion.split('T')[0] : '';
            document.getElementById('estado_al_donar').value = material.estado_donacion || material.estado_al_donar || '';
            document.getElementById('condicion').value = material.condicion || 'B';
            document.getElementById('modalTitulo').textContent = 'Editar Material';
            modalMaterial.show();
        } catch (error) {
            mostrarAlerta('Error al cargar material', 'danger');
        }
    }

    // Eliminar material
    async function eliminarMaterial(e) {
        const materialId = e.target.closest('button').dataset.id;
        const fila = e.target.closest('tr');
        
        // Obtener información del material desde la fila de la tabla
        const celdas = fila.querySelectorAll('td');
        const nombre = celdas[0]?.textContent?.trim() || 'Material desconocido';
        const categoria = celdas[1]?.textContent?.trim() || 'Sin categoría';
        const ubicacion = celdas[5]?.textContent?.trim() || 'Sin ubicación';
        
        let titulo = '¿Eliminar material?';
        let mensaje = `<strong>${nombre}</strong><br><small class="text-muted">${categoria} • ${ubicacion}</small>`;
        
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
            const token = localStorage.getItem('token');
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch(`/api/materiales/${materialId}`, {
                method: 'DELETE',
                headers: headers
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || errorData.message || 'Error al eliminar material');
            }

            Swal.fire({
                title: '¡Eliminado!',
                text: `Material eliminado: ${nombre}`,
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                width: '300px',
                padding: '1rem'
            });
            
            cargarMateriales();

        } catch (error) {
            console.error('Error al eliminar material:', error);
            Swal.fire({
                title: 'Error',
                text: error.message,
                icon: 'error',
                width: '300px',
                padding: '1rem'
            });
        }
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

    // async function cargarEstadosUnicos() {
    //     const selectFiltro = document.getElementById('inputFiltroEstado');
    //     if (selectFiltro) selectFiltro.innerHTML = '<option value="">Todos</option>';
    //     const selectForm = document.getElementById('estado');
    //     if (selectForm) selectForm.innerHTML = '';
    //     try {
    //         const response = await fetch('/api/materiales/estados');
    //         const estados = await response.json();
    //         estados.forEach(e => {
    //             const valor = e.estado || e.ESTADO;
    //             if (selectFiltro) selectFiltro.innerHTML += `<option value="${valor}">${valor.charAt(0).toUpperCase() + valor.slice(1)}</option>`;
    //             if (selectForm) selectForm.innerHTML += `<option value="${valor}">${valor.charAt(0).toUpperCase() + valor.slice(1)}</option>`;
    //         });
    //     } catch (err) {
    //         if (selectFiltro) selectFiltro.innerHTML += '<option value="">(Error al cargar)</option>';
    //         if (selectForm) selectForm.innerHTML += '<option value="">(Error al cargar)</option>';
    //     }
    // }

    // Opciones fijas para el filtro de condición (igual que estado)
    const filtroCondicion = document.getElementById('inputFiltroCondicion');
    if (filtroCondicion) {
        filtroCondicion.innerHTML = '';
        filtroCondicion.innerHTML += '<option value="">Todas las condiciones</option>';
        filtroCondicion.innerHTML += '<option value="B">Bueno</option>';
        filtroCondicion.innerHTML += '<option value="R">Regular</option>';
        filtroCondicion.innerHTML += '<option value="D">Dañado</option>';
    }
    // Filtros avanzados
    document.getElementById('inputFiltroTexto').addEventListener('input', function(e) {
        filtroActual.texto = e.target.value;
        cargarMateriales(1);
    });
    document.getElementById('inputFiltroEstado').addEventListener('change', function(e) {
        filtroActual.estado = e.target.value || '';
        cargarMateriales(1);
    });
    document.getElementById('inputFiltroCondicion').addEventListener('change', function(e) {
        filtroActual.condicion = e.target.value || '';
        cargarMateriales(1);
    });
});
