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

module.exports = {
    getAllSocios,
    getSocioById,
    createSocio,
    updateSocio,
    deleteSocio
};