import { useState, useEffect } from 'react';
import io from 'socket.io-client';

// La conexión a socket.io se mantiene igual
let socket; // Lo definimos fuera para que no se reinicie en cada render

export default function AdminDashboard() {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState('');
  const [status, setStatus] = useState('Inicializando...');

  // Este efecto se ejecuta una sola vez al cargar la página
  useEffect(() => {
    // Inicializamos la conexión del socket
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    socket = io(`${backendUrl}/admin`);

    // Función para cargar las preguntas desde la API
    const fetchQuestions = async () => {
        setStatus('Cargando preguntas...');
        try {
            // --- ESTA ES LA PARTE CLAVE - AHORA LLAMA A LA API REAL ---
            const res = await fetch(`${backendUrl}/api/questions`);
            if (res.ok) {
                const data = await res.json();
                setQuestions(data);
                // Si hay preguntas, seleccionamos la primera por defecto
                if (data.length > 0) {
                    setSelectedQuestionId(data[0].id);
                }
                setStatus(''); // Limpiamos el estado si todo va bien
            } else {
                setStatus('Error al cargar las preguntas.');
            }
        } catch (err) {
            setStatus('Error de red al cargar preguntas.');
            console.error(err);
        }
    };

    fetchQuestions();

    // Limpiamos la conexión del socket cuando el componente se desmonte
    return () => {
        if(socket) socket.disconnect();
    }
  }, []);

  // Función para enviar la pregunta seleccionada a través de sockets
  const sendQuestion = () => {
    if (!socket) {
        alert("El socket no está conectado.");
        return;
    }
    // Buscamos el objeto completo de la pregunta seleccionada en nuestro estado
    const questionToSend = questions.find(q => q.id == selectedQuestionId);
    if (questionToSend) {
      socket.emit('admin:next_question', questionToSend);
      alert(`Pregunta "${questionToSend.question_text}" enviada a las pantallas.`);
    } else {
      alert("Por favor, selecciona una pregunta válida.");
    }
  };
  
  return (
    <div>
      <h1>Dashboard de Control</h1>
      
      <div style={{ background: '#eee', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>Lanzar Pregunta</h2>
        {questions.length > 0 ? (
          <>
            <select 
              value={selectedQuestionId} 
              onChange={(e) => setSelectedQuestionId(e.target.value)} 
              style={{ padding: '10px', minWidth: '300px', fontSize: '1rem' }}
            >
              {questions.map(q => (
                <option key={q.id} value={q.id}>
                  ({q.id}) {q.question_text}
                </option>
              ))}
            </select>
            <button 
              onClick={sendQuestion} 
              style={{ padding: '10px 20px', marginLeft: '10px', fontSize: '1rem' }}
            >
              Enviar Siguiente Pregunta
            </button>
          </>
        ) : (
          <p>{status || "No hay preguntas disponibles. Créalas en la pestaña 'Preguntas'."}</p>
        )}
      </div>

       <div style={{ background: '#fee', padding: '20px', borderRadius: '8px' }}>
        <h2>Control General del Juego</h2>
        <button onClick={() => socket.emit('admin:start_game')} style={{ padding: '10px 20px', fontSize: '1rem' }}>
          Iniciar Juego
        </button>
        <button onClick={() => socket.emit('admin:end_game')} style={{ padding: '10px 20px', marginLeft: '10px', fontSize: '1rem' }}>
          Finalizar Juego
        </button>
      </div>
    </div>
  );
}
