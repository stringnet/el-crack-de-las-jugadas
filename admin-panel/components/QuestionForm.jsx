// admin-panel/components/QuestionForm.jsx
import { useState } from 'react';

const QuestionForm = ({ onSubmit, initialData = {} }) => {
  // El estado inicial ahora incluye todos los campos con valores por defecto
  const [formData, setFormData] = useState({
    question_text: initialData.question_text || '',
    video_url: initialData.video_url || '',
    pause_timestamp_secs: initialData.pause_timestamp_secs || 5,
    points: initialData.points || 10,
    time_limit_secs: initialData.time_limit_secs || 15,
    option_1: initialData.option_1 || '',
    option_2: initialData.option_2 || '',
    option_3: initialData.option_3 || '',
    option_4: initialData.option_4 || '',
    correct_option: initialData.correct_option || 1,
  });

  // Función genérica para manejar los cambios de cualquier input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Función que se ejecuta al enviar el formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Estilos para mantener la consistencia del formulario
  const inputStyle = { width: '100%', padding: '8px', margin: '5px 0 15px 0', boxSizing: 'border-box', fontSize: '1rem' };
  const labelStyle = { fontWeight: 'bold', marginTop: '10px', display: 'block' };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '20px 0', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      
      <label style={labelStyle}>Texto de la Pregunta</label>
      <input style={inputStyle} type="text" name="question_text" value={formData.question_text} onChange={handleChange} placeholder="Ej: ¿Qué jugador marcó el gol?" required />
      
      <label style={labelStyle}>URL del Video</label>
      <input style={inputStyle} type="text" name="video_url" value={formData.video_url} onChange={handleChange} placeholder="https://ejemplo.com/video.mp4" required />
      
      <label style={labelStyle}>Segundo de Pausa del Video</label>
      <input style={inputStyle} type="number" name="pause_timestamp_secs" value={formData.pause_timestamp_secs} onChange={handleChange} required />

      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1 }}>
            <label style={labelStyle}>Puntaje por Respuesta Correcta</label>
            <input style={inputStyle} type="number" name="points" value={formData.points} onChange={handleChange} required />
        </div>
        <div style={{ flex: 1 }}>
            <label style={labelStyle}>Tiempo para Responder (segundos)</label>
            <input style={inputStyle} type="number" name="time_limit_secs" value={formData.time_limit_secs} onChange={handleChange} required />
        </div>
      </div>
      
      <label style={labelStyle}>Opción 1</label>
      <input style={inputStyle} type="text" name="option_1" value={formData.option_1} onChange={handleChange} required />
      
      <label style={labelStyle}>Opción 2</label>
      <input style={inputStyle} type="text" name="option_2" value={formData.option_2} onChange={handleChange} required />
      
      <label style={labelStyle}>Opción 3</label>
      <input style={inputStyle} type="text" name="option_3" value={formData.option_3} onChange={handleChange} required />
      
      <label style={labelStyle}>Opción 4</label>
      <input style={inputStyle} type="text" name="option_4" value={formData.option_4} onChange={handleChange} required />

      <label style={labelStyle}>Respuesta Correcta</label>
      <select style={inputStyle} name="correct_option" value={formData.correct_option} onChange={handleChange}>
        <option value={1}>Opción 1</option>
        <option value={2}>Opción 2</option>
        <option value={3}>Opción 3</option>
        <option value={4}>Opción 4</option>
      </select>

      <button type="submit" style={{ marginTop: '20px', padding: '10px 20px', fontSize: '1rem' }}>Guardar Pregunta</button>
    </form>
  );
};

export default QuestionForm;
