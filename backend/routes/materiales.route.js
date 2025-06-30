const express = require('express');
const router = express.Router();
const materialesController = require('../controllers/materiales.controller');


// Endpoints para selects de formulario de materiales (¡deben ir antes de las rutas dinámicas!)
router.get('/categorias', materialesController.getCategorias);
router.get('/subtipos', materialesController.getSubtipos);
router.get('/paises', materialesController.getPaises);
router.get('/donantes', materialesController.getDonantes);

// GET /api/materiales/filtrados
router.get('/filtrados', materialesController.getMaterialesFiltrados);

// GET /api/materiales
router.get('/', materialesController.getAllMateriales);

// POST /api/materiales
router.post('/', materialesController.createMaterial);

// GET /api/materiales/:id
router.get('/:id', materialesController.getMaterialById);

// PUT /api/materiales/:id
router.put('/:id', materialesController.updateMaterial);

// DELETE /api/materiales/:id
router.delete('/:id', materialesController.deleteMaterial);



module.exports = router;