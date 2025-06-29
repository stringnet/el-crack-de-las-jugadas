import io from 'socket.io-client';

let socket;

export const getAdminSocket = () => {
  if (!socket) {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (backendUrl) {
      // La única diferencia es que se conecta al namespace '/admin'
      socket = io(`${backendUrl}/admin`);
      console.log('Socket del admin inicializado por primera vez.');
    } else {
      console.error("NEXT_PUBLIC_BACKEND_URL no está definida.");
      return { on: () => {}, emit: () => {} };
    }
  }
  return socket;
};
