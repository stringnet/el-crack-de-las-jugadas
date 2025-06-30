import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

const styles = {
  // Estilo base que ocupa toda la pantalla
  container: { width: '100vw', height: '100vh', backgroundColor: 'black', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', textAlign: 'center', overflow: 'hidden' },
  // Estilos para la vista de pregunta (con fondo amarillo)
  questionView: { backgroundColor: '#FFC700', color: '#0D2447' },
  video: { width: 'auto', height: 'auto', maxWidth: '65%', maxHeight: '55vh', borderRadius: '25px', boxShadow: '0px 10px 30px rgba(0,0,0,0.2)', backgroundColor: '#000' },
  questionText: { fontSize: 'clamp(2em, 5vw, 3.5em)', margin: '30px 0', fontWeight: 'bold' },
  // Estilos para la pantalla de espera personalizada
  waitingView: { backgroundSize: 'cover', backgroundPosition: 'center center', backgroundRepeat: 'no-repeat' },
  loadingText: { fontSize: '3em', fontWeight: 'bold' }
};

export default function ProjectionPage() {
  const [question, setQuestion] = useState(null);
  const [revealedAnswer, setRevealedAnswer] = useState(null); // A pesar de no mostrar opciones, lo usamos para saber cuándo reanudar el video
  const [settings, setSettings] = useState(null); // Inicia como null para indicar que está cargando
  const videoRef = useRef(null);

  // EFECTO 1: Carga la configuración y establece la conexión del socket
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/settings`);
        if (res.ok) {
          setSettings(await res.json());
        } else {
          console.error("Falló la carga de la configuración");
          setSettings({}); // Ponemos un objeto vacío en caso de error para que no se quede en "cargando"
        }
      } catch (err) { 
        console.error("Error de red al cargar configuración.", err);
        setSettings({});
      }
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
      if (question && !revealedAnswer && !video.paused && video.currentTime >= question.pause_timestamp_secs) {
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

  
  // --- LÓGICA DE RENDERIZADO FINAL Y SEGURA ---

  // 1. Si la configuración aún no ha cargado, muestra "Cargando..."
  if (settings === null) {
    return (
      <div style={styles.container}>
        <h1 style={styles.loadingText}>Cargando Configuración...</h1>
      </div>
    );
  }

  // 2. Si hay una pregunta activa, mostramos la vista del juego
  if (question) {
    return (
      <div style={{...styles.baseContainer, ...styles.questionView}}>
        <video key={question.id} ref={videoRef} style={styles.video} muted playsInline>
          <source src={question.video_url} type="video/mp4" />
        </video>
        <h1 style={styles.questionText}>{question.question_text}</h1>
      </div>
    );
  }

  // 3. Si no hay pregunta y la configuración ya cargó, mostramos la pantalla de espera
  return (
    <div style={{ 
        ...styles.baseContainer, 
        ...styles.waitingView, 
        backgroundImage: `url(${settings.projection_background_url || ''})` 
    }} />
  );
}
