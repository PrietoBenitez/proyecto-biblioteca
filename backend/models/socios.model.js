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
    const result = await db.query('SELECT * FROM Socios WHERE SOCIO_ID = ?', [id]);
    await db.close();
    return result[0];
}

// Crear un nuevo socio
async function createSocio(data) {
    const db = await getConnection();
    const insertQuery = `
        INSERT INTO Socios (
            NOMBRE, APELLIDO, CEDULA, CORREO, DIRECCION, FECHA_NACIMIENTO, FECHA_INSCRIPCION,
            NACIONALIDAD, EDUCACION_ID, PROFESION_ID, INSTITUCION_ID
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
        data.NOMBRE,
        data.APELLIDO,
        data.CEDULA,
        data.CORREO || null,
        data.DIRECCION || null,
        data.FECHA_NACIMIENTO,
        data.FECHA_INSCRIPCION,
        data.NACIONALIDAD || null,
        data.EDUCACION_ID || null,
        data.PROFESION_ID || null,
        data.INSTITUCION_ID || null
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
            NOMBRE = ?,
            APELLIDO = ?,
            CEDULA = ?,
            CORREO = ?,
            DIRECCION = ?,
            FECHA_NACIMIENTO = ?,
            FECHA_INSCRIPCION = ?,
            NACIONALIDAD = ?,
            EDUCACION_ID = ?,
            PROFESION_ID = ?,
            INSTITUCION_ID = ?
        WHERE SOCIO_ID = ?
    `;
    const values = [
        data.NOMBRE,
        data.APELLIDO,
        data.CEDULA,
        data.CORREO || null,
        data.DIRECCION || null,
        data.FECHA_NACIMIENTO,
        data.FECHA_INSCRIPCION,
        data.NACIONALIDAD || null,
        data.EDUCACION_ID || null,
        data.PROFESION_ID || null,
        data.INSTITUCION_ID || null,
        id
    ];
    const result = await db.query(updateQuery, values);
    await db.close();
    return { affectedRows: result.count || result.affectedRows || 0 };
}

// Eliminar un socio por ID
async function deleteSocio(id) {
    const db = await getConnection();
    const result = await db.query('DELETE FROM Socios WHERE SOCIO_ID = ?', [id]);
    await db.close();
    return { affectedRows: result.count || result.affectedRows || 0 };
}

// Obtener socios filtrados con paginación y conteo total (JOINs con nombres reales de tablas)
async function getSociosFiltrados(texto, estado, page = 1, limit = 10) {
    let baseQuery = `FROM Socios 
        LEFT JOIN PAISES ON Socios.NACIONALIDAD = PAISES.NACIONALIDAD
        LEFT JOIN ESTUDIOS ON Socios.EDUCACION_ID = ESTUDIOS.EDUCACION_ID
        LEFT JOIN PROFESIONES ON Socios.PROFESION_ID = PROFESIONES.PROFESION_ID
        LEFT JOIN INSTITUCIONES ON Socios.INSTITUCION_ID = INSTITUCIONES.INSTITUCION_ID
        WHERE 1=1`;
    let where = '';
    const mainParams = [];
    if (texto) {
        where += " AND (Socios.CEDULA LIKE ? OR Socios.NOMBRE LIKE ? OR Socios.APELLIDO LIKE ? OR Socios.CORREO LIKE ? )";
        mainParams.push(`%${texto}%`, `%${texto}%`, `%${texto}%`, `%${texto}%`);
    }
    // Filtro de estado solo por sanción
    if (estado === 'sancionado') {
        where += ` AND Socios.SOCIO_ID IN (SELECT socio_id FROM SANCIONES WHERE (fecha_final IS NULL OR fecha_final >= GETDATE()))`;
    } else if (estado === 'activo') {
        where += ` AND Socios.SOCIO_ID NOT IN (SELECT socio_id FROM SANCIONES WHERE (fecha_final IS NULL OR fecha_final >= GETDATE()))`;
    }
    // Subconsulta para paginación
    let subWhere = '';
    const subParams = [];
    if (texto) {
        subWhere += " AND (Socios.CEDULA LIKE ? OR Socios.NOMBRE LIKE ? OR Socios.APELLIDO LIKE ? OR Socios.CORREO LIKE ? )";
        subParams.push(`%${texto}%`, `%${texto}%`, `%${texto}%`, `%${texto}%`);
    }
    if (estado === 'sancionado') {
        subWhere += ` AND Socios.SOCIO_ID IN (SELECT socio_id FROM SANCIONES WHERE (fecha_final IS NULL OR fecha_final >= GETDATE()))`;
    } else if (estado === 'activo') {
        subWhere += ` AND Socios.SOCIO_ID NOT IN (SELECT socio_id FROM SANCIONES WHERE (fecha_final IS NULL OR fecha_final >= GETDATE()))`;
    }
    const offset = (page - 1) * limit;
    let query = '';
    let queryParams = [];
    const selectCols = `Socios.*, PAISES.PAIS AS NACIONALIDAD_NOMBRE, ESTUDIOS.NIVEL_EDUCATIVO AS EDUCACION_NOMBRE, PROFESIONES.PROFESION AS PROFESION_NOMBRE, INSTITUCIONES.INSTITUCION AS INSTITUCION_NOMBRE`;
    if (offset > 0) {
        query = `SELECT TOP ${limit} ${selectCols} ${baseQuery}${where} AND Socios.SOCIO_ID NOT IN (SELECT TOP ${offset} Socios.SOCIO_ID ${baseQuery}${subWhere} ORDER BY Socios.SOCIO_ID DESC) ORDER BY Socios.SOCIO_ID DESC`;
        queryParams = [...mainParams, ...subParams];
    } else {
        query = `SELECT TOP ${limit} ${selectCols} ${baseQuery}${where} ORDER BY Socios.SOCIO_ID DESC`;
        queryParams = mainParams;
    }
    const countQuery = `SELECT COUNT(*) as total ${baseQuery}${where}`;
    const countParams = [...mainParams];

    const db = await getConnection();
    const result = await db.query(query, queryParams);
    const countResult = await db.query(countQuery, countParams);

    // Obtener IDs de socios para buscar sanciones activas
    let socios = [];
    if (result && Array.isArray(result.rows)) socios = result.rows;
    else if (Array.isArray(result)) socios = result;

    // Buscar sanciones activas para cada socio (optimizado en una sola consulta)
    const ids = socios.map(s => s.SOCIO_ID);
    let sancionesMap = {};
    if (ids.length > 0) {
        const sancionesQuery = `SELECT socio_id, motivo, fecha_inicio, fecha_final FROM SANCIONES WHERE socio_id IN (${ids.map(() => '?').join(',')}) AND (fecha_final IS NULL OR fecha_final >= GETDATE())`;
        const sancionesRes = await db.query(sancionesQuery, ids);
        let sanciones = Array.isArray(sancionesRes.rows) ? sancionesRes.rows : sancionesRes;
        sanciones.forEach(s => {
            sancionesMap[s.socio_id] = s;
        });
    }
    // Agregar campo sancionado y detalle a cada socio
    socios = socios.map(s => ({
        ...s,
        sancionado: !!sancionesMap[s.SOCIO_ID],
        sancion_activa: sancionesMap[s.SOCIO_ID] || null
    }));

    let total = 0;
    if (countResult && Array.isArray(countResult.rows)) total = countResult.rows[0].total;
    else if (Array.isArray(countResult)) total = countResult[0].total;
    else if (countResult.total) total = countResult.total;

    await db.close();
    return { socios, total };
}

