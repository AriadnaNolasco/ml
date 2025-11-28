const { query } = require('./config/db');

(async () => {
  try {
    const result = await query('SELECT current_database() AS db, current_schema() AS schema, version() AS version;');
    console.log('✅ Conexión exitosa:');
    console.table(result.rows);
  } catch (err) {
    console.error('❌ Error de conexión o consulta:', err);
  }
})();
