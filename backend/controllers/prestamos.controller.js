const prestamosModel = require('../models/prestamos.model');

// Obtener todos los préstamos
exports.getAllPrestamos = async (req, res) => {
    try {
        const prestamos = await prestamosModel.getAllPrestamos();
        res.json(prestamos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener préstamo por ID
exports.getPrestamoById = async (req, res) => {
    try {
        const prestamo = await prestamosModel.getPrestamoById(req.params.id);
        if (!prestamo) return res.status(404).json({ message: 'Préstamo no encontrado' });
        res.json(prestamo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Crear préstamo
exports.createPrestamo = async (req, res) => {
    try {
        const result = await prestamosModel.createPrestamo(req.body);
        res.status(201).json({ 
            message: 'Préstamo creado correctamente',
            prestamoId: result.insertId
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Actualizar préstamo
exports.updatePrestamo = async (req, res) => {
    try {
        await prestamosModel.updatePrestamo(req.params.id, req.body);
        res.json({ message: 'Préstamo actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar préstamo
exports.deletePrestamo = async (req, res) => {
    try {
        await prestamosModel.deletePrestamo(req.params.id);
        res.json({ message: 'Préstamo eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
