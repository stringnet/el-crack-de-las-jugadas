const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Verificar que las variables de entorno existen
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    const jwtSecret = process.env.JWT_SECRET;

    if (!adminUsername || !adminPasswordHash || !jwtSecret) {
      return res.status(500).json({ message: 'Servidor no configurado para autenticación.' });
    }

    // 2. Comparar el usuario y la contraseña (hasheada)
    const isUserValid = (username === adminUsername);
    const isPasswordValid = await bcrypt.compare(password, adminPasswordHash);

    if (!isUserValid || !isPasswordValid) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' });
    }

    // 3. Si son válidos, crear el "pase" digital (JWT)
    const token = jwt.sign(
      { username: adminUsername, role: 'admin' }, // Información que guardamos en el token
      jwtSecret, // La clave secreta para firmarlo
      { expiresIn: '8h' } // El token expira en 8 horas
    );

    // 4. Enviar el token al cliente
    res.json({ message: 'Inicio de sesión exitoso', token });

  } catch (error) {
    console.error("Error en el login:", error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

module.exports = { login };
