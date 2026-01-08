import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Usuarios from './pages/Usuarios';

import Sidebar from './components/Sidebar';
import './App.css';

// Importar páginas de Almacén
import Productos from './pages/almacen/Productos';
import ProductoForm from './pages/almacen/ProductoForm';
import ProductoDetalle from './pages/almacen/ProductoDetalle';
import Categorias from './pages/almacen/Categorias';
import Almacenes from './pages/almacen/Almacenes';
import ConsultaStock from './pages/almacen/ConsultaStock';

import Movimientos from './pages/almacen/Movimientos';
import Notas from './pages/almacen/Notas';
import Kardex from './pages/almacen/Kardex';
import ReportesAlmacen from './pages/almacen/ReportesAlmacen';

// Importar páginas de Compras
import DashboardCompras from './pages/compras/DashboardCompras';
import Requerimientos from './pages/compras/Requerimientos';
import OrdenesCompra from './pages/compras/OrdenesCompra';
import Proveedores from './pages/compras/Proveedores';

// Importar páginas de Mantenimiento
import DashboardMantenimiento from './pages/mantenimiento/DashboardMantenimiento';
import Equipos from './pages/mantenimiento/Equipos';
import Evaluaciones from './pages/mantenimiento/Evaluaciones';
import EvaluacionesForm from './pages/mantenimiento/EvaluacionesForm';
import EvaluacionesDetalle from './pages/mantenimiento/EvaluacionesDetalle';
import Planificacion from './pages/mantenimiento/Planificacion';
import CotizacionList from './pages/mantenimiento/CotizacionList';

// IMPORTAR PÁGINAS DE ÓRDENES DE TRABAJO
import OrdenesTrabajoList from './pages/mantenimiento/ordenesTrabajo/OrdenesTrabajoList';
import OrdenTrabajoForm from './pages/mantenimiento/ordenesTrabajo/OrdenTrabajoForm';
import OrdenTrabajoDetalle from './pages/mantenimiento/ordenesTrabajo/OrdenTrabajoDetalle';

// Importar páginas de Ventas
import Ventas from './pages/ventas/Ventas';
import Clientes from './pages/ventas/Clientes';
import Vendedores from './pages/ventas/Vendedores';
import Transportistas from './pages/ventas/Transportistas';
import Vehiculos from './pages/ventas/Vehiculos';
import Choferes from './pages/ventas/Choferes';
import Cotizaciones from './pages/ventas/Cotizaciones';
import Pedidos from './pages/ventas/Pedidos';
import OrdenesFabricacion from './pages/ventas/OrdenesFabricacion';
import GuiasRemision from './pages/ventas/GuiasRemision';


import PlanCuentas from './pages/contabilidad/PlanCuentas';
import FacturaCompra from './pages/contabilidad/FacturaCompra';
import TipoCambio from './pages/contabilidad/TipoCambio';

// NUEVA IMPORTACIÓN: Consulta RUC
import ConsultaRuc from './pages/herramientas/ConsultaRuc';
import ConsultaDni from './pages/herramientas/ConsultaDni';


// --- Wrappers para manejar la navegación y props dinámicas ---

// Wrapper para el Listado (Evaluaciones.jsx)
const EvaluacionesWrapper = () => {
  const navigate = useNavigate();
  return <Evaluaciones navigate={navigate} />;
};

// Wrapper para el Formulario (EvaluacionesForm.jsx) - Captura los IDs
const EvaluacionesFormWrapper = () => {
  const navigate = useNavigate();
  const pathname = window.location.pathname;
  const parts = pathname.split('/');

  let recepcionId = null;
  let evaluacionId = null;

  const accionIndex = 3;
  const idIndex = 4;

  if (parts[accionIndex] === 'crear') {
    recepcionId = parts[idIndex];
  } else if (parts[accionIndex] === 'editar') {
    evaluacionId = parts[idIndex];
  }

  return <EvaluacionesForm recepcionId={recepcionId} evaluacionId={evaluacionId} navigate={navigate} />;
};

