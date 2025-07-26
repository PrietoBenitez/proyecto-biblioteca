//  * =========================================
//  * CONTROLADOR DE MATERIALES - GESTLIB
//  * =========================================

const { format } = require('path');
const { getConnection } = require('../config/db');
const materialesModel = require('../models/materiales.model');
const logger = require('../utils/logger');
const { validateMaterial, sendValidationError } = require('../utils/validation');


// ==========================================
// 1. OBTENER TODOS LOS MATERIALES
// ==========================================
/**
 * Obtiene la lista completa de materiales
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getAllMateriales = async (req, res) => {
    logger.crud('materiales', 'READ_ALL', null, 'Iniciando consulta de todos los materiales');
    
    try {
        const materiales = await materialesModel.getAllMateriales();
        
        logger.crud('materiales', 'READ_ALL', null, `Consulta exitosa. Total: ${materiales.length} materiales`, {
            totalMateriales: materiales.length
        });
        
        res.json(materiales);
    } catch (error) {
        logger.crudError('materiales', 'READ_ALL', null, error);
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 2. OBTENER MATERIAL POR ID
// ==========================================
/**
 * Obtiene un material específico por su ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getMaterialById = async (req, res) => {
    const { id } = req.params;
    
    logger.crud('materiales', 'READ_BY_ID', id, 'Iniciando búsqueda de material por ID');

    try {
        const material = await materialesModel.getMaterialById(id);
        
        if (!material) {
            logger.warn('MATERIALES', `READ_BY_ID ID:${id}`, 'Material no encontrado en base de datos');
            return res.status(404).json({ message: 'Material no encontrado' });
        }
        
        logger.crud('materiales', 'READ_BY_ID', id, `Material encontrado: ${material.NOMBRE}`, {
            nombre: material.NOMBRE,
            tipo: material.TIPO_MATERIAL,
            estado: material.DISPONIBILIDAD
        });
        
        // Mapear los campos igual que en el listado, incluyendo los descriptivos
        const materialMap = {
            id: material.NUMERO_ID,
            nombre: material.NOMBRE,
            subtipo: material.SUBTIPO_ID,
            subtipo_desc: material.SUBTIPO_DESC,
            categoria: material.CATEGORIA_ID, // ID de la categoría asociada al subtipo
            categoria_desc: material.CATEGORIA_DESC,
            tipo_material: material.TIPO_MATERIAL,
            formato: material.FORMATO,
            ubicacion: material.UBICACION,
            valor_estimado: material.VALOR_GS,
            pais_origen: material.NACIONALIDAD,
            pais_desc: material.PAIS_DESC,
            descripcion: material.DESCRIPCION,
            estado: material.DISPONIBILIDAD,
            es_restringido: material.RESTRINGIDO,
            donado: material.DONADO,
            nombre_donante: material.DONANTE_ID,
            donante_nombre: material.DONANTE_NOMBRE,
            donante_apellido: material.DONANTE_APELLIDO,
            fecha_donacion: material.FECHA_DONACION,
            estado_al_donar: material.ESTADO_DONACION,
            condicion: material.CONDICION
        };
        res.json(materialMap);
    } catch (error) {
        logger.crudError('materiales', 'READ_BY_ID', id, error);
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 3. CREAR NUEVO MATERIAL
// ==========================================
/**
 * Crea un nuevo material en el sistema
 * @param {Object} req - Request object con datos del material
 * @param {Object} res - Response object
 */
