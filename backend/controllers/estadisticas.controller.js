// backend/controllers/estadisticas.controller.js
const { getTotales } = require('../models/estadisticas.model');

async function obtenerTotales(req, res) {
    try {
        const totales = await getTotales();
        res.json(totales);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener estadísticas', details: err.message });
    }
}

module.exports = { obtenerTotales };
