const express = require("express");
const router = express.Router();
const pedidosController = require("../controllers/pedidosController");
const auth = require("../middlewares/auth");

// Rutas para pedidos
router.get("/pedidos", auth.verifyToken, pedidosController.obtenerPedidos);
router.get(
  "/pedidos/:id",
  auth.verifyToken,
  pedidosController.obtenerPedidoPorId
);
router.post(
  "/pedidos/convertir-cotizacion",
  auth.verifyToken,
  pedidosController.convertirCotizacionAPedido
);
router.put(
  "/pedidos/:id/estado",
  auth.verifyToken,
  pedidosController.actualizarEstadoPedido
);
router.put(
  "/pedidos/:id/cantidades-despachadas",
  auth.verifyToken,
  pedidosController.actualizarCantidadesDespachadas
);
router.get(
  "/clientes/:cliente_id/pedidos",
  auth.verifyToken,
  pedidosController.obtenerPedidosPorCliente
);
router.get(
  "/pedidos/estadisticas/estadisticas",
  auth.verifyToken,
  pedidosController.obtenerEstadisticasPedidos
);
router.get(
  "/pedidos/reportes/pendientes",
  auth.verifyToken,
  pedidosController.generarReportePedidosPendientes
);

// ✅ NUEVAS RUTAS: GESTIÓN DE RESERVAS DE STOCK
router.get(
  "/pedidos/:id/reservas",
  auth.verifyToken,
  pedidosController.obtenerReservasPedido
);
router.post(
  "/pedidos/:id/liberar-reservas",
  auth.verifyToken,
  pedidosController.liberarReservasPedido
);
router.get(
  "/stock/con-reservas",
  auth.verifyToken,
  pedidosController.obtenerStockConReservas
);

// ✅ NUEVAS RUTAS PROFESIONALES: GUÍAS DE REMISIÓN CON ALMACENES
router.get(
  "/:pedido_id/productos-para-guia",
  auth.verifyToken,
  pedidosController.obtenerProductosParaGuia
);
router.post(
  "/validar-almacenes-guia",
  auth.verifyToken,
  pedidosController.validarAlmacenesGuia
);
router.get(
  "/:pedido_id/resumen-almacenes",
  auth.verifyToken,
  pedidosController.obtenerResumenAlmacenesPedido
);

module.exports = router;