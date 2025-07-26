/**
 * =========================================
 * MODELO DE BIBLIOTECARIOS - BIBLIOTECH
 * =========================================
 * 
 * Este modelo maneja todas las operaciones CRUD
 * para la tabla bibliotecarios en la base de datos.
 * 
 * Funcionalidades:
 * - CRUD completo para bibliotecarios
 * - Encriptación de contraseñas con bcrypt
 * - Búsqueda por usuario para autenticación
 * - Validaciones de datos
 * 
 * Autor: Sistema BiblioTech
 * =========================================
 */

// ==========================================
// 1. IMPORTAR CONFIGURACIÓN DE BASE DE DATOS
// ==========================================
const { getConnection } = require('../config/db');

// ==========================================
// 2. FUNCIÓN PARA AUTENTICACIÓN
// ==========================================
/**
 * Busca un bibliotecario por nombre de usuario
 * Utilizada principalmente para el proceso de login
 * 
 * @param {string} usuario - Nombre de usuario del bibliotecario
 * @returns {Object|null} Datos del bibliotecario o null si no existe
 */
async function findByUsuario(usuario) {
    const conn = await getConnection();
    try {
        const result = await conn.query(`SELECT * FROM bibliotecarios WHERE usuario = ?`, [usuario]);
        return result.length > 0 ? result[0] : null;
    } finally {
        await conn.close();
    }
}

// ==========================================
// 3. CREAR NUEVO BIBLIOTECARIO
// ==========================================
/**
 * Crea un nuevo bibliotecario con contraseña encriptada
 * 
 * @param {Object} data - Datos del bibliotecario
 * @param {string} data.usuario - Nombre de usuario único
 * @param {string} data.privilegios - Nivel de privilegios (N/Y/S)
 * @param {string} data.nombre - Nombre del bibliotecario
 * @param {string} data.contrasena - Contraseña en texto plano
 * @param {string} data.cedula - Cédula de identidad
 * @param {string} data.apellido - Apellido del bibliotecario
 * @returns {Object} Resultado de la inserción
 */
