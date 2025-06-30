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
      console.log(`[SUBMIT] Recibida respuesta de ${socket.id} para pregunta ${questionId} con opción ${answerId}.`);
      
      if (!gameState.isActive) return console.log('[SUBMIT] IGNORADO: Juego no activo.');
      if (!gameState.currentQuestion) return console.log('[SUBMIT] IGNORADO: No hay pregunta actual (probablemente se acabó el tiempo).');
      if (gameState.currentQuestion.id != questionId) return console.log('[SUBMIT] IGNORADO: ID de pregunta no coincide.');
      
      const player = await getPlayerBySocketId(socket.id);
      if (!player) return console.log(`[SUBMIT] IGNORADO: No se encontró jugador para socket ${socket.id}`);
      
      const question = gameState.currentQuestion;
      
      if (parseInt(question.correct_option) === parseInt(answerId)) {
        try {
          const points = parseInt(question.points) || 10;
          await db.query('UPDATE players SET score = score + $1 WHERE id = $2', [points, player.id]);
          console.log(`[CORRECTO] +${points} puntos para ${player.name}.`);
          broadcastRanking();
        } catch (err) { console.error("Error al actualizar puntaje:", err); }
      } else {
        console.log(`[INCORRECTO] Respuesta de ${player.name} no es correcta.`);
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
      if (gameState.questionTimer) clearTimeout(gameState.questionTimer);
      gameState.isActive = true;
      gameState.currentQuestion = null;
      io.of('/players').emit('server:game_started');
      io.of('/projection').emit('server:game_started');
    });

    socket.on('admin:end_game', async () => {
        if (!gameState.isActive) return;
        if (gameState.questionTimer) clearTimeout(gameState.questionTimer);
        gameState.isActive = false;
        const finalRanking = await getRanking();
        io.of('/players').emit('server:game_over', { finalRanking });
        io.of('/projection').emit('server:game_over', { finalRanking });
    });

    socket.on('admin:next_question', (question) => {
        if (!gameState.isActive) return;
        if (gameState.questionTimer) clearTimeout(gameState.questionTimer);

        gameState.currentQuestion = question;
        io.of('/players').emit('server:new_question', question);
        io.of('/projection').emit('server:new_question', question);
        console.log(`[PREGUNTA] Enviada: ${question.question_text}`);

        const timeLimit = (parseInt(question.time_limit_secs) || 15) * 1000;
        gameState.questionTimer = setTimeout(() => {
            console.log(`[TIEMPO] Fin del tiempo para la pregunta ${question.id}.`);
            
            io.of('/players').emit('server:time_up');
            io.of('/projection').emit('server:reveal_answer', { correctOption: question.correct_option });

            setTimeout(() => {
                if (gameState.currentQuestion && gameState.currentQuestion.id === question.id) {
                    console.log(`[GRACIA] Limpiando pregunta actual (ID: ${question.id}).`);
                    gameState.currentQuestion = null;
                }
            }, 3000); // 3 segundos de gracia
        }, timeLimit);
    });
  });
  
  // ... (El resto de las funciones auxiliares se quedan igual)
}
module.exports = { initSocket };
