// =====================================================
// guiasRemisionRoutes.js
// Rutas para gestión de Guías de Remisión
// Radiadores Fortaleza S.A.
// =====================================================

const express = require("express");
const router = express.Router();
const guiasRemisionController = require("../controllers/Guiasremisioncontroller");
const auth = require("../middlewares/auth");

// =====================================================
// RUTAS DE DATOS AUXILIARES
// =====================================================

// Obtener datos para formulario de nueva guía
// GET /api/guias-remision/formulario/datos
router.get(
    "/formulario/datos",
    auth.verifyToken,
    guiasRemisionController.obtenerDatosFormularioGuia
);

// =====================================================
// RUTAS DE ANÁLISIS Y VALIDACIÓN
// =====================================================

// Analizar pedido para generar guía (productos pendientes, almacenes, etc.)
// GET /api/guias-remision/analizar-pedido/:pedido_id
router.get(
    "/analizar-pedido/:pedido_id",
    auth.verifyToken,
    guiasRemisionController.analizarPedidoParaGuia
);

// Validar productos seleccionados antes de crear guía
// POST /api/guias-remision/validar-productos
router.post(
    "/validar-productos",
    auth.verifyToken,
    guiasRemisionController.validarProductosGuia
);

// =====================================================
// RUTAS CRUD PRINCIPALES
// =====================================================

// Listar todas las guías de remisión (con filtros)
// GET /api/guias-remision
// Query params: estado, fecha_desde, fecha_hasta, cliente, pedido_id, almacen_id
router.get(
    "/",
    auth.verifyToken,
    guiasRemisionController.obtenerGuiasRemision
);

// Crear nueva guía de remisión
// POST /api/guias-remision
router.post(
    "/",
    auth.verifyToken,
    guiasRemisionController.crearGuiaRemision
);

// Obtener guía por ID
// GET /api/guias-remision/:id
router.get(
    "/:id",
    auth.verifyToken,
    guiasRemisionController.obtenerGuiaPorId
);

// Obtener guías de un pedido específico
// GET /api/guias-remision/pedido/:pedido_id
router.get(
    "/pedido/:pedido_id",
    auth.verifyToken,
    guiasRemisionController.obtenerGuiasPorPedido
);

// =====================================================
// RUTAS DE GESTIÓN DE ESTADOS
// =====================================================

// Actualizar estado de guía (PENDIENTE -> EN_TRANSITO -> ENTREGADO)
// PUT /api/guias-remision/:id/estado
router.put(
    "/:id/estado",
    auth.verifyToken,
    guiasRemisionController.actualizarEstadoGuia
);

// Confirmar entrega de guía (con detalle de items recibidos)
// POST /api/guias-remision/:id/confirmar-entrega
router.post(
    "/:id/confirmar-entrega",
    auth.verifyToken,
    guiasRemisionController.confirmarEntregaGuia
);

// Anular guía de remisión
// POST /api/guias-remision/:id/anular
router.post(
    "/:id/anular",
    auth.verifyToken,
    guiasRemisionController.anularGuiaRemision
);

// =====================================================
// RUTAS DE GESTIÓN DE NOTAS DE SALIDA
// =====================================================

// Aprobar/Confirmar nota de salida generada desde guía
// POST /api/guias-remision/notas/:id_nota/aprobar
// Confirma la nota de salida y disminuye el stock
router.post(
    "/notas/:id_nota/aprobar",
    auth.verifyToken,
    guiasRemisionController.aprobarNotaSalidaGuia
);

// =====================================================
// RUTAS DE ESTADÍSTICAS Y REPORTES
// =====================================================

// Obtener estadísticas de guías
// GET /api/guias-remision/estadisticas
router.get(
    "/reportes/estadisticas",
    auth.verifyToken,
    guiasRemisionController.obtenerEstadisticasGuias
);

module.exports = router;