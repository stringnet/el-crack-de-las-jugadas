import Link from 'next/link';
import { useRouter } from 'next/router'; // <-- 1. Importamos el hook para manejar la navegación

const Layout = ({ children }) => {
  const router = useRouter(); // <-- 2. Obtenemos la instancia del router

  // --- 3. NUEVA FUNCIÓN PARA CERRAR SESIÓN ---
  const handleLogout = () => {
    // Borramos el token del almacenamiento local del navegador
    localStorage.removeItem('admin_token');
    // Redirigimos al usuario a la página de login
    router.push('/login');
  };

  const navStyle = {
    background: '#333',
    padding: '1rem',
    display: 'flex',
    alignItems: 'center', // Para alinear verticalmente los items
    justifyContent: 'space-between', // Para empujar el botón de logout a la derecha
    gap: '2rem',
  };

  const linkStyle = {
    color: 'white',
    textDecoration: 'none',
    fontSize: '1.2rem',
    marginRight: '2rem', // Añadimos un margen derecho a los links
  };
  
  const logoutButtonStyle = {
      padding: '8px 15px',
      fontSize: '1rem',
      backgroundColor: '#f44336', // Un color rojo para la acción de salir
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer'
  }

  const mainStyle = {
      padding: '2rem',
  }

  // --- 4. LÓGICA PARA OCULTAR EL LAYOUT EN LA PÁGINA DE LOGIN ---
  // Si la ruta actual es '/login', devolvemos solo el contenido de la página (el formulario)
  if (router.pathname === '/login') {
    return <>{children}</>;
  }

  // Si estamos en cualquier otra página, mostramos el layout completo con la navegación
  return (
    <div>
      <nav style={navStyle}>
        <div>
          <Link href="/" style={linkStyle}>Dashboard</Link>
          <Link href="/preguntas" style={linkStyle}>Preguntas</Link>
          <Link href="/configuracion" style={linkStyle}>Configuración</Link>
        </div>
        <div>
            {/* --- 5. AÑADIMOS EL BOTÓN DE LOGOUT --- */}
            <button onClick={handleLogout} style={logoutButtonStyle}>Cerrar Sesión</button>
        </div>
      </nav>
      <main style={mainStyle}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
