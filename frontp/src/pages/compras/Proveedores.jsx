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
  Typography
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
import ProveedorForm from './ProveedorForm';
import ProveedorDetalle from './ProveedorDetalle';

const { Option } = Select;
const { Title } = Typography;
const { Search } = Input;

const Proveedores = ({ user }) => {
  const [proveedores, setProveedores] = useState([]);
  const [paises, setPaises] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingDatos, setLoadingDatos] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    cargarProveedores();
    cargarDatosComplementarios();
  }, []);

  const cargarProveedores = async () => {
    setLoading(true);
    try {
      const response = await api.get('/compras/proveedores');
      setProveedores(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
      const errorMsg = error.response?.data?.error || 'Error al cargar la lista de proveedores';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const cargarDatosComplementarios = async () => {
    setLoadingDatos(true);
    try {
      const [paisesRes, tiposDocRes] = await Promise.all([
        api.get('/paises'),
        api.get('/tipos-documento-id')
      ]);

      setPaises(paisesRes.data?.data || []);
      setTiposDocumento(tiposDocRes.data?.data || []);
    } catch (error) {
      console.error('Error al cargar datos complementarios:', error);
      message.error('Error al cargar datos adicionales');
    } finally {
      setLoadingDatos(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await api.get('/compras/proveedores');
      setProveedores(Array.isArray(response.data) ? response.data : []);
      message.success('Lista actualizada');
    } catch (error) {
      console.error('Error al actualizar proveedores:', error);
      const errorMsg = error.response?.data?.error || 'Error al actualizar la lista';
      message.error(errorMsg);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreate = () => {
    setEditingProveedor(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingProveedor(record);
    setModalVisible(true);
  };

  const handleView = (record) => {
    setEditingProveedor(record);
    setDetailModalVisible(true);
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: '¿Está seguro de eliminar este proveedor?',
      content: 'Esta acción no se puede deshacer.',
      okText: 'Sí, eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await api.delete(`/compras/proveedores/${id}`);
          message.success('Proveedor eliminado correctamente');
          cargarProveedores();
        } catch (error) {
          console.error('Error al eliminar proveedor:', error);
          const errorMsg = error.response?.data?.error || 'Error al eliminar el proveedor';
          message.error(errorMsg);
        }
      }
    });
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await api.patch(`/compras/proveedores/${id}/estado`, { estado: !currentStatus });
      message.success(`Proveedor ${!currentStatus ? 'activado' : 'desactivado'} correctamente`);
      cargarProveedores();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      const errorMsg = error.response?.data?.error || 'Error al cambiar el estado';
      message.error(errorMsg);
    }
  };

  const handleSubmitSuccess = () => {
    setModalVisible(false);
    cargarProveedores();
  };

  const filteredProveedores = proveedores.filter(proveedor => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (proveedor.razon_social && proveedor.razon_social.toLowerCase().includes(searchLower)) ||
      (proveedor.nomb_comercial && proveedor.nomb_comercial.toLowerCase().includes(searchLower)) ||
      (proveedor.nro_documento && proveedor.nro_documento.includes(searchTerm)) ||
      (proveedor.codigo && proveedor.codigo.toLowerCase().includes(searchLower)) ||
      (proveedor.email && proveedor.email.toLowerCase().includes(searchLower))
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
      title: 'Documento',
      key: 'documento',
      width: 150,
      render: (_, record) => (
        <div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.tipo_documento_siglas || 'N/A'}
          </div>
          <div>{record.nro_documento || 'N/A'}</div>
        </div>
      ),
    },
    {
      title: 'Razón Social',
      dataIndex: 'razon_social',
      key: 'razon_social',
      ellipsis: true,
      sorter: (a, b) => a.razon_social?.localeCompare(b.razon_social),
    },
    {
      title: 'Nombre Comercial',
      dataIndex: 'nomb_comercial',
      key: 'nomb_comercial',
      ellipsis: true,
      render: (text) => text || 'N/A',
      sorter: (a, b) => a.nomb_comercial?.localeCompare(b.nomb_comercial),
    },
    {
      title: 'País',
      dataIndex: 'pais_nombre',
      key: 'pais_nombre',
      width: 100,
      render: (text) => text || 'N/A',
      sorter: (a, b) => a.pais_nombre?.localeCompare(b.pais_nombre),
    },
    {
      title: 'Contacto',
      key: 'contacto',
      width: 120,
      render: (_, record) => {
        const telefono = record.celular1 || record.telefono1 || 'N/A';
        const email = record.email || 'N/A';
        return (
          <div>
            <div style={{ fontSize: '12px' }}>{telefono}</div>
            <div style={{ fontSize: '11px', color: '#666' }}>{email}</div>
          </div>
        );
      },
    },
    {
      title: 'Estado',
      key: 'estado',
      width: 100,
      render: (_, record) => (
        <Tag
          color={record.estado ? 'green' : 'red'}
          style={{ cursor: 'pointer' }}
          onClick={() => handleToggleStatus(record.id, record.estado)}
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
            onClick={() => handleDelete(record.id)}
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
              Gestión de Proveedores
            </Title>
            <p style={{ margin: 0, color: '#666' }}>
              Total de proveedores: {proveedores.length}
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
                Nuevo Proveedor
              </Button>
            </Space>
          </Col>
        </Row>

        <Row style={{ marginBottom: 20 }}>
          <Col span={24}>
            <Search
              placeholder="Buscar por código, RUC/DNI, razón social, nombre comercial o email..."
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
          dataSource={filteredProveedores}
          loading={loading}
          rowKey="id"
          locale={{
            emptyText: 'No se encontraron proveedores'
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} de ${total} proveedores`
          }}
          scroll={{ x: 1000 }}
          size="middle"
        />
      </Card>

      {/* Modal para crear/editar proveedor */}
      <Modal
        title={editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={1000}
        style={{ maxHeight: '80vh' }}
        styles={{ overflowY: 'auto', maxHeight: 'calc(80vh - 108px)' }}
        destroyOnHidden
      >
        <ProveedorForm
          user={user}
          editingProveedor={editingProveedor}
          paises={paises}
          tiposDocumento={tiposDocumento}
          loadingDatos={loadingDatos}
          onSuccess={handleSubmitSuccess}
          onCancel={() => setModalVisible(false)}
          form={form}
        />
      </Modal>

      {/* Modal para ver detalles del proveedor */}
      <Modal
        title="Detalles del Proveedor"
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
              handleEdit(editingProveedor);
            }}
          >
            Editar
          </Button>
        ]}
        width={1000}
      >
        <ProveedorDetalle
          proveedor={editingProveedor}
        />
      </Modal>
    </div>
  );
};

export default Proveedores;







