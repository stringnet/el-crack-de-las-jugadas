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
    };
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

  // --- EFECTO PRINCIPAL PARA CONTROLAR EL VIDEO ---
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !question) return;

    // --- LÓGICA DE INICIO Y PAUSA ---
    if (question.video_url && !revealedAnswer) {
      console.log(`[PROYECCIÓN] Configurando video para pregunta ID: ${question.id}`);
      
      const playVideo = () => {
        video.play().catch(e => console.error("Error de Autoplay:", e.message));
      };

      const pauseAtTime = () => {
        if (!video.paused && video.currentTime >= question.pause_timestamp_secs) {
          video.pause();
          console.log(`[PROYECCIÓN] Video pausado en ${video.currentTime}s.`);
        }
      };

      // Limpiamos listeners anteriores para evitar duplicados
      video.removeEventListener('canplay', playVideo);
      video.removeEventListener('timeupdate', pauseAtTime);

      // Asignamos la nueva fuente
      video.src = question.video_url;
      
      // Añadimos los nuevos listeners
      video.addEventListener('canplay', playVideo, { once: true }); // 'canplay' es más robusto que 'loadeddata' y se ejecuta una sola vez.
      video.addEventListener('timeupdate', pauseAtTime);

      // Le decimos al navegador que cargue el nuevo video
      video.load();
    }
    
    // --- LÓGICA PARA REANUDAR EL VIDEO ---
    if (revealedAnswer) {
      console.log('[PROYECCIÓN] Revelando respuesta. Reanudando video...');
      video.play().catch(e => console.error("Error al reanudar video:", e.message));
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
          playsInline // Importante para iOS
        >
          <source src={question.video_url} type="video/mp4" />
          Tu navegador no soporta videos.
        </video>
        
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
