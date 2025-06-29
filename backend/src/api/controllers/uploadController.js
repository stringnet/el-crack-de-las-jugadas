const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento de Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Le decimos que guarde los archivos en la carpeta que creamos
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    // Creamos un nombre de archivo único para evitar sobreescribir
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Controlador que maneja la respuesta después de la subida
const handleUpload = (req, res) => {
  if (!req.file) {
    return res.status(400).send('No se subió ningún archivo.');
  }

  // Construimos la URL pública del archivo
  // ¡IMPORTANTE! Asegúrate de que la URL base coincida con tu dominio del backend
  const fileUrl = `${process.env.API_URL || 'https://apitriviagame.scanmee.io'}/uploads/${req.file.filename}`;

  res.status(200).json({
    message: 'Archivo subido exitosamente',
    video_url: fileUrl
  });
};

module.exports = {
    upload,
    handleUpload
};
