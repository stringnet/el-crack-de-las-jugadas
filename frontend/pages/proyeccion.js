import { useEffect, useState, useRef } from 'react';
import { getSocket } from '../lib/socket';

const styles = { /* ... Estilos se quedan igual ... */ };

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
    }
    
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

  // Efecto que maneja la lógica del video cuando cambia la pregunta
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !question) return;

    // --- VALIDACIÓN DE URL (LA CORRECCIÓN CLAVE) ---
    // Verificamos que la URL del video exista y no esté vacía
    if (question.video_url && question.video_url.trim() !== '') {
        console.log(`[PROYECCIÓN] URL válida encontrada: ${question.video_url}. Configurando video...`);
        video.src = question.video_url;
        video.load();
        video.play().catch(error => console.error("Error de Autoplay:", error.message));

        const pauseAtTime = () => {
          if (video.currentTime >= question.pause_timestamp_secs) {
            video.pause();
            video.removeEventListener('timeupdate', pauseAtTime);
          }
        };
        video.addEventListener('timeupdate', pauseAtTime);

        return () => video.removeEventListener('timeupdate', pauseAtTime);
    } else {
        console.error('[PROYECCIÓN] La pregunta recibida no tiene una URL de video válida. No se puede reproducir.');
    }
    // --------------------------------------------------
    
  }, [question]);

  // Efecto para reanudar el video cuando se revela la respuesta
  useEffect(() => {
    if (revealedAnswer && videoRef.current) {
      videoRef.current.play().catch(error => console.error("Error de Autoplay en revelación:", error.message));
    }
  }, [revealedAnswer]);

  if (question) {
    // ... (El resto del código JSX se queda igual) ...
  }
  
  return (
    // ... (La pantalla de espera se queda igual) ...
  );
}
