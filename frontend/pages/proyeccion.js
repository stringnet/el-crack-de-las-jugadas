import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

// --- ESTILOS ACTUALIZADOS PARA COINCIDIR CON TU DISEÑO DE REFERENCIA ---
const styles = {
  // Contenedor base que ocupa toda la pantalla
  baseContainer: {
    width: '100vw',
    height: '100vh',
    backgroundColor: '#FFC700', // <-- Color de fondo amarillo
    color: '#0D2447', // <-- Color de texto principal oscuro
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
    textAlign: 'center',
    overflow: 'hidden',
  },
  // Vista de la pregunta
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
    width: '65%', // Tamaño ajustado
    maxHeight: '55vh',
    borderRadius: '25px', // Bordes redondeados
    backgroundColor: '#000',
    boxShadow: '0px 10px 30px rgba(0,0,0,0.2)', // Sombra sutil
    border: 'none', // <-- Sin borde blanco
  },
  questionText: {
    fontSize: 'clamp(2em, 5vw, 3.5em)',
    margin: '30px 0',
    color: '#0D2447', // Color azul oscuro/negro
    fontWeight: 'bold',
  },
  optionsContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px 20px',
    width: '65%',
  },
  option: {
    backgroundColor: '#1C1C1C', // Fondo negro
    color: '#FFC700', // Texto amarillo
    padding: '15px 25px',
    borderRadius: '16px', // Forma de píldora/hexágono redondeado
    fontSize: 'clamp(1em, 2.5vw, 1.6em)',
    fontWeight: 'bold',
    transition: 'all 0.3s ease'
  },
  correctOption: {
    backgroundColor: '#28a745',
    color: 'white',
    transform: 'scale(1.05)',
  },
  // Vista de espera
  waitingContainer: {
    width: '100%',
    height: '100%',
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitingText: {
    fontSize: 'clamp(2em, 5vw, 4em)',
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: '30px 50px',
    borderRadius: '20px'
  }
};

export default function ProjectionPage() {
  const [question, setQuestion] = useState(null);
  const [revealedAnswer, setRevealedAnswer] = useState(null);
  const [settings, setSettings] = useState(null);
  const videoRef = useRef(null);

  // --- LÓGICA DEL "MOTOR" (SIN CAMBIOS) ---
  // Este código maneja la conexión y los eventos. No lo tocamos.
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

  // Este código maneja la reproducción del video. No lo tocamos.
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
      if (question.video_url) {
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


  // --- LÓGICA DE RENDERIZADO (LA "CARROCERÍA Y PINTURA") ---

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

  // Pantalla de espera con fondo amarillo si no hay imagen personalizada
  return (
    <div style={{ ...styles.baseContainer, ...styles.waitingContainer, backgroundImage: `url(${settings?.projection_background_url || ''})` }}>
      {/* Solo mostramos el texto si NO hay imagen de fondo personalizada */}
      {!settings?.projection_background_url && (
          <h1 style={styles.waitingText}>
            Esperando que el administrador inicie el juego...
          </h1>
      )}
    </div>
  );
}
