const prestamosModel = require('../models/prestamos.model');

// Obtener todos los préstamos
exports.getAllPrestamos = async (req, res) => {
    try {
        const prestamos = await prestamosModel.getAllPrestamos();
        res.json(prestamos);
    } catch (error) {
        res.status(500).json({ 
            error: error.message, 
            odbcErrors: error.odbcErrors || (error.originalError && error.originalError.odbcErrors) || undefined,
            stack: error.stack 
        });
    }
};

// Obtener préstamo por ID
exports.getPrestamoById = async (req, res) => {
    try {
        const prestamo = await prestamosModel.getPrestamoById(req.params.id);
        if (!prestamo) return res.status(404).json({ message: 'Préstamo no encontrado' });
        res.json(prestamo);
    } catch (error) {
        res.status(500).json({ 
            error: error.message, 
            odbcErrors: error.odbcErrors || (error.originalError && error.originalError.odbcErrors) || undefined,
            stack: error.stack 
        });
    }
};

// Crear préstamo
exports.createPrestamo = async (req, res) => {
    try {
        const result = await prestamosModel.createPrestamo(req.body);
        if (result.error) {
            return res.status(400).json({ error: result.error });
        }
        res.status(201).json({ 
            message: 'Préstamo creado correctamente',
            prestamoId: result.insertId
        });
    } catch (error) {
        console.error('Error en endpoint /api/prestamos:', error);
        res.status(500).json({ 
            error: error.message, 
            odbcErrors: error.odbcErrors || (error.originalError && error.originalError.odbcErrors) || undefined,
            stack: error.stack 
        });
    }
};

// Actualizar préstamo
exports.updatePrestamo = async (req, res) => {
    try {
        await prestamosModel.updatePrestamo(req.params.id, req.body);
        res.json({ message: 'Préstamo actualizado correctamente' });
    } catch (error) {
        console.error('Error en endpoint /api/prestamos/:id:', error);
        res.status(500).json({ 
            error: error.message, 
            odbcErrors: error.odbcErrors || (error.originalError && error.originalError.odbcErrors) || undefined,
            stack: error.stack 
        });
    }
};

// Eliminar préstamo
exports.deletePrestamo = async (req, res) => {
    try {
        await prestamosModel.deletePrestamo(req.params.id);
        res.json({ message: 'Préstamo eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ 
            error: error.message, 
            odbcErrors: error.odbcErrors || (error.originalError && error.originalError.odbcErrors) || undefined,
            stack: error.stack 
        });
    }
};
