const express = require('express');
const router = express.Router();
const gameController = require('./controllers/gameController');

// Define las rutas de la API y qué función del controlador se ejecuta para cada una.

// --- Rutas para la gestión de Preguntas (usadas por el Admin Panel) ---
router.get('/questions', gameController.getQuestions);
router.post('/questions', gameController.createQuestion);
// Aquí irían las rutas para actualizar (PUT /questions/:id) y borrar (DELETE /questions/:id)

// --- Rutas para la Personalización del Juego (usadas por el Admin Panel) ---
router.get('/settings', gameController.getGameSettings);
router.put('/settings', gameController.updateGameSettings);


module.exports = router;
