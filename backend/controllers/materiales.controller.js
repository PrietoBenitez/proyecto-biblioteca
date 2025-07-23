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
    const bibliotecario_id = req.user && req.user.id ? req.user.id : null;
    if (!material.NOMBRE || !material.SUBTIPO_ID || !material.TIPO_MATERIAL) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    try {
        // const db = require('../models/materiales.model');
        // const insertResult = await db.createMaterial(material, bibliotecario_id);
        // const conn = await require('../config/db').getConnection();
        const conn = req.dbConn;
        const insertResult = await materialesModel.createMaterial(material, bibliotecario_id, conn);
        const lastIdResult = await conn.query('SELECT MAX(NUMERO_ID) as lastId FROM MATERIALES');
        await conn.close();
        const lastId = lastIdResult.rows ? lastIdResult.rows[0].lastId : lastIdResult[0].lastId;
        if (!lastId) return res.status(201).json({ message: 'Material creado, pero no se pudo obtener el registro.' });
        const m = await db.getMaterialById(lastId);
        if (!m) return res.status(201).json({ message: 'Material creado, pero no se pudo obtener el registro.' });
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
        res.status(201).json({ message: 'Material creado exitosamente', material: materialMap });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Actualizar un material existente
exports.updateMaterial = async (req, res) => {
    const { id } = req.params;
    const material = req.body;
    const bibliotecario_id = req.user && req.user.id ? req.user.id : null;
    try {
        // const result = await materialesModel.updateMaterial(id, material, bibliotecario_id);
        const conn = req.dbConn;
        const result = await materialesModel.updateMaterial(id, material, bibliotecario_id, conn);
        if (!result || result.affectedRows === 0 || result.count === 0) {
            return res.status(404).json({ message: 'Material no encontrado' });
        }
        const m = await materialesModel.getMaterialById(id);
        if (!m) return res.json({ message: 'Material actualizado, pero no se pudo obtener el registro.' });
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
        res.json({ message: 'Material actualizado exitosamente', material: materialMap });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar un material
exports.deleteMaterial = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await materialesModel.deleteMaterial(id);

        if (!result || result.affectedRows === 0 || result.count === 0) {
            return res.status(404).json({ message: 'Material no encontrado' });
        }

        res.json({ message: 'Material eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
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
