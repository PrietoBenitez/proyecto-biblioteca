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
                    const fila = document.createElement('tr');
                    fila.innerHTML = `
                        <td>${material.nombre}</td>
                        <td>${material.categoria_desc || ''}</td>
                        <td>${material.subtipo_desc || ''}</td>
                        <td>${material.tipo_material || ''}</td>
                        <td>${material.formato || ''}</td>
                        <td>${material.ubicacion || ''}</td>
                        <td>${material.valor_estimado || ''}</td>
                        <td>${material.pais_desc || ''}</td>
                        <td>${material.descripcion || ''}</td>
                        <td>${estadoBadge}</td>
                        <td>${material.es_restringido === 'S' ? 'Sí' : 'No'}</td>
                        <td>${material.donado === 'S' ? 'Sí' : 'No'}</td>
                        <td>${(material.donante_nombre || '') + (material.donante_apellido ? ' ' + material.donante_apellido : '')}</td>
                        <td>${material.fecha_donacion ? material.fecha_donacion.split('T')[0] : ''}</td>
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
        const materialData = {
            NOMBRE: document.getElementById('nombre').value,
            CATEGORIA: document.getElementById('categoria').value, // ID de categoría
            SUBTIPO: document.getElementById('subtipo').value,     // ID de subtipo
            TIPO_MATERIAL: document.getElementById('tipo_material').value,
            FORMATO: document.getElementById('formato').value || null,
            UBICACION: document.getElementById('ubicacion').value || null,
            VALOR_ESTIMADO: document.getElementById('valor_estimado').value || null,
            PAIS_ORIGEN: document.getElementById('pais_origen').value, // ID de país
            DESCRIPCION: document.getElementById('descripcion').value || null,
            ESTADO: document.getElementById('estado') ? document.getElementById('estado').value : null,
            ES_RESTRINGIDO: document.getElementById('es_restringido').value || 0,
            DONADO: document.getElementById('donado').value || 0,
            NOMBRE_DONANTE: document.getElementById('nombre_donante').value, // ID de donante
            FECHA_DONACION: document.getElementById('fecha_donacion').value || null,
            ESTADO_AL_DONAR: document.getElementById('estado_al_donar').value || null
        };
        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(materialData)
            });
            if (!response.ok) throw new Error(await response.text());
            mostrarAlerta(`Material ${materialId ? 'actualizado' : 'creado'} correctamente`, 'success');
            modalMaterial.hide();
            cargarMateriales();
        } catch (error) {
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
            document.getElementById('nombre').value = material.nombre;

            // Selección robusta de selects por ID (como en socios)
            // Primero setear subtipo, luego categoría (la categoría depende del subtipo)
            const subtipoSelect = document.getElementById('subtipo');
            if (subtipoSelect) {
                subtipoSelect.value = '';
                for (let opt of subtipoSelect.options) {
                    if (opt.value == material.subtipo) {
                        subtipoSelect.value = material.subtipo;
                        break;
                    }
                }
            }
            const categoriaSelect = document.getElementById('categoria');
            if (categoriaSelect) {
                categoriaSelect.value = '';
                for (let opt of categoriaSelect.options) {
                    if (opt.value == material.categoria) {
                        categoriaSelect.value = material.categoria;
                        break;
                    }
                }
            }
            document.getElementById('tipo_material').value = material.tipo_material || '';
            document.getElementById('formato').value = material.formato || '';
            document.getElementById('ubicacion').value = material.ubicacion || '';
            document.getElementById('valor_estimado').value = material.valor_estimado || '';

            const paisSelect = document.getElementById('pais_origen');
            if (paisSelect) {
                paisSelect.value = '';
                for (let opt of paisSelect.options) {
                    if (opt.value == material.pais_origen) {
                        paisSelect.value = material.pais_origen;
                        break;
                    }
                }
            }
            document.getElementById('descripcion').value = material.descripcion || '';
            if(document.getElementById('estado')) document.getElementById('estado').value = material.estado || 'D';
            if(document.getElementById('es_restringido')) document.getElementById('es_restringido').value = material.es_restringido || 'N';
            if(document.getElementById('donado')) document.getElementById('donado').value = material.donado || 'N';

            // Donante: buscar por ID, no por nombre
            const donanteSelect = document.getElementById('nombre_donante');
            if (donanteSelect) {
                donanteSelect.value = '';
                for (let opt of donanteSelect.options) {
                    if (opt.value == material.nombre_donante) {
                        donanteSelect.value = material.nombre_donante;
                        break;
                    }
                }
            }
            document.getElementById('fecha_donacion').value = material.fecha_donacion ? material.fecha_donacion.split('T')[0] : '';
            document.getElementById('estado_al_donar').value = material.estado_al_donar || '';
            document.getElementById('condicion').value = material.condicion || 'B';
            document.getElementById('modalTitulo').textContent = 'Editar Material';
            modalMaterial.show();
        } catch (error) {
            mostrarAlerta('Error al cargar material', 'danger');
        }
    }

    // Eliminar material
    async function eliminarMaterial(e) {
        if (!confirm('¿Estás seguro de eliminar este material?')) return;

        const materialId = e.target.closest('button').dataset.id;

        try {
            const response = await fetch(`/api/materiales/${materialId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error(await response.text());

            mostrarAlerta('Material eliminado correctamente', 'success');
            cargarMateriales();

        } catch (error) {
            console.error('Error al eliminar material:', error);
            mostrarAlerta('Error al eliminar material', 'danger');
        }
    }


    function mostrarAlerta(mensaje, tipo) {
        alert(`${tipo.toUpperCase()}: ${mensaje}`);
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
