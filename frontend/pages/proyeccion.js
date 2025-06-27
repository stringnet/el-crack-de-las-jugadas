// pages/proyeccion.js
import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

const socket = io(`${process.env.NEXT_PUBLIC_BACKEND_URL}/projection`);

export default function ProjectionPage() {
  const [question, setQuestion] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    socket.on('server:new_question', (newQuestion) => {
      setQuestion(newQuestion);
      if (videoRef.current) {
        // Pausar cualquier video anterior
        videoRef.current.pause();
        // Cargar el nuevo video
        videoRef.current.src = newQuestion.video_url;
        videoRef.current.load();
        
        // Cuando el video esté listo, reproducir
        videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
        };
      }
    });

    return () => socket.off('server:new_question');
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !question) return;

    const handleTimeUpdate = () => {
      // Pausar el video en el segundo exacto
      if (video.currentTime >= question.pause_timestamp_secs) {
        video.pause();
        // Quitar el listener para que no se vuelva a activar
        video.removeEventListener('timeupdate', handleTimeUpdate);
      }
    };
    
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [question]);


  return (
    <div style={{ width: '100%', height: '100vh', backgroundColor: 'black', color: 'white' }}>
      {question ? (
        <>
          <video ref={videoRef} width="80%" style={{ maxHeight: '70vh' }} controls>
            Tu navegador no soporta el tag de video.
          </video>
          <h1 style={{ fontSize: '3em', marginTop: '20px' }}>{question.question_text}</h1>
        </>
      ) : (
        <h1>Esperando el inicio del juego...</h1>
      )}
    </div>
  );
}
