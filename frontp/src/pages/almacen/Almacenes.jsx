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
  SearchOutlined
} from '@ant-design/icons';
import api from '../../api/api';
import AlmacenForm from './AlmacenForm';
import AlmacenDetalle from './AlmacenDetalle';

const { Title } = Typography;
const { Search } = Input;

const Almacenes = ({ user }) => {
  const [almacenes, setAlmacenes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingAlmacen, setEditingAlmacen] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    cargarAlmacenes();
    cargarCategorias();
  }, []);

  const cargarAlmacenes = async () => {
    setLoading(true);
    try {
      const response = await api.get('/almacen/almacenes');
      setAlmacenes(response.data);
    } catch (error) {
      console.error('Error al cargar almacenes:', error);
      message.error('Error al cargar la lista de almacenes');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await api.get('/almacen/almacenes');
      setAlmacenes(response.data);
      message.success('Lista actualizada');
    } catch (error) {
      console.error('Error al cargar almacenes:', error);
      message.error('Error al cargar la lista de almacenes');
    } finally {
      setRefreshing(false);
    }
  };

  const cargarCategorias = async () => {
    setLoadingCategorias(true);
    try {
      const response = await api.get('/almacen/productos-form/datos');
      setCategorias(response.data.categorias || []);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      message.error('Error al cargar las categorías');
      setCategorias([]);
    } finally {
      setLoadingCategorias(false);
    }
  };

  const handleCreate = () => {
    setEditingAlmacen(null);
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingAlmacen(record);
    setModalVisible(true);
  };

  const handleView = (record) => {
    setEditingAlmacen(record);
    setDetailModalVisible(true);
  };

  const handleDelete = async (codigo) => {
    Modal.confirm({
      title: '¿Está seguro de eliminar este almacén?',
      content: 'Esta acción no se puede deshacer.',
      okText: 'Sí, eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await api.delete(`/almacen/almacenes/${codigo}`);
          message.success('Almacén eliminado correctamente');
          cargarAlmacenes();
        } catch (error) {
          console.error('Error al eliminar almacén:', error);
          const errorMsg = error.response?.data?.error || 'Error al eliminar el almacén';
          message.error(errorMsg);
        }
      }
    });
  };

  const handleSubmitSuccess = () => {
    setModalVisible(false);
    cargarAlmacenes();
  };

  const filteredAlmacenes = almacenes.filter(almacen => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (almacen.codigo && almacen.codigo.toLowerCase().includes(searchLower)) ||
      (almacen.nombre && almacen.nombre.toLowerCase().includes(searchLower)) ||
      (almacen.siglas && almacen.siglas.toLowerCase().includes(searchLower)) ||
      (almacen.categoria_nombre && almacen.categoria_nombre.toLowerCase().includes(searchLower))
    );
  });

  const columns = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      sorter: (a, b) => a.codigo.localeCompare(b.codigo),
      width: 100,
    },
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      sorter: (a, b) => a.nombre.localeCompare(b.nombre),
      ellipsis: true,
    },
    {
      title: 'Siglas',
      dataIndex: 'siglas',
      key: 'siglas',
      render: (siglas) => siglas || 'N/A',
      width: 80,
    },
    {
      title: 'Categoría',
      dataIndex: 'categoria_nombre',
      key: 'categoria_nombre',
      render: (text) => text || 'No asignada',
      ellipsis: true,
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo_alm',
      key: 'tipo_alm',
      render: (tipo) => (
        <Tag color={tipo === 'INTERNO' ? 'blue' : 'green'}>
          {tipo}
        </Tag>
      ),
      width: 100,
      filters: [
        { text: 'Interno', value: 'INTERNO' },
        { text: 'Externo', value: 'EXTERNO' },
      ],
      onFilter: (value, record) => record.tipo_alm === value,
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
              Gestión de Almacenes
            </Title>
            <p style={{ margin: 0, color: '##666' }}>
              Total de almacenes: {almacenes.length}
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
                Nuevo Almacén
              </Button>
            </Space>
          </Col>
        </Row>

        <Row style={{ marginBottom: 20 }}>
          <Col span={24}>
            <Search
              placeholder="Buscar por código, nombre, siglas o categoría..."
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
          dataSource={filteredAlmacenes}
          loading={loading}
          rowKey="codigo"
          locale={{
            emptyText: 'No se encontraron almacenes'
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} de ${total} almacenes`
          }}
          scroll={{ x: 800 }}
          size="middle"
        />
      </Card>

      {/* Modal para crear/editar almacén */}
      <Modal
        title={editingAlmacen ? 'Editar Almacén' : 'Nuevo Almacén'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <AlmacenForm
          editingAlmacen={editingAlmacen}
          categorias={categorias}
          loadingCategorias={loadingCategorias}
          onSuccess={handleSubmitSuccess}
          onCancel={() => setModalVisible(false)}
        />
      </Modal>

      {/* Modal para ver detalles del almacén */}
      <Modal
        title="Detalles del Almacén"
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
              handleEdit(editingAlmacen);
            }}
          >
            Editar
          </Button>
        ]}
        width={600}
      >
        <AlmacenDetalle
          almacen={editingAlmacen}
        />
      </Modal>
    </div>
  );
};

export default Almacenes;