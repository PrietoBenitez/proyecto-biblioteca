const { getConnection } = require('../config/db');

// Obtener todos los préstamos con JOINs descriptivos
async function getAllPrestamos() {
    const db = await getConnection();
    const result = await db.query(`
        SELECT p.PRESTAMO_ID, p.SOCIO_ID, p.BIBLIOTECARIO_ID, p.NUMERO_ID, 
            p.TIPO_PRESTAMO, p.FECHA_PRESTAMO, p.LIMITE_DEVOLUCION, p.COMENTARIO,
            p.DEVOLUCION, p.ESTADO_DEVOLUCION, p.COMENTARIO_ESTADO,
            p.NUMERO_ID AS MATERIAL_ID, 
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
        SELECT p.PRESTAMO_ID, p.SOCIO_ID, p.BIBLIOTECARIO_ID, p.NUMERO_ID, 
            p.TIPO_PRESTAMO, p.FECHA_PRESTAMO, p.LIMITE_DEVOLUCION, p.COMENTARIO,
            p.DEVOLUCION, p.ESTADO_DEVOLUCION, p.COMENTARIO_ESTADO,
            p.NUMERO_ID AS MATERIAL_ID, 
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

// Utilidad para convertir valores a null o tipos apropiados
function toNull(v) {
    if (v === '' || v === undefined || v === 'undefined' || v === 'null' || v === null) return null;
    if (typeof v === 'string' && v.trim() === '') return null;
    return v;
}

// Utilidad para convertir a entero o null
function toInt(v) {
    if (v === '' || v === undefined || v === 'undefined' || v === 'null' || v === null) return null;
    if (typeof v === 'string' && v.trim() === '') return null;
    const num = parseInt(v);
    return isNaN(num) ? null : num;
}
// Utilidad para formatear fecha a 'YYYY-MM-DD HH:MM:SS' si es solo 'YYYY-MM-DD'
function toDateTimeString(v) {
    if (!v || v === null || v === undefined || v === '' || v === 'null') return null;
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.trim())) {
        return v.trim() + ' 00:00:00';
    }
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(v.trim())) {
        return v.trim();
    }
    return null;
}
// Utilidad para formatear solo fecha a 'YYYY-MM-DD'
function toDateString(v) {
    if (!v || v === null || v === undefined || v === '' || v === 'null') return null;
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v.trim())) {
        return v.trim().slice(0, 10);
    }
    return null;
}

// Crear préstamo
async function createPrestamo(data, bibliotecario = null) {
    const db = await getConnection();
    
    console.log('🔍 MODEL CREATE PRESTAMO - Bibliotecario:', bibliotecario);
    console.log('🔍 MODEL CREATE PRESTAMO - Datos:', JSON.stringify(data, null, 2));
    
    try {
        // Establecer contexto de bibliotecario para el trigger
        if (bibliotecario) {
            try {
                const bibliotecarioId = bibliotecario.id || 1;
                console.log('🔍 MODEL CREATE PRESTAMO - Configurando contexto para bibliotecario:', bibliotecarioId);
                
                // Simplificar la creación de la tabla temporal
                try {
                    await db.query(`
                        CREATE OR REPLACE GLOBAL TEMPORARY TABLE bibliotecario_context (
                            bibliotecario_id INTEGER
                        ) ON COMMIT PRESERVE ROWS
                    `);
                } catch (tableError) {
                    console.log('⚠️ MODEL CREATE PRESTAMO - Tabla ya existe, continuando...');
                }
                
                // Insertar el ID del bibliotecario actual
                await db.query(`DELETE FROM bibliotecario_context`);
                await db.query(`INSERT INTO bibliotecario_context (bibliotecario_id) VALUES (?)`, [bibliotecarioId]);
                console.log('✅ MODEL CREATE PRESTAMO - Contexto bibliotecario configurado:', bibliotecarioId);
            } catch (contextError) {
                console.log('⚠️ MODEL CREATE PRESTAMO - Error configurando contexto bibliotecario:', contextError.message);
                // Continuar sin contexto si hay error
            }
        }
        
        // Validar si ya existe un préstamo activo para el material
        const checkQuery = `SELECT PRESTAMO_ID FROM PRESTAMOS WHERE NUMERO_ID = ? AND DEVOLUCION IS NULL`;
        const checkResult = await db.query(checkQuery, [toInt(data.MATERIAL_ID || data.NUMERO_ID)]);
        if (Array.isArray(checkResult.rows) ? checkResult.rows.length > 0 : checkResult.length > 0) {
            await db.close();
            // Retornar error específico para el controlador
            return { error: 'El material ya tiene un préstamo activo y no puede ser prestado nuevamente hasta su devolución.' };
        }
    const insertQuery = `
        INSERT INTO PRESTAMOS (
            SOCIO_ID, BIBLIOTECARIO_ID, NUMERO_ID, TIPO_PRESTAMO, FECHA_PRESTAMO, COMENTARIO, LIMITE_DEVOLUCION, DEVOLUCION, ESTADO_DEVOLUCION, COMENTARIO_ESTADO
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
        toInt(data.SOCIO_ID),
        toInt(data.BIBLIOTECARIO_ID),
        toInt(data.MATERIAL_ID || data.NUMERO_ID), // Soporte para ambos nombres
        toNull(data.TIPO_PRESTAMO) || 'I',
        toDateTimeString(toNull(data.FECHA_PRESTAMO)) || null,
        toNull(data.COMENTARIO) || null,
        toDateTimeString(toNull(data.LIMITE_DEVOLUCION)) || null,
        toDateString(toNull(data.DEVOLUCION)) || null, // SOLO fecha para DEVOLUCION
        toNull(data.ESTADO_DEVOLUCION) || null,
        toNull(data.COMENTARIO_ESTADO) || null
    ];
    
    console.log('🔍 MODEL CREATE PRESTAMO - Query:', insertQuery);
    console.log('🔍 MODEL CREATE PRESTAMO - Values:', values);
    console.log('🔍 MODEL CREATE PRESTAMO - Types:', values.map(v => typeof v));
    console.log('🔍 MODEL CREATE PRESTAMO - Raw data:', {
        SOCIO_ID: data.SOCIO_ID,
        BIBLIOTECARIO_ID: data.BIBLIOTECARIO_ID,
        MATERIAL_ID: data.MATERIAL_ID,
        NUMERO_ID: data.NUMERO_ID,
        TIPO_PRESTAMO: data.TIPO_PRESTAMO,
        FECHA_PRESTAMO: data.FECHA_PRESTAMO,
        LIMITE_DEVOLUCION: data.LIMITE_DEVOLUCION
    });
    
    // console.log('🔍 MODEL CREATE PRESTAMO - Query:', insertQuery);
    // console.log('🔍 MODEL CREATE PRESTAMO - Values:', values);
    
    const result = await db.query(insertQuery, values);
    await db.close();
    // Devuelve el ID del préstamo creado si es posible
    return { 
        affectedRows: result.count || result.affectedRows || 0,
        insertId: result.insertId || (result.rows && result.rows[0] && result.rows[0].PRESTAMO_ID) || null
    };
    } catch (error) {
        await db.close();
        throw error;
    }
}

