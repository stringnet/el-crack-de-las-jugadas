const { Server } = require('socket.io');
const db = require('./config/db');

let gameState = {
  isActive: false,
  currentQuestion: null,
  questionTimer: null,
};

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: { origin: [process.env.FRONTEND_URL, process.env.ADMIN_URL] }
  });

  const players_nsp = io.of("/players");
  const admin_nsp = io.of("/admin");
  const projection_nsp = io.of("/projection");

  players_nsp.on('connection', (socket) => {
    socket.on('player:join', async ({ name }) => {
      try {
        const existingPlayer = await getPlayerByName(name);
        if (existingPlayer) {
          await db.query('UPDATE players SET socket_id = $1 WHERE id = $2', [socket.id, existingPlayer.id]);
        } else {
          await db.query('INSERT INTO players (name, socket_id, score) VALUES ($1, $2, 0)', [name, socket.id]);
        }
        broadcastRanking();
      } catch (err) { console.error("Error al unir jugador:", err); }
    });

    socket.on('player:submit_answer', async ({ questionId, answerId }) => {
      if (!gameState.isActive || !gameState.currentQuestion || gameState.currentQuestion.id != questionId) return;
      const player = await getPlayerBySocketId(socket.id);
      const question = gameState.currentQuestion;
      if (player && question && parseInt(question.correct_option) === parseInt(answerId)) {
        try {
          const points = parseInt(question.points) || 10;
          await db.query('UPDATE players SET score = score + $1 WHERE id = $2', [points, player.id]);
          broadcastRanking();
        } catch (err) { console.error("Error al actualizar puntaje:", err); }
      }
    });

    socket.on('ranking:get', () => { broadcastRanking(socket); });

    socket.on('disconnect', async () => {
      try {
        await db.query('UPDATE players SET socket_id = NULL WHERE socket_id = $1', [socket.id]);
      } catch(err) { console.error("Error al limpiar socket_id en desconexión:", err); }
    });
  });

  admin_nsp.on('connection', (socket) => {
    socket.on('admin:start_game', () => {
      console.log('--- JUEGO INICIADO (MODELO B - HISTÓRICO) ---');
      // EN EL MODELO B, NO BORRAMOS LA TABLA. SOLO ACTIVAMOS EL JUEGO.
      // La limpieza se hará con un botón de "Reiniciar Ranking" si se desea en el futuro.
      if (gameState.questionTimer) clearTimeout(gameState.questionTimer);
      gameState.isActive = true;
      gameState.currentQuestion = null;
      
      const namespaces = [players_nsp, projection_nsp];
      namespaces.forEach(nsp => nsp.emit('server:game_started'));
    });

    socket.on('admin:end_game', async () => {
        if (!gameState.isActive) return;
        if (gameState.questionTimer) clearTimeout(gameState.questionTimer);
        gameState.isActive = false;
        const finalRanking = await getRanking();
        const namespaces = [players_nsp, projection_nsp];
        namespaces.forEach(nsp => nsp.emit('server:game_over', { finalRanking }));
    });

    socket.on('admin:next_question', (question) => {
        if (!gameState.isActive) return;
        if (gameState.questionTimer) clearTimeout(gameState.questionTimer);
        gameState.currentQuestion = question;
        
        const namespaces = [players_nsp, projection_nsp];
        namespaces.forEach(nsp => nsp.emit('server:new_question', question));

        const timeLimit = (parseInt(question.time_limit_secs) || 15) * 1000;
        gameState.questionTimer = setTimeout(() => {
            players_nsp.emit('server:time_up');
            projection_nsp.emit('server:reveal_answer', { correctOption: question.correct_option });
            gameState.currentQuestion = null;
        }, timeLimit);
    });
  });

  async function getPlayerByName(name) { /* ... */ }
  async function getPlayerBySocketId(socketId) { /* ... */ }
  async function getRanking() { /* ... */ }
  async function broadcastRanking(targetSocket = null) { /* ... */ }

  console.log('Socket.IO del Servidor inicializado con Ranking Histórico y Persistente.');
  return io;
}

module.exports = { initSocket };
