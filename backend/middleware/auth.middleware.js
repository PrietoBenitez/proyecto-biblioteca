/**
 * =========================================
 * MIDDLEWARE DE AUTENTICACIÓN
 * =========================================
 * 
 * Funciones:
 * - Verifica que el usuario tenga un token JWT válido
 * - Extrae la información del usuario del token
 * - Establece conexión con la base de datos
 * - Permite el acceso a rutas protegidas
 * 
 * Autor: Sistema BiblioTech
 * Fecha: 2025
 * =========================================
 */

const jwt = require('jsonwebtoken');
const { getConnection } = require('../config/db');

/**
 * Middleware para verificar tokens JWT en rutas protegidas
 * 
 * @param {Object} req - Request de Express (contiene headers, body, params)
 * @param {Object} res - Response de Express (para enviar respuestas)
 * @param {Function} next - Función para continuar al siguiente middleware
 */
module.exports = async function verificarToken(req, res, next) {
    // ==========================================
    // 1. EXTRAER TOKEN DEL HEADER AUTHORIZATION
    // ==========================================
    const authHeader = req.headers['authorization']; // Formato: "Bearer token123"
    const token = authHeader && authHeader.split(' ')[1]; // Extraer solo el token

    // Si no hay token, denegar acceso
    if (!token) {
        return res.status(401).json({ message: 'Token requerido' });
    }

    try {
        // ==========================================
        // 2. VERIFICAR Y DECODIFICAR EL TOKEN JWT
        // ==========================================
        const user = jwt.verify(token, process.env.JWT_SECRET || 'secreto');
        req.user = user; // Guardar datos del usuario en la request

        // ==========================================
        // 3. ESTABLECER CONEXIÓN CON BASE DE DATOS
        // ==========================================
        const conn = await getConnection();
        
        // NOTA: SQL Anywhere no permite SET TEMPORARY OPTION para usuario DBA
        // Por seguridad, guardamos el ID del bibliotecario en memoria de Node.js
        
        // ==========================================
        // 4. GUARDAR INFORMACIÓN EN LA REQUEST
        // ==========================================
        req.dbConn = conn;                    // Conexión DB para usar en controladores
        req.bibliotecarioId = user.id;       // ID del bibliotecario autenticado
        
        // ==========================================
        // 5. CONTINUAR AL SIGUIENTE MIDDLEWARE/RUTA
        // ==========================================
        next();

    } catch (err) {
        // ==========================================
        // 6. MANEJO DE ERRORES DE AUTENTICACIÓN
        // ==========================================
        console.error('❌ Error en middleware auth:', err);
        return res.status(403).json({ message: 'Token inválido' });
    }
};
