const db = require('../../config/db');

// OBTENER todas las preguntas (sin cambios)
const getQuestions = async (req, res) => { /* ...código existente... */ };

// CREAR una nueva pregunta (sin cambios)
const createQuestion = async (req, res) => { /* ...código existente... */ };

// --- NUEVA FUNCIÓN PARA ACTUALIZAR (EDITAR) ---
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

// --- NUEVA FUNCIÓN PARA BORRAR ---
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

// ... (getGameSettings y updateGameSettings se quedan igual) ...

module.exports = {
  getQuestions,
  createQuestion,
  updateQuestion, // <-- Añadimos la nueva función
  deleteQuestion, // <-- Añadimos la nueva función
  getGameSettings,
  updateGameSettings
};
