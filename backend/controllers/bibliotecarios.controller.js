//  * =========================================
//  * CONTROLADOR DE BIBLIOTECARIOS - GESTLIB
//  * =========================================

const bibliotecarioModel = require('../models/bibliotecarios.model');
const logger = require('../utils/logger');
const { validateBibliotecario, sendValidationError } = require('../utils/validation');

// ==========================================
// FUNCIÓN DE REGISTRO 
// ==========================================
exports.registrar = async (req, res) => {
    const { usuario, privilegios, nombre, contrasena, cedula, apellido } = req.body;
    
    logger.api('BIBLIOTECARIOS', 'REGISTRAR', 'Intento de registro legacy', {
        usuario,
        nombre,
        apellido
    });
    
    if (!usuario || !contrasena || !nombre) {
        return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }
    try {
        await bibliotecarioModel.createBibliotecario({ usuario, privilegios, nombre, contrasena, cedula, apellido });
        
        logger.api('BIBLIOTECARIOS', 'REGISTRAR', `Registro exitoso: ${usuario}`, {
            usuario,
            nombre,
            apellido
        });
        
        res.status(201).json({ message: 'Usuario registrado correctamente' });
    } catch (err) {
        logger.error('BIBLIOTECARIOS', 'REGISTRAR', 'Error en registro legacy', { error: err.message });
        res.status(500).json({ message: 'Error al registrar usuario' });
    }
};

