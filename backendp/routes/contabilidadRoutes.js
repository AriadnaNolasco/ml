const express = require('express');
const router = express.Router();
const contabilidadController = require('../controllers/contabilidadController');
const auth = require('../middlewares/auth');
const { check } = require('express-validator');

// Rutas para bancos
router.get('/bancos', auth.verifyToken, contabilidadController.getAllBancos);
router.get('/bancos/:id', auth.verifyToken, 
    [
        check('id', 'El ID del banco debe ser un número válido').isInt()
    ], contabilidadController.getBancoById
);

// Rutas para centros de costo
router.get('/centros-costo', auth.verifyToken, contabilidadController.getCentrosCosto);
router.post('/centros-costo', auth.verifyToken, contabilidadController.createCentroCosto);

// Rutas para formas de pago
router.get('/formas-pago', auth.verifyToken, contabilidadController.getFormasPago);

// Rutas para monedas
router.get('/monedas', auth.verifyToken, contabilidadController.getMonedas);

//Rutas de cuenta bancarias del proveedor
router.get('/proveedores/cuentas-bancarias/:proveedorId', contabilidadController.getCuentasBancariasByProveedor);

// Rutas para plan de cuentas
router.get('/plan-cuentas', auth.verifyToken, contabilidadController.getAllPlanCuentas);
router.get('/plan-cuentas/:id', auth.verifyToken, 
    [
        check('id', 'El ID del plan de cuenta debe ser un número válido').isInt()
    ], contabilidadController.getPlanCuentaById
);
router.post('/plan-cuentas', auth.verifyToken, 
    [
        check('codigo', 'El código es obligatorio').notEmpty(),
        check('codigo', 'El código debe ser un número').isInt(),
        check('nombre', 'El nombre es obligatorio').notEmpty(),
        check('moneda', 'La moneda debe ser AMBAS, NUEVO SOL o DOLAR').isIn(['AMBAS', 'NUEVO SOL', 'DOLAR']),
        check('balance_comprobacion', 'El balance de comprobación debe ser RESULTADO, SALDO o INVENTARIO').optional().isIn(['RESULTADO', 'SALDO', 'INVENTARIO']),
        check('bg_egp', 'El campo bg_egp debe ser AMBOS, SOLO BALANCE x FUNCION o SOLO NATURALEZA').optional().isIn(['AMBOS', 'SOLO BALANCE x FUNCION', 'SOLO NATURALEZA']),
        check('tipo', 'El tipo debe ser TITULO o DIGITABLE').optional().isIn(['TITULO', 'DIGITABLE']),
        check('transferencias', 'Las transferencias deben ser SIN TRANSFERENCIA o CON TRANSFERENCIA').optional().isIn(['SIN TRANSFERENCIA', 'CON TRANSFERENCIA']),
        check('tabla_egp_balances', 'El campo tabla_egp_balances debe ser uno de los valores permitidos').optional().isIn([
            'ACTIVO CORRIENTE', 'ACTIVO NO CORRIENTE', 'CTAS. ORDEN DEUDORAS', 
            'PASIVO CORRIENTE', 'PASIVO NO CORRIENTE', 'PATRIMONIO', 
            'CTAS. ORDEN ACREEDOR', 'GASTOS POR NATURALEZA', 'UTILIDAD BRUTA', 
            'GASTOS DE OPERACION', 'RESULTADOS', 'R.E.I DEL EJERCICIO'
        ])
    ], contabilidadController.createPlanCuenta
);
router.put('/plan-cuentas/:id', auth.verifyToken, 
    [
        check('id', 'El ID del plan de cuenta debe ser un número válido').isInt(),
        check('codigo', 'El código es obligatorio').notEmpty(),
        check('codigo', 'El código debe ser un número').isInt(),
        check('nombre', 'El nombre es obligatorio').notEmpty(),
        check('moneda', 'La moneda debe ser AMBAS, NUEVO SOL o DOLAR').isIn(['AMBAS', 'NUEVO SOL', 'DOLAR']),
        check('balance_comprobacion', 'El balance de comprobación debe ser RESULTADO, SALDO o INVENTARIO').optional().isIn(['RESULTADO', 'SALDO', 'INVENTARIO']),
        check('bg_egp', 'El campo bg_egp debe ser AMBOS, SOLO BALANCE x FUNCION o SOLO NATURALEZA').optional().isIn(['AMBOS', 'SOLO BALANCE x FUNCION', 'SOLO NATURALEZA']),
        check('tipo', 'El tipo debe ser TITULO o DIGITABLE').optional().isIn(['TITULO', 'DIGITABLE']),
        check('transferencias', 'Las transferencias deben ser SIN TRANSFERENCIA o CON TRANSFERENCIA').optional().isIn(['SIN TRANSFERENCIA', 'CON TRANSFERENCIA']),
        check('tabla_egp_balances', 'El campo tabla_egp_balances debe ser uno de los valores permitidos').optional().isIn([
            'ACTIVO CORRIENTE', 'ACTIVO NO CORRIENTE', 'CTAS. ORDEN DEUDORAS', 
            'PASIVO CORRIENTE', 'PASIVO NO CORRIENTE', 'PATRIMONIO', 
            'CTAS. ORDEN ACREEDOR', 'GASTOS POR NATURALEZA', 'UTILIDAD BRUTA', 
            'GASTOS DE OPERACION', 'RESULTADOS', 'R.E.I DEL EJERCICIO'
        ])
    ], contabilidadController.updatePlanCuenta
);
router.patch('/plan-cuentas/:id/toggle-estado', auth.verifyToken, 
    [
        check('id', 'El ID del plan de cuenta debe ser un número válido').isInt()
    ], contabilidadController.togglePlanCuentaEstado
);

