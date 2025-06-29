import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client'; // Importamos 'io' directamente

const styles = { /* ... Estilos se quedan igual ... */ };

export default function ProjectionPage() {
  const [question, setQuestion] = useState(null);
  const [revealedAnswer, setRevealedAnswer] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    // --- CONEXIÓN DIRECTA AL NAMESPACE CORRECTO ---
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    // Creamos una nueva conexión dedicada solo para esta página al namespace '/projection'
    const socket = io(`${backendUrl}/projection`);
    console.log('[PROYECCIÓN] Conectando al namespace /projection...');

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

    socket.on('connect', () => {
        console.log(`[PROYECCIÓN] Conectado al servidor con ID: ${socket.id}`);
    });
    
    socket.on('server:new_question', handleNewQuestion);
    socket.on('server:reveal_answer', handleRevealAnswer);
    socket.on('server:game_over', resetScreen);
    socket.on('server:game_started', resetScreen);

    // Limpieza al desmontar el componente: nos desconectamos de este socket específico
    return () => {
      console.log('[PROYECCIÓN] Desconectando socket de proyección.');
      socket.disconnect();
    };
  }, []); // Se ejecuta solo una vez al montar la página

  // ... El resto del código, incluyendo los otros useEffect y la función renderContent,
  // se queda exactamente igual que en la versión anterior que te di.
  // (Omitido por brevedad, pero usa el código de la respuesta anterior para el resto del archivo)
}
