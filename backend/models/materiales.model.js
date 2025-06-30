const { getConnection } = require('../config/db');

// NUEVO: Utilizar nombres de campos reales de la tabla MATERIALES
async function getAllMateriales() {
    const db = await getConnection();
    const result = await db.query('SELECT * FROM MATERIALES ORDER BY NUMERO_ID DESC');
    await db.close();
    return Array.isArray(result.rows) ? result.rows : result;
}

// NUEVO: Utilizar JOINs para traer los valores descriptivos de claves foráneas
async function getMaterialById(id) {
    const db = await getConnection();
    const result = await db.query(`
        SELECT m.*, 
            s.SUBTIPO as SUBTIPO_DESC, 
            s.CATEGORIA_ID as CATEGORIA_ID, 
            c.CATEGORIA as CATEGORIA_DESC,
            p.PAIS as PAIS_DESC, 
            d.NOMBRE as DONANTE_NOMBRE, d.APELLIDO as DONANTE_APELLIDO
        FROM MATERIALES m
        LEFT JOIN SUBTIPO s ON m.SUBTIPO_ID = s.SUBTIPO_ID
        LEFT JOIN CATEGORIAS c ON s.CATEGORIA_ID = c.CATEGORIA_ID
        LEFT JOIN PAISES p ON m.NACIONALIDAD = p.NACIONALIDAD
        LEFT JOIN DONANTES d ON m.DONANTE_ID = d.DONANTE_ID
        WHERE m.NUMERO_ID = ?
    `, [id]);
    await db.close();
    return Array.isArray(result.rows) ? result.rows[0] : result[0];
}

