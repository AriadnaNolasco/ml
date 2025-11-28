const express = require('express');
const router = express.Router();
const almacenController = require('../controllers/almacenController');
const auth = require('../middlewares/auth');

// Rutas para datos de formularios (debe ir antes para evitar conflictos de parámetros)
router.get('/productos-form/datos', auth.verifyToken, almacenController.obtenerDatosFormulario);

// Rutas para productos
router.get('/productos', auth.verifyToken, almacenController.obtenerProductos);
router.get('/productos/stock-bajo', auth.verifyToken, almacenController.obtenerProductosStockBajo);
router.get('/productos/:codigo', auth.verifyToken, almacenController.obtenerProductoPorCodigo);
router.post('/productos', auth.verifyToken, almacenController.crearProducto);
router.put('/productos/:codigo', auth.verifyToken, almacenController.actualizarProducto);
router.delete('/productos/:codigo', auth.verifyToken, almacenController.eliminarProducto);
router.patch('/productos/:codigo/stock', auth.verifyToken, almacenController.actualizarStock);

// Nueva ruta para obtener tipos de existencia
router.get('/tipos-existencia', auth.verifyToken, almacenController.obtenerTiposExistencia);

// Rutas para categorías
router.get('/categorias', auth.verifyToken, almacenController.obtenerCategorias);
router.post('/categorias', auth.verifyToken, almacenController.crearCategoria);
router.put('/categorias/:codigo', auth.verifyToken, almacenController.actualizarCategoria);
router.delete('/categorias/:codigo', auth.verifyToken, almacenController.eliminarCategoria);

// Rutas para almacenes
router.get('/almacenes', auth.verifyToken, almacenController.obtenerAlmacenes);
router.get('/almacenes/:codigo', auth.verifyToken, almacenController.obtenerAlmacenPorCodigo);
router.post('/almacenes', auth.verifyToken, almacenController.crearAlmacen);
router.put('/almacenes/:codigo', auth.verifyToken, almacenController.actualizarAlmacen);
router.delete('/almacenes/:codigo', auth.verifyToken, almacenController.eliminarAlmacen);

// Rutas para notas de ingreso
router.get('/ordenes-compra-disponibles', auth.verifyToken, almacenController.obtenerOrdenesCompraDisponibles);
router.get('/notas-ingreso', auth.verifyToken, almacenController.obtenerNotasIngreso);
router.get('/notas-ingreso/:id', auth.verifyToken, almacenController.obtenerNotaIngresoPorId);
router.post('/notas-ingreso', auth.verifyToken, almacenController.crearNotaIngreso);
router.put('/notas-ingreso/:id', auth.verifyToken, almacenController.actualizarNotaIngreso);
router.post('/notas-ingreso/:id/confirmar', auth.verifyToken, almacenController.confirmarNotaIngreso);
router.post('/notas-ingreso/:id/anular', auth.verifyToken, almacenController.anularNotaIngreso);
router.delete('/notas-ingreso/:id', auth.verifyToken, almacenController.eliminarNotaIngreso);
router.get('/notas-ingreso/:id/pdf', auth.verifyToken, almacenController.generarPDFNotaIngreso);

module.exports = router;