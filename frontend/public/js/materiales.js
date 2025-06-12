document.addEventListener('DOMContentLoaded', function() {
    const tablaMateriales = document.getElementById('tablaMateriales');
    const formMaterial = document.getElementById('formMaterial');
    const modalMaterial = new bootstrap.Modal(document.getElementById('modalMaterial'));

    let filtroActual = { texto: '', estado: '' };
    let paginaActual = 1;
    const materialesPorPagina = 10;

    cargarMateriales();
    // cargarEstadosUnicos();

    async function cargarMateriales(page = 1) {
        try {
            const params = new URLSearchParams();
            if (filtroActual.texto) params.append('texto', filtroActual.texto);
            if (filtroActual.estado) params.append('estado', filtroActual.estado);
            params.append('page', page);
            params.append('limit', materialesPorPagina);

            const url = `/api/materiales/filtrados?${params.toString()}`;
            const response = await fetch(url);
            const data = await response.json();
            const materiales = data.materiales || [];
            const total = data.total || 0;

            tablaMateriales.querySelector('tbody').innerHTML = '';
            materiales.forEach(material => {
                const fila = document.createElement('tr');
                fila.innerHTML = `
                    <td>${material.nombre}</td>
                    <td>${material.categoria}</td>
                    <td>${material.tipo_material}</td>
                    <td>${material.estado}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary editar" data-id="${material.id}"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-outline-danger eliminar" data-id="${material.id}"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                tablaMateriales.querySelector('tbody').appendChild(fila);
            });

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
            nombre: document.getElementById('nombre').value,
            categoria: document.getElementById('categoria').value,
            subtipo: document.getElementById('subtipo').value,
            tipo_material: document.getElementById('tipo_material').value,
            formato: document.getElementById('formato').value || null,
            ubicacion: document.getElementById('ubicacion').value || null,
            valor_estimado: document.getElementById('valor_estimado').value || null,
            pais_origen: document.getElementById('pais_origen').value || null,
            descripcion: document.getElementById('descripcion').value || null,
            estado: document.getElementById('estado').value,
            es_restringido: document.getElementById('es_restringido').checked ? 1 : 0,
            donado: document.getElementById('donado').checked ? 1 : 0,
            nombre_donante: document.getElementById('nombre_donante').value || null,
            fecha_donacion: document.getElementById('fecha_donacion').value || null,
            estado_al_donar: document.getElementById('estado_al_donar').value || null
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

    async function cargarMaterialParaEditar(e) {
        const materialId = e.target.closest('button').dataset.id;
        try {
            const response = await fetch(`/api/materiales/${materialId}`);
            if (!response.ok) throw new Error('Material no encontrado');
            const material = await response.json();
            document.getElementById('materialId').value = material.id;
            document.getElementById('nombre').value = material.nombre;
            document.getElementById('categoria').value = material.categoria;
            document.getElementById('subtipo').value = material.subtipo;
            document.getElementById('tipo_material').value = material.tipo_material;
            document.getElementById('formato').value = material.formato || '';
            document.getElementById('ubicacion').value = material.ubicacion || '';
            document.getElementById('valor_estimado').value = material.valor_estimado || '';
            document.getElementById('pais_origen').value = material.pais_origen || '';
            document.getElementById('descripcion').value = material.descripcion || '';
            document.getElementById('estado').value = material.estado;
            document.getElementById('es_restringido').checked = !!material.es_restringido;
            document.getElementById('donado').checked = !!material.donado;
            document.getElementById('nombre_donante').value = material.nombre_donante || '';
            document.getElementById('fecha_donacion').value = material.fecha_donacion ? material.fecha_donacion.split('T')[0] : '';
            document.getElementById('estado_al_donar').value = material.estado_al_donar || '';
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

    document.getElementById('inputFiltroTexto').addEventListener('input', function(e) {
        filtroActual.texto = e.target.value;
        cargarMateriales(1);
    });
    document.getElementById('inputFiltroEstado').addEventListener('change', function(e) {
        filtroActual.estado = e.target.value;
        cargarMateriales(1);
    });
});