// Obtener sanciones activas de un socio desde la tabla SANCIONES
async function getSancionesActivasBySocio(socioId) {
    const db = await getConnection();
    const query = `
        SELECT motivo, fecha_inicio, fecha_final AS fecha_fin
        FROM SANCIONES
        WHERE socio_id = ? AND (fecha_final IS NULL OR fecha_final >= GETDATE())
        ORDER BY fecha_inicio DESC
    `;
    const result = await db.query(query, [socioId]);
    await db.close();
    if (Array.isArray(result)) return result;
    if (result && Array.isArray(result.rows)) return result.rows;
    return [];
}

// AGREGADO: Agregar una sanción a un socio (el trigger de la base de datos maneja el estado del socio)
async function agregarSancionASocio({ socio_id, motivo, fecha_inicio, fecha_fin }) {
    const db = await getConnection();
    await db.query(
        `INSERT INTO Sanciones (socio_id, motivo, fecha_inicio, fecha_final) VALUES (?, ?, ?, ?)`,
        [socio_id, motivo, fecha_inicio, fecha_fin || null]
    );
    await db.close();
}

// Obtener todas las nacionalidades (PAISES)
async function getAllNacionalidades() {
    const db = await getConnection();
    const result = await db.query('SELECT "NACIONALIDAD", "PAIS" FROM "PAISES" ORDER BY "PAIS"');
    await db.close();
    return Array.isArray(result.rows) ? result.rows : result;
}

// Obtener todos los niveles educativos (ESTUDIOS)
async function getAllEducaciones() {
    const db = await getConnection();
    const result = await db.query('SELECT "EDUCACION_ID", "NIVEL_EDUCATIVO" FROM "ESTUDIOS" ORDER BY "NIVEL_EDUCATIVO"');
    await db.close();
    return Array.isArray(result.rows) ? result.rows : result;
}

// Obtener todas las profesiones (PROFESIONES)
async function getAllProfesiones() {
    const db = await getConnection();
    const result = await db.query('SELECT "PROFESION_ID", "PROFESION" FROM "PROFESIONES" ORDER BY "PROFESION"');
    await db.close();
    return Array.isArray(result.rows) ? result.rows : result;
}

// Obtener todas las instituciones (INSTITUCIONES)
async function getAllInstituciones() {
    const db = await getConnection();
    const result = await db.query('SELECT "INSTITUCION_ID", "INSTITUCION" FROM "INSTITUCIONES" ORDER BY "INSTITUCION"');
    await db.close();
    return Array.isArray(result.rows) ? result.rows : result;
}

module.exports = {
    getAllSocios,
    getSocioById,
    createSocio,
    updateSocio,
    deleteSocio,
    getSociosFiltrados,
    getSancionesActivasBySocio,
    agregarSancionASocio,
    getAllNacionalidades,
    getAllEducaciones,
    getAllProfesiones,
    getAllInstituciones,
};