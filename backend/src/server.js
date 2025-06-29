const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path'); // Nos aseguramos de que 'path' esté importado
const apiRoutes = require('./api/routes');

const app = express();
const server = http.createServer(app);

// Configuración de CORS
const corsOptions = {
  origin: [process.env.FRONTEND_URL, process.env.ADMIN_URL]
};
app.use(cors(corsOptions));

// Middleware para entender JSON
app.use(express.json());

// --- CORRECCIÓN FINAL PARA SERVIR ARCHIVOS ESTÁTICOS ---
// Usamos path.resolve() para crear una ruta absoluta desde la raíz del proyecto
// dentro del contenedor, lo cual es el método más robusto.
const uploadsDir = path.resolve(process.cwd(), 'public/uploads');
app.use('/uploads', express.static(uploadsDir));
console.log(`Sirviendo archivos estáticos desde: ${uploadsDir}`);
// ----------------------------------------------------

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('El servidor del Crack de las Jugadas está operativo!');
});

// Rutas de la API
app.use('/api', apiRoutes);

module.exports = { app, server };
