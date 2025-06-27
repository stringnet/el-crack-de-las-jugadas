// pages/_app.js
import Layout from '../components/Layout';
// Crearemos un archivo de estilos globales simple para centrar contenido, etc.
// import '../styles/globals.css'; 

function MyApp({ Component, pageProps }) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;
