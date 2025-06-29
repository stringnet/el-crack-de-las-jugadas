import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getSocket } from '../lib/socket'; // <-- Importamos desde nuestro gestor
import Timer from '../components/Timer';
import AnswerOptions from '../components/AnswerOptions';

// Ya no definimos 'socket' aquí

export default function GamePage() {
  const router = useRouter();
  const [gameState, setGameState] = useState('waiting_for_start'); 
  const [question, setQuestion] = useState(null);
  const [finalScore, setFinalScore] = useState(0);
  const [playerName, setPlayerName] = useState('');

  useEffect(() => {
    const name = sessionStorage.getItem('playerName');
    if (!name) {
      router.push('/');
      return;
    }
    setPlayerName(name);

    const socket = getSocket(); // Obtenemos la instancia global

    socket.emit('player:join', { name });

    // Los listeners específicos de esta página
    const handleNewQuestion = (q) => { setQuestion(q); setGameState('question'); };
    const handleGameOver = ({ finalRanking }) => {
      const myResult = finalRanking.find(p => p.id === socket.id);
      setFinalScore(myResult ? myResult.score : 0);
      setGameState('game_over');
    };
    
    socket.on('server:new_question', handleNewQuestion);
    socket.on('server:game_over', handleGameOver);

    // Función de limpieza
    return () => {
      socket.off('server:new_question', handleNewQuestion);
      socket.off('server:game_over', handleGameOver);
    };
  }, [router]);

  // ... (El resto del código de la página juego.js, como handleSelectAnswer y renderContent, se queda exactamente igual) ...
  // ... (Omitido por brevedad, usa el que ya tenías de la respuesta anterior) ...
}
