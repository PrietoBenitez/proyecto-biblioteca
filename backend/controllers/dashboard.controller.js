// backend/controllers/dashboard.controller.js
const sociosModel = require('../models/socios.model');
const materialesModel = require('../models/materiales.model');
const prestamosModel = require('../models/prestamos.model');
const donantesModel = require('../models/donantes.model');


// Controlador de dashboard para obtener conteos de entidades

exports.getDashboardCounts = async (req, res) => {
    try {
        // Socios activos (puedes ajustar la condición según tu modelo de datos)
        const socios = await sociosModel.getAllSocios ? await sociosModel.getAllSocios() : [];
        const sociosActivos = socios.filter(s => s.ESTADO === 'A' || s.ACTIVO === true || s.ACTIVO === 'S').length || socios.length;

        // Materiales (total)
        const materiales = await materialesModel.getAllMateriales ? await materialesModel.getAllMateriales() : [];
        const totalMateriales = materiales.length;

        // Préstamos activos (puedes ajustar la condición según tu modelo de datos)
        const prestamos = await prestamosModel.getAllPrestamos ? await prestamosModel.getAllPrestamos() : [];
        const prestamosActivos = prestamos.filter(p => !p.FECHA_DEVOLUCION || p.ESTADO === 'A' || p.ACTIVO === true || p.ACTIVO === 'S').length || prestamos.length;

        // Donantes sumados (total)
        const donantes = await donantesModel.getAllDonantes ? await donantesModel.getAllDonantes() : [];
        const totalDonantes = donantes.length;

        res.json({
            sociosActivos,
            totalMateriales,
            prestamosActivos,
            totalDonantes
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
