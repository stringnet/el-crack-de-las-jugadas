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
      console.log(`[-] Jugador desconectado: ${socket.id}`);
      try {
        await db.query('UPDATE players SET socket_id = NULL WHERE socket_id = $1', [socket.id]);
      } catch(err) { console.error("Error al limpiar socket_id en desconexión:", err); }
    });
  });

  admin_nsp.on('connection', (socket) => {
    socket.on('admin:start_game', async () => {
      console.log('--- JUEGO INICIADO ---');
      try {
        if (gameState.questionTimer) clearTimeout(gameState.questionTimer);
        // Descomenta la siguiente línea si quieres que el ranking histórico se borre al iniciar un nuevo juego
        // await db.query('TRUNCATE TABLE players RESTART IDENTITY;');
        gameState.isActive = true;
        gameState.currentQuestion = null;
        
        const namespaces = [players_nsp, projection_nsp];
        namespaces.forEach(nsp => nsp.emit('server:game_started'));
      } catch (err) { console.error("Error al iniciar juego:", err); }
    });

    socket.on('admin:end_game', async () => {
        if (!gameState.isActive) return;
        console.log('--- JUEGO FINALIZADO ---');
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

        // --- LÓGICA DEL TEMPORIZADOR Y REVELACIÓN ---
        const timeLimit = (parseInt(question.time_limit_secs) || 15) * 1000;
        gameState.questionTimer = setTimeout(() => {
            console.log(`[TIEMPO] Fin del tiempo para la pregunta ${question.id}. Revelando respuesta.`);
            
            // Avisamos a los jugadores que el tiempo se acabó
            players_nsp.emit('server:time_up');

            // Enviamos la revelación a la pantalla de proyección
            projection_nsp.emit('server:reveal_answer', { 
                correctOption: question.correct_option 
            });

            gameState.currentQuestion = null;
        }, timeLimit);
    });
  });

  async function getPlayerByName(name) {
    try {
        const { rows } = await db.query('SELECT * FROM players WHERE name = $1 LIMIT 1', [name]);
        return rows[0];
    } catch (err) { console.error(err); return null; }
  }

  async function getPlayerBySocketId(socketId) {
    try {
        const { rows } = await db.query('SELECT * FROM players WHERE socket_id = $1 LIMIT 1', [socketId]);
        return rows[0];
    } catch (err) { console.error(err); return null; }
  }

  async function getRanking() {
    try {
      const { rows } = await db.query('SELECT id, name, score, socket_id FROM players ORDER BY score DESC, name ASC LIMIT 10');
      return rows;
    } catch (err) {
      console.error("Error al obtener ranking:", err);
      return [];
    }
  }

  async function broadcastRanking(targetSocket = null) {
    const ranking = await getRanking();
    const target = targetSocket || players_nsp;
    target.emit('server:update_ranking', ranking);
  }

  console.log('Socket.IO del Servidor inicializado con toda la lógica final.');
  return io;
}

module.exports = { initSocket };
