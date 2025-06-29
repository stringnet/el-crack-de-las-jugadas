import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getSocket } from '../lib/socket'; // Importamos el gestor de socket
import Timer from '../components/Timer';
import AnswerOptions from '../components/AnswerOptions';

export default function GamePage() {
  const router = useRouter();
  const [gameState, setGameState] = useState('waiting_for_start');
  const [question, setQuestion] = useState(null);
  const [finalScore, setFinalScore] = useState(null);
  const [error, setError] = useState('');
  const [playerName, setPlayerName] = useState('');

  useEffect(() => {
    const name = sessionStorage.getItem('playerName');
    if (!name) {
      router.push('/');
      return;
    }
    setPlayerName(name);

    const socket = getSocket();

    // Nos aseguramos de emitir el 'join' solo si el socket está conectado
    if (socket.connected) {
      socket.emit('player:join', { name });
    } else {
      socket.on('connect', () => {
        socket.emit('player:join', { name });
      });
    }

    // --- MANEJADORES DE EVENTOS DEL SERVIDOR ---

    // ESTE ES EL BLOQUE QUE FALTABA Y HEMOS VUELTO A AÑADIR
    const handleGameStarted = () => {
      console.log("Evento 'game_started' recibido en la página del juego. Actualizando estado.");
      setQuestion(null);
      setFinalScore(null);
      setError('');
      setGameState('playing'); // Cambiamos el estado para mostrar el mensaje correcto
    };
    socket.on('server:game_started', handleGameStarted);
    // ----------------------------------------------------

    const handleNewQuestion = (q) => {
      setQuestion(q);
      setGameState('question');
    };
    socket.on('server:new_question', handleNewQuestion);

    const handleGameOver = ({ finalRanking }) => {
      const myResult = finalRanking.find(p => p.id === socket.id);
      setFinalScore(myResult ? myResult.score : 0);
      setGameState('game_over');
    };
    socket.on('server:game_over', handleGameOver);
    
    const handleError = (data) => {
      setError(data.message);
    };
    socket.on('server:error', handleError);

    // Función de limpieza para desregistrar los listeners y evitar fugas de memoria
    return () => {
      socket.off('server:game_started', handleGameStarted);
      socket.off('server:new_question', handleNewQuestion);
      socket.off('server:game_over', handleGameOver);
      socket.off('server:error', handleError);
    };
  }, [router]);

  const handleSelectAnswer = (answerIndex) => {
    const socket = getSocket();
    socket.emit('player:submit_answer', { questionId: question.id, answerId: answerIndex });
    setGameState('answered');
  };

  const renderContent = () => {
    if (error) return <h2 style={{ color: 'red' }}>Error: {error}</h2>;

    switch(gameState) {
      case 'question':
        return (
          <>
            <Timer duration={question.time_limit_secs || 15} onTimeUp={() => { setQuestion(null); setGameState('playing'); }} />
            <h2>{question.question_text}</h2>
            <AnswerOptions question={question} onSelectAnswer={handleSelectAnswer} />
          </>
        );
      case 'answered':
        return <h2>¡Respuesta enviada! Esperando la siguiente jugada...</h2>;
      case 'playing':
        return <h2>¡Juego en curso! Esperando que el admin envíe la siguiente pregunta...</h2>;
      case 'game_over':
        return (
            <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: '3em' }}>¡Juego Terminado!</h1>
                <h2 style={{ fontSize: '2em', margin: '20px 0' }}>
                    Tu puntaje final es: <span style={{ color: '#007bff', fontSize: '1.5em' }}>{finalScore}</span>
                </h2>
                <button onClick={() => router.push('/ranking')} style={{ padding: '15px 30px', fontSize: '1.2rem', cursor: 'pointer' }}>
                    Ver Ranking Completo
                </button>
            </div>
        );
      case 'waiting_for_start':
      default:
        return <h2>¡Bienvenido, {playerName}! Esperando que el administrador inicie el juego...</h2>;
    }
  }

  return <div>{renderContent()}</div>;
}
