import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  message,
  Popconfirm,
  Typography,
  Tabs,
  Card,
  Tag,
  Row,
  Col,
  Input,
  Divider
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  FileTextOutlined,
  GlobalOutlined,
  ReloadOutlined,
  EyeOutlined
} from '@ant-design/icons';
import api from '../../api/api';
import FacturaForm from './FacturaForm';
import FacturaDetalles from './FacturaDetalles';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Search } = Input;

const FacturaCompra = () => {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editingFactura, setEditingFactura] = useState(null);
  const [activeTab, setActiveTab] = useState('LOCAL');
  const [searchText, setSearchText] = useState('');
  const [detalleVisible, setDetalleVisible] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);

  const fetchFacturas = async () => {
    try {
      setLoading(true);
      const res = await api.get('/contabilidad/facturas-proveedor');
      setFacturas(res.data.data || res.data);
    } catch (error) {
      console.error('Error al cargar facturas:', error);
      message.error('Error al cargar facturas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacturas();
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/contabilidad/facturas-proveedor/${id}`);
      message.success('Factura eliminada correctamente');
      fetchFacturas();
    } catch (error) {
      console.error('Error al eliminar factura:', error);
      message.error('No se pudo eliminar la factura');
    }
  };

  const handleCreate = () => {
    setEditingFactura(null);
    setOpenModal(true);
  };

  const handleEdit = (factura) => {
    setEditingFactura(factura);
    setOpenModal(true);
  };

  const handleViewDetails = (factura) => {
    setFacturaSeleccionada(factura);
    setDetalleVisible(true);
  };

  const handleSave = () => {
    setOpenModal(false);
    fetchFacturas();
  };

  const getEstadoColor = (estado) => {
    const colors = {
      'REGISTRADA': 'blue',
      'PAGADA': 'green',
      'OBSERVADA': 'orange',
      'ANULADA': 'red'
    };
    return colors[estado] || 'default';
  };

  const formatCurrency = (value, moneda = 'PEN') => {
    if (!value) return '-';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: moneda,
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-PE');
  };

  const handleExportPDF = async (facturaId) => {
      try {
          console.log('Solicitando PDF para factura:', facturaId);
          
          const response = await api.get(`/contabilidad/facturas-proveedor/${facturaId}/pdf`, {
              responseType: 'blob' // Esto es crucial
          });

          console.log('Respuesta recibida:', {
              status: response.status,
              headers: response.headers,
              dataSize: response.data.size,
              dataType: response.data.type
          });

          // Verificar que el blob sea válido
          if (!response.data || response.data.size === 0) {
              throw new Error('El archivo PDF está vacío o corrupto');
          }

          // Crear el blob
          const blob = new Blob([response.data], { 
              type: response.headers['content-type'] || 'application/pdf' 
          });

          // Crear URL para descarga
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = `factura-${facturaId}.pdf`;
          document.body.appendChild(a);
          a.click();
          
          // Limpiar
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          message.success('PDF descargado correctamente');
      } catch (error) {
          console.error('❌ Error completo al descargar PDF:', error);
          message.error(`Error al descargar PDF: ${error.message}`);
      }
  };

  // Filtrar facturas basado en búsqueda
  const filteredFacturas = facturas.filter(factura => {
    const matchesTab = factura.tipo_compra === activeTab;
    const matchesSearch = !searchText || 
      factura.proveedor_nombre?.toLowerCase().includes(searchText.toLowerCase()) ||
      factura.numero?.toString().includes(searchText) ||
      factura.numero_fac?.toString().includes(searchText) ||
      factura.numero_invoice?.toLowerCase().includes(searchText.toLowerCase());
    
    return matchesTab && matchesSearch;
  });

  const facturasLocales = facturas.filter(f => f.tipo_compra === 'LOCAL');
  const facturasExternas = facturas.filter(f => f.tipo_compra === 'EXTERNO');

  const columns = [
    {
      title: 'Documento',
      key: 'documento',
      width: 120,
      render: (_, record) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            border: '1px solid #d9d9d9',
            padding: '4px 8px',
            borderRadius: '4px',
            fontWeight: '500',
            fontSize: '12px',
            background: '#fafafa'
          }}>
            {record.documento_codigo || (record.tipo_compra === 'LOCAL' ? 'FAP' : 'FPE')}
          </div>
          <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
            #{record.numero}
          </div>
        </div>
      ),
    },
    {
      title: 'Proveedor',
      dataIndex: 'proveedor_nombre',
      key: 'proveedor',
      render: (text, record) => (
        <div>
          <Text strong style={{ fontSize: '13px' }}>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.proveedor_ruc || 'Sin RUC'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Comprobante',
      key: 'comprobante',
      width: 140,
      render: (_, record) => (
        <div>
          {record.tipo_compra === 'LOCAL' ? (
            <>
              <Text style={{ fontSize: '12px' }}>Serie: {record.serie || '-'}</Text>
              <br />
              <Text strong style={{ fontSize: '12px' }}>N°: {record.numero_fac || '-'}</Text>
            </>
          ) : (
            <>
              <Text strong style={{ fontSize: '12px' }}>Invoice</Text>
              <br />
              <Text style={{ fontSize: '11px' }}>{record.numero_invoice || '-'}</Text>
            </>
          )}
        </div>
      ),
    },
    {
      title: 'Fechas',
      key: 'fechas',
      width: 130,
      render: (_, record) => (
        <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
          <div><strong>Emisión:</strong> {formatDate(record.fecha_emision)}</div>
          <div><strong>Vencimiento:</strong> {formatDate(record.fecha_vencimiento)}</div>
        </div>
      ),
    },
    {
      title: 'Moneda',
      key: 'moneda',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <div style={{ 
          padding: '2px 6px',
          background: record.moneda_codigo === 'PEN' ? '#f6ffed' : '#f0f7ff',
          border: `1px solid ${record.moneda_codigo === 'PEN' ? '#b7eb8f' : '#91d5ff'}`,
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: '500'
        }}>
          {record.moneda_codigo || 'PEN'}
        </div>
      ),
    },
    {
      title: 'Total',
      key: 'total',
      width: 120,
      align: 'right',
      render: (_, record) => (
        <div>
          <Text strong style={{ fontSize: '13px' }}>
            {formatCurrency(record.total, record.moneda_codigo)}
          </Text>
          {record.tipo_compra === 'EXTERNO' && record.importe_soles && (
            <div style={{ fontSize: '10px', color: '#52c41a' }}>
              {formatCurrency(record.importe_soles)}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 100,
      render: (estado) => (
        <Tag 
          color={getEstadoColor(estado)} 
          style={{ 
            margin: 0, 
            fontSize: '11px',
            fontWeight: '500',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          {estado}
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
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
            size="small"
            type="text"
            style={{ color: '#000000ff' }}
          />
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
            type="text"
          />
          <Popconfirm
            title="Eliminar factura"
            description="¿Está seguro de eliminar esta factura?"
            onConfirm={() => handleDelete(record.id)}
            okText="Sí"
            cancelText="No"
          >
            <Button 
              icon={<DeleteOutlined />} 
              size="small"
              type="text"
              danger
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#ffffff', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={2} style={{ margin: 0, color: '#262626', fontWeight: 600 }}>
              Facturas de Proveedor
            </Title>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Gestión de facturas locales e internacionales
            </Text>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchFacturas}
                loading={loading}
              >
                Actualizar
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
                size="large"
              >
                Nueva Factura
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <Divider style={{ margin: '16px 0 24px 0' }} />

      {/* Filtros y Búsqueda */}
      <Card 
        bordered={false}
        style={{ 
          marginBottom: 24,
          border: '1px solid #f0f0f0',
          borderRadius: '6px'
        }}
        bodyStyle={{ padding: '16px 24px' }}
      >
        <Row gutter={16} align="middle">
          <Col span={12}>
            <Search
              placeholder="Buscar por proveedor, número, invoice..."
              allowClear
              enterButton={<SearchOutlined />}
              size="middle"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={setSearchText}
            />
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Space>
              <Text type="secondary" strong>Total:</Text>
              <Text>{filteredFacturas.length} facturas</Text>
              <Divider type="vertical" />
              <Text type="secondary" strong>Locales:</Text>
              <Text>{facturasLocales.length}</Text>
              <Divider type="vertical" />
              <Text type="secondary" strong>Externas:</Text>
              <Text>{facturasExternas.length}</Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Tabs y Tabla */}
      <Card 
        bordered={false}
        style={{ 
          border: '1px solid #f0f0f0',
          borderRadius: '6px'
        }}
        bodyStyle={{ padding: 0 }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ padding: '0 24px' }}
          items={[
            {
              key: 'LOCAL',
              label: (
                <span>
                  <FileTextOutlined style={{ marginRight: 8 }} />
                  Facturas Locales
                  <span style={{ 
                    marginLeft: 8,
                    background: '#f0f0f0',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontSize: '12px'
                  }}>
                    {facturasLocales.length}
                  </span>
                </span>
              ),
            },
            {
              key: 'EXTERNO',
              label: (
                <span>
                  <GlobalOutlined style={{ marginRight: 8 }} />
                  Facturas Externas
                  <span style={{ 
                    marginLeft: 8,
                    background: '#f0f0f0',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontSize: '12px'
                  }}>
                    {facturasExternas.length}
                  </span>
                </span>
              ),
            }
          ]}
        />
        
        <Table
          columns={columns}
          dataSource={filteredFacturas}
          rowKey="id"
          loading={loading}
          pagination={{ 
            pageSize: 10, 
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `Mostrando ${range[0]}-${range[1]} de ${total} registros`,
            size: 'default'
          }}
          scroll={{ x: 1000 }}
          size="middle"
          style={{ borderTop: '1px solid #f0f0f0' }}
        />
      </Card>

      {/* Modal */}
      <Modal
        title={
          <span style={{ fontSize: '16px', fontWeight: '500' }}>
            {editingFactura ? 'Editar Factura' : 'Nueva Factura'}
          </span>
        }
        open={openModal}
        onCancel={() => setOpenModal(false)}
        footer={null}
        destroyOnClose
        width={1100}
        style={{ top: 20 }}
      >
        <FacturaForm
          factura={editingFactura}
          onSave={handleSave}
          onCancel={() => setOpenModal(false)}
          tipoCompraDefault={activeTab}
        />
      </Modal>
      <FacturaDetalles
        factura={facturaSeleccionada}
        open={detalleVisible}
        onClose={() => setDetalleVisible(false)}
        onExportPDF={handleExportPDF}
      />
    </div>
  );
};

export default FacturaCompra;