async function createMaterial(data) {
    const db = await getConnection();
    const insertQuery = `
        INSERT INTO MATERIALES (
            SUBTIPO_ID, NACIONALIDAD, DONANTE_ID, NOMBRE, FORMATO, UBICACION, VALOR_GS, TIPO_MATERIAL, CONDICION, DESCRIPCION, DISPONIBILIDAD, RESTRINGIDO, DONADO, FECHA_DONACION, ESTADO_DONACION
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
        data.SUBTIPO || null,
        data.PAIS_ORIGEN || null,
        data.NOMBRE_DONANTE || null,
        data.NOMBRE,
        data.FORMATO || null,
        data.UBICACION || null,
        data.VALOR_ESTIMADO || null,
        data.TIPO_MATERIAL || null,
        data.CONDICION || 'B',
        data.DESCRIPCION || null,
        data.ESTADO || 'D',
        data.ES_RESTRINGIDO || 'N',
        data.DONADO || 'N',
        data.FECHA_DONACION || null,
        data.ESTADO_AL_DONAR || null
    ];
    const result = await db.query(insertQuery, values);
    await db.close();
    return { affectedRows: result.count || result.affectedRows || 0 };
}

async function updateMaterial(id, data) {
    const db = await getConnection();
    const updateQuery = `
        UPDATE MATERIALES SET
            SUBTIPO_ID = ?,
            NACIONALIDAD = ?,
            DONANTE_ID = ?,
            NOMBRE = ?,
            FORMATO = ?,
            UBICACION = ?,
            VALOR_GS = ?,
            TIPO_MATERIAL = ?,
            CONDICION = ?,
            DESCRIPCION = ?,
            DISPONIBILIDAD = ?,
            RESTRINGIDO = ?,
            DONADO = ?,
            FECHA_DONACION = ?,
            ESTADO_DONACION = ?
        WHERE NUMERO_ID = ?
    `;
    const values = [
        data.SUBTIPO || null,
        data.PAIS_ORIGEN || null,
        data.NOMBRE_DONANTE || null,
        data.NOMBRE,
        data.FORMATO || null,
        data.UBICACION || null,
        data.VALOR_ESTIMADO || null,
        data.TIPO_MATERIAL || null,
        data.CONDICION || 'B',
        data.DESCRIPCION || null,
        data.ESTADO || 'D',
        data.ES_RESTRINGIDO || 'N',
        data.DONADO || 'N',
        data.FECHA_DONACION || null,
        data.ESTADO_AL_DONAR || null,
        id
    ];
    const result = await db.query(updateQuery, values);
    await db.close();
    return { affectedRows: result.count || result.affectedRows || 0 };
}

async function deleteMaterial(id) {
    const db = await getConnection();
    const result = await db.query('DELETE FROM MATERIALES WHERE NUMERO_ID = ?', [id]);
    await db.close();
    return { affectedRows: result.count || result.affectedRows || 0 };
}

// Filtros y paginación
async function getMaterialesFiltrados(texto, estado, condicion, page = 1, limit = 10) {
    let baseQuery = `FROM MATERIALES m
        LEFT JOIN SUBTIPO s ON m.SUBTIPO_ID = s.SUBTIPO_ID
        LEFT JOIN CATEGORIAS c ON s.CATEGORIA_ID = c.CATEGORIA_ID
        LEFT JOIN PAISES p ON m.NACIONALIDAD = p.NACIONALIDAD
        LEFT JOIN DONANTES d ON m.DONANTE_ID = d.DONANTE_ID
    WHERE 1=1`;
    let where = '';
    const mainParams = [];
    if (texto) {
        where += " AND (m.NOMBRE LIKE ? OR m.TIPO_MATERIAL LIKE ? OR m.DESCRIPCION LIKE ? OR m.UBICACION LIKE?" +
            " OR s.SUBTIPO LIKE ? OR c.CATEGORIA LIKE ? OR p.PAIS LIKE ? OR d.NOMBRE LIKE ? OR d.APELLIDO LIKE ?)";
        mainParams.push(`%${texto}%`, `%${texto}%`, `%${texto}%`, `%${texto}%`, `%${texto}%`, `%${texto}%`, `%${texto}%`, `%${texto}%`, `%${texto}%`);
    }
    if (estado) {
        where += ' AND m.DISPONIBILIDAD = ?';
        mainParams.push(estado);
    }
    if (condicion) {
        where += ' AND m.CONDICION = ?';
        mainParams.push(condicion);
    }
    let subWhere = '';
    const subParams = [];
    if (texto) {
        subWhere += " AND (m.NOMBRE LIKE ? OR m.TIPO_MATERIAL LIKE ? OR m.DESCRIPCION LIKE ? OR m.UBICACION LIKE?" +
            " OR s.SUBTIPO LIKE ? OR c.CATEGORIA LIKE ? OR p.PAIS LIKE ? OR d.NOMBRE LIKE ? OR d.APELLIDO LIKE ?)";
        subParams.push(`%${texto}%`, `%${texto}%`, `%${texto}%`, `%${texto}%`, `%${texto}%`, `%${texto}%`, `%${texto}%`, `%${texto}%`, `%${texto}%`);
    }
    if (estado) {
        subWhere += ' AND m.DISPONIBILIDAD = ?';
        subParams.push(estado);
    }
    if (condicion) {
        subWhere += ' AND m.CONDICION = ?';
        subParams.push(condicion);
    }
    const offset = (page - 1) * limit;
    let query = '';
    let queryParams = [];
    if (offset > 0) {
        query = `SELECT TOP ${limit} m.*, s.SUBTIPO as SUBTIPO_DESC, c.CATEGORIA as CATEGORIA_DESC, p.PAIS as PAIS_DESC, d.NOMBRE as DONANTE_NOMBRE, d.APELLIDO as DONANTE_APELLIDO ` +
            baseQuery + where + ` AND m.NUMERO_ID NOT IN (SELECT TOP ${offset} m.NUMERO_ID ` + baseQuery + subWhere + ` ORDER BY m.NUMERO_ID DESC) ORDER BY m.NUMERO_ID DESC`;
        queryParams = [...mainParams, ...subParams];
    } else {
        query = `SELECT TOP ${limit} m.*, s.SUBTIPO as SUBTIPO_DESC, c.CATEGORIA as CATEGORIA_DESC, p.PAIS as PAIS_DESC, d.NOMBRE as DONANTE_NOMBRE, d.APELLIDO as DONANTE_APELLIDO ` +
            baseQuery + where + ` ORDER BY m.NUMERO_ID DESC`;
        queryParams = mainParams;
    }
    const countQuery = `SELECT COUNT(*) as total ` + baseQuery + where;
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

// Obtener categorías
async function getCategorias() {
    try {
        const db = await getConnection();
        const result = await db.query('SELECT CATEGORIA_ID, CATEGORIA FROM DBA.CATEGORIAS ORDER BY CATEGORIA');
        await db.close();
        return Array.isArray(result.rows) ? result.rows : result;
    } catch (error) {
        console.error('Error en getCategorias:', error);
        throw error;
    }
}

// Obtener subtipos
async function getSubtipos() {
    try {
        const db = await getConnection();
        const result = await db.query('SELECT SUBTIPO_ID, SUBTIPO FROM DBA.SUBTIPO ORDER BY SUBTIPO');
        await db.close();
        return Array.isArray(result.rows) ? result.rows : result;
    } catch (error) {
        console.error('Error en getSubtipos:', error);
        throw error;
    }
}

// Obtener países
async function getPaises() {
    try {
        const db = await getConnection();
        const result = await db.query('SELECT NACIONALIDAD, PAIS FROM DBA.PAISES ORDER BY PAIS');
        await db.close();
        return Array.isArray(result.rows) ? result.rows : result;
    } catch (error) {
        console.error('Error en getPaises:', error);
        throw error;
    }
}

// Obtener donantes
async function getDonantes() {
    try {
        const db = await getConnection();
        const result = await db.query('SELECT DONANTE_ID, NOMBRE, APELLIDO FROM DBA.DONANTES ORDER BY NOMBRE');
        await db.close();
        return Array.isArray(result.rows) ? result.rows : result;
    } catch (error) {
        console.error('Error en getDonantes:', error);
        throw error;
    }
}

module.exports = {
    getAllMateriales,
    getMaterialById,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    getMaterialesFiltrados,
    getCategorias,
    getSubtipos,
    getPaises,
    getDonantes,
    // getEstadosUnicosMateriales,
};
