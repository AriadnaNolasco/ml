import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import {
  Table,
  Card,
  Button,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Input,
  Select,
  DatePicker,
  message,
  Modal,
  Statistic,
  Popconfirm, 
  Tabs
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  FileTextOutlined,
  ReloadOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import OrdenesForm from './OrdenesForm';
import OrdenDetalles from './OrdenDetalles';
import api from '../../api/api';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const OrdenesCompra = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  const [ordenes, setOrdenes] = useState([]);
  const [ordenesCompletas, setOrdenesCompletas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detallesVisible, setDetallesVisible] = useState(false);
  const [selectedOrden, setSelectedOrden] = useState(null);
  const [activeTab, setActiveTab] = useState('LOCAL');
  const [filtros, setFiltros] = useState({
    numero: '',
    estado: '',
    fecha: null,
    proveedor: ''
  });
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    pendientes: 0,
    aprobadas: 0,
    completadas: 0
  });

  const estados = {
    PENDIENTE: { color: 'orange', text: 'Pendiente' },
    APROBADA: { color: 'blue', text: 'Aprobada' },
    RECHAZADA: { color: 'red', text: 'Rechazada' },
    PARCIAL: { color: 'purple', text: 'Parcial' },
    COMPLETADA: { color: 'green', text: 'Completada' },
    CANCELADA: { color: 'default', text: 'Cancelada' }
  };

  const estadosEntrega = {
    PENDIENTE: { color: 'orange', text: 'Pendiente' },
    PARCIAL: { color: 'blue', text: 'Parcial' },
    COMPLETADA: { color: 'green', text: 'Completada' }
  };

  const columnas = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id) => <strong>{id}</strong>
    },
    {
      title: 'Número',
      key: 'numero',
      width: 150,
      render: (_, record) => (
        <strong>
          {(record.documento_codigo?.trim() || 'DOC')} - {record.numero}
        </strong>
      )
    },
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      key: 'fecha',
      width: 110,
      render: (fecha) => dayjs(fecha).format('DD/MM/YYYY')
    },
    {
      title: 'Proveedor',
      dataIndex: 'proveedor_nombre',
      key: 'proveedor_nombre',
      ellipsis: true
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      width: 80,
      render: (tipo) => tipo === 'LOCAL' ? 'Local' : 'Externo'
    },
    {
      title: 'Moneda',
      key: 'moneda',
      width: 100,
      render: (_, record) => (
        <span>
          {record.moneda_nombre} ({record.moneda_simbolo})
        </span>
      )
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 100,
      render: (total, record) => (
        <span>
          {record.moneda_simbolo || ''} {parseFloat(total).toFixed(2)}
        </span>
      )
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 110,
      render: (estado) => (
        <Tag color={estados[estado]?.color || 'default'}>
          {estados[estado]?.text || estado}
        </Tag>
      )
    },
    {
      title: 'F. Entrega Prevista',
      dataIndex: 'fecha_entrega_prevista',
      key: 'fecha_entrega_prevista',
      width: 130,
      render: (fecha) => fecha ? dayjs(fecha).format('DD/MM/YYYY') : '-'
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => verDetalles(record)}
          >

          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => editarOrden(record)}
            disabled={record.estado !== 'PENDIENTE' && record.estado !== 'PARCIAL'}
          >

          </Button>
          <Popconfirm
            title="¿Está seguro de anular esta orden?"
            description="Esta acción no se puede deshacer."
            onConfirm={() => anularOrden(record.id)}
            okText="Sí"
            cancelText="No"
            disabled={record.estado !== 'PENDIENTE'}
          >
            <Button
              size="small"
              icon={<CloseCircleOutlined />}
              danger
              disabled={record.estado !== 'PENDIENTE'}
            >
         
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  useEffect(() => {
    cargarOrdenes();
    
    // Verificar si se viene desde un requerimiento con datos
    if (location.state && location.state.desdeRequerimiento) {
      setSelectedOrden(null);
      setModalVisible(true);
      
      // Precargar los datos del requerimiento en el formulario
      const { requerimientoData } = location.state;
      // Aquí puedes almacenar estos datos para usarlos en el formulario
      sessionStorage.setItem('requerimientoParaOrden', JSON.stringify(requerimientoData));
      
      // Limpiar el estado de navegación
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location]);

  const cargarOrdenes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (filtros.numero) params.append('numero', filtros.numero);
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.proveedor) params.append('proveedor', filtros.proveedor);
      if (filtros.fecha) {
        params.append('fecha_inicio', filtros.fecha[0].format('YYYY-MM-DD'));
        params.append('fecha_fin', filtros.fecha[1].format('YYYY-MM-DD'));
      }

      const response = await api.get(`/compras/ordenes-compra?${params.toString()}`);
      setOrdenesCompletas(response.data); // ← Guardar todas las órdenes
      
      // Filtrar por tipo según la pestaña activa
      filtrarOrdenesPorTipo(response.data);
      
      // Calcular estadísticas
      const total = response.data.length;
      const pendientes = response.data.filter(o => o.estado === 'PENDIENTE').length;
      const entregadas = response.data.filter(o => o.estado === 'ENTREGADA').length;
      const cerradas = response.data.filter(o => o.estado === 'CERRADA').length;
      
      setEstadisticas({ total, pendientes, entregadas, cerradas });
    } catch (error) {
      message.error('Error al cargar las órdenes de compra');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

   // ← Nueva función para filtrar órdenes por tipo
  const filtrarOrdenesPorTipo = (ordenesData = ordenesCompletas) => {
    let ordenesFiltradas = ordenesData;

    // Filtrar por tipo según la pestaña activa
    ordenesFiltradas = ordenesFiltradas.filter(orden => 
      orden.tipo === activeTab
    );

    // Aplicar otros filtros si existen
    if (filtros.estado) {
      ordenesFiltradas = ordenesFiltradas.filter(orden => 
        orden.estado === filtros.estado
      );
    }

    if (filtros.numero) {
      ordenesFiltradas = ordenesFiltradas.filter(orden => 
        orden.numero.toLowerCase().includes(filtros.numero.toLowerCase())
      );
    }

    if (filtros.proveedor) {
      ordenesFiltradas = ordenesFiltradas.filter(orden => 
        orden.proveedor_nombre?.toLowerCase().includes(filtros.proveedor.toLowerCase())
      );
    }

    if (filtros.fecha) {
      const [start, end] = filtros.fecha;
      if (start && end) {
        ordenesFiltradas = ordenesFiltradas.filter(orden => {
          const fechaOrden = dayjs(orden.fecha);
          return fechaOrden.isAfter(start.subtract(1, 'day')) && fechaOrden.isBefore(end.add(1, 'day'));
        });
      }
    }

    setOrdenes(ordenesFiltradas);
  };

  // ← Nuevo useEffect para filtrar cuando cambia la pestaña activa
  useEffect(() => {
    filtrarOrdenesPorTipo();
  }, [activeTab, ordenesCompletas, filtros]);

  const verDetalles = (orden) => {
    setSelectedOrden(orden);
    setDetallesVisible(true);
  };

  const editarOrden = (orden) => {
    setSelectedOrden(orden);
    setModalVisible(true);
  };

  const anularOrden = async (id) => {
    try {
      await api.patch(`/compras/ordenes-compra/${id}/estado`, { estado: 'ANULADA' });
      message.success('Orden anulada correctamente');
      cargarOrdenes();
    } catch (error) {
      message.error('Error al anular la orden');
      console.error('Error:', error);
    }
  };

  const nuevaOrden = () => {
    setSelectedOrden(null);
    setModalVisible(true);
  };

  const handleModalClose = (actualizado = false) => {
    setModalVisible(false);
    setSelectedOrden(null);
    if (actualizado) {
      cargarOrdenes();
      message.success(selectedOrden ? 'Orden actualizada correctamente' : 'Orden creada correctamente');
    }
  };

  const handleDetallesClose = () => {
    setDetallesVisible(false);
    setSelectedOrden(null);
  };

  const handleFiltroChange = (key, value) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
  };

  // ← Nueva función para cambiar de pestaña
  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const limpiarFiltros = () => {
    setFiltros({
      numero: '',
      estado: '',
      fecha: null,
      proveedor: ''
    });
  };

  useEffect(() => {
    cargarOrdenes();
  }, []);

  return (
    <div style={{ padding: '24px' }}>

      {/* Estadísticas */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="TOTAL ÓRDENES"
              value={estadisticas.total}
              valueStyle={{ color: '#3f8600' }}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="PENDIENTES"
              value={estadisticas.pendientes}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="ENTREGADAS"
              value={estadisticas.aprobadas}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="CERRADAS"
              value={estadisticas.completadas}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filtros */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col span={5}>
            <Input
              placeholder="Número de orden"
              value={filtros.numero}
              onChange={(e) => handleFiltroChange('numero', e.target.value)}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col span={5}>
            <Select
              placeholder="Estado"
              style={{ width: '100%' }}
              value={filtros.estado}
              onChange={(value) => handleFiltroChange('estado', value)}
              allowClear
            >
              <Option value="PENDIENTE">Pendiente</Option>
              <Option value="APROBADA">Aprobada</Option>
              <Option value="RECHAZADA">Rechazada</Option>
              <Option value="PARCIAL">Parcial</Option>
              <Option value="COMPLETADA">Completada</Option>
              <Option value="CANCELADA">Cancelada</Option>
            </Select>
          </Col>
          <Col span={6}>
            <RangePicker
              style={{ width: '100%' }}
              value={filtros.fecha}
              onChange={(dates) => handleFiltroChange('fecha', dates)}
            />
          </Col>
          <Col span={5}>
            <Input
              placeholder="Proveedor"
              value={filtros.proveedor}
              onChange={(e) => handleFiltroChange('proveedor', e.target.value)}
            />
          </Col>
          <Col span={3}>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={cargarOrdenes}
              >
                Buscar
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={limpiarFiltros}
              >
                Limpiar
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Pestañas de Local/Exterior */}
      <Card style={{ marginBottom: '16px' }}>
        <Tabs 
          activeKey={activeTab} 
          onChange={handleTabChange}
        >
          <TabPane tab="Órdenes Locales" key="LOCAL" />
          <TabPane tab="Órdenes Exterior" key="EXTERNO" />
        </Tabs>
      </Card>

      {/* Tabla */}
      <Card
        title={`Lista de Órdenes de Compra ${activeTab === 'LOCAL' ? 'Locales' : 'de Exterior'} (${ordenes.length})`}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={nuevaOrden}
          >
            Nueva Orden
          </Button>
        }
      >
        <Table
          columns={columnas}
          dataSource={ordenes}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} de ${total} órdenes ${activeTab === 'LOCAL' ? 'locales' : 'de exterior'}`
          }}
        />
      </Card>

      {/* Modal de formulario */}
      <Modal
        title={selectedOrden ? 'Editar Orden de Compra' : 'Nueva Orden de Compra'}
        open={modalVisible}
        onCancel={() => handleModalClose(false)}
        footer={null}
        width={1000}
        style={{ top: 20 }}
        destroyOnHidden
      >
        <OrdenesForm
          orden={selectedOrden}
          onClose={handleModalClose}
        />
      </Modal>

      {/* Modal de detalles */}
      <Modal
        title={`Detalles de la Orden`}
        open={detallesVisible}
        onCancel={handleDetallesClose}
        footer={[
          <Button key="close" onClick={handleDetallesClose}>
            Cerrar
          </Button>
        ]}
        width={1000}
        style={{ top: 20 }}
      >
        <OrdenDetalles orden={selectedOrden} />
      </Modal>
    </div>
  );
};

export default OrdenesCompra;