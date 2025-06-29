const { Server } = require('socket.io');
const db = require('./config/db');

// El estado del juego ya no necesita la lista de jugadores, solo el estado de la partida.
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

  // --- LÓGICA DE JUGADORES CON DB PERSISTENTE ---
  players_nsp.on('connection', (socket) => {
    console.log(`[+] Jugador conectado: ${socket.id}`);
    
    socket.on('player:join', async ({ name }) => {
      try {
        // 1. Buscamos si el jugador ya existe por su nombre.
        const existingPlayer = await getPlayerByName(name);

        if (existingPlayer) {
          // 2a. Si existe, actualizamos su socket_id para esta nueva conexión.
          await db.query('UPDATE players SET socket_id = $1 WHERE id = $2', [socket.id, existingPlayer.id]);
          console.log(`[>] Jugador recurrente '${name}' ha vuelto.`);
        } else {
          // 2b. Si no existe, lo creamos en la base de datos.
          await db.query('INSERT INTO players (name, socket_id, score) VALUES ($1, $2, 0)', [name, socket.id]);
          console.log(`[>] Jugador nuevo '${name}' ha sido creado.`);
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
          // El puntaje ahora se acumula sobre el que ya tenía.
          await db.query('UPDATE players SET score = score + $1 WHERE id = $2', [points, player.id]);
          console.log(`[CORRECTO] +${points} puntos para ${player.name}.`);
          broadcastRanking();
        } catch (err) { console.error("Error al actualizar puntaje:", err); }
      }
    });

    socket.on('ranking:get', () => { broadcastRanking(socket); });

    socket.on('disconnect', async () => {
      console.log(`[-] Jugador desconectado: ${socket.id}`);
      // Ya no borramos al jugador. Su puntaje es histórico.
      // Opcionalmente, podríamos limpiar su socket_id para indicar que está offline.
      try {
        await db.query('UPDATE players SET socket_id = NULL WHERE socket_id = $1', [socket.id]);
      } catch(err) { console.error("Error al limpiar socket_id en desconexión:", err); }
    });
  });

  // --- LÓGICA DE ADMIN CON RANKING PERSISTENTE ---
  admin_nsp.on('connection', (socket) => {
    socket.on('admin:start_game', () => {
      console.log('--- JUEGO INICIADO ---');
      // YA NO BORRAMOS LA TABLA. Solo activamos el estado de la partida.
      // El ranking histórico se mantiene.
      gameState.isActive = true;
      gameState.currentQuestion = null;
      
      const namespaces = [players_nsp, projection_nsp];
      namespaces.forEach(nsp => nsp.emit('server:game_started'));
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

  // --- FUNCIONES AUXILIARES PARA LA DB ---
  async function getPlayerByName(name) {
    try {
        const { rows } = await db.query('SELECT * FROM players WHERE name = $1 LIMIT 1', [name]);
        return rows[0];
    } catch (err) { return null; }
  }

  async function getPlayerBySocketId(socketId) {
    try {
        const { rows } = await db.query('SELECT * FROM players WHERE socket_id = $1 LIMIT 1', [socketId]);
        return rows[0];
    } catch (err) { return null; }
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

  console.log('Socket.IO del Servidor inicializado con LÓGICA DE RANKING HISTÓRICO.');
  return io;
}

module.exports = { initSocket };
