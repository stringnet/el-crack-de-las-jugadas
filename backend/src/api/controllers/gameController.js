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
    const { question_text, video_url, pause_timestamp_secs, points, time_limit_secs, option_1, option_2, option_3, option_4, correct_option } = req.body;
    
    const newQuestion = await db.query(
      "INSERT INTO questions (question_text, video_url, pause_timestamp_secs, points, time_limit_secs, option_1, option_2, option_3, option_4, correct_option) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
      [question_text, video_url, pause_timestamp_secs, points, time_limit_secs, option_1, option_2, option_3, option_4, correct_option]
    );
    
    res.status(201).json(newQuestion.rows[0]);
  } catch (err) {
    console.error("Error en createQuestion:", err.message);
    res.status(500).send('Error en el servidor');
  }
};

/**
 * Actualiza (edita) una pregunta existente.
 */
const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params; // Obtenemos el ID de la URL
    const { question_text, video_url, pause_timestamp_secs, points, time_limit_secs, option_1, option_2, option_3, option_4, correct_option } = req.body;
    
    const updatedQuestion = await db.query(
      "UPDATE questions SET question_text = $1, video_url = $2, pause_timestamp_secs = $3, points = $4, time_limit_secs = $5, option_1 = $6, option_2 = $7, option_3 = $8, option_4 = $9, correct_option = $10 WHERE id = $11 RETURNING *",
      [question_text, video_url, pause_timestamp_secs, points, time_limit_secs, option_1, option_2, option_3, option_4, correct_option, id]
    );

    if (updatedQuestion.rows.length === 0) {
      return res.status(404).json({ message: 'Pregunta no encontrada' });
    }
    res.json(updatedQuestion.rows[0]);
  } catch (err) {
    console.error("Error en updateQuestion:", err.message);
    res.status(500).send('Error en el servidor');
  }
};

/**
 * Borra una pregunta existente.
 */
const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params; // Obtenemos el ID de la URL
    
    const deleteOp = await db.query("DELETE FROM questions WHERE id = $1 RETURNING *", [id]);

    if (deleteOp.rowCount === 0) {
      return res.status(404).json({ message: 'Pregunta no encontrada' });
    }
    res.status(200).json({ message: 'Pregunta borrada exitosamente' });
  } catch (err) {
    console.error("Error en deleteQuestion:", err.message);
    res.status(500).send('Error en el servidor');
  }
};

/**
 * Obtiene todas las configuraciones del juego.
 */
const getGameSettings = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM gamesettings');
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
 * Actualiza las configuraciones del juego.
 */
const updateGameSettings = async (req, res) => {
  try {
    const settings = req.body;
    for (const key in settings) {
      if (Object.hasOwnProperty.call(settings, key)) {
        const value = settings[key];
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

// Exportamos TODAS las funciones que nuestro enrutador necesita.
module.exports = {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getGameSettings,
  updateGameSettings
};
