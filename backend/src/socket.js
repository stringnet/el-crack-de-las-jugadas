const { Server } = require('socket.io');

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: [process.env.FRONTEND_URL, process.env.ADMIN_URL],
      methods: ["GET", "POST"]
    }
  });

  // Espacios de nombres para separar lógicas
  const players_nsp = io.of("/players");
  const admin_nsp = io.of("/admin");
  const projection_nsp = io.of("/projection");

  // Lógica de conexión para jugadores
  players_nsp.on('connection', (socket) => {
    console.log(`Jugador conectado: ${socket.id}`);
    
    socket.on('player:join', (name) => {
      console.log(`Jugador ${name} se ha unido.`);
      // Lógica para guardar jugador
    });

    socket.on('player:submit_answer', (data) => {
      console.log(`Respuesta recibida de ${socket.id}:`, data);
      // Lógica para procesar respuesta
    });

    socket.on('disconnect', () => {
      console.log(`Jugador desconectado: ${socket.id}`);
    });
  });

  // Lógica de conexión para el administrador
  admin_nsp.on('connection', (socket) => {
    console.log(`Admin conectado: ${socket.id}`);
    
    socket.on('admin:start_game', () => {
      console.log('¡Juego iniciado por el admin!');
      // Emitir a todos los clientes (jugadores, proyector)
      io.of('/players').emit('server:game_started');
      io.of('/projection').emit('server:game_started');
    });

    socket.on('admin:next_question', (question) => {
        console.log('Admin envió nueva pregunta:', question.text);
        io.of('/players').emit('server:new_question', question);
        io.of('/projection').emit('server:new_question', question);
    });
  });

  console.log('Socket.IO inicializado.');
  return io;
}

function getIO() {
    if (!io) {
        throw new Error("Socket.io no ha sido inicializado!");
    }
    return io;
}

module.exports = { initSocket, getIO };
