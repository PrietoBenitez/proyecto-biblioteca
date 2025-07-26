const express = require('express');
const router = express.Router();
const sociosController = require('../controllers/socios.controller');

// Endpoints para selects de formulario de socios 
router.get('/nacionalidades', sociosController.getNacionalidades);
router.get('/educaciones', sociosController.getEducaciones);
router.get('/profesiones', sociosController.getProfesiones);
router.get('/instituciones', sociosController.getInstituciones);

// GET /api/socios/filtrados
router.get('/filtrados', sociosController.getSociosFiltrados);

// GET /api/socios
router.get('/', sociosController.getAllSocios);

// POST /api/socios
router.post('/', sociosController.createSocio);

// GET /api/socios/:id
router.get('/:id', sociosController.getSocioById);

// GET /api/socios/:id/sanciones-activas
router.get('/:id/sanciones-activas', sociosController.getSancionesActivasBySocio);

// GET /api/socios/:id/sanciones-y-estado
router.get('/:id/sanciones-y-estado', sociosController.getSancionesYEstadoBySocio);

// POST /api/socios/:id/sancionar
router.post('/:id/sancionar', sociosController.agregarSancionASocio);

// PUT /api/socios/:id
router.put('/:id', sociosController.updateSocio);

// DELETE /api/socios/:id
router.delete('/:id', sociosController.deleteSocio);

module.exports = router;