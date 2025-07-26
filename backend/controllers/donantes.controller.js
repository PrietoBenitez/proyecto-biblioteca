//  * =========================================
//  * CONTROLADOR DE DONANTES - GESTLIB
//  * =========================================

const donantesModel = require('../models/donantes.model');
const logger = require('../utils/logger');
const { validateDonante, sendValidationError } = require('../utils/validation');

// ==========================================
// 1. OBTENER TODOS LOS DONANTES
// ==========================================
/**
 * Obtiene la lista completa de donantes
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getAllDonantes = async (req, res) => {
    logger.crud('donantes', 'READ_ALL', null, 'Iniciando consulta de todos los donantes');
    
    try {
        const donantes = await donantesModel.getAllDonantes();
        
        logger.crud('donantes', 'READ_ALL', null, `Consulta exitosa. Total: ${donantes.length} donantes`, {
            totalDonantes: donantes.length
        });
        
        res.json(donantes.map(donante => ({
            id: donante.DONANTE_ID,
            nombre: donante.NOMBRE,
            apellido: donante.APELLIDO,
            cedula: donante.CEDULA
        })));
    } catch (error) {
        logger.crudError('donantes', 'READ_ALL', null, error);
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 2. OBTENER DONANTE POR ID
// ==========================================
/**
 * Obtiene un donante específico por su ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getDonanteById = async (req, res) => {
    const { id } = req.params;
    
    logger.crud('donantes', 'READ_BY_ID', id, 'Iniciando búsqueda de donante por ID');

    try {
        const donante = await donantesModel.getDonanteById(id);
        
        if (!donante) {
            logger.warn('DONANTES', `READ_BY_ID ID:${id}`, 'Donante no encontrado en base de datos');
            return res.status(404).json({ message: 'Donante no encontrado' });
        }
        
        logger.crud('donantes', 'READ_BY_ID', id, `Donante encontrado: ${donante.NOMBRE} ${donante.APELLIDO}`, {
            nombre: donante.NOMBRE,
            apellido: donante.APELLIDO,
            cedula: donante.CEDULA
        });
        
        res.json({
            id: donante.DONANTE_ID,
            nombre: donante.NOMBRE,
            apellido: donante.APELLIDO,
            cedula: donante.CEDULA
        });
    } catch (error) {
        logger.crudError('donantes', 'READ_BY_ID', id, error);
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 3. CREAR NUEVO DONANTE
// ==========================================
/**
 * Crea un nuevo donante en el sistema
 * @param {Object} req - Request object con datos del donante
 * @param {Object} res - Response object
 */
exports.createDonante = async (req, res) => {
    const donante = req.body;
    
    logger.crud('donantes', 'CREATE', null, 'Iniciando creación de nuevo donante', {
        nombre: donante.NOMBRE || donante.nombre,
        apellido: donante.APELLIDO || donante.apellido,
        cedula: donante.CEDULA || donante.cedula
    });

    // ==========================================
    // VALIDACIÓN CON HELPER REUTILIZABLE
    // ==========================================
    // Normalizar nombres de campos para validación
    const donanteNormalizado = {
        NOMBRE: donante.NOMBRE || donante.nombre,
        APELLIDO: donante.APELLIDO || donante.apellido,
        CEDULA: donante.CEDULA || donante.cedula
    };

    const validation = validateDonante(donanteNormalizado);
    if (!validation.isValid) {
        return sendValidationError(res, validation.errors, 'Donante');
    }

    try {
        const nuevoDonante = await donantesModel.createDonante(req.body);
        
        // Consulta el donante recién creado para devolver todos los campos correctamente
        const donanteCompleto = await donantesModel.getDonanteById(nuevoDonante.insertId);
        
        logger.crud('donantes', 'CREATE', null, `Donante creado exitosamente: ${donanteCompleto.NOMBRE} ${donanteCompleto.APELLIDO}`, {
            donanteId: donanteCompleto.DONANTE_ID,
            nombre: donanteCompleto.NOMBRE,
            apellido: donanteCompleto.APELLIDO,
            cedula: donanteCompleto.CEDULA
        });
        
        res.status(201).json({
            message: 'Donante creado exitosamente',
            donante: {
                id: donanteCompleto.DONANTE_ID,
                nombre: donanteCompleto.NOMBRE,
                apellido: donanteCompleto.APELLIDO,
                cedula: donanteCompleto.CEDULA
            }
        });
    } catch (error) {
        logger.crudError('donantes', 'CREATE', null, error, {
            datosRecibidos: { NOMBRE: donanteNormalizado.NOMBRE, APELLIDO: donanteNormalizado.APELLIDO }
        });
        res.status(500).json({ error: error.message, odbcErrors: error.odbcErrors || null });
    }
};

// ==========================================
// 4. ACTUALIZAR DONANTE EXISTENTE
// ==========================================
/**
 * Actualiza los datos de un donante existente
 * @param {Object} req - Request object con ID y datos del donante
 * @param {Object} res - Response object
 */
