import React, { useEffect, useState } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Modal, 
  message, 
  Popconfirm, 
  Typography, 
  Card, 
  Tag,
  Row,
  Col,
  Statistic
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ReloadOutlined,
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import api from '../../api/api';
import TCambioForm from './TCambioForm';

const { Title } = Typography;

const TipoCambio = () => {
  const [tiposCambio, setTiposCambio] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editingTC, setEditingTC] = useState(null);

  const fetchTiposCambio = async () => {
    try {
      setLoading(true);
      const res = await api.get('/contabilidad/tipo-cambio');
      setTiposCambio(res.data.data); 
    } catch (error) {
      message.error('Error al cargar los tipos de cambio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTiposCambio();
  }, []);

  const handleCreate = () => {
    setEditingTC(null);
    setOpenModal(true);
  };

  const handleEdit = (record) => {
    setEditingTC(record);
    setOpenModal(true);
  };

  const handleSave = () => {
    setOpenModal(false);
    fetchTiposCambio();
    message.success('Operación completada exitosamente');
  };

  const handleRefresh = () => {
    fetchTiposCambio();
    message.info('Datos actualizados');
  };

  // Obtener el tipo de cambio más reciente para mostrar en estadísticas
  const ultimoTipoCambio = tiposCambio[0];
  const promedioCompra = tiposCambio.length > 0 
    ? tiposCambio.reduce((sum, tc) => sum + parseFloat(tc.compra), 0) / tiposCambio.length 
    : 0;
  const promedioVenta = tiposCambio.length > 0 
    ? tiposCambio.reduce((sum, tc) => sum + parseFloat(tc.venta), 0) / tiposCambio.length 
    : 0;

  const columns = [
    {
        title: 'Fecha',
        dataIndex: 'fecha',
        key: 'fecha',
        width: 120,
        render: (fecha) => <strong>{fecha}</strong>, // Ya viene formateada del backend
    },
    {
      title: 'Moneda Origen',
      dataIndex: 'moneda_origen_codigo',
      key: 'moneda_origen_id',
      width: 150,
      render: (codigo, record) => (
        <Tag color="blue" style={{ padding: '4px 8px', fontSize: '12px' }}>
          {codigo || record.moneda_origen_id}
        </Tag>
      ),
    },
    {
      title: 'Moneda Destino',
      dataIndex: 'moneda_destino_codigo',
      key: 'moneda_destino_id',
      width: 150,
      render: (codigo, record) => (
        <Tag color="green" style={{ padding: '4px 8px', fontSize: '12px' }}>
          {codigo || record.moneda_destino_id}
        </Tag>
      ),
    },
    {
      title: 'Compra',
      dataIndex: 'compra',
      key: 'compra',
      width: 120,
      render: (compra) => (
        <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
          S/ {parseFloat(compra).toFixed(4)}
        </span>
      ),
    },
    {
      title: 'Venta',
      dataIndex: 'venta',
      key: 'venta',
      width: 120,
      render: (venta) => (
        <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
          S/ {parseFloat(venta).toFixed(4)}
        </span>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 100,
      render: (estado) => (
        <Tag color={estado ? 'success' : 'error'}>
          {estado ? 'ACTIVO' : 'INACTIVO'}
        </Tag>
      ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)} 
            type="primary" 
            size="small"
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col span={24}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
              <DollarOutlined /> Tipos de Cambio
            </Title>
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleRefresh}
                loading={loading}
              >
                Actualizar
              </Button>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleCreate}
              >
                Nuevo Tipo de Cambio
              </Button>
            </Space>
          </div>
        </Col>
      </Row>

      {/* Estadísticas */}
      {tiposCambio.length > 0 && (
        <Row gutter={16} style={{ marginBottom: 20 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Último Tipo Cambio"
                value={ultimoTipoCambio?.compra}
                precision={4}
                prefix="S/"
                valueStyle={{ color: '#1890ff' }}
                suffix={
                    <small style={{ fontSize: '12px', color: '#666' }}>
                        {ultimoTipoCambio?.fecha}
                    </small>
                }
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Promedio Compra"
                value={promedioCompra}
                precision={4}
                prefix="S/"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Promedio Venta"
                value={promedioVenta}
                precision={4}
                prefix="S/"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Registros"
                value={tiposCambio.length}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Tabla */}
      <Card 
        title={`Lista de Tipos de Cambio (${tiposCambio.length} registros)`}
        extra={
          <Tag color="blue">
            Actualizado: {new Date().toLocaleTimeString()}
          </Tag>
        }
      >
        <Table
          columns={columns}
          dataSource={tiposCambio}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} de ${total} registros`,
          }}
          scroll={{ x: 800 }}
          size="middle"
        />
      </Card>

      {/* Modal */}
      <Modal
        title={
          <span>
            <DollarOutlined /> {editingTC ? 'Editar Tipo de Cambio' : 'Nuevo Tipo de Cambio'}
          </span>
        }
        visible={openModal}
        width={700}
        onCancel={() => setOpenModal(false)}
        footer={null}
        destroyOnClose
        style={{ top: 20 }}
      >
        <TCambioForm
          tipoCambio={editingTC}
          onSave={handleSave}
          onCancel={() => setOpenModal(false)}
        />
      </Modal>
    </div>
  );
};

export default TipoCambio;