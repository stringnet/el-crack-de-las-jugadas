const { Server } = require('socket.io');

let gameState = {
  isActive: false,
  players: {},
  currentQuestion: null // ¡NUEVO! Guardamos la pregunta actual para verificar la respuesta
};

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: { origin: [process.env.FRONTEND_URL, process.env.ADMIN_URL] }
  });

  const players_nsp = io.of("/players");
  const admin_nsp = io.of("/admin");

  players_nsp.on('connection', (socket) => {
    socket.on('player:join', ({ name }) => {
      gameState.players[socket.id] = { id: socket.id, name, score: 0 };
      broadcastRanking();
    });

    socket.on('player:submit_answer', ({ questionId, answerId }) => {
      const player = gameState.players[socket.id];
      const question = gameState.currentQuestion;
      
      // Verificamos si la respuesta es para la pregunta actual y si es correcta
      if (gameState.isActive && player && question && question.id == questionId) {
        if (question.correct_option == answerId) {
          player.score += question.points; // ¡Añadimos los puntos de la pregunta!
          console.log(`Jugador ${player.name} respondió correctamente. Nuevo puntaje: ${player.score}`);
          broadcastRanking();
        }
      }
    });

    socket.on('ranking:get', () => { broadcastRanking(socket); });
    socket.on('disconnect', () => {
      delete gameState.players[socket.id];
      broadcastRanking();
    });
  });

  admin_nsp.on('connection', (socket) => {
    socket.on('admin:start_game', () => {
      gameState.isActive = true;
      gameState.players = {};
      gameState.currentQuestion = null;
      io.of('/players').emit('server:game_started');
      io.of('/projection').emit('server:game_started');
      broadcastRanking();
    });

    socket.on('admin:end_game', () => {
      if (!gameState.isActive) return;
      gameState.isActive = false;
      const finalRanking = getRanking();
      io.of('/players').emit('server:game_over', { finalRanking });
      io.of('/projection').emit('server:game_over', { finalRanking });
    });

    socket.on('admin:next_question', (question) => {
      if (!gameState.isActive) return;
      gameState.currentQuestion = question; // Guardamos la pregunta actual
      io.of('/players').emit('server:new_question', question);
      io.of('/projection').emit('server:new_question', question);
    });
  });

  function getRanking() {
    return Object.values(gameState.players).sort((a, b) => b.score - a.score).slice(0, 10);
  }

  function broadcastRanking(targetSocket = null) {
    const ranking = getRanking();
    const target = targetSocket || io.of('/players');
    target.emit('server:update_ranking', ranking);
  }

  console.log('Socket.IO inicializado con lógica de puntaje.');
  return io;
}

module.exports = { initSocket };