// Rutas para datos de formularios
router.get('/formulario/datos', auth.verifyToken, contabilidadController.getDatosFormulario);

// Rutas para incoterms
router.get('/incoterms', auth.verifyToken, contabilidadController.getIncoterms);

// Rutas para tipos de operación
router.get('/tipos-operacion', auth.verifyToken, contabilidadController.getTiposOperacion);

//Rutas de tipo de cambio
router.get('/tipo-cambio', auth.verifyToken, contabilidadController.getTiposCambio);
router.post('/tipo-cambio', auth.verifyToken, contabilidadController.crearTipoCambio);
router.put('/tipo-cambio/:id', auth.verifyToken, contabilidadController.editarTipoCambio);

// Rutas para el formulario de facturas
router.get('/datos-formulario-facturas', auth.verifyToken, contabilidadController.getDatosFormularioFacturas);
router.get('/tipo-cambio-por-fecha', auth.verifyToken, contabilidadController.getTipoCambioByFecha);

// Rutas para facturas_proveedor
router.get('/facturas-proveedor/next-number', auth.verifyToken, contabilidadController.getNextFacturaProveedorNumber);
router.get('/facturas-proveedor', auth.verifyToken, contabilidadController.getFacturasProveedor);
router.get('/facturas-proveedor/:id/detalles', auth.verifyToken, contabilidadController.getFacturaProveedorById);
router.get('/proveedores/:proveedorId/cuentas-bancarias', auth.verifyToken, contabilidadController.getCuentasBancariasByProveedor);
router.post('/facturas-proveedor', auth.verifyToken, contabilidadController.crearFacturaProveedor);
router.put('/facturas-proveedor/:id', auth.verifyToken, contabilidadController.actualizarFacturaProveedor);
router.delete('/facturas-proveedor/:id', auth.verifyToken, contabilidadController.eliminarFacturaProveedor);
router.get('/orden-compra/:ordenCompraId/productos', auth.verifyToken, contabilidadController.getProductosOrdenCompra);


module.exports = router;