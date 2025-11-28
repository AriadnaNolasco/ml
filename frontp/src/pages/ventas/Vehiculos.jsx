import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  message,
  Card,
  Space,
  Tag,
  Spin,
  Row,
  Col,
  Typography,
  Input
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  CarOutlined
} from '@ant-design/icons';
import api from '../../api/api';
import VehiculoForm from './VehiculoForm';
import VehiculoDetalle from './VehiculoDetalle';

const { Title } = Typography;
const { Search } = Input;

const Vehiculos = ({ user }) => {
  const [vehiculos, setVehiculos] = useState([]);
  const [datosFormulario, setDatosFormulario] = useState({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingFormData, setLoadingFormData] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    cargarVehiculos();
    cargarDatosFormulario();
  }, []);

  const cargarVehiculos = async () => {
    setLoading(true);
    try {
      const response = await api.get('/ventas/vehiculos');
      setVehiculos(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error al cargar vehículos:', error);
      message.error('Error al cargar la lista de vehículos');
      setVehiculos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await api.get('/ventas/vehiculos');
      setVehiculos(Array.isArray(response.data) ? response.data : []);
      message.success('Lista actualizada');
    } catch (error) {
      console.error('Error al cargar vehículos:', error);
      message.error('Error al cargar la lista de vehículos');
    } finally {
      setRefreshing(false);
    }
  };

  const cargarDatosFormulario = async () => {
    setLoadingFormData(true);
    try {
      const response = await api.get('/ventas/formularios/datos');
      setDatosFormulario(response.data);
    } catch (error) {
      console.error('Error al cargar datos del formulario:', error);
      message.error('Error al cargar los datos del formulario');
      setDatosFormulario({});
    } finally {
      setLoadingFormData(false);
    }
  };

  const handleCreate = () => {
    setEditingVehiculo(null);
    setModalVisible(true);
  };

  const handleEdit = async (record) => {
    try {
      const response = await api.get(`/ventas/vehiculos/${record.placa}`);
      setEditingVehiculo(response.data);
      setModalVisible(true);
    } catch (error) {
      console.error('Error al cargar vehículo:', error);
      message.error('Error al cargar los datos del vehículo');
    }
  };

  const handleView = async (record) => {
    try {
      const response = await api.get(`/ventas/vehiculos/${record.placa}`);
      setEditingVehiculo(response.data);
      setDetailModalVisible(true);
    } catch (error) {
      console.error('Error al cargar vehículo:', error);
      message.error('Error al cargar los detalles del vehículo');
    }
  };

  const handleDelete = async (placa) => {
    Modal.confirm({
      title: '¿Está seguro de eliminar este vehículo?',
      content: 'Esta acción no se puede deshacer.',
      okText: 'Sí, eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await api.delete(`/ventas/vehiculos/${placa}`);
          message.success('Vehículo eliminado correctamente');
          cargarVehiculos();
        } catch (error) {
          console.error('Error al eliminar vehículo:', error);
          const errorMsg = error.response?.data?.error || 'Error al eliminar el vehículo';
          message.error(errorMsg);
        }
      }
    });
  };

  const handleToggleStatus = async (placa, currentStatus) => {
    try {
      await api.put(`/ventas/vehiculos/${placa}`, { 
        estado: !currentStatus 
      });
      
      message.success(`Vehículo ${!currentStatus ? 'activado' : 'desactivado'} correctamente`);
      cargarVehiculos();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      message.error('Error al cambiar el estado del vehículo');
    }
  };

  const handleSubmitSuccess = () => {
    setModalVisible(false);
    cargarVehiculos();
  };

  const filteredVehiculos = vehiculos.filter(vehiculo => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (vehiculo.placa && vehiculo.placa.toLowerCase().includes(searchLower)) ||
      (vehiculo.marca && vehiculo.marca.toLowerCase().includes(searchLower)) ||
      (vehiculo.modelo && vehiculo.modelo.toLowerCase().includes(searchLower)) ||
      (vehiculo.combustible && vehiculo.combustible.toLowerCase().includes(searchLower)) ||
      (vehiculo.carroceria && vehiculo.carroceria.toLowerCase().includes(searchLower))
    );
  });

  const columns = [
    {
      title: 'Placa',
      dataIndex: 'placa',
      key: 'placa',
      width: 120,
      sorter: (a, b) => a.placa.localeCompare(b.placa),
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Vehículo',
      key: 'vehiculo',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.marca || 'N/A'}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.modelo || 'N/A'}</div>
        </div>
      ),
      sorter: (a, b) => (a.marca || '').localeCompare(b.marca || ''),
    },
    {
      title: 'Año',
      dataIndex: 'anio_fabricacion',
      key: 'anio_fabricacion',
      width: 80,
      sorter: (a, b) => (a.anio_fabricacion || 0) - (b.anio_fabricacion || 0),
    },
    {
      title: 'Combustible',
      dataIndex: 'combustible',
      key: 'combustible',
      width: 120,
      render: (text) => text || 'N/A'
    },
    {
      title: 'Carrocería',
      dataIndex: 'carroceria',
      key: 'carroceria',
      width: 120,
      render: (text) => text || 'N/A'
    },
    {
      title: 'Transmisión',
      dataIndex: 'tipo_transmision',
      key: 'tipo_transmision',
      width: 110,
      render: (text) => text || 'N/A'
    },
    {
      title: 'Estado',
      key: 'estado',
      width: 100,
      filters: [
        { text: 'Activo', value: true },
        { text: 'Inactivo', value: false },
      ],
      onFilter: (value, record) => record.estado === value,
      render: (_, record) => (
        <Tag 
          color={record.estado ? 'green' : 'red'}
          style={{ cursor: 'pointer' }}
          onClick={() => handleToggleStatus(record.placa, record.estado)}
          title="Clic para cambiar estado"
        >
          {record.estado ? 'Activo' : 'Inactivo'}
        </Tag>
      ),
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
            onClick={() => handleDelete(record.placa)}
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
              <CarOutlined style={{ marginRight: 8 }} />
              Gestión de Vehículos
            </Title>
            <p style={{ margin: 0, color: '#666' }}>
              Total de vehículos: {vehiculos.length}
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
                Nuevo Vehículo
              </Button>
            </Space>
          </Col>
        </Row>

        <Row style={{ marginBottom: 20 }}>
          <Col span={24}>
            <Search
              placeholder="Buscar por placa, marca, modelo, combustible o carrocería..."
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
          dataSource={filteredVehiculos}
          loading={loading}
          rowKey="placa"
          locale={{
            emptyText: 'No se encontraron vehículos'
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} de ${total} vehículos`
          }}
          scroll={{ x: 1000 }}
          size="middle"
        />
      </Card>

      {/* Modal para crear/editar vehículo */}
      <Modal
        title={editingVehiculo ? 'Editar Vehículo' : 'Nuevo Vehículo'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <VehiculoForm
          editingVehiculo={editingVehiculo}
          datosFormulario={datosFormulario}
          loadingFormData={loadingFormData}
          onSuccess={handleSubmitSuccess}
          onCancel={() => setModalVisible(false)}
        />
      </Modal>

      {/* Modal para ver detalles del vehículo */}
      <Modal
        title="Detalles del Vehículo"
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
              handleEdit(editingVehiculo);
            }}
          >
            Editar
          </Button>
        ]}
        width={800}
      >
        <VehiculoDetalle
          vehiculo={editingVehiculo}
        />
      </Modal>
    </div>
  );
};

export default Vehiculos;