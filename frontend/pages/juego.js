import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getPlayerSocket } from '../lib/socket';
import Timer from '../components/Timer';
import AnswerOptions from '../components/AnswerOptions';

export default function GamePage() {
  const router = useRouter();
  const [gameState, setGameState] = useState('waiting_for_start');
  const [question, setQuestion] = useState(null);
  const [finalScore, setFinalScore] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const name = sessionStorage.getItem('playerName');
    if (!name) {
      router.push('/');
      return;
    }
    setPlayerName(name);

    const socket = getPlayerSocket();

    const handleConnect = () => socket.emit('player:join', { name });
    const handleGameStarted = () => { setQuestion(null); setFinalScore(null); setGameState('playing'); };
    const handleNewQuestion = (q) => { setQuestion(q); setGameState('question'); };
    const handleTimeUp = () => { setQuestion(null); setGameState('playing'); };
    const handleGameOver = ({ finalRanking }) => {
      const myResult = finalRanking.find(player => player.name === name);
      setFinalScore(myResult ? myResult.score : 0);
      setGameState('game_over');
    };
    const handleError = (data) => setError(data.message);

    if (socket.connected) {
      handleConnect();
    } else {
      socket.once('connect', handleConnect);
    }

    socket.on('server:game_started', handleGameStarted);
    socket.on('server:new_question', handleNewQuestion);
    socket.on('server:time_up', handleTimeUp);
    socket.on('server:game_over', handleGameOver);
    socket.on('server:error', handleError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('server:game_started', handleGameStarted);
      socket.off('server:new_question', handleNewQuestion);
      socket.off('server:time_up', handleTimeUp);
      socket.off('server:game_over', handleGameOver);
      socket.off('server:error', handleError);
    };
  }, [router]);

  const handleSelectAnswer = (answerIndex) => {
    const socket = getPlayerSocket();
    if (socket && socket.connected && question) {
      socket.emit('player:submit_answer', { questionId: question.id, answerId: answerIndex });
      setGameState('answered'); 
    }
  };

  const renderContent = () => {
    if (error) return <h2 style={{ color: 'red' }}>Error: {error}</h2>;

    switch(gameState) {
      case 'question':
        return (
          <>
            {/* --- TEMPORIZADOR RESTAURADO --- */}
            <Timer 
              duration={question.time_limit_secs || 15} 
              onTimeUp={() => { 
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
        return <h2>¡Atento! Esperando la siguiente pregunta...</h2>;
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
      default:
        return <h2>¡Bienvenido, {playerName}! Esperando que el administrador inicie el juego...</h2>;
    }
  };

  return <div>{renderContent()}</div>;
}
