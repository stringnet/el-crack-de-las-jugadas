import { useEffect, useState, useRef } from 'react';
import { getSocket } from '../lib/socket';

const styles = {
  container: { position: 'relative', width: '100vw', height: '100vh', backgroundColor: 'black', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif', textAlign: 'center' },
  video: { width: '80%', maxHeight: '60vh', border: '4px solid white', borderRadius: '10px', backgroundColor: '#111' },
  questionText: { fontSize: '3em', margin: '20px 0', textShadow: '2px 2px 4px #000' },
  optionsContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', width: '80%' },
  option: { backgroundColor: '#333', padding: '20px', borderRadius: '10px', fontSize: '1.8em', border: '2px solid #555', transition: 'all 0.3s ease' },
  correctOption: { backgroundColor: 'green', borderColor: 'lightgreen', transform: 'scale(1.05)' },
  // --- Estilos para nuestro nuevo monitor de estado ---
  debugMonitor: { position: 'absolute', top: '10px', left: '10px', backgroundColor: 'rgba(0,0,0,0.7)', color: 'lightgreen', padding: '10px', fontSize: '12px', zIndex: 9999, border: '1px solid lightgreen', fontFamily: 'monospace' }
};

export default function ProjectionPage() {
  const [gameState, setGameState] = useState('waiting');
  const [question, setQuestion] = useState(null);
  const [revealedAnswer, setRevealedAnswer] = useState(null);
  const videoRef = useRef(null);

  // --- EFECTO 1: MANEJO DE EVENTOS DE SOCKET ---
  useEffect(() => {
    const socket = getSocket();

    const handleNewQuestion = (newQuestion) => {
      setRevealedAnswer(null);
      setQuestion(newQuestion);
      setGameState('showing_question');
    };
    const handleRevealAnswer = ({ correctOption }) => {
      setRevealedAnswer(correctOption);
    };
    const resetScreen = () => {
      setGameState('waiting');
      setQuestion(null);
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

  // --- EFECTO 2: MANEJO DEL VIDEO ---
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !question) return;

    video.src = question.video_url;
    video.load();
    video.play().catch(error => console.error("Error de Autoplay:", error.message));

    const pauseAtTime = () => {
      if (video.currentTime >= question.pause_timestamp_secs) {
        video.pause();
      }
    };
    video.addEventListener('timeupdate', pauseAtTime);

    return () => video.removeEventListener('timeupdate', pauseAtTime);
  }, [question]); // Este efecto se activa SOLO cuando la variable 'question' cambia

  // Este efecto se activa SOLO cuando 'revealedAnswer' cambia
  useEffect(() => {
    if (revealedAnswer && videoRef.current) {
      videoRef.current.play().catch(error => console.error("Error de Autoplay:", error.message));
    }
  }, [revealedAnswer]);

  return (
    <div style={styles.container}>
      {/* --- NUESTRO MONITOR DE ESTADO --- */}
      <div style={styles.debugMonitor}>
        <h3>Monitor de Estado</h3>
        <pre>
          Game State: {gameState}
          <br />
          Question: {question ? `ID ${question.id}` : 'null'}
          <br />
          Revealed: {revealedAnswer || 'null'}
        </pre>
      </div>

      {/* El resto de la lógica de renderizado se queda igual */}
      {gameState === 'showing_question' && question ? (
        <>
          <video ref={videoRef} style={styles.video} muted playsInline>Tu navegador no soporta videos.</video>
          <h1 style={styles.questionText}>{question.question_text}</h1>
          <div style={styles.optionsContainer}>
            {[question.option_1, question.option_2, question.option_3, question.option_4].map((text, index) => {
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
      ) : (
        <h1>TRIVIA GAME - Esperando...</h1>
      )}
    </div>
  );
}
