const { getConnection } = require('../config/db');

// Obtener todos los préstamos con JOINs descriptivos
async function getAllPrestamos() {
    const db = await getConnection();
    const result = await db.query(`
        SELECT p.*, 
            s.NOMBRE AS NOMBRE_SOCIO, s.APELLIDO AS APELLIDO_SOCIO,
            m.NOMBRE AS NOMBRE_MATERIAL,
            b.NOMBRE AS NOMBRE_BIBLIOTECARIO, b.APELLIDO AS APELLIDO_BIBLIOTECARIO
        FROM PRESTAMOS p
        LEFT JOIN SOCIOS s ON p.SOCIO_ID = s.SOCIO_ID
        LEFT JOIN MATERIALES m ON p.NUMERO_ID = m.NUMERO_ID
        LEFT JOIN BIBLIOTECARIOS b ON p.BIBLIOTECARIO_ID = b.BIBLIOTECARIO_ID
        ORDER BY p.PRESTAMO_ID DESC
    `);
    await db.close();
    return Array.isArray(result.rows) ? result.rows : result;
}

// Obtener un préstamo por ID
async function getPrestamoById(id) {
    const db = await getConnection();
    const result = await db.query(`
        SELECT p.*, 
            s.NOMBRE AS NOMBRE_SOCIO, s.APELLIDO AS APELLIDO_SOCIO,
            m.NOMBRE AS NOMBRE_MATERIAL,
            b.NOMBRE AS NOMBRE_BIBLIOTECARIO, b.APELLIDO AS APELLIDO_BIBLIOTECARIO
        FROM PRESTAMOS p
        LEFT JOIN SOCIOS s ON p.SOCIO_ID = s.SOCIO_ID
        LEFT JOIN MATERIALES m ON p.NUMERO_ID = m.NUMERO_ID
        LEFT JOIN BIBLIOTECARIOS b ON p.BIBLIOTECARIO_ID = b.BIBLIOTECARIO_ID
        WHERE p.PRESTAMO_ID = ?
    `, [id]);
    await db.close();
    return Array.isArray(result.rows) ? result.rows[0] : result[0];
}

// Crear préstamo
async function createPrestamo(data) {
    const db = await getConnection();
    const insertQuery = `
        INSERT INTO PRESTAMOS (
            SOCIO_ID, BIBLIOTECARIO_ID, NUMERO_ID, TIPO_PRESTAMO, FECHA_PRESTAMO, COMENTARIO, LIMITE_DEVOLUCION, DEVOLUCION, ESTADO_DEVOLUCION, COMENTARIO_ESTADO
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
        data.SOCIO_ID,
        data.BIBLIOTECARIO_ID,
        data.NUMERO_ID, // NUMERO_ID es el ID del material
        data.TIPO_PRESTAMO || 'I',
        data.FECHA_PRESTAMO || null,
        data.COMENTARIO || null,
        data.LIMITE_DEVOLUCION || null,
        data.DEVOLUCION || null,
        data.ESTADO_DEVOLUCION || null,
        data.COMENTARIO_ESTADO || null
    ];
    const result = await db.query(insertQuery, values);
    await db.close();
    // Devuelve el ID del préstamo creado si es posible
    return { 
        affectedRows: result.count || result.affectedRows || 0,
        insertId: result.insertId || (result.rows && result.rows[0] && result.rows[0].PRESTAMO_ID) || null
    };
}

// Actualizar préstamo
async function updatePrestamo(id, data) {
    const db = await getConnection();
    const updateQuery = `
        UPDATE PRESTAMOS SET
            SOCIO_ID = ?,
            BIBLIOTECARIO_ID = ?,
            NUMERO_ID = ?,
            TIPO_PRESTAMO = ?,
            FECHA_PRESTAMO = ?,
            COMENTARIO = ?,
            LIMITE_DEVOLUCION = ?,
            DEVOLUCION = ?,
            ESTADO_DEVOLUCION = ?,
            COMENTARIO_ESTADO = ?
        WHERE PRESTAMO_ID = ?
    `;
    const values = [
        data.SOCIO_ID,
        data.BIBLIOTECARIO_ID,
        data.NUMERO_ID,
        data.TIPO_PRESTAMO || 'I',
        data.FECHA_PRESTAMO || null,
        data.COMENTARIO || null,
        data.LIMITE_DEVOLUCION || null,
        data.DEVOLUCION || null,
        data.ESTADO_DEVOLUCION || null,
        data.COMENTARIO_ESTADO || null,
        id
    ];
    const result = await db.query(updateQuery, values);
    await db.close();
    return { affectedRows: result.count || result.affectedRows || 0 };
}

// Eliminar préstamo
async function deletePrestamo(id) {
    const db = await getConnection();
    const result = await db.query('DELETE FROM PRESTAMOS WHERE PRESTAMO_ID = ?', [id]);
    await db.close();
    return { affectedRows: result.count || result.affectedRows || 0 };
}

module.exports = {
    getAllPrestamos,
    getPrestamoById,
    createPrestamo,
    updatePrestamo,
    deletePrestamo
};
