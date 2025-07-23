// backend/models/estadisticas.model.js
const { getConnection } = require('../config/db');

async function getTotales() {
    const conn = await getConnection();
    try {
        const socios = await conn.query('SELECT COUNT(*) AS total FROM socios');
        const materiales = await conn.query('SELECT COUNT(*) AS total FROM materiales');
        const prestamos = await conn.query('SELECT COUNT(*) AS total FROM prestamos');
        const donantes = await conn.query('SELECT COUNT(*) AS total FROM donantes');
        return {
            socios: socios[0].total,
            materiales: materiales[0].total,
            prestamos: prestamos[0].total,
            donantes: donantes[0].total
        };
    } finally {
        await conn.close();
    }
}

module.exports = { getTotales };
