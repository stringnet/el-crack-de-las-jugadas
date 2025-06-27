const { Pool } = require('pg');

// La Pool maneja las conexiones a la base de datos de forma eficiente.
// Lee la URL de conexión directamente desde la variable de entorno DATABASE_URL.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // En producción, es recomendable configurar la conexión SSL
  // ssl: {
  //   rejectUnauthorized: false
  // }
});

// Función para hacer consultas a la base de datos.
// La exportamos para poder usarla en cualquier parte del backend.
const query = (text, params) => pool.query(text, params);

module.exports = {
  query
};

// Pequeña prueba para verificar la conexión al iniciar el servidor
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error al conectar con la base de datos:', err.stack);
  }
  client.query('SELECT NOW()', (err, result) => {
    release(); // Liberar el cliente de vuelta al pool
    if (err) {
      return console.error('Error ejecutando la consulta de prueba', err.stack);
    }
    console.log('🐘 Conexión a PostgreSQL exitosa:', result.rows[0].now);
  });
});
