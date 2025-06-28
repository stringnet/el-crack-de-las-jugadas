const { Server } = require('socket.io');

// Estado del juego en memoria del servidor
let gameState = {
  isActive: false,
  players: {},
  currentQuestion: null,
};

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: { origin: [process.env.FRONTEND_URL, process.env.ADMIN_URL] }
  });

  const players_nsp = io.of("/players");
  const admin_nsp = io.of("/admin");

  // --- Lógica para Jugadores ---
  players_nsp.on('connection', (socket) => {
    console.log(`[+] Jugador conectado: ${socket.id}`);
    
    socket.on('player:join', ({ name }) => {
      // Permitimos que los jugadores se unan en cualquier momento.
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
          player.score += question.points || 10; // Usamos los puntos de la pregunta o 10 por defecto
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

  // --- Lógica para el Administrador ---
  admin_nsp.on('connection', (socket) => {
    console.log(`[ADMIN] Admin conectado: ${socket.id}`);
    
    socket.on('admin:start_game', () => {
      console.log('--- JUEGO INICIADO (REINICIO TOTAL) ---');
      // REINICIO TOTAL: Borramos la lista de jugadores y puntajes anteriores
      gameState.players = {};
      gameState.isActive = true;
      gameState.currentQuestion = null;
      
      // Enviamos la señal a todos los clientes para que reseteen su interfaz
      io.of('/players').emit('server:game_started');
      io.of('/projection').emit('server:game_started');
      broadcastRanking(); // El ranking ahora estará vacío
      socket.emit('admin:feedback', { message: 'Nuevo juego iniciado. Estado reiniciado.' });
    });

    socket.on('admin:end_game', () => {
        if (!gameState.isActive) return;
        console.log('--- JUEGO FINALIZADO (CORTE INMEDIATO) ---');
        gameState.isActive = false;
        
        const finalRanking = getRanking();
        
        // Enviamos la señal de corte final a todos
        io.of('/players').emit('server:game_over', { finalRanking });
        io.of('/projection').emit('server:game_over', { finalRanking });
    });

    socket.on('admin:next_question', (question) => {
        if (!gameState.isActive) return;
        gameState.currentQuestion = question;
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

  console.log('Socket.IO inicializado con lógica de reinicio/corte mejorada.');
  return io;
}

module.exports = { initSocket };
