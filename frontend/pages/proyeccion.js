import { useEffect, useState, useRef } from 'react';
import { getSocket } from '../lib/socket'; // Usamos nuestro gestor de socket

// Estilos para la página (puedes moverlos a un archivo .css)
const styles = {
  container: {
    width: '100vw',
    height: '100vh',
    backgroundColor: 'black',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Arial, sans-serif',
    textAlign: 'center',
  },
  video: {
    width: '80%',
    maxHeight: '60vh',
    border: '4px solid white',
    borderRadius: '10px'
  },
  questionText: {
    fontSize: '3em',
    margin: '20px 0',
  },
  optionsContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    width: '80%',
  },
  option: {
    backgroundColor: '#333',
    padding: '20px',
    borderRadius: '10px',
    fontSize: '1.8em',
    border: '2px solid #555',
  },
  correctOption: {
    backgroundColor: 'green',
    border: '4px solid lightgreen',
    transform: 'scale(1.05)',
    transition: 'all 0.3s ease',
  }
};

export default function ProjectionPage() {
  const [gameState, setGameState] = useState('waiting'); // waiting, showing_question, revealing_answer
  const [question, setQuestion] = useState(null);
  const [revealedAnswer, setRevealedAnswer] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();

    const handleNewQuestion = (newQuestion) => {
      console.log('Proyección: Nueva pregunta recibida', newQuestion);
      setQuestion(newQuestion);
      setRevealedAnswer(null); // Limpiamos la respuesta anterior
      setGameState('showing_question');
      
      const video = videoRef.current;
      if (video) {
        video.src = newQuestion.video_url;
        video.load();
        video.onloadeddata = () => video.play();
      }
    };

    const handleRevealAnswer = ({ correctOption }) => {
      console.log('Proyección: Revelando respuesta', correctOption);
      setRevealedAnswer(correctOption);
      if (videoRef.current) {
        videoRef.current.play(); // Continuamos el video para mostrar el resultado
      }
    };

    const handleGameOver = () => {
      setGameState('waiting');
      setQuestion(null);
    }
    
    socket.on('server:new_question', handleNewQuestion);
    socket.on('server:reveal_answer', handleRevealAnswer);
    socket.on('server:game_over', handleGameOver);
    socket.on('server:game_started', handleGameOver); // También resetea al iniciar

    return () => {
      socket.off('server:new_question', handleNewQuestion);
      socket.off('server:reveal_answer', handleRevealAnswer);
      socket.off('server:game_over', handleGameOver);
      socket.off('server:game_started', handleGameOver);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !question) return;

    const pauseAtTime = () => {
      if (video.currentTime >= question.pause_timestamp_secs) {
        video.pause();
      }
    };
    
    video.addEventListener('timeupdate', pauseAtTime);
    return () => video.removeEventListener('timeupdate', pauseAtTime);
  }, [question]);

  const renderContent = () => {
    if (gameState === 'showing_question' && question) {
      const options = [question.option_1, question.option_2, question.option_3, question.option_4];
      return (
        <>
          <video ref={videoRef} style={styles.video} controls>Tu navegador no soporta videos.</video>
          <h1 style={styles.questionText}>{question.question_text}</h1>
          <div style={styles.optionsContainer}>
            {options.map((text, index) => {
              const optionNumber = index + 1;
              const isCorrect = revealedAnswer === optionNumber;
              return (
                <div key={optionNumber} style={{...styles.option, ...(isCorrect && styles.correctOption)}}>
                  {text}
                </div>
              );
            })}
          </div>
        </>
      );
    }
    
    // Estado por defecto o de espera
    return <h1>TRIVIA GAME - Esperando que el administrador inicie el juego...</h1>;
  };

  return <div style={styles.container}>{renderContent()}</div>;
}
