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

// Utilidad para convertir string vacío a null
function toNull(v) {
    return v === '' ? null : v;
}

async function createMaterial(data) {
    const db = await getConnection();
    const insertQuery = `
        INSERT INTO MATERIALES (
            SUBTIPO_ID, NACIONALIDAD, DONANTE_ID, NOMBRE, FORMATO, UBICACION, VALOR_GS, TIPO_MATERIAL, CONDICION, DESCRIPCION, DISPONIBILIDAD, RESTRINGIDO, DONADO, FECHA_DONACION, ESTADO_DONACION
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
        toNull(data.SUBTIPO_ID) || null,
        toNull(data.NACIONALIDAD) || null,
        toNull(data.DONANTE_ID) || null,
        data.NOMBRE,
        toNull(data.FORMATO) || null,
        toNull(data.UBICACION) || null,
        toNull(data.VALOR_GS) || null,
        toNull(data.TIPO_MATERIAL) || null,
        toNull(data.CONDICION) || 'B',
        toNull(data.DESCRIPCION) || null,
        toNull(data.DISPONIBILIDAD) || 'D',
        toNull(data.RESTRINGIDO) || 'N',
        toNull(data.DONADO) || 'N',
        toNull(data.FECHA_DONACION) || null,
        toNull(data.ESTADO_DONACION) || null
    ];
    
    try {
        const result = await db.query(insertQuery, values);
        await db.close();
        return { affectedRows: result.count || result.affectedRows || 0 };
    } catch (error) {
        console.error('❌ Error al crear material:', error.message);
        await db.close();
        throw error;
    }
}

async function updateMaterial(id, data, bibliotecario = null) {
    console.log('🔍 MODEL UPDATE - ID:', id, 'Datos recibidos:', JSON.stringify(data, null, 2));
    console.log('🔍 MODEL UPDATE - Bibliotecario:', bibliotecario);
    
    const db = await getConnection();
    
    try {
        // Establecer contexto de bibliotecario para el trigger modificado
        if (bibliotecario) {
            try {
                const bibliotecarioId = bibliotecario.id || 1;
                // Crear una tabla temporal para el contexto del bibliotecario
                await db.query(`
                    IF NOT EXISTS (SELECT 1 FROM SYS.SYSTABLE WHERE table_name = 'bibliotecario_context') THEN
                        CREATE GLOBAL TEMPORARY TABLE bibliotecario_context (bibliotecario_id INTEGER) ON COMMIT PRESERVE ROWS;
                    END IF;
                `);
                // Insertar el ID del bibliotecario actual
                await db.query(`DELETE FROM bibliotecario_context`);
                await db.query(`INSERT INTO bibliotecario_context (bibliotecario_id) VALUES (${bibliotecarioId})`);
                console.log('✅ Contexto de bibliotecario establecido en tabla temporal:', bibliotecarioId);
            } catch (ctxError) {
                console.log('⚠️ No se pudo establecer contexto de bibliotecario:', ctxError.message);
                // Si no se puede establecer, el trigger debería fallar con error de autenticación
            }
        }
        
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
            toNull(data.SUBTIPO_ID) || null,
            toNull(data.NACIONALIDAD) || null,
            toNull(data.DONANTE_ID) || null,
            data.NOMBRE,
            toNull(data.FORMATO) || null,
            toNull(data.UBICACION) || null,
            toNull(data.VALOR_GS) || null,
            toNull(data.TIPO_MATERIAL) || null,
            toNull(data.CONDICION) || 'B',
            toNull(data.DESCRIPCION) || null,
            toNull(data.DISPONIBILIDAD) || 'D',
            toNull(data.RESTRINGIDO) || 'N',
            toNull(data.DONADO) || 'N',
            toNull(data.FECHA_DONACION) || null,
            toNull(data.ESTADO_DONACION) || null,
            id
        ];
        
        console.log('📝 MODEL UPDATE - Valores finales:', values);
        
        const result = await db.query(updateQuery, values);
        console.log('✅ MODEL UPDATE - Resultado:', result);
        await db.close();
        return { affectedRows: result.count || result.affectedRows || 0 };
    } catch (error) {
        console.error('❌ MODEL UPDATE - Error completo:', error);
        await db.close();
        throw error;
    }
}

async function deleteMaterial(id) {
    console.log('🗑️ MODEL DELETE - Iniciando eliminación en base de datos para ID:', id);
    
    const db = await getConnection();
    try {
        const result = await db.query('DELETE FROM MATERIALES WHERE NUMERO_ID = ?', [id]);
        console.log('🗑️ MODEL DELETE - Resultado de query DELETE:', result);
        console.log('🗑️ MODEL DELETE - Rows afectadas:', result.count || result.affectedRows || 0);
        
        await db.close();
        return { affectedRows: result.count || result.affectedRows || 0 };
    } catch (error) {
        console.error('❌ MODEL DELETE - Error en query DELETE:', error.message);
        console.error('❌ MODEL DELETE - Error completo:', error);
        await db.close();
        throw error;
    }
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
