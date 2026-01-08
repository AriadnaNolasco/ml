// Kardex.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import {
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Input,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
  Statistic,
  Tooltip,
} from "antd";
import { SearchOutlined, ReloadOutlined, EyeOutlined, FilePdfOutlined, FileExcelOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const TIPO_COLOR = {
  INGRESO: "green",
  SALIDA: "red",
  AJUSTE: "blue",
};

export default function Kardex() {
  const [productos, setProductos] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [resumen, setResumen] = useState(null);

  const [f, setF] = useState({
    id_producto: null,
    almacen_id: null,
    tipo_movimiento: null,
    rango: [null, null],
    q: "",
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const modo = f.id_producto ? "producto" : "feed";

  const fetchCombos = async () => {
    try {
      const [pRes, aRes] = await Promise.all([
        api.get("/almacen/productos"),
        api.get("/almacen/almacenes"),
      ]);
      setProductos(pRes.data?.data || pRes.data || []);
      setAlmacenes(aRes.data || []);
    } catch (e) {
      console.error(e);
      message.error("No se pudieron cargar productos/almacenes");
    }
  };

  const fetchResumen = async (id_producto, almacen_id) => {
    if (!id_producto) {
      setResumen(null);
      return;
    }
    try {
      const resp = await api.get("/almacen/kardex/resumen", {
        params: { id_producto, almacen_id: almacen_id || undefined },
      });
      setResumen(resp.data);
    } catch (e) {
      console.error(e);
      setResumen(null);
    }
  };

  const fetchKardex = async () => {
    const [d1, d2] = f.rango || [];

    const params = {
      id_producto: f.id_producto || undefined,
      almacen_id: f.almacen_id || undefined,
      tipo_movimiento: f.tipo_movimiento || undefined,
      fecha_desde: d1 ? dayjs(d1).format("YYYY-MM-DD") : undefined,
      fecha_hasta: d2 ? dayjs(d2).format("YYYY-MM-DD") : undefined,
      q: f.q?.trim() || undefined,
      page,
      pageSize,
    };

    try {
      setLoading(true);
      const resp = await api.get("/almacen/kardex", { params });
      setData(resp.data?.data || []);
      setTotal(resp.data?.total || 0);
    } catch (e) {
      console.error(e);
      message.error(e?.response?.data?.message || "No se pudo cargar el kárdex");
    } finally {
      setLoading(false);
    }
  };

  const buildExportParams = () => {
    const [d1, d2] = f.rango || [];
    return {
      id_producto: f.id_producto || undefined,
      almacen_id: f.almacen_id || undefined,
      tipo_movimiento: f.tipo_movimiento || undefined,
      fecha_desde: d1 ? dayjs(d1).format("YYYY-MM-DD") : undefined,
      fecha_hasta: d2 ? dayjs(d2).format("YYYY-MM-DD") : undefined,
      q: f.q?.trim() || undefined,
    };
  };

  const downloadFile = async (url, filename) => {
    try {
      const params = buildExportParams();
      const resp = await api.get(url, { params, responseType: "blob" });

      const blob = new Blob([resp.data]);
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(link.href);
    } catch (e) {
      console.error(e);
      message.error("No se pudo exportar");
    }
  };

  useEffect(() => {
    fetchCombos();
  }, []);

  // cuando cambian filtros principales, reset page
  useEffect(() => {
    setPage(1);
    fetchResumen(f.id_producto, f.almacen_id);
  }, [f.id_producto, f.almacen_id]);

  // carga data
  useEffect(() => {
    fetchKardex();
  }, [f.id_producto, f.almacen_id, f.tipo_movimiento, f.rango, f.q, page, pageSize]);

  const ultimoMov = useMemo(() => {
    if (modo === "producto") {
      return resumen?.ultima_fecha || null;
    }
    // en feed, el backend ordena DESC, entonces data[0] es el último
    return data?.[0]?.fecha_movimiento || null;
  }, [modo, resumen, data]);

  const stockActual = useMemo(() => {
    if (!resumen?.stock?.length) return null;
    if (!f.id_producto || !f.almacen_id) return null;
    const row = resumen.stock.find((s) => Number(s.almacen_id) === Number(f.almacen_id));
    return row?.stock ?? null;
  }, [resumen, f.id_producto, f.almacen_id]);

  const columns = useMemo(
    () => [
      {
        title: "Fecha",
        dataIndex: "fecha_movimiento",
        width: 170,
        render: (v) => <Text>{v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "-"}</Text>,
      },
      {
        title: "Documento",
        width: 140,
        render: (_, r) => (
          <Space direction="vertical" size={0}>
            <Text strong>{(r.documento_codigo || "").trim()}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Mov: {r.id_movimiento} {r.id_nota ? `· Nota: ${r.id_nota}` : ""}
            </Text>
          </Space>
        ),
      },

      // ✅ Columna Producto (clave para el modo feed)
      {
        title: "Producto",
        width: 280,
        render: (_, r) => (
          <Space direction="vertical" size={0}>
            <Text strong>{(r.producto_codigo || "").trim()}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {r.producto_descripcion || "-"}
            </Text>
          </Space>
        ),
      },

      { title: "Operación", dataIndex: "operacion_nombre", ellipsis: true, width: 190 },
      { title: "Almacén", dataIndex: "almacen_nombre", ellipsis: true, width: 190 },

      {
        title: "Tipo",
        dataIndex: "tipo_movimiento",
        width: 110,
        render: (t) => (
          <Tag color={TIPO_COLOR[t] || "default"} style={{ margin: 0 }}>
            {t}
          </Tag>
        ),
      },
      {
        title: "Entrada",
        dataIndex: "entrada",
        width: 110,
        align: "right",
        render: (v) => <Text>{Number(v || 0).toFixed(3)}</Text>,
      },
      {
        title: "Salida",
        dataIndex: "salida",
        width: 110,
        align: "right",
        render: (v) => <Text>{Number(v || 0).toFixed(3)}</Text>,
      },
      {
        title: "Saldo",
        dataIndex: "stock_resultante",
        width: 120,
        align: "right",
        render: (v, r) => (
          <Space>
            <Badge color={r.tipo_movimiento === "SALIDA" ? "red" : "green"} />
            <Text strong>{Number(v ?? 0).toFixed(3)}</Text>
          </Space>
        ),
      },
      { title: "Obs.", dataIndex: "comentario", ellipsis: true },

      // ✅ acción ERP: ver kárdex del producto
      {
        title: "",
        key: "acciones",
        width: 70,
        fixed: "right",
        render: (_, r) => (
          <Tooltip title="Ver kárdex del producto">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => {
                setF((prev) => ({ ...prev, id_producto: r.id_producto }));
              }}
            />
          </Tooltip>
        ),
      },
    ],
    []
  );

  return (
    <div style={{ padding: 24 }}>
      <Card
        style={{ borderRadius: 14 }}
        bodyStyle={{ padding: 18 }}
        title={
          <Space>
            <Title level={4} style={{ margin: 0 }}>
              Kárdex (Físico)
            </Title>
            <Tag color="blue">ALMACÉN</Tag>
            <Tag color={modo === "feed" ? "gold" : "geekblue"}>
              {modo === "feed" ? "Últimos movimientos" : "Kárdex por producto"}
            </Tag>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<FilePdfOutlined />}
              onClick={() => downloadFile("/almacen/kardex/export/pdf", "kardex.pdf")}
            >
              Exportar PDF
            </Button>
            <Button
              icon={<FileExcelOutlined />}
              onClick={() => downloadFile("/almacen/kardex/export/excel", "kardex.xlsx")}
            >
              Exportar Excel
            </Button>

            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                fetchResumen(f.id_producto, f.almacen_id);
                fetchKardex();
              }}
            >
              Refrescar
            </Button>
          </Space>
        }
      >
        {/* FILTROS */}
        <div
          style={{
            background: "#fafafa",
            borderRadius: 12,
            padding: 14,
            border: "1px solid #f0f0f0",
            marginBottom: 14,
          }}
        >
          <Row gutter={12}>
            <Col span={8}>
              <Text type="secondary">Producto</Text>
              <Select
                value={f.id_producto}
                onChange={(v) => setF((prev) => ({ ...prev, id_producto: v }))}
                showSearch
                allowClear
                placeholder="Todos (últimos movimientos)"
                style={{ width: "100%" }}
                optionFilterProp="data-search"
                filterOption={(input, option) =>
                  (option?.["data-search"] || "").toLowerCase().includes(input.toLowerCase())
                }
              >
                {productos.map((p) => (
                  <Select.Option
                    key={p.id_producto}
                    value={p.id_producto}
                    data-search={`${p.codigo || ""} ${p.descripcion || ""}`.toLowerCase()}
                  >
                    {(p.codigo || "").trim()} - {p.descripcion}
                  </Select.Option>
                ))}
              </Select>
            </Col>

            <Col span={6}>
              <Text type="secondary">Almacén</Text>
              <Select
                value={f.almacen_id}
                onChange={(v) => setF((prev) => ({ ...prev, almacen_id: v }))}
                placeholder="Todos"
                style={{ width: "100%" }}
                allowClear
              >
                {almacenes.map((a) => (
                  <Select.Option key={a.id_alm} value={a.id_alm}>
                    {a.nombre}
                  </Select.Option>
                ))}
              </Select>
            </Col>

            <Col span={4}>
              <Text type="secondary">Tipo</Text>
              <Select
                value={f.tipo_movimiento}
                onChange={(v) => setF((prev) => ({ ...prev, tipo_movimiento: v }))}
                placeholder="Todos"
                style={{ width: "100%" }}
                allowClear
              >
                <Select.Option value="INGRESO">INGRESO</Select.Option>
                <Select.Option value="SALIDA">SALIDA</Select.Option>
                <Select.Option value="AJUSTE">AJUSTE</Select.Option>
              </Select>
            </Col>

            <Col span={6}>
              <Text type="secondary">Rango</Text>
              <RangePicker
                value={f.rango}
                onChange={(v) => setF((prev) => ({ ...prev, rango: v }))}
                style={{ width: "100%" }}
              />
            </Col>
          </Row>

          <Row gutter={12} style={{ marginTop: 10 }}>
            <Col span={18}>
              <Input
                value={f.q}
                onChange={(e) => setF((prev) => ({ ...prev, q: e.target.value }))}
                placeholder="Buscar por documento, operación, almacén, código, descripción..."
                prefix={<SearchOutlined />}
                allowClear
              />
            </Col>
            <Col span={6}>
              <Button
                type="primary"
                block
                loading={loading}
                onClick={() => {
                  setPage(1);
                  fetchKardex();
                }}
              >
                Buscar
              </Button>
            </Col>
          </Row>

          {/* KPIs */}
          <Divider style={{ margin: "12px 0" }} />
          <Row gutter={12}>
            <Col span={8}>
              <Statistic
                title="Último movimiento"
                value={ultimoMov ? dayjs(ultimoMov).format("DD/MM/YYYY HH:mm") : "-"}
              />
            </Col>

            <Col span={8}>
              <Statistic
                title="Stock actual (almacén seleccionado)"
                value={
                  f.id_producto && f.almacen_id
                    ? stockActual !== null && stockActual !== undefined
                      ? Number(stockActual).toFixed(3)
                      : "-"
                    : "-"
                }
              />
              {!f.id_producto || !f.almacen_id ? (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Seleccione producto + almacén para ver stock.
                </Text>
              ) : null}
            </Col>

            <Col span={8}>
              <Statistic title="Registros encontrados" value={total} />
            </Col>
          </Row>
        </div>

        {/* TABLA */}
        <Table
          loading={loading}
          columns={columns}
          dataSource={data}
          rowKey="id_detalle"
          scroll={{ x: 1300 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>
    </div>
  );
}
