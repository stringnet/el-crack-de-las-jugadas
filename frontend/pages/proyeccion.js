import { useEffect, useState, useRef } from 'react';
import { getSocket } from '../lib/socket';

const styles = {
  container: { position: 'relative', width: '100vw', height: '100vh', backgroundColor: 'black', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif', textAlign: 'center' },
  video: { width: '80%', maxHeight: '60vh', border: '4px solid white', borderRadius: '10px', backgroundColor: '#111' },
  questionText: { fontSize: '3em', margin: '20px 0', textShadow: '2px 2px 4px #000' },
  optionsContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', width: '80%' },
  option: { backgroundColor: '#333', padding: '20px', borderRadius: '10px', fontSize: '1.8em', border: '2px solid #555', transition: 'all 0.3s ease' },
  correctOption: { backgroundColor: 'green', borderColor: 'lightgreen', transform: 'scale(1.05)' }
};

export default function ProjectionPage() {
  const [question, setQuestion] = useState(null);
  const [revealedAnswer, setRevealedAnswer] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();

    const handleNewQuestion = (newQuestion) => {
      setRevealedAnswer(null);
      setQuestion(newQuestion);
    };
    const handleRevealAnswer = ({ correctOption }) => {
      setRevealedAnswer(correctOption);
    };
    const resetScreen = () => {
      setQuestion(null);
      setRevealedAnswer(null);
    }
    
    socket.on('server:new_question', handleNewQuestion);
    socket.on('server:reveal_answer', handleRevealAnswer);
    socket.on('server:game_over', resetScreen);
    socket.on('server:game_started', resetScreen);

    return () => {
      socket.off('server:new_question', handleNewQuestion);
      socket.off('server:reveal_answer', handleRevealAnswer);
      socket.off('server:game_over', resetScreen);
      socket.off('server:game_started', resetScreen);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !question) return;

    video.src = question.video_url;
    video.load();
    video.play().catch(error => console.error("Error de Autoplay inicial:", error.message));

    const pauseAtTime = () => {
      if (video.currentTime >= question.pause_timestamp_secs) {
        video.pause();
        console.log(`[PROYECCIÓN] Video pausado en ${video.currentTime}s`);
        // --- CORRECCIÓN CLAVE ---
        // Una vez que pausamos, quitamos el 'listener' para que no vuelva a pausar el video
        // cuando intentemos reanudarlo más tarde.
        video.removeEventListener('timeupdate', pauseAtTime); 
      }
    };
    
    video.addEventListener('timeupdate', pauseAtTime);

    return () => {
      // Limpieza por si el componente se desmonta antes de tiempo
      video.removeEventListener('timeupdate', pauseAtTime);
    };
  }, [question]);

  useEffect(() => {
    // Este efecto se activa SOLO cuando 'revealedAnswer' cambia
    if (revealedAnswer && videoRef.current) {
      console.log('[PROYECCIÓN] Revelando respuesta. Continuando video...');
      videoRef.current.play().catch(error => console.error("Error de Autoplay en revelación:", error.message));
    }
  }, [revealedAnswer]);

  if (question) {
    const options = [question.option_1, question.option_2, question.option_3, question.option_4];
    return (
      <div style={styles.container}>
        <video ref={videoRef} style={styles.video} muted playsInline>Tu navegador no soporta videos.</video>
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
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1>TRIVIA GAME</h1>
      <p style={{fontSize: '1.5em'}}>Esperando que el administrador inicie el juego...</p>
    </div>
  );
}
