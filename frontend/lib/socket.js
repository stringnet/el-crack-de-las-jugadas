import io from 'socket.io-client';

let socket;

export const getSocket = () => {
  if (!socket) {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (backendUrl) {
      socket = io(`${backendUrl}/players`);
      console.log('Socket inicializado por primera vez.');
    } else {
        // Devuelve un objeto falso si la URL no está definida para evitar errores
        return { on: () => {}, emit: () => {}, disconnect: () => {} };
    }
  }
  return socket;
};
