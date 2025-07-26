
//  * =========================================
//  * CONTROLADOR DE SOCIOS - GESTLIB
//  * =========================================


const { getConnection } = require('../config/db');
const sociosModel = require('../models/socios.model');
const logger = require('../utils/logger');
const { validateSocio, sendValidationError } = require('../utils/validation');

// ==========================================
// 1. OBTENER TODOS LOS SOCIOS
// ==========================================
/**
 * Obtiene la lista completa de socios
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getAllSocios = async (req, res) => {
    logger.crud('socios', 'READ_ALL', null, 'Iniciando consulta de todos los socios');
    
    try {
        const socios = await sociosModel.getAllSocios();
        
        logger.crud('socios', 'READ_ALL', null, `Consulta exitosa. Total: ${socios.length} socios`, {
            totalSocios: socios.length
        });
        
        res.json(socios);
    } catch (error) {
        logger.crudError('socios', 'READ_ALL', null, error);
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 2. OBTENER SOCIO POR ID
// ==========================================
/**
 * Obtiene un socio específico por su ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getSocioById = async (req, res) => {
    const { id } = req.params;
    
    logger.crud('socios', 'READ_BY_ID', id, 'Iniciando búsqueda de socio por ID');

    try {
        const socio = await sociosModel.getSocioById(id);
        
        if (!socio) {
            logger.warn('SOCIOS', `READ_BY_ID ID:${id}`, 'Socio no encontrado en base de datos');
            return res.status(404).json({ message: 'Socio no encontrado' });
        }
        
        logger.crud('socios', 'READ_BY_ID', id, `Socio encontrado: ${socio.NOMBRE} ${socio.APELLIDO}`, {
            nombre: socio.NOMBRE,
            apellido: socio.APELLIDO,
            cedula: socio.CEDULA
        });
        
        res.json(socio);
    } catch (error) {
        logger.crudError('socios', 'READ_BY_ID', id, error);
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 3. CREAR NUEVO SOCIO
// ==========================================
/**
 * Crea un nuevo socio en el sistema
 * @param {Object} req - Request object con datos del socio
 * @param {Object} res - Response object
 */
exports.createSocio = async (req, res) => {
    const socio = req.body;
    
    logger.crud('socios', 'CREATE', null, 'Iniciando creación de nuevo socio', {
        nombre: socio.NOMBRE,
        apellido: socio.APELLIDO,
        cedula: socio.CEDULA
    });

    // ==========================================
    // VALIDACIÓN CON HELPER REUTILIZABLE
    // ==========================================
    const validation = validateSocio(socio);
    if (!validation.isValid) {
        return sendValidationError(res, validation.errors, 'Socio');
    }

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
        
        logger.crud('socios', 'CREATE', null, `Socio creado exitosamente: ${NOMBRE} ${APELLIDO}`, {
            nombre: NOMBRE,
            apellido: APELLIDO,
            cedula: CEDULA
        });
        
        res.status(201).json({ message: 'Socio creado exitosamente' });
    } catch (error) {
        logger.crudError('socios', 'CREATE', null, error, {
            datosRecibidos: { NOMBRE, APELLIDO, CEDULA }
        });
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 4. ACTUALIZAR SOCIO EXISTENTE
// ==========================================
/**
 * Actualiza los datos de un socio existente
 * @param {Object} req - Request object con ID y datos del socio
 * @param {Object} res - Response object
 */
exports.updateSocio = async (req, res) => {
    const { id } = req.params;
    const socio = req.body;
    
    logger.crud('socios', 'UPDATE', id, 'Iniciando actualización de socio', {
        nombre: socio.NOMBRE,
        apellido: socio.APELLIDO,
        cedula: socio.CEDULA
    });

    // ==========================================
    // VALIDACIÓN CON HELPER REUTILIZABLE
    // ==========================================
    const validation = validateSocio(socio);
    if (!validation.isValid) {
        return sendValidationError(res, validation.errors, 'Socio');
    }

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
            logger.warn('SOCIOS', `UPDATE ID:${id}`, 'Socio no encontrado para actualizar');
            return res.status(404).json({ message: 'Socio no encontrado' });
        }

        logger.crud('socios', 'UPDATE', id, `Socio actualizado exitosamente: ${NOMBRE} ${APELLIDO}`, {
            nombre: NOMBRE,
            apellido: APELLIDO,
            cedula: CEDULA
        });

        res.json({ message: 'Socio actualizado exitosamente' });
    } catch (error) {
        logger.crudError('socios', 'UPDATE', id, error, {
            datosRecibidos: { NOMBRE, APELLIDO, CEDULA }
        });
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 5. ELIMINAR SOCIO
// ==========================================
/**
 * Elimina un socio del sistema
 * @param {Object} req - Request object con ID del socio
 * @param {Object} res - Response object
 */
exports.deleteSocio = async (req, res) => {
    const { id } = req.params;

    logger.crud('socios', 'DELETE', id, 'Iniciando eliminación de socio');

    try {
        const result = await sociosModel.deleteSocio(id);
        
        logger.debug('SOCIOS', `DELETE ID:${id}`, 'Resultado del modelo', {
            affectedRows: result?.affectedRows || result?.count || 0
        });

        if (!result || result.affectedRows === 0 || result.count === 0) {
            logger.warn('SOCIOS', `DELETE ID:${id}`, 'Socio no encontrado o no eliminado');
            return res.status(404).json({ message: 'Socio no encontrado' });
        }

        logger.crud('socios', 'DELETE', id, 'Socio eliminado exitosamente');
        res.json({ message: 'Socio eliminado exitosamente' });
    } catch (error) {
        logger.crudError('socios', 'DELETE', id, error);
        
        // Verificar si hay errores ODBC específicos para información detallada
        if (error.odbcErrors && Array.isArray(error.odbcErrors)) {
            logger.error('DATABASE', 'ODBC_ERRORS', `Errores ODBC en DELETE socio ID:${id}`, {
                odbcErrorsCount: error.odbcErrors.length,
                odbcErrors: error.odbcErrors
            });
            
            // Devolver información detallada de errores ODBC
            return res.status(500).json({ 
                error: error.message,
                odbcErrors: error.odbcErrors,
                details: 'Error ODBC detallado disponible en logs del servidor'
            });
        }
        
        // Si hay sanciones activas, el trigger de la DB impedirá el borrado
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