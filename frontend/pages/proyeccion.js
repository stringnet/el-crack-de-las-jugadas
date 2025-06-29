import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

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

  // EFECTO 1: Se conecta al socket y gestiona los eventos de estado.
  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const socket = io(`${backendUrl}/projection`);
    
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
    };
    
    socket.on('server:new_question', handleNewQuestion);
    socket.on('server:reveal_answer', handleRevealAnswer);
    socket.on('server:game_over', resetScreen);
    socket.on('server:game_started', resetScreen);

    return () => {
      socket.disconnect();
    };
  }, []);

  // --- EFECTO 2: EL ÚNICO DIRECTOR DEL VIDEO ---
  // Se activa cada vez que la 'pregunta' o la 'respuesta revelada' cambian.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Se define la función que escucha el tiempo
    const timeUpdateListener = () => {
      if (question && !video.paused && video.currentTime >= question.pause_timestamp_secs) {
        video.pause();
      }
    };

    // Limpiamos cualquier listener anterior para evitar duplicados
    video.removeEventListener('timeupdate', timeUpdateListener);

    if (question && !revealedAnswer) {
      // FASE 1: Hay una nueva pregunta y no hay respuesta revelada
      video.src = question.video_url;
      video.load();
      video.play().catch(e => console.error("Error de Autoplay:", e));
      video.addEventListener('timeupdate', timeUpdateListener);
    } else if (question && revealedAnswer) {
      // FASE 2: Se ha revelado la respuesta, solo queremos continuar
      // El listener de 'timeupdate' ya fue limpiado por el ciclo anterior de este efecto
      video.play().catch(e => console.error("Error al reanudar:", e));
    }
    
    // La función de limpieza se asegura de que no queden listeners "fantasma"
    return () => {
        video.removeEventListener('timeupdate', timeUpdateListener);
    }

  }, [question, revealedAnswer]);

  if (question) {
    const options = [question.option_1, question.option_2, question.option_3, question.option_4];
    return (
      <div style={styles.container}>
        <video
          key={question.id}
          ref={videoRef}
          style={styles.video}
          muted
          playsInline
          // Quitamos autoPlay de aquí para tener control total en el useEffect
        >
          <source src={question.video_url} type="video/mp4" />
          Tu navegador no soporta videos.
        </video>
        
        <h1 style={styles.questionText}>{question.question_text}</h1>
        <div style={styles.optionsContainer}>
          {options.map((text, index) => {
            const optionNumber = index + 1;
            const isCorrect = revealedAnswer === optionNumber;
            return <div key={optionNumber} style={{...styles.option, ...(isCorrect && styles.correctOption)}}>{text}</div>;
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
