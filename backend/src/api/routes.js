const express = require('express');
const router = express.Router();
const gameController = require('./controllers/gameController');

// --- Rutas para la gestión de Preguntas ---
router.get('/questions', gameController.getQuestions);
router.post('/questions', gameController.createQuestion);

// --- Rutas para la Personalización del Juego ---
router.get('/settings', gameController.getGameSettings);
router.post('/settings', gameController.updateGameSettings); // <-- Esta es la ruta clave que faltaba

module.exports = router;
