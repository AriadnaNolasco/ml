// kardexRoutes.js
const express = require("express");
const router = express.Router();
const kardexController = require("../controllers/kardexController");
const auth = require("../middlewares/auth");

// GET /api/almacen/kardex
router.get("/kardex", auth.verifyToken, kardexController.listKardex);

// GET /api/almacen/kardex/resumen
router.get("/kardex/resumen", auth.verifyToken, kardexController.resumenKardex);

// GET /api/almacen/kardex/saldo-inicial
router.get("/kardex/saldo-inicial", auth.verifyToken, kardexController.saldoInicial);

router.get("/kardex/export/pdf", kardexController.exportPdf);
router.get("/kardex/export/excel", kardexController.exportExcel);

module.exports = router;
