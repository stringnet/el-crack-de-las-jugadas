import { useEffect, useState } from 'react';
import { getPlayerSocket } from '../lib/socket';

export default function RankingPage() {
  const [ranking, setRanking] = useState([]); // Inicia como un array vacío

  useEffect(() => {
    const socket = getPlayerSocket();

    const handleUpdateRanking = (newRanking) => {
      // Añadimos un log para ver qué datos llegan en la consola del navegador
      console.log("Datos de ranking recibidos del servidor:", newRanking);
      
      // Nos aseguramos de que lo que recibimos es un array antes de actualizar
      if (Array.isArray(newRanking)) {
        setRanking(newRanking);
      }
    };

    // Nos suscribimos al evento que actualiza el ranking en tiempo real
    socket.on('server:update_ranking', handleUpdateRanking);
    
    // Al entrar a la página, pedimos el ranking actual una vez
    // Nos aseguramos de que el socket esté conectado antes de pedir
    if (socket.connected) {
        socket.emit('ranking:get');
    } else {
        // Si no, esperamos al evento 'connect' para pedirlo
        socket.once('connect', () => {
            socket.emit('ranking:get');
        });
    }

    // Función de limpieza para evitar fugas de memoria
    return () => {
      socket.off('server:update_ranking', handleUpdateRanking);
    };
  }, []); // El array vacío asegura que este efecto se ejecute solo una vez

  return (
    <div style={{ width: '80%', maxWidth: '800px', backgroundColor: '#FFFF00', padding: '20px', borderRadius: '15px', border: '3px solid black' }}>
      <h1 style={{ backgroundColor: 'white', padding: '10px 20px', borderRadius: '30px', color: 'black', display: 'inline-block', border: '3px solid black' }}>Ranking</h1>
      <table style={{ width: '100%', marginTop: '20px', fontSize: '1.5em', borderCollapse: 'collapse', color: 'black' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid black' }}>
            <th style={{ padding: '10px', textAlign: 'left' }}>Pos.</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Nombre</th>
            <th style={{ padding: '10px', textAlign: 'right' }}>Puntaje</th>
          </tr>
        </thead>
        <tbody>
          {ranking.length > 0 ? (
            ranking.map((player, index) => (
              <tr key={player.id} style={{ borderTop: '1px solid #ccc' }}>
                <td style={{ padding: '10px', fontWeight: 'bold' }}>{index + 1}</td>
                <td style={{ padding: '10px' }}>{player.name}</td>
                <td style={{ padding: '10px', textAlign: 'right' }}>{player.score}</td>
              </tr>
            ))
          ) : (
            // Mensaje que se muestra si no hay jugadores en el ranking
            <tr>
                <td colSpan="3" style={{ textAlign: 'center', padding: '20px', fontStyle: 'italic' }}>El ranking está vacío o cargando...</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
