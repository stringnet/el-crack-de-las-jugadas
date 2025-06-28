import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import io from 'socket.io-client';
import Timer from '../components/Timer';
import AnswerOptions from '../components/AnswerOptions';

let socket;

export default function GamePage() {
  const router = useRouter();
  const [gameState, setGameState] = useState('waiting_for_start');
  const [question, setQuestion] = useState(null); // Estado para la pregunta actual
  const [error, setError] = useState('');
  const [playerName, setPlayerName] = useState('');

  useEffect(() => {
    const name = sessionStorage.getItem('playerName');
    if (!name) {
      router.push('/');
      return;
    }
    setPlayerName(name);

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    socket = io(`${backendUrl}/players`);
    
    socket.on('connect', () => {
        socket.emit('player:join', { name });
    });

    socket.on('server:game_started', () => {
      console.log("Evento 'game_started' recibido! Reseteando vista.");
      setError('');
      setQuestion(null); // CORRECCIÓN: Limpiamos cualquier pregunta anterior
      setGameState('playing');
    });

    socket.on('server:new_question', (newQuestion) => {
      setQuestion(newQuestion);
      setGameState('question');
    });
    
    socket.on('server:game_over', () => {
        alert("¡El juego ha terminado! Viendo el ranking final...");
        router.push('/ranking');
    });

    socket.on('server:error', (data) => {
        setError(data.message);
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [router]);
  
  const handleSelectAnswer = (answerIndex) => {
    socket.emit('player:submit_answer', { questionId: question.id, answerId: answerIndex });
    setGameState('answered');
  };

  const renderContent = () => {
    if (error) return <h2 style={{ color: 'red' }}>Error: {error}</h2>;

    switch(gameState) {
      case 'question':
        return (
          <>
            <Timer duration={10} onTimeUp={() => { setQuestion(null); setGameState('playing'); }} />
            <h2>{question.question_text}</h2>
            <AnswerOptions question={question} onSelectAnswer={handleSelectAnswer} />
          </>
        );
      case 'answered':
        return <h2>¡Respuesta enviada! Esperando la siguiente jugada...</h2>;
      case 'playing':
        return <h2>¡Juego en curso! Esperando que el admin envíe la siguiente pregunta...</h2>;
      case 'waiting_for_start':
      default:
        return <h2>¡Bienvenido, {playerName}! Esperando que el administrador inicie el juego...</h2>;
    }
  }

  return <div>{renderContent()}</div>;
}
