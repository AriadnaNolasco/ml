import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Tag, Row, Col, Divider, Spin, Typography, Button, Space, Table } from 'antd';
import { ArrowLeftOutlined, EditOutlined, DollarOutlined, ToolOutlined, CalendarOutlined, UserOutlined } from '@ant-design/icons';
import api from '../../api/api';

const { Title, Text } = Typography;
const API_BASE = '/mantenimiento/evaluaciones';

const EvaluacionesDetalle = ({ id, navigate }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEvaluacionDetalle(id);
  }, [id]);

  const fetchEvaluacionDetalle = async (evaluacionId) => {
    try {
      setLoading(true);
      const response = await api.get(`${API_BASE}/${evaluacionId}`);
      if (response.status !== 200) throw new Error('Evaluación no encontrada');
      setData(response.data);
    } catch (err) {
      setError(err.message || 'Error al cargar los detalles de la evaluación.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>;
  if (error) return <Card><div style={{ color: 'red', textAlign: 'center', padding: '20px' }}>{error}</div></Card>;
  if (!data || !data.cabecera) return <Card><div style={{ textAlign: 'center', padding: '20px' }}>No se pudo cargar la evaluación.</div></Card>;

  const { cabecera, materiales, manoObra, auxiliares } = data;

  const formatCurrency = (amount, currency = 'USD') => {
    const value = parseFloat(amount);
    if (isNaN(value)) return 'N/A';
    return `${currency === 'USD' ? '$' : 'S/'} ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const TableDetalle = ({ title, data, columns }) => (
    <div style={{ marginTop: 24 }}>
      <Title level={4} style={{ marginBottom: 16 }}>{title} (Elementos Evaluados)</Title>
      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        pagination={false}
        size="small"
        bordered
        locale={{ emptyText: <Empty description={`No hay ${title.toLowerCase()} registrados`} image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
      />
    </div>
  );

  const MaterialesColumns = [
    {
      title: 'Producto',
      dataIndex: 'producto_descripcion',
      key: 'producto_descripcion',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text><br />
          <Text type="secondary" style={{ fontSize: '11px' }}>{record.producto_codigo}</Text>
        </div>
      )
    },
    { title: 'Cantidad', dataIndex: 'cantidad', key: 'cantidad', align: 'right', width: 150, render: (val, record) => `${parseFloat(val).toFixed(2)} ${record.unidad_medida || 'UND'}` },
    { title: 'Observaciones', dataIndex: 'observaciones', key: 'observaciones', ellipsis: true },
    // REMOVIDO: Costo U. Ref. (USD)
    // REMOVIDO: Costo Total (USD)
  ];

  const ManoObraColumns = [
    { title: 'Actividad', dataIndex: 'actividad_nombre', key: 'actividad_nombre', width: 250 },
    { title: 'Cant. Horas', dataIndex: 'cantidad_horas', key: 'cantidad_horas', align: 'right', width: 150, render: val => `${parseFloat(val).toFixed(2)} hrs` },
    { title: 'Observaciones', dataIndex: 'observaciones', key: 'observaciones', ellipsis: true },
    // REMOVIDO: Costo HH Ref. (PEN)
    // REMOVIDO: Costo Total (PEN)
  ];

  const AuxiliaresColumns = [
    {
      title: 'Tipo / Nombre', dataIndex: 'nombre', key: 'nombre', render: (text, record) => (
        <div>
          <Text strong>{text}</Text><br />
          <Tag color="magenta" style={{ fontSize: '10px' }}>{record.tipo}</Tag>
        </div>
      )
    },
    { title: 'Unidad', dataIndex: 'unidad', key: 'unidad', width: 100 },
    { title: 'Cantidad', dataIndex: 'cantidad', key: 'cantidad', align: 'right', width: 150, render: val => parseFloat(val).toFixed(2) },
    // REMOVIDO: P. Unitario
    // REMOVIDO: Costo Total
  ];

  const estadoProcesoEquipo = cabecera.estado_proceso || 'EN EVALUACION';

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'COTIZACION PENDIENTE':
        return 'purple';
      case 'EN EVALUACION':
        return 'gold';
      case 'RECEPCIONADO':
        return 'blue';
      case 'COTIZACION APROBADA':
        return 'green';
      default:
        return 'default';
    }
  };

  return (
    <>
      <Card>
        {/* Botones de Acción (Simplificados para el Técnico) */}
        <div style={{ float: 'right', marginBottom: 16 }}>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/mantenimiento/evaluaciones')}>
              Volver
            </Button>
            {/* Permitir edición solo si la evaluación aún no ha sido cotizada */}
            {estadoProcesoEquipo === 'EN EVALUACION' && (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => navigate(`/mantenimiento/evaluaciones/editar/${cabecera.id}`)}
              >
                Editar Evaluación
              </Button>
            )}
            {/* REMOVIDO: Botón de Generar Cotización */}
          </Space>
        </div>

        <Title level={2} style={{ marginBottom: 0 }}>
          Detalle de Evaluación Técnica #{cabecera.id}
        </Title>
        <Text type="secondary">Realizada por: {cabecera.tecnico_nombre}</Text>

        <Divider orientation="left" style={{ marginTop: 24 }}>
          <ToolOutlined style={{ marginRight: 8 }} /> Información del Equipo y Evaluación
        </Divider>

        <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }} size="small">
          <Descriptions.Item label="Cliente">{cabecera.cliente_nombre}</Descriptions.Item>
          <Descriptions.Item label="Fecha Evaluación">
            <CalendarOutlined style={{ marginRight: 8 }} />
            {new Date(cabecera.fecha_evaluacion).toLocaleDateString()}
          </Descriptions.Item>
          <Descriptions.Item label="Equipo (BPC/SOLPED)">
            <Text strong>{cabecera.codigo_bpc}</Text> / {cabecera.codigo_solped || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Marca/Modelo">{cabecera.marca} / {cabecera.modelo}</Descriptions.Item>
          <Descriptions.Item label="Estado Proceso">
            <Tag color={getEstadoColor(estadoProcesoEquipo)} style={{ fontWeight: 'bold' }}>
              {estadoProcesoEquipo}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Técnico">{cabecera.tecnico_nombre}</Descriptions.Item>
          <Descriptions.Item label="Problema Reportado" span={3}>
            {cabecera.problema_reportado}
          </Descriptions.Item>
          <Descriptions.Item label="Hallazgos del Técnico" span={3}>
            <Card size="small" style={{ backgroundColor: '#e6f7ff', border: '1px solid #91d5ff' }}>
              <Text>{cabecera.comentarios || 'Sin comentarios adicionales.'}</Text>
            </Card>
          </Descriptions.Item>
        </Descriptions>

        {/* REMOVIDO: Sección de Resumen de Costos */}

        {/* Tablas de Detalles: Solo muestran información técnica */}
        <TableDetalle title="Materiales Requeridos" data={materiales} columns={MaterialesColumns} />
        <TableDetalle title="Mano de Obra" data={manoObra} columns={ManoObraColumns} />
        <TableDetalle title="Elementos Auxiliares" data={auxiliares} columns={AuxiliaresColumns} />

      </Card>

      {/* REMOVIDO: Modal de Cotización */}
    </>
  );
};

export default EvaluacionesDetalle;