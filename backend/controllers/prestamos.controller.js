//  * =========================================
//  * CONTROLADOR DE PRÉSTAMOS - GESTLIB
//  * =========================================

const prestamosModel = require('../models/prestamos.model');
const logger = require('../utils/logger');
const { validatePrestamo, sendValidationError } = require('../utils/validation');

// ==========================================
// 1. OBTENER TODOS LOS PRÉSTAMOS
// ==========================================
/**
 * Obtiene la lista completa de préstamos
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getAllPrestamos = async (req, res) => {
    logger.crud('prestamos', 'READ_ALL', null, 'Iniciando consulta de todos los préstamos');
    
    try {
        const prestamos = await prestamosModel.getAllPrestamos();
        
        logger.crud('prestamos', 'READ_ALL', null, `Consulta exitosa. Total: ${prestamos.length} préstamos`, {
            totalPrestamos: prestamos.length
        });
        
        res.json(prestamos);
    } catch (error) {
        logger.crudError('prestamos', 'READ_ALL', null, error);
        
        // Extraer mensaje amigable del error ODBC/SQL
        let errorMessage = error.message;
        if (error.odbcErrors && error.odbcErrors.length > 0) {
            const odbcError = error.odbcErrors[0];
            if (odbcError.message && odbcError.message.includes('RAISERROR executed:')) {
                const raiseErrorMessage = odbcError.message.split('RAISERROR executed: ')[1];
                if (raiseErrorMessage) {
                    errorMessage = raiseErrorMessage
                        .trim()
                        .replace(/\n/g, ' ')
                        .replace(/\s+/g, ' ')
                        .replace(/^\[.*?\]\s*/, '')
                        .replace(/^Error:\s*/i, '')
                        .trim();
                }
            }
        }
        
        res.status(500).json({ error: errorMessage });
    }
};

// ==========================================
// 2. OBTENER PRÉSTAMO POR ID
// ==========================================
/**
 * Obtiene un préstamo específico por su ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getPrestamoById = async (req, res) => {
    const { id } = req.params;
    
    logger.crud('prestamos', 'READ_BY_ID', id, 'Iniciando búsqueda de préstamo por ID');
    
    try {
        const prestamo = await prestamosModel.getPrestamoById(id);
        
        if (!prestamo) {
            logger.warn('PRESTAMOS', `READ_BY_ID ID:${id}`, 'Préstamo no encontrado en base de datos');
            return res.status(404).json({ message: 'Préstamo no encontrado' });
        }
        
        logger.crud('prestamos', 'READ_BY_ID', id, `Préstamo encontrado`, {
            prestamoId: prestamo.PRESTAMO_ID,
            socioId: prestamo.SOCIO_ID,
            materialId: prestamo.MATERIAL_ID
        });
        
        res.json(prestamo);
    } catch (error) {
        logger.crudError('prestamos', 'READ_BY_ID', id, error);
        
        // Extraer mensaje amigable del error ODBC/SQL
        let errorMessage = error.message;
        if (error.odbcErrors && error.odbcErrors.length > 0) {
            const odbcError = error.odbcErrors[0];
            if (odbcError.message && odbcError.message.includes('RAISERROR executed:')) {
                const raiseErrorMessage = odbcError.message.split('RAISERROR executed: ')[1];
                if (raiseErrorMessage) {
                    errorMessage = raiseErrorMessage
                        .trim()
                        .replace(/\n/g, ' ')
                        .replace(/\s+/g, ' ')
                        .replace(/^\[.*?\]\s*/, '')
                        .replace(/^Error:\s*/i, '')
                        .trim();
                }
            }
        }
        
        res.status(500).json({ error: errorMessage });
    }
};

// ==========================================
// 3. CREAR NUEVO PRÉSTAMO
// ==========================================
/**
 * Crea un nuevo préstamo en el sistema
 * @param {Object} req - Request object con datos del préstamo
 * @param {Object} res - Response object
 */
exports.createPrestamo = async (req, res) => {
    const prestamo = req.body;
    
    logger.crud('prestamos', 'CREATE', null, 'Iniciando creación de nuevo préstamo', {
        socioId: prestamo.SOCIO_ID,
        materialId: prestamo.MATERIAL_ID,
        fechaPrestamo: prestamo.FECHA_PRESTAMO,
        usuario: req.user?.usuario || 'sistema'
    });

    // ==========================================
    // VALIDACIÓN CON HELPER REUTILIZABLE
    // ==========================================
    const validation = validatePrestamo(prestamo);
    if (!validation.isValid) {
        return sendValidationError(res, validation.errors, 'Préstamo');
    }
    
    try {
        const result = await prestamosModel.createPrestamo(prestamo, req.user);
        
        if (result.error) {
            logger.warn('PRESTAMOS', 'CREATE', 'Error de validación del modelo', { error: result.error });
            return res.status(400).json({ error: result.error });
        }
        
        logger.crud('prestamos', 'CREATE', null, `Préstamo creado exitosamente`, {
            prestamoId: result.insertId,
            socioId: prestamo.SOCIO_ID,
            materialId: prestamo.MATERIAL_ID
        });
        
        res.status(201).json({ 
            message: 'Préstamo creado correctamente',
            prestamoId: result.insertId
        });
    } catch (error) {
        logger.crudError('prestamos', 'CREATE', null, error, {
            datosRecibidos: { SOCIO_ID: prestamo.SOCIO_ID, MATERIAL_ID: prestamo.MATERIAL_ID }
        });
        
        // Extraer mensaje amigable del error ODBC/SQL
        let errorMessage = error.message;
        if (error.odbcErrors && error.odbcErrors.length > 0) {
            const odbcError = error.odbcErrors[0];
            if (odbcError.message && odbcError.message.includes('RAISERROR executed:')) {
                const raiseErrorMessage = odbcError.message.split('RAISERROR executed: ')[1];
                if (raiseErrorMessage) {
                    errorMessage = raiseErrorMessage
                        .trim()
                        .replace(/\n/g, ' ')
                        .replace(/\s+/g, ' ')
                        .replace(/^\[.*?\]\s*/, '')
                        .replace(/^Error:\s*/i, '')
                        .trim();
                }
            }
        }
        
        res.status(500).json({ error: errorMessage });
    }
};

