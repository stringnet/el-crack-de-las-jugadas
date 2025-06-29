const express = require('express');
const router = express.Router();
const gameController = require('./controllers/gameController');
const uploadController = require('./controllers/uploadController');
const authController = require('./controllers/authController'); // <-- Importamos

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

// --- NUEVA RUTA DE AUTENTICACIÓN ---
router.post('/auth/login', authController.login);

module.exports = router;
