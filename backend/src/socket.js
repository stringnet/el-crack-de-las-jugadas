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
    console.log(`[+] Jugador conectado: ${socket.id}`);
    
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
      // Si no hay juego activo o pregunta actual, ignora la respuesta.
      if (!gameState.isActive || !gameState.currentQuestion || gameState.currentQuestion.id != questionId) return;
      
      const player = await getPlayerBySocketId(socket.id);
      const question = gameState.currentQuestion;
      
      if (player && question && parseInt(question.correct_option) === parseInt(answerId)) {
        try {
          const points = parseInt(question.points) || 10;
          await db.query('UPDATE players SET score = score + $1 WHERE id = $2', [points, player.id]);
          // Este es el log que confirma que los puntos se suman
          console.log(`[CORRECTO] +${points} puntos para ${player.name}.`);
          broadcastRanking();
        } catch (err) { console.error("Error al actualizar puntaje:", err); }
      }
    });

    socket.on('ranking:get', () => { broadcastRanking(socket); });

    socket.on('disconnect', async () => {
      console.log(`[-] Jugador desconectado: ${socket.id}`);
      try {
        await db.query('UPDATE players SET socket_id = NULL WHERE socket_id = $1', [socket.id]);
      } catch(err) { console.error("Error al limpiar socket_id en desconexión:", err); }
    });
  });

  admin_nsp.on('connection', (socket) => {
    socket.on('admin:start_game', async () => {
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
        console.log(`[PREGUNTA] Enviada: ${question.question_text}`);

        const timeLimit = (parseInt(question.time_limit_secs) || 15) * 1000;
        gameState.questionTimer = setTimeout(() => {
            console.log(`[TIEMPO] Fin del tiempo para la pregunta ${question.id}.`);
            
            players_nsp.emit('server:time_up');
            projection_nsp.emit('server:reveal_answer', { correctOption: question.correct_option });

            // --- CORRECCIÓN DE LA CONDICIÓN DE CARRERA ---
            // Damos un periodo de gracia de 2 segundos antes de limpiar la pregunta actual,
            // para que las respuestas de último momento puedan ser procesadas.
            setTimeout(() => {
                // Verificamos que la pregunta que vamos a limpiar sea la misma que inició el timer
                if (gameState.currentQuestion && gameState.currentQuestion.id === question.id) {
                    console.log(`[GRACIA] Limpiando pregunta actual (ID: ${question.id}) después del periodo de gracia.`);
                    gameState.currentQuestion = null;
                }
            }, 2000); // 2 segundos de gracia

        }, timeLimit);
    });
  });

  // Funciones auxiliares para la base de datos
  async function getPlayerByName(name) {
    const { rows } = await db.query('SELECT * FROM players WHERE name = $1 LIMIT 1', [name]);
    return rows[0];
  }
  async function getPlayerBySocketId(socketId) {
    const { rows } = await db.query('SELECT * FROM players WHERE socket_id = $1 LIMIT 1', [socketId]);
    return rows[0];
  }
  async function getRanking() {
    const { rows } = await db.query('SELECT id, name, score, socket_id FROM players ORDER BY score DESC, name ASC LIMIT 10');
    return rows;
  }
  async function broadcastRanking(targetSocket = null) {
    const ranking = await getRanking();
    const target = targetSocket || players_nsp;
    target.emit('server:update_ranking', ranking);
  }

  console.log('Socket.IO del Servidor inicializado con periodo de gracia para respuestas.');
  return io;
}

module.exports = { initSocket };
