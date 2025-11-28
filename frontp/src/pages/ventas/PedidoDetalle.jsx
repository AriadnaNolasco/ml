// PedidoDetalle.jsx (VERSIÓN COMPLETAMENTE CORREGIDA)
import React from "react";
import { Card, Row, Col, Table, Tag, Descriptions, Divider, Space, Alert } from "antd";
import {
  UserOutlined,
  FileTextOutlined,
  CalendarOutlined,
  DollarOutlined,
  ExclamationCircleOutlined
} from "@ant-design/icons";

const PedidoDetalle = ({ pedido }) => {
  if (!pedido) {
    return (
      <Alert
        message="No hay datos del pedido"
        description="El pedido solicitado no existe o no se pudo cargar."
        type="warning"
        showIcon
      />
    );
  }

  console.log("📋 Datos del pedido recibidos:", pedido);
  console.log("📦 Detalles del pedido:", pedido.detalles);

  const formatCurrency = (amount) => {
    return `S/ ${parseFloat(amount || 0).toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("es-PE");
    } catch (error) {
      return "-";
    }
  };

  // Normalizar los detalles para asegurar que todos los campos existan
  const detallesNormalizados = Array.isArray(pedido.detalles) 
    ? pedido.detalles.map((detalle, index) => ({
        key: detalle.id_detalle_pedido || `detalle-${index}`,
        id_detalle_pedido: detalle.id_detalle_pedido,
        numitem: detalle.numitem || index + 1,
        
        // Campos del producto - CORREGIDOS según la base de datos
        producto_codigo: detalle.producto_codigo || "-",
        producto_descripcion: detalle.descripcion_producto || "-",
        
        // Campos de cantidad
        cantidad_solicitada: parseFloat(detalle.cantidad_solicitada || 0),
        cantidad_despachada: parseFloat(detalle.cantidad_despachada || 0),
        
        // Campos de precios y descuentos
        precio_unitario: parseFloat(detalle.precio_unitario || 0),
        descuento_1: parseFloat(detalle.descuento_1 || 0),
        descuento_2: parseFloat(detalle.descuento_2 || 0),
        descuento_monto: parseFloat(detalle.descuento_monto || 0),
        valor_venta: parseFloat(detalle.valor_venta || 0),
        igv: parseFloat(detalle.igv || 0),
        precio_total: parseFloat(detalle.precio_total || 0),
        
        // Fechas
        fecha_entrega_item: detalle.fecha_entrega_item,
        
        // Unidad de medida
        unidad_medida: detalle.unidad_medida || "UND",
      }))
    : [];

  const columns = [
    {
      title: "#",
      dataIndex: "numitem",
      key: "numitem",
      width: 50,
      align: "center",
      render: (numitem) => <strong>{numitem}</strong>,
    },
    {
      title: "Código",
      dataIndex: "producto_codigo",
      key: "producto_codigo",
      width: 100,
      render: (codigo) => codigo || "-",
    },
    {
      title: "Descripción",
      dataIndex: "producto_descripcion",
      key: "producto_descripcion",
      width: 250,
      render: (descripcion) => descripcion || "-",
    },
    {
      title: "Cant. Solicitada",
      dataIndex: "cantidad_solicitada",
      key: "cantidad_solicitada",
      width: 100,
      align: "right",
      render: (cantidad) => parseFloat(cantidad || 0).toFixed(3),
    },
    {
      title: "Cant. Despachada",
      dataIndex: "cantidad_despachada",
      key: "cantidad_despachada",
      width: 100,
      align: "right",
      render: (cantidad, record) => (
        <span style={{ 
          color: cantidad < record.cantidad_solicitada ? '#ff4d4f' : '#52c41a',
          fontWeight: cantidad < record.cantidad_solicitada ? 'bold' : 'normal'
        }}>
          {parseFloat(cantidad || 0).toFixed(3)}
        </span>
      ),
    },
    {
      title: "P. Unitario",
      dataIndex: "precio_unitario",
      key: "precio_unitario",
      width: 100,
      align: "right",
      render: (precio) => formatCurrency(precio),
    },
    {
      title: "Desc. 1",
      dataIndex: "descuento_1",
      key: "descuento_1",
      width: 80,
      align: "right",
      render: (desc1) => desc1 > 0 ? `${parseFloat(desc1 || 0).toFixed(2)}%` : "-",
    },
    {
      title: "Desc. 2",
      dataIndex: "descuento_2",
      key: "descuento_2",
      width: 80,
      align: "right",
      render: (desc2) => desc2 > 0 ? `${parseFloat(desc2 || 0).toFixed(2)}%` : "-",
    },
    {
      title: "Desc. Monto",
      dataIndex: "descuento_monto",
      key: "descuento_monto",
      width: 100,
      align: "right",
      render: (monto) => monto > 0 ? (
        <span style={{ color: "#ff4d4f" }}>- {formatCurrency(monto)}</span>
      ) : "-",
    },
    {
      title: "Valor Venta",
      dataIndex: "valor_venta",
      key: "valor_venta",
      width: 100,
      align: "right",
      render: (valor) => <strong>{formatCurrency(valor)}</strong>,
    },
    {
      title: "IGV",
      dataIndex: "igv",
      key: "igv",
      width: 90,
      align: "right",
      render: (igv) => formatCurrency(igv),
    },
    {
      title: "Total",
      dataIndex: "precio_total",
      key: "precio_total",
      width: 100,
      align: "right",
      render: (total) => <strong style={{ color: "#1890ff" }}>{formatCurrency(total)}</strong>,
    },
  ];

  const getEstadoColor = (estado) => {
    const colors = {
      PENDIENTE: "orange",
      "EN PREPARACIÓN": "blue",
      DESPACHADO: "green",
      ENTREGADO: "green",
      FACTURADO: "purple",
      ANULADO: "red",
    };
    return colors[estado] || "default";
  };

  const getPrioridadColor = (prioridad) => {
    const colors = {
      NORMAL: "blue",
      URGENTE: "red",
      "STOCK URGENTE": "orange",
      "STOCK NORMAL": "green",
    };
    return colors[prioridad] || "default";
  };

  // Calcular totales desde los detalles si no vienen en la cabecera
  const importeBruto = pedido.importe_bruto || detallesNormalizados.reduce((sum, detalle) => 
    sum + (detalle.precio_unitario * detalle.cantidad_solicitada), 0
  );

  const descuentos = pedido.monto_descuento || detallesNormalizados.reduce((sum, detalle) => 
    sum + detalle.descuento_monto, 0
  );

  const valorVenta = pedido.valor_venta || detallesNormalizados.reduce((sum, detalle) => 
    sum + detalle.valor_venta, 0
  );

  const igv = pedido.igv || detallesNormalizados.reduce((sum, detalle) => 
    sum + detalle.igv, 0
  );

  const total = pedido.total || detallesNormalizados.reduce((sum, detalle) => 
    sum + detalle.precio_total, 0
  );

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="large">
      {/* Información del Pedido */}
      <Card title="Información del Pedido">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="N° Pedido" span={1}>
            <strong>{pedido.numero || "-"}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Fecha" span={1}>
            {formatDate(pedido.fecha)}
          </Descriptions.Item>
          <Descriptions.Item label="Estado" span={1}>
            <Tag color={getEstadoColor(pedido.estado)} style={{ fontSize: '14px', padding: '4px 8px' }}>
              {pedido.estado || "PENDIENTE"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Prioridad" span={1}>
            <Tag color={getPrioridadColor(pedido.prioridad)} style={{ fontSize: '14px', padding: '4px 8px' }}>
              {pedido.prioridad || "NORMAL"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Moneda" span={1}>
            {pedido.moneda_codigo || pedido.moneda_nombre || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Forma de Pago" span={1}>
            {pedido.forma_pago_nombre || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Fecha Entrega Prevista" span={1}>
            {formatDate(pedido.fecha_entrega_prevista)}
          </Descriptions.Item>
          <Descriptions.Item label="Lugar de Entrega" span={1}>
            {pedido.lugar_entrega_direccion || pedido.lugar_entrega || "-"}
          </Descriptions.Item>
          {pedido.cotizacion_numero && (
            <Descriptions.Item label="Cotización Origen" span={2}>
              <strong>{pedido.cotizacion_numero}</strong>
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Observaciones" span={2}>
            {pedido.observaciones || "-"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Información del Cliente */}
      <Card title="Información del Cliente">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Código" span={1}>
            {pedido.codigo_cliente || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Razón Social" span={1}>
            {pedido.razon_social_cliente || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="RUC/DNI" span={1}>
            {pedido.nro_documento_cliente || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Teléfono" span={1}>
            {pedido.telefono_cliente || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Dirección" span={2}>
            {pedido.direccion_cliente || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Vendedor" span={2}>
            {pedido.vendedor || "-"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Productos */}
      <Card 
        title={
          <span>
            <FileTextOutlined /> Productos del Pedido 
            <span style={{ marginLeft: 8, fontSize: '14px', color: '#666' }}>
              ({detallesNormalizados.length} items)
            </span>
          </span>
        }
      >
        {detallesNormalizados.length > 0 ? (
          <Table
            columns={columns}
            dataSource={detallesNormalizados}
            rowKey="key"
            pagination={false}
            scroll={{ x: 1300 }}
            size="middle"
            summary={() => (
              <Table.Summary>
                <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 'bold' }}>
                  <Table.Summary.Cell index={0} colSpan={6} align="right">
                    <strong>TOTAL</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} colSpan={2} align="center">
                    {/* Espacio para descuentos porcentuales */}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right">
                    <strong style={{ color: "#ff4d4f" }}>
                      - {formatCurrency(descuentos)}
                    </strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right">
                    <strong>{formatCurrency(valorVenta)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right">
                    <strong>{formatCurrency(igv)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} align="right">
                    <strong style={{ color: "#1890ff", fontSize: '16px' }}>
                      {formatCurrency(total)}
                    </strong>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        ) : (
          <Alert
            message="No hay productos en este pedido"
            description="Este pedido no contiene items o no se pudieron cargar los productos."
            type="warning"
            showIcon
          />
        )}
      </Card>

      {/* Totales */}
      <Card title="Resumen de Totales">
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Descriptions column={1} size="middle">
              <Descriptions.Item label="Importe Bruto">
                <strong style={{ fontSize: '16px' }}>{formatCurrency(importeBruto)}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Descuentos">
                <strong style={{ color: "#ff4d4f", fontSize: '16px' }}>
                  - {formatCurrency(descuentos)}
                </strong>
              </Descriptions.Item>
              <Descriptions.Item label="Valor de Venta">
                <strong style={{ fontSize: '16px' }}>{formatCurrency(valorVenta)}</strong>
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col xs={24} md={12}>
            <Descriptions column={1} size="middle">
              <Descriptions.Item label="IGV (18%)">
                <strong style={{ fontSize: '16px' }}>{formatCurrency(igv)}</strong>
              </Descriptions.Item>
              <Divider />
              <Descriptions.Item label="TOTAL">
                <strong style={{ fontSize: '20px', color: "#1890ff" }}>
                  {formatCurrency(total)}
                </strong>
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>
    </Space>
  );
};

export default PedidoDetalle;