const express = require('express');
const router = express.Router();
const notasController = require('../controllers/notasController');
const stockAlmacenController = require("../controllers/stockAlmacenController");
const auth = require('../middlewares/auth');


router.get("/notas/next-number", auth.verifyToken, notasController.getNextNotaNumero);
// OBTENER TODAS LAS NOTAS (opcionalmente ?tipo=INGRESO / SALIDA)
router.get("/notas", auth.verifyToken, notasController.getNotas);

router.get("/notas/listar", auth.verifyToken, notasController.listarNotas);

// OBTENER NOTA POR ID (incluye cabecera + detalle)
router.get("/notas/:id", auth.verifyToken, notasController.getNotaById);
// OBTENER ORDENES DE COMPRA POR DOCUMENTO NIC - NIE
router.get("/ordenes-compra/por-documento/:codigo", auth.verifyToken, notasController.getOrdenesPorDocumento);

router.get("/ordenes-compra/disponibles", auth.verifyToken, notasController.getOrdenesCompraDisponibles);

router.get("/ordenes-fabricacion/disponibles", notasController.getOrdenesFabricacionDisponibles);

router.post("/notas", auth.verifyToken, notasController.createNota);

router.post("/notas/:id/confirmar", auth.verifyToken, notasController.confirmarNota);

// Confirmación para Transferencias (NT): genera SALIDA + INGRESO
router.post("/notas/:id/confirmar-transferencia", auth.verifyToken, notasController.confirmarNotaT);

router.put("/notas/:id", auth.verifyToken, notasController.updateNota);

router.post("/notas/:id/anular", auth.verifyToken, notasController.anularNota);

// Listar productos por almacén (ideal para SALIDA)
router.get("/stock-almacen/productos", auth.verifyToken, stockAlmacenController.listProductosPorAlmacen);

// Stock puntual de un producto en un almacén
router.get("/stock-almacen/:almacen_id/:id_producto", auth.verifyToken, stockAlmacenController.getStockProducto);

router.get("/notas/:id/export/pdf", auth.verifyToken, notasController.exportNotaPdf);


module.exports = router;
