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

module.exports = router;