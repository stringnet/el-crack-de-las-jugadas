import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { getPlayerSocket } from '../lib/socket';
import Layout from '../components/Layout';

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  // Este efecto se encarga de la redirección global cuando inicia un juego.
  // Esta lógica no se modifica.
  useEffect(() => {
    const socket = getPlayerSocket();

    const handleGameStarted = () => {
      // Solo redirigimos si el usuario NO está en una página de "espectador".
      if (router.pathname !== '/ranking' && router.pathname !== '/proyeccion') {
        router.push('/juego');
      }
    };

    socket.on('server:game_started', handleGameStarted);

    return () => {
      socket.off('server:game_started', handleGameStarted);
    };
  }, [router]);


  // --- ESTA ES LA NUEVA LÓGICA DE RENDERIZADO CONDICIONAL ---
  
  // Si la ruta actual es la de proyección, devolvemos el componente de la página
  // directamente, sin el Layout, para que ocupe toda la pantalla.
  if (router.pathname === '/proyeccion') {
    return <Component {...pageProps} />;
  }
  
  // Para todas las demás páginas, sí usamos el Layout que les da el fondo gris y los márgenes.
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;
