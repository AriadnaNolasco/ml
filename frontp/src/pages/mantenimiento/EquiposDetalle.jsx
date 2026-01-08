import React from 'react';
import { Descriptions, Card, Spin, Tag, Row, Col, Typography, Empty, Tooltip } from 'antd';
import { 
  TruckOutlined, 
  UserOutlined, 
  CalendarOutlined, 
  TagOutlined,
  ExclamationCircleOutlined,
  CommentOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

/**
 * Componente para mostrar los detalles de una Recepción de Equipo (Envío)
 * @param {object} props - Propiedades del componente
 * @param {object} props.recepcion - Objeto con los datos de la recepción (incluye cliente_nombre, etc., traídos del backend)
 * @param {boolean} props.loading - Indica si los datos están cargando
 */
const EquiposDetalle = ({ recepcion, loading }) => {
  if (loading || !recepcion) {
    return <div style={{ textAlign: 'center', padding: '50px' }}><Spin tip="Cargando detalles..." size="large" /></div>;
  }
  
  // Función auxiliar para obtener el color del estado de proceso
  const getEstadoColor = (estado) => {
    switch (estado) {
        case 'RECEPCIONADO':
            return 'blue';
        case 'EN EVALUACION':
            return 'gold';
        case 'EN REPARACION':
            return 'orange';
        case 'COMPLETADO':
            return 'green';
        case 'COTIZACION PENDIENTE':
            return 'purple';
        default:
            return 'default';
    }
  };

  const fechaRecepcion = recepcion.fecha_recepcion 
    ? new Date(recepcion.fecha_recepcion).toLocaleDateString() 
    : 'N/A';

  return (
    <div style={{ padding: 10 }}>
      {/* Sección de Códigos y Estado */}
      <Card 
        title={<Title level={4} style={{ margin: 0 }}><TruckOutlined style={{ marginRight: 8 }} /> Información de la Recepción</Title>}
        bordered={false}
        style={{ marginBottom: 20 }}
      >
        <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }} size="middle">
          
          <Descriptions.Item label="ID Recepción" labelStyle={{ fontWeight: 'bold' }}>
            <Tag color="#2db7f5">{recepcion.id}</Tag>
          </Descriptions.Item>
          
          <Descriptions.Item label="Estado Actual" labelStyle={{ fontWeight: 'bold' }}>
            <Tag color={getEstadoColor(recepcion.estado_proceso)} style={{ fontWeight: 'bold' }}>
              <CheckCircleOutlined /> {recepcion.estado_proceso || 'PENDIENTE'}
            </Tag>
          </Descriptions.Item>
          
          <Descriptions.Item label="Fecha Recepción" labelStyle={{ fontWeight: 'bold' }}>
            <CalendarOutlined /> {fechaRecepcion}
          </Descriptions.Item>
          
          <Descriptions.Item label="Código BPC" labelStyle={{ fontWeight: 'bold' }}>
            <Tooltip title="Código de Proyecto/Control. Clic para copiar.">
                <Text copyable>{recepcion.codigo_bpc}</Text>
            </Tooltip>
          </Descriptions.Item>

          <Descriptions.Item label="Código SOLPED" labelStyle={{ fontWeight: 'bold' }}>
            {recepcion.codigo_solped || <Text type="secondary">N/A</Text>}
          </Descriptions.Item>

          <Descriptions.Item label="Motivo Envío" labelStyle={{ fontWeight: 'bold' }}>
            <Tag color="volcano"><TagOutlined /> {recepcion.motivo_recepcion}</Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>
      
      {/* Información del Cliente */}
      <Card 
        title={<Title level={4} style={{ margin: 0 }}><UserOutlined style={{ marginRight: 8 }} /> Información del Cliente</Title>}
        bordered={false}
        style={{ marginBottom: 20 }}
      >
        <Descriptions bordered column={2} size="middle">
          <Descriptions.Item label="Razón Social" labelStyle={{ fontWeight: 'bold' }} span={2}>
            <Text strong>{recepcion.cliente_nombre}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="RUC / DNI" labelStyle={{ fontWeight: 'bold' }}>
            {recepcion.cliente_ruc}
          </Descriptions.Item>
          <Descriptions.Item label="ID Cliente ERP" labelStyle={{ fontWeight: 'bold' }}>
            {recepcion.id_cliente}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Especificaciones del Equipo */}
      <Card 
        title={<Title level={4} style={{ margin: 0 }}><TruckOutlined style={{ marginRight: 8 }} /> Datos del Equipo</Title>}
        bordered={false}
        style={{ marginBottom: 20 }}
      >
        <Descriptions bordered column={3} size="middle">
          <Descriptions.Item label="Marca" labelStyle={{ fontWeight: 'bold' }}>
            {recepcion.marca || <Text type="secondary">N/A</Text>}
          </Descriptions.Item>
          <Descriptions.Item label="Modelo" labelStyle={{ fontWeight: 'bold' }}>
            {recepcion.modelo || <Text type="secondary">N/A</Text>}
          </Descriptions.Item>
          <Descriptions.Item label="Nro. Serie" labelStyle={{ fontWeight: 'bold' }}>
            {recepcion.nro_serie_equipo || <Text type="secondary">N/A</Text>}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Notas y Observaciones */}
      <Row gutter={16}>
        <Col span={12}>
          <Card 
            title={<Title level={5} style={{ margin: 0 }}><ExclamationCircleOutlined style={{ marginRight: 8 }} /> Descripción del Problema</Title>}
            size="small"
          >
            <Text>{recepcion.descripcion_problema || <Empty description="Sin descripción de problema" image={Empty.PRESENTED_IMAGE_SIMPLE} />}</Text>
          </Card>
        </Col>
        <Col span={12}>
          <Card 
            title={<Title level={5} style={{ margin: 0 }}><CommentOutlined style={{ marginRight: 8 }} /> Observaciones</Title>}
            size="small"
          >
            <Text>{recepcion.observaciones || <Empty description="Sin observaciones adicionales" image={Empty.PRESENTED_IMAGE_SIMPLE} />}</Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default EquiposDetalle;
