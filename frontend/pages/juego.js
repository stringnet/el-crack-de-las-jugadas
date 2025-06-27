import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io(`${process.env.NEXT_PUBLIC_BACKEND_URL}/players`);

export default function GamePage() {
  const [question, setQuestion] = useState(null);

  useEffect(() => {
    const name = sessionStorage.getItem('playerName');
    socket.emit('player:join', name);

    socket.on('server:new_question', (newQuestion) => {
      console.log('Nueva pregunta recibida:', newQuestion);
      setQuestion(newQuestion);
    });

    return () => {
      socket.off('server:new_question');
    };
  }, []);

  const handleAnswer = (option) => {
    socket.emit('player:submit_answer', { questionId: question.id, answer: option });
    setQuestion(null); // Bloquear respuestas hasta la siguiente pregunta
  };

  return (
    <div>
      <h1>¡A Jugar!</h1>
      {question ? (
        <div>
          <h2>{question.text}</h2>
          {/* Aquí iría el componente <AnswerOptions /> */}
          <button onClick={() => handleAnswer(1)}>{question.option1}</button>
          <button onClick={() => handleAnswer(2)}>{question.option2}</button>
          <button onClick={() => handleAnswer(3)}>{question.option3}</button>
          <button onClick={() => handleAnswer(4)}>{question.option4}</button>
        </div>
      ) : (
        <h2>Esperando la siguiente jugada...</h2>
      )}
    </div>
  );
}
