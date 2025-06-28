import { useEffect, useState } from 'react';
import { useRouter } from 'next/router'; // Importamos el router para redirigir
import io from 'socket.io-client';
import Timer from '../components/Timer';
import AnswerOptions from '../components/AnswerOptions';

let socket;

export default function GamePage() {
  const router = useRouter();
  const [gameState, setGameState] = useState('waiting_for_start'); // waiting_for_start, playing, question, answered
  const [question, setQuestion] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    socket = io(`${backendUrl}/players`);
    
    const name = sessionStorage.getItem('playerName');
    if (name) {
      socket.emit('player:join', { name });
    } else {
      router.push('/'); // Si no hay nombre, lo mandamos al inicio
    }

    socket.on('server:game_started', () => {
      setError('');
      setGameState('playing');
    });

    socket.on('server:new_question', (newQuestion) => {
      setQuestion(newQuestion);
      setGameState('question');
    });

    socket.on('server:time_up', () => {
        setGameState('playing'); // Vuelve al estado de "jugando, esperando pregunta"
        setQuestion(null);
    });
    
    socket.on('server:game_over', () => {
        alert("¡El juego ha terminado! Viendo el ranking final...");
        router.push('/ranking'); // Redirigimos a la página de ranking
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
    if (error) {
        return <h2 style={{ color: 'red' }}>Error: {error}</h2>;
    }

    switch(gameState) {
      case 'question':
        return (
          <>
            <Timer duration={10} onTimeUp={() => setGameState('playing')} />
            <h2>{question.question_text}</h2>
            <AnswerOptions question={question} onSelectAnswer={handleSelectAnswer} />
          </>
        );
      case 'answered':
        return <h2>¡Respuesta enviada! Esperando la siguiente jugada...</h2>;
      case 'playing':
        return <h2>Juego iniciado. Esperando que el administrador envíe la siguiente jugada...</h2>;
      case 'waiting_for_start':
      default:
        return <h2>Conectado. Esperando que el administrador inicie el juego...</h2>;
    }
  }

  return <div>{renderContent()}</div>;
}
