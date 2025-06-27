// pages/juego.js
import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import Timer from '../components/Timer';
import AnswerOptions from '../components/AnswerOptions';

const socket = io(`${process.env.NEXT_PUBLIC_BACKEND_URL}/players`);

export default function GamePage() {
  const [gameState, setGameState] = useState('waiting'); // waiting, question, answered
  const [question, setQuestion] = useState(null);

  useEffect(() => {
    const name = sessionStorage.getItem('playerName');
    if (name) {
      socket.emit('player:join', { name });
    }

    socket.on('server:new_question', (newQuestion) => {
      setQuestion(newQuestion);
      setGameState('question');
    });

    socket.on('server:time_up', () => {
        setGameState('waiting');
        setQuestion(null);
    });

    return () => {
      socket.off('server:new_question');
      socket.off('server:time_up');
    };
  }, []);
  
  const handleSelectAnswer = (answerIndex) => {
    socket.emit('player:submit_answer', { questionId: question.id, answerId: answerIndex });
    setGameState('answered');
  };

  const renderContent = () => {
    switch(gameState) {
      case 'question':
        return (
          <>
            <Timer duration={10} onTimeUp={() => setGameState('waiting')} />
            <h2>{question.question_text}</h2>
            <AnswerOptions question={question} onSelectAnswer={handleSelectAnswer} />
          </>
        );
      case 'answered':
        return <h2>¡Respuesta enviada! Esperando la siguiente jugada...</h2>;
      case 'waiting':
      default:
        return <h2>Esperando que el administrador envíe la siguiente jugada...</h2>;
    }
  }

  return <div>{renderContent()}</div>;
}
