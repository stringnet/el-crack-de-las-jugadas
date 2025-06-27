// components/Timer.jsx
import { useState, useEffect } from 'react';

const Timer = ({ duration, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    // Asegurarse de que no corra si el tiempo ya es 0
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    // Iniciar el intervalo que reduce el tiempo cada segundo
    const intervalId = setInterval(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    // Limpiar el intervalo cuando el componente se desmonte o el tiempo cambie
    return () => clearInterval(intervalId);
  }, [timeLeft, onTimeUp]);

  return (
    <div style={{ fontSize: '2em', fontWeight: 'bold', margin: '20px' }}>
      Tiempo: {timeLeft}
    </div>
  );
};

export default Timer;
