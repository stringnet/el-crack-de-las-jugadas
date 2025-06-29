import { useState, useEffect } from 'react';
import { getAdminSocket } from '../lib/socket';
import withAuth from '../components/withAuth'; // <-- 1. IMPORTAMOS EL GUARDIA DE SEGURIDAD

function AdminDashboard() { // <-- 2. La función ahora es una declaración normal, no una exportación por defecto
  const [questions, setQuestions] = useState([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState('');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const adminSocket = getAdminSocket();
    setSocket(adminSocket);

    adminSocket.on('admin:feedback', (data) => {
      alert(`Mensaje del Servidor: ${data.message}`);
    });

    const fetchQuestions = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/questions`);
        if (res.ok) {
            const data = await res.json();
            setQuestions(data);
            if (data.length > 0) {
                setSelectedQuestionId(data[0].id);
            }
        }
      } catch (err) { console.error(err); }
    };
    fetchQuestions();

    return () => {
      if (adminSocket) {
        adminSocket.off('admin:feedback');
      }
    }
  }, []);

  const sendQuestion = () => {
    if (!socket) return;
    const questionToSend = questions.find(q => q.id == selectedQuestionId);
    if (questionToSend) {
      socket.emit('admin:next_question', questionToSend);
    }
  };

  const startGame = () => {
    if (socket) socket.emit('admin:start_game');
  }

  const endGame = () => {
    if (socket) socket.emit('admin:end_game');
  }
  
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
                <option key={q.id} value={q.id}>({q.id}) {q.question_text}</option>
              ))}
            </select>
            <button onClick={sendQuestion} style={{ padding: '10px 20px', marginLeft: '10px', fontSize: '1rem' }}>
              Enviar Pregunta
            </button>
          </>
        ) : <p>Cargando preguntas o no hay ninguna creada...</p>}
      </div>

       <div style={{ background: '#fee', padding: '20px', borderRadius: '8px' }}>
        <h2>Control General del Juego</h2>
        <button onClick={startGame} style={{ padding: '10px 20px', fontSize: '1rem' }}>
          Iniciar Juego (Reiniciar)
        </button>
        <button onClick={endGame} style={{ padding: '10px 20px', marginLeft: '10px', fontSize: '1rem' }}>
          Finalizar Juego
        </button>
      </div>
    </div>
  );
}

// --- 3. EXPORTAMOS LA VERSIÓN PROTEGIDA DEL DASHBOARD ---
export default withAuth(AdminDashboard);
