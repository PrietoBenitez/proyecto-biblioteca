const express = require('express');
const router = express.Router();
const prestamosController = require('../controllers/prestamos.controller');
const authMiddleware = require('../middleware/auth.middleware');

// CRUD préstamos - todas las rutas requieren autenticación
router.get('/', authMiddleware, prestamosController.getAllPrestamos);
router.get('/:id', authMiddleware, prestamosController.getPrestamoById);
router.post('/', authMiddleware, prestamosController.createPrestamo);
router.put('/:id', authMiddleware, prestamosController.updatePrestamo);
router.delete('/:id', authMiddleware, prestamosController.deletePrestamo);

module.exports = router;