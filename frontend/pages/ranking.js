import { useEffect, useState } from 'react';
import { getSocket } from '../lib/socket';

export default function RankingPage() {
  const [ranking, setRanking] = useState([]);

  useEffect(() => {
    const socket = getSocket();

    const handleUpdateRanking = (newRanking) => {
      console.log("Ranking actualizado en tiempo real:", newRanking);
      setRanking(newRanking);
    };

    // Nos suscribimos a las actualizaciones
    socket.on('server:update_ranking', handleUpdateRanking);
    
    // Y pedimos el estado actual del ranking al conectarnos
    socket.emit('ranking:get');

    // Función de limpieza
    return () => {
      socket.off('server:update_ranking', handleUpdateRanking);
    };
  }, []);

  return (
    <div style={{ width: '80%', maxWidth: '800px', backgroundColor: '#FFFF00', padding: '20px', borderRadius: '15px' }}>
        {/* ... El resto del código JSX para mostrar la tabla del ranking ... */}
        {/* El que te di en la respuesta anterior es el correcto. */}
    </div>
  );
}
