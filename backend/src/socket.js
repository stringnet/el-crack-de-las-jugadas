const { Server } = require('socket.io');

// Estado del juego que vive en la memoria del servidor
let gameState = {
  isActive: false,
  players: {},
  currentQuestion: null,
};

// Variable para la instancia del servidor de sockets
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

  // --- Lógica para Conexiones de Jugadores ---
  players_nsp.on('connection', (socket) => {
    console.log(`[+] Jugador conectado: ${socket.id}`);
    
    socket.on('player:join', ({ name }) => {
      gameState.players[socket.id] = { id: socket.id, name, score: 0 };
      console.log(`[>] Jugador ${name} (${socket.id}) se ha unido.`);
      broadcastRanking();
    });

    socket.on('player:submit_answer', ({ questionId, answerId }) => {
      if (!gameState.isActive) return;
      const player = gameState.players[socket.id];
      const question = gameState.currentQuestion;
      
      if (player && question && question.id == questionId) {
        if (question.correct_option == answerId) {
          player.score += question.points || 10;
          console.log(`[CORRECTO] ${player.name} +${question.points || 10} puntos. Total: ${player.score}`);
          broadcastRanking();
        }
      }
    });

    socket.on('ranking:get', () => { broadcastRanking(socket); });

    socket.on('disconnect', () => {
      console.log(`[-] Jugador desconectado: ${socket.id}`);
      delete gameState.players[socket.id];
      broadcastRanking();
    });
  });

  // --- Lógica para Conexiones del Administrador ---
  admin_nsp.on('connection', (socket) => {
    console.log(`[ADMIN] Admin conectado: ${socket.id}`);
    
    socket.on('admin:start_game', () => {
      console.log('--- JUEGO INICIADO (REINICIO TOTAL) ---');
      gameState.players = {};
      gameState.isActive = true;
      gameState.currentQuestion = null;
      
      const namespaces = [players_nsp, projection_nsp];
      namespaces.forEach(nsp => nsp.emit('server:game_started'));
      
      broadcastRanking();
    });

    socket.on('admin:end_game', () => {
        if (!gameState.isActive) return;
        console.log('--- JUEGO FINALIZADO (CORTE INMEDIATO) ---');
        gameState.isActive = false;
        
        const finalRanking = getRanking();
        const namespaces = [players_nsp, projection_nsp];
        namespaces.forEach(nsp => nsp.emit('server:game_over', { finalRanking }));
    });

    socket.on('admin:next_question', (question) => {
        if (!gameState.isActive) return;
        gameState.currentQuestion = question;
        const namespaces = [players_nsp, projection_nsp];
        namespaces.forEach(nsp => nsp.emit('server:new_question', question));
    });
  });

  function getRanking() {
    return Object.values(gameState.players).sort((a, b) => b.score - a.score).slice(0, 10);
  }

  function broadcastRanking(targetSocket = null) {
    const ranking = getRanking();
    const target = targetSocket || players_nsp;
    target.emit('server:update_ranking', ranking);
  }

  console.log('Socket.IO del Servidor inicializado correctamente.');
  return io;
}

module.exports = { initSocket };
