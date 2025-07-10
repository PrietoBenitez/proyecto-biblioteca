const { getConnection } = require('../config/db');

async function getAllInstituciones(filtroTexto) {
    const db = await getConnection();
    let result;
    if (filtroTexto) {
        result = await db.query(
            'SELECT * FROM INSTITUCIONES WHERE UPPER(INSTITUCION) LIKE ? ORDER BY INSTITUCION_ID DESC',
            [`%${filtroTexto.toUpperCase()}%`]
        );
    } else {
        result = await db.query('SELECT * FROM INSTITUCIONES ORDER BY INSTITUCION_ID DESC');
    }
    await db.close();
    return Array.isArray(result.rows) ? result.rows : result;
}

async function getInstitucionById(id) {
    const db = await getConnection();
    const result = await db.query('SELECT * FROM INSTITUCIONES WHERE INSTITUCION_ID = ?', [id]);
    await db.close();
    return Array.isArray(result.rows) ? result.rows[0] : result[0];
}

async function createInstitucion(data) {
    const db = await getConnection();
    const result = await db.query('INSERT INTO INSTITUCIONES (INSTITUCION_ID, INSTITUCION) VALUES (?, ?)', [data.INSTITUCION_ID, data.INSTITUCION]);
    await db.close();
    return result;
}

async function updateInstitucion(id, data) {
    const db = await getConnection();
    const result = await db.query('UPDATE INSTITUCIONES SET INSTITUCION = ? WHERE INSTITUCION_ID = ?', [data.INSTITUCION, id]);
    await db.close();
    return result;
}

async function deleteInstitucion(id) {
    const db = await getConnection();
    const result = await db.query('DELETE FROM INSTITUCIONES WHERE INSTITUCION_ID = ?', [id]);
    await db.close();
    return result;
}

module.exports = {
    getAllInstituciones,
    getInstitucionById,
    createInstitucion,
    updateInstitucion,
    deleteInstitucion
};