async function createBibliotecario({ usuario, privilegios, nombre, contrasena, cedula, apellido }) {
    const conn = await getConnection();
    try {
        // Encriptar contraseña con bcrypt antes de guardar
        const bcrypt = require('bcrypt');
        const hash = await bcrypt.hash(contrasena, 10);
        
        const result = await conn.query(
            `INSERT INTO bibliotecarios (usuario, privilegios, nombre, contrasena, cedula, apellido) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [usuario, privilegios, nombre, hash, cedula, apellido]
        );
        return result;
    } finally {
        await conn.close();
    }
}

// ==========================================
// 4. OBTENER TODOS LOS BIBLIOTECARIOS
// ==========================================
/**
 * Obtiene la lista completa de bibliotecarios
 * Excluye la contraseña por seguridad
 * 
 * @returns {Array} Lista de bibliotecarios ordenada por apellido
 */
async function getAllBibliotecarios() {
    const db = await getConnection();
    const result = await db.query(`
        SELECT 
            BIBLIOTECARIO_ID,
            USUARIO,
            PRIVILEGIOS,
            NOMBRE,
            APELLIDO,
            CEDULA
        FROM BIBLIOTECARIOS 
        ORDER BY APELLIDO, NOMBRE
    `);
    await db.close();
    return result;
}

// Obtener un bibliotecario por ID
async function getBibliotecarioById(id) {
    const db = await getConnection();
    const result = await db.query(`
        SELECT 
            BIBLIOTECARIO_ID,
            USUARIO,
            PRIVILEGIOS,
            NOMBRE,
            APELLIDO,
            CEDULA
        FROM BIBLIOTECARIOS 
        WHERE BIBLIOTECARIO_ID = ?
    `, [id]);
    await db.close();
    return result[0];
}

// Crear un nuevo bibliotecario (función CRUD)
async function createBibliotecarioCRUD(bibliotecario) {
    const db = await getConnection();
    const { USUARIO, PRIVILEGIOS, NOMBRE, APELLIDO, CEDULA, CONTRASENA } = bibliotecario;
    
    const result = await db.query(`
        INSERT INTO BIBLIOTECARIOS (USUARIO, PRIVILEGIOS, NOMBRE, APELLIDO, CEDULA, CONTRASENA)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [USUARIO, PRIVILEGIOS || 'N', NOMBRE, APELLIDO, CEDULA, CONTRASENA]);
    
    await db.close();
    return { affectedRows: result.count || result.affectedRows || 0 };
}

// Actualizar un bibliotecario
async function updateBibliotecario(id, bibliotecario) {
    const db = await getConnection();
    const { USUARIO, PRIVILEGIOS, NOMBRE, APELLIDO, CEDULA, CONTRASENA } = bibliotecario;
    
    let query = `
        UPDATE BIBLIOTECARIOS 
        SET USUARIO = ?, PRIVILEGIOS = ?, NOMBRE = ?, APELLIDO = ?, CEDULA = ?
    `;
    let params = [USUARIO, PRIVILEGIOS || 'N', NOMBRE, APELLIDO, CEDULA];
    
    // Solo actualizar contraseña si se proporciona
    if (CONTRASENA && CONTRASENA.trim() !== '') {
        query += `, CONTRASENA = ?`;
        params.push(CONTRASENA);
    }
    
    query += ` WHERE BIBLIOTECARIO_ID = ?`;
    params.push(id);
    
    const result = await db.query(query, params);
    await db.close();
    return { affectedRows: result.count || result.affectedRows || 0 };
}

// Eliminar un bibliotecario por ID
async function deleteBibliotecario(id) {
    console.log('🗑️ MODEL DELETE BIBLIOTECARIO - Iniciando eliminación en BD para ID:', id);
    
    let db;
    try {
        db = await getConnection();
        console.log('🗑️ MODEL DELETE BIBLIOTECARIO - Conexión a BD establecida');
        
        console.log('🗑️ MODEL DELETE BIBLIOTECARIO - Ejecutando query: DELETE FROM BIBLIOTECARIOS WHERE BIBLIOTECARIO_ID = ?', [id]);
        const result = await db.query('DELETE FROM BIBLIOTECARIOS WHERE BIBLIOTECARIO_ID = ?', [id]);
        
        console.log('🗑️ MODEL DELETE BIBLIOTECARIO - Resultado raw de la query:', result);
        console.log('🗑️ MODEL DELETE BIBLIOTECARIO - result.count:', result.count);
        console.log('🗑️ MODEL DELETE BIBLIOTECARIO - result.affectedRows:', result.affectedRows);
        
        await db.close();
        console.log('✅ MODEL DELETE BIBLIOTECARIO - Conexión cerrada exitosamente');
        
        const affectedRows = result.count || result.affectedRows || 0;
        console.log('🗑️ MODEL DELETE BIBLIOTECARIO - Filas afectadas finales:', affectedRows);
        
        return { affectedRows };
    } catch (error) {
        console.error('❌ MODEL DELETE BIBLIOTECARIO - Error en deleteBibliotecario:', error);
        console.log('🔍 MODEL DELETE BIBLIOTECARIO - Error message:', error.message);
        console.log('🔍 MODEL DELETE BIBLIOTECARIO - Error code:', error.code);
        console.log('🔍 MODEL DELETE BIBLIOTECARIO - Error state:', error.state);
        console.log('🔍 MODEL DELETE BIBLIOTECARIO - Error stack:', error.stack);
        
        // Verificar propiedades específicas del error ODBC
        if (error.odbcErrors) {
            console.log('🔍 MODEL DELETE BIBLIOTECARIO - ODBC Errors:', error.odbcErrors);
        }
        
        if (db) {
            try {
                await db.close();
                console.log('🔧 MODEL DELETE BIBLIOTECARIO - Conexión cerrada después del error');
            } catch (closeError) {
                console.error('❌ MODEL DELETE BIBLIOTECARIO - Error cerrando conexión:', closeError);
            }
        }
        
        // Re-lanzar el error para que lo capture el controlador
        throw error;
    }
}

// Obtener bibliotecarios filtrados con paginación
async function getBibliotecariosFiltrados(texto, page = 1, limit = 10) {
    console.log('🔍 MODEL FILTRADOS - Iniciando búsqueda con parámetros:', { texto, page, limit });
    
    let baseQuery = `FROM BIBLIOTECARIOS WHERE 1=1`;
    let where = '';
    const mainParams = [];
    
    if (texto) {
        where += " AND (USUARIO LIKE ? OR NOMBRE LIKE ? OR APELLIDO LIKE ? OR CEDULA LIKE ?)";
        mainParams.push(`%${texto}%`, `%${texto}%`, `%${texto}%`, `%${texto}%`);
        console.log('🔍 MODEL FILTRADOS - Agregando filtro de texto:', texto);
    }
    
    const offset = (page - 1) * limit;
    console.log('🔍 MODEL FILTRADOS - Calculando offset:', offset);
    
    let db;
    try {
        db = await getConnection();
        console.log('🔍 MODEL FILTRADOS - Conexión establecida');
        
        // Contar total
        const countQuery = `SELECT COUNT(*) as total ${baseQuery}${where}`;
        console.log('🔍 MODEL FILTRADOS - Query de conteo:', countQuery);
        console.log('🔍 MODEL FILTRADOS - Parámetros de conteo:', mainParams);
        
        const countResult = await db.query(countQuery, mainParams);
        const total = countResult[0].total;
        console.log('🔍 MODEL FILTRADOS - Total encontrado:', total);
        
        // Obtener registros paginados usando TOP START AT (sintaxis SQL Anywhere)
        const dataQuery = `
            SELECT TOP ${limit} START AT ${offset + 1}
                BIBLIOTECARIO_ID,
                USUARIO,
                PRIVILEGIOS,
                NOMBRE,
                APELLIDO,
                CEDULA
            ${baseQuery}${where}
            ORDER BY APELLIDO, NOMBRE
        `;
        
        console.log('🔍 MODEL FILTRADOS - Query de datos:', dataQuery);
        console.log('🔍 MODEL FILTRADOS - Parámetros de datos:', mainParams);
        
        const bibliotecarios = await db.query(dataQuery, mainParams);
        console.log('🔍 MODEL FILTRADOS - Bibliotecarios encontrados:', bibliotecarios.length);
        
        await db.close();
        console.log('✅ MODEL FILTRADOS - Consulta completada exitosamente');
        
        return { bibliotecarios, total };
    } catch (error) {
        console.error('❌ MODEL FILTRADOS - Error en getBibliotecariosFiltrados:', error);
        console.log('🔍 MODEL FILTRADOS - Error message:', error.message);
        console.log('🔍 MODEL FILTRADOS - Error code:', error.code);
        console.log('🔍 MODEL FILTRADOS - Error state:', error.state);
        
        if (error.odbcErrors) {
            console.log('🔍 MODEL FILTRADOS - ODBC Errors:', error.odbcErrors);
        }
        
        if (db) {
            try {
                await db.close();
                console.log('🔧 MODEL FILTRADOS - Conexión cerrada después del error');
            } catch (closeError) {
                console.error('❌ MODEL FILTRADOS - Error cerrando conexión:', closeError);
            }
        }
        
        throw error;
    }
}

module.exports = { 
    findByUsuario, 
    createBibliotecario,
    getAllBibliotecarios,
    getBibliotecarioById,
    createBibliotecarioCRUD,
    updateBibliotecario,
    deleteBibliotecario,
    getBibliotecariosFiltrados
};
