// backend/controllers/auth.controller.js
// Controlador para autenticación de bibliotecarios usando Sybase
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Bibliotecario = require('../models/bibliotecarios.model');

exports.login = async (req, res) => {
    const { usuario, password } = req.body;

    try {
        // Acceso especial para DBA
        if (usuario === 'dba' && password === 'sql') {
            const token = jwt.sign({ id: 0, usuario: 'dba', rol: 'admin' }, process.env.JWT_SECRET || 'secreto', { expiresIn: '2h' });
            return res.json({ token });
        }

        const bibliotecario = await Bibliotecario.findByUsuario(usuario);
        console.log('Bibliotecario encontrado:', bibliotecario); 

        if (!bibliotecario) {
            return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
        }

        const valid = await bcrypt.compare(password, bibliotecario.CONTRASENA);
        if (!valid) {
            return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
        }

        const token = jwt.sign(
            {
                id: bibliotecario.BIBLIOTECARIO_ID || bibliotecario.id,
                usuario: bibliotecario.USUARIO,
                rol: bibliotecario.PRIVILEGIOS || bibliotecario.privilegios
            },
            process.env.JWT_SECRET || 'secreto',
            { expiresIn: '2h' }
        );

        console.log('🔍 Token generado para bibliotecario:', {
            id: bibliotecario.BIBLIOTECARIO_ID || bibliotecario.id,
            usuario: bibliotecario.USUARIO,
            rol: bibliotecario.PRIVILEGIOS || bibliotecario.privilegios
        });

        res.json({ token });

    } catch (err) {
        console.error('Error en login:', err); 
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
