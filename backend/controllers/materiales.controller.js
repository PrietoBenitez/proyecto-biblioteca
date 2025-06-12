const { format } = require('path');
const { getConnection } = require('../config/db');
const materialesModel = require('../models/materiales.model');


// Obtener todos los materiales
exports.getAllMateriales = async (req, res) => {
    try {
        const materiales = await materialesModel.getAllMateriales();
        res.json(materiales);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener un material por ID
exports.getMaterialById = async (req, res) => {
    const { id } = req.params;
    try {
        const material = await materialesModel.getMaterialById(id);
        if (!material) {
            return res.status(404).json({ message: 'Material no encontrado' });
        }
        res.json(material);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Crear un nuevo material
exports.createMaterial = async (req, res) => {
    const material = req.body;
    const {
        nombre, categoria, subtipo, tipo_material, formato, ubicacion,
        valor_estimado, pais_origen, descripcion, estado, es_restringido,
        donado, nombre_donante, fecha_donacion, estado_al_donar,
    } = material;

    if (!nombre || !categoria || !subtipo || !tipo_material || !formato || !ubicacion || !valor_estimado || !pais_origen) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    try {
        await materialesModel.createMaterial(material);
        res.status(201).json({ message: 'Material creado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Actualizar un material existente
exports.updateMaterial = async (req, res) => {
    const { id } = req.params;
    const material = req.body;

    try {
        const result = await materialesModel.updateMaterial(id, material);

        if (!result || result.affectedRows === 0 || result.count === 0) {
            return res.status(404).json({ message: 'Material no encontrado' });
        }

        res.json({ message: 'Material actualizado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar un material
exports.deleteMaterial = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await materialesModel.deleteMaterial(id);

        if (!result || result.affectedRows === 0 || result.count === 0) {
            return res.status(404).json({ message: 'Material no encontrado' });
        }

        res.json({ message: 'Material eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// // Obtener estados únicos de la tabla Materiales
// exports.getEstadosUnicos = async (req, res) => {
//     try {
//         const estados = await materialesModel.getEstadosUnicos();
//         res.json(estados);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// Filtrar materiales por texto y estado (con paginación)
exports.getMaterialesFiltrados = async (req, res) => {
    try {
        const { texto, estado, page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;
        const { materiales, total } = await materialesModel.getMaterialesFiltrados(texto, estado, pageNum, limitNum);
        res.json({ materiales, total, page: pageNum, limit: limitNum });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
