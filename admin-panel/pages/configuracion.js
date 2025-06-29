import { useState, useEffect } from 'react';
import withAuth from '../components/withAuth';

function ConfiguracionPage() {
    // Estado para guardar todos los valores de configuración
    const [settings, setSettings] = useState({
        game_title: '',
        logo_url: '',
        background_url: '',
        font_family: '',
        projection_background_url: '' // Campo para la nueva imagen de fondo
    });

    // Estado para mostrar mensajes al usuario
    const [status, setStatus] = useState('');
    const [uploading, setUploading] = useState(false); // Estado para saber si se está subiendo un archivo
    const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

    // Carga la configuración actual del backend cuando la página se monta
    useEffect(() => {
        setStatus('Cargando configuración...');
        fetch(`${API_URL}/api/settings`)
            .then(res => res.ok ? res.json() : {})
            .then(data => {
                setSettings(prev => ({ ...prev, ...data }));
                setStatus('');
            })
            .catch(err => {
                console.error("Error al cargar la configuración inicial", err);
                setStatus('No se pudo cargar la configuración.');
            });
    }, [API_URL]);

    // Maneja los cambios en los campos de texto
    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prevSettings => ({ ...prevSettings, [name]: value }));
    };

    // --- NUEVA FUNCIÓN PARA MANEJAR LA SUBIDA DE LA IMAGEN DE FONDO ---
    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        setStatus('Subiendo imagen de fondo...');
        
        const uploadFormData = new FormData();
        uploadFormData.append('video', file); // El backend espera el campo 'video', es genérico

        try {
            const res = await fetch(`${API_URL}/api/upload`, {
                method: 'POST',
                body: uploadFormData,
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.message || 'Error en la subida.');
            
            setSettings(prev => ({ ...prev, projection_background_url: result.video_url }));
            setStatus('¡Imagen subida! Haz clic en "Guardar" para aplicar el cambio.');

        } catch (err) {
            setStatus(`Error al subir imagen: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    // Maneja el guardado de TODA la configuración
    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('Guardando toda la configuración...');
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`${API_URL}/api/settings`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(settings),
            });

            if (res.ok) {
                setStatus('¡Configuración guardada con éxito!');
            } else {
                setStatus('Error al guardar la configuración.');
            }
        } catch (err) {
            setStatus('Error de red al intentar guardar.');
            console.error(err);
        }
    };
    
    const inputStyle = { width: '100%', padding: '8px', margin: '5px 0 15px 0', boxSizing: 'border-box', fontSize: '1rem' };
    const labelStyle = { fontWeight: 'bold', marginTop: '10px', display: 'block' };

    return (
        <div>
            <h1>Configuración General del Juego</h1>
            
            {/* El formulario ahora llama a handleSubmit */}
            <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>

                {/* --- NUEVA SECCIÓN PARA LA PANTALLA DE PROYECCIÓN --- */}
                <div style={{ padding: '20px', border: '2px solid #007bff', borderRadius: '8px', marginBottom: '30px' }}>
                    <h2>Pantalla de Proyección (Modo Espera)</h2>
                    <label style={labelStyle}>Imagen de Fondo (1920x1080 recomendado)</label>
                    <input 
                    type="file" 
                    accept="image/jpeg, image/png, image/webp" 
                    onChange={handleImageUpload} 
                    disabled={uploading}
                    style={{ display: 'block', margin: '10px 0' }}
                    />
                    {settings.projection_background_url && (
                        <div>
                            <p>Vista previa actual:</p>
                            <img src={settings.projection_background_url} alt="Vista previa del fondo" style={{ width: '100%', border: '1px solid #ddd', borderRadius: '4px' }} />
                        </div>
                    )}
                </div>
                
                {/* --- SECCIÓN PARA LA CONFIGURACIÓN GENERAL --- */}
                <label style={labelStyle}>Título del Juego</label>
                <input style={inputStyle} type="text" name="game_title" value={settings.game_title || ''} onChange={handleChange} placeholder="Ej: El Desafío Deportivo" />

                <label style={labelStyle}>URL del Logo Principal</label>
                <input style={inputStyle} type="text" name="logo_url" value={settings.logo_url || ''} onChange={handleChange} placeholder="https://ejemplo.com/logo.png" />

                <label style={labelStyle}>URL Imagen de Fondo (Pantalla de Jugador)</label>
                <input style={inputStyle} type="text" name="background_url" value={settings.background_url || ''} onChange={handleChange} placeholder="https://ejemplo.com/fondo.jpg" />
                
                <label style={labelStyle}>Fuente de Google Fonts (ej. "Roboto")</label>
                <input style={inputStyle} type="text" name="font_family" value={settings.font_family || ''} onChange={handleChange} placeholder="Roboto" />

                <button type="submit" style={{ marginTop: '20px', padding: '10px 20px', fontSize: '1rem', width: '100%' }} disabled={uploading}>
                    {uploading ? 'Subiendo imagen...' : 'Guardar Toda la Configuración'}
                </button>

                {status && <p style={{ marginTop: '15px', fontWeight: 'bold', textAlign: 'center' }}>{status}</p>}
            </form>
        </div>
    );
}

// Envolvemos con el guardia de seguridad
export default withAuth(ConfiguracionPage);
