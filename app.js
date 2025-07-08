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
const devolucionesRoute = require('./backend/routes/devoluciones.route');
const bibliotecariosRoute = require('./backend/routes/bibliotecarios.route');
const donantesRoute = require('./backend/routes/donantes.route');


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
app.use('/api/devoluciones', devolucionesRoute);
app.use('/api/bibliotecarios', bibliotecariosRoute);
app.use('/api/donantes', donantesRoute);

// Ruta inicial
app.get('/', (req, res) => {
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

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});