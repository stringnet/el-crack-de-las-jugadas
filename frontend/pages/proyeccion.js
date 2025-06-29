import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

// --- Estilos Finales y Pulidos ---
const styles = {
  // Contenedor base que ocupa toda la pantalla
  baseContainer: {
    width: '100vw',
    height: '100vh',
    backgroundColor: 'black',
    color: 'white',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
    textAlign: 'center',
    overflow: 'hidden', // Evita barras de scroll
  },
  // Estilos para la vista de pregunta
  questionView: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '20px',
    boxSizing: 'border-box'
  },
  video: {
    width: '80%',
    maxHeight: '60vh',
    border: '4px solid white',
    borderRadius: '10px',
    backgroundColor: '#111'
  },
  questionText: {
    fontSize: 'clamp(1.5em, 5vw, 3.5em)', // Tamaño de fuente adaptable
    margin: '20px 0',
    textShadow: '2px 2px 4px #000'
  },
  optionsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    width: '80%',
  },
  option: {
    backgroundColor: '#333',
    padding: '20px',
    borderRadius: '10px',
    fontSize: 'clamp(1em, 3vw, 1.8em)',
    border: '2px solid #555',
    transition: 'all 0.3s ease'
  },
  correctOption: {
    backgroundColor: '#28a745',
    borderColor: '#90ee90',
    transform: 'scale(1.05)',
    boxShadow: '0 0 15px lightgreen',
  },
  // Estilos para la pantalla de espera
  waitingContainer: {
    width: '100%',
    height: '100%',
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    backgroundRepeat: 'no-repeat',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end', // Empuja el banner hacia abajo
    alignItems: 'center',
  },
  waitingBanner: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    padding: '20px 40px',
    boxSizing: 'border-box',
  },
  waitingText: {
    fontSize: 'clamp(2em, 5vw, 3.5em)',
    fontWeight: 'bold',
    textShadow: '3px 3px 6px #000',
    margin: 0,
  }
};

export default function ProjectionPage() {
  const [question, setQuestion] = useState(null);
  const [revealedAnswer, setRevealedAnswer] = useState(null);
  const [settings, setSettings] = useState(null);
  const videoRef = useRef(null);

  // EFECTO 1: Carga la configuración y establece la conexión del socket
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/settings`);
        if (res.ok) setSettings(await res.json());
      } catch (err) { console.error("Error al cargar configuración.", err); }
    };
    fetchSettings();

    const socket = io(`${process.env.NEXT_PUBLIC_BACKEND_URL}/projection`);
    
    const handleNewQuestion = (newQuestion) => { setRevealedAnswer(null); setQuestion(newQuestion); };
    const handleRevealAnswer = ({ correctOption }) => setRevealedAnswer(correctOption);
    const resetScreen = () => { setQuestion(null); setRevealedAnswer(null); };
    
    socket.on('server:new_question', handleNewQuestion);
    socket.on('server:reveal_answer', handleRevealAnswer);
    socket.on('server:game_over', resetScreen);
    socket.on('server:game_started', resetScreen);

    return () => { socket.disconnect(); };
  }, []);

  // EFECTO 2: Gestiona el video cuando cambia la pregunta o se revela la respuesta
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const timeUpdateListener = () => {
      if (question && !video.paused && video.currentTime >= question.pause_timestamp_secs) {
        video.pause();
      }
    };
    
    // Limpiamos listeners anteriores para evitar duplicados
    video.removeEventListener('timeupdate', timeUpdateListener);

    if (question && !revealedAnswer) {
      if (question.video_url && question.video_url.trim() !== '') {
        const handleCanPlay = () => video.play().catch(e => console.error("Error de Autoplay:", e));
        video.addEventListener('canplay', handleCanPlay, { once: true });
        video.addEventListener('timeupdate', timeUpdateListener);
        video.src = question.video_url;
        video.load();
      }
    } else if (question && revealedAnswer) {
      video.play().catch(e => console.error("Error al reanudar:", e));
    }
    
    return () => { video.removeEventListener('timeupdate', timeUpdateListener); };
  }, [question, revealedAnswer]);

  
  // --- LÓGICA DE RENDERIZADO FINAL ---

  // Si hay una pregunta, mostramos la vista del juego
  if (question) {
    const options = [question.option_1, question.option_2, question.option_3, question.option_4];
    return (
      <div style={{...styles.baseContainer, ...styles.questionView}}>
        <video key={question.id} ref={videoRef} style={styles.video} muted playsInline>
          <source src={question.video_url} type="video/mp4" />
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

  // Si no hay pregunta, mostramos la pantalla de espera personalizada
  return (
    <div style={styles.baseContainer}>
      <div style={{ ...styles.waitingContainer, backgroundImage: `url(${settings?.projection_background_url || ''})` }}>
        <div style={styles.waitingBanner}>
          <h1 style={styles.waitingText}>
            Esperando que el administrador inicie el juego...
          </h1>
        </div>
      </div>
    </div>
  );
}
