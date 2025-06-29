const express = require('express');
const router = express.Router();
const gameController = require('./controllers/gameController');
const uploadController = require('./controllers/uploadController');

// Rutas para Preguntas (CRUD Completo)
router.get('/questions', gameController.getQuestions);
router.post('/questions', gameController.createQuestion);
router.put('/questions/:id', gameController.updateQuestion);    // <-- NUEVA RUTA
router.delete('/questions/:id', gameController.deleteQuestion); // <-- NUEVA RUTA

// Rutas para Configuración
router.get('/settings', gameController.getGameSettings);
router.post('/settings', gameController.updateGameSettings);

// Ruta para Subida de Videos
router.post('/upload', uploadController.upload.single('video'), uploadController.handleUpload);

module.exports = router;
