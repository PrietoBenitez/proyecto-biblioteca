const { format } = require('path');
const { getConnection } = require('../config/db');
const materialesModel = require('../models/materiales.model');


// Obtener todos los materiales
exports.getAllMateriales = async (req, res) => {
    try {
        const materiales = await materialesModel.getAllMateriales();
        res.json(materiales);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener un material por ID
exports.getMaterialById = async (req, res) => {
    const { id } = req.params;
    try {
        const material = await materialesModel.getMaterialById(id);
        if (!material) {
            return res.status(404).json({ message: 'Material no encontrado' });
        }
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
        res.status(500).json({ error: error.message });
    }
};

// Crear un nuevo material
exports.createMaterial = async (req, res) => {
    const material = req.body;
    
    // Validación de campos obligatorios
    if (!material.NOMBRE || !material.SUBTIPO_ID || !material.TIPO_MATERIAL) {
        console.log('❌ Error: Faltan campos obligatorios en material');
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    
    try {
        // Insertar material
        const db = require('../models/materiales.model');
        const insertResult = await db.createMaterial(material);
        
        // Obtener el último ID insertado
        const conn = await require('../config/db').getConnection();
        const lastIdResult = await conn.query('SELECT MAX(NUMERO_ID) as lastId FROM MATERIALES');
        await conn.close();
        
        const lastId = lastIdResult.rows ? lastIdResult.rows[0].lastId : lastIdResult[0].lastId;
        
        if (!lastId) {
            console.log('❌ No se pudo obtener el último ID del material creado');
            return res.status(201).json({ message: 'Material creado, pero no se pudo obtener el registro.' });
        }
        
        // Obtener el material recién creado
        const m = await db.getMaterialById(lastId);
        
        if (!m) {
            console.log('❌ No se pudo obtener el material recién creado');
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
        
        console.log('✅ Material creado exitosamente:', material.NOMBRE);
        res.status(201).json({ message: 'Material creado exitosamente', material: materialMap });
    } catch (error) {
        console.error('❌ Error al crear material:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// Actualizar un material existente
exports.updateMaterial = async (req, res) => {
    const { id } = req.params;
    const material = req.body;
    
    console.log('📝 CONTROLLER UPDATE - ID:', id);
    console.log('📝 CONTROLLER UPDATE - Estado:', material.DISPONIBILIDAD);
    console.log('📝 CONTROLLER UPDATE - Usuario autenticado:', req.user);
    console.log('📝 CONTROLLER UPDATE - Datos completos:', JSON.stringify(material, null, 2));

    try {
        // Pasar información del bibliotecario autenticado al modelo
        const bibliotecario = req.user ? {
            id: req.user.id,
            usuario: req.user.usuario
        } : { id: 1, usuario: 'dba' }; // Fallback para DBA
        
        console.log('🔍 CONTROLLER UPDATE - Bibliotecario extraído del token:', bibliotecario);
        
        const result = await materialesModel.updateMaterial(id, material, bibliotecario);

        if (!result || result.affectedRows === 0 || result.count === 0) {
            console.log('❌ Material no encontrado o no actualizado. ID:', id);
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
        
        console.log('✅ Material actualizado exitosamente. ID:', id, 'Nombre:', m.NOMBRE);
        res.json({ message: 'Material actualizado exitosamente', material: materialMap });
    } catch (error) {
        console.error('❌ Error al actualizar material ID:', id, 'Error:', error.message);
        
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

// Eliminar un material
exports.deleteMaterial = async (req, res) => {
    const { id } = req.params;

    console.log('🗑️ DELETE MATERIAL - Iniciando eliminación de material ID:', id);
    console.log('🗑️ DELETE MATERIAL - Usuario autenticado:', req.user);

    try {
        // Obtener información del material antes de eliminarlo para logs
        const materialExistente = await materialesModel.getMaterialById(id);
        if (materialExistente) {
            console.log('🗑️ DELETE MATERIAL - Material encontrado:', materialExistente.NOMBRE);
        } else {
            console.log('❌ DELETE MATERIAL - Material no encontrado en base de datos. ID:', id);
            return res.status(404).json({ message: 'Material no encontrado' });
        }

        const result = await materialesModel.deleteMaterial(id);
        console.log('🗑️ DELETE MATERIAL - Resultado de eliminación:', result);

        if (!result || result.affectedRows === 0 || result.count === 0) {
            console.log('❌ DELETE MATERIAL - Material no eliminado. ID:', id);
            return res.status(404).json({ message: 'Material no encontrado' });
        }

        console.log('✅ DELETE MATERIAL - Material eliminado exitosamente. ID:', id, 'Nombre:', materialExistente.NOMBRE);
        res.json({ message: 'Material eliminado exitosamente' });
    } catch (error) {
        console.error('❌ DELETE MATERIAL - Error al eliminar material ID:', id, 'Error:', error.message);
        console.error('❌ DELETE MATERIAL - Stack trace:', error.stack);
        
        // Extraer mensaje amigable del error ODBC/SQL
        let errorMessage = error.message;
        if (error.odbcErrors && error.odbcErrors.length > 0) {
            console.error('❌ DELETE MATERIAL - ODBC Errors:', error.odbcErrors);
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
        res.status(500).json({ error: error.message });
    }
};

// Obtener categorías
exports.getCategorias = async (req, res) => {
    try {
        const categorias = await materialesModel.getCategorias();
        res.json(categorias);
    } catch (error) {
        console.error('Error en endpoint /api/materiales/categorias:', error);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
};
// Obtener subtipos
exports.getSubtipos = async (req, res) => {
    try {
        const subtipos = await materialesModel.getSubtipos();
        res.json(subtipos);
    } catch (error) {
        console.error('Error en endpoint /api/materiales/subtipos:', error);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
};
// Obtener países
exports.getPaises = async (req, res) => {
    try {
        const paises = await materialesModel.getPaises();
        res.json(paises);
    } catch (error) {
        console.error('Error en endpoint /api/materiales/paises:', error);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
};
// Obtener donantes
exports.getDonantes = async (req, res) => {
    try {
        const donantes = await materialesModel.getDonantes();
        res.json(donantes);
    } catch (error) {
        console.error('Error en endpoint /api/materiales/donantes:', error);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
};
