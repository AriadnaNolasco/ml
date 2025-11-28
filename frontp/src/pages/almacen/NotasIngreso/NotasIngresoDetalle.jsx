import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Table,
  Tag,
  Button,
  Space,
  Row,
  Col,
  Typography,
  Spin,
  message,
  Divider
} from 'antd';
import {
  ArrowLeftOutlined,
  FileTextOutlined,
  ShopOutlined,
  FileProtectOutlined,
  InboxOutlined,
  CommentOutlined,
  CalendarOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../../api/api';

const { Title, Text } = Typography;

const NotasIngresoDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nota, setNota] = useState(null);
  const [loading, setLoading] = useState(true);

  const estados = {
    BORRADOR: { color: 'orange', text: 'Borrador', icon: <WarningOutlined /> },
    CONFIRMADA: { color: 'green', text: 'Confirmada', icon: <CheckCircleOutlined /> },
    ANULADA: { color: 'red', text: 'Anulada', icon: <CloseCircleOutlined /> }
  };

  useEffect(() => {
    fetchNotaDetalle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchNotaDetalle = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/almacen/notas-ingreso/${id}`);
      setNota(response.data);
    } catch (error) {
      message.error('Error al cargar el detalle de la nota de ingreso');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerarPDF = async () => {
    try {
      const response = await api.get(`/almacen/notas-ingreso/${id}/pdf`, {
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

  const handleVolver = () => {
    navigate('/almacen/notas-ingreso');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return dayjs(dateString).format('DD/MM/YYYY');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return dayjs(dateString).format('DD/MM/YYYY HH:mm');
  };

  const columnasProductos = [
    {
      title: 'Item',
      dataIndex: 'numitem',
      key: 'numitem',
      width: 60,
      align: 'center'
    },
    {
      title: 'Código',
      dataIndex: 'producto_codigo',
      key: 'producto_codigo',
      width: 120
    },
    {
      title: 'Descripción',
      dataIndex: 'producto_descripcion',
      key: 'producto_descripcion',
      ellipsis: true
    },
    {
      title: 'UM',
      dataIndex: 'producto_unidad',
      key: 'producto_unidad',
      width: 80,
      align: 'center'
    },
    {
      title: 'Almacén',
      dataIndex: 'almacen_nombre',
      key: 'almacen_nombre',
      width: 150
    },
    {
      title: 'Cant. Ingresada',
      dataIndex: 'cantidad_ingresada',
      key: 'cantidad_ingresada',
      width: 120,
      align: 'right',
      render: (value) => value ? Number(value).toFixed(3) : '0.000'
    },
    {
      title: 'Cant. Conforme',
      dataIndex: 'cantidad_conforme',
      key: 'cantidad_conforme',
      width: 120,
      align: 'right',
      render: (value) => (
        <Text style={{ color: '#52c41a', fontWeight: '600' }}>
          {value ? Number(value).toFixed(3) : '0.000'}
        </Text>
      )
    },
    {
      title: 'Cant. No Conforme',
      dataIndex: 'cantidad_no_conforme',
      key: 'cantidad_no_conforme',
      width: 140,
      align: 'right',
      render: (value) => (
        value > 0 ? (
          <Text style={{ color: '#cf1322', fontWeight: '600' }}>
            {Number(value).toFixed(3)}
          </Text>
        ) : (
          <Text style={{ color: '#999' }}>0.000</Text>
        )
      )
    },
    {
      title: 'Estado',
      dataIndex: 'estado_calidad',
      key: 'estado_calidad',
      width: 120,
      render: (estado) => {
        const colores = {
          CONFORME: 'green',
          NO_CONFORME: 'red',
          OBSERVADO: 'orange'
        };
        return (
          <Tag color={colores[estado] || 'default'}>
            {estado || 'N/A'}
          </Tag>
        );
      }
    }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!nota) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <Text>No se encontró la nota de ingreso</Text>
          <div style={{ marginTop: '16px' }}>
            <Button onClick={handleVolver}>Volver al listado</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header con información principal */}
      <Card 
        style={{ 
          marginBottom: 20, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          color: 'white'
        }}
        bodyStyle={{ padding: '20px' }}
      >
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Title level={3} style={{ color: 'white', margin: 0, fontSize: '24px' }}>
              {nota.numero}
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
              {nota.tipo === 'LOCAL' ? 'Nota de Ingreso Compra Local' : 'Nota de Ingreso Compra Exterior'}
            </Text>
            <div style={{ marginTop: 8 }}>
              <Tag 
                color={estados[nota.estado]?.color || 'default'} 
                style={{ 
                  border: 'none', 
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: 'white'
                }}
                icon={estados[nota.estado]?.icon}
              >
                {estados[nota.estado]?.text || nota.estado}
              </Tag>
              <Tag 
                style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  border: 'none', 
                  color: 'white',
                  fontSize: '12px',
                  marginLeft: 8
                }}
              >
                {nota.tipo === 'LOCAL' ? 'LOCAL' : 'EXTERIOR'}
              </Tag>
            </div>
          </Col>
          <Col>
            <Space>
              {nota.estado === 'CONFIRMADA' && (
                <Button
                  type="primary"
                  icon={<FileTextOutlined />}
                  onClick={handleGenerarPDF}
                  style={{ background: 'rgba(255,255,255,0.2)', border: 'none' }}
                >
                  Generar PDF
                </Button>
              )}
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={handleVolver}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white' }}
              >
                Volver
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={16}>
        {/* Columna izquierda */}
        <Col span={12}>
          {/* Datos Generales */}
          <Card 
            size="small" 
            style={{ marginBottom: 16, borderRadius: 8 }}
            title={
              <span style={{ fontSize: '14px', fontWeight: '600' }}>
                <FileProtectOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                Datos Generales
              </span>
            }
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Número" labelStyle={{ fontWeight: '600', width: '140px' }}>
                <Text strong style={{ fontSize: '13px' }}>{nota.numero}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Tipo Documento" labelStyle={{ fontWeight: '600', width: '140px' }}>
                {nota.tipo === 'LOCAL' ? 'NIC - Nota Ingreso Compra Local' : 'NIE - Nota Ingreso Compra Exterior'}
              </Descriptions.Item>
              <Descriptions.Item label="Fecha Ingreso" labelStyle={{ fontWeight: '600', width: '140px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CalendarOutlined style={{ color: '#52c41a' }} />
                  {formatDate(nota.fecha_ingreso)}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="Orden de Compra" labelStyle={{ fontWeight: '600', width: '140px' }}>
                <Text strong style={{ color: '#1890ff' }}>
                  {nota.orden_compra_numero || 'N/A'}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Estado OC" labelStyle={{ fontWeight: '600', width: '140px' }}>
                <Tag color={nota.orden_compra_estado === 'ENTREGADA' ? 'green' : 'orange'}>
                  {nota.orden_compra_estado || 'N/A'}
                </Tag>
              </Descriptions.Item>
              {nota.recibido_por_nombre && (
                <Descriptions.Item label="Recibido Por" labelStyle={{ fontWeight: '600', width: '140px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <UserOutlined style={{ color: '#722ed1' }} />
                    {nota.recibido_por_nombre}
                  </div>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* Datos del Proveedor */}
          <Card 
            size="small" 
            style={{ marginBottom: 16, borderRadius: 8 }}
            title={
              <span style={{ fontSize: '14px', fontWeight: '600' }}>
                <ShopOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                Datos del Proveedor
              </span>
            }
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label={nota.tipo === 'LOCAL' ? 'RUC' : 'Tax ID'} labelStyle={{ fontWeight: '600', width: '140px' }}>
                <Text strong>{nota.proveedor_documento || 'N/A'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Razón Social" labelStyle={{ fontWeight: '600', width: '140px' }}>
                {nota.proveedor_nombre || 'N/A'}
              </Descriptions.Item>
              {nota.proveedor_direccion && (
                <Descriptions.Item label="Dirección" labelStyle={{ fontWeight: '600', width: '140px' }}>
                  {nota.proveedor_direccion}
                </Descriptions.Item>
              )}
              {nota.proveedor_telefono && (
                <Descriptions.Item label="Teléfono" labelStyle={{ fontWeight: '600', width: '140px' }}>
                  {nota.proveedor_telefono}
                </Descriptions.Item>
              )}
              {nota.tipo === 'EXTERNO' && nota.proveedor_pais && (
                <Descriptions.Item label="País" labelStyle={{ fontWeight: '600', width: '140px' }}>
                  {nota.proveedor_pais}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>

        {/* Columna derecha */}
        <Col span={12}>
          {/* Documentos de Recepción */}
          <Card 
            size="small" 
            style={{ marginBottom: 16, borderRadius: 8 }}
            title={
              <span style={{ fontSize: '14px', fontWeight: '600' }}>
                <FileTextOutlined style={{ marginRight: 8, color: '#fa8c16' }} />
                Documentos de Recepción
              </span>
            }
          >
            {nota.tipo === 'LOCAL' ? (
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Guía de Remisión" labelStyle={{ fontWeight: '600', width: '140px' }}>
                  <Text strong>
                    {nota.guia_remision_serie && nota.guia_remision_numero
                      ? `${nota.guia_remision_serie}-${nota.guia_remision_numero}`
                      : 'N/A'}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Factura" labelStyle={{ fontWeight: '600', width: '140px' }}>
                  {nota.factura_serie && nota.factura_numero
                    ? `${nota.factura_serie}-${nota.factura_numero}`
                    : 'N/A'}
                </Descriptions.Item>
                {nota.transportista_nombre && (
                  <Descriptions.Item label="Transportista" labelStyle={{ fontWeight: '600', width: '140px' }}>
                    {nota.transportista_nombre}
                  </Descriptions.Item>
                )}
              </Descriptions>
            ) : (
              <Descriptions column={1} size="small">
                <Descriptions.Item label="DUA/DSI" labelStyle={{ fontWeight: '600', width: '140px' }}>
                  <Text strong>
                    {nota.dua_serie && nota.dua_numero
                      ? `${nota.dua_serie}-${nota.dua_numero}`
                      : 'N/A'}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Fecha Llegada" labelStyle={{ fontWeight: '600', width: '140px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CalendarOutlined style={{ color: '#52c41a' }} />
                    {formatDate(nota.fecha_llegada)}
                  </div>
                </Descriptions.Item>
                {nota.aduana_nombre && (
                  <Descriptions.Item label="Aduana" labelStyle={{ fontWeight: '600', width: '140px' }}>
                    {nota.aduana_nombre}
                  </Descriptions.Item>
                )}
                {nota.incoterm_codigo && (
                  <Descriptions.Item label="Incoterm" labelStyle={{ fontWeight: '600', width: '140px' }}>
                    {nota.incoterm_codigo}
                  </Descriptions.Item>
                )}
                {nota.medio_transporte_nombre && (
                  <Descriptions.Item label="Medio Transporte" labelStyle={{ fontWeight: '600', width: '140px' }}>
                    {nota.medio_transporte_nombre}
                  </Descriptions.Item>
                )}
                {nota.invoice && (
                  <Descriptions.Item label="Invoice" labelStyle={{ fontWeight: '600', width: '140px' }}>
                    {nota.invoice}
                  </Descriptions.Item>
                )}
                {nota.packing_list && (
                  <Descriptions.Item label="Packing List" labelStyle={{ fontWeight: '600', width: '140px' }}>
                    {nota.packing_list}
                  </Descriptions.Item>
                )}
                {nota.bill_of_lading && (
                  <Descriptions.Item label="Bill of Lading" labelStyle={{ fontWeight: '600', width: '140px' }}>
                    {nota.bill_of_lading}
                  </Descriptions.Item>
                )}
                {nota.nro_contenedor && (
                  <Descriptions.Item label="N° Contenedor" labelStyle={{ fontWeight: '600', width: '140px' }}>
                    {nota.nro_contenedor}
                  </Descriptions.Item>
                )}
                {nota.agente_aduanas && (
                  <Descriptions.Item label="Agente Aduanas" labelStyle={{ fontWeight: '600', width: '140px' }}>
                    {nota.agente_aduanas}
                  </Descriptions.Item>
                )}
              </Descriptions>
            )}
          </Card>

          {/* Información de Auditoría */}
          <Card 
            size="small" 
            style={{ borderRadius: 8 }}
            title={
              <span style={{ fontSize: '14px', fontWeight: '600' }}>
                <UserOutlined style={{ marginRight: 8, color: '#722ed1' }} />
                Información de Auditoría
              </span>
            }
          >
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ marginBottom: 12 }}>
                  <Text strong style={{ fontSize: '11px', color: '#666', display: 'block' }}>Creado Por</Text>
                  <div style={{ fontSize: '12px', fontWeight: '500' }}>
                    {nota.creado_por_nombre || 'N/A'}
                  </div>
                  <Text style={{ fontSize: '10px', color: '#999' }}>
                    {formatDateTime(nota.created_at)}
                  </Text>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 12 }}>
                  <Text strong style={{ fontSize: '11px', color: '#666', display: 'block' }}>Actualizado Por</Text>
                  <div style={{ fontSize: '12px', fontWeight: '500' }}>
                    {nota.actualizado_por_nombre || 'N/A'}
                  </div>
                  <Text style={{ fontSize: '10px', color: '#999' }}>
                    {formatDateTime(nota.updated_at)}
                  </Text>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Productos */}
      <Card 
        style={{ marginTop: 16, borderRadius: 8 }}
        title={
          <span style={{ fontSize: '14px', fontWeight: '600' }}>
            <InboxOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            Productos Ingresados ({nota.detalle?.length || 0})
          </span>
        }
      >
        <Table
          columns={columnasProductos}
          dataSource={nota.detalle || []}
          rowKey="id"
          pagination={false}
          scroll={{ x: 1200 }}
          size="small"
          expandable={{
            expandedRowRender: (record) => {
              if (!record.ubicacion_fisica && !record.lote && !record.fecha_vencimiento && 
                  !record.motivo_rechazo && !record.observaciones) {
                return null;
              }
              return (
                <div style={{ padding: '8px 16px', background: '#fafafa' }}>
                  <Row gutter={16}>
                    {record.ubicacion_fisica && (
                      <Col span={6}>
                        <Text strong style={{ fontSize: '11px', color: '#666' }}>Ubicación Física:</Text>
                        <div style={{ fontSize: '12px' }}>{record.ubicacion_fisica}</div>
                      </Col>
                    )}
                    {record.lote && (
                      <Col span={6}>
                        <Text strong style={{ fontSize: '11px', color: '#666' }}>Lote:</Text>
                        <div style={{ fontSize: '12px' }}>{record.lote}</div>
                      </Col>
                    )}
                    {record.fecha_vencimiento && (
                      <Col span={6}>
                        <Text strong style={{ fontSize: '11px', color: '#666' }}>Fecha Vencimiento:</Text>
                        <div style={{ fontSize: '12px' }}>{formatDate(record.fecha_vencimiento)}</div>
                      </Col>
                    )}
                    {record.cantidad_no_conforme > 0 && record.almacen_no_conforme_nombre && (
                      <Col span={6}>
                        <Text strong style={{ fontSize: '11px', color: '#666' }}>Almacén No Conforme:</Text>
                        <div style={{ fontSize: '12px' }}>{record.almacen_no_conforme_nombre}</div>
                      </Col>
                    )}
                  </Row>
                  {record.motivo_rechazo && (
                    <div style={{ marginTop: 8 }}>
                      <Text strong style={{ fontSize: '11px', color: '#666' }}>Motivo Rechazo:</Text>
                      <div style={{ fontSize: '12px', color: '#cf1322' }}>{record.motivo_rechazo}</div>
                    </div>
                  )}
                  {record.observaciones && (
                    <div style={{ marginTop: 8 }}>
                      <Text strong style={{ fontSize: '11px', color: '#666' }}>Observaciones:</Text>
                      <div style={{ fontSize: '12px' }}>{record.observaciones}</div>
                    </div>
                  )}
                </div>
              );
            },
            rowExpandable: (record) => 
              record.ubicacion_fisica || record.lote || record.fecha_vencimiento || 
              record.motivo_rechazo || record.observaciones
          }}
        />
      </Card>

      {/* Observaciones */}
      {nota.observaciones && (
        <Card 
          style={{ marginTop: 16, borderRadius: 8 }}
          title={
            <span style={{ fontSize: '14px', fontWeight: '600' }}>
              <CommentOutlined style={{ marginRight: 8, color: '#fa8c16' }} />
              Observaciones
            </span>
          }
        >
          <Text>{nota.observaciones}</Text>
        </Card>
      )}
    </div>
  );
};

export default NotasIngresoDetalle;
