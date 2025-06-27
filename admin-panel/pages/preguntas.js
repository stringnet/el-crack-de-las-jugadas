import { useState, useEffect } from 'react';
import QuestionForm from '../components/QuestionForm';

export default function PreguntasPage() {
  const [questions, setQuestions] = useState([]);
  const [status, setStatus] = useState('');

  // Carga las preguntas existentes del backend cuando la página se monta
  useEffect(() => {
    const fetchQuestions = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/questions`);
            if (res.ok) {
                const data = await res.json();
                setQuestions(data);
            } else {
                console.error("Error al cargar las preguntas");
            }
        } catch (err) {
            console.error("Error de red al cargar preguntas", err);
        }
    };
    fetchQuestions();
  }, []);

  // Esta es la función clave que ahora SÍ tiene la lógica real
  const handleCreateQuestion = async (formData) => {
    setStatus('Guardando pregunta...');
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });

        if (res.ok) {
            const newQuestion = await res.json();
            // Añadimos la nueva pregunta (devuelta por el API) a la lista visible en pantalla
            setQuestions(prev => [...prev, newQuestion]);
            setStatus('¡Pregunta guardada exitosamente!');
        } else {
            setStatus('Error al guardar la pregunta.');
        }
    } catch (err) {
        setStatus('Error de red al guardar la pregunta.');
        console.error(err);
    }
  };

  return (
    <div>
      <h1>Gestión de Preguntas</h1>
      
      <h2>Crear Nueva Pregunta</h2>
      {/* El componente QuestionForm ahora llamará a nuestra función real */}
      <QuestionForm onSubmit={handleCreateQuestion} />
      {status && <p>{status}</p>}

      <h2 style={{ marginTop: '40px' }}>Banco de Preguntas</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {questions.length > 0 ? (
            questions.map(q => (
              <li key={q.id} style={{ background: '#f9f9f9', padding: '10px', border: '1px solid #ddd', marginBottom: '5px', borderRadius: '5px' }}>
                ({q.id}) {q.question_text}
              </li>
            ))
        ) : (
            <li>No hay preguntas en la base de datos.</li>
        )}
      </ul>
    </div>
  );
}
