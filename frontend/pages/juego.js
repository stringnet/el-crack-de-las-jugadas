import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import io from 'socket.io-client';
import Timer from '../components/Timer';
import AnswerOptions from '../components/AnswerOptions';

let socket;

export default function GamePage() {
  const router = useRouter();
  // Los estados posibles: 'waiting_for_start', 'playing', 'question', 'answered'
  const [gameState, setGameState] = useState('waiting_for_start');
  const [question, setQuestion] = useState(null);
  const [error, setError] = useState('');
  const [playerName, setPlayerName] = useState('');

  useEffect(() => {
    // Nos aseguramos de tener el nombre del jugador
    const name = sessionStorage.getItem('playerName');
    if (!name) {
      router.push('/'); // Si no hay nombre, lo mandamos a la página de inicio
      return;
    }
    setPlayerName(name);

    // Conectamos el socket
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    socket = io(`${backendUrl}/players`);
    
    // Al conectar, le decimos al backend que nos hemos unido
    socket.on('connect', () => {
        socket.emit('player:join', { name });
    });

    // --- MANEJADORES DE EVENTOS DEL SERVIDOR ---
    socket.on('server:game_started', () => {
      console.log("Evento 'game_started' recibido!");
      setError('');
      setGameState('playing');
    });

    socket.on('server:new_question', (newQuestion) => {
      console.log("Nueva pregunta recibida:", newQuestion.question_text);
      setQuestion(newQuestion);
      setGameState('question');
    });

    socket.on('server:time_up', () => {
        setGameState('playing');
        setQuestion(null);
    });
    
    socket.on('server:game_over', () => {
        alert("¡El juego ha terminado! Viendo el ranking final...");
        router.push('/ranking');
    });

    socket.on('server:error', (data) => {
        setError(data.message);
    });

    // Función de limpieza al desmontar el componente
    return () => {
      if (socket) socket.disconnect();
    };
  }, [router]);
  
  const handleSelectAnswer = (answerIndex) => {
    socket.emit('player:submit_answer', { questionId: question.id, answerId: answerIndex });
    setGameState('answered');
  };

  // Función para renderizar el contenido según el estado del juego
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
        return <h2>¡Juego en curso! Esperando que el admin envíe la siguiente pregunta...</h2>;
      case 'waiting_for_start':
      default:
        return <h2>¡Bienvenido, {playerName}! Esperando que el administrador inicie el juego...</h2>;
    }
  }

  return <div>{renderContent()}</div>;
}
