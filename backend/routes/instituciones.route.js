const express = require('express');
const router = express.Router();
const institucionesController = require('../controllers/instituciones.controller');

// CRUD rutas
router.get('/', institucionesController.getAllInstituciones);
router.get('/:id', institucionesController.getInstitucionById);
router.post('/', institucionesController.createInstitucion);
router.put('/:id', institucionesController.updateInstitucion);
router.delete('/:id', institucionesController.deleteInstitucion);

module.exports = router;
