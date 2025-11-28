// En db.js, agregar validación de parámetros
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const query = async (text, params) => {
  try {
    // Validación básica de parámetros
    if (params && !Array.isArray(params)) {
      throw new Error('Los parámetros deben ser un array');
    }
    return await pool.query(text, params);
  } catch (error) {
    console.error('Error en consulta SQL:', error);
    throw error;
  }
};

module.exports = { query, pool };