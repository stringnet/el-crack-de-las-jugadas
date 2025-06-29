import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client'; // Importamos 'io' directamente para esta página

// --- Estilos para la página ---
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

  // EFECTO 1: MANEJO DE EVENTOS DE SOCKET
  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    // Creamos una conexión dedicada solo para esta página al namespace '/projection'
    const socket = io(`${backendUrl}/projection`);

    socket.on('connect', () => {
        console.log(`[PROYECCIÓN] Conectado al servidor con ID: ${socket.id}`);
    });

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

    // Limpieza al desmontar el componente
    return () => {
      console.log('[PROYECCIÓN] Desconectando socket de proyección.');
      socket.disconnect();
    };
  }, []); // Se ejecuta solo una vez

  // EFECTO 2: MANEJO DE LA PAUSA DEL VIDEO
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !question) return;

    const pauseAtTime = () => {
      if (!video.paused && video.currentTime >= question.pause_timestamp_secs) {
        video.pause();
      }
    };
    video.addEventListener('timeupdate', pauseAtTime);

    return () => video.removeEventListener('timeupdate', pauseAtTime);
  }, [question]);

  // EFECTO 3: MANEJO DE LA REANUDACIÓN DEL VIDEO
  useEffect(() => {
    if (revealedAnswer && videoRef.current) {
      videoRef.current.play().catch(error => console.error("Error al reanudar video:", error.message));
    }
  }, [revealedAnswer]);

  // --- RENDERIZADO DE LA INTERFAZ ---

  // Si hay una pregunta, mostramos la vista del juego
  if (question) {
    const options = [question.option_1, question.option_2, question.option_3, question.option_4];
    return (
      <div style={styles.container}>
        <video
          key={question.id} // La 'key' fuerza a React a crear un nuevo elemento de video para cada pregunta
          ref={videoRef}
          style={styles.video}
          muted
          playsInline
          autoPlay // El navegador intenta reproducir automáticamente
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

  // Si no hay pregunta, mostramos la pantalla de espera
  return (
    <div style={styles.container}>
      <h1>TRIVIA GAME</h1>
      <p style={{fontSize: '1.5em'}}>Esperando que el administrador inicie el juego...</p>
    </div>
  );
}
