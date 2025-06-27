const express = require('express');
const http = require('http');
const cors = require('cors');
const apiRoutes = require('./api/routes'); // Importamos nuestras rutas

const app = express();
const server = http.createServer(app);

// Configuración de CORS para permitir peticiones desde nuestros dominios de frontend
const corsOptions = {
  origin: [process.env.FRONTEND_URL, process.env.ADMIN_URL]
};

app.use(cors(corsOptions));

// Middleware para que Express entienda peticiones con cuerpo en formato JSON
app.use(express.json());

// Ruta principal de prueba
app.get('/', (req, res) => {
  res.send('El servidor del Crack de las Jugadas está operativo!');
});

// Usamos nuestro enrutador para todas las peticiones que empiecen con /api
app.use('/api', apiRoutes);

module.exports = { app, server };
