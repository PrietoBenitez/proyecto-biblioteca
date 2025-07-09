const { getConnection } = require('../config/db');

// Utilidad para aceptar mayúsculas y minúsculas desde el frontend
function normalizarDonante(donante) {
  return {
    NOMBRE: donante.NOMBRE || donante.nombre || '',
    APELLIDO: donante.APELLIDO || donante.apellido || '',
    CEDULA: donante.CEDULA || donante.cedula || ''
  };
}

async function getAllDonantes() {
  const connection = await getConnection();
  const result = await connection.query('SELECT * FROM DONANTES');
  await connection.close();
  return result;
}

async function getDonanteById(id) {
  const connection = await getConnection();
  const result = await connection.query('SELECT * FROM DONANTES WHERE DONANTE_ID = ?', [id]);
  await connection.close();
  return result[0];
}

async function createDonante(donante) {
  const connection = await getConnection();
  const d = normalizarDonante(donante);
  const result = await connection.query(
    'INSERT INTO DONANTES (NOMBRE, APELLIDO, CEDULA) VALUES (?, ?, ?)',
    [d.NOMBRE, d.APELLIDO, d.CEDULA]
  );
  await connection.close();
  return result;
}

async function updateDonante(id, donante) {
  const connection = await getConnection();
  const d = normalizarDonante(donante);
  const result = await connection.query(
    'UPDATE DONANTES SET NOMBRE = ?, APELLIDO = ?, CEDULA = ? WHERE DONANTE_ID = ?',
    [d.NOMBRE, d.APELLIDO, d.CEDULA, id]
  );
  await connection.close();
  return result;
}

async function deleteDonante(id) {
  const connection = await getConnection();
  const result = await connection.query('DELETE FROM DONANTES WHERE DONANTE_ID = ?', [id]);
  await connection.close();
  return result;
}

module.exports = {
  getAllDonantes,
  getDonanteById,
  createDonante,
  updateDonante,
  deleteDonante
};