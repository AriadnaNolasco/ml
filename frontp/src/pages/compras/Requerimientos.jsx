import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Modal,
  Card,
  Space,
  Tag,
  Descriptions,
  message,
  Tooltip,
  DatePicker,
  Select,
  Input,
  Tabs,
  Row,
  Col,
  Typography
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { FilePdfOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../api/api';
import RequerimientosForm from './RequerimientosForm';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;
const { Title } = Typography;
const { Search } = Input;

const Requerimientos = ({ user }) => {
  const navigate = useNavigate(); 
  const [requerimientos, setRequerimientos] = useState([]);
  const [requerimientosCompletos, setRequerimientosCompletos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingRequerimiento, setEditingRequerimiento] = useState(null);
  const [selectedRequerimiento, setSelectedRequerimiento] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [crearOrdenLoading, setCrearOrdenLoading] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    estado: '',
    numero: '',
    fecha: null
  });
  const [activeTab, setActiveTab] = useState('INTERNO');

  useEffect(() => {
    cargarRequerimientos();
  }, []);

  useEffect(() => {
    filtrarRequerimientosPorTipo();
  }, [activeTab, requerimientosCompletos, filters, searchTerm]);

  const cargarRequerimientos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (filters.estado) params.append('estado', filters.estado);
      if (filters.numero) params.append('numero', filters.numero);
      if (filters.fecha) {
        const [start, end] = filters.fecha;
        if (start) params.append('fecha_inicio', start.format('YYYY-MM-DD'));
        if (end) params.append('fecha_fin', end.format('YYYY-MM-DD'));
      }

      const response = await api.get(`/compras/requerimientos?${params}`);
      setRequerimientosCompletos(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error al cargar requerimientos:', error);
      const errorMsg = error.response?.data?.error || 'Error al cargar la lista de requerimientos';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await api.get('/compras/requerimientos');
      setRequerimientosCompletos(Array.isArray(response.data) ? response.data : []);
      message.success('Lista actualizada');
    } catch (error) {
      console.error('Error al actualizar requerimientos:', error);
      const errorMsg = error.response?.data?.error || 'Error al actualizar la lista';
      message.error(errorMsg);
    } finally {
      setRefreshing(false);
    }
  };

  const filtrarRequerimientosPorTipo = () => {
    let requerimientosFiltrados = requerimientosCompletos;

    // Filtrar por tipo según la pestaña activa
    requerimientosFiltrados = requerimientosFiltrados.filter(req => 
      req.tipo === activeTab
    );

    // Aplicar filtro de búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      requerimientosFiltrados = requerimientosFiltrados.filter(req => {
        return (
          (req.numero && req.numero.toLowerCase().includes(searchLower)) ||
          (req.solicitante_nombre && req.solicitante_nombre.toLowerCase().includes(searchLower)) ||
          (req.solicitante_area && req.solicitante_area.toLowerCase().includes(searchLower)) ||
          (req.estado && req.estado.toLowerCase().includes(searchLower)) ||
          (req.prioridad && req.prioridad.toLowerCase().includes(searchLower))
        );
      });
    }

    // Aplicar otros filtros
    if (filters.estado) {
      requerimientosFiltrados = requerimientosFiltrados.filter(req => 
        req.estado === filters.estado
      );
    }

    if (filters.numero) {
      requerimientosFiltrados = requerimientosFiltrados.filter(req => 
        req.numero.toLowerCase().includes(filters.numero.toLowerCase())
      );
    }

    if (filters.fecha) {
      const [start, end] = filters.fecha;
      if (start && end) {
        requerimientosFiltrados = requerimientosFiltrados.filter(req => {
          const fechaReq = dayjs(req.fecha);
          return fechaReq.isAfter(start.subtract(1, 'day')) && fechaReq.isBefore(end.add(1, 'day'));
        });
      }
    }

    setRequerimientos(requerimientosFiltrados);
  };

  const handleCreate = () => {
    setEditingRequerimiento(null);
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRequerimiento(record);
    setModalVisible(true);
  };

  const handleView = async (record) => {
    try {
      const response = await api.get(`/compras/requerimientos/${record.id}/detalles`);
      
      setSelectedRequerimiento({
        ...response.data,
        detalles: response.data.detalles || []
      });
      
      setDetailModalVisible(true);
    } catch (error) {
      console.error('Error al cargar detalles:', error);
      const errorMsg = error.response?.data?.error || 'Error al cargar los detalles del requerimiento';
      message.error(errorMsg);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequerimiento) return;
    
    setUpdatingStatus(true);
    try {
      await api.patch(`/compras/requerimientos/${selectedRequerimiento.id}/aprobar`);
      
      message.success('Requerimiento aprobado correctamente');
      setDetailModalVisible(false);
      cargarRequerimientos();
    } catch (error) {
      console.error('Error al aprobar requerimiento:', error);
      const errorMsg = error.response?.data?.error || 'Error al aprobar el requerimiento';
      message.error(errorMsg);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequerimiento) return;

    setUpdatingStatus(true);
    try {
      await api.patch(`/compras/requerimientos/${selectedRequerimiento.id}/rechazar`);
      
      message.success('Requerimiento rechazado correctamente');
      setDetailModalVisible(false);
      cargarRequerimientos();
    } catch (error) {
      console.error('Error al rechazar requerimiento:', error);
      const errorMsg = error.response?.data?.error || 'Error al rechazar el requerimiento';
      message.error(errorMsg);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCrearOrden = async () => {
    if (!selectedRequerimiento) return;
    
    setCrearOrdenLoading(true);
    try {
      const response = await api.get(`/compras/requerimientos/${selectedRequerimiento.id}/orden-datos`);
      
      navigate('/compras/ordenes-compra', { 
        state: { 
          desdeRequerimiento: true,
          requerimientoData: response.data 
        } 
      });
      
    } catch (error) {
      console.error('Error al obtener datos para orden:', error);
      const errorMsg = error.response?.data?.error || 'Error al preparar la creación de orden';
      message.error(errorMsg);
    } finally {
      setCrearOrdenLoading(false);
      setDetailModalVisible(false);
    }
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: '¿Está seguro de eliminar este requerimiento?',
      content: 'Esta acción no se puede deshacer.',
      okText: 'Sí, eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await api.delete(`/compras/requerimientos/${id}`);
          message.success('Requerimiento eliminado correctamente');
          cargarRequerimientos();
        } catch (error) {
          console.error('Error al eliminar requerimiento:', error);
          const errorMsg = error.response?.data?.error || 'Error al eliminar el requerimiento';
          message.error(errorMsg);
        }
      }
    });
  };

  const exportarRequerimientoPDF = async () => {
    if (!selectedRequerimiento?.id) return;
    setCrearOrdenLoading(true); // puedes usar setExportando si prefieres crear un nuevo estado

    try {
      const response = await api.get(
        `/compras/requerimientos/${selectedRequerimiento.id}/export-pdf`,
        { responseType: 'blob' } // importante: para manejar datos binarios
      );

      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank'); // abre el PDF en nueva pestaña
    } catch (error) {
      console.error('Error al exportar PDF de requerimiento:', error);
      message.error('No se pudo generar el PDF del requerimiento');
    } finally {
      setCrearOrdenLoading(false);
    }
  };

  const handleSubmitSuccess = () => {
    setModalVisible(false);
    cargarRequerimientos();
  };

  const getEstadoColor = (estado) => {
    const colors = {
      'PENDIENTE': 'orange',
      'APROBADO': 'green',
      'RECHAZADO': 'red',
      'PROCESADO': 'blue',
      'CERRADO': 'purple'
    };
    return colors[estado] || 'default';
  };

  const getPrioridadColor = (prioridad) => {
    const colors = {
      'Normal': 'blue',
      'Urgente': 'orange',
      'Alta': 'red'
    };
    return colors[prioridad] || 'default';
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSearch = () => {
    filtrarRequerimientosPorTipo();
  };

  const handleResetFilters = () => {
    setFilters({
      estado: '',
      numero: '',
      fecha: null
    });
    setSearchTerm('');
    filtrarRequerimientosPorTipo();
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const filteredRequerimientos = requerimientos;

  const columns = [
    {
      title: 'Número',
      dataIndex: 'numero',
      key: 'numero',
      sorter: (a, b) => a.numero.localeCompare(b.numero),
      render: (numero, record) => (
        <strong>{`${record.documento_codigo || 'REQ'} - ${numero}`}</strong>
      ),
    },
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      key: 'fecha',
      render: (fecha) => dayjs(fecha).format('DD/MM/YYYY'),
      sorter: (a, b) => new Date(a.fecha) - new Date(b.fecha),
    },
    {
      title: 'Solicitante',
      dataIndex: 'solicitante_nombre',
      key: 'solicitante_nombre',
      render: (nombre, record) => (
        <div>
          <div style={{ fontWeight: '500' }}>{nombre || 'N/A'}</div>
          {record.solicitante_area && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.solicitante_area}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      render: (tipo) => (
        <Tag color={tipo === 'INTERNO' ? 'blue' : 'green'}>
          {tipo}
        </Tag>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (estado) => (
        <Tag color={getEstadoColor(estado)}>
          {estado}
        </Tag>
      ),
      filters: [
        { text: 'Pendiente', value: 'PENDIENTE' },
        { text: 'Aprobado', value: 'APROBADO' },
        { text: 'Rechazado', value: 'RECHAZADO' },
        { text: 'Procesado', value: 'PROCESADO' },
        { text: 'Cerrado', value: 'CERRADO' },
      ],
      onFilter: (value, record) => record.estado === value,
    },
    {
      title: 'Prioridad',
      dataIndex: 'prioridad',
      key: 'prioridad',
      render: (prioridad) => (
        <Tag color={getPrioridadColor(prioridad)}>
          {prioridad}
        </Tag>
      ),
    },
    {
      title: 'Fecha Entrega',
      dataIndex: 'fecha_entrega',
      key: 'fecha_entrega',
      render: (fecha) => dayjs(fecha).format('DD/MM/YYYY'),
    },
    {
      title: 'Total Solicitado',
      dataIndex: 'total_cantidad_solicitada',
      key: 'total_cantidad_solicitada',
      render: (total) => Number(total || 0).toLocaleString('es-PE', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3
      }),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Ver detalles">
            <Button 
              size="small"
              icon={<EyeOutlined />} 
              onClick={() => handleView(record)}
            />
          </Tooltip>
          <Tooltip title="Editar">
            <Button 
              size="small"
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
              disabled={record.estado !== 'PENDIENTE'}
            />
          </Tooltip>
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
              Gestión de Requerimientos de Compra
            </Title>
            <p style={{ margin: 0, color: '#666' }}>
              Total de requerimientos {activeTab.toLowerCase()}: {filteredRequerimientos.length}
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
                Nuevo Requerimiento
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Búsqueda principal */}
        <Row style={{ marginBottom: 20 }}>
          <Col span={24}>
            <Search
              placeholder="Buscar por número, solicitante, área, estado o prioridad..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onSearch={handleSearch}
            />
          </Col>
        </Row>

        {/* Filtros avanzados */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space wrap>
            <Input
              placeholder="Buscar por número"
              value={filters.numero}
              onChange={(e) => handleFilterChange('numero', e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
            
            <Select
              placeholder="Filtrar por estado"
              value={filters.estado || undefined}
              onChange={(value) => handleFilterChange('estado', value)}
              style={{ width: 200 }}
              allowClear
            >
              <Option value="PENDIENTE">Pendiente</Option>
              <Option value="APROBADO">Aprobado</Option>
              <Option value="RECHAZADO">Rechazado</Option>
              <Option value="PROCESADO">Procesado</Option>
              <Option value="CERRADO">Cerrado</Option>
            </Select>

            <RangePicker
              placeholder={['Fecha inicio', 'Fecha fin']}
              value={filters.fecha}
              onChange={(dates) => handleFilterChange('fecha', dates)}
              style={{ width: 250 }}
            />

            <Button 
              type="primary" 
              icon={<SearchOutlined />} 
              onClick={handleSearch}
            >
              Buscar
            </Button>

            <Button onClick={handleResetFilters}>
              Limpiar
            </Button>
          </Space>
        </Card>

        {/* Pestañas de Interno/Externo */}
        <Tabs 
          activeKey={activeTab} 
          onChange={handleTabChange}
          style={{ marginBottom: 16 }}
        >
          <TabPane tab="Requerimientos Internos" key="INTERNO" />
          <TabPane tab="Requerimientos Externos" key="EXTERNO" />
        </Tabs>

        <Table 
          columns={columns} 
          dataSource={filteredRequerimientos} 
          loading={loading}
          rowKey="id"
          locale={{
            emptyText: 'No se encontraron requerimientos'
          }}
          pagination={{ 
            pageSize: 10, 
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} de ${total} requerimientos ${activeTab.toLowerCase()}`
          }}
          scroll={{ x: 1000 }}
          size="middle"
        />
      </Card>

      {/* Modal para crear/editar requerimiento */}
      <Modal
        title={editingRequerimiento ? 'Editar Requerimiento' : 'Nuevo Requerimiento'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={1100}
        destroyOnHidden
      >
        <RequerimientosForm
          requerimiento={editingRequerimiento}
          onSuccess={handleSubmitSuccess}
          onCancel={() => setModalVisible(false)}
        />
      </Modal>

      {/* Modal para ver detalles del requerimiento */}
      <Modal
        title="Detalles del Requerimiento"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          selectedRequerimiento?.estado === 'PENDIENTE' ? (
            <Space key="actions">
              <Button 
                type="primary" 
                danger 
                icon={<CloseOutlined />}
                onClick={handleReject}
                loading={updatingStatus}
              >
                Rechazar
              </Button>
              <Button 
                type="primary" 
                icon={<CheckOutlined />}
                onClick={handleApprove}
                loading={updatingStatus}
              >
                Aprobar
              </Button>
            </Space>
          ) : selectedRequerimiento?.estado === 'APROBADO' ? (
            <Button 
              key="crear-orden"
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleCrearOrden}
              loading={crearOrdenLoading}
            >
              Crear Orden
            </Button>
          ) : null,

          <Button
            key="exportar-pdf"
            onClick={exportarRequerimientoPDF}
            icon={<FilePdfOutlined />}
            loading={crearOrdenLoading}
          >
            Exportar PDF
          </Button>,

          <Button 
            key="close" 
            onClick={() => setDetailModalVisible(false)}
          >
            Cerrar
          </Button>
        ]}
        width={1000}
      >
        {selectedRequerimiento && (
          <div>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Número">
                {`${selectedRequerimiento.documento_codigo || 'DOC'} - ${selectedRequerimiento.numero}`}
              </Descriptions.Item>
              <Descriptions.Item label="Fecha">
                {dayjs(selectedRequerimiento.fecha).format('DD/MM/YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Código Compras">
                {selectedRequerimiento.codigo_compras_nombre || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Solicitante" span={2}>
                <div>
                  <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                    {selectedRequerimiento.solicitante_nombre || 'N/A'}
                  </div>
                  {selectedRequerimiento.solicitante_area && (
                    <Tag color="blue" style={{ margin: 0 }}>
                      {selectedRequerimiento.solicitante_area}
                    </Tag>
                  )}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="Tipo">
                <Tag color={selectedRequerimiento.tipo === 'INTERNO' ? 'blue' : 'green'}>
                  {selectedRequerimiento.tipo}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Estado">
                <Tag color={getEstadoColor(selectedRequerimiento.estado)}>
                  {selectedRequerimiento.estado}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Prioridad">
                <Tag color={getPrioridadColor(selectedRequerimiento.prioridad)}>
                  {selectedRequerimiento.prioridad}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Propósito">
                {selectedRequerimiento.proposito}
              </Descriptions.Item>
              <Descriptions.Item label="Fecha Entrega">
                {dayjs(selectedRequerimiento.fecha_entrega).format('DD/MM/YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Total Solicitado" span={2}>
                {Number(selectedRequerimiento.total_cantidad_solicitada || 0).toLocaleString('es-PE', {
                  minimumFractionDigits: 3,
                  maximumFractionDigits: 3
                })}
              </Descriptions.Item>
            </Descriptions>

            <Card title="Items del Requerimiento" size="small">
              <Table
                dataSource={selectedRequerimiento.detalles || []}
                pagination={false}
                size="small"
                rowKey="id"
                columns={[
                  {
                    title: 'Item',
                    dataIndex: 'numitem',
                    key: 'numitem',
                    width: 60,
                  },
                  {
                    title: 'Código',
                    dataIndex: 'producto_codigo',
                    key: 'producto_codigo',
                    width: 120,
                  },
                  {
                    title: 'Producto',
                    dataIndex: 'producto_descripcion',
                    key: 'producto_descripcion',
                    render: (text, record) => text || record.producto_codigo,
                  },
                  {
                    title: 'Unidad Medida',
                    dataIndex: 'unidad_medida_abrev',
                    key: 'unidad_medida_abrev',
                    width: 100,
                    render: (unidad) => unidad || 'N/A',
                  },
                  {
                    title: 'Stock Actual',
                    dataIndex: 'stock_actual_producto',
                    key: 'stock_actual_producto',
                    width: 100,
                    render: (stock) =>
                      Number(stock || 0).toLocaleString('es-PE', {
                        minimumFractionDigits: 3,
                        maximumFractionDigits: 3,
                      }),
                  },
                  {
                    title: 'Cant. Solicitada',
                    dataIndex: 'cantidad_solicitada',
                    key: 'cantidad_solicitada',
                    render: (cantidad) =>
                      Number(cantidad || 0).toLocaleString('es-PE', {
                        minimumFractionDigits: 3,
                        maximumFractionDigits: 3,
                      }),
                  },
                  {
                    title: 'Comentario',
                    dataIndex: 'comentario',
                    key: 'comentario',
                    ellipsis: true,
                  },
                ]}
              />
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Requerimientos;