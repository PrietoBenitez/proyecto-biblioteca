const express = require('express');
const router = express.Router();
const materialesController = require('../controllers/materiales.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Endpoints para selects de formulario de materiales (¡deben ir antes de las rutas dinámicas!)
router.get('/categorias', materialesController.getCategorias);
router.get('/subtipos', materialesController.getSubtipos);
router.get('/paises', materialesController.getPaises);
router.get('/donantes', materialesController.getDonantes);

// GET /api/materiales/filtrados
router.get('/filtrados', materialesController.getMaterialesFiltrados);

// GET /api/materiales
router.get('/', materialesController.getAllMateriales);

// POST /api/materiales (requiere autenticación)
router.post('/', authMiddleware, materialesController.createMaterial);

// GET /api/materiales/:id
router.get('/:id', materialesController.getMaterialById);

// PUT /api/materiales/:id (requiere autenticación)
router.put('/:id', authMiddleware, materialesController.updateMaterial);

// DELETE /api/materiales/:id (requiere autenticación)
router.delete('/:id', authMiddleware, materialesController.deleteMaterial);



module.exports = router;