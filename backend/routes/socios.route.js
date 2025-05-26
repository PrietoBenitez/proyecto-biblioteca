// backend/routes/socios.route.js
const express = require('express');
const router = express.Router();
const sociosController = require('../controllers/socios.controller');

// GET /api/socios
router.get('/', sociosController.getAllSocios);

// POST /api/socios
router.post('/', sociosController.createSocio);

// GET /api/socios/:id
router.get('/:id', sociosController.getSocioById);

// PUT /api/socios/:id
router.put('/:id', sociosController.updateSocio);

// DELETE /api/socios/:id
router.delete('/:id', sociosController.deleteSocio);

module.exports = router;