// Wrapper para el Detalle (EvaluacionesDetalle.jsx) - Captura el ID de detalle
const EvaluacionesDetalleWrapper = () => {
  const navigate = useNavigate();
  const id = window.location.pathname.split('/').pop();
  return <EvaluacionesDetalle id={id} navigate={navigate} />;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        console.log("Datos cargados del localStorage:", parsedUser);
        setIsAuthenticated(true);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error("Error al cargar datos de sesión:", error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, []);

  const handleLogin = (userData, token) => {
    console.log("Datos del usuario recibidos en login:", userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser({
      ...userData,
      permisos: userData.permisos || []
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  const hasPermissionToRoute = (ruta) => {
    if (user?.rol_id === 1) return true;

    if (!user?.permisos || user.permisos.length === 0) return false;

    return user.permisos.some(permiso => permiso.ruta === ruta);
  };

  return (
    <Router>
      <div className="app-container">
        {isAuthenticated && <Sidebar user={user} onLogout={handleLogout} />}

        <div className={`main-content ${isAuthenticated ? 'with-sidebar' : ''}`}>
          <Routes>
            <Route
              path="/login"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" />
                ) : (
                  <Login onLogin={handleLogin} />
                )
              }
            />

            <Route
              path="/dashboard"
              element={
                isAuthenticated ? (
                  <Dashboard user={user} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />

            <Route
              path="/usuarios"
              element={
                isAuthenticated && user?.rol_id === 1 ? (
                  <Usuarios user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />

            <Route
              path="/perfil"
              element={
                isAuthenticated ? (
                  <div>Página de Perfil (pendiente de implementar)</div>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />

            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />

            {/* Rutas de Almacén */}
            <Route
              path="/almacen/productos"
              element={
                isAuthenticated && hasPermissionToRoute('almacen') ? (
                  <Productos user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />

            <Route
              path="/almacen/productos/nuevo"
              element={
                isAuthenticated && hasPermissionToRoute('almacen') ? (
                  <ProductoForm user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />

            <Route
              path="/almacen/productos/:id"
              element={
                isAuthenticated && hasPermissionToRoute('almacen') ? (
                  <ProductoDetalle user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />

            <Route
              path="/almacen/categorias"
              element={
                isAuthenticated && hasPermissionToRoute('almacen') ? (
                  <Categorias user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />

            <Route
              path="/almacen/almacenes"
              element={
                isAuthenticated && hasPermissionToRoute('almacen') ? (
                  <Almacenes user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              } 
            />

            <Route 
              path="/almacen/consulta-stock" 
              element={
                isAuthenticated && hasPermissionToRoute('almacen') ? (
                  <ConsultaStock user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              } 
            />

            <Route 
              path="/almacen/notas" 
              element={
                isAuthenticated && hasPermissionToRoute('almacen') ? (
                  <Notas user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />

            <Route 
              path="/almacen/movimientos" 
              element={
                isAuthenticated && hasPermissionToRoute('almacen') ? (
                  <Movimientos user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />

            <Route 
              path="/almacen/kardex" 
              element={
                isAuthenticated && hasPermissionToRoute('almacen') ? (
                  <Kardex user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />

            <Route 
              path="/almacen/reportes" 
              element={
                isAuthenticated && hasPermissionToRoute('almacen') ? (
                  <ReportesAlmacen user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              } 
            />


            {/* Rutas de Compras */}
            <Route
              path="/compras/dashboard"
              element={
                isAuthenticated && hasPermissionToRoute('compras') ? (
                  <DashboardCompras user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />

            <Route
              path="/compras/requerimientos"
              element={
                isAuthenticated && hasPermissionToRoute('compras') ? (
                  <Requerimientos user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />

            <Route
              path="/compras/ordenes-compra"
              element={
                isAuthenticated && hasPermissionToRoute('compras') ? (
                  <OrdenesCompra user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />

            <Route
              path="/compras/proveedores"
              element={
                isAuthenticated && hasPermissionToRoute('compras') ? (
                  <Proveedores user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />

            {/* Rutas de Contabilidad */}
            <Route
              path="/contabilidad/plan-cuentas"
              element={
                isAuthenticated && hasPermissionToRoute('contabilidad_plan_cuentas') ? (
                  <PlanCuentas user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />

            <Route
              path="/contabilidad/factura-compra"
              element={
                isAuthenticated && hasPermissionToRoute('contabilidad') ? (
                  <FacturaCompra user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />

            <Route
              path="/contabilidad/tipo-cambio"
              element={
                isAuthenticated && hasPermissionToRoute('contabilidad') ? (
                  <TipoCambio user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />

            {/* Rutas de Ventas */}
            <Route
              path="/venta/ventas"
              element={
                isAuthenticated && hasPermissionToRoute('venta_ventas') ? (
                  <Ventas user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />

            <Route
              path="/venta/clientes"
              element={
                isAuthenticated && hasPermissionToRoute('venta_clientes') ? (
                  <Clientes user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />

            <Route
              path="/venta/vendedores"
              element={
                isAuthenticated && hasPermissionToRoute('venta_vendedores') ? (
                  <Vendedores user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />


            <Route
              path="/venta/transportistas"
              element={
                isAuthenticated && hasPermissionToRoute('venta_transportista') ? (
                  <Transportistas user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />

            <Route
              path="/venta/vehiculos"
              element={
                isAuthenticated && hasPermissionToRoute('venta_vehiculos') ? (
                  <Vehiculos user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />

            <Route
              path="/venta/choferes"
              element={
                isAuthenticated && hasPermissionToRoute('venta_choferes') ? (
                  <Choferes user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />

            <Route
              path="/venta/cotizaciones"
              element={
                isAuthenticated && hasPermissionToRoute('venta_cotizaciones') ? (
                  <Cotizaciones user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />

            <Route
              path="/venta/pedidos"
              element={
                isAuthenticated && hasPermissionToRoute('venta_pedidos') ? (
                  <Pedidos user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />

            <Route
              path="/venta/ordenes-fabricacion"
              element={
                isAuthenticated && hasPermissionToRoute('venta_ordenes_fabricacion') ? (
                  <OrdenesFabricacion user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />

            <Route
              path="/venta/guias"
              element={
                isAuthenticated && hasPermissionToRoute('venta_guias') ? (
                  <GuiasRemision user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />


            {/* Rutas de Mantenimiento */}
            <Route
              path="/mantenimiento/dashboard"
              element={
                isAuthenticated && hasPermissionToRoute('mantenimiento') ? (
                  <DashboardMantenimiento user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )

              }
            />

            <Route
              path="/mantenimiento/equipos"
              element={
                isAuthenticated && hasPermissionToRoute('mantenimiento') ? (
                  <Equipos user={user} /> // <-- USAR EL COMPONENTE EQUIPOS
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />

            {/* Rutas de EVALUACIONES (Listado) */}
            <Route path="/mantenimiento/evaluaciones" element={
              isAuthenticated && hasPermissionToRoute('mantenimiento_evaluaciones') ? (
                <EvaluacionesWrapper />
              ) : (
                <Navigate to="/dashboard" />
              )
            }
            />


            {/* Rutas de Formulario (Crear con ID de Recepción) */}
            <Route path="/mantenimiento/evaluaciones/crear/:recepcionId" element={
              isAuthenticated && hasPermissionToRoute('mantenimiento_evaluaciones') ? (
                <EvaluacionesFormWrapper />
              ) : (
                <Navigate to="/dashboard" />
              )
            }
            />


            {/* Rutas de Formulario (Editar con ID de Evaluación) */}
            <Route path="/mantenimiento/evaluaciones/editar/:evaluacionId" element={
              isAuthenticated && hasPermissionToRoute('mantenimiento_evaluaciones') ? (
                <EvaluacionesFormWrapper />
              ) : (
                <Navigate to="/dashboard" />
              )
            }
            />


            {/* Rutas de Detalle (Ver Evaluación) */}
            <Route path="/mantenimiento/evaluaciones/detalle/:id" element={
              isAuthenticated && hasPermissionToRoute('mantenimiento_evaluaciones') ? (
                <EvaluacionesDetalleWrapper />
              ) : (
                <Navigate to="/dashboard" />
              )
            }
            />

            {/* 🆕 RUTAS DE ÓRDENES DE TRABAJO */}
            
            {/* Listado de Órdenes de Trabajo */}
            <Route
              path="/mantenimiento/ordenes-trabajo"
              element={
                isAuthenticated && hasPermissionToRoute('mantenimiento_ordenes_trabajo') ? (
                  <OrdenesTrabajoList user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />

            {/* Formulario de Nueva Orden de Trabajo */}
            <Route
              path="/mantenimiento/ordenes-trabajo/nuevo"
              element={
                isAuthenticated && hasPermissionToRoute('mantenimiento_ordenes_trabajo') ? (
                  <OrdenTrabajoForm user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />

            {/* Detalle de Orden de Trabajo */}
            <Route
              path="/mantenimiento/ordenes-trabajo/:id"
              element={
                isAuthenticated && hasPermissionToRoute('mantenimiento_ordenes_trabajo') ? (
                  <OrdenTrabajoDetalle user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />

            {/* Rutas de COTIZACIÓN MANTENIMIENTO */}
            <Route
              path="/mantenimiento/cotizaciones/listado"
              element={
                isAuthenticated && (user?.rol_id === 1 || hasPermissionToRoute('cotizacion_mantenimiento')) ? (
                  <CotizacionList user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />

            <Route
              path="/mantenimiento/planificacion"
              element={
                isAuthenticated && hasPermissionToRoute('mantenimiento_planificacion') ? (
                  <Planificacion user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />
            

            {/* NUEVA RUTA: Consulta RUC */}
            <Route
              path="/herramientas/consulta-ruc"
              element={
                isAuthenticated && hasPermissionToRoute('herramientas_consulta_ruc') ? (
                  <ConsultaRuc user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />

            {/* NUEVA RUTA: Consulta DNI */}
            <Route
              path="/herramientas/consulta-dni"
              element={
                isAuthenticated && hasPermissionToRoute('herramientas_consulta_dni') ? (
                  <ConsultaDni user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />

          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;