const { Server } = require('socket.io');

// Un objeto simple para mantener el estado del juego y los jugadores en memoria.
const gameState = {
  isActive: false,
  players: {}, // Usaremos el ID del socket como clave
};

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: [process.env.FRONTEND_URL, process.env.ADMIN_URL],
      methods: ["GET", "POST"]
    }
  });

  const players_nsp = io.of("/players");
  const admin_nsp = io.of("/admin");
  const projection_nsp = io.of("/projection");

  // --- Lógica para Jugadores ---
  players_nsp.on('connection', (socket) => {
    console.log(`Jugador conectado: ${socket.id}`);
    
    socket.on('player:join', ({ name }) => {
      // Solo permitimos que se unan jugadores si el juego no ha comenzado
      if (gameState.isActive) {
        socket.emit('server:error', { message: 'El juego ya ha comenzado, no puedes unirte.' });
        return;
      }
      gameState.players[socket.id] = { id: socket.id, name, score: 0 };
      console.log(`Jugador ${name} (${socket.id}) se ha unido.`);
      // No es necesario emitir el ranking aquí, lo haremos al finalizar
    });

    socket.on('player:submit_answer', ({ questionId, answerId }) => {
        // Aquí iría la lógica para verificar si la respuesta es correcta
        // y actualizar el puntaje del jugador en gameState.players[socket.id].score
        console.log(`Respuesta recibida de ${socket.id}:`, { questionId, answerId });
    });

    socket.on('ranking:get', () => {
        // Cuando alguien pida el ranking, se lo enviamos
        const ranking = Object.values(gameState.players).sort((a, b) => b.score - a.score).slice(0, 10);
        socket.emit('server:update_ranking', ranking);
    });

    socket.on('disconnect', () => {
      console.log(`Jugador desconectado: ${socket.id}`);
      delete gameState.players[socket.id]; // Lo eliminamos del estado
    });
  });

  // --- Lógica para el Administrador ---
  admin_nsp.on('connection', (socket) => {
    console.log(`Admin conectado: ${socket.id}`);
    
    socket.on('admin:start_game', () => {
      console.log('--- JUEGO INICIADO ---');
      gameState.isActive = true;
      // Reiniciamos los puntajes de todos los jugadores conectados
      for (const id in gameState.players) {
        gameState.players[id].score = 0;
      }
      // Avisamos a todos los clientes que el juego ha comenzado
      players_nsp.emit('server:game_started');
      projection_nsp.emit('server:game_started');
      socket.emit('admin:feedback', { message: 'Juego iniciado correctamente.' });
    });

    socket.on('admin:end_game', () => {
        console.log('--- JUEGO FINALIZADO ---');
        gameState.isActive = false;
        
        // Calculamos el ranking final y lo enviamos
        const finalRanking = Object.values(gameState.players).sort((a, b) => b.score - a.score).slice(0, 10);
        
        players_nsp.emit('server:game_over', { finalRanking });
        projection_nsp.emit('server:game_over', { finalRanking });
        socket.emit('admin:feedback', { message: 'Juego finalizado. Ranking enviado.' });
    });

    socket.on('admin:next_question', (question) => {
        if (!gameState.isActive) {
            socket.emit('admin:feedback', { message: 'Error: El juego no ha sido iniciado.' });
            return;
        }
        console.log('Admin envió nueva pregunta:', question.question_text);
        players_nsp.emit('server:new_question', question);
        projection_nsp.emit('server:new_question', question);
    });
  });

  console.log('Socket.IO inicializado con lógica de juego.');
  return io;
}

function getIO() {
    if (!io) throw new Error("Socket.io no ha sido inicializado!");
    return io;
}

module.exports = { initSocket, getIO };
