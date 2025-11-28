import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Card,
  Button,
  Space,
  Tag,
  Row,
  Col,
  Input,
  Select,
  DatePicker,
  message,
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
import Swal from 'sweetalert2';
import api from '../../../api/api';
import ModalSeleccionarOC from './ModalSeleccionarOC';

const { Option } = Select;
const { RangePicker } = DatePicker;

const NotasIngresoList = () => {
  const navigate = useNavigate();
  const [notas, setNotas] = useState([]);
  const [notasCompletas, setNotasCompletas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('LOCAL');
  const [modalSeleccionOCVisible, setModalSeleccionOCVisible] = useState(false);
  const [filtros, setFiltros] = useState({
    numero: '',
    estado: '',
    fecha: null,
    proveedor: ''
  });
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    borradores: 0,
    confirmadas: 0,
    anuladas: 0
  });

  const estados = {
    BORRADOR: { color: 'orange', text: 'Borrador' },
    CONFIRMADA: { color: 'green', text: 'Confirmada' },
    ANULADA: { color: 'red', text: 'Anulada' }
  };

  const columnas = [
    {
      title: 'Número',
      key: 'numero',
      width: 150,
      render: (_, record) => (
        <strong>{record.numero}</strong>
      )
    },
    {
      title: 'Fecha',
      dataIndex: 'fecha_ingreso',
      key: 'fecha_ingreso',
      width: 110,
      render: (fecha) => dayjs(fecha).format('DD/MM/YYYY')
    },
    {
      title: 'OC',
      key: 'orden_compra',
      width: 150,
      render: (_, record) => (
        <span>
          {record.orden_compra_numero || '-'}
        </span>
      )
    },
    {
      title: 'Proveedor',
      dataIndex: 'proveedor_razon_social',
      key: 'proveedor_razon_social',
      ellipsis: true
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      width: 80,
      render: (tipo) => tipo === 'LOCAL' ? 'Local' : 'Exterior'
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
      title: 'Acciones',
      key: 'acciones',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleVerDetalle(record)}
            title="Ver detalle"
          />
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditar(record)}
            disabled={record.estado !== 'BORRADOR'}
            title="Editar"
          />
          <Button
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => handleGenerarPDF(record)}
            disabled={record.estado !== 'CONFIRMADA'}
            title="Generar PDF"
          />
          <Popconfirm
            title={record.estado === 'BORRADOR' ? '¿Está seguro de eliminar este borrador?' : '¿Está seguro de anular esta nota de ingreso?'}
            description={record.estado === 'BORRADOR' ? 'Esta acción no se puede deshacer.' : 'Esta acción revertirá los movimientos de stock.'}
            onConfirm={() => record.estado === 'BORRADOR' ? handleEliminar(record.id) : handleAnular(record.id)}
            okText="Sí"
            cancelText="No"
            disabled={record.estado !== 'CONFIRMADA' && record.estado !== 'BORRADOR'}
          >
            <Button
              size="small"
              icon={<CloseCircleOutlined />}
              danger
              disabled={record.estado !== 'CONFIRMADA' && record.estado !== 'BORRADOR'}
              title={record.estado === 'BORRADOR' ? 'Eliminar' : 'Anular'}
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  useEffect(() => {
    fetchNotasIngreso();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filtrarNotasPorTipo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, notasCompletas, filtros]);

  const fetchNotasIngreso = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (filtros.numero) params.append('buscar', filtros.numero);
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.proveedor) params.append('buscar', filtros.proveedor);
      if (filtros.fecha) {
        params.append('fecha_desde', filtros.fecha[0].format('YYYY-MM-DD'));
        params.append('fecha_hasta', filtros.fecha[1].format('YYYY-MM-DD'));
      }

      const response = await api.get(`/almacen/notas-ingreso?${params.toString()}`);
      // El backend devuelve { data: [...], pagination: {...} }
      const data = Array.isArray(response.data?.data) ? response.data.data : 
                   Array.isArray(response.data) ? response.data : [];
      setNotasCompletas(data);
      
      // Filtrar por tipo según la pestaña activa
      filtrarNotasPorTipo(data);
      
      // Calcular estadísticas
      const total = data.length;
      const borradores = data.filter(n => n.estado === 'BORRADOR').length;
      const confirmadas = data.filter(n => n.estado === 'CONFIRMADA').length;
      const anuladas = data.filter(n => n.estado === 'ANULADA').length;
      
      setEstadisticas({ total, borradores, confirmadas, anuladas });
    } catch (error) {
      message.error('Error al cargar las notas de ingreso');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtrarNotasPorTipo = (notasData = notasCompletas) => {
    // Asegurar que notasData sea un array
    if (!Array.isArray(notasData)) {
      setNotas([]);
      return;
    }

    let notasFiltradas = notasData;

    // Filtrar por tipo según la pestaña activa
    notasFiltradas = notasFiltradas.filter(nota => 
      nota.tipo === activeTab
    );

    // Aplicar otros filtros si existen
    if (filtros.estado) {
      notasFiltradas = notasFiltradas.filter(nota => 
        nota.estado === filtros.estado
      );
    }

    if (filtros.numero) {
      notasFiltradas = notasFiltradas.filter(nota => 
        nota.numero?.toLowerCase().includes(filtros.numero.toLowerCase()) ||
        nota.orden_compra_numero?.toLowerCase().includes(filtros.numero.toLowerCase())
      );
    }

    if (filtros.proveedor) {
      notasFiltradas = notasFiltradas.filter(nota => 
        nota.proveedor_nombre?.toLowerCase().includes(filtros.proveedor.toLowerCase())
      );
    }

    if (filtros.fecha) {
      const [start, end] = filtros.fecha;
      if (start && end) {
        notasFiltradas = notasFiltradas.filter(nota => {
          const fechaNota = dayjs(nota.fecha_ingreso);
          return fechaNota.isAfter(start.subtract(1, 'day')) && fechaNota.isBefore(end.add(1, 'day'));
        });
      }
    }

    setNotas(notasFiltradas);
  };

  const handleNuevaNota = () => {
    setModalSeleccionOCVisible(true);
  };

  const handleSeleccionarOC = (ordenCompra) => {
    // Navegar al formulario con la orden de compra seleccionada
    navigate('/almacen/notas-ingreso/nueva', { state: { ordenCompra } });
  };

  const handleVerDetalle = (nota) => {
    navigate(`/almacen/notas-ingreso/${nota.id}`);
  };

  const handleEditar = (nota) => {
    navigate(`/almacen/notas-ingreso/editar/${nota.id}`);
  };

  const handleEliminar = async (id) => {
    try {
      await api.delete(`/almacen/notas-ingreso/${id}`);
      message.success('Borrador eliminado exitosamente');
      fetchNotasIngreso();
    } catch (error) {
      console.error('Error al eliminar borrador:', error);
      message.error(error.response?.data?.error || 'Error al eliminar el borrador');
    }
  };

  const handleGenerarPDF = async (nota) => {
    try {
      const response = await api.get(`/almacen/notas-ingreso/${nota.id}/pdf`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      message.error('Error al generar el PDF');
      console.error('Error:', error);
    }
  };

  const handleAnular = async (id) => {
    try {
      const result = await Swal.fire({
        title: '¿Está seguro?',
        text: 'Esta acción revertirá los movimientos de stock y las cantidades recibidas en la orden de compra.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, anular',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        await api.post(`/almacen/notas-ingreso/${id}/anular`);
        
        Swal.fire({
          title: 'Anulada',
          text: 'La nota de ingreso ha sido anulada correctamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        
        fetchNotasIngreso();
      }
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || 'Error al anular la nota de ingreso',
        icon: 'error'
      });
      console.error('Error:', error);
    }
  };

  const handleFiltroChange = (key, value) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
  };

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

  return (
    <div style={{ padding: '24px' }}>
      {/* Estadísticas */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="TOTAL NOTAS"
              value={estadisticas.total}
              valueStyle={{ color: '#3f8600' }}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="BORRADORES"
              value={estadisticas.borradores}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="CONFIRMADAS"
              value={estadisticas.confirmadas}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="ANULADAS"
              value={estadisticas.anuladas}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filtros */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col span={5}>
            <Input
              placeholder="Número de nota u OC"
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
              <Option value="BORRADOR">Borrador</Option>
              <Option value="CONFIRMADA">Confirmada</Option>
              <Option value="ANULADA">Anulada</Option>
            </Select>
          </Col>
          <Col span={6}>
            <RangePicker
              style={{ width: '100%' }}
              value={filtros.fecha}
              onChange={(dates) => handleFiltroChange('fecha', dates)}
              placeholder={['Fecha desde', 'Fecha hasta']}
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
                onClick={fetchNotasIngreso}
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
          items={[
            { key: 'LOCAL', label: 'Notas Locales' },
            { key: 'EXTERNO', label: 'Notas Exterior' }
          ]}
        />
      </Card>

      {/* Tabla */}
      <Card
        title={`Lista de Notas de Ingreso ${activeTab === 'LOCAL' ? 'Locales' : 'de Exterior'} (${notas.length})`}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleNuevaNota}
          >
            Nueva Nota de Ingreso
          </Button>
        }
      >
        <Table
          columns={columnas}
          dataSource={notas}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} de ${total} notas ${activeTab === 'LOCAL' ? 'locales' : 'de exterior'}`
          }}
        />
      </Card>

      {/* Modal Seleccionar OC */}
      <ModalSeleccionarOC
        visible={modalSeleccionOCVisible}
        onClose={() => setModalSeleccionOCVisible(false)}
        onSelect={handleSeleccionarOC}
      />
    </div>
  );
};

export default NotasIngresoList;
