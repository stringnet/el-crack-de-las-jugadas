import { useState } from 'react';

const QuestionForm = ({ onSubmit, initialData = {} }) => {
  // El estado del formulario se mantiene igual
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

  // --- NUEVOS ESTADOS PARA LA SUBIDA DE VIDEO ---
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  // ---------------------------------------------

  // Función genérica para manejar los cambios de cualquier input de texto
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // --- NUEVA FUNCIÓN PARA MANEJAR LA SUBIDA DEL VIDEO ---
  const handleVideoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadStatus('Subiendo video...');
    
    const uploadFormData = new FormData();
    uploadFormData.append('video', file); // 'video' debe coincidir con el nombre en el backend (multer)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/upload`, {
        method: 'POST',
        body: uploadFormData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || 'Error en la subida del archivo.');
      }
      
      // Ponemos la URL devuelta por el servidor en el campo de texto del formulario
      setFormData(prev => ({ ...prev, video_url: result.video_url }));
      setUploadStatus('¡Video subido con éxito!');

    } catch (err) {
      setUploadStatus(`Error: ${err.message}`);
      console.error(err);
    } finally {
      setUploading(false);
    }
  };
  // ----------------------------------------------------

  // Función que se ejecuta al enviar el formulario completo
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.video_url) {
        alert("Por favor, sube un video primero.");
        return;
    }
    onSubmit(formData);
  };

  // Estilos para mantener la consistencia del formulario
  const inputStyle = { width: '100%', padding: '8px', margin: '5px 0 15px 0', boxSizing: 'border-box', fontSize: '1rem' };
  const labelStyle = { fontWeight: 'bold', marginTop: '10px', display: 'block' };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '20px 0', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      
      <label style={labelStyle}>Texto de la Pregunta</label>
      <input style={inputStyle} type="text" name="question_text" value={formData.question_text} onChange={handleChange} placeholder="Ej: ¿Qué jugador marcó el gol?" required />
      
      {/* --- SECCIÓN DE SUBIDA DE VIDEO --- */}
      <label style={labelStyle}>Paso 1: Subir Archivo de Video</label>
      <input 
        type="file" 
        accept="video/mp4,video/webm" 
        onChange={handleVideoUpload} 
        disabled={uploading}
        style={{ marginBottom: '5px' }}
      />
      {/* Mostramos el estado de la subida */}
      {uploadStatus && <p style={{ fontSize: '0.9em', margin: '0 0 15px 0', fontStyle: 'italic' }}>Estado: {uploadStatus}</p>}
      
      <label style={labelStyle}>Paso 2: URL del Video (se rellenará automáticamente)</label>
      <input style={inputStyle} type="text" name="video_url" value={formData.video_url} onChange={handleChange} placeholder="Sube un video para generar la URL" readOnly required />
      {/* --------------------------------- */}
      
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
