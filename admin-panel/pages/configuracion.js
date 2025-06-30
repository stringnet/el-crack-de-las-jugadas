import { useState, useEffect } from 'react';
import withAuth from '../components/withAuth';

function ConfiguracionPage() {
    // El estado ahora incluye la nueva URL para la pantalla de bienvenida del jugador
    const [settings, setSettings] = useState({
        game_title: '',
        logo_url: '',
        background_url: '',
        font_family: '',
        projection_background_url: '',
        player_splash_image_url: '' // <-- Nuevo campo
    });
    const [status, setStatus] = useState('');
    // Estado para controlar qué archivo se está subiendo
    const [uploading, setUploading] = useState({ projection: false, splash: false });
    const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

    // Carga la configuración actual del backend (sin cambios)
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

    // Maneja los cambios en los campos de texto (sin cambios)
    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prevSettings => ({ ...prevSettings, [name]: value }));
    };

    // --- FUNCIÓN DE SUBIDA DE IMAGEN MEJORADA ---
    // Ahora acepta un 'type' para saber qué imagen se está subiendo
    const handleImageUpload = async (event, type) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(prev => ({ ...prev, [type]: true }));
        setStatus(`Subiendo imagen para ${type}...`);
        
        const uploadFormData = new FormData();
        uploadFormData.append('video', file); // El endpoint es genérico

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`${API_URL}/api/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: uploadFormData,
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.message || 'Error en la subida.');
            
            // Actualizamos la clave correcta en el estado basado en el tipo
            const urlKey = type === 'projection' ? 'projection_background_url' : 'player_splash_image_url';
            setSettings(prev => ({ ...prev, [urlKey]: result.video_url }));
            setStatus('¡Imagen subida! Haz clic en "Guardar" para aplicar el cambio.');

        } catch (err) {
            setStatus(`Error al subir imagen: ${err.message}`);
        } finally {
            setUploading(prev => ({ ...prev, [type]: false }));
        }
    };

    // La función de guardar es la misma, envía todo el objeto 'settings'
    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('Guardando toda la configuración...');
        // ... (lógica de guardado sin cambios)
    };
    
    const inputStyle = { width: '100%', padding: '8px', margin: '5px 0 15px 0', boxSizing: 'border-box', fontSize: '1rem' };
    const labelStyle = { fontWeight: 'bold', marginTop: '10px', display: 'block' };

    return (
        <div>
            <h1>Configuración General del Juego</h1>
            
            <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>

                {/* --- SECCIÓN PARA PANTALLA DE PROYECCIÓN --- */}
                <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '20px' }}>
                    <h2>Pantalla de Proyección (Modo Espera)</h2>
                    <label style={labelStyle}>Imagen de Fondo (ej. la del QR)</label>
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleImageUpload(e, 'projection')} 
                        disabled={uploading.projection}
                        style={{ display: 'block', margin: '10px 0' }}
                    />
                    {settings.projection_background_url && <img src={settings.projection_background_url} alt="Vista previa" style={{ maxWidth: '200px', border: '1px solid #ddd', marginTop: '10px' }} />}
                </div>

                {/* --- NUEVA SECCIÓN PARA LA PANTALLA DE BIENVENIDA DEL JUGADOR --- */}
                <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '30px' }}>
                    <h2>Pantalla de Bienvenida (Jugador)</h2>
                    <label style={labelStyle}>Imagen de Fondo (ej. la del futbolista)</label>
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleImageUpload(e, 'splash')} 
                        disabled={uploading.splash}
                        style={{ display: 'block', margin: '10px 0' }}
                    />
                    {settings.player_splash_image_url && <img src={settings.player_splash_image_url} alt="Vista previa" style={{ maxWidth: '200px', border: '1px solid #ddd', marginTop: '10px' }} />}
                </div>
                
                {/* --- SECCIÓN PARA CONFIGURACIÓN GENERAL --- */}
                 <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '30px' }}>
                    <h2>Textos y Estilos Generales</h2>
                    <label style={labelStyle}>Título del Juego</label>
                    <input style={inputStyle} type="text" name="game_title" value={settings.game_title || ''} onChange={handleChange} placeholder="Ej: El Desafío Deportivo" />
                    {/* ... otros campos como logo_url, background_url, font_family ... */}
                </div>


                <button type="submit" style={{ marginTop: '20px', padding: '15px 30px', fontSize: '1.2rem', width: '100%' }} disabled={uploading.projection || uploading.splash}>
                    {uploading.projection || uploading.splash ? 'Subiendo imagen...' : 'Guardar Toda la Configuración'}
                </button>

                {status && <p style={{ marginTop: '15px', fontWeight: 'bold', textAlign: 'center' }}>{status}</p>}
            </form>
        </div>
    );
}

export default withAuth(ConfiguracionPage);
