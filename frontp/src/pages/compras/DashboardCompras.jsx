import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Spin, Table, Tag } from 'antd';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, LineChart, Line, Cell 
} from 'recharts';
import api from '../../api/api';

const { Title } = Typography;

const DashboardCompras = () => {
  const [loading, setLoading] = useState(true);

  // Estados
  const [ordenesPorMes, setOrdenesPorMes] = useState([]);
  const [montosPorTipoMoneda, setMontosPorTipoMoneda] = useState([]);
  const [ordenesTiempo, setOrdenesTiempo] = useState({});
  const [ahorros, setAhorros] = useState({});
  const [proveedoresActivos, setProveedoresActivos] = useState([]);
  const [topProveedores, setTopProveedores] = useState([]);
  const [productosTop, setProductosTop] = useState([]);
  const [ordenesVencidas, setOrdenesVencidas] = useState([]);
  const [reqPendientes, setReqPendientes] = useState([]);

  // Colores para gráficos
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  
  // Datos para el gráfico de órdenes a tiempo vs retrasadas
  const dataTiempoRetrasadas = [
    { name: 'A Tiempo', value: ordenesTiempo.a_tiempo || 0 },
    { name: 'Retrasadas', value: ordenesTiempo.retrasadas || 0 }
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [
          resOrdenesMes,
          resMontosTipoMoneda,
          resOrdenesTiempo,
          resAhorros,
          resProveedoresActivos,
          resTopProveedores,
          resProductosTop,
          resOrdenesVencidas,
          resReqPendientes
        ] = await Promise.all([
          api.get('/compras/dashboard/ordenes-por-mes'),
          api.get('/compras/dashboard/montos-por-tipo-moneda'),
          api.get('/compras/dashboard/ordenes-tiempo'),
          api.get('/compras/dashboard/ahorros'),
          api.get('/compras/dashboard/proveedores-activos'),
          api.get('/compras/dashboard/top-proveedores'),
          api.get('/compras/dashboard/productos-top'),
          api.get('/compras/dashboard/ordenes-vencidas'),
          api.get('/compras/dashboard/requerimientos-pendientes'),
        ]);

        setOrdenesPorMes(resOrdenesMes.data);
        setMontosPorTipoMoneda(resMontosTipoMoneda.data);
        setOrdenesTiempo(resOrdenesTiempo.data);
        setAhorros(resAhorros.data);
        setProveedoresActivos(resProveedoresActivos.data);
        setTopProveedores(resTopProveedores.data);
        setProductosTop(resProductosTop.data);
        setOrdenesVencidas(resOrdenesVencidas.data);
        setReqPendientes(resReqPendientes.data);

      } catch (error) {
        console.error('Error cargando datos del dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Columnas para tablas
  const columnasOrdenesVencidas = [
    {
      title: 'Número',
      dataIndex: 'numero',
      key: 'numero',
    },
    {
      title: 'Fecha Entrega Prevista',
      dataIndex: 'fecha_entrega_prevista',
      key: 'fecha_entrega_prevista',
      render: (fecha) => new Date(fecha).toLocaleDateString()
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (estado) => <Tag color="red">{estado}</Tag>
    },
  ];

  const columnasReqPendientes = [
    {
      title: 'Número',
      dataIndex: 'numero',
      key: 'numero',
    },
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      key: 'fecha',
      render: (fecha) => new Date(fecha).toLocaleDateString()
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (estado) => <Tag color="orange">{estado}</Tag>
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <Title level={3}>Dashboard de Compras</Title>

      {/* Indicadores */}
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Órdenes Totales (Mes Actual)"
              value={ordenesPorMes.reduce((sum, item) => sum + Number(item.total || 0), 0)}
            />
          </Card>
        </Col>

        <Col span={6}>
          <Card>
            <Statistic
              title="Ahorro Total"
              value={ahorros.total_ahorrado || 0}
              precision={2}
              prefix="$"
            />
          </Card>
        </Col>

        <Col span={6}>
          <Card>
            <Statistic
              title="Proveedores Activos"
              value={proveedoresActivos.length}
            />
          </Card>
        </Col>

        <Col span={6}>
          <Card>
            <Statistic
              title="Req. Pendientes"
              value={reqPendientes.length}
            />
          </Card>
        </Col>
      </Row>

      {/* Bloques para los gráficos */}
      <Row gutter={[16, 16]} style={{ marginTop: '20px' }}>
        <Col span={12}>
          <Card title="Órdenes por Mes">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ordenesPorMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="Montos por Tipo y Moneda">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={montosPorTipoMoneda}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tipo" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="monto_total" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '20px' }}>
        <Col span={12}>
          <Card title="Top Proveedores">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={topProveedores} 
                layout="vertical"
                margin={{ left: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  type="category" 
                  dataKey="razon_social" 
                  width={80}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Bar dataKey="monto_total" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="Productos más comprados">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productosTop}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="descripcion" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total_comprado" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '20px' }}>
        <Col span={8}>
          <Card title="Órdenes Retrasadas vs a Tiempo">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={dataTiempoRetrasadas}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dataTiempoRetrasadas.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#00C49F' : '#FF8042'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <strong>{ordenesTiempo.a_tiempo || 0}</strong> a tiempo /{' '}
              <strong>{ordenesTiempo.retrasadas || 0}</strong> retrasadas
            </div>
          </Card>
        </Col>

        <Col span={8}>
          <Card title="Órdenes Vencidas" style={{ height: '100%' }}>
            <div style={{ marginBottom: '10px' }}>
              <Statistic
                value={ordenesVencidas.length}
                suffix="pendientes"
                valueStyle={{ color: ordenesVencidas.length > 0 ? '#cf1322' : '#3f8600' }}
              />
            </div>
            {ordenesVencidas.length > 0 && (
              <Table
                dataSource={ordenesVencidas}
                columns={columnasOrdenesVencidas}
                pagination={{ pageSize: 3 }}
                size="small"
                scroll={{ y: 150 }}
              />
            )}
          </Card>
        </Col>

        <Col span={8}>
          <Card title="Requerimientos Pendientes" style={{ height: '100%' }}>
            <div style={{ marginBottom: '10px' }}>
              <Statistic
                value={reqPendientes.length}
                suffix="pendientes"
                valueStyle={{ color: reqPendientes.length > 0 ? '#faad14' : '#3f8600' }}
              />
            </div>
            {reqPendientes.length > 0 && (
              <Table
                dataSource={reqPendientes}
                columns={columnasReqPendientes}
                pagination={{ pageSize: 3 }}
                size="small"
                scroll={{ y: 150 }}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardCompras;