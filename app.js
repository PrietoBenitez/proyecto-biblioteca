// backend/app.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

// Cargar variables de entorno
require('dotenv').config();

// Importar rutas
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


// Iniciar servidor
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, '/frontend/public')));

// Usar rutas
app.use('/api/socios', sociosRoute);
app.use('/api/materiales', materialesRoute);
app.use('/api/prestamos', prestamosRoute);
app.use('/api/bibliotecarios', bibliotecariosRoute);
app.use('/api/donantes', donantesRoute);
app.use('/api/instituciones', institucionesRoute);
app.use('/api/dashboard', dashboardRoute);
app.use('/api/auth', authRoute);
app.use('/api/estadisticas', estadisticasRoute);

// Ruta inicial: redirigir a login si no está autenticado
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/views/login.html'));
});

// Rutas públicas para vistas
app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/views/index.html'));
});
app.get('/socios', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/views/socios.html'));
});
app.get('/materiales', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/views/materiales.html'));
});
app.get('/prestamos', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/views/prestamos.html'));
});
app.get('/donantes', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/views/donantes.html'));
});
app.get('/instituciones', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/views/instituciones.html'));
});
app.get('/bibliotecarios', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/views/bibliotecarios.html'));
});
app.get('/estadisticas', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/views/estadisticas.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});