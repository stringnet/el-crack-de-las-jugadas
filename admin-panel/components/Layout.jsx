// admin-panel/components/Layout.jsx
import Link from 'next/link';

const Layout = ({ children }) => {
  const navStyle = {
    background: '#333',
    padding: '1rem',
    display: 'flex',
    justifyContent: 'center',
    gap: '2rem',
  };
  const linkStyle = {
    color: 'white',
    textDecoration: 'none',
    fontSize: '1.2rem',
  };
  const mainStyle = {
      padding: '2rem',
  }

  return (
    <div>
      <nav style={navStyle}>
        <Link href="/" style={linkStyle}>Dashboard</Link>
        <Link href="/preguntas" style={linkStyle}>Preguntas</Link>
        <Link href="/configuracion" style={linkStyle}>Configuración</Link>
      </nav>
      <main style={mainStyle}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
