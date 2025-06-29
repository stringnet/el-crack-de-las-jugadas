const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento de Multer (se queda igual)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Controlador que maneja la respuesta después de la subida
const handleUpload = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No se subió ningún archivo.' });
  }
  
  // --- ESTA ES LA CORRECCIÓN ---
  // Nos aseguramos de que la URL base no tenga una barra al final antes de unirla.
  const baseUrl = (process.env.API_URL || 'https://apitriviagame.scanmee.io').replace(/\/$/, '');
  
  // Construimos la URL pública del archivo correctamente
  const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
  // -----------------------------
  
  res.status(200).json({
    message: 'Archivo subido exitosamente',
    video_url: fileUrl
  });
};

module.exports = {
    upload,
    handleUpload
};
