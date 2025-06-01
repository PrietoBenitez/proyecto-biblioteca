const { getConnection } = require('../config/db');

// Obtener todos los socios
async function getAllSocios() {
    const db = await getConnection();
    const result = await db.query('SELECT * FROM Socios');
    await db.close();
    return result;
}

// Obtener un socio por ID
async function getSocioById(id) {
    const db = await getConnection();
    const result = await db.query('SELECT * FROM Socios WHERE id = ?', [id]);
    await db.close();
    return result[0];
}

// Crear un nuevo socio
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
    return { affectedRows: result.count || result.affectedRows || 0 };
}

// Actualizar un socio existente
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
    return { affectedRows: result.count || result.affectedRows || 0 };
}

// Eliminar un socio por ID
async function deleteSocio(id) {
    const db = await getConnection();
    const result = await db.query('DELETE FROM Socios WHERE id = ?', [id]);
    await db.close();
    return { affectedRows: result.count || result.affectedRows || 0 };
}

// Obtener socios filtrados con paginación y conteo total
async function getSociosFiltrados(texto, estado, page = 1, limit = 10) {
    let baseQuery = 'FROM Socios WHERE 1=1';
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
    // Subconsulta para paginación
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

    let socios = [];
    if (result && Array.isArray(result.rows)) socios = result.rows;
    else if (Array.isArray(result)) socios = result;

    let total = 0;
    if (countResult && Array.isArray(countResult.rows)) total = countResult.rows[0].total;
    else if (Array.isArray(countResult)) total = countResult[0].total;
    else if (countResult.total) total = countResult.total;

    return { socios, total };
}

// Obtener estados únicos de la tabla Socios
async function getEstadosUnicos() {
    const db = await getConnection();
    const result = await db.query('SELECT DISTINCT estado FROM Socios');
    await db.close();
    if (Array.isArray(result)) {
        return result.filter(e => Object.prototype.hasOwnProperty.call(e, 'estado'));
    }
    if (result && Array.isArray(result.rows)) {
        return result.rows.filter(e => Object.prototype.hasOwnProperty.call(e, 'estado'));
    }
    return [];
}

// Obtener sanciones activas de un socio desde la vista SociosSancionados
async function getSancionesActivasBySocio(socioId) {
    const db = await getConnection();
    const query = `
        SELECT motivo, fecha_inicio, fecha_fin, dias_restantes_sancion
        FROM SociosSancionados
        WHERE id = ? AND (fecha_fin IS NULL OR fecha_fin >= GETDATE())
    `;
    const result = await db.query(query, [socioId]);
    await db.close();
    if (Array.isArray(result)) return result;
    if (result && Array.isArray(result.rows)) return result.rows;
    return [];
}

// Obtener sanciones activas Y estado del socio juntos
async function getSancionesYEstadoBySocio(socioId) {
    const sanciones = await getSancionesActivasBySocio(socioId);
    const socio = await getSocioById(socioId);
    return {
        sanciones,
        estado: socio ? socio.estado : null,
    };
}

// AGREGADO: Agregar una sanción a un socio (el trigger de la base de datos maneja el estado del socio)
async function agregarSancionASocio({ socio_id, motivo, fecha_inicio, fecha_fin }) {
    const db = await getConnection();
    await db.query(
        `INSERT INTO Sanciones (socio_id, motivo, fecha_inicio, fecha_fin) VALUES (?, ?, ?, ?)`,
        [socio_id, motivo, fecha_inicio, fecha_fin || null]
    );
    await db.close();
}

module.exports = {
    getAllSocios,
    getSocioById,
    createSocio,
    updateSocio,
    deleteSocio,
    getSociosFiltrados,
    getEstadosUnicos,
    getSancionesActivasBySocio,
    getSancionesYEstadoBySocio,
    agregarSancionASocio,
};