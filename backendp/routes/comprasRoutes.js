const express = require('express');
const router = express.Router();
const comprasController = require('../controllers/comprasController');
const DashComprasController = require('../controllers/DashComprasController');
const auth = require('../middlewares/auth');

// =====================================================
// RUTAS PARA CÓDIGOS DE COMPRAS
// =====================================================
router.get('/codigos-compras', auth.verifyToken, comprasController.getCodigosCompras);

// =====================================================
// RUTAS PARA DASHBOARD DE COMPRAS
// =====================================================
router.get('/dashboard/ordenes-por-mes', auth.verifyToken, DashComprasController.getOrdenesPorMes);
router.get('/dashboard/montos-por-tipo-moneda', auth.verifyToken, DashComprasController.getMontosPorTipoYMoneda);
router.get('/dashboard/ordenes-tiempo', auth.verifyToken, DashComprasController.getOrdenesATiempoVsRetrasadas);
router.get('/dashboard/ahorros', auth.verifyToken, DashComprasController.getAhorrosPorDescuentos);
router.get('/dashboard/proveedores-activos', auth.verifyToken, DashComprasController.getProveedoresActivos);
router.get('/dashboard/top-proveedores', auth.verifyToken, DashComprasController.getTopProveedores);
router.get('/dashboard/productos-top', auth.verifyToken, DashComprasController.getProductosMasComprados);
router.get('/dashboard/ordenes-vencidas', auth.verifyToken, DashComprasController.getOrdenesVencidas);
router.get('/dashboard/requerimientos-pendientes', auth.verifyToken, DashComprasController.getRequerimientosPendientes);


// =====================================================
// RUTAS PARA PROVEEDORES
// =====================================================
router.get('/proveedores', auth.verifyToken, comprasController.getAllProveedores);
router.post('/proveedores', auth.verifyToken, comprasController.createProveedor);
router.get('/proveedores/buscar', auth.verifyToken, comprasController.searchProveedores);
router.get('/proveedores/:id', auth.verifyToken, comprasController.getProveedorById);
router.put('/proveedores/:id', auth.verifyToken, comprasController.updateProveedor);
router.patch('/proveedores/:id/estado', auth.verifyToken, comprasController.updateEstadoProveedor);

router.get('/proveedores/:id/cuentas-bancarias', auth.verifyToken, comprasController.getCuentasBancariasProveedor);
router.get('/datos-cuentas-bancarias', auth.verifyToken, comprasController.getDatosCuentasBancarias);

// =====================================================
// RUTAS PARA REQUERIMIENTOS DE COMPRA
// =====================================================
router.get('/requerimientos/next-number', auth.verifyToken, comprasController.getNextRequerimientoNumber);
router.get('/requerimientos', auth.verifyToken, comprasController.getAllRequerimientos);
router.post('/requerimientos', auth.verifyToken, comprasController.createRequerimiento);
router.get('/requerimientos/:id', auth.verifyToken, comprasController.getRequerimientoDetalles);
router.get('/requerimientos/:id/detalles', auth.verifyToken, comprasController.getRequerimientoDetalles);
router.put('/requerimientos/:id', auth.verifyToken, comprasController.updateRequerimiento);

// Rutas para aprobar/rechazar requerimientos
router.patch('/requerimientos/:id/aprobar', auth.verifyToken, comprasController.aprobarRequerimiento);
router.patch('/requerimientos/:id/rechazar', auth.verifyToken, comprasController.rechazarRequerimiento);
// Ruta para exportar pdf de requerimiento
router.get('/requerimientos/:id/export-pdf', auth.verifyToken, comprasController.exportRequerimientoPDF);

// Ruta para obtener datos para crear orden desde requerimiento
router.get('/requerimientos/:id/orden-datos', auth.verifyToken, comprasController.getDatosOrdenDesdeRequerimiento);

// =====================================================
// RUTAS PARA ÓRDENES DE COMPRA
// =====================================================
router.get('/ordenes-compra/next-number', auth.verifyToken, comprasController.getNextOrdenNumber);
router.get('/ordenes-compra', auth.verifyToken, comprasController.getAllOrdenesCompra);
router.post('/ordenes-compra', auth.verifyToken, comprasController.createOrdenCompra);
router.get('/ordenes-compra/formulario/datos', auth.verifyToken, comprasController.getDatosFormularioOrden);
router.get('/ordenes-compra/:id', auth.verifyToken, comprasController.getOrdenCompraDetalles);
router.get('/ordenes-compra/:id/detalles', auth.verifyToken, comprasController.getOrdenCompraDetalles);
router.put('/ordenes-compra/:id', auth.verifyToken, comprasController.updateOrdenCompra);
router.patch('/ordenes-compra/:id/estado', auth.verifyToken, comprasController.updateEstadoOrdenCompra);

router.get('/ordenes-compra/:id/pdf', auth.verifyToken, comprasController.generarOrdenCompraPDF);

router.patch('/ordenes-compra/detalle/:id/linea-cerrada', auth.verifyToken, comprasController.actualizarLineaCerrada);

module.exports = router;