const db = require('../../config/db');

/**
 * Obtiene todas las preguntas de la base de datos.
 */
const getQuestions = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM questions ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    console.error("Error en getQuestions:", err.message);
    res.status(500).send('Error en el servidor');
  }
};

/**
 * Crea una nueva pregunta en la base de datos.
 */
const createQuestion = async (req, res) => {
  try {
    const { question_text, video_url, pause_timestamp_secs, points, option_1, option_2, option_3, option_4, correct_option } = req.body;
    
    const newQuestion = await db.query(
      "INSERT INTO questions (question_text, video_url, pause_timestamp_secs, points, option_1, option_2, option_3, option_4, correct_option) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
      [question_text, video_url, pause_timestamp_secs, points, option_1, option_2, option_3, option_4, correct_option]
    );
    
    res.status(201).json(newQuestion.rows[0]);
  } catch (err) {
    console.error("Error en createQuestion:", err.message);
    res.status(500).send('Error en el servidor');
  }
};

/**
 * Obtiene todas las configuraciones del juego desde la tabla GameSettings.
 */
const getGameSettings = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM gamesettings');
    
    // Convertimos el array de filas (ej. [{setting_key: 'logo_url', setting_value: '...'}])
    // en un único objeto fácil de usar (ej. { logo_url: '...' }).
    const settings = rows.reduce((acc, row) => {
      acc[row.setting_key] = row.setting_value;
      return acc;
    }, {});
    
    res.json(settings);
  } catch (err) {
    console.error("Error en getGameSettings:", err.message);
    res.status(500).send('Error en el servidor');
  }
};

/**
 * Actualiza las configuraciones del juego. Recibe un objeto con las claves y valores a actualizar.
 */
const updateGameSettings = async (req, res) => {
  try {
    const settings = req.body; // Recibimos un objeto como { logo_url: '...', font_family: '...' }
    
    // Usamos un bucle para guardar cada clave-valor
    for (const key in settings) {
      if (Object.hasOwnProperty.call(settings, key)) {
        const value = settings[key];
        
        // Este comando especial (UPSERT) inserta una nueva clave si no existe,
        // o la actualiza si ya existe. ¡Es muy potente y flexible!
        await db.query(
          'INSERT INTO gamesettings (setting_key, setting_value) VALUES ($1, $2) ON CONFLICT (setting_key) DO UPDATE SET setting_value = $2',
          [key, value]
        );
      }
    }
    
    res.status(200).json({ message: 'Configuración guardada exitosamente' });
  } catch (err) {
    console.error("Error en updateGameSettings:", err.message);
    res.status(500).send('Error en el servidor');
  }
};

// Exportamos todas las funciones para que puedan ser usadas en las rutas de la API.
module.exports = {
  getQuestions,
  createQuestion,
  getGameSettings,
  updateGameSettings
};
