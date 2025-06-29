import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

// Estilos existentes y nuevos
const styles = {
  container: { position: 'relative', width: '100vw', height: '100vh', backgroundColor: 'black', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif', textAlign: 'center' },
  video: { width: '80%', maxHeight: '60vh', border: '4px solid white', borderRadius: '10px', backgroundColor: '#111' },
  questionText: { fontSize: '3em', margin: '20px 0', textShadow: '2px 2px 4px #000' },
  optionsContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', width: '80%' },
  option: { backgroundColor: '#333', padding: '20px', borderRadius: '10px', fontSize: '1.8em', border: '2px solid #555', transition: 'all 0.3s ease' },
  correctOption: { backgroundColor: 'green', borderColor: 'lightgreen', transform: 'scale(1.05)' },
  // --- NUEVOS ESTILOS PARA LA PANTALLA DE ESPERA PERSONALIZADA ---
  waitingContainer: {
    width: '100vw',
    height: '100vh',
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end', // Alinea el banner hacia abajo
    alignItems: 'center',
    textAlign: 'center',
  },
  waitingBanner: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Fondo negro semitransparente
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
  const [settings, setSettings] = useState(null); // <-- NUEVO: para guardar la configuración
  const videoRef = useRef(null);

  // EFECTO 1: Se conecta al socket y ahora también carga la configuración del juego.
  useEffect(() => {
    // --- NUEVA LÓGICA PARA CARGAR LA CONFIGURACIÓN ---
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/settings`);
        if (res.ok) {
          const data = await res.json();
          console.log("Configuración cargada:", data);
          setSettings(data);
        }
      } catch (err) {
        console.error("Error al cargar la configuración para la proyección.", err);
      }
    };
    fetchSettings();
    // ---------------------------------------------

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const socket = io(`${backendUrl}/projection`);

    const handleNewQuestion = (newQuestion) => { /* ... se queda igual ... */ };
    const handleRevealAnswer = ({ correctOption }) => { /* ... se queda igual ... */ };
    const resetScreen = () => { /* ... se queda igual ... */ };

    socket.on('server:new_question', handleNewQuestion);
    socket.on('server:reveal_answer', handleRevealAnswer);
    socket.on('server:game_over', resetScreen);
    socket.on('server:game_started', resetScreen);

    return () => { socket.disconnect(); };
  }, []);

  // Los otros dos useEffect para el video se quedan exactamente igual.
  // ... (Omitidos por brevedad, pero déjalos como están en tu archivo) ...
  
  // --- LÓGICA DE RENDERIZADO ACTUALIZADA ---

  // Si hay una pregunta, mostramos la vista del juego (esta parte no cambia).
  if (question) {
    const options = [question.option_1, question.option_2, question.option_3, question.option_4];
    return (
      <div style={styles.container}>
        <video key={question.id} ref={videoRef} style={styles.video} muted playsInline>
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

  // Si NO hay pregunta, mostramos la nueva pantalla de espera personalizada.
  return (
    <div 
        style={{ 
            ...styles.waitingContainer, 
            // Usa la imagen de fondo si existe en la configuración, si no, un fondo negro por defecto.
            backgroundImage: `url(${settings?.projection_background_url || ''})`, 
            backgroundColor: '#000'
        }}
    >
      <div style={styles.waitingBanner}>
        <h1 style={styles.waitingText}>
          Esperando que el administrador inicie el juego...
        </h1>
      </div>
    </div>
  );
}
