// routes/sunat.js
const express = require('express');
const router = express.Router();
const { consultarRUC, consultarDNI } = require('../controllers/sunatController');

router.post('/consultar-ruc', consultarRUC);
router.post('/consultar-dni', consultarDNI);

module.exports = router;