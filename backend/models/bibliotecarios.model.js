// backend/models/bibliotecarios.model.js
// Modelo de acceso a bibliotecarios usando Sybase y ODBC
const { getConnection } = require('../config/db');

async function findByUsuario(usuario) {
    const conn = await getConnection();
    try {
        const result = await conn.query(`SELECT * FROM bibliotecarios WHERE usuario = ?`, [usuario]);
        return result.length > 0 ? result[0] : null;
    } finally {
        await conn.close();
    }
}

module.exports = { findByUsuario };
