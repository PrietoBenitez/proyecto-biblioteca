// backend/controllers/bibliotecarios.controller.js
const { createBibliotecario } = require('../models/bibliotecarios.model');

exports.registrar = async (req, res) => {
    const { usuario, privilegios, nombre, contrasena, cedula, apellido } = req.body;
    if (!usuario || !contrasena || !nombre) {
        return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }
    try {
        await createBibliotecario({ usuario, privilegios, nombre, contrasena, cedula, apellido });
        res.status(201).json({ message: 'Usuario registrado correctamente' });
    } catch (err) {
        res.status(500).json({ message: 'Error al registrar usuario' });
    }
};
