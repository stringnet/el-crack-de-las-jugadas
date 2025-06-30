import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

// --- ESTILOS FINALES PARA RECREAR TU DISEÑO EXACTO ---
const styles = {
  // Contenedor base que ocupa toda la pantalla
  baseContainer: {
    width: '100vw',
    height: '100vh',
    fontFamily: 'system-ui, sans-serif',
    overflow: 'hidden',
  },
  // --- VISTA DE ESPERA ---
  waitingView: {
    width: '100%',
    height: '100%',
    display: 'flex', // Usamos flexbox para las dos columnas
  },
  leftColumn: {
    width: '40%',
    backgroundColor: '#1C1C1C', // Fondo negro
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px',
    boxSizing: 'border-box'
  },
  rightColumn: {
    width: '60%',
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrCodePlaceholder: {
    width: '250px',
    height: '250px',
    backgroundColor: 'white',
    border: '1px solid white',
    marginBottom: '20px',
    // Aquí podrías poner un componente de QR real en el futuro
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'black',
    fontSize: '1.2em'
  },
  scanText: {
    color: '#FFC700', // Amarillo
    fontSize: '2em',
    fontWeight: 'bold',
  },
  logoPlaceholder: {
    position: 'absolute',
    bottom: '40px',
    left: '40px',
    fontSize: '1.5em'
  },
  rightColumnContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px'
  },
  title: {
    backgroundColor: '#FFC700',
    color: '#1C1C1C',
    padding: '15px 50px',
    borderRadius: '40px',
    fontSize: 'clamp(2em, 5vw, 3.5em)',
    fontWeight: 'bold',
  },
  subtitle: {
    backgroundColor: '#1C1C1C',
    color: 'white',
    padding: '10px 40px',
    borderRadius: '40px',
    fontSize: 'clamp(1.5em, 4vw, 2.5em)',
    fontWeight: 'bold',
    clipPath: 'polygon(0% 0%, 100% 0%, 95% 50%, 100% 100%, 0% 100%, 5% 50%)', // Forma de flecha
  },

  // --- VISTA DE PREGUNTA (sin cambios de estilo) ---
  questionView: { /* ... estilos de la respuesta anterior ... */ },
  video: { /* ... estilos de la respuesta anterior ... */ },
  questionText: { /* ... estilos de la respuesta anterior ... */ },
};

export default function ProjectionPage() {
  const [question, setQuestion] = useState(null);
  const [revealedAnswer, setRevealedAnswer] = useState(null);
  const [settings, setSettings] = useState(null);
  const videoRef = useRef(null);

  // LA LÓGICA DEL "MOTOR" SE MANTIENE INTACTA
  useEffect(() => { /* ...código de sockets sin cambios... */ }, []);
  useEffect(() => { /* ...código de video sin cambios... */ }, [question, revealedAnswer]);

  // --- LÓGICA DE RENDERIZADO FINAL ---

  if (question) {
    // Si hay una pregunta, mostramos la vista de video (esta parte no cambia)
    return (
      <div style={{...styles.baseContainer, ...styles.questionView}}>
        <video key={question.id} ref={videoRef} style={styles.video} muted playsInline>
          <source src={question.video_url} type="video/mp4" />
        </video>
        <h1 style={styles.questionText}>{question.question_text}</h1>
      </div>
    );
  }

  // Si NO hay pregunta, mostramos la NUEVA pantalla de espera personalizada
  return (
    <div style={{...styles.baseContainer, ...styles.waitingView}}>
        <div style={styles.leftColumn}>
            {/* El QR real se generaría con una librería, esto es un placeholder */}
            <div style={styles.qrCodePlaceholder}>
                <img src="https://i.imgur.com/gL5gC0A.png" alt="QR Code" style={{width: '100%', height: '100%'}} />
            </div>
            <p style={styles.scanText}>Escanea el QR</p>
            <p>para empezar a jugar</p>
            <div style={styles.logoPlaceholder}>
                ◆ PagoEfectivo
            </div>
        </div>
        <div style={{ ...styles.rightColumn, backgroundImage: `url(${settings?.projection_background_url || '/Fondo1920x1080.png'})` }}>
            <div style={styles.rightColumnContent}>
                <div style={styles.title}>El Crack de las Jugadas</div>
                <div style={styles.subtitle}>Sigue las instrucciones</div>
            </div>
        </div>
    </div>
  );
}