exports.updateDonante = async (req, res) => {
    const { id } = req.params;
    const donante = req.body;
    
    logger.crud('donantes', 'UPDATE', id, 'Iniciando actualización de donante', {
        nombre: donante.NOMBRE || donante.nombre,
        apellido: donante.APELLIDO || donante.apellido,
        cedula: donante.CEDULA || donante.cedula
    });

    // ==========================================
    // VALIDACIÓN CON HELPER REUTILIZABLE
    // ==========================================
    // Normalizar nombres de campos para validación
    const donanteNormalizado = {
        NOMBRE: donante.NOMBRE || donante.nombre,
        APELLIDO: donante.APELLIDO || donante.apellido,
        CEDULA: donante.CEDULA || donante.cedula
    };

    const validation = validateDonante(donanteNormalizado);
    if (!validation.isValid) {
        return sendValidationError(res, validation.errors, 'Donante');
    }

    try {
        const actualizado = await donantesModel.updateDonante(id, req.body);
        
        if (!actualizado) {
            logger.warn('DONANTES', `UPDATE ID:${id}`, 'Donante no encontrado para actualizar');
            return res.status(404).json({ message: 'Donante no encontrado' });
        }
        
        logger.crud('donantes', 'UPDATE', id, `Donante actualizado exitosamente`, {
            nombre: donanteNormalizado.NOMBRE,
            apellido: donanteNormalizado.APELLIDO,
            cedula: donanteNormalizado.CEDULA
        });

        res.json({ message: 'Donante actualizado correctamente' });
    } catch (error) {
        logger.crudError('donantes', 'UPDATE', id, error, {
            datosRecibidos: { NOMBRE: donanteNormalizado.NOMBRE, APELLIDO: donanteNormalizado.APELLIDO }
        });
        // Enviar todos los detalles del error al frontend
        res.status(500).json({
            error: error.message,
            odbcErrors: error.odbcErrors || null
        });
    }
};

// ==========================================
// 5. ELIMINAR DONANTE
// ==========================================
/**
 * Elimina un donante del sistema
 * @param {Object} req - Request object con ID del donante
 * @param {Object} res - Response object
 */
exports.deleteDonante = async (req, res) => {
    const { id } = req.params;

    logger.crud('donantes', 'DELETE', id, 'Iniciando eliminación de donante');

    try {
        const eliminado = await donantesModel.deleteDonante(id);
        
        if (!eliminado) {
            logger.warn('DONANTES', `DELETE ID:${id}`, 'Donante no encontrado o no eliminado');
            return res.status(404).json({ message: 'Donante no encontrado' });
        }
        
        logger.crud('donantes', 'DELETE', id, 'Donante eliminado exitosamente');
        res.json({ message: 'Donante eliminado correctamente' });
    } catch (error) {
        logger.crudError('donantes', 'DELETE', id, error);
        
        // Verificar si hay errores ODBC específicos para información detallada
        if (error.odbcErrors && Array.isArray(error.odbcErrors)) {
            logger.error('DATABASE', 'ODBC_ERRORS', `Errores ODBC en DELETE donante ID:${id}`, {
                odbcErrorsCount: error.odbcErrors.length,
                odbcErrors: error.odbcErrors
            });
        }
        
        // Enviar todos los detalles del error al frontend
        res.status(500).json({
            error: error.message,
            odbcErrors: error.odbcErrors || null
        });
    }
};

// Obtener selects para formulario de donantes
exports.getSelects = async (req, res) => {
    try {
        const selects = {};
        res.json(selects);
    } catch (error) {
        logger.error('DONANTES', 'GET_SELECTS', 'Error al obtener selects', { error: error.message });
        res.status(500).json({ error: error.message });
    }
};

// Obtener donantes filtrados
exports.getDonantesFiltrados = async (req, res) => {
    const { texto, cedula, page = 1, limit = 10 } = req.query;
    try {
        const donantes = await donantesModel.getAllDonantes();
        // Filtrar resultados según los parámetros
        const filtrados = donantes.filter(donante => {
            return (
                (!texto || (donante.NOMBRE && donante.NOMBRE.includes(texto)) || (donante.APELLIDO && donante.APELLIDO.includes(texto))) &&
                (!cedula || (donante.CEDULA && donante.CEDULA.includes(cedula)))
            );
        });
        // Paginación
        const inicio = (page - 1) * limit;
        const paginados = filtrados.slice(inicio, inicio + limit);
        // Transformar los campos para el frontend
        const paginadosTransformados = paginados.map(donante => ({
            id: donante.DONANTE_ID,
            nombre: donante.NOMBRE,
            apellido: donante.APELLIDO,
            cedula: donante.CEDULA
        }));
        res.json({ donantes: paginadosTransformados, total: filtrados.length });
    } catch (error) {
        logger.error('DONANTES', 'GET_FILTRADOS', 'Error en filtro de donantes', { error: error.message });
        res.status(500).json({ error: error.message });
    }
};