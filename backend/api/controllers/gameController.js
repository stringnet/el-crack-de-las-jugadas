const db = require('../../config/db');

// --- Controladores para el Panel de Administración ---

// Obtener todas las preguntas
const getQuestions = async (req, res) => {
  try {
    // const { rows } = await db.query('SELECT * FROM Questions ORDER BY id ASC');
    // res.json(rows);
    res.json([{id: 1, question_text: "Pregunta de ejemplo desde la API"}]); // Placeholder
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};

// Crear una nueva pregunta
const createQuestion = async (req, res) => {
  try {
    const { question_text, video_url, pause_timestamp_secs, points, option_1, option_2, option_3, option_4, correct_option } = req.body;
    // Lógica para guardar la nueva pregunta en la base de datos
    // const newQuestion = await db.query(
    //   "INSERT INTO Questions (...) VALUES ($1, $2, ...) RETURNING *",
    //   [question_text, ...]
    // );
    // res.status(201).json(newQuestion.rows[0]);
     res.status(201).json({ message: 'Pregunta creada (simulado)', data: req.body }); // Placeholder
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};


// --- Controladores para la personalización ---

const getGameSettings = async (req, res) => {
    // Lógica para obtener todas las configuraciones (logo, fondo, etc.)
    res.json({ main_logo: 'url/logo.png', background_image_start: 'url/bg.jpg' }); // Placeholder
};

const updateGameSettings = async (req, res) => {
    // Lógica para actualizar una configuración específica
    res.json({ message: 'Configuración actualizada (simulado)'}); // Placeholder
};


module.exports = {
  getQuestions,
  createQuestion,
  getGameSettings,
  updateGameSettings
};
