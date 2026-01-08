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
  Alert,
  Tooltip,
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
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useReactToPrint } from "react-to-print";

const { Title, Text } = Typography;

const CotizacionDetalle = ({ cotizacion, onSuccess }) => {
  const [detalle, setDetalle] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cotizacionCompleta, setCotizacionCompleta] = useState(null);
  const [importeDolaresInfo, setImporteDolaresInfo] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
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

      console.log("📊 Datos completos de cotización:", response.data);

      setCotizacionCompleta(response.data);

      if (response.data.detalles) {
        setDetalle(response.data.detalles);
      } else {
        await fetchDetalleCotizacion();
      }

      // Calcular importe en dólares directamente desde los datos recibidos
      if (response.data) {
        calcularImporteDolaresDesdeDatos(response.data);
      }
    } catch (error) {
      console.error("Error al cargar cotización completa:", error);
      message.error("Error al cargar información completa de la cotización");
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
      console.error("Error al cargar detalle:", error);
      message.error("Error al cargar detalle de cotización");
    }
  };

  const calcularImporteDolaresDesdeDatos = (datos) => {
    if (!datos) return;

    let importeDolares = 0;

    // Primero intentar usar importe_dolares del backend
    if (datos.importe_dolares && datos.importe_dolares > 0) {
      importeDolares = parseFloat(datos.importe_dolares);
    } else if (datos.tipo_cambio && datos.tipo_cambio > 0 && datos.total > 0) {
      // Calcular si tenemos total y tipo_cambio
      importeDolares = parseFloat(datos.total) / parseFloat(datos.tipo_cambio);
    }

    if (importeDolares > 0) {
      setImporteDolaresInfo({
        importe_dolares: importeDolares,
        total_soles: datos.total,
        tipo_cambio: datos.tipo_cambio,
        moneda: datos.moneda_codigo || "PEN",
        moneda_nombre: datos.moneda_nombre || "Soles",
      });
    }
  };

  // FUNCIONES DE APROBACIÓN Y RECHAZO
  const aprobarCotizacion = async (idCotizacion) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await axios.put(
        `${
          import.meta.env.VITE_API_URL
        }/ventas/cotizaciones/${idCotizacion}/aprobar`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      message.success("Cotización aprobada exitosamente");

      // Recargar los datos de la cotización
      fetchCotizacionCompleta();

      // Notificar al componente padre si existe callback
      if (onSuccess) {
        onSuccess(response.data.cotizacion);
      }
    } catch (error) {
      console.error("❌ Error al aprobar cotización:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detalle ||
        "Error al aprobar la cotización";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const rechazarCotizacion = async (idCotizacion) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await axios.put(
        `${
          import.meta.env.VITE_API_URL
        }/ventas/cotizaciones/${idCotizacion}/rechazar`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      message.success("Cotización rechazada exitosamente");

      // Recargar los datos de la cotización
      fetchCotizacionCompleta();

      // Notificar al componente padre si existe callback
      if (onSuccess) {
        onSuccess(response.data.cotizacion);
      }
    } catch (error) {
      console.error("❌ Error al rechazar cotización:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detalle ||
        "Error al rechazar la cotización";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const anularCotizacion = async (idCotizacion) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await axios.put(
        `${
          import.meta.env.VITE_API_URL
        }/ventas/cotizaciones/${idCotizacion}/anular`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      message.success("Cotización anulada exitosamente");

      // Recargar los datos de la cotización
      fetchCotizacionCompleta();

      // Notificar al componente padre si existe callback
      if (onSuccess) {
        onSuccess(response.data.cotizacion);
      }
    } catch (error) {
      console.error("❌ Error al anular cotización:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detalle ||
        "Error al anular la cotización";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || amount === "") return "N/A";
    const num = parseFloat(amount);
    if (isNaN(num)) return "N/A";
    return `S/ ${num.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDollars = (amount) => {
    if (amount === null || amount === undefined || amount === "") return "N/A";
    const num = parseFloat(amount);
    if (isNaN(num)) return "N/A";
    return `US$ ${num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined || value === "") return "N/A";
    const num = parseFloat(value);
    if (isNaN(num)) return "N/A";
    return `${num.toFixed(2)}%`;
  };

  // Usar datos completos si están disponibles, sino usar los datos básicos
  const datos = cotizacionCompleta || cotizacion;

  // Función para generar PDF
  const generarPDF = async () => {
    setPdfLoading(true);
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
          "Error al generar PDF. Verifique la configuración del servidor.",
        key: "pdf",
      });
    } finally {
      setPdfLoading(false);
    }
  };

  // Función para imprimir
  const handleImprimir = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Cotización-${
      cotizacion.numero || cotizacion.id_cotizacion
    }`,
    onAfterPrint: () => message.success("Documento impreso correctamente"),
    onPrintError: (error) => {
      console.error("Error al imprimir:", error);
      message.error("Error al imprimir el documento");
    },
  });

  const handleRecargar = () => {
    fetchCotizacionCompleta();
  };

  // Calcular importe en dólares para mostrar
  const calcularImporteDolaresMostrar = () => {
    // Primero usar importeDolaresInfo
    if (importeDolaresInfo?.importe_dolares > 0) {
      return importeDolaresInfo.importe_dolares;
    }

    // Luego usar datos.importe_dolares
    if (datos?.importe_dolares > 0) {
      return parseFloat(datos.importe_dolares);
    }

    // Finalmente calcular si tenemos total y tipo_cambio
    if (datos?.tipo_cambio > 0 && datos?.total > 0) {
      return parseFloat(datos.total) / parseFloat(datos.tipo_cambio);
    }

    return 0;
  };

  const importeDolaresMostrar = calcularImporteDolaresMostrar();

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
      title: "UNIDAD",
      dataIndex: "unidad_medida",
      width: 80,
      align: "center",
      render: (text, record) => text || record.unidad_medida_nombre || "UND",
    },
    {
      title: "STOCK",
      dataIndex: "stock_disponible_real",
      width: 100,
      align: "center",
      render: (stock_disponible_real, record) => {
        const stockReal = parseFloat(stock_disponible_real || record.stock_disponible || 0);
        const stockActual = parseFloat(record.stock_actual || 0);
        const stockReservado = parseFloat(record.stock_reservado_total || 0);

        return (
          <Tooltip
            title={
              <div>
                <div><strong>Stock Total:</strong> {stockActual.toFixed(3)}</div>
                {stockReservado > 0 && (
                  <div style={{ color: '#fa8c16' }}>
                    <strong>Reservado:</strong> {stockReservado.toFixed(3)}
                  </div>
                )}
                <div><strong>Disponible:</strong> {stockReal.toFixed(3)}</div>
              </div>
            }
          >
            <Badge
              count={stockReal.toFixed(1)}
              style={{
                backgroundColor: stockReal > 0 ? "#52c41a" : "#ff4d4f",
                fontSize: "12px",
              }}
            />
          </Tooltip>
        );
      },
    },
    {
      title: "CANTIDAD",
      dataIndex: "cantidad",
      width: 90,
      align: "center",
      render: (text) => {
        const cantidad = parseFloat(text) || 0;
        return <Text strong>{cantidad.toFixed(3)}</Text>;
      },
    },
    {
      title: "PRECIO ORIG.",
      dataIndex: "precio_original",
      width: 100,
      align: "right",
      render: (text) => {
        if (!text || text === 0) return "-";
        return formatCurrency(text);
      },
    },
    {
      title: "PRECIO UNIT.",
      dataIndex: "precio_unitario",
      width: 120,
      align: "right",
      render: (text, record) => {
        const precio = text || record.precio_unitario_corregido || 0;
        return formatCurrency(precio);
      },
    },
    {
      title: "PRECIO BRUTO",
      dataIndex: "precio_bruto",
      width: 120,
      align: "right",
      render: (text, record) => {
        if (text && text > 0) return formatCurrency(text);

        // Calcular si no existe
        const cantidad = parseFloat(record.cantidad) || 0;
        const precioUnitario = parseFloat(record.precio_unitario) || 0;
        const precioBruto = cantidad * precioUnitario;
        return formatCurrency(precioBruto);
      },
    },
    {
      title: "DESC. 1",
      dataIndex: "descuento_1",
      width: 80,
      align: "center",
      render: (text) => {
        const desc = parseFloat(text) || 0;
        if (desc === 0) return "-";
        return `${desc.toFixed(2)}%`;
      },
    },
    {
      title: "DESC. 2",
      dataIndex: "descuento_2",
      width: 80,
      align: "center",
      render: (text) => {
        const desc = parseFloat(text) || 0;
        if (desc === 0) return "-";
        return `${desc.toFixed(2)}%`;
      },
    },
    {
      title: "DESCUENTO MONTO",
      dataIndex: "descuento_monto",
      width: 120,
      align: "right",
      render: (text, record) => {
        if (text && text > 0) return formatCurrency(text);

        // Calcular si no existe
        const cantidad = parseFloat(record.cantidad) || 0;
        const precioUnitario = parseFloat(record.precio_unitario) || 0;
        const subtotal = cantidad * precioUnitario;

        const desc1 = parseFloat(record.descuento_1) || 0;
        const desc2 = parseFloat(record.descuento_2) || 0;

        if (desc1 > 0 || desc2 > 0) {
          const descuento1 = subtotal * (desc1 / 100);
          const subtotalDespuesDesc1 = subtotal - descuento1;
          const descuento2 = subtotalDespuesDesc1 * (desc2 / 100);
          const totalDescuento = descuento1 + descuento2;
          return formatCurrency(totalDescuento);
        }

        return formatCurrency(0);
      },
    },
    {
      title: "VALOR VENTA",
      dataIndex: "valor_venta",
      width: 120,
      align: "right",
      render: (text) => {
        const valor = parseFloat(text) || 0;
        return (
          <Text strong style={{ color: "#faad14" }}>
            {formatCurrency(valor)}
          </Text>
        );
      },
    },
    {
      title: "IGV",
      dataIndex: "igv",
      width: 100,
      align: "right",
      render: (text, record) => {
        const igvCalculado =
          parseFloat(text) || parseFloat(record.valor_venta || 0) * 0.18;
        return <Text type="secondary">{formatCurrency(igvCalculado)}</Text>;
      },
    },
    {
      title: "SUBTOTAL",
      dataIndex: "precio_total",
      width: 130,
      align: "right",
      render: (text) => {
        const total = parseFloat(text) || 0;
        return (
          <Text strong style={{ color: "#1890ff" }}>
            {formatCurrency(total)}
          </Text>
        );
      },
    },
    {
      title: "IMPORTE USD",
      dataIndex: "importe_dolares",
      width: 120,
      align: "right",
      render: (text, record) => {
        const importe = parseFloat(text) || 0;
        if (importe > 0) {
          return formatDollars(importe);
        }

        // Calcular si no existe
        if (datos?.tipo_cambio > 0 && record.precio_total > 0) {
          const importeDolares =
            parseFloat(record.precio_total) / parseFloat(datos.tipo_cambio);
          return formatDollars(importeDolares);
        }

        return "N/A";
      },
    },
    {
      title: "FECHA ENTREGA",
      dataIndex: "fecha_entrega",
      width: 110,
      align: "center",
      render: (text) => {
        if (!text) return "N/A";
        return new Date(text).toLocaleDateString("es-PE");
      },
    },
    {
      title: "PRIORIDAD",
      dataIndex: "prioridad",
      width: 100,
      align: "center",
      render: (text, record) => {
        const prioridad = text || record.prioridad_item || datos.prioridad;
        return (
          <Tag
            color={
              {
                URGENTE: "red",
                "STOCK URGENTE": "orange",
                "STOCK NORMAL": "green",
                NORMAL: "blue",
              }[prioridad] || "default"
            }
          >
            {prioridad}
          </Tag>
        );
      },
    },
  ];

  // Calcular totales desde los detalles para verificación
  const calcularTotales = () => {
    let importeBruto = 0;
    let totalDescuentos = 0;
    let totalValorVenta = 0;
    let totalIGV = 0;

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

      const valorVenta =
        subtotal -
        (descuentoMonto > 0
          ? descuentoMonto
          : subtotal * (desc1 / 100) +
            (subtotal - subtotal * (desc1 / 100)) * (desc2 / 100));
      totalValorVenta += valorVenta;

      const igv = parseFloat(item.igv_item) || valorVenta * 0.18;
      totalIGV += igv;
    });

    return { importeBruto, totalDescuentos, totalValorVenta, totalIGV };
  };

  const { importeBruto, totalDescuentos, totalValorVenta, totalIGV } =
    calcularTotales();
  const totalCalculado = totalValorVenta + totalIGV;

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
                <Tag color="blue">
                  {datos.numero || `ID: ${cotizacion.id_cotizacion}`}
                </Tag>
                {/* Mostrar estado actual */}
                <Tag
                  color={
                    datos.estado === "APROBADO"
                      ? "green"
                      : datos.estado === "RECHAZADO"
                      ? "red"
                      : datos.estado === "PENDIENTE"
                      ? "orange"
                      : "default"
                  }
                  style={{ fontSize: "14px" }}
                >
                  {datos.estado || "PENDIENTE"}
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

                {/* Botones de aprobación/rechazo solo para cotizaciones pendientes */}
                {datos.estado === "PENDIENTE" && (
                  <>
                    <Button
                      type="primary"
                      danger
                      icon={<CloseCircleOutlined />}
                      onClick={() => rechazarCotizacion(datos.id_cotizacion)}
                      loading={loading}
                    >
                      Rechazar
                    </Button>
                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={() => aprobarCotizacion(datos.id_cotizacion)}
                      loading={loading}
                      style={{
                        backgroundColor: "#52c41a",
                        borderColor: "#52c41a",
                      }}
                    >
                      Aprobar
                    </Button>
                  </>
                )}

                {/* Botón Anular para cotizaciones que no están anuladas */}
                {datos.estado !== "ANULADO" && (
                  <Button
                    danger
                    icon={<StopOutlined />}
                    onClick={() => anularCotizacion(datos.id_cotizacion)}
                    loading={loading}
                  >
                    Anular
                  </Button>
                )}

                <Button
                  type="primary"
                  icon={<FilePdfOutlined />}
                  onClick={generarPDF}
                  loading={pdfLoading}
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
            scroll={{ x: 1500 }}
            size="small"
            summary={() => (
              <Table.Summary>
                <Table.Summary.Row style={{ background: "#fafafa" }}>
                  <Table.Summary.Cell index={0} colSpan={8} align="right">
                    <Text strong>TOTAL GENERAL:</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <Text strong>{formatCurrency(importeBruto)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} colSpan={2} align="center">
                    {/* Espacio para descuentos porcentuales */}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right">
                    <Text strong type="danger">
                      -{formatCurrency(totalDescuentos)}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right">
                    <Text strong style={{ color: "#faad14" }}>
                      {formatCurrency(totalValorVenta)}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} align="right">
                    <Text strong type="secondary">
                      {formatCurrency(totalIGV)}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6} align="right">
                    <Text strong style={{ color: "#52c41a", fontSize: "16px" }}>
                      {formatCurrency(totalCalculado)}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={7} align="right">
                    <Text strong style={{ color: "#1890ff" }}>
                      {formatDollars(importeDolaresMostrar)}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={8} colSpan={2} align="center">
                    {/* Espacio para fecha entrega y prioridad */}
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
                value={importeBruto}
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
                value={totalDescuentos}
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
                value={totalValorVenta}
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
                value={totalCalculado}
                precision={2}
                prefix="S/ "
                valueStyle={{ color: "#52c41a", fontSize: "18px" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Importe en Dólares (si aplica) */}
        {importeDolaresMostrar > 0 && (
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col xs={24} md={8} offset={8}>
              <Card
                size="small"
                title={
                  <Space>
                    <DollarOutlined />
                    <span>IMPORTE EN DÓLARES</span>
                  </Space>
                }
                style={{
                  background: "#f0f9ff",
                  border: "2px solid #1890ff",
                  textAlign: "center",
                }}
              >
                <Title level={3} style={{ color: "#1890ff", margin: 0 }}>
                  {formatDollars(importeDolaresMostrar)}
                </Title>
              </Card>
            </Col>
          </Row>
        )}

        {/* Desglose de Impuestos */}
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col xs={24} md={12}>
            <Card size="small" title="DESGLOSE DE IMPUESTOS">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Base Imponible">
                  <Text strong>{formatCurrency(totalValorVenta)}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="IGV (18%)">
                  <Text strong>{formatCurrency(totalIGV)}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Total">
                  <Text strong type="success">
                    {formatCurrency(totalCalculado)}
                  </Text>
                </Descriptions.Item>
                {importeDolaresMostrar > 0 && (
                  <Descriptions.Item label="Total en Dólares">
                    <Text strong style={{ color: "#1890ff" }}>
                      {formatDollars(importeDolaresMostrar)}
                    </Text>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card size="small" title="INFORMACIÓN ADICIONAL">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Línea de Crédito">
                  {formatCurrency(datos.linea_credito || 0)}
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
                {datos.tipo_cambio && (
                  <Descriptions.Item label="Tipo de Cambio">
                    <Text strong>
                      {parseFloat(datos.tipo_cambio).toFixed(4)}
                    </Text>
                  </Descriptions.Item>
                )}
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
            {importeDolaresMostrar > 0 && (
              <span>
                {" "}
                | Importe en dólares: {formatDollars(importeDolaresMostrar)}
              </span>
            )}
          </Text>
        </div>
      </div>
    </div>
  );
};

export default CotizacionDetalle;
