import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Tabs,
  Form,
  Row,
  Col,
  Select,
  DatePicker,
  Input,
  Button,
  Table,
  Space,
  Tag,
  message,
  Switch,
  Typography,
  Statistic,
  Badge,
  Divider,
} from "antd";
import {
  FilePdfOutlined,
  FileExcelOutlined,
  SearchOutlined,
  ReloadOutlined,
  BarChartOutlined,
  StockOutlined,
  SwapOutlined,
  ExportOutlined,
  AuditOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../api/api";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const REPORTES_BASE = "/almacen/reportes";

function toYMD(d) {
  if (!d) return undefined;
  return dayjs(d).format("YYYY-MM-DD");
}

async function downloadBlob(url, params, filename, mime) {
  const resp = await api.get(url, {
    params,
    responseType: "blob",
  });

  const blob = new Blob([resp.data], { type: mime });
  const blobUrl = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  window.URL.revokeObjectURL(blobUrl);
}

export default function ReportesAlmacen() {
  const [tab, setTab] = useState("kardex");

  // combos
  const [almacenes, setAlmacenes] = useState([]);
  const [operaciones, setOperaciones] = useState([]);
  const [productos, setProductos] = useState([]);
  const [productosLoading, setProductosLoading] = useState(false);

  // data
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState(null);

  // forms
  const [formKardex] = Form.useForm();
  const [formStock] = Form.useForm();
  const [formResumen] = Form.useForm();
  const [formTransf] = Form.useForm();
  const [formAudit] = Form.useForm();

  // Configuración visual de pestañas
  const tabConfig = {
    kardex: {
      label: "Kardex por producto",
      icon: <SwapOutlined />,
      color: "#1890ff",
      description: "Historial de movimientos de un producto específico"
    },
    stock: {
      label: "Stock por almacén",
      icon: <StockOutlined />,
      color: "#52c41a",
      description: "Inventario actual en cada almacén"
    },
    resumen: {
      label: "Entradas vs Salidas",
      icon: <BarChartOutlined />,
      color: "#722ed1",
      description: "Resumen comparativo de movimientos"
    },
    transferencias: {
      label: "Transferencias",
      icon: <ExportOutlined />,
      color: "#fa8c16",
      description: "Movimientos entre almacenes"
    },
    auditoria: {
      label: "Auditoría de notas",
      icon: <AuditOutlined />,
      color: "#f5222d",
      description: "Historial y estados de las notas"
    },
  };

  const currentTab = tabConfig[tab] || tabConfig.kardex;

  // ---------------------------
  // Cargar combos base
  // ---------------------------
  const fetchCombos = async () => {
    try {
      const [rAlm, rOps] = await Promise.all([
        api.get("/almacen/almacenes"),
        api.get("/cod-operacion"),
      ]);

      setAlmacenes(rAlm.data || []);
      setOperaciones(rOps.data?.data || rOps.data || []);
    } catch (e) {
      console.error(e);
      message.error("No se pudieron cargar combos.");
    }
  };

  useEffect(() => {
    fetchCombos();

    // defaults
    formResumen.setFieldsValue({ groupBy: "day" });
    formStock.setFieldsValue({ bajo_stock: false });
    formAudit.setFieldsValue({ tipo: undefined, estado: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------
  // Productos (búsqueda remota)
  // ---------------------------
  const searchProductos = async (q) => {
    try {
      setProductosLoading(true);
      const resp = await api.get("/almacen/productos", {
        params: { q: q || "", limit: 30 },
      });
      const list = resp.data?.data || resp.data || [];
      setProductos(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error("searchProductos error:", e);
      setProductos([]);
    } finally {
      setProductosLoading(false);
    }
  };

  useEffect(() => {
    searchProductos("");
  }, []);

  // ---------------------------
  // Helpers: ejecutar reportes
  // ---------------------------
  const runKardex = async (exportType) => {
    const v = await formKardex.validateFields();
    const [desde, hasta] = v.rango || [];

    const params = {
      id_producto: v.id_producto,
      almacen_id: v.almacen_id || undefined,
      tipo_movimiento: v.tipo_movimiento || undefined,
      desde: toYMD(desde),
      hasta: toYMD(hasta),
      export: exportType || undefined,
    };

    if (exportType === "pdf") {
      return downloadBlob(
        `${REPORTES_BASE}/kardex-producto`,
        params,
        `kardex_producto_${v.id_producto}.pdf`,
        "application/pdf"
      );
    }

    if (exportType === "excel") {
      return downloadBlob(
        `${REPORTES_BASE}/kardex-producto`,
        params,
        `kardex_producto_${v.id_producto}.xlsx`,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    }

    setLoading(true);
    try {
      const resp = await api.get(`${REPORTES_BASE}/kardex-producto`, { params });
      setRows(resp.data?.data || []);
      setTotals(resp.data?.totals || null);
    } catch (e) {
      console.error(e);
      message.error("No se pudo cargar Kardex.");
    } finally {
      setLoading(false);
    }
  };

  const runStock = async (exportType) => {
    const v = formStock.getFieldsValue();
    const params = {
      almacen_id: v.almacen_id || undefined,
      q: v.q || undefined,
      id_categoria: v.id_categoria || undefined,
      bajo_stock: v.bajo_stock ? "true" : "false",
      export: exportType || undefined,
    };

    if (exportType === "pdf") {
      return downloadBlob(
        `${REPORTES_BASE}/stock-almacen`,
        params,
        `stock_por_almacen.pdf`,
        "application/pdf"
      );
    }
    if (exportType === "excel") {
      return downloadBlob(
        `${REPORTES_BASE}/stock-almacen`,
        params,
        `stock_por_almacen.xlsx`,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    }

    setLoading(true);
    try {
      const resp = await api.get(`${REPORTES_BASE}/stock-almacen`, { params });
      setRows(resp.data?.data || []);
      setTotals(null);
    } catch (e) {
      console.error(e);
      message.error("No se pudo cargar Stock.");
    } finally {
      setLoading(false);
    }
  };

  const runResumen = async (exportType) => {
    const v = formResumen.getFieldsValue();
    const [desde, hasta] = v.rango || [];

    const params = {
      desde: toYMD(desde),
      hasta: toYMD(hasta),
      almacen_id: v.almacen_id || undefined,
      groupBy: v.groupBy || "day",
      export: exportType || undefined,
    };

    if (exportType === "pdf") {
      return downloadBlob(
        `${REPORTES_BASE}/resumen-entradas-salidas`,
        params,
        `resumen_entradas_salidas.pdf`,
        "application/pdf"
      );
    }
    if (exportType === "excel") {
      return downloadBlob(
        `${REPORTES_BASE}/resumen-entradas-salidas`,
        params,
        `resumen_entradas_salidas.xlsx`,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    }

    setLoading(true);
    try {
      const resp = await api.get(`${REPORTES_BASE}/resumen-entradas-salidas`, { params });
      setRows(resp.data?.data || []);
      setTotals(null);
    } catch (e) {
      console.error(e);
      message.error("No se pudo cargar Resumen.");
    } finally {
      setLoading(false);
    }
  };

  const runTransferencias = async (exportType) => {
    const v = formTransf.getFieldsValue();
    const [desde, hasta] = v.rango || [];

    const params = {
      desde: toYMD(desde),
      hasta: toYMD(hasta),
      almacen_salida: v.almacen_salida || undefined,
      almacen_destino: v.almacen_destino || undefined,
      id_producto: v.id_producto || undefined,
      export: exportType || undefined,
    };

    if (exportType === "pdf") {
      return downloadBlob(
        `${REPORTES_BASE}/transferencias`,
        params,
        `transferencias.pdf`,
        "application/pdf"
      );
    }
    if (exportType === "excel") {
      return downloadBlob(
        `${REPORTES_BASE}/transferencias`,
        params,
        `transferencias.xlsx`,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    }

    setLoading(true);
    try {
      const resp = await api.get(`${REPORTES_BASE}/transferencias`, { params });
      setRows(resp.data?.data || []);
      setTotals(null);
    } catch (e) {
      console.error(e);
      message.error("No se pudo cargar Transferencias.");
    } finally {
      setLoading(false);
    }
  };

  const runAuditoria = async (exportType) => {
    const v = formAudit.getFieldsValue();
    const [desde, hasta] = v.rango || [];

    const params = {
      tipo: v.tipo || undefined,
      estado: v.estado || undefined,
      usuario: v.usuario || undefined,
      desde: toYMD(desde),
      hasta: toYMD(hasta),
      export: exportType || undefined,
    };

    if (exportType === "pdf") {
      return downloadBlob(
        `${REPORTES_BASE}/auditoria-notas`,
        params,
        `auditoria_notas.pdf`,
        "application/pdf"
      );
    }
    if (exportType === "excel") {
      return downloadBlob(
        `${REPORTES_BASE}/auditoria-notas`,
        params,
        `auditoria_notas.xlsx`,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    }

    setLoading(true);
    try {
      const resp = await api.get(`${REPORTES_BASE}/auditoria-notas`, { params });
      setRows(resp.data?.data || []);
      setTotals(null);
    } catch (e) {
      console.error(e);
      message.error("No se pudo cargar Auditoría.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // Columnas dinámicas por tab
  // ---------------------------
  const columns = useMemo(() => {
    if (tab === "kardex") {
      return [
        { title: "Fecha", dataIndex: "fecha_movimiento", key: "fecha_movimiento", width: 120 },
        { 
          title: "Tipo", 
          dataIndex: "tipo_movimiento", 
          key: "tipo_movimiento", 
          width: 120,
          render: (text) => {
            const color = text === "INGRESO" ? "green" : text === "SALIDA" ? "red" : "blue";
            return <Tag color={color}>{text}</Tag>;
          }
        },
        { title: "Documento", dataIndex: "documento_codigo", key: "documento_codigo", width: 100 },
        { title: "Operación", dataIndex: "operacion_nombre", key: "operacion_nombre", width: 150 },
        { title: "Origen", dataIndex: "origen", key: "origen", width: 120 },
        { title: "Almacén", dataIndex: "almacen_nombre", key: "almacen_nombre", width: 150 },
        { title: "Cantidad", dataIndex: "cantidad", key: "cantidad", width: 90 },
        { title: "Stock Actual", dataIndex: "stock_actual", key: "stock_actual", width: 110 },
        { title: "Lote", dataIndex: "lote", key: "lote", width: 100 },
        { title: "Serie", dataIndex: "serie_producto", key: "serie_producto", width: 120 },
      ];
    }

    if (tab === "stock") {
      return [
        { title: "Almacén", dataIndex: "almacen_nombre", key: "almacen_nombre", width: 150 },
        { title: "Código", dataIndex: "producto_codigo", key: "producto_codigo", width: 120 },
        { title: "Producto", dataIndex: "producto_descripcion", key: "producto_descripcion", width: 250 },
        { 
          title: "Stock", 
          dataIndex: "stock", 
          key: "stock", 
          width: 100,
          render: (text, record) => {
            const isLow = record.stock_minimo && text < record.stock_minimo;
            return (
              <Text type={isLow ? "danger" : "success"} strong>
                {text}
              </Text>
            );
          }
        },
        { title: "Mínimo", dataIndex: "stock_minimo", key: "stock_minimo", width: 90 },
        { title: "Máximo", dataIndex: "stock_maximo", key: "stock_maximo", width: 90 },
        { title: "Actualizado", dataIndex: "actualizado_en", key: "actualizado_en", width: 170 },
      ];
    }

    if (tab === "resumen") {
      return [
        { title: "Periodo", dataIndex: "periodo", key: "periodo", width: 120 },
        { 
          title: "Total Ingreso", 
          dataIndex: "total_ingreso", 
          key: "total_ingreso", 
          width: 120,
          render: (text) => <Tag color="green">+{text}</Tag>
        },
        { 
          title: "Total Salida", 
          dataIndex: "total_salida", 
          key: "total_salida", 
          width: 120,
          render: (text) => <Tag color="red">-{text}</Tag>
        },
      ];
    }

    if (tab === "transferencias") {
      return [
        { title: "Transferencia", dataIndex: "transferencia_key", key: "transferencia_key", width: 150 },
        { title: "Fecha", dataIndex: "fecha", key: "fecha", width: 120 },
        { title: "Desde", dataIndex: "almacen_salida_nombre", key: "almacen_salida_nombre", width: 150 },
        { title: "Hacia", dataIndex: "almacen_destino_nombre", key: "almacen_destino_nombre", width: 150 },
        { title: "Código", dataIndex: "producto_codigo", key: "producto_codigo", width: 120 },
        { title: "Producto", dataIndex: "producto_descripcion", key: "producto_descripcion", width: 200 },
        { title: "Cantidad", dataIndex: "cantidad_total", key: "cantidad_total", width: 100 },
      ];
    }

    // auditoria
    return [
      { title: "Fecha", dataIndex: "fecha_nota", key: "fecha_nota", width: 120 },
      { title: "Documento", dataIndex: "documento_codigo", key: "documento_codigo", width: 100 },
      { title: "Número", dataIndex: "numero", key: "numero", width: 100 },
      {
        title: "Estado",
        dataIndex: "estado",
        key: "estado",
        width: 120,
        render: (v) => {
          const color = v === "CONFIRMADO" ? "green" : v === "ANULADO" ? "red" : "gold";
          return <Tag color={color}>{v}</Tag>;
        },
      },
      { title: "Operación", dataIndex: "operacion_nombre", key: "operacion_nombre", width: 150 },
      { title: "Almacén Origen", dataIndex: "almacen_salida_nombre", key: "almacen_salida_nombre", width: 150 },
      { title: "Almacén Destino", dataIndex: "almacen_destino_nombre", key: "almacen_destino_nombre", width: 150 },
      { title: "Usuario", dataIndex: "usuario_registro_nombre", key: "usuario_registro_nombre", width: 120 },
    ];
  }, [tab]);

  const renderActions = (runFn) => (
    <Space>
      <Button 
        icon={<SearchOutlined />} 
        type="primary" 
        onClick={() => runFn()}
        style={{
          borderRadius: 8,
          padding: '6px 16px',
          height: 'auto',
        }}
      >
        Consultar
      </Button>
      <Button 
        icon={<FilePdfOutlined />} 
        onClick={() => runFn("pdf")}
        style={{
          borderRadius: 8,
          padding: '6px 16px',
          height: 'auto',
          background: '#fafafa',
          border: '1px solid #d9d9d9'
        }}
      >
        Exportar PDF
      </Button>
      <Button 
        icon={<FileExcelOutlined />} 
        onClick={() => runFn("excel")}
        style={{
          borderRadius: 8,
          padding: '6px 16px',
          height: 'auto',
          background: '#fafafa',
          border: '1px solid #d9d9d9'
        }}
      >
        Exportar Excel
      </Button>
      <Button 
        icon={<ReloadOutlined />} 
        onClick={() => { setRows([]); setTotals(null); }}
        style={{
          borderRadius: 8,
          padding: '6px 16px',
          height: 'auto',
          background: '#fafafa',
          border: '1px solid #d9d9d9'
        }}
      >
        Limpiar
      </Button>
    </Space>
  );

  return (
    <div style={{ padding: 16 }}>
      {/* Encabezado */}
      <Card
        style={{
          marginBottom: 16,
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
          border: '1px solid #f0f0f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${currentTab.color}40, ${currentTab.color}20)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${currentTab.color}30`
            }}>
              {React.cloneElement(currentTab.icon, {
                style: { 
                  fontSize: 28, 
                  color: currentTab.color,
                  filter: 'brightness(0.9)'
                }
              })}
            </div>
            
            <div>
              <Title level={3} style={{ margin: 0 }}>
                Reportes de Almacén
              </Title>
              <Space size={8} style={{ marginTop: 4 }}>
                <Badge 
                  color={currentTab.color} 
                  text={
                    <Text strong style={{ color: currentTab.color }}>
                      {currentTab.label}
                    </Text>
                  } 
                />
                <Text type="secondary">
                  {currentTab.description}
                </Text>
              </Space>
            </div>
          </div>
          
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <strong>Registros:</strong> {rows.length} • 
              <strong> Fecha:</strong> {dayjs().format('DD/MM/YYYY')}
            </Text>
          </div>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        {/* Pestañas personalizadas */}
        <Tabs
          activeKey={tab}
          onChange={(k) => {
            setTab(k);
            setRows([]);
            setTotals(null);
          }}
          tabBarStyle={{ margin: 0 }}
          items={Object.entries(tabConfig).map(([key, config]) => ({
            key,
            label: (
              <Space size={6}>
                {config.icon}
                <span>{config.label}</span>
              </Space>
            ),
            children: null,
          }))}
        />
      </Card>

      {/* Formulario del reporte actual */}
      <Card>

        {tab === "kardex" && (
          <Form form={formKardex} layout="vertical">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12} lg={8}>
                <Form.Item
                  label="Producto"
                  name="id_producto"
                  rules={[{ required: true, message: "Seleccione un producto" }]}
                >
                  <Select
                    showSearch
                    placeholder="Buscar producto..."
                    filterOption={false}
                    onSearch={searchProductos}
                    loading={productosLoading}
                    style={{ width: '100%' }}
                    options={(productos || []).map((p) => ({
                      value: p.id_producto,
                      label: `${p.codigo} - ${p.descripcion}`,
                    }))}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12} lg={6}>
                <Form.Item label="Almacén (opcional)" name="almacen_id">
                  <Select
                    allowClear
                    placeholder="Todos los almacenes"
                    style={{ width: '100%' }}
                    options={almacenes.map((a) => ({
                      value: a.id_alm,
                      label: a.nombre,
                    }))}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12} lg={6}>
                <Form.Item label="Tipo de movimiento" name="tipo_movimiento">
                  <Select
                    allowClear
                    placeholder="Todos los tipos"
                    style={{ width: '100%' }}
                    options={[
                      { value: "INGRESO", label: "INGRESO" },
                      { value: "SALIDA", label: "SALIDA" },
                      { value: "AJUSTE", label: "AJUSTE" },
                      { value: "TRANSFERENCIA", label: "TRANSFERENCIA" },
                    ]}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12} lg={10}>
                <Form.Item label="Rango de fechas" name="rango">
                  <RangePicker 
                    style={{ width: '100%' }}
                    placeholder={['Fecha inicio', 'Fecha fin']}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider style={{ margin: '16px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {renderActions(runKardex)}
              {totals && (
                <Space>
                  <Statistic
                    title="Total Ingresos"
                    value={totals.ingreso}
                    valueStyle={{ color: '#3f8600' }}
                    prefix={<span style={{ fontSize: 12 }}>+</span>}
                  />
                  <Statistic
                    title="Total Salidas"
                    value={totals.salida}
                    valueStyle={{ color: '#cf1322' }}
                    prefix={<span style={{ fontSize: 12 }}>-</span>}
                  />
                </Space>
              )}
            </div>
          </Form>
        )}

        {tab === "stock" && (
          <Form form={formStock} layout="vertical">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12} lg={8}>
                <Form.Item label="Almacén" name="almacen_id">
                  <Select
                    allowClear
                    placeholder="Seleccione almacén"
                    style={{ width: '100%' }}
                    options={almacenes.map((a) => ({
                      value: a.id_alm,
                      label: a.nombre,
                    }))}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12} lg={8}>
                <Form.Item label="Buscar producto" name="q">
                  <Input 
                    placeholder="Código o descripción..." 
                    prefix={<SearchOutlined />}
                    allowClear
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12} lg={8}>
                <Form.Item label="Filtrar por stock" name="bajo_stock" valuePropName="checked">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Switch />
                    <Text>Mostrar solo productos con stock bajo</Text>
                  </div>
                </Form.Item>
              </Col>
            </Row>

            <Divider style={{ margin: '16px 0' }} />
            {renderActions(runStock)}
          </Form>
        )}

        {tab === "resumen" && (
          <Form form={formResumen} layout="vertical">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12} lg={8}>
                <Form.Item label="Rango de fechas" name="rango">
                  <RangePicker 
                    style={{ width: '100%' }}
                    placeholder={['Fecha inicio', 'Fecha fin']}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12} lg={8}>
                <Form.Item label="Almacén" name="almacen_id">
                  <Select
                    allowClear
                    placeholder="Todos los almacenes"
                    style={{ width: '100%' }}
                    options={almacenes.map((a) => ({
                      value: a.id_alm,
                      label: a.nombre,
                    }))}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12} lg={8}>
                <Form.Item label="Agrupar por" name="groupBy">
                  <Select
                    style={{ width: '100%' }}
                    options={[
                      { value: "day", label: "Día" },
                      { value: "month", label: "Mes" },
                      { value: "year", label: "Año" },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider style={{ margin: '16px 0' }} />
            {renderActions(runResumen)}
          </Form>
        )}

        {tab === "transferencias" && (
          <Form form={formTransf} layout="vertical">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12} lg={8}>
                <Form.Item label="Rango de fechas" name="rango">
                  <RangePicker 
                    style={{ width: '100%' }}
                    placeholder={['Fecha inicio', 'Fecha fin']}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12} lg={7}>
                <Form.Item label="Almacén origen" name="almacen_salida">
                  <Select
                    allowClear
                    placeholder="Seleccione origen"
                    style={{ width: '100%' }}
                    options={almacenes.map((a) => ({ value: a.id_alm, label: a.nombre }))}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12} lg={7}>
                <Form.Item label="Almacén destino" name="almacen_destino">
                  <Select
                    allowClear
                    placeholder="Seleccione destino"
                    style={{ width: '100%' }}
                    options={almacenes.map((a) => ({ value: a.id_alm, label: a.nombre }))}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12} lg={10}>
                <Form.Item label="Producto (opcional)" name="id_producto">
                  <Select
                    showSearch
                    allowClear
                    placeholder="Buscar producto específico..."
                    filterOption={false}
                    onSearch={searchProductos}
                    loading={productosLoading}
                    style={{ width: '100%' }}
                    options={(productos || []).map((p) => ({
                      value: p.id_producto,
                      label: `${p.codigo} - ${p.descripcion}`,
                    }))}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider style={{ margin: '16px 0' }} />
            {renderActions(runTransferencias)}
          </Form>
        )}

        {tab === "auditoria" && (
          <Form form={formAudit} layout="vertical">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12} lg={8}>
                <Form.Item label="Rango de fechas" name="rango">
                  <RangePicker 
                    style={{ width: '100%' }}
                    placeholder={['Fecha inicio', 'Fecha fin']}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12} lg={6}>
                <Form.Item label="Tipo de nota" name="tipo">
                  <Select
                    allowClear
                    placeholder="Todos los tipos"
                    style={{ width: '100%' }}
                    options={[
                      { value: "INGRESO", label: "INGRESO" },
                      { value: "SALIDA", label: "SALIDA" },
                      { value: "TRANSFERENCIA", label: "TRANSFERENCIA" },
                    ]}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12} lg={6}>
                <Form.Item label="Estado" name="estado">
                  <Select
                    allowClear
                    placeholder="Todos los estados"
                    style={{ width: '100%' }}
                    options={[
                      { value: "BORRADOR", label: "BORRADOR" },
                      { value: "CONFIRMADO", label: "CONFIRMADO" },
                      { value: "ANULADO", label: "ANULADO" },
                    ]}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12} lg={6}>
                <Form.Item label="Usuario (ID)" name="usuario">
                  <Input placeholder="Ej: 12" />
                </Form.Item>
              </Col>
            </Row>

            <Divider style={{ margin: '16px 0' }} />
            {renderActions(runAuditoria)}
          </Form>
        )}
      </Card>

      {/* Resultados */}
      {rows.length > 0 && (
        <Card style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={5} style={{ margin: 0 }}>
              Resultados del reporte
            </Title>
            <Tag color="blue">{rows.length} registros encontrados</Tag>
          </div>
          
          <Table
            rowKey={(r, i) => r.id_movimiento || r.id_nota || r.id || i}
            loading={loading}
            columns={columns}
            dataSource={rows}
            pagination={{ 
              pageSize: 20, 
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} registros`
            }}
            scroll={{ x: 1300 }}
            size="middle"
          />
        </Card>
      )}
    </div>
  );
}