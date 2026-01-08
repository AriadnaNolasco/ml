const express = require("express");
const router = express.Router();
const ordenFabricacionController = require("../controllers/ordenFabricacionController");
const auth = require("../middlewares/auth");

// ============================================================================
// RUTAS PARA ÓRDENES DE FABRICACIÓN
// ============================================================================

// Análisis de disponibilidad: Ver qué productos tienen stock y cuáles necesitan fabricación
router.get(
    "/analizar/:id",
    auth.verifyToken,
    ordenFabricacionController.analizarDisponibilidadPedido
);

// Generar orden de fabricación desde un pedido (solo productos sin stock)
router.post(
    "/generar",
    auth.verifyToken,
    ordenFabricacionController.generarOrdenFabricacion
);

// Listar todas las órdenes de fabricación (con filtros opcionales)
router.get(
    "/ordenes-fabricacion",
    auth.verifyToken,
    ordenFabricacionController.obtenerOrdenesFabricacion
);

// Obtener detalle de una orden de fabricación específica
router.get(
    "/ordenes-fabricacion/:id",
    auth.verifyToken,
    ordenFabricacionController.obtenerOrdenFabricacionPorId
);

// Actualizar estado de una orden de fabricación
router.put(
    "/ordenes-fabricacion/:id/estado",
    auth.verifyToken,
    ordenFabricacionController.actualizarEstadoOrdenFabricacion
);

// Actualizar cantidad producida de un item específico
router.put(
    "/ordenes-fabricacion/detalle/:id/cantidad-producida",
    auth.verifyToken,
    ordenFabricacionController.actualizarCantidadProducida
);

module.exports = router;