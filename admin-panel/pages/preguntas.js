import { useState, useEffect } from 'react';
import QuestionForm from '../components/QuestionForm';

export default function PreguntasPage() {
  const [questions, setQuestions] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null); // Estado para la pregunta en edición
  const [status, setStatus] = useState('');
  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  // Carga las preguntas existentes del backend cuando la página se monta
  useEffect(() => {
    setStatus('Cargando preguntas...');
    const fetchQuestions = async () => {
        try {
            const res = await fetch(`${API_URL}/api/questions`);
            if (res.ok) {
                const data = await res.json();
                setQuestions(data);
                setStatus('');
            } else {
                setStatus('Error al cargar las preguntas.');
            }
        } catch (err) {
            setStatus('Error de red al cargar preguntas.');
            console.error(err);
        }
    };
    fetchQuestions();
  }, [API_URL]);

  // Función unificada para manejar la creación (POST) y actualización (PUT)
  const handleSubmit = async (formData) => {
    setStatus('Guardando...');
    const isEditing = !!editingQuestion;
    const url = isEditing ? `${API_URL}/api/questions/${editingQuestion.id}` : `${API_URL}/api/questions`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('La petición al servidor falló');
      }
      
      const savedQuestion = await res.json();
      
      if (isEditing) {
        // Si estábamos editando, actualizamos la pregunta en la lista local
        setQuestions(questions.map(q => q.id === savedQuestion.id ? savedQuestion : q));
        setStatus('¡Pregunta actualizada con éxito!');
      } else {
        // Si estábamos creando, la añadimos al final de la lista local
        setQuestions([...questions, savedQuestion]);
        setStatus('¡Pregunta creada con éxito!');
      }
      // Limpiamos el formulario y el estado de edición
      setEditingQuestion(null);

    } catch (err) {
      setStatus('Error al guardar la pregunta.');
      console.error(err);
    }
  };

  // Función para manejar el clic en el botón "Borrar"
  const handleDelete = async (questionId) => {
    // Pedimos confirmación al usuario para evitar borrados accidentales
    if (!window.confirm("¿Estás seguro de que quieres borrar esta pregunta? Esta acción es irreversible.")) {
      return;
    }

    setStatus('Borrando...');
    try {
      const res = await fetch(`${API_URL}/api/questions/${questionId}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Falló el borrado en el servidor');
      }
      
      // Quitamos la pregunta de la lista local para que la UI se actualice al instante
      setQuestions(questions.filter(q => q.id !== questionId));
      setStatus("Pregunta borrada exitosamente.");

    } catch (err) {
      setStatus("Error al borrar la pregunta.");
      console.error(err);
    }
  };

  return (
    <div>
      <h1>Gestión de Preguntas</h1>
      
      {/* Pasamos los props necesarios al formulario inteligente */}
      <QuestionForm 
        onSubmit={handleSubmit}
        initialData={editingQuestion}
        onCancelEdit={() => setEditingQuestion(null)}
      />
      {status && <p>{status}</p>}

      <h2 style={{ marginTop: '40px' }}>Banco de Preguntas</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {questions.length > 0 ? (
            questions.map(q => (
              <li key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9f9f9', padding: '10px', border: '1px solid #ddd', marginBottom: '5px', borderRadius: '5px' }}>
                {/* Mostramos el texto de la pregunta */}
                <span style={{ flexGrow: 1 }}>
                  <strong>ID: {q.id}</strong> - {q.question_text}
                </span>
                {/* Contenedor para los botones de acción */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setEditingQuestion(q)} style={{ padding: '5px 10px' }}>Editar</button>
                  <button onClick={() => handleDelete(q.id)} style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none' }}>Borrar</button>
                </div>
              </li>
            ))
        ) : (
            <li>No hay preguntas en la base de datos o están cargando...</li>
        )}
      </ul>
    </div>
  );
}
