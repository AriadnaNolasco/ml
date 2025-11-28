const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');
const auth = require('../middlewares/auth');

// Rutas públicas (pero protegidas por autenticación)
router.get('/documentos', auth.verifyToken, publicController.getDocumentos);
router.get('/tipos-documento', auth.verifyToken, publicController.getTiposDocumento);
router.get('/categorias', auth.verifyToken, publicController.getCategorias);
router.get('/almacenes', auth.verifyToken, publicController.getAlmacenes);
router.get('/sucursales', auth.verifyToken, publicController.getSucursales);

// Ruta para obtener datos
router.get('/tipos-documento-id', auth.verifyToken, publicController.getTiposDocumentoId);
router.get('/paises', auth.verifyToken, publicController.getPaises);
router.get('/bancos', auth.verifyToken, publicController.getBancos);
router.get('/monedas', auth.verifyToken, publicController.getMonedas);

module.exports = router;