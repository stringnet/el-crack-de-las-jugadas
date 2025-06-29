const express = require('express');
const router = express.Router();
const gameController = require('./controllers/gameController');
const uploadController = require('./controllers/uploadController'); // <-- Importamos el nuevo controlador

// --- Rutas para la gestión de Preguntas ---
router.get('/questions', gameController.getQuestions);
router.post('/questions', gameController.createQuestion);

// --- Rutas para la Personalización del Juego ---
router.get('/settings', gameController.getGameSettings);
router.post('/settings', gameController.updateGameSettings); // <-- Esta es la ruta clave que faltaba

// --- NUEVA RUTA PARA SUBIR VIDEOS ---
// Usamos el 'middleware' de multer para procesar el archivo antes de llegar a nuestro controlador
router.post('/upload', uploadController.upload.single('video'), uploadController.handleUpload);

module.exports = router;
