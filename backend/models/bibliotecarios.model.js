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
// Crear bibliotecario
async function createBibliotecario({ usuario, privilegios, nombre, contrasena, cedula, apellido }) {
    const conn = await getConnection();
    try {
        // Hashear la contraseña antes de guardar
        const bcrypt = require('bcrypt');
        const hash = await bcrypt.hash(contrasena, 10);
        const result = await conn.query(
            `INSERT INTO bibliotecarios (usuario, privilegios, nombre, contrasena, cedula, apellido) VALUES (?, ?, ?, ?, ?, ?)`,
            [usuario, privilegios, nombre, hash, cedula, apellido]
        );
        return result;
    } finally {
        await conn.close();
    }
}

module.exports = { findByUsuario, createBibliotecario };
