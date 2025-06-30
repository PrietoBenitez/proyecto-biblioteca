const { getConnection } = require('../config/db');
const sociosModel = require('../models/socios.model');


// Obtener todos los socios
exports.getAllSocios = async (req, res) => {
    try {
        const socios = await sociosModel.getAllSocios();
        res.json(socios);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener un socio por ID
exports.getSocioById = async (req, res) => {
    const { id } = req.params;

    try {
        const socio = await sociosModel.getSocioById(id);
        if (!socio) {
            return res.status(404).json({ message: 'Socio no encontrado' });
        }
        res.json(socio);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Crear un nuevo socio
exports.createSocio = async (req, res) => {
    const socio = req.body;

    // Solo los campos válidos según la base de datos
    const {
        NOMBRE,
        APELLIDO,
        CEDULA,
        CORREO,
        DIRECCION,
        FECHA_NACIMIENTO,
        FECHA_INSCRIPCION,
        NACIONALIDAD,
        EDUCACION_ID,
        PROFESION_ID,
        INSTITUCION_ID
    } = socio;

    // Validación de campos obligatorios según la tabla SOCIOS
    if (!NOMBRE || !APELLIDO || !CEDULA || !FECHA_NACIMIENTO) {
        return res.status(400).json({ error: 'Faltan campos obligatorios: NOMBRE, APELLIDO, CEDULA, FECHA_NACIMIENTO' });
    }

    // FECHA_INSCRIPCION puede ser null, la base de datos lo pone por defecto
    try {
        await sociosModel.createSocio({
            NOMBRE,
            APELLIDO,
            CEDULA,
            CORREO: CORREO || null,
            DIRECCION: DIRECCION || null,
            FECHA_NACIMIENTO,
            FECHA_INSCRIPCION: FECHA_INSCRIPCION || null,
            NACIONALIDAD: NACIONALIDAD || null,
            EDUCACION_ID: EDUCACION_ID || null,
            PROFESION_ID: PROFESION_ID || null,
            INSTITUCION_ID: INSTITUCION_ID || null
        });
        res.status(201).json({ message: 'Socio creado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Actualizar un socio existente
exports.updateSocio = async (req, res) => {
    const { id } = req.params;
    const socio = req.body;

    // Solo los campos válidos según la base de datos
    const {
        NOMBRE,
        APELLIDO,
        CEDULA,
        CORREO,
        DIRECCION,
        FECHA_NACIMIENTO,
        FECHA_INSCRIPCION,
        NACIONALIDAD,
        EDUCACION_ID,
        PROFESION_ID,
        INSTITUCION_ID
    } = socio;

    if (!NOMBRE || !APELLIDO || !CEDULA || !FECHA_NACIMIENTO) {
        return res.status(400).json({ error: 'Faltan campos obligatorios: NOMBRE, APELLIDO, CEDULA, FECHA_NACIMIENTO' });
    }

    try {
        const result = await sociosModel.updateSocio(id, {
            NOMBRE,
            APELLIDO,
            CEDULA,
            CORREO: CORREO || null,
            DIRECCION: DIRECCION || null,
            FECHA_NACIMIENTO,
            FECHA_INSCRIPCION: FECHA_INSCRIPCION || null,
            NACIONALIDAD: NACIONALIDAD || null,
            EDUCACION_ID: EDUCACION_ID || null,
            PROFESION_ID: PROFESION_ID || null,
            INSTITUCION_ID: INSTITUCION_ID || null
        });

        if (!result || result.affectedRows === 0 || result.count === 0) {
            return res.status(404).json({ message: 'Socio no encontrado' });
        }

        res.json({ message: 'Socio actualizado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar un socio
exports.deleteSocio = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await sociosModel.deleteSocio(id);

        if (!result || result.affectedRows === 0 || result.count === 0) {
            return res.status(404).json({ message: 'Socio no encontrado' });
        }

        res.json({ message: 'Socio eliminado exitosamente' });
    } catch (error) {
        // Si hay sanciones activas, el trigger de la DB impedirá el borrado y enviará un mensaje de error.
        // Mostramos el mensaje del trigger.
        res.status(500).json({ error: error.message });
    }
};

// Filtrar socios por texto y estado (SQL)
exports.getSociosFiltrados = async (req, res) => {
    try {
        const { texto, estado, page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;
        const { socios, total } = await sociosModel.getSociosFiltrados(texto, estado, pageNum, limitNum);
        res.json({ socios, total, page: pageNum, limit: limitNum });
    } catch (error) {
        console.error('Error en getSociosFiltrados:', error);
        res.status(500).json({ error: error.message, stack: error.stack, raw: error });
    }
};

// Obtener sanciones activas por socio
exports.getSancionesActivasBySocio = async (req, res) => {
    const { id } = req.params;
    try {
        const sanciones = await sociosModel.getSancionesActivasBySocio(id);
        res.json(sanciones);
    } catch (error) {
        console.error('Error en getSancionesActivasBySocio:', error);
        res.status(500).json({ error: error.message });
    }
};

// Obtener sanciones activas Y estado del socio
exports.getSancionesYEstadoBySocio = async (req, res) => {
    const { id } = req.params;
    try {
        const sanciones = await sociosModel.getSancionesActivasBySocio(id);
        res.json({ sanciones }); // Solo devolvemos sanciones
    } catch (error) {
        console.error('Error en getSancionesYEstadoBySocio:', error);
        res.status(500).json({ error: error.message });
    }
};

// Agregar una sanción a un socio (el trigger gestiona el estado automáticamente)
exports.agregarSancionASocio = async (req, res) => {
    const socio_id = req.params.id;
    const { motivo, fecha_inicio, fecha_fin } = req.body;

    if (!motivo || !fecha_inicio) {
        return res.status(400).json({ error: 'Motivo y fecha de inicio son obligatorios.' });
    }

    try {
        await sociosModel.agregarSancionASocio({ socio_id, motivo, fecha_inicio, fecha_fin });
        res.status(201).json({ message: 'Sanción agregada correctamente.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Listados para selects de formulario de socios
exports.getNacionalidades = async (req, res) => {
    try {
        const nacionalidades = await sociosModel.getAllNacionalidades();
        res.json(nacionalidades);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getEducaciones = async (req, res) => {
    try {
        const educaciones = await sociosModel.getAllEducaciones();
        res.json(educaciones);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getProfesiones = async (req, res) => {
    try {
        const profesiones = await sociosModel.getAllProfesiones();
        res.json(profesiones);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getInstituciones = async (req, res) => {
    try {
        const instituciones = await sociosModel.getAllInstituciones();
        res.json(instituciones);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};