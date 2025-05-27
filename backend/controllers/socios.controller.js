// backend/controllers/socios.controller.js
const { getConnection } = require('../config/db');
const sociosModel = require('../models/socios.model');

// Obtener todos los socios
exports.getAllSocios = async (req, res) => {
    try {
        const socios = await sociosModel.getAllSocios();
        res.json(socios);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener un socio por ID
exports.getSocioById = async (req, res) => {
    const { id } = req.params;

    try {
        const socio = await sociosModel.getSocioById(id);
        if (!socio) {
            return res.status(404).json({ message: 'Socio no encontrado' });
        }
        res.json(socio);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Crear un nuevo socio
exports.createSocio = async (req, res) => {
    const socio = req.body;

    const {
        documento_identidad,
        nombre_completo,
        fecha_nacimiento,
        fecha_inscripcion
    } = socio;

    if (!documento_identidad || !nombre_completo || !fecha_nacimiento || !fecha_inscripcion) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    try {
        await sociosModel.createSocio(socio);
        res.status(201).json({ message: 'Socio creado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Actualizar un socio existente
exports.updateSocio = async (req, res) => {
    const { id } = req.params;
    const socio = req.body;

    try {
        const result = await sociosModel.updateSocio(id, socio);

        // Ajusta según el resultado que devuelva tu model (puede ser result.count o result.affectedRows)
        if (!result || result.affectedRows === 0 || result.count === 0) {
            return res.status(404).json({ message: 'Socio no encontrado' });
        }

        res.json({ message: 'Socio actualizado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar un socio
exports.deleteSocio = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await sociosModel.deleteSocio(id);

        // Ajusta según el resultado que devuelva tu model (puede ser result.count o result.affectedRows)
        if (!result || result.affectedRows === 0 || result.count === 0) {
            return res.status(404).json({ message: 'Socio no encontrado' });
        }

        res.json({ message: 'Socio eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Filtrar socios por texto y estado (SQL)
exports.getSociosFiltrados = async (req, res) => {
    try {
        const { texto, estado } = req.query;
        const socios = await sociosModel.getSociosFiltrados(texto, estado);
        res.json(socios);
    } catch (error) {
        // Imprime absolutamente todo el error
        console.error('Error en getSociosFiltrados:', error);
        if (error && error.message) console.error('Mensaje:', error.message);
        if (error && error.stack) console.error('Stack:', error.stack);
        res.status(500).json({ error: error.message, stack: error.stack, raw: error });
        // res.status(500).json({ error: error.message || String(error) });
    }
};