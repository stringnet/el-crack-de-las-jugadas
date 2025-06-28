const { Server } = require('socket.io');

// Estado del juego en memoria del servidor
let gameState = {
  isActive: false,
  players: {}, // Objeto para almacenar jugadores por socket.id
};

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

  // --- Lógica para Jugadores ---
  players_nsp.on('connection', (socket) => {
    console.log(`Jugador conectado: ${socket.id}`);
    
    socket.on('player:join', ({ name }) => {
      // CORRECCIÓN: Ahora los jugadores pueden unirse en cualquier momento.
      // Si se unen a un juego activo, su puntaje empieza en 0.
      gameState.players[socket.id] = { id: socket.id, name, score: 0 };
      console.log(`Jugador ${name} (${socket.id}) se ha unido.`);
      broadcastRanking(); // Emitimos el ranking actualizado
    });

    socket.on('player:submit_answer', ({ questionId, answerId }) => {
      // Solo procesamos respuestas si el juego está activo
      if (!gameState.isActive) return;

      // Lógica futura para verificar respuesta y actualizar puntaje:
      // const player = gameState.players[socket.id];
      // if (player && esRespuestaCorrecta(questionId, answerId)) {
      //   player.score += 10;
      //   broadcastRanking();
      // }
      console.log(`Respuesta recibida de ${socket.id}`);
    });

    socket.on('ranking:get', () => {
      broadcastRanking(socket); // Enviamos el ranking solo a quien lo pide
    });

    socket.on('disconnect', () => {
      console.log(`Jugador desconectado: ${socket.id}`);
      delete gameState.players[socket.id];
      broadcastRanking(); // Actualizamos el ranking para todos
    });
  });

  // --- Lógica para el Administrador ---
  admin_nsp.on('connection', (socket) => {
    console.log(`Admin conectado: ${socket.id}`);
    
    socket.on('admin:start_game', () => {
      console.log('--- JUEGO INICIADO (REINICIO) ---');
      // CORRECCIÓN: Reiniciamos el estado del juego completamente
      gameState.isActive = true;
      gameState.players = {}; // Borramos todos los jugadores y puntajes anteriores
      
      // Avisamos a todos los clientes que un nuevo juego ha comenzado
      // Esto hará que sus interfaces se reseteen
      players_nsp.emit('server:game_started');
      projection_nsp.emit('server:game_started');
      broadcastRanking(); // Enviamos un ranking vacío
      socket.emit('admin:feedback', { message: 'Nuevo juego iniciado. Jugadores reiniciados.' });
    });

    socket.on('admin:end_game', () => {
        if (!gameState.isActive) return; // No hacer nada si ya está finalizado
        console.log('--- JUEGO FINALIZADO (CORTE INMEDIATO) ---');
        gameState.isActive = false;
        
        const finalRanking = getRanking();
        
        // CORRECCIÓN: Enviamos la señal de corte a todos
        players_nsp.emit('server:game_over', { finalRanking });
        projection_nsp.emit('server:game_over', { finalRanking });
        socket.emit('admin:feedback', { message: 'Juego finalizado. Ranking enviado.' });
    });

    socket.on('admin:next_question', (question) => {
        if (!gameState.isActive) {
            socket.emit('admin:feedback', { message: 'Error: El juego no ha sido iniciado.' });
            return;
        }
        players_nsp.emit('server:new_question', question);
        projection_nsp.emit('server:new_question', question);
    });
  });

  // Función auxiliar para obtener y emitir el ranking
  function getRanking() {
      return Object.values(gameState.players).sort((a, b) => b.score - a.score).slice(0, 10);
  }

  function broadcastRanking(targetSocket = null) {
      const ranking = getRanking();
      if (targetSocket) {
          // Enviar solo a un socket
          targetSocket.emit('server:update_ranking', ranking);
      } else {
          // Enviar a todos los jugadores
          players_nsp.emit('server:update_ranking', ranking);
      }
  }

  console.log('Socket.IO inicializado con lógica de reinicio/corte.');
  return io;
}

module.exports = { initSocket };
