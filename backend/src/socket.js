const { Server } = require('socket.io');
const db = require('./config/db');

let gameState = {
  isActive: false,
  currentQuestion: null,
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
        await db.query(
          'INSERT INTO players (name, socket_id, score) VALUES ($1, $2, 0) ON CONFLICT (socket_id) DO UPDATE SET name = $1, score = 0', 
          [name, socket.id]
        );
        console.log(`[>] Jugador ${name} (${socket.id}) guardado/actualizado.`);
        broadcastRanking();
      } catch (err) { console.error("Error al unir jugador:", err); }
    });

    socket.on('player:submit_answer', async ({ questionId, answerId }) => {
      if (!gameState.isActive || !gameState.currentQuestion || gameState.currentQuestion.id != questionId) return;

      const player = await getPlayerBySocketId(socket.id);
      const question = gameState.currentQuestion;
      
      if (player && question) {
        // --- ESTA ES LA CORRECCIÓN CLAVE ---
        // Convertimos ambas partes a número con parseInt() antes de comparar
        // para evitar errores de tipo (ej. comparar el número 1 con el texto '1').
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
      }
    });

    socket.on('ranking:get', () => { broadcastRanking(socket); });

    socket.on('disconnect', async () => {
      try {
        await db.query('DELETE FROM players WHERE socket_id = $1', [socket.id]);
        console.log(`[-] Jugador desconectado: ${socket.id} eliminado.`);
        broadcastRanking();
      } catch (err) { console.error("Error al eliminar jugador:", err); }
    });
  });

  admin_nsp.on('connection', (socket) => {
    socket.on('admin:start_game', async () => {
      console.log('--- JUEGO INICIADO ---');
      try {
        await db.query('TRUNCATE TABLE players RESTART IDENTITY;');
        gameState.isActive = true;
        gameState.currentQuestion = null;
        
        const namespaces = [players_nsp, projection_nsp];
        namespaces.forEach(nsp => nsp.emit('server:game_started'));
        broadcastRanking();
      } catch (err) { console.error("Error al iniciar juego:", err); }
    });

    socket.on('admin:end_game', async () => {
        if (!gameState.isActive) return;
        console.log('--- JUEGO FINALIZADO ---');
        gameState.isActive = false;
        const finalRanking = await getRanking();
        
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

  async function getPlayerBySocketId(socketId) {
      const { rows } = await db.query('SELECT * FROM players WHERE socket_id = $1', [socketId]);
      return rows[0];
  }

  async function getRanking() {
    try {
      const { rows } = await db.query('SELECT id, name, score FROM players ORDER BY score DESC, name ASC LIMIT 10');
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

  console.log('Socket.IO del Servidor inicializado con lógica de puntaje corregida.');
  return io;
}

module.exports = { initSocket };
