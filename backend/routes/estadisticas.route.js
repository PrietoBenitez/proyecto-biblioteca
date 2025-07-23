// backend/routes/estadisticas.route.js
const express = require('express');
const router = express.Router();
const { obtenerTotales } = require('../controllers/estadisticas.controller');

router.get('/totales', obtenerTotales);

module.exports = router;
