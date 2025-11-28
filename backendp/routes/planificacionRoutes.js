const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');

// Ruta base de prueba
router.get('/', auth.verifyToken, (req, res) => {
    res.json({ message: 'API de Planificación funcionando correctamente' });
});

module.exports = router;
