const express = require('express');
const router = express.Router();
const bibliotecarioController = require('../controllers/bibliotecarios.controller');

// GET /api/bibliotecarios - obtener todos los bibliotecarios
router.get('/', bibliotecarioController.getAllBibliotecarios);

// GET /api/bibliotecarios/filtrados - obtener bibliotecarios filtrados con paginación
router.get('/filtrados', bibliotecarioController.getBibliotecariosFiltrados);

// GET /api/bibliotecarios/:id - obtener un bibliotecario por ID
router.get('/:id', bibliotecarioController.getBibliotecarioById);

// POST /api/bibliotecarios - crear un nuevo bibliotecario
router.post('/', bibliotecarioController.createBibliotecario);

// PUT /api/bibliotecarios/:id - actualizar un bibliotecario
router.put('/:id', bibliotecarioController.updateBibliotecario);

// DELETE /api/bibliotecarios/:id - eliminar un bibliotecario
router.delete('/:id', bibliotecarioController.deleteBibliotecario);

// POST /api/bibliotecarios/registrar - registro de usuarios (mantener compatibilidad)
router.post('/registrar', bibliotecarioController.registrar);

module.exports = router;
