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
          console.log(`[>] Jugador recurrente '${name}' ha vuelto.`);
        } else {
          await db.query('INSERT INTO players (name, socket_id, score) VALUES ($1, $2, 0)', [name, socket.id]);
          console.log(`[>] Jugador nuevo '${name}' ha sido creado.`);
        }
        broadcastRanking();
      } catch (err) { console.error("Error al unir jugador:", err); }
    });

    // --- FUNCIÓN DE RESPUESTA ACTUALIZADA CON LOGS DE DEPURACIÓN ---
    socket.on('player:submit_answer', async ({ questionId, answerId }) => {
      console.log(`[SUBMIT] Recibida respuesta de ${socket.id} para pregunta ${questionId} con opción ${answerId}.`);
      
      if (!gameState.isActive) return console.log('[SUBMIT] IGNORADO: El juego no está activo.');
      if (!gameState.currentQuestion) return console.log('[SUBMIT] IGNORADO: No hay pregunta activa en el servidor (probablemente se acabó el tiempo).');
      if (gameState.currentQuestion.id != questionId) return console.log(`[SUBMIT] IGNORADO: El ID de la pregunta no coincide. Cliente:${questionId} vs Servidor:${gameState.currentQuestion.id}`);
      
      const player = await getPlayerBySocketId(socket.id);
      if (!player) return console.log(`[SUBMIT] IGNORADO: No se encontró un jugador para el socket ${socket.id}`);
      
      const question = gameState.currentQuestion;
      
      if (parseInt(question.correct_option) === parseInt(answerId)) {
        try {
          const points = parseInt(question.points) || 10;
          await db.query('UPDATE players SET score = score + $1 WHERE id = $2', [points, player.id]);
          console.log(`[CORRECTO] +${points} puntos para ${player.name}.`);
          broadcastRanking();
        } catch (err) { console.error("Error al actualizar puntaje:", err); }
      } else {
        console.log(`[INCORRECTO] La respuesta de ${player.name} no fue la correcta.`);
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
    socket.on('admin:start_game', () => { /* ...código sin cambios... */ });

    socket.on('admin:end_game', async () => { /* ...código sin cambios... */ });

    // --- FUNCIÓN DE ENVIAR PREGUNTA ACTUALIZADA CON PERIODO DE GRACIA ---
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

            // CORRECCIÓN DE LA CONDICIÓN DE CARRERA: Periodo de gracia
            setTimeout(() => {
                if (gameState.currentQuestion && gameState.currentQuestion.id === question.id) {
                    console.log(`[GRACIA] Limpiando pregunta actual (ID: ${question.id}) después del periodo de gracia.`);
                    gameState.currentQuestion = null;
                }
            }, 3000); // 3 segundos de gracia para que lleguen las respuestas

        }, timeLimit);
    });
  });

  async function getPlayerByName(name) { /* ...código sin cambios... */ }
  async function getPlayerBySocketId(socketId) { /* ...código sin cambios... */ }
  async function getRanking() { /* ...código sin cambios... */ }
  async function broadcastRanking(targetSocket = null) { /* ...código sin cambios... */ }

  console.log('Socket.IO del Servidor inicializado con lógica final y periodo de gracia.');
  return io;
}

module.exports = { initSocket };
