import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Card,
  Space,
  Tag,
  Descriptions,
  Spin,
  Row,
  Col,
  Typography,
  Switch
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined
} from '@ant-design/icons';
import api from '../../api/api';
import VendedorForm from './VendedorForm';
import VendedorDetalle from './VendedorDetalle';

const { Option } = Select;
const { Title } = Typography;
const { Search } = Input;

const Vendedores = ({ user }) => {
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingVendedor, setEditingVendedor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    cargarVendedores();
  }, []);

  const cargarVendedores = async () => {
    setLoading(true);
    try {
      const response = await api.get('/ventas/vendedores');
      setVendedores(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error al cargar vendedores:', error);
      const errorMsg = error.response?.data?.error || 'Error al cargar la lista de vendedores';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await api.get('/ventas/vendedores');
      setVendedores(Array.isArray(response.data) ? response.data : []);
      message.success('Lista actualizada');
    } catch (error) {
      console.error('Error al actualizar vendedores:', error);
      const errorMsg = error.response?.data?.error || 'Error al actualizar la lista';
      message.error(errorMsg);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreate = () => {
    setEditingVendedor(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingVendedor(record);
    setModalVisible(true);
  };

  const handleView = (record) => {
    setEditingVendedor(record);
    setDetailModalVisible(true);
  };

  const handleDelete = async (codigo) => {
    Modal.confirm({
      title: '¿Está seguro de eliminar este vendedor?',
      content: 'Esta acción no se puede deshacer.',
      okText: 'Sí, eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await api.delete(`/ventas/vendedores/${codigo}`);
          message.success('Vendedor eliminado correctamente');
          cargarVendedores();
        } catch (error) {
          console.error('Error al eliminar vendedor:', error);
          const errorMsg = error.response?.data?.error || 'Error al eliminar el vendedor';
          message.error(errorMsg);
        }
      }
    });
  };

  const handleToggleStatus = async (codigo, currentStatus) => {
    try {
      await api.patch(`/ventas/vendedores/${codigo}/estado`, { estado: !currentStatus });
      message.success(`Vendedor ${!currentStatus ? 'activado' : 'desactivado'} correctamente`);
      cargarVendedores();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      const errorMsg = error.response?.data?.error || 'Error al cambiar el estado';
      message.error(errorMsg);
    }
  };

  const handleSubmitSuccess = () => {
    setModalVisible(false);
    cargarVendedores();
  };

  const filteredVendedores = vendedores.filter(vendedor => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (vendedor.codigo && vendedor.codigo.toLowerCase().includes(searchLower)) ||
      (vendedor.nombre && vendedor.nombre.toLowerCase().includes(searchLower)) ||
      (vendedor.siglas && vendedor.siglas.toLowerCase().includes(searchLower))
    );
  });

  const columns = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      width: 100,
      sorter: (a, b) => a.codigo?.localeCompare(b.codigo),
    },
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      ellipsis: true,
      sorter: (a, b) => a.nombre?.localeCompare(b.nombre),
    },
    {
      title: 'Siglas',
      dataIndex: 'siglas',
      key: 'siglas',
      width: 100,
      render: (text) => text || 'N/A',
      sorter: (a, b) => a.siglas?.localeCompare(b.siglas),
    },
    {
      title: 'Con Contado',
      dataIndex: 'con_contado',
      key: 'con_contado',
      width: 100,
      render: (con_contado) => (
        <Tag color={con_contado ? 'green' : 'red'}>
          {con_contado ? 'Sí' : 'No'}
        </Tag>
      ),
      filters: [
        { text: 'Sí', value: true },
        { text: 'No', value: false },
      ],
      onFilter: (value, record) => record.con_contado === value,
    },
    {
      title: 'Con Crédito',
      dataIndex: 'con_credito',
      key: 'con_credito',
      width: 100,
      render: (con_credito) => (
        <Tag color={con_credito ? 'green' : 'red'}>
          {con_credito ? 'Sí' : 'No'}
        </Tag>
      ),
      filters: [
        { text: 'Sí', value: true },
        { text: 'No', value: false },
      ],
      onFilter: (value, record) => record.con_credito === value,
    },
    {
      title: 'Con Cobranza',
      dataIndex: 'con_cobranza',
      key: 'con_cobranza',
      width: 100,
      render: (con_cobranza) => (
        <Tag color={con_cobranza ? 'green' : 'red'}>
          {con_cobranza ? 'Sí' : 'No'}
        </Tag>
      ),
      filters: [
        { text: 'Sí', value: true },
        { text: 'No', value: false },
      ],
      onFilter: (value, record) => record.con_cobranza === value,
    },
    {
      title: 'Estado',
      key: 'estado',
      width: 100,
      render: (_, record) => (
        <Tag 
          color={record.estado ? 'green' : 'red'}
          style={{ cursor: 'pointer' }}
          onClick={() => handleToggleStatus(record.codigo, record.estado)}
        >
          {record.estado ? 'Activo' : 'Inactivo'}
        </Tag>
      ),
      filters: [
        { text: 'Activo', value: true },
        { text: 'Inactivo', value: false },
      ],
      onFilter: (value, record) => record.estado === value,
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button 
            size="small"
            icon={<EyeOutlined />} 
            onClick={() => handleView(record)}
            title="Ver detalles"
          />
          <Button 
            size="small"
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
            title="Editar"
          />
          <Button 
            size="small"
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.codigo)}
            title="Eliminar"
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              Gestión de Vendedores
            </Title>
            <p style={{ margin: 0, color: '#666' }}>
              Total de vendedores: {vendedores.length}
            </p>
          </Col>
          <Col>
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleRefresh}
                loading={refreshing}
                title="Actualizar lista"
              >
                Actualizar
              </Button>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleCreate}
                size="large"
              >
                Nuevo Vendedor
              </Button>
            </Space>
          </Col>
        </Row>

        <Row style={{ marginBottom: 20 }}>
          <Col span={24}>
            <Search
              placeholder="Buscar por código, nombre o siglas..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onSearch={handleRefresh}
            />
          </Col>
        </Row>

        <Table 
          columns={columns} 
          dataSource={filteredVendedores} 
          loading={loading}
          rowKey="codigo"
          locale={{
            emptyText: 'No se encontraron vendedores'
          }}
          pagination={{ 
            pageSize: 10, 
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} de ${total} vendedores`
          }}
          scroll={{ x: 1000 }}
          size="middle"
        />
      </Card>

      {/* Modal para crear/editar vendedor */}
      <Modal
        title={editingVendedor ? 'Editar Vendedor' : 'Nuevo Vendedor'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <VendedorForm
          user={user}
          editingVendedor={editingVendedor}
          onSuccess={handleSubmitSuccess}
          onCancel={() => setModalVisible(false)}
        />
      </Modal>

      {/* Modal para ver detalles del vendedor */}
      <Modal
        title="Detalles del Vendedor"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Cerrar
          </Button>,
          <Button 
            key="edit" 
            type="primary" 
            onClick={() => {
              setDetailModalVisible(false);
              handleEdit(editingVendedor);
            }}
          >
            Editar
          </Button>
        ]}
        width={600}
      >
        <VendedorDetalle 
          vendedor={editingVendedor} 
        />
      </Modal>
    </div>
  );
};

export default Vendedores;