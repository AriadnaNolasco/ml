import React from 'react';
import {
  Modal,
  Descriptions,
  Table,
  Tag,
  Card,
  Row,
  Col,
  Divider,
  Typography,
  Space,
  Image, 
  Button
} from 'antd';
import {
  FileTextOutlined,
  BankOutlined,
  ShoppingOutlined,
  DollarOutlined,
  GlobalOutlined,
  CalendarOutlined,
  UserOutlined,
  EnvironmentOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import api from '../../api/api';

const { Title, Text } = Typography;

const FacturaDetalles = ({ factura, open, onClose, onExportPDF }) => {
  if (!factura) return null;

  // Función para formatear moneda
  const formatCurrency = (value, moneda = 'PEN') => {
    if (!value) return 'S/ 0.00';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: moneda,
      minimumFractionDigits: 2
    }).format(value);
  };

  // Función para formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Obtener color del estado
  const getEstadoColor = (estado) => {
    const colors = {
      'REGISTRADA': 'blue',
      'PAGADA': 'green',
      'OBSERVADA': 'orange',
      'ANULADA': 'red'
    };
    return colors[estado] || 'default';
  };

  // Columnas para la tabla de items
  const columnsItems = [
    {
      title: 'Item',
      dataIndex: 'numitem',
      key: 'numitem',
      width: 60,
      align: 'center'
    },
    {
      title: 'Producto',
      key: 'producto',
      render: (_, record) => (
        <div>
          <Text strong>{record.producto_codigo}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.descripcion}
          </Text>
        </div>
      )
    },
    {
      title: 'Unidad',
      dataIndex: 'unidad_medida',
      key: 'unidad_medida',
      width: 80,
      align: 'center'
    },
    {
      title: 'Cantidad',
      key: 'cantidad',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text>Solicitada: {record.cantidad_solicitada || 0}</Text>
          <Text>Recibida: {record.cantidad_recibida || 0}</Text>
          <Text strong>Facturada: {record.cantidad_facturada}</Text>
        </Space>
      )
    },
    {
      title: 'Precio Unit.',
      dataIndex: 'precio_unitario',
      key: 'precio_unitario',
      width: 100,
      align: 'right',
      render: (value) => formatCurrency(value, factura.moneda_codigo)
    },
    {
      title: 'Valor Venta',
      dataIndex: 'valor_venta',
      key: 'valor_venta',
      width: 100,
      align: 'right',
      render: (value) => formatCurrency(value, factura.moneda_codigo)
    },
    {
      title: 'IGV',
      dataIndex: 'igv',
      key: 'igv',
      width: 100,
      align: 'right',
      render: (value) => value ? formatCurrency(value, factura.moneda_codigo) : '-'
    },
    {
      title: 'Total',
      dataIndex: 'precio_total',
      key: 'precio_total',
      width: 100,
      align: 'right',
      render: (value) => formatCurrency(value, factura.moneda_codigo)
    }
  ];

  const handleExportPDF = () => {
    if (onExportPDF && factura) {
      onExportPDF(factura.id);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined style={{ color: '#1890ff' }} />
          <span>Detalles de Factura - {factura.documento_codigo} #{factura.numero}</span>
          <Tag 
            color={getEstadoColor(factura.estado)}
            style={{ marginLeft: 8, fontWeight: 'bold' }}
          >
            {factura.estado}
          </Tag>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Cerrar
        </Button>,
        <Button 
          key="pdf" 
          type="primary" 
          icon={<DownloadOutlined />}
          onClick={handleExportPDF}
        >
          Exportar PDF
        </Button>
      ]}
      width={1200}
      style={{ top: 20 }}
      bodyStyle={{ padding: '24px' }}
    >
      {/* Header Información General */}
      <Card 
        bordered={false} 
        style={{ 
          marginBottom: 24,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          border: '1px solid #d6e4ff'
        }}
        bodyStyle={{ padding: '20px' }}
      >
        <Row gutter={24}>
          <Col span={12}>
            <Space direction="vertical" size="small">
              <Space>
                <UserOutlined style={{ color: '#1890ff' }} />
                <Text strong style={{ fontSize: '16px' }}>
                  {factura.proveedor_nombre}
                </Text>
              </Space>
              <Text type="secondary">
                RUC: {factura.proveedor_ruc || 'No especificado'}
              </Text>
              {factura.direccion && (
                <Space>
                  <EnvironmentOutlined />
                  <Text>{factura.direccion}</Text>
                </Space>
              )}
            </Space>
          </Col>
          <Col span={12}>
            <Space direction="vertical" size="small" style={{ float: 'right' }}>
              <Text strong>Orden de Compra: #{factura.orden_compra_numero}</Text>
              <Space>
                <CalendarOutlined />
                <Text>Emisión: {formatDate(factura.fecha_emision)}</Text>
              </Space>
              <Space>
                <CalendarOutlined />
                <Text>Vencimiento: {formatDate(factura.fecha_vencimiento)}</Text>
              </Space>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={24}>
        {/* Columna Izquierda - Información Principal */}
        <Col span={12}>
          {/* Información del Documento */}
          <Card 
            title={
              <Space>
                <FileTextOutlined />
                <span>Información del Documento</span>
              </Space>
            }
            bordered={false}
            style={{ marginBottom: 24 }}
            size="small"
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Tipo de Compra">
                <Tag color={factura.tipo_compra === 'LOCAL' ? 'blue' : 'green'}>
                  {factura.tipo_compra}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Documento">
                {factura.documento_codigo} - {factura.documento_nombre}
              </Descriptions.Item>
              
              {factura.tipo_compra === 'LOCAL' ? (
                <>
                  <Descriptions.Item label="Tipo Documento">
                    {factura.tipo_doc || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Serie">
                    {factura.serie || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Número Factura">
                    {factura.numero_fac || '-'}
                  </Descriptions.Item>
                  {factura.guia_remision && (
                    <Descriptions.Item label="Guía de Remisión">
                      {factura.guia_remision}
                    </Descriptions.Item>
                  )}
                </>
              ) : (
                <>
                  <Descriptions.Item label="Número Invoice">
                    {factura.numero_invoice || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Fecha Llegada">
                    {formatDate(factura.fecha_llegada)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Incoterm">
                    {factura.incoterm_nombre || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Medio Transporte">
                    {factura.medio_transporte_nombre || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Aduana">
                    {factura.aduana_nombre || '-'}
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>
          </Card>

          {/* Información Bancaria */}
          {(factura.banco_nombre || factura.cuenta_bancaria) && (
            <Card 
              title={
                <Space>
                  <BankOutlined />
                  <span>Información Bancaria</span>
                </Space>
              }
              bordered={false}
              style={{ marginBottom: 24 }}
              size="small"
            >
              <Descriptions column={1} size="small">
                {factura.banco_nombre && (
                  <Descriptions.Item label="Banco">
                    {factura.banco_nombre}
                  </Descriptions.Item>
                )}
                {factura.cuenta_bancaria && (
                  <Descriptions.Item label="Cuenta Bancaria">
                    {factura.cuenta_bancaria}
                  </Descriptions.Item>
                )}
                {factura.cuenta_interbancaria && (
                  <Descriptions.Item label="Cuenta Interbancaria">
                    {factura.cuenta_interbancaria}
                  </Descriptions.Item>
                )}
                {factura.swift && (
                  <Descriptions.Item label="SWIFT">
                    {factura.swift}
                  </Descriptions.Item>
                )}
                {factura.direccion_banco && (
                  <Descriptions.Item label="Dirección Banco">
                    {factura.direccion_banco}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          )}
        </Col>

        {/* Columna Derecha - Información Financiera */}
        <Col span={12}>
          {/* Resumen Financiero */}
          <Card 
            title={
              <Space>
                <DollarOutlined />
                <span>Resumen Financiero</span>
              </Space>
            }
            bordered={false}
            style={{ marginBottom: 24 }}
            size="small"
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Moneda">
                <Tag color={factura.moneda_codigo === 'PEN' ? 'green' : 'blue'}>
                  {factura.moneda_nombre} ({factura.moneda_codigo})
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Forma de Pago">
                {factura.forma_pago_nombre || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Tipo de Cambio">
                {factura.tipo_cambio ? `S/ ${factura.tipo_cambio}` : '-'}
              </Descriptions.Item>
              
              <Divider style={{ margin: '12px 0' }} />
              
              <Descriptions.Item label="Subtotal">
                <Text strong>{formatCurrency(factura.subtotal, factura.moneda_codigo)}</Text>
              </Descriptions.Item>
              
              {factura.tipo_compra === 'LOCAL' && factura.igv > 0 && (
                <Descriptions.Item label="IGV (18%)">
                  <Text strong>{formatCurrency(factura.igv, factura.moneda_codigo)}</Text>
                </Descriptions.Item>
              )}
              
              <Descriptions.Item label="Total">
                <Text strong type="success" style={{ fontSize: '16px' }}>
                  {formatCurrency(factura.total, factura.moneda_codigo)}
                </Text>
              </Descriptions.Item>

              {/* Campos específicos para EXTERNO */}
              {factura.tipo_compra === 'EXTERNO' && (
                <>
                  <Divider style={{ margin: '12px 0' }} />
                  <Descriptions.Item label="Importe FOB">
                    {formatCurrency(factura.importe_fob, 'USD')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Flete">
                    {formatCurrency(factura.flete, 'USD')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Seguro">
                    {formatCurrency(factura.seguro, 'USD')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Otros Gastos">
                    {formatCurrency(factura.otros_gastos, 'USD')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Importe CIF">
                    {formatCurrency(factura.importe_cif, 'USD')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Importe Moneda Proveedor">
                    {formatCurrency(factura.importe_moneda_prov, 'USD')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Importe en Soles">
                    <Text strong>{formatCurrency(factura.importe_soles)}</Text>
                  </Descriptions.Item>
                </>
              )}

              {/* Campos específicos para LOCAL */}
              {factura.tipo_compra === 'LOCAL' && (
                <>
                  {(factura.detraccion > 0 || factura.retencion > 0) && (
                    <>
                      <Divider style={{ margin: '12px 0' }} />
                      {factura.detraccion > 0 && (
                        <Descriptions.Item label="Detracción">
                          {formatCurrency(factura.detraccion, factura.moneda_codigo)}
                        </Descriptions.Item>
                      )}
                      {factura.retencion > 0 && (
                        <Descriptions.Item label="Retención">
                          {formatCurrency(factura.retencion, factura.moneda_codigo)}
                        </Descriptions.Item>
                      )}
                    </>
                  )}
                </>
              )}
            </Descriptions>
          </Card>

          {/* Información Adicional */}
          <Card 
            title={
              <Space>
                <GlobalOutlined />
                <span>Información Adicional</span>
              </Space>
            }
            bordered={false}
            size="small"
          >
            <Descriptions column={1} size="small">
              {factura.comentario && (
                <Descriptions.Item label="Comentarios">
                  {factura.comentario}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Fecha de Registro">
                {formatDate(factura.fecha_registro)}
              </Descriptions.Item>
              {factura.updated_at && (
                <Descriptions.Item label="Última Actualización">
                  {formatDate(factura.updated_at)}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* Tabla de Items */}
      <Card 
        title={
          <Space>
            <ShoppingOutlined />
            <span>Detalle de Productos</span>
            <Tag>{factura.items?.length || 0} items</Tag>
          </Space>
        }
        bordered={false}
        style={{ marginTop: 16 }}
      >
        <Table
          columns={columnsItems}
          dataSource={factura.items || []}
          rowKey="id"
          pagination={false}
          size="small"
          scroll={{ x: 800 }}
          summary={() => (
            <Table.Summary>
              <Table.Summary.Row style={{ background: '#fafafa' }}>
                <Table.Summary.Cell index={0} colSpan={5} align="right">
                  <Text strong>TOTAL GENERAL:</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <Text strong>
                    {formatCurrency(
                      factura.items?.reduce((sum, item) => sum + (item.valor_venta || 0), 0),
                      factura.moneda_codigo
                    )}
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <Text strong>
                    {formatCurrency(
                      factura.items?.reduce((sum, item) => sum + (item.igv || 0), 0),
                      factura.moneda_codigo
                    )}
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  <Text strong type="success">
                    {formatCurrency(
                      factura.items?.reduce((sum, item) => sum + (item.precio_total || 0), 0),
                      factura.moneda_codigo
                    )}
                  </Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>
    </Modal>
  );
};

export default FacturaDetalles;