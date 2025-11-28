import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Spin } from 'antd';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, LineChart, Line, Cell
} from 'recharts';
import api from '../../api/api';

const { Title } = Typography;

const DashboardMantenimiento = () => {
  const [loading, setLoading] = useState(true);
  const [equiposPorEstado, setEquiposPorEstado] = useState([]); // Datos para el gráfico de barras
  const [mantenimientosPorTipo, setMantenimientosPorTipo] = useState([]); // Datos para el gráfico de pastel
  const [mantenimientosPorMes, setMantenimientosPorMes] = useState([]); // Datos para el gráfico de líneas
  const [totalEquipos, setTotalEquipos] = useState(0);
  const [totalMantenimientos, setTotalMantenimientos] = useState(0);
  const [totalEquiposOperativos, setTotalEquiposOperativos] = useState(0);
  const [totalEquiposEnMantenimiento, setTotalEquiposEnMantenimiento] = useState(0);
  const [totalEquiposFueraDeServicio, setTotalEquiposFueraDeServicio] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [equiposEstadoRes, mantenimientosTipoRes, mantenimientosMesRes] = await Promise.all([
          api.get('/mantenimiento/dashboard/equipos-por-estado'),
          api.get('/mantenimiento/dashboard/mantenimientos-por-tipo'),
          api.get('/mantenimiento/dashboard/mantenimientos-por-mes')
        ]);

        setEquiposPorEstado(equiposEstadoRes.data);
        setMantenimientosPorTipo(mantenimientosTipoRes.data);
        setMantenimientosPorMes(mantenimientosMesRes.data);

        // Cálculo de totales
        const totalEquiposCalc = equiposEstadoRes.data.reduce((sum, item) => sum + parseInt(item.total), 0);
        setTotalEquipos(totalEquiposCalc);
        setTotalMantenimientos(mantenimientosMesRes.data.reduce((sum, item) => sum + parseInt(item.total), 0));
        setTotalEquiposOperativos(equiposEstadoRes.data.find(item => item.estado === 'Operativo')?.total || 0);
        setTotalEquiposEnMantenimiento(equiposEstadoRes.data.find(item => item.estado === 'En Mantenimiento')?.total || 0);
        setTotalEquiposFueraDeServicio(equiposEstadoRes.data.find(item => item.estado === 'Fuera de Servicio')?.total || 0);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AA336A', '#33AA99'];

  return (
    <div>
      <Title level={2}>Dashboard de Mantenimiento</Title>
      {loading ? (
        <Spin size="large" />
      ) : (
        <>
          <Row gutter={16} style={{ marginBottom: 20 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Total de Equipos"
                  value={totalEquipos}
                  valueStyle={{ color: '#3f8600' }}
                  suffix="equipos"
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Total de Mantenimientos"
                  value={totalMantenimientos}
                  valueStyle={{ color: '#3f8600' }}
                  suffix="mantenimientos"
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Equipos Operativos"
                  value={totalEquiposOperativos}
                  valueStyle={{ color: '#3f8600' }}
                  suffix="equipos"
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Equipos en Mantenimiento"
                  value={totalEquiposEnMantenimiento}
                  valueStyle={{ color: '#cf1322' }}
                  suffix="equipos"
                />
              </Card>
            </Col>
            <Col span={6} style={{ marginTop: 16 }}>
              <Card>
                <Statistic
                  title="Equipos Fuera de Servicio"
                  value={totalEquiposFueraDeServicio}
                  valueStyle={{ color: '#cf1322' }}
                  suffix="equipos"
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={16} style={{ marginBottom: 20 }}>
            <Col span={12}>
              <Card title="Equipos por Estado">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={equiposPorEstado} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="estado" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col span={12}>
              <Card title="Mantenimientos por Tipo">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={mantenimientosPorTipo}
                      dataKey="total"
                      nameKey="tipo"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#82ca9d"
                      label
                    >
                      {mantenimientosPorTipo.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Card title="Mantenimientos por Mes (Año Actual)">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mantenimientosPorMes} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
          </Row>
        </>
      )}
    </div>
  );
};

export default DashboardMantenimiento;
