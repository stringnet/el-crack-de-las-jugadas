// admin-panel/components/QuestionForm.jsx
import { useState } from 'react';

const QuestionForm = ({ onSubmit, initialData = {} }) => {
  const [formData, setFormData] = useState({
    question_text: initialData.question_text || '',
    video_url: initialData.video_url || '',
    pause_timestamp_secs: initialData.pause_timestamp_secs || 0,
    points: initialData.points || 10,
    option_1: initialData.option_1 || '',
    option_2: initialData.option_2 || '',
    option_3: initialData.option_3 || '',
    option_4: initialData.option_4 || '',
    correct_option: initialData.correct_option || 1,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Estilos simples para el formulario
  const inputStyle = { width: '100%', padding: '8px', margin: '5px 0', boxSizing: 'border-box' };
  const labelStyle = { fontWeight: 'bold', marginTop: '10px', display: 'block' };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '20px 0', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <label style={labelStyle}>Texto de la Pregunta</label>
      <input style={inputStyle} type="text" name="question_text" value={formData.question_text} onChange={handleChange} required />
      
      <label style={labelStyle}>URL del Video</label>
      <input style={inputStyle} type="text" name="video_url" value={formData.video_url} onChange={handleChange} required />
      
      {/* ... otros campos ... */}
      
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

      <button type="submit" style={{ marginTop: '20px', padding: '10px 20px' }}>Guardar Pregunta</button>
    </form>
  );
};

export default QuestionForm;
