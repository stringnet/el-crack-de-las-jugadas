import { useEffect, useState } from 'react';
import io from 'socket.io-client';

let socket;

export default function RankingPage() {
  const [ranking, setRanking] = useState([]);

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    socket = io(`${backendUrl}/players`);

    // Escuchamos el evento que actualiza el ranking
    socket.on('server:update_ranking', (newRanking) => {
      console.log("Ranking actualizado recibido:", newRanking);
      setRanking(newRanking);
    });

    // Al entrar a la página, pedimos el ranking actual una vez
    socket.on('connect', () => {
        socket.emit('ranking:get');
    });

    // Función de limpieza
    return () => {
        if(socket) socket.disconnect();
    };
  }, []);

  return (
    <div style={{ width: '80%', maxWidth: '800px', backgroundColor: '#FFFF00', padding: '20px', borderRadius: '15px' }}>
      <h1 style={{ backgroundColor: 'white', padding: '10px 20px', borderRadius: '30px', color: 'black', display: 'inline-block' }}>Ranking</h1>
      <table style={{ width: '100%', marginTop: '20px', fontSize: '1.5em', borderCollapse: 'collapse', color: 'black' }}>
        <thead>
          <tr>
            <th style={{ padding: '10px', textAlign: 'left' }}>Pos.</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Nombre</th>
            <th style={{ padding: '10px', textAlign: 'right' }}>Puntaje</th>
          </tr>
        </thead>
        <tbody>
          {ranking.length > 0 ? (
            ranking.map((player, index) => (
              <tr key={player.id} style={{ borderTop: '2px solid rgba(0,0,0,0.1)' }}>
                <td style={{ padding: '10px', fontWeight: 'bold' }}>{index + 1}</td>
                <td style={{ padding: '10px' }}>{player.name}</td>
                <td style={{ padding: '10px', textAlign: 'right' }}>{player.score}</td>
              </tr>
            ))
          ) : (
            <tr>
                <td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>Aún no hay jugadores en el ranking.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
