import { useEffect, useState, useRef } from 'react';
import { getSocket } from '../lib/socket';

// --- Estilos (puedes moverlos a un archivo .css si prefieres) ---
const styles = {
  container: { width: '100vw', height: '100vh', backgroundColor: 'black', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif', textAlign: 'center' },
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

  // --- EFECTO 1: MANEJO DE EVENTOS DE SOCKET ---
  useEffect(() => {
    console.log('[PROYECCIÓN] Montado y esperando eventos.');
    const socket = getSocket();

    const handleNewQuestion = (newQuestion) => {
      console.log('[PROYECCIÓN] Recibido: server:new_question', newQuestion);
      setRevealedAnswer(null);
      setQuestion(newQuestion); // Solo actualizamos el estado. React se encargará del resto.
    };

    const handleRevealAnswer = ({ correctOption }) => {
      console.log('[PROYECCIÓN] Recibido: server:reveal_answer');
      setRevealedAnswer(correctOption);
    };

    const resetScreen = () => {
      console.log('[PROYECCIÓN] Recibido: game_started o game_over. Reseteando pantalla.');
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

  // --- EFECTO 2: MANEJO DEL VIDEO (SE ACTIVA CUANDO 'question' o 'revealedAnswer' CAMBIAN) ---
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Si tenemos una pregunta, configuramos el video para que se reproduzca y se pause.
    if (question) {
      console.log('[PROYECCIÓN] El estado "question" cambió. Configurando video:', question.video_url);
      video.src = question.video_url;
      video.load();
      
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => console.error("Error de Autoplay:", error.message));
      }

      const pauseAtTime = () => {
        if (video.currentTime >= question.pause_timestamp_secs) {
          video.pause();
          console.log(`[PROYECCIÓN] Video pausado en ${video.currentTime}s`);
          video.removeEventListener('timeupdate', pauseAtTime); // Lo removemos para que no se active de nuevo
        }
      };
      video.addEventListener('timeupdate', pauseAtTime);

      // Limpieza para este efecto específico
      return () => video.removeEventListener('timeupdate', pauseAtTime);
    }
    
    // Si tenemos una respuesta revelada, continuamos la reproducción.
    if (revealedAnswer) {
      console.log('[PROYECCIÓN] El estado "revealedAnswer" cambió. Continuando video.');
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => console.error("Error de Autoplay:", error.message));
      }
    }

  }, [question, revealedAnswer]);


  // --- RENDERIZADO DE LA INTERFAZ ---
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

  // Pantalla de espera por defecto
  return (
    <div style={styles.container}>
        <h1>TRIVIA GAME</h1>
        <p style={{fontSize: '1.5em'}}>Esperando que el administrador inicie el juego...</p>
    </div>
  );
}
