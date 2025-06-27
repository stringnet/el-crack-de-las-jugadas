const db = require('../../config/db');

// Obtener todas las preguntas
const getQuestions = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM Questions ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    console.error("Error en getQuestions:", err.message);
    res.status(500).send('Error en el servidor');
  }
};

// Crear una nueva pregunta
const createQuestion = async (req, res) => {
  try {
    const { question_text, video_url, pause_timestamp_secs, points, option_1, option_2, option_3, option_4, correct_option } = req.body;

    // Lógica real para insertar en la base de datos
    const newQuestion = await db.query(
      "INSERT INTO Questions (question_text, video_url, pause_timestamp_secs, points, option_1, option_2, option_3, option_4, correct_option) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
      [question_text, video_url, pause_timestamp_secs, points, option_1, option_2, option_3, option_4, correct_option]
    );

    // Devolvemos la pregunta que se acaba de crear en la base de datos
    res.status(201).json(newQuestion.rows[0]);

  } catch (err) {
    console.error("Error en createQuestion:", err.message);
    res.status(500).send('Error en el servidor');
  }
};

// Obtener las configuraciones del juego
const getGameSettings = async (req, res) => {
    // En el futuro, leerías esto desde una tabla 'GameSettings'
    res.json({ main_logo: 'url/logo.png', background_image_start: 'url/bg.jpg' });
};

// Actualizar las configuraciones del juego
const updateGameSettings = async (req, res) => {
    // En el futuro, harías un UPDATE en la tabla 'GameSettings'
    res.json({ message: 'Configuración actualizada (simulado)'});
};

module.exports = {
  getQuestions,
  createQuestion,
  getGameSettings,
  updateGameSettings
};