// ==========================================
// 1. OBTENER TODOS LOS BIBLIOTECARIOS
// ==========================================
/**
 * Obtiene la lista completa de bibliotecarios
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getAllBibliotecarios = async (req, res) => {
    logger.crud('bibliotecarios', 'READ_ALL', null, 'Iniciando consulta de todos los bibliotecarios');
    
    try {
        const bibliotecarios = await bibliotecarioModel.getAllBibliotecarios();
        
        logger.crud('bibliotecarios', 'READ_ALL', null, `Consulta exitosa. Total: ${bibliotecarios.length} bibliotecarios`, {
            totalBibliotecarios: bibliotecarios.length
        });
        
        res.json(bibliotecarios);
    } catch (error) {
        logger.crudError('bibliotecarios', 'READ_ALL', null, error);
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 2. OBTENER BIBLIOTECARIO POR ID
// ==========================================
/**
 * Obtiene un bibliotecario específico por su ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getBibliotecarioById = async (req, res) => {
    const { id } = req.params;
    
    logger.crud('bibliotecarios', 'READ_BY_ID', id, 'Iniciando búsqueda de bibliotecario por ID');

    try {
        const bibliotecario = await bibliotecarioModel.getBibliotecarioById(id);
        
        if (!bibliotecario) {
            logger.warn('BIBLIOTECARIOS', `READ_BY_ID ID:${id}`, 'Bibliotecario no encontrado en base de datos');
            return res.status(404).json({ message: 'Bibliotecario no encontrado' });
        }
        
        logger.crud('bibliotecarios', 'READ_BY_ID', id, `Bibliotecario encontrado: ${bibliotecario.NOMBRE} ${bibliotecario.APELLIDO}`, {
            usuario: bibliotecario.USUARIO,
            nombre: bibliotecario.NOMBRE,
            apellido: bibliotecario.APELLIDO
        });
        
        res.json(bibliotecario);
    } catch (error) {
        logger.crudError('bibliotecarios', 'READ_BY_ID', id, error);
        res.status(500).json({ error: error.message });
    }
};

// Crear un nuevo bibliotecario
exports.createBibliotecario = async (req, res) => {
    logger.crud('bibliotecarios', 'CREATE', null, 'Iniciando creación de bibliotecario', req.body);
    
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

    // Validación de datos usando helper
    const validation = validateBibliotecario(bibliotecario);
    if (!validation.isValid) {
        logger.warn('BIBLIOTECARIOS', 'CREATE', 'Validación fallida', {
            errors: validation.errors,
            warnings: validation.warnings,
            receivedData: Object.keys(bibliotecario)
        });
        return res.status(400).json({ error: validation.message });
    }

    try {
        const bibliotecarioData = {
            USUARIO,
            PRIVILEGIOS: PRIVILEGIOS || 'N',
            NOMBRE,
            APELLIDO,
            CEDULA,
            CONTRASENA
        };

        logger.info('BIBLIOTECARIOS', 'CREATE', 'Enviando datos al modelo', {
            usuario: USUARIO,
            nombre: NOMBRE,
            apellido: APELLIDO,
            privilegios: PRIVILEGIOS || 'N'
        });

        const result = await bibliotecarioModel.createBibliotecarioCRUD(bibliotecarioData);

        if (result.affectedRows > 0) {
            logger.crud('bibliotecarios', 'CREATE', null, `Bibliotecario creado exitosamente: ${NOMBRE} ${APELLIDO}`, {
                usuario: USUARIO,
                affectedRows: result.affectedRows
            });
            res.status(201).json({ message: 'Bibliotecario creado exitosamente' });
        } else {
            logger.warn('BIBLIOTECARIOS', 'CREATE', 'No se pudo crear bibliotecario - Sin filas afectadas', {
                usuario: USUARIO,
                result
            });
            res.status(400).json({ error: 'No se pudo crear el bibliotecario' });
        }
    } catch (error) {
        logger.crudError('bibliotecarios', 'CREATE', null, error, {
            usuario: USUARIO,
            errorDetails: {
                message: error.message,
                code: error.code,
                state: error.state
            }
        });
        
        // Manejo específico de errores ODBC
        if (error.odbcErrors && Array.isArray(error.odbcErrors)) {
            const odbcError = error.odbcErrors[0];
            if (odbcError && odbcError.message.includes('RAISERROR')) {
                const raiseErrorMatch = odbcError.message.match(/RAISERROR[^:]*:\s*(.+)/);
                if (raiseErrorMatch) {
                    const customMessage = raiseErrorMatch[1].trim();
                    logger.warn('BIBLIOTECARIOS', 'CREATE', 'Error RAISERROR capturado', {
                        customMessage,
                        originalError: odbcError.message
                    });
                    return res.status(400).json({ error: customMessage });
                }
            }
        }
        
        res.status(500).json({ error: error.message });
    }
};

// Actualizar un bibliotecario
exports.updateBibliotecario = async (req, res) => {
    const { id } = req.params;
    logger.crud('bibliotecarios', 'UPDATE', id, 'Iniciando actualización de bibliotecario', req.body);
    
    const bibliotecario = req.body;

    const {
        USUARIO,
        PRIVILEGIOS,
        NOMBRE,
        APELLIDO,
        CEDULA,
        CONTRASENA
    } = bibliotecario;

    // Validación de datos usando helper (para updates, algunos campos pueden ser opcionales)
    const requiredFields = ['USUARIO', 'NOMBRE', 'APELLIDO', 'CEDULA'];
    const missingFields = requiredFields.filter(field => !bibliotecario[field]);
    
    if (missingFields.length > 0) {
        logger.warn('BIBLIOTECARIOS', `UPDATE ID:${id}`, 'Campos obligatorios faltantes', {
            missingFields,
            receivedData: Object.keys(bibliotecario)
        });
        return res.status(400).json({ 
            error: `Los campos ${missingFields.join(', ')} son obligatorios` 
        });
    }

    try {
        const bibliotecarioData = {
            USUARIO,
            PRIVILEGIOS: PRIVILEGIOS || 'N',
            NOMBRE,
            APELLIDO,
            CEDULA,
            CONTRASENA
        };

        logger.info('BIBLIOTECARIOS', `UPDATE ID:${id}`, 'Enviando datos al modelo', {
            usuario: USUARIO,
            nombre: NOMBRE,
            apellido: APELLIDO,
            privilegios: PRIVILEGIOS || 'N'
        });

        const result = await bibliotecarioModel.updateBibliotecario(id, bibliotecarioData);

        if (result.affectedRows > 0) {
            logger.crud('bibliotecarios', 'UPDATE', id, `Bibliotecario actualizado exitosamente: ${NOMBRE} ${APELLIDO}`, {
                usuario: USUARIO,
                affectedRows: result.affectedRows
            });
            res.json({ message: 'Bibliotecario actualizado exitosamente' });
        } else {
            logger.warn('BIBLIOTECARIOS', `UPDATE ID:${id}`, 'Bibliotecario no encontrado o sin cambios', {
                usuario: USUARIO,
                result
            });
            res.status(404).json({ error: 'Bibliotecario no encontrado' });
        }
    } catch (error) {
        logger.crudError('bibliotecarios', 'UPDATE', id, error, {
            usuario: USUARIO,
            errorDetails: {
                message: error.message,
                code: error.code,
                state: error.state
            }
        });
        
        // Manejo específico de errores ODBC
        if (error.odbcErrors && Array.isArray(error.odbcErrors)) {
            const odbcError = error.odbcErrors[0];
            if (odbcError && odbcError.message.includes('RAISERROR')) {
                const raiseErrorMatch = odbcError.message.match(/RAISERROR[^:]*:\s*(.+)/);
                if (raiseErrorMatch) {
                    const customMessage = raiseErrorMatch[1].trim();
                    logger.warn('BIBLIOTECARIOS', `UPDATE ID:${id}`, 'Error RAISERROR capturado', {
                        customMessage,
                        originalError: odbcError.message
                    });
                    return res.status(400).json({ error: customMessage });
                }
            }
        }
        
        res.status(500).json({ error: error.message });
    }
};

// Eliminar un bibliotecario
exports.deleteBibliotecario = async (req, res) => {
    const { id } = req.params;
    logger.crud('bibliotecarios', 'DELETE', id, 'Iniciando eliminación de bibliotecario');

    try {
        logger.info('BIBLIOTECARIOS', `DELETE ID:${id}`, 'Enviando solicitud de eliminación al modelo');
        
        const result = await bibliotecarioModel.deleteBibliotecario(id);
        
        logger.info('BIBLIOTECARIOS', `DELETE ID:${id}`, 'Respuesta del modelo recibida', {
            result,
            affectedRows: result?.affectedRows,
            count: result?.count
        });

        if (!result || result.affectedRows === 0 || result.count === 0) {
            logger.warn('BIBLIOTECARIOS', `DELETE ID:${id}`, 'Bibliotecario no encontrado o no eliminado', {
                result
            });
            return res.status(404).json({ message: 'Bibliotecario no encontrado' });
        }

        logger.crud('bibliotecarios', 'DELETE', id, 'Bibliotecario eliminado exitosamente', {
            affectedRows: result.affectedRows || result.count
        });
        res.json({ message: 'Bibliotecario eliminado exitosamente' });
    } catch (error) {
        logger.crudError('bibliotecarios', 'DELETE', id, error, {
            errorDetails: {
                message: error.message,
                code: error.code,
                state: error.state
            }
        });
        
        // Verificar si hay errores ODBC específicos
        if (error.odbcErrors && Array.isArray(error.odbcErrors)) {
            logger.error('BIBLIOTECARIOS', `DELETE ID:${id}`, 'Errores ODBC encontrados', {
                odbcErrorsCount: error.odbcErrors.length,
                odbcErrors: error.odbcErrors.map((odbcError, index) => ({
                    index: index + 1,
                    state: odbcError.state,
                    code: odbcError.code,
                    message: odbcError.message
                }))
            });
            
            // Buscar errores RAISERROR
            const raiseError = error.odbcErrors.find(odbcError => 
                odbcError.message && odbcError.message.includes('RAISERROR')
            );
            
            if (raiseError) {
                const raiseErrorMatch = raiseError.message.match(/RAISERROR[^:]*:\s*(.+)/);
                if (raiseErrorMatch) {
                    const customMessage = raiseErrorMatch[1].trim();
                    logger.warn('BIBLIOTECARIOS', `DELETE ID:${id}`, 'Error RAISERROR capturado', {
                        customMessage,
                        originalError: raiseError.message
                    });
                    return res.status(400).json({ error: customMessage });
                }
            }
            
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
    const { texto, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    
    logger.crud('bibliotecarios', 'READ_FILTERED', null, 'Iniciando búsqueda filtrada de bibliotecarios', {
        texto,
        page: pageNum,
        limit: limitNum
    });
    
    try {
        logger.info('BIBLIOTECARIOS', 'READ_FILTERED', 'Ejecutando filtrado en modelo', {
            searchText: texto || 'sin filtro',
            pagination: { page: pageNum, limit: limitNum }
        });
        
        const { bibliotecarios, total } = await bibliotecarioModel.getBibliotecariosFiltrados(texto, pageNum, limitNum);
        
        logger.crud('bibliotecarios', 'READ_FILTERED', null, `Búsqueda completada: ${bibliotecarios.length} resultados de ${total} total`, {
            resultCount: bibliotecarios.length,
            totalCount: total,
            searchText: texto || 'sin filtro',
            pagination: { page: pageNum, limit: limitNum }
        });
        
        res.json({ bibliotecarios, total, page: pageNum, limit: limitNum });
    } catch (error) {
        logger.crudError('bibliotecarios', 'READ_FILTERED', null, error, {
            searchText: texto,
            pagination: { page: pageNum, limit: limitNum },
            errorDetails: {
                message: error.message,
                code: error.code,
                state: error.state
            }
        });
        res.status(500).json({ error: error.message });
    }
};
