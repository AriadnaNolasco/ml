import React, { useEffect, useState } from 'react';
import {
  Card, Row, Col, Button, Table, Tag, Typography, Calendar, Modal, message
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import {
  getPlanes,
  getResumen,
  getCalendario,
  eliminarPlan,
} from '../../api/apiPlanificacion';

import CrearPlan from './components/CrearPlan';

const { Title, Text } = Typography;

const Planificacion = () => {
  const [planes, setPlanes] = useState([]);
  const [resumen, setResumen] = useState({});
  const [calendario, setCalendario] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Cargar todo
  const cargarDatos = async () => {
    setLoading(true);
    try {
      const planesResp = await getPlanes();
      const resumenResp = await getResumen();

      setPlanes(planesResp.data);
      setResumen(resumenResp.data);

      // Calendario del mes actual
      const now = dayjs();
      const calendarioResp = await getCalendario(now.year(), now.month() + 1);
      setCalendario(calendarioResp.data);
    } catch (error) {
      message.error('Error cargando planificación');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Render de fechas en el calendario
  const dateCellRender = (value) => {
    const fecha = value.format("YYYY-MM-DD");
    const eventos = calendario.filter(ev => ev.fecha_programada === fecha);

    if (eventos.length === 0) return null;

    return (
      <ul style={{ padding: 0 }}>
        {eventos.map((ev, index) => (
          <li key={index}>
            <Tag
              color={ev.tipo === 'PREVENTIVO' ? 'blue' : 'orange'}
              style={{ fontSize: '10px' }}
            >
              {ev.tipo}
            </Tag>
          </li>
        ))}
      </ul>
    );
  };

  // Acciones tabla
  const eliminar = async (id) => {
    Modal.confirm({
      title: '¿Eliminar plan?',
      onOk: async () => {
        await eliminarPlan(id);
        message.success('Plan eliminado');
        cargarDatos();
      },
    });
  };

  const columns = [
    { title: 'Equipo', dataIndex: 'nombre_equipo' },
    { title: 'Frecuencia', dataIndex: 'frecuencia_dias' },
    { title: 'Próxima Fecha', dataIndex: 'proxima_fecha' },
    {
      title: 'Estado',
      dataIndex: 'estado',
      render: (est) => (
        <Tag color={est === 'PROGRAMADO' ? 'green' : est === 'VENCIDO' ? 'red' : 'orange'}>
          {est}
        </Tag>
      ),
    },
    {
      title: 'Acciones',
      render: (_, row) => (
        <>
          <Button size="small" danger onClick={() => eliminar(row.id)}>Eliminar</Button>
        </>
      ),
    }
  ];

  return (
    <div style={{ padding: 20 }}>
      <Row justify="space-between" style={{ marginBottom: 20 }}>
        <Title level={3}>Planificación de Mantenimientos</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          Crear Plan Preventivo
        </Button>
      </Row>

      <Row gutter={24}>
        {/* Calendario */}
        <Col span={16}>
          <Card title="Calendario de Mantenimientos">
            <Calendar dateCellRender={dateCellRender} />
          </Card>
        </Col>

        {/* Resumen */}
        <Col span={8}>
          <Card title="Resumen">
            <p><Text strong>Planes Activos:</Text> {resumen.activos}</p>
            <p><Text strong>Próximos 7 días:</Text> {resumen.proximos}</p>
            <p><Text strong>Vencidos:</Text> <Text type="danger">{resumen.vencidos}</Text></p>
            <p><Text strong>Inactivos:</Text> {resumen.inactivos}</p>
          </Card>
        </Col>
      </Row>

      {/* Tabla */}
      <Card style={{ marginTop: 20 }} title="Planes de Mantenimiento Preventivo">
        <Table
          dataSource={planes}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      {/* Modal crear */}
      <CrearPlan
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={() => { setModalVisible(false); cargarDatos(); }}
      />
    </div>
  );
};

export default Planificacion;
