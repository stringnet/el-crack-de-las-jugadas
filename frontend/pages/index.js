import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const styles = {
    container: { width: '100vw', height: '100vh', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', backgroundSize: 'cover', backgroundPosition: 'center', fontFamily: 'system-ui, sans-serif', transition: 'background-image 0.5s ease-in-out' },
    splashContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', textShadow: '2px 2px 4px rgba(0,0,0,0.5)', padding: '20px', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '20px' },
    title: { backgroundColor: '#FFC700', color: '#1C1C1C', padding: '15px 40px', borderRadius: '30px', fontSize: 'clamp(1.5em, 5vw, 2.5em)', fontWeight: 'bold' },
    playButton: { backgroundColor: 'white', color: 'black', padding: '15px 60px', borderRadius: '30px', fontSize: 'clamp(1.2em, 4vw, 2em)', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginTop: '10px' },
    nameInputContainer: { backgroundColor: 'white', padding: '40px', borderRadius: '15px', color: 'black', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '90%', maxWidth: '500px' },
    nameInputLabel: { fontSize: 'clamp(1.5em, 5vw, 2.5em)', fontWeight: 'bold', color: '#333' },
    nameInput: { padding: '15px', fontSize: '1.2rem', width: '100%', borderRadius: '8px', border: '2px solid #ddd', textAlign: 'center', margin: '20px 0' },
    continueButton: { padding: '15px 30px', fontSize: '1.2rem', borderRadius: '8px', border: 'none', backgroundColor: '#FF8C00', color: 'white', cursor: 'pointer', fontWeight: 'bold' }
};

export default function HomePage() {
  const [step, setStep] = useState('splash');
  const [name, setName] = useState('');
  const [settings, setSettings] = useState(null);
  const router = useRouter();

  useEffect(() => {
    sessionStorage.removeItem('playerName');
    const fetchSettings = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/settings`);
            if (res.ok) setSettings(await res.json());
        } catch (err) { console.error("Error al cargar configuración para la página de inicio.", err); }
    };
    fetchSettings();
  }, []);

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      sessionStorage.setItem('playerName', name);
      router.push('/juego');
    } else { alert("Por favor, ingresa un nombre para jugar."); }
  };

  // Usamos la URL del estado si ya cargó, si no, usamos la imagen local como respaldo.
  const splashBackground = settings?.player_splash_image_url || '/PANTALLA-DE-INICIO-MOVIL.png';

  if (step === 'splash') {
    return (
        <div style={{...styles.container, backgroundImage: `url('${splashBackground}')`, backgroundColor: '#111'}}>
            <div style={styles.splashContent}>
                <div style={styles.title}>{settings?.game_title || 'El Crack de las Jugadas'}</div>
                <button style={styles.playButton} onClick={() => setStep('name_input')}>Jugar</button>
            </div>
        </div>
    );
  }

  return (
    <div style={{...styles.container, backgroundColor: '#f0f2f5'}}>
        <div style={styles.nameInputContainer}>
            <h1 style={styles.nameInputLabel}>¿Cuál es tu nombre?</h1>
            <form onSubmit={handleNameSubmit}>
                <input style={styles.nameInput} type="text" placeholder="Escribe tu nombre" value={name} onChange={(e) => setName(e.target.value)} autoFocus/>
                <br />
                <button type="submit" style={styles.continueButton}>Continuar</button>
            </form>
        </div>
    </div>
  );
}
