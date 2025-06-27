// admin-panel/pages/configuracion.js
import { useState } from 'react';

export default function ConfiguracionPage() {

    const handleSubmit = (e) => {
        e.preventDefault();
        // Aquí iría la lógica para hacer un fetch PUT/POST a la API
        // con los datos del formulario para guardarlos.
        alert('Configuración guardada (simulado)');
    }

    return (
        <div>
            <h1>Configuración General del Juego</h1>
            <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
                <label>URL del Logo Principal</label>
                <input type="text" style={{width: '100%', padding: '8px', margin: '5px 0'}}/>

                <label>URL Imagen de Fondo (Inicio)</label>
                <input type="text" style={{width: '100%', padding: '8px', margin: '5px 0'}}/>
                
                <label>Fuente de Google Fonts (ej. "Roboto")</label>
                <input type="text" style={{width: '100%', padding: '8px', margin: '5px 0'}}/>

                <button type="submit" style={{ marginTop: '20px', padding: '10px 20px' }}>Guardar Configuración</button>
            </form>
        </div>
    );
}
