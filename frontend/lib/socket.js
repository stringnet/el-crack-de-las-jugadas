import io from 'socket.io-client';

let socket;

/**
 * Esta función crea una ÚNICA instancia de socket para toda la aplicación del frontend
 * y la reutiliza, evitando crear múltiples conexiones.
 */
export const getPlayerSocket = () => {
  // Si el socket aún no ha sido creado, lo creamos.
  if (!socket) {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    
    if (backendUrl) {
      // Creamos la conexión al namespace de los jugadores
      socket = io(`${backendUrl}/players`);
      console.log('Socket del cliente inicializado por primera vez.');
    } else {
        // En caso de que la URL no esté disponible, devolvemos un objeto falso
        // para que la aplicación no se rompa al intentar usar 'on' o 'emit'.
        console.error("NEXT_PUBLIC_BACKEND_URL no está definida. El socket no puede conectar.");
        return { on: () => {}, emit: () => {}, disconnect: () => {} };
    }
  }
  // Devolvemos la instancia ya creada.
  return socket;
};
