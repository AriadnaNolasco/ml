const express = require("express");
const router = express.Router();

const movimientosController = require("../controllers/movimientosController");
const auth = require("../middlewares/auth");

router.get("/movimientos", auth.verifyToken, movimientosController.listMovimientos);
router.get("/movimientos/:id", auth.verifyToken, movimientosController.getMovimientoById);
router.get("/movimientos/por-nota/:id_nota", auth.verifyToken, movimientosController.getMovimientoByNotaId);

// ====== REPORTES ======
router.get("/reportes/kardex-producto", movimientosController.reporteKardexProducto);
router.get("/reportes/stock-almacen", movimientosController.reporteStockAlmacen);
router.get("/reportes/resumen-entradas-salidas", movimientosController.reporteEntradasVsSalidas);
router.get("/reportes/transferencias", movimientosController.reporteTransferencias);
router.get("/reportes/auditoria-notas", movimientosController.reporteAuditoriaNotas);

module.exports = router;