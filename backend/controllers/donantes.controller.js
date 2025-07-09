const donantesModel = require('../models/donantes.model');

// Obtener todos los donantes
exports.getAllDonantes = async (req, res) => {
    try {
        console.log('GET /api/donantes');
        const donantes = await donantesModel.getAllDonantes();
        res.json(donantes.map(donante => ({
            id: donante.DONANTE_ID,
            nombre: donante.NOMBRE,
            apellido: donante.APELLIDO,
            cedula: donante.CEDULA
        })));
    } catch (error) {
        console.error('Error GET /api/donantes:', error);
        res.status(500).json({ error: error.message });
    }
};

// Obtener un donante por ID
exports.getDonanteById = async (req, res) => {
    const { id } = req.params;
    try {
        console.log('GET /api/donantes/' + id);
        const donante = await donantesModel.getDonanteById(id);
        if (!donante) {
            return res.status(404).json({ message: 'Donante no encontrado' });
        }
        res.json({
            id: donante.DONANTE_ID,
            nombre: donante.NOMBRE,
            apellido: donante.APELLIDO,
            cedula: donante.CEDULA
        });
    } catch (error) {
        console.error('Error GET /api/donantes/:id:', error);
        res.status(500).json({ error: error.message });
    }
};

// Crear un nuevo donante
exports.createDonante = async (req, res) => {
    try {
        console.log('POST /api/donantes body:', req.body);
        const nuevoDonante = await donantesModel.createDonante(req.body);
        console.log('Insert result:', nuevoDonante);
        // Consulta el donante recién creado para devolver todos los campos correctamente
        const donanteCompleto = await donantesModel.getDonanteById(nuevoDonante.insertId);
        console.log('Donante completo:', donanteCompleto);
        res.status(201).json({
            message: 'Donante creado exitosamente',
            donante: {
                id: donanteCompleto.DONANTE_ID,
                nombre: donanteCompleto.NOMBRE,
                apellido: donanteCompleto.APELLIDO,
                cedula: donanteCompleto.CEDULA
            }
        });
    } catch (error) {
        console.error('Error creando donante:', error);
        res.status(500).json({ error: error.message });
    }
};

// Actualizar un donante
exports.updateDonante = async (req, res) => {
    const { id } = req.params;
    try {
        console.log('PUT /api/donantes/' + id, 'body:', req.body);
        const actualizado = await donantesModel.updateDonante(id, req.body);
        console.log('Update result:', actualizado);
        if (!actualizado) {
            return res.status(404).json({ message: 'Donante no encontrado' });
        }
        res.json({ message: 'Donante actualizado correctamente' });
    } catch (error) {
        console.error('Error actualizando donante:', error);
        res.status(500).json({ error: error.message });
    }
};

// Eliminar un donante
exports.deleteDonante = async (req, res) => {
    const { id } = req.params;
    try {
        console.log('DELETE /api/donantes/' + id);
        const eliminado = await donantesModel.deleteDonante(id);
        console.log('Delete result:', eliminado);
        if (!eliminado) {
            return res.status(404).json({ message: 'Donante no encontrado' });
        }
        res.json({ message: 'Donante eliminado correctamente' });
    } catch (error) {
        console.error('Error eliminando donante:', error);
        res.status(500).json({ error: error.message });
    }
};

// Obtener selects para formulario de donantes
exports.getSelects = async (req, res) => {
    try {
        const selects = {};
        res.json(selects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener donantes filtrados
exports.getDonantesFiltrados = async (req, res) => {
    const { texto, cedula, page = 1, limit = 10 } = req.query;
    try {
        const donantes = await donantesModel.getAllDonantes();
        // Filtrar resultados según los parámetros
        const filtrados = donantes.filter(donante => {
            return (
                (!texto || (donante.NOMBRE && donante.NOMBRE.includes(texto)) || (donante.APELLIDO && donante.APELLIDO.includes(texto))) &&
                (!cedula || (donante.CEDULA && donante.CEDULA.includes(cedula)))
            );
        });
        // Paginación
        const inicio = (page - 1) * limit;
        const paginados = filtrados.slice(inicio, inicio + limit);
        // Transformar los campos para el frontend
        const paginadosTransformados = paginados.map(donante => ({
            id: donante.DONANTE_ID,
            nombre: donante.NOMBRE,
            apellido: donante.APELLIDO,
            cedula: donante.CEDULA
        }));
        res.json({ donantes: paginadosTransformados, total: filtrados.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};