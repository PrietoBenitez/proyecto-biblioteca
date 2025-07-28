/**
 * =========================================
 * CONFIGURACIÓN DE BASE DE DATOS - BIBLIOTECH
 * =========================================
 * 
 * Este archivo maneja la conexión a la base de datos
 * SQL Anywhere (Sybase) usando el driver ODBC.
 * 
 * Funcionalidades:
 * - Conexión ODBC a SQL Anywhere
 * - Soporte para caracteres UTF-8
 * - Manejo de errores de conexión
 * - Variables de entorno para seguridad
 * 
 * Autor: Sistema GestLib
 * =========================================
 */

// ==========================================
// 1. IMPORTAR DEPENDENCIAS
// ==========================================
const odbc = require('odbc');                 // Driver ODBC para Node.js
require('dotenv').config();                   // Variables de entorno

// ==========================================
// 2. CONFIGURAR CADENA DE CONEXIÓN
// ==========================================
/**
 * Cadena de conexión ODBC con soporte UTF-8
 * 
 * Componentes:
 * - DSN: Data Source Name configurado en Windows
 * - UID: Usuario de la base de datos
 * - PWD: Contraseña del usuario
 * - CHARSET: Codificación UTF-8 para caracteres especiales
 */
const connectionString = `DSN=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD};CHARSET=UTF8`;

// ==========================================
// 3. FUNCIÓN DE CONEXIÓN A LA BASE DE DATOS
// ==========================================
/**
 * Establece una conexión ODBC a SQL Anywhere
 * 
 * @returns {Object} Objeto de conexión ODBC
 * @throws {Error} Error si la conexión falla
 */
async function getConnection() {
  try {
    console.log('🔌 Conectando a base de datos SQL Anywhere...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ Conexión establecida exitosamente');
    return connection;
  } catch (err) {
    console.error('❌ Error conectando a Sybase SQL Anywhere via ODBC:', err);
    throw err;
  }
}

// ==========================================
// 4. EXPORTAR FUNCIÓN DE CONEXIÓN
// ==========================================
module.exports = { getConnection }; 