import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import io from 'socket.io-client';
import Timer from '../components/Timer';
import AnswerOptions from '../components/AnswerOptions';

let socket;

export default function GamePage() {
  const router = useRouter();
  // Añadimos el nuevo estado 'game_over'
  const [gameState, setGameState] = useState('waiting_for_start'); 
  const [question, setQuestion] = useState(null);
  const [error, setError] = useState('');
  const [playerName, setPlayerName] = useState('');
  
  // Nuevos estados para guardar nuestro ID y puntaje final
  const [socketId, setSocketId] = useState(null);
  const [finalScore, setFinalScore] = useState(0);

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
        // Al conectar, guardamos nuestro propio ID de socket. Es nuestra identificación.
        setSocketId(socket.id);
        socket.emit('player:join', { name });
    });

    // --- MANEJADORES DE EVENTOS DEL SERVIDOR ---
    socket.on('server:game_started', () => {
      setQuestion(null);
      setError('');
      setGameState('playing');
    });

    socket.on('server:new_question', (newQuestion) => {
      setQuestion(newQuestion);
      setGameState('question');
    });
    
    // --- LÓGICA MODIFICADA PARA EL FIN DEL JUEGO ---
    socket.on('server:game_over', ({ finalRanking }) => {
        console.log("Juego terminado, mostrando puntaje final.");
        
        // Buscamos nuestro propio puntaje en el ranking que nos envió el servidor
        const myResult = finalRanking.find(player => player.id === socket.id);
        if (myResult) {
            setFinalScore(myResult.score);
        } else {
            setFinalScore(0); // Si por alguna razón no nos encontramos, mostramos 0
        }
        
        // Cambiamos al nuevo estado 'game_over' en lugar de redirigir
        setGameState('game_over');
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

  // Función para renderizar el contenido según el estado del juego
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
        return <h2>¡Bienvenido, {playerName}! Esperando que el administrador inicie el juego...</h2>;
      
      // --- NUEVA VISTA PARA MOSTRAR EL PUNTAJE FINAL ---
      case 'game_over':
        return (
            <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: '3em' }}>¡Juego Terminado!</h1>
                <h2 style={{ fontSize: '2em', margin: '20px 0' }}>
                    Tu puntaje final es: <span style={{ color: '#007bff', fontSize: '1.5em' }}>{finalScore}</span>
                </h2>
                <button 
                    onClick={() => router.push('/ranking')}
                    style={{ padding: '15px 30px', fontSize: '1.2rem', cursor: 'pointer', border: 'none', borderRadius: '8px', backgroundColor: 'green', color: 'white' }}
                >
                    Ver Ranking Completo
                </button>
            </div>
        );
      default:
        return <h2>Cargando...</h2>;
    }
  }

  return <div>{renderContent()}</div>;
}
