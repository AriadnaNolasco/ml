const express = require("express");
const router = express.Router();
const almacenController = require("../controllers/almacenController");
const auth = require("../middlewares/auth");

// Rutas para datos de formularios (debe ir antes para evitar conflictos de parámetros)
router.get(
  "/productos-form/datos",
  auth.verifyToken,
  almacenController.obtenerDatosFormulario
);

// ⭐ RUTAS ESPECÍFICAS PRIMERO (antes de /productos/:codigo)
router.get(
  "/productos/decodificar-codigo",
  auth.verifyToken,
  almacenController.decodificarCodigoProducto
);
router.get(
  "/productos/verificar-codigo",
  auth.verifyToken,
  almacenController.verificarCodigoExiste
);
router.get(
  "/productos/stock-bajo",
  auth.verifyToken,
  almacenController.obtenerProductosStockBajo
);

// Rutas para productos
router.get("/productos", auth.verifyToken, almacenController.obtenerProductos);
router.get(
  "/productos/:codigo",
  auth.verifyToken,
  almacenController.obtenerProductoPorCodigo
);
router.post("/productos", auth.verifyToken, almacenController.crearProducto);
router.put(
  "/productos/:codigo",
  auth.verifyToken,
  almacenController.actualizarProducto
);
router.delete(
  "/productos/:codigo",
  auth.verifyToken,
  almacenController.eliminarProducto
);
router.patch(
  "/productos/:codigo/stock",
  auth.verifyToken,
  almacenController.actualizarStock
);

// Equivalencias para formularios
router.get(
  "/equivalencias-codigo",
  auth.verifyToken,
  almacenController.obtenerEquivalenciasCodigo
);

// Nueva ruta para obtener tipos de existencia
router.get(
  "/tipos-existencia",
  auth.verifyToken,
  almacenController.obtenerTiposExistencia
);

// Rutas para categorías
router.get(
  "/categorias",
  auth.verifyToken,
  almacenController.obtenerCategorias
);
router.post("/categorias", auth.verifyToken, almacenController.crearCategoria);
router.put(
  "/categorias/:codigo",
  auth.verifyToken,
  almacenController.actualizarCategoria
);
router.delete(
  "/categorias/:codigo",
  auth.verifyToken,
  almacenController.eliminarCategoria
);

// Rutas para almacenes
router.get("/almacenes", auth.verifyToken, almacenController.obtenerAlmacenes);
router.get(
  "/almacenes/:codigo",
  auth.verifyToken,
  almacenController.obtenerAlmacenPorCodigo
);
router.post("/almacenes", auth.verifyToken, almacenController.crearAlmacen);
router.put(
  "/almacenes/:codigo",
  auth.verifyToken,
  almacenController.actualizarAlmacen
);
router.delete(
  "/almacenes/:codigo",
  auth.verifyToken,
  almacenController.eliminarAlmacen
);


router.get(
  "/productos/:productoId/parrillas",
  auth.verifyToken,
  almacenController.obtenerConfiguracionParrillas
);

router.put(
  "/productos/:productoId/parrillas",
  auth.verifyToken,
  almacenController.actualizarConfiguracionParrillas
);

router.delete(
  "/productos/:productoId/parrillas",
  auth.verifyToken,
  almacenController.eliminarConfiguracionParrillas
);

// =============================
// CONSULTA STOCK
// =============================
router.get(
  "/stock/consulta",
  auth.verifyToken,
  almacenController.consultarStock
);

router.get(
  "/stock/producto/:id_producto/almacenes",
  auth.verifyToken,
  almacenController.consultarStockPorProductoAlmacenes
);


module.exports = router;
