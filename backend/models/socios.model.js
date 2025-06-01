const { getConnection } = require('../config/db');

async function getAllSocios() {
    const db = await getConnection();
    const result = await db.query('SELECT * FROM Socios');
    await db.close();
    return result;
}

async function getSocioById(id) {
    const db = await getConnection();
    const result = await db.query('SELECT * FROM Socios WHERE id = ?', [id]);
    await db.close();
    return result[0];
}

async function createSocio(data) {
    const db = await getConnection();
    const insertQuery = `
        INSERT INTO Socios (
            documento_identidad, nombre_completo, direccion, email, nacionalidad,
            nivel_educativo, profesion, fecha_nacimiento, fecha_inscripcion,
            institucion_referente, estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
        data.documento_identidad,
        data.nombre_completo,
        data.direccion || null,
        data.email || null,
        data.nacionalidad || null,
        data.nivel_educativo || null,
        data.profesion || null,
        data.fecha_nacimiento,
        data.fecha_inscripcion,
        data.institucion_referente || null,
        data.estado || 'activo'
    ];
    const result = await db.query(insertQuery, values);
    await db.close();
    // Devuelve el número de filas afectadas
    return { affectedRows: result.count || result.affectedRows || 0 };
}

async function updateSocio(id, data) {
    const db = await getConnection();
    const updateQuery = `
        UPDATE Socios SET
            documento_identidad = ?,
            nombre_completo = ?,
            direccion = ?,
            email = ?,
            nacionalidad = ?,
            nivel_educativo = ?,
            profesion = ?,
            fecha_nacimiento = ?,
            fecha_inscripcion = ?,
            institucion_referente = ?,
            estado = ?
        WHERE id = ?
    `;
    const values = [
        data.documento_identidad,
        data.nombre_completo,
        data.direccion || null,
        data.email || null,
        data.nacionalidad || null,
        data.nivel_educativo || null,
        data.profesion || null,
        data.fecha_nacimiento,
        data.fecha_inscripcion,
        data.institucion_referente || null,
        data.estado || 'activo',
        id
    ];
    const result = await db.query(updateQuery, values);
    await db.close();
    // Devuelve el número de filas afectadas
    return { affectedRows: result.count || result.affectedRows || 0 };
}

async function deleteSocio(id) {
    const db = await getConnection();
    const result = await db.query('DELETE FROM Socios WHERE id = ?', [id]);
    await db.close();
    // Devuelve el número de filas afectadas
    return { affectedRows: result.count || result.affectedRows || 0 };
}

async function getSociosFiltrados(texto, estado, page = 1, limit = 10) {
    let baseQuery = 'FROM Socios WHERE 1=1';
    // Construir WHERE y parámetros para la consulta principal
    let where = '';
    const mainParams = [];
    if (texto) {
        where += " AND (documento_identidad LIKE ? OR nombre_completo LIKE ? OR email LIKE ?)";
        mainParams.push(`%${texto}%`, `%${texto}%`, `%${texto}%`);
    }
    if (estado) {
        where += ' AND estado = ?';
        mainParams.push(estado);
    }
    // Construir WHERE y parámetros para la subconsulta (idéntico a la principal)
    let subWhere = '';
    const subParams = [];
    if (texto) {
        subWhere += " AND (documento_identidad LIKE ? OR nombre_completo LIKE ? OR email LIKE ?)";
        subParams.push(`%${texto}%`, `%${texto}%`, `%${texto}%`);
    }
    if (estado) {
        subWhere += ' AND estado = ?';
        subParams.push(estado);
    }
    // Paginación Sybase: TOP y OFFSET manual
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
    // Conteo total
    const countQuery = `SELECT COUNT(*) as total ${baseQuery}${where}`;
    const countParams = [...mainParams];

    const db = await getConnection();
    const result = await db.query(query, queryParams);
    const countResult = await db.query(countQuery, countParams);
    await db.close();

    let socios = [];
    if (result && Array.isArray(result.rows)) socios = result.rows;
    else if (Array.isArray(result)) socios = result;

    let total = 0;
    if (countResult && Array.isArray(countResult.rows)) total = countResult.rows[0].total;
    else if (Array.isArray(countResult)) total = countResult[0].total;
    else if (countResult.total) total = countResult.total;

    return { socios, total };
}

async function getEstadosUnicos() {
    const db = await getConnection();
    const result = await db.query('SELECT DISTINCT estado FROM Socios');
    await db.close();
    // Filtra solo los objetos que tienen la propiedad 'estado'
    if (Array.isArray(result)) {
        return result.filter(e => Object.prototype.hasOwnProperty.call(e, 'estado'));
    }
    if (result && Array.isArray(result.rows)) {
        return result.rows.filter(e => Object.prototype.hasOwnProperty.call(e, 'estado'));
    }
    return [];
}

module.exports = {
    getAllSocios,
    getSocioById,
    createSocio,
    updateSocio,
    deleteSocio,
    getSociosFiltrados,
    getEstadosUnicos,
};