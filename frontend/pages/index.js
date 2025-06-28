import { useState, useEffect } from 'react'; // Importa useEffect
import { useRouter } from 'next/router';

export default function Home() {
  const [name, setName] = useState('');
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      // Guardar nombre y redirigir
      sessionStorage.setItem('playerName', name);
      router.push('/juego');
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>El Crack de las Jugadas</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="¿Cuál es tu nombre?"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: '10px', fontSize: '1rem', margin: '20px' }}
        />
        <button type="submit" style={{ padding: '10px 20px', fontSize: '1rem' }}>
          Jugar
        </button>
      </form>
    </div>
  );
}
