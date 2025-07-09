const express = require('express');
const router = express.Router();
const donantesController = require('../controllers/donantes.controller');

// Endpoints para selects de formulario de donantes
router.get('/selects', donantesController.getSelects);

// GET /api/donantes/filtrados
router.get('/filtrados', donantesController.getDonantesFiltrados);

// CRUD básico
router.get('/', donantesController.getAllDonantes);
router.post('/', donantesController.createDonante);
router.get('/:id', donantesController.getDonanteById);
router.put('/:id', donantesController.updateDonante);
router.delete('/:id', donantesController.deleteDonante);

module.exports = router;