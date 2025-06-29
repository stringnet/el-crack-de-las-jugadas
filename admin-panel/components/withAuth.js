import { useEffect } from 'react';
import { useRouter } from 'next/router';

const withAuth = (WrappedComponent) => {
  const Wrapper = (props) => {
    const router = useRouter();

    useEffect(() => {
      const token = localStorage.getItem('admin_token');
      // Si no hay token, lo redirigimos a la página de login
      if (!token) {
        router.replace('/login');
      }
    }, [router]);

    // Si hay token, mostramos la página que nos pidieron
    return <WrappedComponent {...props} />;
  };
  return Wrapper;
};

export default withAuth;