// Actualizar préstamo
async function updatePrestamo(id, data, bibliotecario = null) {
    const db = await getConnection();
    
    console.log('🔍 MODEL UPDATE PRESTAMO - ID:', id);
    console.log('🔍 MODEL UPDATE PRESTAMO - Datos:', JSON.stringify(data, null, 2));
    console.log('🔍 MODEL UPDATE PRESTAMO - Bibliotecario:', bibliotecario);
    
    try {
        // Establecer contexto de bibliotecario para el trigger modificado
        if (bibliotecario) {
            try {
                const bibliotecarioId = bibliotecario.id || 1;
                console.log('🔍 MODEL UPDATE PRESTAMO - Configurando contexto para bibliotecario:', bibliotecarioId);
                
                // Usar el mismo enfoque que createPrestamo
                try {
                    await db.query(`
                        CREATE OR REPLACE GLOBAL TEMPORARY TABLE bibliotecario_context (
                            bibliotecario_id INTEGER
                        ) ON COMMIT PRESERVE ROWS
                    `);
                } catch (tableError) {
                    console.log('⚠️ MODEL UPDATE PRESTAMO - Tabla ya existe, continuando...');
                }
                
                // Insertar el ID del bibliotecario actual
                await db.query(`DELETE FROM bibliotecario_context`);
                await db.query(`INSERT INTO bibliotecario_context (bibliotecario_id) VALUES (?)`, [bibliotecarioId]);
                console.log('✅ MODEL UPDATE PRESTAMO - Contexto bibliotecario configurado:', bibliotecarioId);
            } catch (ctxError) {
                console.log('⚠️ No se pudo establecer contexto de bibliotecario:', ctxError.message);
            }
        }
    } catch (dbSetupError) {
        console.log('⚠️ Error al preparar contexto de biblioteca:', dbSetupError.message);
    }
    
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
        toInt(data.SOCIO_ID),
        toInt(data.BIBLIOTECARIO_ID),
        toInt(data.MATERIAL_ID || data.NUMERO_ID), // Soporte para ambos nombres
        toNull(data.TIPO_PRESTAMO) || 'I',
        toDateTimeString(toNull(data.FECHA_PRESTAMO)) || null,
        toNull(data.COMENTARIO) || null,
        toDateTimeString(toNull(data.LIMITE_DEVOLUCION)) || null,
        toDateString(toNull(data.DEVOLUCION)) || null, // SOLO fecha para DEVOLUCION
        toNull(data.ESTADO_DEVOLUCION) || null,
        toNull(data.COMENTARIO_ESTADO) || null,
        toInt(id)
    ];
    
    console.log('🔍 MODEL UPDATE PRESTAMO - Query:', updateQuery);
    console.log('🔍 MODEL UPDATE PRESTAMO - Values:', values);
    console.log('🔍 MODEL UPDATE PRESTAMO - Types:', values.map(v => typeof v));
    
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
