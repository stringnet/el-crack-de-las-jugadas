// pages/ranking.js
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io(`${process.env.NEXT_PUBLIC_BACKEND_URL}/players`); // O un namespace dedicado

export default function RankingPage() {
  const [ranking, setRanking] = useState([]);

  useEffect(() => {
    socket.on('server:update_ranking', (newRanking) => {
      setRanking(newRanking);
    });

    // Pedir el ranking inicial al conectar
    socket.emit('ranking:get');

    return () => socket.off('server:update_ranking');
  }, []);

  return (
    <div style={{ width: '80%', maxWidth: '800px' }}>
      <h1 style={{ backgroundColor: 'white', padding: '10px 20px', borderRadius: '20px', color: 'black' }}>Ranking de Jugadores</h1>
      <table style={{ width: '100%', marginTop: '20px', fontSize: '1.5em', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ color: '#333' }}>
            <th style={{ padding: '10px', textAlign: 'left' }}>Pos.</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Nombre</th>
            <th style={{ padding: '10px', textAlign: 'right' }}>Puntaje</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((player, index) => (
            <tr key={player.id} style={{ borderTop: '2px solid rgba(0,0,0,0.1)' }}>
              <td style={{ padding: '10px', fontWeight: 'bold' }}>{index + 1}</td>
              <td style={{ padding: '10px' }}>{player.name}</td>
              <td style={{ padding: '10px', textAlign: 'right' }}>{player.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
