// admin-panel/pages/preguntas.js
import { useState, useEffect } from 'react';
import QuestionForm from '../components/QuestionForm';

export default function PreguntasPage() {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    // Cargar preguntas existentes
    const fetchQuestions = async () => {
        // const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/questions`);
        // const data = await res.json();
        const data = [{id: 1, question_text: "Pregunta de ejemplo cargada"}]; // Placeholder
        setQuestions(data);
    };
    fetchQuestions();
  }, []);

  const handleCreateQuestion = async (formData) => {
    // Lógica para enviar la nueva pregunta a la API
    // const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/questions`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(formData),
    // });
    // if (res.ok) {
    //   const newQuestion = await res.json();
    //   setQuestions(prev => [...prev, newQuestion]);
    //   alert('Pregunta creada!');
    // }
    alert('Pregunta creada (simulado)');
    setQuestions(prev => [...prev, {...formData, id: Date.now()}]);
  };

  return (
    <div>
      <h1>Gestión de Preguntas</h1>
      
      <h2>Crear Nueva Pregunta</h2>
      <QuestionForm onSubmit={handleCreateQuestion} />

      <h2>Banco de Preguntas</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {questions.map(q => (
          <li key={q.id} style={{ background: '#f9f9f9', padding: '10px', border: '1px solid #ddd', marginBottom: '5px' }}>
            {q.question_text}
          </li>
        ))}
      </ul>
    </div>
  );
}