// ==========================================
// 4. ACTUALIZAR PRÉSTAMO EXISTENTE
// ==========================================
/**
 * Actualiza los datos de un préstamo existente
 * @param {Object} req - Request object con ID y datos del préstamo
 * @param {Object} res - Response object
 */
exports.updatePrestamo = async (req, res) => {
    const { id } = req.params;
    const prestamo = req.body;
    
    logger.crud('prestamos', 'UPDATE', id, 'Iniciando actualización de préstamo', {
        socioId: prestamo.SOCIO_ID,
        materialId: prestamo.MATERIAL_ID,
        usuario: req.user?.usuario || 'sistema'
    });

    // ==========================================
    // VALIDACIÓN CON HELPER REUTILIZABLE
    // ==========================================
    const validation = validatePrestamo(prestamo);
    if (!validation.isValid) {
        return sendValidationError(res, validation.errors, 'Préstamo');
    }
    
    try {
        const result = await prestamosModel.updatePrestamo(id, prestamo);
        
        if (!result || result.affectedRows === 0) {
            logger.warn('PRESTAMOS', `UPDATE ID:${id}`, 'Préstamo no encontrado para actualizar');
            return res.status(404).json({ message: 'Préstamo no encontrado' });
        }
        
        logger.crud('prestamos', 'UPDATE', id, `Préstamo actualizado exitosamente`, {
            socioId: prestamo.SOCIO_ID,
            materialId: prestamo.MATERIAL_ID
        });
        
        res.json({ message: 'Préstamo actualizado correctamente' });
    } catch (error) {
        logger.crudError('prestamos', 'UPDATE', id, error, {
            datosRecibidos: { SOCIO_ID: prestamo.SOCIO_ID, MATERIAL_ID: prestamo.MATERIAL_ID }
        });
        
        // Extraer mensaje amigable del error ODBC/SQL
        let errorMessage = error.message;
        if (error.odbcErrors && error.odbcErrors.length > 0) {
            const odbcError = error.odbcErrors[0];
            if (odbcError.message && odbcError.message.includes('RAISERROR executed:')) {
                const raiseErrorMessage = odbcError.message.split('RAISERROR executed: ')[1];
                if (raiseErrorMessage) {
                    errorMessage = raiseErrorMessage
                        .trim()
                        .replace(/\n/g, ' ')
                        .replace(/\s+/g, ' ')
                        .replace(/^\[.*?\]\s*/, '')
                        .replace(/^Error:\s*/i, '')
                        .trim();
                }
            }
        }
        
        res.status(500).json({ error: errorMessage });
    }
};

// ==========================================
// 5. ELIMINAR PRÉSTAMO
// ==========================================
/**
 * Elimina un préstamo del sistema
 * @param {Object} req - Request object con ID del préstamo
 * @param {Object} res - Response object
 */
exports.deletePrestamo = async (req, res) => {
    const { id } = req.params;

    logger.crud('prestamos', 'DELETE', id, 'Iniciando eliminación de préstamo');
    
    try {
        const result = await prestamosModel.deletePrestamo(id);
        
        if (!result || result.affectedRows === 0) {
            logger.warn('PRESTAMOS', `DELETE ID:${id}`, 'Préstamo no encontrado o no eliminado');
            return res.status(404).json({ message: 'Préstamo no encontrado' });
        }
        
        logger.crud('prestamos', 'DELETE', id, 'Préstamo eliminado exitosamente');
        res.json({ message: 'Préstamo eliminado correctamente' });
    } catch (error) {
        logger.crudError('prestamos', 'DELETE', id, error);
        
        // Verificar si hay errores ODBC específicos para información detallada
        if (error.odbcErrors && Array.isArray(error.odbcErrors)) {
            logger.error('DATABASE', 'ODBC_ERRORS', `Errores ODBC en DELETE préstamo ID:${id}`, {
                odbcErrorsCount: error.odbcErrors.length,
                odbcErrors: error.odbcErrors
            });
        }
        
        // Extraer mensaje amigable del error ODBC/SQL
        let errorMessage = error.message;
        if (error.odbcErrors && error.odbcErrors.length > 0) {
            const odbcError = error.odbcErrors[0];
            if (odbcError.message) {
                // Casos específicos de errores de integridad referencial
                if (odbcError.message.includes('is referenced by foreign key')) {
                    errorMessage = 'No se puede eliminar el préstamo porque está siendo referenciado en otros registros del sistema.';
                } else {
                    errorMessage = odbcError.message;
                    
                    // Si hay RAISERROR, extraer el mensaje limpio
                    if (odbcError.message.includes('RAISERROR executed:')) {
                        const raiseErrorMessage = odbcError.message.split('RAISERROR executed: ')[1];
                        if (raiseErrorMessage) {
                            errorMessage = raiseErrorMessage
                                .trim()
                                .replace(/\n/g, ' ')
                                .replace(/\s+/g, ' ')
                                .replace(/^\[.*?\]\s*/, '')
                                .replace(/^Error:\s*/i, '')
                                .trim();
                        }
                    }
                }
            }
        }
        
        res.status(500).json({ error: errorMessage });
    }
};
