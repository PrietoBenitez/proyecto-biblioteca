const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/db');
const { registrar } = require('../controllers/bibliotecarios.controller');

// GET /api/bibliotecarios - lista todos los bibliotecarios
router.get('/', async (req, res) => {
    try {
        const db = await getConnection();
        const result = await db.query('SELECT * FROM BIBLIOTECARIOS ORDER BY NOMBRE');
        await db.close();
        res.json(Array.isArray(result.rows) ? result.rows : result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/bibliotecarios/registrar
router.post('/registrar', registrar);
module.exports = router;
