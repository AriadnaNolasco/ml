import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Layout, 
  Menu, 
  Avatar, 
  Typography, 
  Button
} from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  LogoutOutlined,
  TeamOutlined,
  CalculatorOutlined,
  DollarOutlined,
  BarChartOutlined,
  BoxPlotOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  TruckOutlined,
  FileSearchOutlined  // Icono para Consulta RUC
} from '@ant-design/icons';

const { Sider } = Layout;
const { SubMenu } = Menu;
const { Text } = Typography;

const Sidebar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const hasPermission = (ruta) => {
    if (user?.rol_id === 1) return true;
    if (ruta === 'perfil' || ruta === 'dashboard') return true;
    if (!user?.permisos || user.permisos.length === 0) return false;
    return user.permisos.some(permiso => permiso.ruta === ruta);
  };

  const getMenuItemIcon = (iconName) => {
    const iconProps = { style: { fontSize: '16px' } };
    
    switch(iconName) {
      case 'FaHome': return <DashboardOutlined {...iconProps} />;
      case 'FaUsers': return <TeamOutlined {...iconProps} />;
      case 'FaUserCog': return <UserOutlined {...iconProps} />;
      case 'FaCalculator': return <CalculatorOutlined {...iconProps} />;
      case 'FaMoneyBillWave': return <DollarOutlined {...iconProps} />;
      case 'FaChartLine': return <BarChartOutlined {...iconProps} />;
      case 'FaBoxes': return <BoxPlotOutlined {...iconProps} />;
      case 'FaTruck': return <TruckOutlined {...iconProps} />;
      case 'FaShoppingCart': return <ShoppingOutlined {...iconProps} />;
      case 'FaFileAlt': return <FileTextOutlined {...iconProps} />;
      case 'FaSearch': return <FileSearchOutlined {...iconProps} />;  // Icono para Consulta RUC
      default: return <DashboardOutlined {...iconProps} />;
    }
  };

  const paginas = [
    { path: '/dashboard', icon: 'FaHome', name: 'Dashboard', ruta: 'dashboard' },
    { path: '/usuarios', icon: 'FaUsers', name: 'Usuarios', ruta: 'usuarios', adminOnly: true },
    
    { 
      path: '/almacen', 
      icon: 'FaBoxes', 
      name: 'Almacén', 
      ruta: 'almacen',
      hasSubmenu: true,
      submenu: [
        { path: '/almacen/productos', name: 'Productos', ruta: 'almacen_productos' },
        { path: '/almacen/categorias', name: 'Categorías', ruta: 'almacen_categorias' },
        { path: '/almacen/almacenes', name: 'Almacenes', ruta: 'almacen_almacenes' },
        { path: '/almacen/notas-ingreso', name: 'Notas de Ingreso', ruta: 'almacen' },
      ]
    },
    
    { 
      path: '/compras', 
      icon: 'FaShoppingCart', 
      name: 'Compras', 
      ruta: 'compras',
      hasSubmenu: true,
      submenu: [
        { path: '/compras/dashboard', name: 'Dashboard Compras', ruta: 'compras_dashboard' },
        { path: '/compras/requerimientos', name: 'Requerimientos', ruta: 'compras_requerimientos' },
        { path: '/compras/ordenes-compra', name: 'Órdenes de Compra', ruta: 'compras_ordenes' },
        { path: '/compras/proveedores', name: 'Proveedores', ruta: 'compras_proveedores' },
      ]
    },

    { 
      path: '/contabilidad', 
      icon: 'FaCalculator', 
      name: 'Contabilidad', 
      ruta: 'contabilidad',
      hasSubmenu: true,
      submenu: [
        { path: '/contabilidad/factura-compra', name: 'Factura de Compras', ruta: 'contabilidad_factura_compra' },
        { path: '/contabilidad/tipo-cambio', name: 'Tipo Cambio', ruta: 'contabilidad_tipo_cambio' },
        { path: '/contabilidad/plan-cuentas', name: 'Plan de Cuentas', ruta: 'contabilidad_plan_cuentas' },
        { path: '/contabilidad/centros-costo', name: 'Centros de Costo', ruta: 'contabilidad_centros_costo' },
        { path: '/contabilidad/bancos', name: 'Bancos', ruta: 'contabilidad_bancos' },
      ]
    },

    { 
      path: '/ventas', 
      icon: 'FaChartLine', 
      name: 'Venta', 
      ruta: 'venta',
      hasSubmenu: true,
      submenu: [
        { path: '/venta/ventas', name: 'Ventas', ruta: 'venta_ventas' },
        { path: '/venta/clientes', name: 'Clientes', ruta: 'venta_clientes' },
        { path: '/venta/vendedores', name: 'Vendedores', ruta: 'venta_vendedores' },
        { path: '/venta/transportistas', name: 'Transportistas', ruta: 'venta_transportistas' },
        { path: '/venta/vehiculos', name: 'Vehículos', ruta: 'venta_vehiculos' },
        { path: '/venta/choferes', name: 'Choferes', ruta: 'venta_choferes'},
        { path: "/venta/cotizaciones", name: "Cotizaciones", ruta: "venta_cotizaciones"},
        { path: "/venta/pedidos", name: "Pedidos", ruta: "venta_pedidos" },
      ]
    },


  //MANTENIMIENTO

  { 
  path: '/mantenimiento', 
  icon: 'FaWrench',   
  name: 'Mantenimiento', 
  ruta: 'mantenimiento',
  hasSubmenu: true,
  submenu: [
    { path: '/mantenimiento/dashboard', name: 'Dashboard Mantenimiento', ruta: 'mantenimiento_dashboard' },
    { path: '/mantenimiento/equipos', name: 'Equipos', ruta: 'mantenimiento_equipos' },
    { path: '/mantenimiento/evaluaciones', name: 'Evaluaciones', ruta: 'mantenimiento_evaluaciones' },
    { path: '/mantenimiento/planificacion', name: 'Planificación', ruta: 'mantenimiento_planificacion' },
    { path: '/mantenimiento/cotizaciones/listado', name: 'Gestión de Cotizaciones', ruta: 'cotizacion_mantenimiento' },
    
  ]
},




    // NUEVA SECCIÓN: CONSULTA RUC
    { 
      path: '/herramientas', 
      icon: 'FaSearch', 
      name: 'Herramientas', 
      ruta: 'herramientas',
      hasSubmenu: true,
      submenu: [
        { path: '/herramientas/consulta-ruc', name: 'Consulta RUC', ruta: 'herramientas_consulta_ruc' },
        { path: '/herramientas/consulta-dni', name: 'Consulta DNI', ruta: 'herramientas_consulta_dni' },
        // Puedes agregar más herramientas aquí en el futuro
        // { path: '/herramientas/consulta-dni', name: 'Consulta DNI', ruta: 'herramientas_consulta_dni' },
      ]
    },
    
    { path: '/cuentas_por_pagar', icon: 'FaMoneyBillWave', name: 'Cuentas por Pagar', ruta: 'cuentas_por_pagar' },
    { path: '/perfil', icon: 'FaUserCog', name: 'Mi Perfil', ruta: 'perfil' }
  ];

  const renderMenuItems = () => {
    return paginas.map((pagina) => {
      if (pagina.adminOnly && user?.rol_id !== 1) return null;
      
      const tienePermiso = hasPermission(pagina.ruta);
      if (!tienePermiso) return null;

      if (pagina.hasSubmenu) {
        const subItems = pagina.submenu.filter(subitem => 
          hasPermission(subitem.ruta)
        );

        if (subItems.length === 0) return null;

        return (
          <SubMenu
            key={pagina.path}
            icon={getMenuItemIcon(pagina.icon)}
            title={pagina.name}
          >
            {subItems.map((subitem) => (
              <Menu.Item key={subitem.path}>
                <NavLink to={subitem.path}>
                  {subitem.name}
                </NavLink>
              </Menu.Item>
            ))}
          </SubMenu>
        );
      }

      return (
        <Menu.Item key={pagina.path} icon={getMenuItemIcon(pagina.icon)}>
          <NavLink to={pagina.path}>
            {pagina.name}
          </NavLink>
        </Menu.Item>
      );
    });
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column'
      }}
      theme="light"
    >
      <div style={{ 
        padding: '16px', 
        textAlign: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        flexShrink: 0
      }}>
        <Avatar 
          size={collapsed ? 32 : 64} 
          icon={<UserOutlined />} 
          style={{ marginBottom: collapsed ? 0 : '10px' }}
        />
        {!collapsed && (
          <>
            <div style={{ marginTop: '10px' }}>
              <Text style={{ fontSize: '16px', fontWeight: 'bold' }}>
                Panel de Control
              </Text>
            </div>
            <div style={{ marginTop: '5px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {user?.username}
              </Text>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: '10px' }}>
                Rol ID: {user?.rol_id}
              </Text>
            </div>
          </>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        <Menu 
          theme="light" 
          mode="inline"
          defaultSelectedKeys={['/dashboard']}
          style={{ marginTop: '16px' }}
        >
          {renderMenuItems()}
        </Menu>
      </div>

      <div style={{ 
        padding: '16px', 
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        flexShrink: 0
      }}>
        <Button 
          type="text" 
          icon={<LogoutOutlined />} 
          onClick={handleLogout}
          style={{ 
            color: 'rgba(0, 0, 0, 0.65)', 
            width: '100%',
            textAlign: 'left'
          }}
        >
          {!collapsed && 'Cerrar Sesión'}
        </Button>
      </div>
    </Sider>
  );
};

export default Sidebar;