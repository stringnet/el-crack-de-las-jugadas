require('dotenv').config();
const { server } = require('./server');
const { initSocket } = require('./socket');

const PORT = process.env.PORT || 8080;

// Inicializar Socket.IO
initSocket(server);

server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
