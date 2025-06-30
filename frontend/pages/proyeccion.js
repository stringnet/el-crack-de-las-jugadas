import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

const styles = {
  // Contenedor base que ocupa toda la pantalla
  baseContainer: { width: '100vw', height: '100vh', fontFamily: 'system-ui, sans-serif', textAlign: 'center', overflow: 'hidden' },
  // Estilos para la vista de pregunta
  questionView: { backgroundColor: '#FFC700', color: '#0D2447', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '20px', boxSizing: 'border-box' },
  video: { width: 'auto', height: 'auto', maxWidth: '65%', maxHeight: '55vh', borderRadius: '25px', boxShadow: '0px 10px 30px rgba(0,0,0,0.2)', backgroundColor: '#000' },
  questionText: { fontSize: 'clamp(2em, 5vw, 3.5em)', margin: '30px 0', fontWeight: 'bold' },
  optionsContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px 20px', width: '65%' },
  option: { backgroundColor: '#1C1C1C', color: '#FFC700', padding: '20px', borderRadius: '16px', fontSize: 'clamp(1em, 2.5vw, 1.8em)', fontWeight: 'bold' },
  correctOption: { backgroundColor: '#28a745', color: 'white', transform: 'scale(1.05)' },
  waitingView: { width: '100%', height: '100%', backgroundColor: '#000', backgroundSize: 'cover', backgroundPosition: 'center center', backgroundRepeat: 'no-repeat' }
};

export default function ProjectionPage() {
  const [question, setQuestion] = useState(null);
  const [revealedAnswer, setRevealedAnswer] = useState(null);
  const [settings, setSettings] = useState(null);
  const videoRef = useRef(null);

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

  // La pantalla de espera ahora es una única imagen a pantalla completa.
  return (
    <div style={{ ...styles.baseContainer, ...styles.waitingView, backgroundImage: `url(${settings?.projection_background_url || ''})` }} />
  );
}
