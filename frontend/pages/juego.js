import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getSocket } from '../lib/socket'; // Importamos nuestro gestor de socket
import Timer from '../components/Timer';
import AnswerOptions from '../components/AnswerOptions';

export default function GamePage() {
  const router = useRouter();
  // Estados para controlar la vista: 'waiting_for_start', 'playing', 'question', 'answered', 'game_over'
  const [gameState, setGameState] = useState('waiting_for_start');
  const [question, setQuestion] = useState(null);
  const [finalScore, setFinalScore] = useState(null);
  const [error, setError] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [socketId, setSocketId] = useState(null);

  useEffect(() => {
    // Obtenemos el nombre del jugador guardado en la sesión del navegador
    const name = sessionStorage.getItem('playerName');
    if (!name) {
      router.push('/'); // Si no hay nombre, lo mandamos a la página de inicio
      return;
    }
    setPlayerName(name);

    // Obtenemos la instancia única del socket
    const socket = getSocket();

    // --- Definimos los manejadores de eventos del socket ---

    const handleConnect = () => {
      console.log(`Conectado al servidor con ID: ${socket.id}`);
      setSocketId(socket.id); // Guardamos nuestro ID de socket
      socket.emit('player:join', { name });
    };

    const handleGameStarted = () => {
      console.log("Evento 'game_started' recibido. Reseteando vista.");
      setQuestion(null);
      setFinalScore(null);
      setError('');
      setGameState('playing');
    };

    const handleNewQuestion = (newQuestion) => {
      console.log("Nueva pregunta recibida:", newQuestion.question_text);
      setQuestion(newQuestion);
      setGameState('question');
    };

    const handleGameOver = ({ finalRanking }) => {
      console.log("Juego terminado, buscando mi puntaje...");
      // Buscamos nuestro puntaje usando el socket.id que guardamos
      const myResult = finalRanking.find(player => player.socket_id === socket.id);
      setFinalScore(myResult ? myResult.score : 0);
      setGameState('game_over');
    };

    const handleError = (data) => {
      setError(data.message);
    };

    // --- MEJORA DE SINCRONIZACIÓN ---
    // Esta función se activará cuando el servidor nos diga que el tiempo se acabó
    const handleTimeUpFromServer = () => {
      console.log("Tiempo finalizado (señal del servidor). Limpiando pregunta.");
      setQuestion(null);
      setGameState('playing');
    };
    
    // --- Nos suscribimos a los eventos del socket ---

    // Si ya estamos conectados, nos unimos. Si no, esperamos al evento 'connect'.
    if (socket.connected) {
      handleConnect();
    } else {
      socket.once('connect', handleConnect);
    }

    socket.on('server:game_started', handleGameStarted);
    socket.on('server:new_question', handleNewQuestion);
    socket.on('server:game_over', handleGameOver);
    socket.on('server:time_up', handleTimeUpFromServer); // <-- Listener para el nuevo evento
    socket.on('server:error', handleError);

    // Función de limpieza: se ejecuta cuando el usuario cambia de página.
    // Es crucial para evitar errores y fugas de memoria.
    return () => {
      socket.off('connect', handleConnect);
      socket.off('server:game_started', handleGameStarted);
      socket.off('server:new_question', handleNewQuestion);
      socket.off('server:game_over', handleGameOver);
      socket.off('server:time_up', handleTimeUpFromServer); // <-- Limpiamos el nuevo listener
      socket.off('server:error', handleError);
    };
  }, [router]);

  // Función que se llama cuando el jugador hace clic en una respuesta
  const handleSelectAnswer = (answerIndex) => {
    const socket = getSocket();
    socket.emit('player:submit_answer', { questionId: question.id, answerId: answerIndex });
    setGameState('answered');
  };

  // Esta función decide qué mostrar en pantalla según el estado del juego
  const renderContent = () => {
    if (error) return <h2 style={{ color: 'red' }}>Error: {error}</h2>;

    switch(gameState) {
      case 'question':
        return (
          <>
            <Timer 
              duration={question.time_limit_secs || 15} 
              onTimeUp={() => { 
                // Cuando el temporizador local termina, también limpiamos la vista
                setQuestion(null); 
                setGameState('playing'); 
              }} 
            />
            <h2>{question.question_text}</h2>
            <AnswerOptions question={question} onSelectAnswer={handleSelectAnswer} />
          </>
        );
      case 'answered':
        return <h2>¡Respuesta enviada! Esperando...</h2>;
      case 'playing':
        return <h2>¡Juego en curso! Esperando que el admin envíe la siguiente pregunta...</h2>;
      case 'game_over':
        return (
            <div style={{ textAlign: 'center', padding: '20px', border: '2px solid black', borderRadius: '15px' }}>
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
  };

  return <div>{renderContent()}</div>;
}
