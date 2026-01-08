const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const planificacionController = require('../controllers/planificacionController');

// 🔹 Probar que el módulo responde
router.get('/', auth.verifyToken, (req, res) => {
  res.json({ message: 'API de Planificación funcionando correctamente' });
});

// 🔹 Listar planes
router.get('/planes', auth.verifyToken, planificacionController.getAllPlanes);

// 🔹 Resumen
router.get('/resumen', auth.verifyToken, planificacionController.getResumenPlanes);

// 🔹 Calendario (acepta year/month o anio/mes)
router.get('/calendario', auth.verifyToken, planificacionController.getCalendarioPlanes);

// 🔹 Crear plan
router.post('/crear', auth.verifyToken, planificacionController.createPlan);

// 🔹 Actualizar plan completo
router.put('/:id', auth.verifyToken, planificacionController.updatePlan);

// 🔹 Actualizar solo estado
router.put('/:id/estado', auth.verifyToken, planificacionController.updateEstadoPlan);

// 🔹 Eliminar plan
router.delete('/eliminar/:id', auth.verifyToken, planificacionController.deletePlan);

module.exports = router;
