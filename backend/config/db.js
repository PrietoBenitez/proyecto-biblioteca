// backend/config/db.js
const odbc = require('odbc');
require('dotenv').config();

//const connectionString = `DSN=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`; // old

const connectionString = `DSN=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD};CHARSET=UTF8`; // Caracteres UTF8

async function getConnection() {
  try {
    const connection = await odbc.connect(connectionString);
    return connection;
  } catch (err) {
    console.error('Error conectando a Sybase SQL Anywhere via ODBC:', err);
    throw err;
  }
}

module.exports = { getConnection };