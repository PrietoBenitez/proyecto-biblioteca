// backend/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const { getConnection } = require('../config/db');

module.exports = async function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Token requerido' });

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET || 'secreto');
        req.user = user; // Guarda el usuario decodificado

        // ✅ Obtener conexión y setear CURRENT_BIBLIOTECARIO_ID
        const conn = await getConnection();

        // await conn.query(`
        //     SET TEMPORARY OPTION CONNECTION_PROPERTY('CURRENT_BIBLIOTECARIO_ID') = '${user.id}'
        // `);

        await conn.query(`
            SET TEMPORARY OPTION CURRENT_BIBLIOTECARIO_ID = '${user.id}'
        `);

        // Guardar la conexión en la request para uso posterior
        req.dbConn = conn;

        next();

    } catch (err) {
        console.error('Error en middleware auth:', err);
        return res.status(403).json({ message: 'Token inválido' });
    }
};
