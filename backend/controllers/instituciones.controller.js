//  * =========================================
//  * CONTROLADOR DE INSTITUCIONES - GESTLIB
//  * =========================================

const institucionesModel = require('../models/instituciones.model');
const logger = require('../utils/logger');
const { validateInstitucion, sendValidationError } = require('../utils/validation');

// ==========================================
// 1. OBTENER TODAS LAS INSTITUCIONES
// ==========================================
/**
 * Obtiene la lista completa de instituciones (con filtro por texto)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getAllInstituciones = async (req, res) => {
    const texto = req.query.texto || '';
    
    logger.crud('instituciones', 'READ_ALL', null, 'Iniciando consulta de todas las instituciones', {
        filtroTexto: texto
    });
    
    try {
        const instituciones = await institucionesModel.getAllInstituciones(texto);
        
        logger.crud('instituciones', 'READ_ALL', null, `Consulta exitosa. Total: ${instituciones.length} instituciones`, {
            totalInstituciones: instituciones.length,
            filtroTexto: texto
        });
        
        res.json(instituciones);
    } catch (error) {
        logger.crudError('instituciones', 'READ_ALL', null, error);
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 2. OBTENER INSTITUCIÓN POR ID
// ==========================================
/**
 * Obtiene una institución específica por su ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getInstitucionById = async (req, res) => {
    const { id } = req.params;
    
    logger.crud('instituciones', 'READ_BY_ID', id, 'Iniciando búsqueda de institución por ID');

    try {
        const institucion = await institucionesModel.getInstitucionById(id);
        
        if (!institucion) {
            logger.warn('INSTITUCIONES', `READ_BY_ID ID:${id}`, 'Institución no encontrada en base de datos');
            return res.status(404).json({ message: 'Institución no encontrada' });
        }
        
        logger.crud('instituciones', 'READ_BY_ID', id, `Institución encontrada: ${institucion.INSTITUCION}`, {
            nombre: institucion.INSTITUCION
        });
        
        res.json(institucion);
    } catch (error) {
        logger.crudError('instituciones', 'READ_BY_ID', id, error);
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 3. CREAR NUEVA INSTITUCIÓN
// ==========================================
/**
 * Crea una nueva institución en el sistema
 * @param {Object} req - Request object con datos de la institución
 * @param {Object} res - Response object
 */
exports.createInstitucion = async (req, res) => {
    const { INSTITUCION_ID, INSTITUCION } = req.body;
    
    logger.crud('instituciones', 'CREATE', null, 'Iniciando creación de nueva institución', {
        institucionId: INSTITUCION_ID,
        nombre: INSTITUCION
    });

    // ==========================================
    // VALIDACIÓN CON HELPER REUTILIZABLE
    // ==========================================
    const validation = validateInstitucion({ INSTITUCION });
    if (!validation.isValid) {
        return sendValidationError(res, validation.errors, 'Institución');
    }

    // Validar también el ID si está presente
    if (!INSTITUCION_ID) {
        return sendValidationError(res, ['ID de institución es requerido'], 'Institución');
    }

    try {
        await institucionesModel.createInstitucion({ INSTITUCION_ID, INSTITUCION });
        
        logger.crud('instituciones', 'CREATE', null, `Institución creada exitosamente: ${INSTITUCION}`, {
            institucionId: INSTITUCION_ID,
            nombre: INSTITUCION
        });
        
        res.status(201).json({ message: 'Institución creada exitosamente' });
    } catch (error) {
        logger.crudError('instituciones', 'CREATE', null, error, {
            datosRecibidos: { INSTITUCION_ID, INSTITUCION }
        });
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 4. ACTUALIZAR INSTITUCIÓN EXISTENTE
// ==========================================
/**
 * Actualiza los datos de una institución existente
 * @param {Object} req - Request object con ID y datos de la institución
 * @param {Object} res - Response object
 */
exports.updateInstitucion = async (req, res) => {
    const { id } = req.params;
    const { INSTITUCION } = req.body;
    
    logger.crud('instituciones', 'UPDATE', id, 'Iniciando actualización de institución', {
        nombre: INSTITUCION
    });

    // ==========================================
    // VALIDACIÓN CON HELPER REUTILIZABLE
    // ==========================================
    const validation = validateInstitucion({ INSTITUCION });
    if (!validation.isValid) {
        return sendValidationError(res, validation.errors, 'Institución');
    }

    try {
        await institucionesModel.updateInstitucion(id, { INSTITUCION });
        
        logger.crud('instituciones', 'UPDATE', id, `Institución actualizada exitosamente: ${INSTITUCION}`, {
            nombre: INSTITUCION
        });
        
        res.json({ message: 'Institución actualizada correctamente' });
    } catch (error) {
        logger.crudError('instituciones', 'UPDATE', id, error, {
            datosRecibidos: { INSTITUCION }
        });
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 5. ELIMINAR INSTITUCIÓN
// ==========================================
/**
 * Elimina una institución del sistema
 * @param {Object} req - Request object con ID de la institución
 * @param {Object} res - Response object
 */
exports.deleteInstitucion = async (req, res) => {
    const { id } = req.params;

    logger.crud('instituciones', 'DELETE', id, 'Iniciando eliminación de institución');

    try {
        await institucionesModel.deleteInstitucion(id);
        
        logger.crud('instituciones', 'DELETE', id, 'Institución eliminada exitosamente');
        res.json({ message: 'Institución eliminada correctamente' });
    } catch (error) {
        logger.crudError('instituciones', 'DELETE', id, error);
        
        // Verificar si hay errores ODBC específicos para información detallada
        if (error.odbcErrors && Array.isArray(error.odbcErrors)) {
            logger.error('DATABASE', 'ODBC_ERRORS', `Errores ODBC en DELETE institución ID:${id}`, {
                odbcErrorsCount: error.odbcErrors.length,
                odbcErrors: error.odbcErrors
            });
        }
        
        res.status(500).json({ error: error.message });
    }
};
