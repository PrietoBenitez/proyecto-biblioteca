
//  * =========================================
//  * SERVIDOR PRINCIPAL - SISTEMA GESTLIB
//  * =========================================
//  * 

// ==========================================
// 1. IMPORTAR DEPENDENCIAS PRINCIPALES
// ==========================================
const express = require('express');           // Framework web para Node.js
const cors = require('cors');                 // Permitir requests cross-origin
const morgan = require('morgan');             // Logger de requests HTTP
const path = require('path');                 // Utilidades para rutas de archivos

// ==========================================
// 2. CARGAR CONFIGURACIÓN DE ENTORNO
// ==========================================
require('dotenv').config();                   // Variables de entorno desde .env

// ==========================================
// 3. IMPORTAR TODAS LAS RUTAS DE LA API
// ==========================================
const sociosRoute = require('./backend/routes/socios.route');
const materialesRoute = require('./backend/routes/materiales.route');
const prestamosRoute = require('./backend/routes/prestamos.route');
const bibliotecariosRoute = require('./backend/routes/bibliotecarios.route');
const donantesRoute = require('./backend/routes/donantes.route');
const institucionesRoute = require('./backend/routes/instituciones.route');
const dashboardRoute = require('./backend/routes/dashboard.route');
const authRoute = require('./backend/routes/auth.route');
const estadisticasRoute = require('./backend/routes/estadisticas.route');
const authMiddleware = require('./backend/middleware/auth.middleware');
const { requestLogger, errorLogger } = require('./backend/middleware/logging.middleware');
const logger = require('./backend/utils/logger');

// ==========================================
// 4. CONFIGURACIÓN DEL SERVIDOR EXPRESS
// ==========================================
const app = express();
const PORT = process.env.PORT || 3000;        // Puerto del servidor (3000 por defecto)

// ==========================================
// 5. CONFIGURAR MIDDLEWARES GLOBALES
// ==========================================
app.use(express.json());                      // Parsear JSON en requests
app.use(cors());                              // Habilitar CORS para frontend
app.use(morgan('dev'));                       // Logging de requests en consola
app.use(requestLogger);                       // Logger personalizado de requests
app.use(express.static(path.join(__dirname, '/frontend/public'))); // Archivos estáticos

// ==========================================
// 6. CONFIGURAR RUTAS DE LA API REST
// ==========================================
app.use('/api/socios', sociosRoute);          // CRUD de socios de la biblioteca
app.use('/api/materiales', materialesRoute);  // CRUD de libros y materiales
app.use('/api/prestamos', prestamosRoute);    // CRUD de préstamos de libros
app.use('/api/bibliotecarios', bibliotecariosRoute); // CRUD de bibliotecarios/usuarios
app.use('/api/donantes', donantesRoute);      // CRUD de donantes de libros
app.use('/api/instituciones', institucionesRoute); // CRUD de instituciones
app.use('/api/dashboard', dashboardRoute);    // Datos para dashboard principal
app.use('/api/auth', authRoute);              // Autenticación y login
app.use('/api/estadisticas', estadisticasRoute); // Gráficos y reportes

// ==========================================
// 7. CONFIGURAR RUTAS PARA VISTAS HTML
// ==========================================

/**
 * Ruta principal - Página de Login
 * Redirige al login por defecto (acceso público)
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/views/login.html'));
});

/**
 * Dashboard Principal - Requiere autenticación
 * Página principal del sistema después del login
 */
app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/views/index.html'));
});

/**
 * Gestión de Socios - Vista principal
 * CRUD completo para socios de la biblioteca
 */
app.get('/socios', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/views/socios.html'));
});

/**
 * Gestión de Materiales - Vista principal
 * CRUD completo para libros y materiales
 */
app.get('/materiales', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/views/materiales.html'));
});

/**
 * Gestión de Préstamos - Vista principal
 * CRUD completo para préstamos de libros
 */
app.get('/prestamos', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/views/prestamos.html'));
});

/**
 * Gestión de Donantes - Vista principal
 * CRUD completo para donantes de libros
 */
app.get('/donantes', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/views/donantes.html'));
});

/**
 * Gestión de Instituciones - Vista principal
 * CRUD completo para instituciones
 */
app.get('/instituciones', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/views/instituciones.html'));
});

/**
 * Gestión de Bibliotecarios - Vista principal
 * CRUD completo para usuarios del sistema
 */
app.get('/bibliotecarios', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/views/bibliotecarios.html'));
});

/**
 * Página de Estadísticas - Vista principal
 * Gráficos y reportes del sistema
 */
app.get('/estadisticas', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/views/estadisticas.html'));
});

// ==========================================
// 8. INICIAR SERVIDOR EN EL PUERTO CONFIGURADO
// ==========================================

// Middleware de manejo de errores 
app.use(errorLogger);

app.listen(PORT, () => {
    const mensaje = `
    ✅ ========================================
    🚀 SERVIDOR GESTLIB INICIADO
    ========================================
    📍 Dirección: http://localhost:${PORT}
    🔌 Puerto: ${PORT}
    🕐 Hora: ${new Date().toLocaleString()}
    ========================================
    `;
    
    console.log(mensaje);
    logger.info('SERVER', 'STARTUP', `Servidor GestLib iniciado en puerto ${PORT}`, {
        port: PORT,
        timestamp: new Date().toISOString(),
        nodeVersion: process.version
    });
});