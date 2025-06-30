import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { getPlayerSocket } from '../lib/socket';
import Layout from '../components/Layout';

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    const socket = getPlayerSocket();
    const handleGameStarted = () => {
      // No redirigimos si el usuario está en una página de "espectador".
      if (router.pathname !== '/ranking' && router.pathname !== '/proyeccion') {
        router.push('/juego');
      }
    };
    socket.on('server:game_started', handleGameStarted);
    return () => {
      socket.off('server:game_started', handleGameStarted);
    };
  }, [router]);

  // Si la ruta es la de proyección O la de inicio, no usamos el Layout general.
  const noLayoutRoutes = ['/proyeccion', '/'];
  if (noLayoutRoutes.includes(router.pathname)) {
    return <Component {...pageProps} />;
  }
  
  // Para todas las demás páginas (juego, ranking), sí usamos el Layout.
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;
