// admin-panel/pages/index.js
import { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin`);

export default function AdminDashboard() {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState('');

  useEffect(() => {
    // Cargar las preguntas disponibles desde la API para el selector
    const fetchQuestions = async () => {
      // const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/questions`);
      // const data = await res.json();
      const data = [{id: 1, question_text: "Pregunta de ejemplo 1"}, {id: 2, question_text: "Pregunta de ejemplo 2"}]; // Placeholder
      setQuestions(data);
      if (data.length > 0) {
        setSelectedQuestionId(data[0].id);
      }
    };
    fetchQuestions();
  }, []);

  const sendQuestion = () => {
    const questionToSend = questions.find(q => q.id == selectedQuestionId);
    if (questionToSend) {
      socket.emit('admin:next_question', questionToSend);
      alert(`Pregunta "${questionToSend.question_text}" enviada!`);
    }
  };
  
  return (
    <div>
      <h1>Dashboard de Control</h1>
      <div style={{ background: '#eee', padding: '20px', borderRadius: '8px' }}>
        <h2>Lanzar Pregunta</h2>
        <select value={selectedQuestionId} onChange={(e) => setSelectedQuestionId(e.target.value)} style={{ padding: '10px', minWidth: '300px' }}>
          {questions.map(q => <option key={q.id} value={q.id}>{q.question_text}</option>)}
        </select>
        <button onClick={sendQuestion} style={{ padding: '10px 20px', marginLeft: '10px' }}>Enviar Siguiente Pregunta</button>
      </div>
       <div style={{ background: '#fee', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
        <h2>Control del Juego</h2>
        <button onClick={() => socket.emit('admin:start_game')} style={{ padding: '10px 20px' }}>Iniciar Juego</button>
        <button onClick={() => socket.emit('admin:end_game')} style={{ padding: '10px 20px', marginLeft: '10px' }}>Finalizar Juego</button>
      </div>
    </div>
  );
}
