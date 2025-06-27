const express = require('express');
const http = require('http');
const cors = require('cors');
const apiRoutes = require('./api/routes');

const app = express();
const server = http.createServer(app);

// Middlewares
app.use(cors({
  origin: [process.env.FRONTEND_URL, process.env.ADMIN_URL],
}));
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.send('El servidor del Crack de las Jugadas está operativo!');
});

module.exports = { app, server };
