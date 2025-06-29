import { useEffect, useState, useRef } from 'react';
import { getSocket } from '../lib/socket';

const styles = {
  container: { width: '100vw', height: '100vh', backgroundColor: 'black', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif', textAlign: 'center' },
  video: { width: '80%', maxHeight: '60vh', border: '4px solid white', borderRadius: '10px', backgroundColor: '#111' },
  questionText: { fontSize: '3em', margin: '20px 0' },
  optionsContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', width: '80%' },
  option: { backgroundColor: '#333', padding: '20px', borderRadius: '10px', fontSize: '1.8em', border: '2px solid #555' },
  correctOption: { backgroundColor: 'green', border: '4px solid lightgreen', transform: 'scale(1.05)', transition: 'all 0.3s ease' }
};

export default function ProjectionPage() {
  const [gameState, setGameState] = useState('waiting');
  const [question, setQuestion] = useState(null);
  const [revealedAnswer, setRevealedAnswer] = useState(null);
  const videoRef = useRef(null);

  // Función de play mejorada con manejo de errores y logs
  const playVideo = async () => {
    if (videoRef.current) {
      console.log('[PROYECCIÓN] Intentando ejecutar video.play()');
      try {
        await videoRef.current.play();
        console.log('[PROYECCIÓN] ¡Éxito! El video se está reproduciendo.');
      } catch (error) {
        console.error('[PROYECCIÓN] --- ERROR DE AUTOPLAY ---');
        console.error('[PROYECCIÓN] Mensaje del error:', error.message);
        console.error('[PROYECCIÓN] El navegador bloqueó la reproducción automática. Usa el botón "Forzar Play" para iniciar.');
      }
    } else {
        console.error('[PROYECCIÓN] Error: La referencia al video es nula.');
    }
  };

  useEffect(() => {
    console.log('[PROYECCIÓN] Componente montado. Esperando eventos...');
    const socket = getSocket();

    const handleNewQuestion = (newQuestion) => {
      console.log('[PROYECCIÓN] Evento new_question recibido. URL:', newQuestion.video_url);
      setQuestion(newQuestion);
      setRevealedAnswer(null);
      setGameState('showing_question');
      
      const video = videoRef.current;
      if (video) {
        console.log('[PROYECCIÓN] Referencia al video encontrada. Asignando src y cargando...');
        video.src = newQuestion.video_url;
        video.load();
        video.onloadeddata = () => {
            console.log('[PROYECCIÓN] Evento "onloadeddata" activado. El video tiene datos para empezar.');
            playVideo();
        };
      } else {
          console.error('[PROYECCIÓN] Error: No se encontró el elemento de video en el DOM al recibir la pregunta.');
      }
    };

    const handleRevealAnswer = ({ correctOption }) => {
      console.log('[PROYECCIÓN] Evento reveal_answer recibido. Revelando respuesta y continuando video.');
      setRevealedAnswer(correctOption);
      playVideo();
    };

    const resetScreen = () => { setGameState('waiting'); setQuestion(null); }
    
    socket.on('server:new_question', handleNewQuestion);
    socket.on('server:reveal_answer', handleRevealAnswer);
    socket.on('server:game_over', resetScreen);
    socket.on('server:game_started', resetScreen);

    return () => {
      // Limpieza de listeners
      socket.off('server:new_question', handleNewQuestion);
      socket.off('server:reveal_answer', handleRevealAnswer);
      socket.off('server:game_over', resetScreen);
      socket.off('server:game_started', resetScreen);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !question) return;

    const pauseAtTime = () => {
      if (video.currentTime >= question.pause_timestamp_secs) {
        video.pause();
        console.log(`[PROYECCIÓN] Video pausado en el segundo ${video.currentTime}`);
      }
    };
    
    video.addEventListener('timeupdate', pauseAtTime);
    return () => video.removeEventListener('timeupdate', pauseAtTime);
  }, [question]);

  const renderContent = () => {
    if (gameState === 'showing_question' && question) {
      const options = [question.option_1, question.option_2, question.option_3, question.option_4];
      return (
        <>
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
        </>
      );
    }
    
    return (
        <div>
            <h1>TRIVIA GAME - Pantalla de Proyección</h1>
            <p>Esperando que el administrador inicie el juego...</p>
            <button onClick={playVideo} style={{padding: '10px 20px', fontSize: '1.2em', marginTop: '20px'}}>Forzar Play (si no inicia)</button>
        </div>
    );
  };

  return <div style={styles.container}>{renderContent()}</div>;
}
