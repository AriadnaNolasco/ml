import React, { useEffect, useState, useRef } from "react";
import {
  Card,
  Descriptions,
  Tag,
  Row,
  Col,
  Divider,
  Table,
  Typography,
  Space,
  Button,
  message,
  Spin,
  Statistic,
  Badge,
} from "antd";
import {
  FileTextOutlined,
  UserOutlined,
  DollarOutlined,
  ShopOutlined,
  CalendarOutlined,
  PrinterOutlined,
  DownloadOutlined,
  ReloadOutlined,
  FilePdfOutlined,
  TeamOutlined,
  BarcodeOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useReactToPrint } from "react-to-print";

const { Title, Text } = Typography;

const CotizacionDetalle = ({ cotizacion }) => {
  const [detalle, setDetalle] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cotizacionCompleta, setCotizacionCompleta] = useState(null);
  const componentRef = useRef();

  useEffect(() => {
    if (cotizacion?.id_cotizacion) {
      fetchCotizacionCompleta();
    }
  }, [cotizacion]);

  const fetchCotizacionCompleta = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/ventas/cotizaciones/${
          cotizacion.id_cotizacion
        }`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCotizacionCompleta(response.data);

      if (response.data.detalles) {
        setDetalle(response.data.detalles);
      } else {
        await fetchDetalleCotizacion();
      }
    } catch (error) {
      message.error("Error al cargar información completa de la cotización");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetalleCotizacion = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/ventas/cotizaciones/${
          cotizacion.id_cotizacion
        }/detalle`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setDetalle(response.data);
    } catch (error) {
      message.error("Error al cargar detalle de cotización");
      console.error(error);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "N/A";
    return `S/ ${parseFloat(amount).toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatPercentage = (value) => {
    if (!value && value !== 0) return "N/A";
    return `${parseFloat(value).toFixed(2)}%`;
  };

  // Usar datos completos si están disponibles, sino usar los datos básicos
  const datos = cotizacionCompleta || cotizacion;

  // Función para generar PDF
  const generarPDF = async () => {
    try {
      message.loading({ content: "Generando PDF...", key: "pdf", duration: 0 });

      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/ventas/cotizaciones/${
          cotizacion.id_cotizacion
        }/pdf`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      // Crear blob y descargar
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Cotización-${datos.numero || datos.id_cotizacion}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success({ content: "PDF descargado correctamente", key: "pdf" });
    } catch (error) {
      console.error("Error al generar PDF:", error);
      message.error({
        content:
          "Error al generar PDF. Verifique que el servidor esté configurado correctamente.",
        key: "pdf",
      });
    }
  };

  // Función para imprimir - CORREGIDA: usar cotizacion en lugar de datos
  const handleImprimir = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Cotización-${
      cotizacion.numero || cotizacion.id_cotizacion
    }`,
    onAfterPrint: () => message.success("Documento impreso correctamente"),
    onPrintError: () => message.error("Error al imprimir el documento"),
  });

  const handleRecargar = () => {
    fetchCotizacionCompleta();
  };

  const columnasDetalle = [
    {
      title: "ITEM",
      dataIndex: "numitem",
      width: 60,
      align: "center",
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "CÓDIGO",
      dataIndex: "producto_codigo",
      width: 100,
      render: (text, record) => text || record.codigo_producto || "N/A",
    },
    {
      title: "DESCRIPCIÓN DEL PRODUCTO",
      dataIndex: "descripcion_producto",
      ellipsis: true,
      render: (text, record) =>
        text || record.producto_descripcion || record.descripcion || "N/A",
    },
    {
      title: "STOCK",
      dataIndex: "stock_disponible",
      width: 80,
      align: "center",
      render: (text) => (
        <Badge
          count={text}
          style={{
            backgroundColor: text > 0 ? "#52c41a" : "#ff4d4f",
            fontSize: "12px",
          }}
        />
      ),
    },
    {
      title: "CANTIDAD",
      dataIndex: "cantidad",
      width: 90,
      align: "center",
      render: (text) => <Text strong>{parseFloat(text).toFixed(2)}</Text>,
    },
    {
      title: "PRECIO UNIT.",
      dataIndex: "precio_unitario",
      width: 120,
      align: "right",
      render: (text, record) =>
        formatCurrency(text || record.precio_unitario_corregido),
    },
    {
      title: "DESCUENTO",
      dataIndex: "descuento_porcentaje",
      width: 100,
      align: "center",
      render: (text, record) => {
        if (text) return formatPercentage(text);
        const desc1 = record.descuento_1 || 0;
        const desc2 = record.descuento_2 || 0;
        const totalDesc = desc1 + desc2;
        return totalDesc > 0 ? formatPercentage(totalDesc) : "0.00%";
      },
    },
    {
      title: "SUBTOTAL",
      dataIndex: "precio_total",
      width: 130,
      align: "right",
      render: (text) => (
        <Text strong style={{ color: "#1890ff" }}>
          {formatCurrency(text)}
        </Text>
      ),
    },
  ];

  // Calcular totales desde los detalles para verificación
  const calcularTotales = () => {
    let importeBruto = 0;
    let totalDescuentos = 0;

    detalle.forEach((item) => {
      const cantidad = parseFloat(item.cantidad) || 0;
      const precioUnitario = parseFloat(item.precio_unitario) || 0;
      const subtotal = cantidad * precioUnitario;
      importeBruto += subtotal;

      // Calcular descuentos
      const desc1 = parseFloat(item.descuento_1) || 0;
      const desc2 = parseFloat(item.descuento_2) || 0;
      const descuentoMonto = parseFloat(item.descuento_monto) || 0;

      if (descuentoMonto > 0) {
        totalDescuentos += descuentoMonto;
      } else {
        const descuento1 = subtotal * (desc1 / 100);
        const subtotalDespuesDesc1 = subtotal - descuento1;
        const descuento2 = subtotalDespuesDesc1 * (desc2 / 100);
        totalDescuentos += descuento1 + descuento2;
      }
    });

    return { importeBruto, totalDescuentos };
  };

  const { importeBruto, totalDescuentos } = calcularTotales();
  const valorVentaCalculado = importeBruto - totalDescuentos;
  const igvCalculado = valorVentaCalculado * 0.18;
  const totalCalculado = valorVentaCalculado + igvCalculado;

  if (!cotizacion) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Title level={4} type="secondary">
            No se encontraron datos de la cotización
          </Title>
        </div>
      </Card>
    );
  }

  if (loading && !cotizacionCompleta) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>Cargando información de la cotización...</Text>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Controles de Acción - No se imprime */}
      <div style={{ marginBottom: 16 }}>
        <Card>
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <Title level={4} style={{ margin: 0 }}>
                  <FileTextOutlined /> Detalle de Cotización
                </Title>
                <Tag color="blue">{datos.numero}</Tag>
                <Tag
                  color={
                    datos.estado === "APROBADO"
                      ? "green"
                      : datos.estado === "PENDIENTE"
                      ? "orange"
                      : datos.estado === "ANULADO"
                      ? "red"
                      : "default"
                  }
                >
                  {datos.estado}
                </Tag>
              </Space>
            </Col>
            <Col>
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleRecargar}
                  loading={loading}
                >
                  Actualizar
                </Button>
                <Button
                  type="primary"
                  icon={<FilePdfOutlined />}
                  onClick={generarPDF}
                >
                  Descargar PDF
                </Button>
                <Button
                  type="primary"
                  icon={<PrinterOutlined />}
                  onClick={handleImprimir}
                >
                  Imprimir
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>
      </div>

      {/* Contenido para Imprimir/PDF */}
      <div ref={componentRef}>
        {/* Header de la Cotización */}
        <Card
          style={{
            marginBottom: 16,
            border: "2px solid #1890ff",
            background: "linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%)",
          }}
        >
          <Row gutter={24} align="middle">
            <Col span={16}>
              <Space direction="vertical" size="small">
                <Title level={3} style={{ margin: 0, color: "#1890ff" }}>
                  <FileTextOutlined /> COTIZACIÓN COMERCIAL
                </Title>
                <Text strong style={{ fontSize: "16px" }}>
                  N° {datos.numero || "N/A"}
                </Text>
                <Text type="secondary">
                  <CalendarOutlined /> Fecha:{" "}
                  {datos.fecha
                    ? new Date(datos.fecha).toLocaleDateString("es-PE", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "N/A"}
                </Text>
              </Space>
            </Col>
            <Col span={8} style={{ textAlign: "right" }}>
              <Space direction="vertical" size="small">
                <div>
                  <Text strong>Estado: </Text>
                  <Tag
                    color={
                      {
                        PENDIENTE: "orange",
                        APROBADO: "green",
                        RECHAZADO: "red",
                        ANULADO: "default",
                      }[datos.estado] || "default"
                    }
                    style={{ fontSize: "14px", padding: "4px 12px" }}
                  >
                    {datos.estado}
                  </Tag>
                </div>
                <div>
                  <Text strong>Prioridad: </Text>
                  <Tag
                    color={
                      {
                        NORMAL: "blue",
                        URGENTE: "red",
                        "STOCK URGENTE": "orange",
                        "STOCK NORMAL": "green",
                      }[datos.prioridad] || "default"
                    }
                  >
                    {datos.prioridad}
                  </Tag>
                </div>
              </Space>
            </Col>
          </Row>
        </Card>

        <Row gutter={16}>
          {/* Información del Cliente */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <TeamOutlined />
                  <span>INFORMACIÓN DEL CLIENTE</span>
                </Space>
              }
              size="small"
            >
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Código Cliente">
                  <Text strong>{datos.codigo_cliente || "N/A"}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Razón Social">
                  <Text strong style={{ fontSize: "14px" }}>
                    {datos.razon_social_cliente || "N/A"}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Documento">
                  <Space>
                    <Text>{datos.nro_documento_cliente || "N/A"}</Text>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Dirección">
                  <Space>
                    <EnvironmentOutlined />
                    <Text>{datos.direccion_cliente || "N/A"}</Text>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Contacto">
                  <Space direction="vertical" size="small">
                    {datos.telefono_cliente && (
                      <Space>
                        <PhoneOutlined />
                        <Text>{datos.telefono_cliente}</Text>
                      </Space>
                    )}
                    {datos.email && (
                      <Space>
                        <MailOutlined />
                        <Text>{datos.email}</Text>
                      </Space>
                    )}
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* Información Comercial */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <ShopOutlined />
                  <span>INFORMACIÓN COMERCIAL</span>
                </Space>
              }
              size="small"
            >
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Vendedor">
                  <Text strong>
                    {datos.vendedor_nombre || datos.vendedor || "N/A"}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Moneda">
                  <Text strong>
                    {datos.moneda_codigo || "PEN"} -{" "}
                    {datos.moneda_nombre || "Soles"}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Forma de Pago">
                  {datos.forma_pago_nombre || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Tipo de Cambio">
                  {parseFloat(datos.tipo_cambio || 1).toFixed(4)}
                </Descriptions.Item>
                <Descriptions.Item label="Condiciones">
                  <Space direction="vertical" size="small">
                    <div>
                      <Text strong>Reparación: </Text>
                      <Tag color={datos.reparacion ? "blue" : "default"}>
                        {datos.reparacion ? "SÍ" : "NO"}
                      </Tag>
                    </div>
                    {datos.linea_credito > 0 && (
                      <div>
                        <Text strong>Línea Crédito: </Text>
                        <Text type="success">
                          {formatCurrency(datos.linea_credito)}
                        </Text>
                      </div>
                    )}
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>

        {/* Detalle de Productos */}
        <Card
          style={{ marginTop: 16 }}
          title={
            <Space>
              <BarcodeOutlined />
              <span>DETALLE DE PRODUCTOS ({detalle.length} items)</span>
            </Space>
          }
        >
          <Table
            columns={columnasDetalle}
            dataSource={detalle}
            loading={loading}
            rowKey="id_detalle_cotizacion"
            pagination={false}
            scroll={{ x: 900 }}
            size="small"
            summary={() => (
              <Table.Summary>
                <Table.Summary.Row style={{ background: "#fafafa" }}>
                  <Table.Summary.Cell index={0} colSpan={5} align="right">
                    <Text strong>TOTAL GENERAL:</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <Text strong>{formatCurrency(datos.importe_bruto)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="center">
                    <Text strong type="danger">
                      -{formatCurrency(datos.monto_descuento)}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right">
                    <Text strong style={{ color: "#52c41a", fontSize: "16px" }}>
                      {formatCurrency(datos.total)}
                    </Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </Card>

        {/* Resumen Financiero */}
        <Row gutter={16} style={{ marginTop: 24 }}>
          <Col xs={24} md={6}>
            <Card size="small">
              <Statistic
                title="Importe Bruto"
                value={datos.importe_bruto}
                precision={2}
                prefix="S/ "
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card size="small">
              <Statistic
                title="Total Descuentos"
                value={datos.monto_descuento}
                precision={2}
                prefix="S/ "
                valueStyle={{ color: "#ff4d4f" }}
              />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card size="small">
              <Statistic
                title="Valor Venta"
                value={datos.valor_venta}
                precision={2}
                prefix="S/ "
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card
              size="small"
              style={{ background: "#f6ffed", border: "1px solid #b7eb8f" }}
            >
              <Statistic
                title="TOTAL COTIZACIÓN"
                value={datos.total}
                precision={2}
                prefix="S/ "
                valueStyle={{ color: "#52c41a", fontSize: "18px" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Desglose de Impuestos */}
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col xs={24} md={12}>
            <Card size="small" title="DESGLOSE DE IMPUESTOS">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Base Imponible">
                  <Text strong>{formatCurrency(datos.valor_venta)}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="IGV (18%)">
                  <Text strong>{formatCurrency(datos.igv)}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Total">
                  <Text strong type="success">
                    {formatCurrency(datos.total)}
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card size="small" title="INFORMACIÓN ADICIONAL">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Línea de Crédito">
                  {formatCurrency(datos.linea_credito)}
                </Descriptions.Item>
                <Descriptions.Item label="Línea Disponible">
                  <Text strong type="success">
                    {formatCurrency(datos.linea_disponible)}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Descuentos Aplicados">
                  <Space direction="vertical" size="small">
                    <Text>
                      Desc. 1: {formatPercentage(datos.descuento_1 || 0)}
                    </Text>
                    <Text>
                      Desc. 2: {formatPercentage(datos.descuento_2 || 0)}
                    </Text>
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>

        {/* Comentarios */}
        {datos.comentario && (
          <Card
            style={{ marginTop: 16 }}
            title="OBSERVACIONES Y COMENTARIOS"
            size="small"
          >
            <div style={{ padding: "8px 0" }}>
              <Text>{datos.comentario}</Text>
            </div>
          </Card>
        )}

        {/* Información de Auditoría */}
        <Card
          style={{ marginTop: 16 }}
          title="INFORMACIÓN DE AUDITORÍA"
          size="small"
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Creado Por">
                  <Text strong>{datos.creado_por_nombre || "Sistema"}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Fecha Creación">
                  {datos.created_at
                    ? new Date(datos.created_at).toLocaleString("es-PE", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "N/A"}
                </Descriptions.Item>
              </Descriptions>
            </Col>
            <Col xs={24} md={12}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Actualizado Por">
                  <Text strong>{datos.actualizado_por_nombre || "N/A"}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Fecha Actualización">
                  {datos.updated_at
                    ? new Date(datos.updated_at).toLocaleString("es-PE", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "N/A"}
                </Descriptions.Item>
              </Descriptions>
            </Col>
          </Row>
        </Card>

        {/* Resumen Visual Final */}
        <Divider />
        <Row gutter={16} style={{ marginTop: 16, marginBottom: 24 }}>
          <Col xs={24} md={6}>
            <Card size="small" style={{ textAlign: "center" }}>
              <Title
                level={4}
                style={{
                  margin: 0,
                  color:
                    datos.estado === "PENDIENTE"
                      ? "#faad14"
                      : datos.estado === "APROBADO"
                      ? "#52c41a"
                      : datos.estado === "ANULADO"
                      ? "#ff4d4f"
                      : "#8c8c8c",
                }}
              >
                {datos.estado}
              </Title>
              <Text type="secondary">Estado</Text>
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card size="small" style={{ textAlign: "center" }}>
              <Title level={4} style={{ margin: 0, color: "#1890ff" }}>
                {detalle.length}
              </Title>
              <Text type="secondary">Items</Text>
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card size="small" style={{ textAlign: "center" }}>
              <Title level={4} style={{ margin: 0, color: "#722ed1" }}>
                {datos.prioridad}
              </Title>
              <Text type="secondary">Prioridad</Text>
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card size="small" style={{ textAlign: "center" }}>
              <Title level={4} style={{ margin: 0, color: "#52c41a" }}>
                {formatCurrency(datos.total)}
              </Title>
              <Text type="secondary">Total</Text>
            </Card>
          </Col>
        </Row>

        {/* Pie de página para impresión */}
        <div
          style={{
            textAlign: "center",
            marginTop: 30,
            padding: "20px",
            borderTop: "1px solid #d9d9d9",
          }}
        >
          <Text type="secondary">
            Documento generado el {new Date().toLocaleDateString("es-PE")} -
            Válido por 30 días - Página 1 de 1
          </Text>
        </div>
      </div>
    </div>
  );
};

export default CotizacionDetalle;
