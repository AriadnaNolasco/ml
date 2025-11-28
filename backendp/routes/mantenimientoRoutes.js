const express = require('express');
const router = express.Router();
const mantenimientoController = require('../controllers/mantenimientoController');
const DashMantenimientoController = require('../controllers/DashMantenimientoController');
const EvaluacionesController = require('../controllers/evaluacionesController');
const auth = require('../middlewares/auth');    
const planificacionController = require('../controllers/planificacionController');
const cotizacionManController = require('../controllers/cotizacionManController');

// =====================================================
// RUTAS PARA CÓDIGOS DE MANTENIMIENTO
// =====================================================
router.get('/codigos-compras', auth.verifyToken, mantenimientoController.getCodigosCompras);

// =====================================================
// RUTAS PARA DASHBOARD DE MANTENIMIENTO
// =====================================================
router.get('/dashboard/equipos-por-estado', auth.verifyToken, DashMantenimientoController.getEquiposPorEstado);
router.get('/dashboard/mantenimientos-por-tipo', auth.verifyToken, DashMantenimientoController.getMantenimientosPorTipo);
router.get('/dashboard/mantenimientos-por-mes', auth.verifyToken, DashMantenimientoController.getMantenimientosPorMes);

// =====================================================
// RUTAS PARA EQUIPOS
// =====================================================
router.get('/clientes/search', auth.verifyToken, mantenimientoController.searchClienteByRuc);
router.get('/equipos/options', auth.verifyToken, mantenimientoController.getFormOptions);
router.get('/equipos', auth.verifyToken, mantenimientoController.getAllEquipos);
router.get('/equipos/:id', auth.verifyToken, mantenimientoController.getEquipoById);
router.post('/equipos', auth.verifyToken, mantenimientoController.createEquipo);
router.put('/equipos/:id', auth.verifyToken, mantenimientoController.updateEquipo);
router.delete('/equipos/:id', auth.verifyToken, mantenimientoController.deleteEquipo);

// =====================================================
// RUTAS PARA EVALUACIONES
// =====================================================
router.get('/evaluaciones', auth.verifyToken, EvaluacionesController.getAllEvaluaciones);
router.post('/evaluaciones', auth.verifyToken, EvaluacionesController.createEvaluacion);
router.get('/evaluaciones/:id', auth.verifyToken, EvaluacionesController.getEvaluacionById);
router.put('/evaluaciones/:id', auth.verifyToken, EvaluacionesController.updateEvaluacion);
router.get('/evaluaciones/options/actividades', auth.verifyToken, EvaluacionesController.getAllActividadesManoObra);
router.get('/evaluaciones/options/productos', auth.verifyToken, EvaluacionesController.getProductsForSelect);
router.post('/evaluaciones/:evaluacionId/materiales', auth.verifyToken, EvaluacionesController.addMaterial);
router.delete('/evaluaciones/:evaluacionId/materiales/:materialId', auth.verifyToken, EvaluacionesController.deleteMaterial);
router.post('/evaluaciones/:evaluacionId/mano-obra', auth.verifyToken, EvaluacionesController.addManoObra);
router.delete('/evaluaciones/:evaluacionId/mano-obra/:manoObraId', auth.verifyToken, EvaluacionesController.deleteManoObra);
router.post('/evaluaciones/:evaluacionId/auxiliares', auth.verifyToken, EvaluacionesController.addAuxiliar);
router.delete('/evaluaciones/:evaluacionId/auxiliares/:auxiliarId', auth.verifyToken, EvaluacionesController.deleteAuxiliar);

// =====================================================
// RUTAS PARA PLANIFICACIÓN DE MANTENIMIENTOS PREVENTIVOS
// =====================================================

router.get('/planificacion', auth.verifyToken, planificacionController.getAllPlanes);

router.get('/planificacion/resumen', auth.verifyToken, planificacionController.getResumenPlanes);

router.get('/planificacion/calendario', auth.verifyToken, planificacionController.getCalendarioPlanes);

router.post('/planificacion', auth.verifyToken, planificacionController.createPlan);

router.put('/planificacion/:id', auth.verifyToken, planificacionController.updatePlan);

router.put('/planificacion/:id/estado', auth.verifyToken, planificacionController.updateEstadoPlan);

router.delete('/planificacion/:id', auth.verifyToken, planificacionController.deletePlan);

//====================================================
// Rutas para la cotizacion
//====================================================

router.get('/evaluaciones/:evaluacionId/cotizacion/calcular', auth.verifyToken, cotizacionManController.calcularCotizacionMantenimiento);
router.post('/evaluaciones/:evaluacionId/cotizacion/calcular', auth.verifyToken, cotizacionManController.calcularCotizacionMantenimiento);
router.post('/evaluaciones/:evaluacionId/cotizacion/guardar', auth.verifyToken, cotizacionManController.guardarCotizacionMantenimiento);
module.exports = router;




