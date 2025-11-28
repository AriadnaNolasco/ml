// routes/ventasRoutes.js
const express = require("express");
const router = express.Router();
const ventasController = require("../controllers/ventasControllers");
const auth = require("../middlewares/auth");

// Rutas para vendedores
router.get("/vendedores", auth.verifyToken, ventasController.obtenerVendedores);
router.get(
  "/vendedores/:codigo",
  auth.verifyToken,
  ventasController.obtenerVendedorPorCodigo
);
router.post("/vendedores", auth.verifyToken, ventasController.crearVendedor);
router.put(
  "/vendedores/:codigo",
  auth.verifyToken,
  ventasController.actualizarVendedor
);
router.delete(
  "/vendedores/:codigo",
  auth.verifyToken,
  ventasController.eliminarVendedor
);

// Rutas para clientes
router.get("/clientes", auth.verifyToken, ventasController.obtenerClientes);
router.get(
  "/clientes-activos",
  auth.verifyToken,
  ventasController.obtenerClientesActivos
);
router.get(
  "/clientes/:codigo",
  auth.verifyToken,
  ventasController.obtenerClientePorCodigo
);
router.post("/clientes", auth.verifyToken, ventasController.crearCliente);
router.put(
  "/clientes/:codigo",
  auth.verifyToken,
  ventasController.actualizarCliente
);
router.delete(
  "/clientes/:codigo",
  auth.verifyToken,
  ventasController.eliminarCliente
);
router.put(
  "/clientes/:codigo/info-financiera",
  auth.verifyToken,
  ventasController.actualizarInfoFinancieraCliente
);

// Rutas para transportistas
router.get(
  "/transportistas",
  auth.verifyToken,
  ventasController.obtenerTransportistas
);
router.get(
  "/transportistas/:codigo",
  auth.verifyToken,
  ventasController.obtenerTransportistaPorCodigo
);
router.post(
  "/transportistas",
  auth.verifyToken,
  ventasController.crearTransportista
);
router.put(
  "/transportistas/:codigo",
  auth.verifyToken,
  ventasController.actualizarTransportista
);
router.delete(
  "/transportistas/:codigo",
  auth.verifyToken,
  ventasController.eliminarTransportista
);

// Rutas para puntos de partida
router.get(
  "/puntos-partida",
  auth.verifyToken,
  ventasController.obtenerPuntosPartida
);
router.get(
  "/puntos-partida/:codigo",
  auth.verifyToken,
  ventasController.obtenerPuntoPartidaPorCodigo
);
router.post(
  "/puntos-partida",
  auth.verifyToken,
  ventasController.crearPuntoPartida
);
router.put(
  "/puntos-partida/:codigo",
  auth.verifyToken,
  ventasController.actualizarPuntoPartida
);
router.delete(
  "/puntos-partida/:codigo",
  auth.verifyToken,
  ventasController.eliminarPuntoPartida
);

// Rutas para vehículos
router.get("/vehiculos", auth.verifyToken, ventasController.obtenerVehiculos);
router.get(
  "/vehiculos/:placa",
  auth.verifyToken,
  ventasController.obtenerVehiculoPorPlaca
);
router.post("/vehiculos", auth.verifyToken, ventasController.crearVehiculo);
router.put(
  "/vehiculos/:placa",
  auth.verifyToken,
  ventasController.actualizarVehiculo
);
router.delete(
  "/vehiculos/:placa",
  auth.verifyToken,
  ventasController.eliminarVehiculo
);

// Rutas para choferes
router.get("/choferes", auth.verifyToken, ventasController.obtenerChoferes);
router.get(
  "/choferes/:codigo",
  auth.verifyToken,
  ventasController.obtenerChoferPorCodigo
);
router.post("/choferes", auth.verifyToken, ventasController.crearChofer);
router.put(
  "/choferes/:codigo",
  auth.verifyToken,
  ventasController.actualizarChofer
);
router.delete(
  "/choferes/:codigo",
  auth.verifyToken,
  ventasController.eliminarChofer
);
router.get(
  "/choferes/formularios/opciones",
  auth.verifyToken,
  ventasController.obtenerOpcionesChoferes
);

// ============================================
// RUTAS ACTUALIZADAS PARA COTIZACIONES
// ============================================

// Buscar cliente para cotización (por código, documento o razón social)
router.get(
  "/cotizaciones/buscar-cliente",
  auth.verifyToken,
  ventasController.obtenerCotizacionCliente
);

// Obtener productos disponibles para cotización
router.get(
  "/cotizaciones/productos",
  auth.verifyToken,
  ventasController.obtenerProductosCotizacion
);

// ✅ NUEVA RUTA: Crear cotización completa (cabecera + detalles en una sola transacción)
router.post(
  "/cotizaciones/completa",
  auth.verifyToken,
  ventasController.crearCotizacionCompleta
);

// ✅ NUEVA RUTA: Actualizar cotización completa (cabecera + detalles)
router.put(
  "/cotizaciones/:id/completa",
  auth.verifyToken,
  ventasController.actualizarCotizacionCompleta
);

// Obtener todas las cotizaciones (ya está actualizada en el controlador)
router.get(
  "/cotizaciones",
  auth.verifyToken,
  ventasController.obtenerCotizaciones
);

// Obtener cotización por ID (mejorada con todos los campos y detalles)
router.get(
  "/cotizaciones/:id",
  auth.verifyToken,
  ventasController.obtenerCotizacionPorId
);

// Agregar esta ruta en ventasRoutes.js
router.get(
  "/cotizaciones/cliente/:cliente_id",
  auth.verifyToken,
  ventasController.obtenerCotizacionesPorCliente
);

// Obtener detalle de cotización (para casos específicos)
router.get(
  "/cotizaciones/:id/detalle",
  auth.verifyToken,
  ventasController.obtenerDetalleCotizacion
);
// ✅ NUEVA RUTA: Generar PDF de cotización
router.get(
  "/cotizaciones/:id/pdf",
  auth.verifyToken,
  ventasController.generarPDFCotizacion
);

// ✅ RUTA CORREGIDA: Aprobar cotización
router.put(
  "/cotizaciones/:id/aprobar",
  auth.verifyToken,
  ventasController.aprobarCotizacion
);

// ✅ RUTA CORREGIDA: Rechazar cotización (cambiar a /rechazar)
router.put(
  "/cotizaciones/:id/rechazar",
  auth.verifyToken,
  ventasController.rechazarCotizacion
);
// ============================================
// RUTAS PARA FORMULARIOS Y UBICACIONES
// ============================================

// Ruta para obtener departamentos por país
router.get(
  "/ubicaciones/departamentos/:paisId",
  auth.verifyToken,
  ventasController.obtenerDepartamentosPorPais
);

// Ruta para obtener distritos por departamento
router.get(
  "/ubicaciones/distritos/:departamentoId",
  auth.verifyToken,
  ventasController.obtenerDistritosPorDepartamento
);

// Ruta para obtener datos de formularios
router.get(
  "/formularios/datos",
  auth.verifyToken,
  ventasController.obtenerDatosFormulario
);

module.exports = router;
