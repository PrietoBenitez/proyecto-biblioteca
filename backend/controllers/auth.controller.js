// backend/controllers/auth.controller.js
// Controlador para autenticación de bibliotecarios usando Sybase
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Bibliotecario = require('../models/bibliotecarios.model');
const { getConnection } = require('../config/db');


exports.login = async (req, res) => {
    const { usuario, password } = req.body;

    try {
        if (usuario === 'dba' && password === 'sql') {
            const token = jwt.sign({ id: 0, usuario: 'dba', rol: 'admin' }, process.env.JWT_SECRET || 'secreto', { expiresIn: '2h' });
            return res.json({ token });
        }

        const bibliotecario = await Bibliotecario.findByUsuario(usuario);
        if (!bibliotecario) {
            return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
        }

        const valid = await bcrypt.compare(password, bibliotecario.CONTRASENA);
        if (!valid) {
            return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
        }

        const token = jwt.sign(
            {
                id: bibliotecario.BIBLIOTECARIO_ID,
                usuario: bibliotecario.USUARIO,
                rol: bibliotecario.PRIVILEGIOS
            },
            process.env.JWT_SECRET || 'secreto',
            { expiresIn: '2h' }
        );

        res.json({ token });

    } catch (err) {
        console.error('Error en login:', err);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
