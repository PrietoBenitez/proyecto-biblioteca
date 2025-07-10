const institucionesModel = require('../models/instituciones.model');

// Obtener todas las instituciones (con filtro por texto)
exports.getAllInstituciones = async (req, res) => {
    try {
        const texto = req.query.texto || '';
        const instituciones = await institucionesModel.getAllInstituciones(texto);
        res.json(instituciones);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener una institución por ID
exports.getInstitucionById = async (req, res) => {
    try {
        const institucion = await institucionesModel.getInstitucionById(req.params.id);
        if (!institucion) return res.status(404).json({ message: 'Institución no encontrada' });
        res.json(institucion);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Crear institución
exports.createInstitucion = async (req, res) => {
    try {
        const { INSTITUCION_ID, INSTITUCION } = req.body;
        if (!INSTITUCION_ID || !INSTITUCION) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }
        await institucionesModel.createInstitucion({ INSTITUCION_ID, INSTITUCION });
        res.status(201).json({ message: 'Institución creada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Actualizar institución
exports.updateInstitucion = async (req, res) => {
    try {
        const { INSTITUCION } = req.body;
        if (!INSTITUCION) {
            return res.status(400).json({ error: 'El nombre de la institución es obligatorio' });
        }
        await institucionesModel.updateInstitucion(req.params.id, { INSTITUCION });
        res.json({ message: 'Institución actualizada correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar institución
exports.deleteInstitucion = async (req, res) => {
    try {
        await institucionesModel.deleteInstitucion(req.params.id);
        res.json({ message: 'Institución eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
