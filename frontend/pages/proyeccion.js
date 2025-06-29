import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

// --- Estilos para la página ---
const styles = {
  // Contenedor principal que se adapta a las dos vistas
  container: { position: 'relative', width: '100vw', height: '100vh', backgroundColor: 'black', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif', textAlign: 'center' },
  // Estilos para la vista de video y pregunta
  video: { width: '80%', maxHeight: '60vh', border: '4px solid white', borderRadius: '10px', backgroundColor: '#111' },
  questionText: { fontSize: '3em', margin: '20px 0', textShadow: '2px 2px 4px #000' },
  optionsContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', width: '80%' },
  option: { backgroundColor: '#333', padding: '20px', borderRadius: '10px', fontSize: '1.8em', border: '2px solid #555', transition: 'all 0.3s ease' },
  correctOption: { backgroundColor: 'green', borderColor: 'lightgreen', transform: 'scale(1.05)' },
  // Estilos para la pantalla de espera personalizada
  waitingContainer: {
    width: '100%',
    height: '100%',
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    backgroundRepeat: 'no-repeat',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  waitingBanner: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '20px 0',
  },
  waitingText: {
    fontSize: '2.5em',
    textShadow: '2px 2px 4px #000',
    margin: 0,
  }
};

export default function ProjectionPage() {
  const [question, setQuestion] = useState(null);
  const [revealedAnswer, setRevealedAnswer] = useState(null);
  const [settings, setSettings] = useState(null); // Inicia como null para saber si ya cargó
  const videoRef = useRef(null);

  // EFECTO 1: Carga la configuración y establece la conexión del socket
  useEffect(() => {
    // Carga la configuración del juego al iniciar
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/settings`);
        if (res.ok) setSettings(await res.json());
      } catch (err) { console.error("Error al cargar configuración.", err); }
    };
    fetchSettings();

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const socket = io(`${backendUrl}/projection`);
    
    const handleNewQuestion = (newQuestion) => {
      setRevealedAnswer(null);
      setQuestion(newQuestion);
    };
    const handleRevealAnswer = ({ correctOption }) => setRevealedAnswer(correctOption);
    const resetScreen = () => {
      setQuestion(null);
      setRevealedAnswer(null);
    };
    
    socket.on('server:new_question', handleNewQuestion);
    socket.on('server:reveal_answer', handleRevealAnswer);
    socket.on('server:game_over', resetScreen);
    socket.on('server:game_started', resetScreen);

    return () => { socket.disconnect(); };
  }, []);

  // EFECTO 2: Gestiona toda la lógica del video cuando 'question' o 'revealedAnswer' cambian
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const timeUpdateListener = () => {
      if (question && !video.paused && video.currentTime >= question.pause_timestamp_secs) {
        video.pause();
      }
    };
    
    video.removeEventListener('timeupdate', timeUpdateListener);

    if (question && !revealedAnswer) {
      // FASE 1: Nueva pregunta
      if (question.video_url) {
        video.src = question.video_url;
        video.load();
        video.play().catch(e => console.error("Error de Autoplay:", e));
        video.addEventListener('timeupdate', timeUpdateListener);
      }
    } else if (question && revealedAnswer) {
      // FASE 2: Revelar respuesta
      video.play().catch(e => console.error("Error al reanudar:", e));
    }

    return () => {
      video.removeEventListener('timeupdate', timeUpdateListener);
    }
  }, [question, revealedAnswer]);

  // --- LÓGICA DE RENDERIZADO ---
  
  // Si hay una pregunta activa, mostramos la vista del juego
  if (question) {
    const options = [question.option_1, question.option_2, question.option_3, question.option_4];
    return (
      <div style={styles.container}>
        <video key={question.id} ref={videoRef} style={styles.video} muted playsInline>
          {question.video_url && <source src={question.video_url} type="video/mp4" />}
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

  // Si no hay pregunta, mostramos la pantalla de espera personalizada
  return (
    <div style={{ ...styles.waitingContainer, backgroundImage: `url(${settings?.projection_background_url || ''})` }}>
      <div style={styles.waitingBanner}>
        <h1 style={styles.waitingText}>
          Esperando que el administrador inicie el juego...
        </h1>
      </div>
    </div>
  );
}
