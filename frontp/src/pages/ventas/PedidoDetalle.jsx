// PedidoDetalle.jsx - MODIFICADO: Total en Dólares debajo del TOTAL + Orden de Fabricación
import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Descriptions,
  Divider,
  Space,
  Alert,
  Tooltip,
  Button,
  Modal,
  message,
  Spin,
  Statistic,
} from "antd";
import {
  FileTextOutlined,
  InfoCircleOutlined,
  StockOutlined,
  ToolOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  TruckOutlined,
} from "@ant-design/icons";
import axios from "axios";

const PedidoDetalle = ({ pedido, onOrdenGenerada }) => {
  const [disponibilidad, setDisponibilidad] = useState(null);
  const [loadingDisponibilidad, setLoadingDisponibilidad] = useState(false);
  const [loadingGenerar, setLoadingGenerar] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

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

  // Función para analizar disponibilidad
  const analizarDisponibilidad = async () => {
    setLoadingDisponibilidad(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/ordenes-fabricacion/analizar/${pedido.id_pedido}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setDisponibilidad(response.data.data);
        setModalVisible(true);
      } else {
        message.error(response.data.message || "Error al analizar disponibilidad");
      }
    } catch (error) {
      console.error("Error al analizar disponibilidad:", error);
      message.error(
        error.response?.data?.message || "Error al analizar disponibilidad del pedido"
      );
    } finally {
      setLoadingDisponibilidad(false);
    }
  };

  // Función para generar orden de fabricación
  const generarOrdenFabricacion = async () => {
    console.log("🔧 Iniciando generación de orden de fabricación...");
    console.log("📦 Pedido ID:", pedido.id_pedido);

    setLoadingGenerar(true);
    try {
      const token = localStorage.getItem("token");
      const url = `${import.meta.env.VITE_API_URL}/ordenes-fabricacion/generar`;
      console.log("🌐 URL:", url);
      console.log("📝 Body:", { pedido_id: pedido.id_pedido });

      const response = await axios.post(
        url,
        { pedido_id: pedido.id_pedido },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Respuesta recibida:", response.data);

      if (response.data.success) {
        setModalVisible(false);
        if (onOrdenGenerada) {
          console.log("📢 Llamando callback onOrdenGenerada");
          onOrdenGenerada(response.data.data);
        } else {
          message.success("Orden de fabricación generada exitosamente");
        }
      } else {
        console.error("❌ Error en respuesta:", response.data);
        message.error(response.data.message || "Error al generar orden de fabricación");
      }
    } catch (error) {
      console.error("💥 Error al generar orden:", error);
      console.error("💥 Detalles del error:", error.response?.data);
      message.error(
        error.response?.data?.message || "Error al generar orden de fabricación"
      );
    } finally {
      setLoadingGenerar(false);
      console.log("🏁 Proceso finalizado");
    }
  };

  // Función para formatear moneda SOLES (CON símbolo S/)
  const formatCurrencySoles = (amount) => {
    return `S/ ${parseFloat(amount || 0).toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Función para formatear moneda DÓLARES (con símbolo $)
  const formatCurrencyDolares = (amount) => {
    return `$ ${parseFloat(amount || 0).toLocaleString("es-PE", {
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

  // Normalizar los detalles
  const detallesNormalizados = Array.isArray(pedido.detalles)
    ? pedido.detalles.map((detalle, index) => ({
        key: detalle.id_detalle_pedido || `detalle-${index}`,
        id_detalle_pedido: detalle.id_detalle_pedido,
        numitem: detalle.numitem || index + 1,
        producto_codigo: detalle.producto_codigo || "-",
        producto_descripcion:
          detalle.producto_descripcion || detalle.descripcion_producto || "-",
        unidad_medida: detalle.unidad_medida || "UND",
        unidad_medida_nombre: detalle.unidad_medida || "Unidad",
        cantidad_solicitada: parseFloat(detalle.cantidad_solicitada || 0),
        cantidad_despachada: parseFloat(detalle.cantidad_despachada || 0),
        cantidad_pendiente: parseFloat(
          (detalle.cantidad_solicitada || 0) -
            (detalle.cantidad_despachada || 0)
        ),

        // ✅ CAMPOS DE STOCK Y RESERVAS (Sistema de Reservas)
        stock_disponible_real: parseFloat(detalle.stock_disponible_real || 0),
        stock_actual_producto: parseFloat(detalle.stock_actual_producto || 0),
        cantidad_reservada: parseFloat(detalle.cantidad_reservada || 0),
        requiere_fabricacion: detalle.requiere_fabricacion || false,
        estado_reserva: detalle.estado_reserva || null,
        id_reserva: detalle.id_reserva || null,
        fecha_reserva: detalle.fecha_reserva || null,

        // ⚠️ Campo antiguo (mantener para retrocompatibilidad)
        stock_disponible: parseFloat(detalle.stock_disponible || 0),

        precio_original: parseFloat(
          detalle.precio_original || detalle.precio_unitario || 0
        ),
        precio_unitario: parseFloat(detalle.precio_unitario || 0),
        precio_bruto: parseFloat(
          detalle.precio_bruto ||
            (detalle.cantidad_solicitada || 0) * (detalle.precio_unitario || 0) ||
            0
        ),
        descuento_1: parseFloat(detalle.descuento_1 || 0),
        descuento_2: parseFloat(detalle.descuento_2 || 0),
        descuento_monto: parseFloat(detalle.descuento_monto || 0),
        valor_venta: parseFloat(detalle.valor_venta || 0),
        igv: parseFloat(detalle.igv || 0),
        precio_total: parseFloat(detalle.precio_total || 0),
        importe_dolares: parseFloat(detalle.importe_dolares || 0),
        fecha_entrega_item:
          detalle.fecha_entrega_item || detalle.fecha_entrega_original,
        comentario: detalle.comentario || "",
      }))
    : [];

  // Calcular totales
  const importeBruto = detallesNormalizados.reduce(
    (sum, detalle) => sum + (detalle.precio_bruto || 0),
    0
  );

  const descuentos = detallesNormalizados.reduce(
    (sum, detalle) => sum + (detalle.descuento_monto || 0),
    0
  );

  const valorVenta = detallesNormalizados.reduce(
    (sum, detalle) => sum + (detalle.valor_venta || 0),
    0
  );

  const igvTotal = detallesNormalizados.reduce(
    (sum, detalle) => sum + (detalle.igv || 0),
    0
  );

  const total = detallesNormalizados.reduce(
    (sum, detalle) => sum + (detalle.precio_total || 0),
    0
  );

  const totalUSD = detallesNormalizados.reduce(
    (sum, detalle) => sum + (detalle.importe_dolares || 0),
    0
  );

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
      render: (codigo) => (
        <Tooltip title="Código del producto">
          <span style={{ fontWeight: "bold" }}>{codigo || "-"}</span>
        </Tooltip>
      ),
    },
    {
      title: "Descripción",
      dataIndex: "producto_descripcion",
      key: "producto_descripcion",
      width: 200,
      render: (descripcion) => descripcion || "-",
    },
    {
      title: "Unidad",
      dataIndex: "unidad_medida",
      key: "unidad_medida",
      width: 80,
      align: "center",
      render: (unidad) => (
        <Tooltip title="Unidad de medida">
          <Tag color="blue">{unidad}</Tag>
        </Tooltip>
      ),
    },
    {
      title: "Cant. Solicitada",
      dataIndex: "cantidad_solicitada",
      key: "cantidad_solicitada",
      width: 90,
      align: "right",
      render: (cantidad) => parseFloat(cantidad || 0).toFixed(3),
    },
    {
      title: "Cant. Despachada",
      dataIndex: "cantidad_despachada",
      key: "cantidad_despachada",
      width: 90,
      align: "right",
      render: (cantidad, record) => (
        <Tooltip title={`Pendiente: ${(record.cantidad_pendiente || 0).toFixed(3)}`}>
          <span
            style={{
              color:
                cantidad < record.cantidad_solicitada ? "#ff4d4f" : "#52c41a",
              fontWeight:
                cantidad < record.cantidad_solicitada ? "bold" : "normal",
            }}
          >
            {parseFloat(cantidad || 0).toFixed(3)}
          </span>
        </Tooltip>
      ),
    },
    {
      title: (
        <Tooltip title="Cantidad pendiente por despachar">
          <span>
            Cant. Pendiente <InfoCircleOutlined />
          </span>
        </Tooltip>
      ),
      dataIndex: "cantidad_pendiente",
      key: "cantidad_pendiente",
      width: 90,
      align: "right",
      render: (cantidad, record) => (
        <span
          style={{
            color: cantidad > 0 ? "#fa8c16" : "#52c41a",
            fontWeight: cantidad > 0 ? "bold" : "normal",
          }}
        >
          {parseFloat(cantidad || 0).toFixed(3)}
        </span>
      ),
    },
    {
      title: (
        <Tooltip title="Stock disponible real (considerando reservas activas)">
          <span>
            Stock <StockOutlined />
          </span>
        </Tooltip>
      ),
      dataIndex: "stock_disponible_real",
      key: "stock_disponible_real",
      width: 120,
      align: "right",
      render: (stock_disponible_real, record) => {
        const stockReal = parseFloat(stock_disponible_real || record.stock_disponible || 0);
        const stockActual = parseFloat(record.stock_actual_producto || 0);
        const cantidadReservada = parseFloat(record.cantidad_reservada || 0);
        const cantidadPendiente = parseFloat(record.cantidad_pendiente || 0);

        return (
          <Tooltip
            title={
              <div>
                <div><strong>Stock Total:</strong> {stockActual.toFixed(3)}</div>
                {cantidadReservada > 0 && (
                  <div style={{ color: '#52c41a' }}>
                    <strong>Reservado (este pedido):</strong> {cantidadReservada.toFixed(3)}
                  </div>
                )}
                <div><strong>Disponible (otros pedidos):</strong> {stockReal.toFixed(3)}</div>
                {record.requiere_fabricacion && (
                  <div style={{ color: '#fa8c16' }}>
                    <strong>⚠ Requiere fabricación</strong>
                  </div>
                )}
              </div>
            }
          >
            <div>
              <div
                style={{
                  color: stockReal < cantidadPendiente ? "#fa8c16" : "#52c41a",
                  fontWeight: "bold"
                }}
              >
                {stockReal.toFixed(3)}
              </div>
              {cantidadReservada > 0 && (
                <div style={{ fontSize: '11px', color: '#52c41a' }}>
                  ✓ {cantidadReservada.toFixed(3)} reservado
                </div>
              )}
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: "P. Original",
      dataIndex: "precio_original",
      key: "precio_original",
      width: 100,
      align: "right",
      render: (precio) => formatCurrencySoles(precio),
    },
    {
      title: "P. Unitario",
      dataIndex: "precio_unitario",
      key: "precio_unitario",
      width: 100,
      align: "right",
      render: (precio) => <strong>{formatCurrencySoles(precio)}</strong>,
    },
    {
      title: "Desc. 1",
      dataIndex: "descuento_1",
      key: "descuento_1",
      width: 70,
      align: "right",
      render: (desc1) =>
        desc1 > 0 ? `${parseFloat(desc1 || 0).toFixed(2)}%` : "-",
    },
    {
      title: "Desc. 2",
      dataIndex: "descuento_2",
      key: "descuento_2",
      width: 70,
      align: "right",
      render: (desc2) =>
        desc2 > 0 ? `${parseFloat(desc2 || 0).toFixed(2)}%` : "-",
    },
    {
      title: "Desc. Monto",
      dataIndex: "descuento_monto",
      key: "descuento_monto",
      width: 100,
      align: "right",
      render: (monto) =>
        monto > 0 ? (
          <span style={{ color: "#ff4d4f" }}>
            - {formatCurrencySoles(monto)}
          </span>
        ) : (
          "-"
        ),
    },
    {
      title: "P. Bruto",
      dataIndex: "precio_bruto",
      key: "precio_bruto",
      width: 100,
      align: "right",
      render: (bruto) => formatCurrencySoles(bruto),
    },
    {
      title: "Valor Venta",
      dataIndex: "valor_venta",
      key: "valor_venta",
      width: 100,
      align: "right",
      render: (valor) => <strong>{formatCurrencySoles(valor)}</strong>,
    },
    {
      title: "IGV",
      dataIndex: "igv",
      key: "igv",
      width: 90,
      align: "right",
      render: (igvVal) => formatCurrencySoles(igvVal),
    },
    {
      title: "Total",
      dataIndex: "precio_total",
      key: "precio_total",
      width: 100,
      align: "right",
      render: (totalItem) => (
        <strong style={{ color: "#1890ff" }}>
          {formatCurrencySoles(totalItem)}
        </strong>
      ),
    },
    {
      title: "USD",
      dataIndex: "importe_dolares",
      key: "importe_dolares",
      width: 90,
      align: "right",
      render: (dolares) =>
        dolares > 0 ? (
          <span style={{ color: "#52c41a", fontSize: "12px" }}>
            {formatCurrencyDolares(dolares)}
          </span>
        ) : (
          "-"
        ),
    },
    {
      title: "Entrega",
      dataIndex: "fecha_entrega_item",
      key: "fecha_entrega_item",
      width: 100,
      render: (fecha) => (fecha ? formatDate(fecha) : "-"),
    },
  ];

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
            <Tag
              color={getEstadoColor(pedido.estado)}
              style={{ fontSize: "14px", padding: "4px 8px" }}
            >
              {pedido.estado || "PENDIENTE"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Prioridad" span={1}>
            <Tag
              color={getPrioridadColor(pedido.prioridad)}
              style={{ fontSize: "14px", padding: "4px 8px" }}
            >
              {pedido.prioridad || "NORMAL"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Moneda" span={1}>
            {pedido.moneda_codigo || pedido.moneda_nombre || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Tipo Cambio" span={1}>
            {pedido.tipo_cambio
              ? `${parseFloat(pedido.tipo_cambio).toFixed(4)}`
              : "-"}
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
            <span style={{ marginLeft: 8, fontSize: "14px", color: "#666" }}>
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
            scroll={{ x: 1800 }}
            size="middle"
            summary={() => (
              <Table.Summary>
                <Table.Summary.Row
                  style={{ background: "#fafafa", fontWeight: "bold" }}
                >
                  <Table.Summary.Cell index={0} colSpan={8} align="right">
                    <strong>TOTAL</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} colSpan={3} align="center">
                    {/* Espacio para precios */}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right">
                    <strong style={{ color: "#ff4d4f" }}>
                      - {formatCurrencySoles(descuentos)}
                    </strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right">
                    <strong>{formatCurrencySoles(importeBruto)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right">
                    <strong>{formatCurrencySoles(valorVenta)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} align="right">
                    <strong>{formatCurrencySoles(igvTotal)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6} align="right">
                    <strong style={{ color: "#1890ff", fontSize: "16px" }}>
                      {formatCurrencySoles(total)}
                    </strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={7} align="right">
                    {totalUSD > 0 && (
                      <strong style={{ color: "#52c41a", fontSize: "14px" }}>
                        {formatCurrencyDolares(totalUSD)}
                      </strong>
                    )}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={8} align="center">
                    {/* Fecha entrega */}
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

      {/* Totales - MODIFICADO: Total en Dólares DEBAJO del TOTAL */}
      <Card title="Resumen de Totales">
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Descriptions column={1} size="middle">
              <Descriptions.Item label="Importe Bruto">
                <strong style={{ fontSize: "16px" }}>
                  {formatCurrencySoles(importeBruto)}
                </strong>
              </Descriptions.Item>
              <Descriptions.Item label="Descuentos">
                <strong style={{ color: "#ff4d4f", fontSize: "16px" }}>
                  - {formatCurrencySoles(descuentos)}
                </strong>
              </Descriptions.Item>
              <Descriptions.Item label="Valor de Venta">
                <strong style={{ fontSize: "16px" }}>
                  {formatCurrencySoles(valorVenta)}
                </strong>
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col xs={24} md={12}>
            <Descriptions column={1} size="middle">
              <Descriptions.Item label="IGV (18%)">
                <strong style={{ fontSize: "16px" }}>
                  {formatCurrencySoles(igvTotal)}
                </strong>
              </Descriptions.Item>
              <Divider />
              <Descriptions.Item label="TOTAL">
                <strong style={{ fontSize: "20px", color: "#1890ff" }}>
                  {formatCurrencySoles(total)}
                </strong>
              </Descriptions.Item>
              
              {/* TOTAL EN DÓLARES DEBAJO DEL TOTAL */}
              {totalUSD > 0 && (
                <Descriptions.Item label="Total en Dólares">
                  <strong style={{ color: "#52c41a", fontSize: "16px" }}>
                    {formatCurrencyDolares(totalUSD)}
                  </strong>
                </Descriptions.Item>
              )}
              
              {/* TIPO DE CAMBIO DEBAJO DEL TOTAL EN DÓLARES */}
              {pedido.tipo_cambio && totalUSD > 0 && (
                <Descriptions.Item label="Tipo de Cambio">
                  <span style={{ fontSize: "14px" }}>
                    1 USD = {parseFloat(pedido.tipo_cambio).toFixed(4)}
                  </span>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Col>
        </Row>
      </Card>

      {/* Sección de Orden de Fabricación */}
      {pedido.estado === "PENDIENTE" && (
        <Card
          title={
            <span>
              <ToolOutlined /> Orden de Fabricación
            </span>
          }
        >
          <Alert
            message="Generación de Orden de Fabricación"
            description="Analiza la disponibilidad de stock y genera automáticamente una orden de fabricación para los productos que lo requieran."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Space size="large">
            <Button
              type="primary"
              icon={<ToolOutlined />}
              size="large"
              loading={loadingDisponibilidad}
              onClick={analizarDisponibilidad}
            >
              Analizar Disponibilidad y Generar Orden
            </Button>
          </Space>
        </Card>
      )}

      {/* Modal de Análisis de Disponibilidad */}
      <Modal
        title={
          <span>
            <WarningOutlined style={{ color: "#faad14", marginRight: 8 }} />
            Análisis de Disponibilidad de Stock
          </span>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={900}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            Cancelar
          </Button>,
          disponibilidad?.resumen?.requiere_fabricacion && (
            <Button
              key="generar"
              type="primary"
              icon={<ToolOutlined />}
              loading={loadingGenerar}
              onClick={() => {
                console.log("🔔 Botón 'Generar Orden de Fabricación' clickeado");
                generarOrdenFabricacion();
              }}
            >
              Generar Orden de Fabricación
            </Button>
          ),
        ]}
      >
        {disponibilidad ? (
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            {/* Resumen */}
            <Card size="small">
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic
                    title="Total Items"
                    value={disponibilidad.resumen.total_items}
                    prefix={<FileTextOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Disponibles"
                    value={disponibilidad.resumen.items_disponibles}
                    valueStyle={{ color: "#52c41a" }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Parciales"
                    value={disponibilidad.resumen.items_parciales}
                    valueStyle={{ color: "#faad14" }}
                    prefix={<WarningOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Sin Stock"
                    value={disponibilidad.resumen.items_no_disponibles}
                    valueStyle={{ color: "#ff4d4f" }}
                    prefix={<WarningOutlined />}
                  />
                </Col>
              </Row>
            </Card>

            {/* Alerta según estado */}
            {disponibilidad.resumen.puede_despachar_completo ? (
              <Alert
                message="✓ Todos los productos tienen stock disponible"
                description="No es necesario generar una orden de fabricación."
                type="success"
                showIcon
              />
            ) : disponibilidad.resumen.requiere_fabricacion ? (
              <Alert
                message="⚠ Se requiere fabricación"
                description={`Hay productos sin stock suficiente que requieren fabricación.`}
                type="warning"
                showIcon
              />
            ) : null}

            {/* Detalle de productos */}
            <Table
              dataSource={disponibilidad.items}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                {
                  title: "#",
                  dataIndex: "num_item",
                  width: 50,
                  align: "center",
                },
                {
                  title: "Producto",
                  dataIndex: "descripcion",
                  width: 250,
                  render: (text, record) => (
                    <div>
                      <div>
                        <strong>{record.codigo_producto}</strong>
                      </div>
                      <div style={{ fontSize: "12px", color: "#666" }}>
                        {text}
                      </div>
                    </div>
                  ),
                },
                {
                  title: "Solicitado",
                  dataIndex: "cantidad",
                  width: 90,
                  align: "right",
                  render: (val) => parseFloat(val).toFixed(3),
                },
                {
                  title: "Stock Disponible",
                  dataIndex: "stock_disponible",
                  width: 120,
                  align: "right",
                  render: (val, record) => (
                    <span
                      style={{
                        color:
                          val >= record.cantidad ? "#52c41a" : "#ff4d4f",
                        fontWeight: "bold",
                      }}
                    >
                      {parseFloat(val).toFixed(3)}
                    </span>
                  ),
                },
                {
                  title: "Estado",
                  dataIndex: "estado_disponibilidad",
                  width: 120,
                  align: "center",
                  render: (estado) => {
                    const config = {
                      DISPONIBLE: { color: "success", text: "Disponible" },
                      PARCIAL: { color: "warning", text: "Parcial" },
                      NO_DISPONIBLE: { color: "error", text: "Sin Stock" },
                    };
                    return (
                      <Tag color={config[estado]?.color}>
                        {config[estado]?.text || estado}
                      </Tag>
                    );
                  },
                },
                {
                  title: "A Fabricar",
                  dataIndex: "cantidad_requiere_fabricacion",
                  width: 100,
                  align: "right",
                  render: (val) => {
                    const cantidad = parseFloat(val);
                    return cantidad > 0 ? (
                      <strong style={{ color: "#fa8c16" }}>
                        {cantidad.toFixed(3)}
                      </strong>
                    ) : (
                      <span style={{ color: "#52c41a" }}>-</span>
                    );
                  },
                },
              ]}
            />
          </Space>
        ) : (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <Spin size="large" />
            <p style={{ marginTop: 16 }}>Analizando disponibilidad...</p>
          </div>
        )}
      </Modal>
    </Space>
  );
};

export default PedidoDetalle;