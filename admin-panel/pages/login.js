import { useState } from 'react';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al iniciar sesión.');
      }

      // Si el login es exitoso, guardamos el token en el almacenamiento local del navegador
      localStorage.setItem('admin_token', data.token);
      // Y redirigimos al dashboard
      router.push('/');

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <form onSubmit={handleSubmit} style={{ width: '300px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Admin Login</h2>
        <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Usuario" required style={{ width: '100%', padding: '8px', marginBottom: '10px' }} />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" required style={{ width: '100%', padding: '8px', marginBottom: '10px' }}/>
        <button type="submit" style={{ width: '100%', padding: '10px' }}>Entrar</button>
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      </form>
    </div>
  );
}
