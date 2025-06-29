import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { getPlayerSocket } from '../lib/socket';
import Layout from '../components/Layout';

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    const socket = getPlayerSocket();

    const handleGameStarted = () => {
      console.log('Evento global game_started recibido.');
      
      // --- ESTA ES LA CORRECCIÓN CLAVE ---
      // Solo redirigimos al usuario si NO está ya en la página de ranking o en la de proyección.
      if (router.pathname !== '/ranking' && router.pathname !== '/proyeccion') {
        console.log('Redirigiendo a /juego...');
        router.push('/juego');
      } else {
        console.log('No se redirige, el usuario es un espectador en /ranking o /proyeccion.');
      }
    };

    socket.on('server:game_started', handleGameStarted);

    return () => {
      socket.off('server:game_started', handleGameStarted);
    };
  }, [router]);

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;
