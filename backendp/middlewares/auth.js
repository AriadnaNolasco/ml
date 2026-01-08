const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const auth = {
  // Middleware para verificar el token JWT
  verifyToken: async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'Acceso no autorizado' });
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      req.userId = decoded.id; // Añade esta línea
      req.userId = decoded.userId || decoded.id; // O esta línea más robusta
      
      next();
    } catch (error) {
      res.status(401).json({ error: 'Token inválido' });
    }
  },

  // Middleware para verificar rol de Superadmin
  isSuperAdmin: (req, res, next) => {
    if (req.user.rol_id !== 1) {
      return res.status(403).json({ error: 'Acceso prohibido' });
    }
    next();
  }
};

module.exports = auth;