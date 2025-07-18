// backend/controllers/auth.controller.js
// Controlador para autenticación de bibliotecarios usando Sybase
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Bibliotecario = require('../models/bibliotecarios.model');

exports.login = async (req, res) => {
    const { usuario, password } = req.body;
    try {
        // Permitir acceso directo con usuario de base de datos (dba/sql)
        if (usuario === 'dba' && password === 'sql') {
            const token = jwt.sign({ id: 0, usuario: 'dba', rol: 'admin' }, process.env.JWT_SECRET || 'secreto', { expiresIn: '2h' });
            return res.json({ token });
        }
        const bibliotecario = await Bibliotecario.findByUsuario(usuario);
        if (!bibliotecario) {
            return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
        }
        const valid = await bcrypt.compare(password, bibliotecario.password);
        if (!valid) {
            return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
        }
        const token = jwt.sign({ id: bibliotecario.id, usuario: bibliotecario.usuario, rol: bibliotecario.rol }, process.env.JWT_SECRET || 'secreto', { expiresIn: '2h' });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
