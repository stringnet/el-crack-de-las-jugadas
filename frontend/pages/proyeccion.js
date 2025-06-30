import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

const styles = {
  // Contenedor base que ocupa toda la pantalla
  baseContainer: { width: '100vw', height: '100vh', fontFamily: 'system-ui, sans-serif', textAlign: 'center', overflow: 'hidden' },
  // Vista de la pregunta con fondo amarillo
  questionView: { backgroundColor: '#FFC700', color: '#0D2447', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '20px', boxSizing: 'border-box' },
  // Estilo del video sin fondo propio para que se vea el amarillo
  video: { width: 'auto', height: 'auto', maxWidth: '65%', maxHeight: '55vh', borderRadius: '25px', boxShadow: '0px 10px 30px rgba(0,0,0,0.2)', backgroundColor: '#000' },
  questionText: { fontSize: 'clamp(2em, 5vw, 3.5em)', margin: '30px 0', fontWeight: 'bold', color: '#0D2447' },
  // Pantalla de espera personalizada
  waitingView: { width: '100%', height: '100%', backgroundColor: '#000', backgroundSize: 'cover', backgroundPosition: 'center center', backgroundRepeat: 'no-repeat' }
};

export default function ProjectionPage() {
  const [question, setQuestion] = useState(null);
  const [revealedAnswer, setRevealedAnswer] = useState(null); // Lo usamos para saber cuándo reanudar
  const [settings, setSettings] = useState(null); // Inicia como null para el estado de carga
  const videoRef = useRef(null);

  // EFECTO 1: Carga configuración y establece la conexión de socket
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/settings`);
        if (res.ok) {
          setSettings(await res.json());
        } else {
          setSettings({}); // Ponemos un objeto vacío en caso de error para salir del estado de carga
        }
      } catch (err) { 
        console.error("Error al cargar configuración.", err);
        setSettings({});
      }
    };
    fetchSettings();

    const socket = io(`${process.env.NEXT_PUBLIC_BACKEND_URL}/projection`);
    
    const handleNewQuestion = (newQuestion) => {
      console.log("[PROYECCIÓN] Recibida nueva pregunta:", newQuestion);
      setRevealedAnswer(null);
      setQuestion(newQuestion);
    };
    const handleRevealAnswer = ({ correctOption }) => {
      console.log("[PROYECCIÓN] Recibida orden de revelar respuesta.");
      setRevealedAnswer(correctOption);
    };
    const resetScreen = () => {
      console.log("[PROYECCIÓN] Reseteando pantalla (inicio o fin de juego).");
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

  // EFECTO 2: Gestiona el video cuando cambia el estado
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
        if (video.src !== question.video_url) {
            video.src = question.video_url;
            video.load();
        }
      }
    } else if (question && revealedAnswer) {
      video.play().catch(e => console.error("Error al reanudar:", e));
    }
    
    return () => {
      video.removeEventListener('timeupdate', timeUpdateListener);
    };
  }, [question, revealedAnswer]);

  
  // --- LÓGICA DE RENDERIZADO FINAL Y SEGURA ---

  // 1. Si la configuración aún no ha cargado, muestra "Cargando..."
  if (settings === null) {
    return (
      <div style={styles.container}>
        <h1 style={{fontSize: '3em'}}>Cargando Configuración...</h1>
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
        {/* Como acordamos, ya no mostramos las opciones en la pantalla de proyección */}
      </div>
    );
  }

  // 3. Si no hay pregunta, mostramos la pantalla de espera personalizada
  return (
    <div style={{ 
        ...styles.baseContainer, 
        ...styles.waitingView, 
        backgroundImage: `url(${settings.projection_background_url || ''})` 
    }} />
  );
}
