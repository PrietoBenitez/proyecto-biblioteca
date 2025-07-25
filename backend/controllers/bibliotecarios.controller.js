// backend/controllers/bibliotecarios.controller.js
const bibliotecarioModel = require('../models/bibliotecarios.model');

exports.registrar = async (req, res) => {
    const { usuario, privilegios, nombre, contrasena, cedula, apellido } = req.body;
    if (!usuario || !contrasena || !nombre) {
        return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }
    try {
        await bibliotecarioModel.createBibliotecario({ usuario, privilegios, nombre, contrasena, cedula, apellido });
        res.status(201).json({ message: 'Usuario registrado correctamente' });
    } catch (err) {
        res.status(500).json({ message: 'Error al registrar usuario' });
    }
};

// Obtener todos los bibliotecarios
exports.getAllBibliotecarios = async (req, res) => {
    try {
        const bibliotecarios = await bibliotecarioModel.getAllBibliotecarios();
        res.json(bibliotecarios);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener un bibliotecario por ID
exports.getBibliotecarioById = async (req, res) => {
    const { id } = req.params;

    try {
        const bibliotecario = await bibliotecarioModel.getBibliotecarioById(id);
        if (!bibliotecario) {
            return res.status(404).json({ message: 'Bibliotecario no encontrado' });
        }
        res.json(bibliotecario);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Crear un nuevo bibliotecario
exports.createBibliotecario = async (req, res) => {
    const bibliotecario = req.body;

    // Solo los campos válidos según la base de datos
    const {
        USUARIO,
        PRIVILEGIOS,
        NOMBRE,
        APELLIDO,
        CEDULA,
        CONTRASENA
    } = bibliotecario;

    // Validación de campos obligatorios
    if (!USUARIO || !NOMBRE || !APELLIDO || !CEDULA || !CONTRASENA) {
        return res.status(400).json({ 
            error: 'Los campos Usuario, Nombre, Apellido, Cédula y Contraseña son obligatorios' 
        });
    }

    try {
        const result = await bibliotecarioModel.createBibliotecarioCRUD({
            USUARIO,
            PRIVILEGIOS: PRIVILEGIOS || 'N',
            NOMBRE,
            APELLIDO,
            CEDULA,
            CONTRASENA
        });

        if (result.affectedRows > 0) {
            res.status(201).json({ message: 'Bibliotecario creado exitosamente' });
        } else {
            res.status(400).json({ error: 'No se pudo crear el bibliotecario' });
        }
    } catch (error) {
        console.error('Error al crear bibliotecario:', error);
        res.status(500).json({ error: error.message });
    }
};

// Actualizar un bibliotecario
exports.updateBibliotecario = async (req, res) => {
    const { id } = req.params;
    const bibliotecario = req.body;

    const {
        USUARIO,
        PRIVILEGIOS,
        NOMBRE,
        APELLIDO,
        CEDULA,
        CONTRASENA
    } = bibliotecario;

    // Validación de campos obligatorios
    if (!USUARIO || !NOMBRE || !APELLIDO || !CEDULA) {
        return res.status(400).json({ 
            error: 'Los campos Usuario, Nombre, Apellido y Cédula son obligatorios' 
        });
    }

    try {
        const result = await bibliotecarioModel.updateBibliotecario(id, {
            USUARIO,
            PRIVILEGIOS: PRIVILEGIOS || 'N',
            NOMBRE,
            APELLIDO,
            CEDULA,
            CONTRASENA
        });

        if (result.affectedRows > 0) {
            res.json({ message: 'Bibliotecario actualizado exitosamente' });
        } else {
            res.status(404).json({ error: 'Bibliotecario no encontrado' });
        }
    } catch (error) {
        console.error('Error al actualizar bibliotecario:', error);
        res.status(500).json({ error: error.message });
    }
};

// Eliminar un bibliotecario
exports.deleteBibliotecario = async (req, res) => {
    const { id } = req.params;

    console.log('🗑️ BACKEND DELETE BIBLIOTECARIO - Iniciando eliminación ID:', id);

    try {
        const result = await bibliotecarioModel.deleteBibliotecario(id);
        console.log('🗑️ BACKEND DELETE BIBLIOTECARIO - Resultado del modelo:', result);

        if (!result || result.affectedRows === 0 || result.count === 0) {
            console.log('❌ BACKEND DELETE BIBLIOTECARIO - Bibliotecario no encontrado o no eliminado');
            return res.status(404).json({ message: 'Bibliotecario no encontrado' });
        }

        console.log('✅ BACKEND DELETE BIBLIOTECARIO - Eliminación exitosa');
        res.json({ message: 'Bibliotecario eliminado exitosamente' });
    } catch (error) {
        console.error('❌ BACKEND DELETE BIBLIOTECARIO - Error capturado:', error);
        console.log('🔍 BACKEND DELETE BIBLIOTECARIO - Error completo:', JSON.stringify(error, null, 2));
        console.log('🔍 BACKEND DELETE BIBLIOTECARIO - Error message:', error.message);
        console.log('🔍 BACKEND DELETE BIBLIOTECARIO - Error code:', error.code);
        console.log('🔍 BACKEND DELETE BIBLIOTECARIO - Error state:', error.state);
        
        // Verificar si hay errores ODBC específicos
        if (error.odbcErrors && Array.isArray(error.odbcErrors)) {
            console.log('🔍 BACKEND DELETE BIBLIOTECARIO - ODBC Errors encontrados:', error.odbcErrors.length);
            error.odbcErrors.forEach((odbcError, index) => {
                console.log(`🔍 BACKEND DELETE BIBLIOTECARIO - ODBC Error ${index + 1}:`, odbcError);
                console.log(`  - State: ${odbcError.state}`);
                console.log(`  - Code: ${odbcError.code}`);
                console.log(`  - Message: ${odbcError.message}`);
            });
            
            // Devolver información detallada de errores ODBC
            res.status(500).json({ 
                error: error.message,
                odbcErrors: error.odbcErrors,
                details: 'Error ODBC detallado disponible en logs del servidor'
            });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
};

// Filtrar bibliotecarios por texto (SQL)
exports.getBibliotecariosFiltrados = async (req, res) => {
    try {
        const { texto, page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;
        const { bibliotecarios, total } = await bibliotecarioModel.getBibliotecariosFiltrados(texto, pageNum, limitNum);
        res.json({ bibliotecarios, total, page: pageNum, limit: limitNum });
    } catch (error) {
        console.error('Error al filtrar bibliotecarios:', error);
        res.status(500).json({ error: error.message });
    }
};