exports.createMaterial = async (req, res) => {
    const material = req.body;
    
    logger.crud('materiales', 'CREATE', null, 'Iniciando creación de nuevo material', {
        nombre: material.NOMBRE,
        tipo: material.TIPO_MATERIAL,
        subtipo: material.SUBTIPO_ID
    });

    // ==========================================
    // VALIDACIÓN CON HELPER REUTILIZABLE
    // ==========================================
    const validation = validateMaterial(material);
    if (!validation.isValid) {
        return sendValidationError(res, validation.errors, 'Material');
    }

    try {
        // Insertar material
        const insertResult = await materialesModel.createMaterial(material);
        
        // Obtener el último ID insertado
        const conn = await getConnection();
        const lastIdResult = await conn.query('SELECT MAX(NUMERO_ID) as lastId FROM MATERIALES');
        await conn.close();
        
        const lastId = lastIdResult.rows ? lastIdResult.rows[0].lastId : lastIdResult[0].lastId;
        
        if (!lastId) {
            logger.warn('MATERIALES', 'CREATE', 'No se pudo obtener el último ID del material creado');
            return res.status(201).json({ message: 'Material creado, pero no se pudo obtener el registro.' });
        }
        
        // Obtener el material recién creado
        const m = await materialesModel.getMaterialById(lastId);
        
        if (!m) {
            logger.warn('MATERIALES', 'CREATE', 'No se pudo obtener el material recién creado');
            return res.status(201).json({ message: 'Material creado, pero no se pudo obtener el registro.' });
        }
        // Mapear igual que en el listado
        const materialMap = {
            id: m.NUMERO_ID,
            nombre: m.NOMBRE,
            subtipo: m.SUBTIPO_ID,
            subtipo_desc: m.SUBTIPO_DESC,
            categoria: m.CATEGORIA_ID,
            categoria_desc: m.CATEGORIA_DESC,
            tipo_material: m.TIPO_MATERIAL,
            formato: m.FORMATO,
            ubicacion: m.UBICACION,
            valor_estimado: m.VALOR_GS,
            pais_origen: m.NACIONALIDAD,
            pais_desc: m.PAIS_DESC,
            descripcion: m.DESCRIPCION,
            estado: m.DISPONIBILIDAD,
            es_restringido: m.RESTRINGIDO,
            donado: m.DONADO,
            nombre_donante: m.DONANTE_ID,
            donante_nombre: m.DONANTE_NOMBRE,
            donante_apellido: m.DONANTE_APELLIDO,
            fecha_donacion: m.FECHA_DONACION,
            estado_al_donar: m.ESTADO_DONACION,
            condicion: m.CONDICION
        };
        
        logger.crud('materiales', 'CREATE', null, `Material creado exitosamente: ${material.NOMBRE}`, {
            nombre: material.NOMBRE,
            tipo: material.TIPO_MATERIAL,
            id: lastId
        });
        
        res.status(201).json({ message: 'Material creado exitosamente', material: materialMap });
    } catch (error) {
        logger.crudError('materiales', 'CREATE', null, error, {
            datosRecibidos: { NOMBRE: material.NOMBRE, TIPO_MATERIAL: material.TIPO_MATERIAL }
        });
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 4. ACTUALIZAR MATERIAL EXISTENTE
// ==========================================
/**
 * Actualiza los datos de un material existente
 * @param {Object} req - Request object con ID y datos del material
 * @param {Object} res - Response object
 */
exports.updateMaterial = async (req, res) => {
    const { id } = req.params;
    const material = req.body;
    
    logger.crud('materiales', 'UPDATE', id, 'Iniciando actualización de material', {
        nombre: material.NOMBRE,
        tipo: material.TIPO_MATERIAL,
        estado: material.DISPONIBILIDAD
    });

    // ==========================================
    // VALIDACIÓN CON HELPER REUTILIZABLE
    // ==========================================
    const validation = validateMaterial(material);
    if (!validation.isValid) {
        return sendValidationError(res, validation.errors, 'Material');
    }

    try {
        // Pasar información del bibliotecario autenticado al modelo
        const bibliotecario = req.user ? {
            id: req.user.id,
            usuario: req.user.usuario
        } : { id: 1, usuario: 'dba' }; // Fallback para DBA
        
        logger.debug('MATERIALES', `UPDATE ID:${id}`, 'Bibliotecario extraído del token', { bibliotecario });
        
        const result = await materialesModel.updateMaterial(id, material, bibliotecario);

        if (!result || result.affectedRows === 0 || result.count === 0) {
            logger.warn('MATERIALES', `UPDATE ID:${id}`, 'Material no encontrado para actualizar');
            return res.status(404).json({ message: 'Material no encontrado' });
        }

        // Obtener el material actualizado y mapear igual que en el listado
        const m = await materialesModel.getMaterialById(id);
        if (!m) {
            console.log('❌ No se pudo obtener el material actualizado. ID:', id);
            return res.json({ message: 'Material actualizado, pero no se pudo obtener el registro.' });
        }
        const materialMap = {
            id: m.NUMERO_ID,
            nombre: m.NOMBRE,
            subtipo: m.SUBTIPO_ID,
            subtipo_desc: m.SUBTIPO_DESC,
            categoria: m.CATEGORIA_ID, // ID de la categoría asociada al subtipo
            categoria_desc: m.CATEGORIA_DESC,
            tipo_material: m.TIPO_MATERIAL,
            formato: m.FORMATO,
            ubicacion: m.UBICACION,
            valor_estimado: m.VALOR_GS,
            pais_origen: m.NACIONALIDAD,
            pais_desc: m.PAIS_DESC,
            descripcion: m.DESCRIPCION,
            estado: m.DISPONIBILIDAD,
            es_restringido: m.RESTRINGIDO,
            donado: m.DONADO,
            nombre_donante: m.DONANTE_ID,
            donante_nombre: m.DONANTE_NOMBRE,
            donante_apellido: m.DONANTE_APELLIDO,
            fecha_donacion: m.FECHA_DONACION,
            estado_al_donar: m.ESTADO_DONACION,
            condicion: m.CONDICION
        };
        
        logger.crud('materiales', 'UPDATE', id, `Material actualizado exitosamente: ${m.NOMBRE}`, {
            nombre: m.NOMBRE,
            tipo: m.TIPO_MATERIAL,
            estado: m.DISPONIBILIDAD
        });

        res.json({ message: 'Material actualizado exitosamente', material: materialMap });
    } catch (error) {
        logger.crudError('materiales', 'UPDATE', id, error, {
            datosRecibidos: { NOMBRE: material.NOMBRE, TIPO_MATERIAL: material.TIPO_MATERIAL }
        });
        
        // Extraer mensaje amigable del trigger/RAISERROR
        let errorMessage = error.message;
        if (error.odbcErrors && error.odbcErrors.length > 0) {
            const odbcError = error.odbcErrors[0];
            if (odbcError.message && odbcError.message.includes('RAISERROR executed:')) {
                // Extraer el mensaje después de "RAISERROR executed: "
                const raiseErrorMessage = odbcError.message.split('RAISERROR executed: ')[1];
                if (raiseErrorMessage) {
                    // Limpiar el mensaje: remover saltos de línea, espacios extra y texto técnico
                    errorMessage = raiseErrorMessage
                        .trim()
                        .replace(/\n/g, ' ') // Reemplazar saltos de línea con espacios
                        .replace(/\s+/g, ' ') // Reemplazar múltiples espacios con uno solo
                        .replace(/^\[.*?\]\s*/, '') // Remover códigos o prefijos entre corchetes
                        .replace(/^Error:\s*/i, '') // Remover prefijo "Error:"
                        .trim();
                }
            }
        }
        
        res.status(500).json({ error: errorMessage });
    }
};

// ==========================================
// 5. ELIMINAR MATERIAL
// ==========================================
/**
 * Elimina un material del sistema
 * @param {Object} req - Request object con ID del material
 * @param {Object} res - Response object
 */
exports.deleteMaterial = async (req, res) => {
    const { id } = req.params;

    logger.crud('materiales', 'DELETE', id, 'Iniciando eliminación de material');

    try {
        // Obtener información del material antes de eliminarlo para logs
        const materialExistente = await materialesModel.getMaterialById(id);
        if (materialExistente) {
            logger.debug('MATERIALES', `DELETE ID:${id}`, `Material encontrado: ${materialExistente.NOMBRE}`);
        } else {
            logger.warn('MATERIALES', `DELETE ID:${id}`, 'Material no encontrado en base de datos');
            return res.status(404).json({ message: 'Material no encontrado' });
        }

        const result = await materialesModel.deleteMaterial(id);
        logger.debug('MATERIALES', `DELETE ID:${id}`, 'Resultado del modelo', {
            affectedRows: result?.affectedRows || result?.count || 0
        });

        if (!result || result.affectedRows === 0 || result.count === 0) {
            logger.warn('MATERIALES', `DELETE ID:${id}`, 'Material no encontrado o no eliminado');
            return res.status(404).json({ message: 'Material no encontrado' });
        }

        logger.crud('materiales', 'DELETE', id, `Material eliminado exitosamente: ${materialExistente.NOMBRE}`);
        res.json({ message: 'Material eliminado exitosamente' });
    } catch (error) {
        logger.crudError('materiales', 'DELETE', id, error);
        
        // Verificar si hay errores ODBC específicos para información detallada
        if (error.odbcErrors && Array.isArray(error.odbcErrors)) {
            logger.error('DATABASE', 'ODBC_ERRORS', `Errores ODBC en DELETE material ID:${id}`, {
                odbcErrorsCount: error.odbcErrors.length,
                odbcErrors: error.odbcErrors
            });
        }
        
        // Extraer mensaje del error ODBC/SQL
        let errorMessage = error.message;
        if (error.odbcErrors && error.odbcErrors.length > 0) {
            const odbcError = error.odbcErrors[0];
            if (odbcError.message) {
                // Casos específicos de errores de integridad referencial
                if (odbcError.message.includes('is referenced by foreign key') && odbcError.message.includes('PRESTAMOS')) {
                    errorMessage = 'No se puede eliminar el material porque tiene préstamos asociados. Primero debe gestionar todos los préstamos de este material.';
                } else if (odbcError.message.includes('is referenced by foreign key')) {
                    errorMessage = 'No se puede eliminar el material porque está siendo utilizado en otros registros del sistema.';
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

// // Obtener estados únicos de la tabla Materiales
// exports.getEstadosUnicos = async (req, res) => {
//     try {
//         const estados = await materialesModel.getEstadosUnicos();
//         res.json(estados);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// Filtrar materiales por texto, estado y condición (con paginación)
exports.getMaterialesFiltrados = async (req, res) => {
    try {
        const { texto, estado, condicion, page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;
        const { materiales, total } = await materialesModel.getMaterialesFiltrados(texto, estado, condicion, pageNum, limitNum);
        // Mapear los campos para el frontend, incluyendo los descriptivos
        const materialesMap = materiales.map(m => ({
            id: m.NUMERO_ID,
            nombre: m.NOMBRE,
            subtipo: m.SUBTIPO_ID,
            subtipo_desc: m.SUBTIPO_DESC,
            categoria: m.CATEGORIA_ID, // ID de la categoría asociada al subtipo
            categoria_desc: m.CATEGORIA_DESC,
            tipo_material: m.TIPO_MATERIAL,
            formato: m.FORMATO,
            ubicacion: m.UBICACION,
            valor_estimado: m.VALOR_GS,
            pais_origen: m.NACIONALIDAD,
            pais_desc: m.PAIS_DESC,
            descripcion: m.DESCRIPCION,
            estado: m.DISPONIBILIDAD,
            es_restringido: m.RESTRINGIDO,
            donado: m.DONADO,
            nombre_donante: m.DONANTE_ID,
            donante_nombre: m.DONANTE_NOMBRE,
            donante_apellido: m.DONANTE_APELLIDO,
            fecha_donacion: m.FECHA_DONACION,
            estado_al_donar: m.ESTADO_DONACION,
            condicion: m.CONDICION
        }));
        res.json({ materiales: materialesMap, total, page: pageNum, limit: limitNum });
    } catch (error) {
        logger.error('MATERIALES', 'GET_FILTRADOS', 'Error en filtro de materiales', { error: error.message });
        res.status(500).json({ error: error.message });
    }
};

// Obtener categorías
exports.getCategorias = async (req, res) => {
    try {
        const categorias = await materialesModel.getCategorias();
        res.json(categorias);
    } catch (error) {
        logger.error('MATERIALES', 'GET_CATEGORIAS', 'Error al obtener categorías', { error: error.message });
        res.status(500).json({ error: error.message, stack: error.stack });
    }
};
// Obtener subtipos
exports.getSubtipos = async (req, res) => {
    try {
        const subtipos = await materialesModel.getSubtipos();
        res.json(subtipos);
    } catch (error) {
        logger.error('MATERIALES', 'GET_SUBTIPOS', 'Error al obtener subtipos', { error: error.message });
        res.status(500).json({ error: error.message, stack: error.stack });
    }
};
// Obtener países
exports.getPaises = async (req, res) => {
    try {
        const paises = await materialesModel.getPaises();
        res.json(paises);
    } catch (error) {
        logger.error('MATERIALES', 'GET_PAISES', 'Error al obtener países', { error: error.message });
        res.status(500).json({ error: error.message, stack: error.stack });
    }
};
// Obtener donantes
exports.getDonantes = async (req, res) => {
    try {
        const donantes = await materialesModel.getDonantes();
        res.json(donantes);
    } catch (error) {
        logger.error('MATERIALES', 'GET_DONANTES', 'Error al obtener donantes', { error: error.message });
        res.status(500).json({ error: error.message, stack: error.stack });
    }
};
