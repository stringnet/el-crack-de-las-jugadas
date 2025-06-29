import { useState, useEffect } from 'react';

// Añadimos 'onCancelEdit' a los props para poder limpiar el formulario desde el padre
const QuestionForm = ({ onSubmit, initialData = null, onCancelEdit }) => {
  // Definimos un estado base para un formulario vacío
  const blankForm = {
    question_text: '',
    video_url: '',
    pause_timestamp_secs: 5,
    points: 10,
    time_limit_secs: 15,
    option_1: '',
    option_2: '',
    option_3: '',
    option_4: '',
    correct_option: 1,
  };

  const [formData, setFormData] = useState(blankForm);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  // ESTE EFECTO ES LA CLAVE PARA EL MODO DE EDICIÓN
  // Se activa cada vez que la prop 'initialData' cambia.
  useEffect(() => {
    if (initialData) {
      // Si recibimos datos para editar, llenamos el estado del formulario con ellos.
      setFormData(initialData);
    } else {
      // Si initialData es null, reseteamos el formulario al estado vacío.
      setFormData(blankForm);
    }
  }, [initialData]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleVideoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadStatus('Subiendo video...');
    
    const uploadFormData = new FormData();
    uploadFormData.append('video', file);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/upload`, {
        method: 'POST',
        body: uploadFormData,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Error en la subida.');
      
      setFormData(prev => ({ ...prev, video_url: result.video_url }));
      setUploadStatus('¡Video subido con éxito!');
    } catch (err) {
      setUploadStatus(`Error: ${err.message}`);
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.video_url) {
        alert("Por favor, sube o proporciona una URL de video primero.");
        return;
    }
    onSubmit(formData);
  };

  const inputStyle = { width: '100%', padding: '8px', margin: '5px 0 15px 0', boxSizing: 'border-box', fontSize: '1rem' };
  const labelStyle = { fontWeight: 'bold', marginTop: '10px', display: 'block' };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '20px 0', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      
      {/* Título dinámico */}
      <h2>{initialData ? 'Editar Pregunta' : 'Crear Nueva Pregunta'}</h2>
      
      <label style={labelStyle}>Texto de la Pregunta</label>
      <input style={inputStyle} type="text" name="question_text" value={formData.question_text} onChange={handleChange} placeholder="Ej: ¿Qué jugador marcó el gol?" required />
      
      <label style={labelStyle}>Paso 1: Subir Archivo de Video (Opcional si ya tienes una URL)</label>
      <input 
        type="file" 
        accept="video/mp4,video/webm" 
        onChange={handleVideoUpload} 
        disabled={uploading}
        style={{ marginBottom: '5px' }}
      />
      {uploadStatus && <p style={{ fontSize: '0.9em', margin: '0 0 15px 0', fontStyle: 'italic' }}>Estado: {uploadStatus}</p>}
      
      <label style={labelStyle}>Paso 2: URL del Video</label>
      {/* Ya no es 'readOnly' para permitir pegar URLs, pero la subida lo sobreescribe */}
      <input style={inputStyle} type="text" name="video_url" value={formData.video_url} onChange={handleChange} placeholder="Sube un video o pega una URL directa" required />
      
      <label style={labelStyle}>Segundo de Pausa del Video</label>
      <input style={inputStyle} type="number" name="pause_timestamp_secs" value={formData.pause_timestamp_secs} onChange={handleChange} required />

      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1 }}>
            <label style={labelStyle}>Puntaje</label>
            <input style={inputStyle} type="number" name="points" value={formData.points} onChange={handleChange} required />
        </div>
        <div style={{ flex: 1 }}>
            <label style={labelStyle}>Tiempo Límite (seg)</label>
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

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '20px' }}>
        <button type="submit" style={{ padding: '10px 20px', fontSize: '1rem' }}>
          {/* Texto del botón dinámico */}
          {initialData ? 'Actualizar Pregunta' : 'Guardar Pregunta'}
        </button>
        {/* Si estamos editando, mostramos un botón para cancelar */}
        {initialData && (
          <button type="button" onClick={onCancelEdit} style={{ padding: '10px 20px', fontSize: '1rem', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px' }}>
            Cancelar Edición
          </button>
        )}
      </div>
    </form>
  );
};

export default QuestionForm;
