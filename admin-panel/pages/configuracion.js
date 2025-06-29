// admin-panel/pages/configuracion.js
import { useState, useEffect } from 'react';
import withAuth from '../components/withAuth'; // <-- 1. Importamos el guardia

function ConfiguracionPage() {
    // Estado para guardar los valores de los campos del formulario
    const [settings, setSettings] = useState({
        logo_url: '',
        background_url: '',
        font_family: '',
        game_title: '' // Añadimos el nuevo campo que creamos como ejemplo
    });

    // Estado para mostrar mensajes al usuario (ej. "Guardando...", "Éxito!")
    const [status, setStatus] = useState('');

    // Este efecto se ejecuta una sola vez cuando la página carga
    useEffect(() => {
        // Hacemos una petición a nuestro backend para obtener la configuración actual
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/settings`)
            .then(res => res.json())
            .then(data => {
                // Rellenamos el estado 'settings' con los datos de la base de datos
                setSettings(data);
            })
            .catch(err => {
                console.error("Error al cargar la configuración inicial", err);
                setStatus('No se pudo cargar la configuración.');
            });
    }, []); // El array vacío [] asegura que se ejecute solo una vez

    // Esta función maneja los cambios en cualquier campo del formulario
    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prevSettings => ({
            ...prevSettings,
            [name]: value
        }));
    };

    // Esta función se ejecuta cuando se envía el formulario
    const handleSubmit = async (e) => {
        e.preventDefault(); // Evita que la página se recargue
        setStatus('Guardando...'); // Informamos al usuario
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings), // Enviamos toda la configuración al backend
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

    // Estilos para hacer el formulario más legible
    const inputStyle = { width: '100%', padding: '8px', margin: '5px 0 15px 0', boxSizing: 'border-box', fontSize: '1rem' };
    const labelStyle = { fontWeight: 'bold', marginTop: '10px', display: 'block' };

    return (
        <div>
            <h1>Configuración General del Juego</h1>
            <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
                <label style={labelStyle}>Título del Juego</label>
                <input
                    style={inputStyle}
                    type="text"
                    name="game_title"
                    value={settings.game_title || ''}
                    onChange={handleChange}
                    placeholder="Ej: El Desafío Deportivo"
                />

                <label style={labelStyle}>URL del Logo Principal</label>
                <input
                    style={inputStyle}
                    type="text"
                    name="logo_url"
                    value={settings.logo_url || ''}
                    onChange={handleChange}
                    placeholder="https://ejemplo.com/logo.png"
                />

                <label style={labelStyle}>URL Imagen de Fondo (Inicio)</label>
                <input
                    style={inputStyle}
                    type="text"
                    name="background_url"
                    value={settings.background_url || ''}
                    onChange={handleChange}
                    placeholder="https://ejemplo.com/fondo.jpg"
                />
                
                <label style={labelStyle}>Fuente de Google Fonts (ej. "Roboto")</label>
                <input
                    style={inputStyle}
                    type="text"
                    name="font_family"
                    value={settings.font_family || ''}
                    onChange={handleChange}
                    placeholder="Roboto"
                />

                <button type="submit" style={{ marginTop: '20px', padding: '10px 20px', fontSize: '1rem' }}>
                    Guardar Configuración
                </button>

                {/* Mostramos el mensaje de estado al lado del botón */}
                {status && <span style={{ marginLeft: '15px', fontWeight: 'bold' }}>{status}</span>}
            </form>
        </div>
    );
}
export default withAuth(ConfiguracionPage); // <-- 2. Envolvemos la página al exportarla
