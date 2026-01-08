const express = require('express');
const router = express.Router();
const mantenimientoController = require('../controllers/mantenimientoController');
const DashMantenimientoController = require('../controllers/DashMantenimientoController');
const EvaluacionesController = require('../controllers/evaluacionesController');
const auth = require('../middlewares/auth');    
const planificacionController = require('../controllers/planificacionController');
const cotizacionManController = require('../controllers/cotizacionManController');
const OrdenMantenimientoController = require('../controllers/OrdenMantenimientoController');
const tecnicosController = require('../controllers/tecnicosController'); //no tienen acceso al sistema
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

// 🔽 OPCIONES PARA EL FORMULARIO (SELECTS)
router.get(
  '/planificacion/equipos',
  auth.verifyToken,
  mantenimientoController.getEquiposForPlanificacion
);

router.get(
  '/planificacion/tecnicos',
  auth.verifyToken,
  mantenimientoController.getTecnicosForPlanificacion
);
//====================================================
// Rutas para la cotizacion
//====================================================

router.get('/evaluaciones/:evaluacionId/cotizacion/calcular', auth.verifyToken, cotizacionManController.calcularCotizacionMantenimiento);
router.post('/evaluaciones/:evaluacionId/cotizacion/calcular', auth.verifyToken, cotizacionManController.calcularCotizacionMantenimiento);
router.post('/evaluaciones/:evaluacionId/cotizacion/guardar', auth.verifyToken, cotizacionManController.guardarCotizacionMantenimiento);


// =====================================================
// RUTAS PARA TÉCNICOS ✅ NUEVO
// =====================================================
router.get('/tecnicos', auth.verifyToken, tecnicosController.getTecnicos);
router.post('/tecnicos', auth.verifyToken, tecnicosController.createTecnico);
router.put('/tecnicos/:id', auth.verifyToken, tecnicosController.updateTecnico);
router.delete('/tecnicos/:id', auth.verifyToken, tecnicosController.deleteTecnico);

// =====================================================
// RUTAS PARA ÓRDENES DE TRABAJO
// =====================================================

// Dashboard - Contadores (Req 1.1)
router.get('/ordenes-trabajo/dashboard/contadores', auth.verifyToken, OrdenMantenimientoController.getDashboardCounters);

// Listar Órdenes con Filtros (Req 1.2)
router.get('/ordenes-trabajo', auth.verifyToken, OrdenMantenimientoController.getAllOrdenes);

// Obtener equipos disponibles para crear OT (Req 2.1)
router.get('/ordenes-trabajo/equipos-disponibles', auth.verifyToken, OrdenMantenimientoController.getEquiposDisponibles);

// Crear Nueva Orden de Trabajo (Req 2.1)
router.post('/ordenes-trabajo', auth.verifyToken, OrdenMantenimientoController.createOrden);

// Obtener Detalle Completo de OT (Req 3)
router.get('/ordenes-trabajo/:id', auth.verifyToken, OrdenMantenimientoController.getOrdenById);

// Actualizar OT (General y Estados) (Req 3.1)
router.put('/ordenes-trabajo/:id', auth.verifyToken, OrdenMantenimientoController.updateOrden);

// Eliminar OT (Req 1.2)
router.delete('/ordenes-trabajo/:id', auth.verifyToken, OrdenMantenimientoController.deleteOrden);

// Registrar Actividad (Pestaña 2 - Historial)
router.post('/ordenes-trabajo/:id/actividades', auth.verifyToken, OrdenMantenimientoController.addActividad);

// Registrar Material (Pestaña 2 - Historial)
router.post('/ordenes-trabajo/:id/materiales', auth.verifyToken, OrdenMantenimientoController.addMaterial);

// Subir Adjunto (Pestaña 4)
router.post('/ordenes-trabajo/:id/adjuntos', auth.verifyToken, OrdenMantenimientoController.addAdjunto);

module.exports = router;





