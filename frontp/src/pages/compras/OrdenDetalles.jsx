import React, { useState, useEffect } from 'react';
import { Descriptions, Card, Table, Tag, Spin, message, Button, Row, Col, Statistic, Divider } from 'antd';
import { FilePdfOutlined, ShoppingOutlined, CheckCircleOutlined, UserOutlined, EnvironmentOutlined, CalendarOutlined, DollarOutlined, TagOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../api/api';

const OrdenDetalles = ({ orden }) => {
  const [loading, setLoading] = useState(false);
  const [ordenCompleta, setOrdenCompleta] = useState(null);
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    if (orden) {
      cargarDetallesCompletos();
    }
  }, [orden]);

  const cargarDetallesCompletos = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/compras/ordenes-compra/${orden.id}/detalles`);
      const data = response.data;

      // Si es EXTERNO, asegurar que IGV = 0 y total = sub_total si viniera nulo
      if (data.tipo === 'EXTERNO') {
        data.igv = data.igv || 0;
        data.total = data.total || data.sub_total;
      }

      setOrdenCompleta(data);
    } catch (error) {
      message.error('Error al cargar los detalles de la orden');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const estados = {
    PENDIENTE: { color: 'orange', text: 'Pendiente', icon: <ClockCircleOutlined /> },
    APROBADA: { color: 'blue', text: 'Aprobada', icon: <CheckCircleOutlined /> },
    RECHAZADA: { color: 'red', text: 'Rechazada', icon: <CloseCircleOutlined /> },
    PARCIAL: { color: 'purple', text: 'Parcial', icon: <ExclamationCircleOutlined /> },
    COMPLETADA: { color: 'green', text: 'Completada', icon: <CheckCircleOutlined /> },
    CANCELADA: { color: 'default', text: 'Cancelada', icon: <CloseCircleOutlined /> }
  };

  // Función para exportar PDF
  const exportarPDF = async () => {
    if (!ordenCompleta?.id) return;
    setExportando(true);

    try {
      const response = await api.get(`/compras/ordenes-compra/${ordenCompleta.id}/pdf`, {
        responseType: 'blob'
      });

      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      message.error('No se pudo generar el PDF');
    } finally {
      setExportando(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Cargando detalles...</div>
      </div>
    );
  }

  if (!ordenCompleta) {
    return <div>No se encontraron detalles de la orden</div>;
  }

  // Columnas de la tabla de productos
  const columnasItems = [
    {
      title: 'Item',
      dataIndex: 'numitem',
      key: 'numitem',
      width: 60,
      align: 'center'
    },
    {
      title: 'Requerimiento',
      key: 'requerimiento',
      width: 150,
      render: (_, record) => (
        <span>
          {record.requerimiento_codigo?.trim() || 'DOC'}-{record.requerimiento_numero || '---'}
        </span>
      )
    },
    {
      title: 'Producto',
      dataIndex: 'producto_descripcion',
      key: 'producto_descripcion',
      ellipsis: true
    },
    {
      title: 'Cant. Solicitada',
      dataIndex: 'cantidad_solicitada',
      key: 'cantidad_solicitada',
      width: 120,
      align: 'right',
      render: (text) => parseFloat(text).toFixed(3)
    },
    {
      title: 'Cant. Recibida',
      dataIndex: 'cantidad_recibida',
      key: 'cantidad_recibida',
      width: 120,
      align: 'right',
      render: (text, record) => (
        <span style={{ 
          color: parseFloat(text || 0) >= parseFloat(record.cantidad_solicitada) ? '#52c41a' : '#faad14',
          fontWeight: '500'
        }}>
          {parseFloat(text || 0).toFixed(3)}
        </span>
      )
    },
    {
      title: 'Pendiente',
      key: 'cantidad_pendiente',
      width: 120,
      align: 'right',
      render: (_, record) => {
        const pendiente = parseFloat(record.cantidad_solicitada) - parseFloat(record.cantidad_recibida || 0);
        return (
          <span style={{ 
            color: pendiente <= 0 ? '#52c41a' : '#ff4d4f',
            fontWeight: '500'
          }}>
            {pendiente.toFixed(3)}
          </span>
        );
      }
    },
    {
      title: 'Precio Unit.',
      dataIndex: 'precio_unitario',
      key: 'precio_unitario',
      width: 110,
      align: 'right',
      render: (text) => `${ordenCompleta.moneda_simbolo} ${parseFloat(text).toFixed(2)}`
    },
    {
      title: 'Desc. %',
      dataIndex: 'descuento_porcentaje',
      key: 'descuento_porcentaje',
      width: 90,
      align: 'right',
      render: (text) => `${parseFloat(text).toFixed(2)}%`
    },
    {
      title: 'Valor Venta',
      dataIndex: 'valor_venta',
      key: 'valor_venta',
      width: 120,
      align: 'right',
      render: (text) => `${ordenCompleta.moneda_simbolo} ${parseFloat(text).toFixed(2)}`
    },
    ...(ordenCompleta.tipo === 'LOCAL' ? [{
      title: 'IGV',
      dataIndex: 'igv',
      key: 'igv',
      width: 110,
      align: 'right',
      render: (text) => `${ordenCompleta.moneda_simbolo} ${parseFloat(text).toFixed(2)}`
    }] : []),
    {
      title: 'Total',
      key: 'total',
      width: 120,
      align: 'right',
      render: (_, record) => {
        let totalItem;
        if (ordenCompleta.tipo === 'LOCAL') {
          totalItem = record.precio_total ?? record.valor_venta ?? 0;
        } else {
          totalItem = record.valor_venta ?? 0;
        }
        return (
          <strong>
            {ordenCompleta.moneda_simbolo} {parseFloat(totalItem).toFixed(2)}
          </strong>
        );
      }
    }
  ];

  // Calcular estadísticas de cantidades
  const estadisticasCantidades = ordenCompleta.detalles?.reduce((acc, item) => {
    const solicitada = parseFloat(item.cantidad_solicitada);
    const recibida = parseFloat(item.cantidad_recibida || 0);
    const pendiente = solicitada - recibida;
    
    return {
      totalSolicitada: acc.totalSolicitada + solicitada,
      totalRecibida: acc.totalRecibida + recibida,
      totalPendiente: acc.totalPendiente + pendiente,
      itemsCompletos: acc.itemsCompletos + (pendiente <= 0 ? 1 : 0)
    };
  }, { totalSolicitada: 0, totalRecibida: 0, totalPendiente: 0, itemsCompletos: 0 });

  const porcentajeCompletado = estadisticasCantidades ? 
    (estadisticasCantidades.totalRecibida / estadisticasCantidades.totalSolicitada) * 100 : 0;

  return (
    <div style={{ padding: '8px' }}>
      {/* Header con información principal */}
      <Card 
        size="small" 
        style={{ marginBottom: 16, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}
      >
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                background: '#1890ff', 
                borderRadius: '8px', 
                padding: '8px', 
                color: 'white',
                display: 'flex',
                alignItems: 'center'
              }}>
                <ShoppingOutlined style={{ fontSize: '20px' }} />
              </div>
              <div>
                <h2 style={{ margin: 0, color: '#262626' }}>
                  Orden de Compra {(ordenCompleta.documento_codigo?.trim() || 'DOC') + ' - ' + ordenCompleta.numero}
                </h2>
                <p style={{ margin: 0, color: '#595959' }}>
                  Proveedor: {ordenCompleta.proveedor_nombre}
                </p>
              </div>
            </div>
          </Col>
          <Col>
            <Tag 
              color={estados[ordenCompleta.estado]?.color} 
              style={{ 
                padding: '4px 8px', 
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {estados[ordenCompleta.estado]?.icon}
              {estados[ordenCompleta.estado]?.text || ordenCompleta.estado}
            </Tag>
          </Col>
        </Row>
      </Card>

      {/* Estadísticas rápidas */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Total Orden"
              value={ordenCompleta.tipo === 'LOCAL' ? 
                parseFloat(ordenCompleta.total || ordenCompleta.sub_total || 0) : 
                parseFloat(ordenCompleta.sub_total || 0)}
              precision={2}
              prefix={ordenCompleta.moneda_simbolo}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Avance Recepción"
              value={porcentajeCompletado}
              precision={1}
              suffix="%"
              valueStyle={{ color: porcentajeCompletado >= 100 ? '#52c41a' : '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Items Completados"
              value={estadisticasCantidades?.itemsCompletos || 0}
              suffix={`/ ${ordenCompleta.detalles?.length || 0}`}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Tipo"
              value={ordenCompleta.tipo === 'LOCAL' ? 'Local' : 'Externo'}
              valueStyle={{ color: ordenCompleta.tipo === 'LOCAL' ? '#1890ff' : '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Información detallada */}
      <Card 
        title={
          <span>
            <UserOutlined style={{ marginRight: 8 }} />
            Información General
          </span>
        } 
        size="small" 
        style={{ marginBottom: 16 }}
      >
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Proveedor" span={2}>
            <div>
              <strong>{ordenCompleta.proveedor_nombre}</strong>
              <div style={{ color: '#595959', fontSize: '12px' }}>
                RUC/DNI: {ordenCompleta.proveedor_num_doc}
              </div>
            </div>
          </Descriptions.Item>
          <Descriptions.Item label={
            <span>
              <EnvironmentOutlined style={{ marginRight: 4 }} />
              Dirección Proveedor
            </span>
          }>
            {ordenCompleta.proveedor_direccion || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Lugar de Entrega">
            {ordenCompleta.lugar_entrega_direccion || '-'}
          </Descriptions.Item>
          <Descriptions.Item label={
            <span>
              <CalendarOutlined style={{ marginRight: 4 }} />
              Fecha Emisión
            </span>
          }>
            {dayjs(ordenCompleta.fecha).format('DD/MM/YYYY')}
          </Descriptions.Item>
          <Descriptions.Item label="Fecha Entrega Prevista">
            {dayjs(ordenCompleta.fecha_entrega_prevista).format('DD/MM/YYYY')}
          </Descriptions.Item>
          <Descriptions.Item label={
            <span>
              <DollarOutlined style={{ marginRight: 4 }} />
              Moneda
            </span>
          }>
            {ordenCompleta.moneda_nombre} ({ordenCompleta.moneda_simbolo})
          </Descriptions.Item>
          <Descriptions.Item label="Forma de Pago">
            {ordenCompleta.forma_pago_desc}
          </Descriptions.Item>
          {ordenCompleta.observaciones && (
            <Descriptions.Item label="Observaciones" span={2}>
              {ordenCompleta.observaciones}
            </Descriptions.Item>
          )}
          {ordenCompleta.tipo === 'EXTERNO' && (
            <>
              <Descriptions.Item label="Aduana">{ordenCompleta.aduana_nombre || '-'}</Descriptions.Item>
              <Descriptions.Item label="Incoterm">{ordenCompleta.incoterm_nombre || '-'}</Descriptions.Item>
              <Descriptions.Item label="Transporte">{ordenCompleta.medio_transporte_nombre || '-'}</Descriptions.Item>
            </>
          )}
        </Descriptions>
      </Card>

      {/* Resumen financiero */}
      <Card 
        title={
          <span>
            <DollarOutlined style={{ marginRight: 8 }} />
            Resumen Financiero
          </span>
        } 
        size="small" 
        style={{ marginBottom: 16 }}
      >
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="Subtotal"
              value={parseFloat(ordenCompleta.sub_total || 0)}
              precision={2}
              prefix={ordenCompleta.moneda_simbolo}
            />
          </Col>
          {ordenCompleta.tipo === 'LOCAL' && (
            <Col span={8}>
              <Statistic
                title="IGV"
                value={parseFloat(ordenCompleta.igv || 0)}
                precision={2}
                prefix={ordenCompleta.moneda_simbolo}
              />
            </Col>
          )}
          <Col span={8}>
            <Statistic
              title="Total"
              value={ordenCompleta.tipo === 'LOCAL' ? 
                parseFloat(ordenCompleta.total || ordenCompleta.sub_total || 0) : 
                parseFloat(ordenCompleta.sub_total || 0)}
              precision={2}
              prefix={ordenCompleta.moneda_simbolo}
              valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
            />
          </Col>
        </Row>
      </Card>

      {/* Tabla de productos */}
      <Card 
        title={
          <span>
            <TagOutlined style={{ marginRight: 8 }} />
            Productos ({ordenCompleta.detalles?.length || 0} items)
          </span>
        } 
        size="small"
      >
        <Table
          columns={columnasItems}
          dataSource={ordenCompleta.detalles}
          pagination={false}
          rowKey="id"
          scroll={{ x: 1200 }}
          size="small"
          summary={() => {
            const igvResumen = ordenCompleta.tipo === 'LOCAL'
              ? parseFloat(ordenCompleta.igv || 0)
              : 0;
            const totalResumen = ordenCompleta.tipo === 'LOCAL'
              ? parseFloat(ordenCompleta.total || 0)
              : parseFloat(ordenCompleta.sub_total || 0);

            const descuentoTotal = ordenCompleta.detalles?.reduce((total, item) => {
              const precioSinDescuento = parseFloat(item.precio_unitario) * parseFloat(item.cantidad_solicitada);
              const valorVenta = parseFloat(item.valor_venta);
              return total + (precioSinDescuento - valorVenta);
            }, 0) || 0;

            return (
              <Table.Summary>
                <Table.Summary.Row style={{ background: '#fafafa' }}>
                  <Table.Summary.Cell index={0} colSpan={3} align="right">
                    <strong>Totales Generales</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <strong>{estadisticasCantidades?.totalSolicitada.toFixed(3)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right">
                    <strong style={{ color: '#52c41a' }}>
                      {estadisticasCantidades?.totalRecibida.toFixed(3)}
                    </strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right">
                    <strong style={{ color: '#ff4d4f' }}>
                      {estadisticasCantidades?.totalPendiente.toFixed(3)}
                    </strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} colSpan={2} align="right">
                    <strong>Desc. {ordenCompleta.moneda_simbolo} {descuentoTotal.toFixed(2)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} align="right">
                    <strong>{ordenCompleta.moneda_simbolo} {parseFloat(ordenCompleta.sub_total || 0).toFixed(2)}</strong>
                  </Table.Summary.Cell>
                  {ordenCompleta.tipo === 'LOCAL' && (
                    <Table.Summary.Cell index={6} align="right">
                      <strong>
                        {ordenCompleta.moneda_simbolo} {igvResumen.toFixed(2)}
                      </strong>
                    </Table.Summary.Cell>
                  )}
                  <Table.Summary.Cell index={7} align="right">
                    <strong style={{ color: '#1890ff' }}>
                      {ordenCompleta.moneda_simbolo} {totalResumen.toFixed(2)}
                    </strong>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            );
          }}
        />
      </Card>

      {/* Botón de exportación */}
      <div style={{ textAlign: 'right', marginTop: '20px' }}>
        <Button
          type="primary"
          icon={<FilePdfOutlined />}
          onClick={exportarPDF}
          loading={exportando}
          size="large"
        >
          Exportar PDF
        </Button>
      </div>
    </div>
  );
};

// Iconos adicionales necesarios
const ClockCircleOutlined = () => <span>⏰</span>;
const CloseCircleOutlined = () => <span>❌</span>;
const ExclamationCircleOutlined = () => <span>⚠️</span>;

export default OrdenDetalles;