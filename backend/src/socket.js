const { Server } = require('socket.io');
const db = require('./config/db'); // Importamos nuestra conexión a la DB

// El estado del juego ahora es más simple, solo controla si la partida está activa
// y cuál es la pregunta actual. Los jugadores se gestionan en la DB.
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

  // --- Lógica para Conexiones de Jugadores ---
  players_nsp.on('connection', (socket) => {
    console.log(`[+] Jugador conectado: ${socket.id}`);
    
    socket.on('player:join', async ({ name }) => {
      try {
        await db.query('INSERT INTO players (name, socket_id, score) VALUES ($1, $2, $3)', [name, socket.id, 0]);
        console.log(`[>] Jugador ${name} (${socket.id}) guardado en la DB.`);
        broadcastRanking();
      } catch (err) { console.error("Error al unir jugador:", err); }
    });

    socket.on('player:submit_answer', async ({ questionId, answerId }) => {
      if (!gameState.isActive || !gameState.currentQuestion || gameState.currentQuestion.id != questionId) return;

      if (gameState.currentQuestion.correct_option == answerId) {
        try {
          const points = gameState.currentQuestion.points || 10;
          await db.query('UPDATE players SET score = score + $1 WHERE socket_id = $2', [points, socket.id]);
          console.log(`[CORRECTO] +${points} puntos para socket ${socket.id}`);
          broadcastRanking();
        } catch (err) { console.error("Error al actualizar puntaje:", err); }
      }
    });

    socket.on('ranking:get', () => { broadcastRanking(socket); });

    socket.on('disconnect', async () => {
      try {
        await db.query('DELETE FROM players WHERE socket_id = $1', [socket.id]);
        console.log(`[-] Jugador desconectado: ${socket.id} eliminado de la DB.`);
        broadcastRanking();
      } catch (err) { console.error("Error al eliminar jugador:", err); }
    });
  });

  // --- Lógica para Conexiones del Administrador ---
  admin_nsp.on('connection', (socket) => {
    console.log(`[ADMIN] Admin conectado: ${socket.id}`);
    
    socket.on('admin:start_game', async () => {
      console.log('--- JUEGO INICIADO (REINICIO TOTAL CON DB) ---');
      try {
        // TRUNCATE es un comando rápido para borrar todas las filas de una tabla
        await db.query('TRUNCATE TABLE players RESTART IDENTITY;');
        console.log("Tabla de jugadores limpiada para nueva partida.");
        gameState.isActive = true;
        gameState.currentQuestion = null;
        
        const namespaces = [players_nsp, io.of('/projection')];
        namespaces.forEach(nsp => nsp.emit('server:game_started'));
        broadcastRanking();
      } catch (err) { console.error("Error al iniciar juego:", err); }
    });

    socket.on('admin:end_game', async () => {
        if (!gameState.isActive) return;
        console.log('--- JUEGO FINALIZADO ---');
        gameState.isActive = false;
        const finalRanking = await getRanking();
        
        const namespaces = [players_nsp, io.of('/projection')];
        namespaces.forEach(nsp => nsp.emit('server:game_over', { finalRanking }));
    });

    socket.on('admin:next_question', (question) => {
        if (!gameState.isActive) return;
        gameState.currentQuestion = question;
        const namespaces = [players_nsp, io.of('/projection')];
        namespaces.forEach(nsp => nsp.emit('server:new_question', question));
    });
  });

  // Las funciones de ranking ahora leen de la base de datos
  async function getRanking() {
    try {
      const { rows } = await db.query('SELECT name, score FROM players ORDER BY score DESC, name ASC LIMIT 10');
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

  console.log('Socket.IO del Servidor inicializado con Base de Datos Persistente.');
  return io;
}

module.exports = { initSocket };
