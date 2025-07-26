/**
 * =========================================
 * CONTROLADOR DE AUTENTICACIÓN - BIBLIOTECH
 * =========================================
 * 
 * Este controlador maneja el proceso de autenticación
 * de bibliotecarios en el sistema BiblioTech.
 * 
 * Funcionalidades:
 * - Login con usuario y contraseña
 * - Generación de tokens JWT
 * - Acceso especial para administrador DBA
 * - Verificación de credenciales con bcrypt
 * 
 * Autor: Sistema BiblioTech
 * =========================================
 */

// ==========================================
// 1. IMPORTAR DEPENDENCIAS
// ==========================================
const bcrypt = require('bcrypt');             // Encriptación de contraseñas
const jwt = require('jsonwebtoken');          // Generación de tokens JWT
const Bibliotecario = require('../models/bibliotecarios.model');

// ==========================================
// 2. FUNCIÓN DE LOGIN
// ==========================================
/**
 * Autentica un bibliotecario en el sistema
 * 
 * @param {Object} req - Request con usuario y password
 * @param {Object} res - Response con token JWT o error
 * @returns {Object} JSON con token de autenticación
 */
exports.login = async (req, res) => {
    const { usuario, password } = req.body;

    try {
        // ==========================================
        // 3. ACCESO ESPECIAL PARA ADMINISTRADOR DBA
        // ==========================================
        if (usuario === 'dba' && password === 'sql') {
            const token = jwt.sign(
                { id: 0, usuario: 'dba', rol: 'admin' }, 
                process.env.JWT_SECRET || 'secreto', 
                { expiresIn: '2h' }
            );
            return res.json({ token });
        }

        // ==========================================
        // 4. BUSCAR BIBLIOTECARIO EN BASE DE DATOS
        // ==========================================
        const bibliotecario = await Bibliotecario.findByUsuario(usuario);
        console.log('🔍 Bibliotecario encontrado:', bibliotecario); 

        if (!bibliotecario) {
            return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
        }

        // ==========================================
        // 5. VERIFICAR CONTRASEÑA CON BCRYPT
        // ==========================================
        const valid = await bcrypt.compare(password, bibliotecario.CONTRASENA);
        if (!valid) {
            return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
        }

        // ==========================================
        // 6. GENERAR TOKEN JWT CON DATOS DEL USUARIO
        // ==========================================
        const token = jwt.sign(
            {
                id: bibliotecario.BIBLIOTECARIO_ID || bibliotecario.id,
                usuario: bibliotecario.USUARIO,
                rol: bibliotecario.PRIVILEGIOS || bibliotecario.privilegios
            },
            process.env.JWT_SECRET || 'secreto',
            { expiresIn: '2h' }
        );

        console.log('🎯 Token generado exitosamente para:', {
            id: bibliotecario.BIBLIOTECARIO_ID || bibliotecario.id,
            usuario: bibliotecario.USUARIO,
            rol: bibliotecario.PRIVILEGIOS || bibliotecario.privilegios
        });

        // ==========================================
        // 7. RESPONDER CON TOKEN EXITOSO
        // ==========================================
        res.json({ token });

    } catch (err) {
        console.error('❌ Error en proceso de login:', err); 
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
