const { getConnection } = require('../config/db');

async function getAllMateriales() {
    const db = await getConnection();
    const result = await db.query('SELECT * FROM Materiales');
    await db.close();
    return result;
}

async function getMaterialById(id) {
    const db = await getConnection();
    const result = await db.query('SELECT * FROM Materiales WHERE id = ?', [id]);
    await db.close();
    return result[0];
}

async function createMaterial(data) {
    const db = await getConnection();
    const insertQuery = `
        INSERT INTO Materiales (
            nombre, categoria, subtipo, tipo_material, formato, ubicacion, valor_estimado, pais_origen, descripcion, estado, es_restringido, donado, nombre_donante, fecha_donacion, estado_al_donar
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
        data.nombre,
        data.categoria,
        data.subtipo,
        data.tipo_material,
        data.formato || null,
        data.ubicacion || null,
        data.valor_estimado || null,
        data.pais_origen || null,
        data.descripcion || null,
        data.estado || 'disponible',
        data.es_restringido || 0,
        data.donado || 0,
        data.nombre_donante || null,
        data.fecha_donacion || null,
        data.estado_al_donar || null
    ];
    const result = await db.query(insertQuery, values);
    await db.close();
    return { affectedRows: result.count || result.affectedRows || 0 };
}

async function updateMaterial(id, data) {
    const db = await getConnection();
    const updateQuery = `
        UPDATE Materiales SET
            nombre = ?,
            categoria = ?,
            subtipo = ?,
            tipo_material = ?,
            formato = ?,
            ubicacion = ?,
            valor_estimado = ?,
            pais_origen = ?,
            descripcion = ?,
            estado = ?,
            es_restringido = ?,
            donado = ?,
            nombre_donante = ?,
            fecha_donacion = ?,
            estado_al_donar = ?
        WHERE id = ?
    `;
    const values = [
        data.nombre,
        data.categoria,
        data.subtipo,
        data.tipo_material,
        data.formato || null,
        data.ubicacion || null,
        data.valor_estimado || null,
        data.pais_origen || null,
        data.descripcion || null,
        data.estado || 'disponible',
        data.es_restringido || 0,
        data.donado || 0,
        data.nombre_donante || null,
        data.fecha_donacion || null,
        data.estado_al_donar || null,
        id
    ];
    const result = await db.query(updateQuery, values);
    await db.close();
    return { affectedRows: result.count || result.affectedRows || 0 };
}

async function deleteMaterial(id) {
    const db = await getConnection();
    const result = await db.query('DELETE FROM Materiales WHERE id = ?', [id]);
    await db.close();
    return { affectedRows: result.count || result.affectedRows || 0 };
}

// Filtros y paginación (similar a socios)
async function getMaterialesFiltrados(texto, estado, page = 1, limit = 10) {
    let baseQuery = 'FROM Materiales WHERE 1=1';
    let where = '';
    const mainParams = [];
    if (texto) {
        where += " AND (nombre LIKE ? OR categoria LIKE ? OR tipo_material LIKE ? OR descripcion LIKE ? OR ubicacion LIKE ?)";
        mainParams.push(`%${texto}%`, `%${texto}%`, `%${texto}%`, `%${texto}%`, `%${texto}%`);
    }
    if (estado) {
        where += ' AND estado = ?';
        mainParams.push(estado);
    }
    let subWhere = '';
    const subParams = [];
    if (texto) {
        subWhere += " AND (nombre LIKE ? OR categoria LIKE ? OR tipo_material LIKE ? OR descripcion LIKE ? OR ubicacion LIKE ?)";
        subParams.push(`%${texto}%`, `%${texto}%`, `%${texto}%`, `%${texto}%`, `%${texto}%`);
    }
    if (estado) {
        subWhere += ' AND estado = ?';
        subParams.push(estado);
    }
    const offset = (page - 1) * limit;
    let query = '';
    let queryParams = [];
    if (offset > 0) {
        query = `SELECT TOP ${limit} * ${baseQuery}${where} AND id NOT IN (SELECT TOP ${offset} id ${baseQuery}${subWhere} ORDER BY id DESC) ORDER BY id DESC`;
        queryParams = [...mainParams, ...subParams];
    } else {
        query = `SELECT TOP ${limit} * ${baseQuery}${where} ORDER BY id DESC`;
        queryParams = mainParams;
    }
    const countQuery = `SELECT COUNT(*) as total ${baseQuery}${where}`;
    const countParams = [...mainParams];

    const db = await getConnection();
    const result = await db.query(query, queryParams);
    const countResult = await db.query(countQuery, countParams);
    await db.close();

    let materiales = [];
    if (result && Array.isArray(result.rows)) materiales = result.rows;
    else if (Array.isArray(result)) materiales = result;

    let total = 0;
    if (countResult && Array.isArray(countResult.rows)) total = countResult.rows[0].total;
    else if (Array.isArray(countResult)) total = countResult[0].total;
    else if (countResult.total) total = countResult.total;

    return { materiales, total };
}

// async function getEstadosUnicosMateriales() {
//     const db = await getConnection();
//     const result = await db.query('SELECT DISTINCT estado FROM Materiales');
//     await db.close();
//     if (Array.isArray(result)) {
//         return result.filter(e => Object.prototype.hasOwnProperty.call(e, 'estado'));
//     }
//     if (result && Array.isArray(result.rows)) {
//         return result.rows.filter(e => Object.prototype.hasOwnProperty.call(e, 'estado'));
//     }
//     return [];
// }

module.exports = {
    getAllMateriales,
    getMaterialById,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    getMaterialesFiltrados,
    // getEstadosUnicosMateriales,
};
