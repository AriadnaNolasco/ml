import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  message,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { EyeOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../api/api";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const TIPO_COLOR = {
  INGRESO: "green",
  SALIDA: "volcano",
  AJUSTE: "blue",
};

const ORIGEN_TAG = {
  "O/C": "cyan",
  "O/F": "geekblue",
  "O/T": "purple",
  CLIENTE: "gold",
  PROVEEDOR: "magenta",
  PRODUCCION: "green",
  AJUSTE: "orange",
  INTERNO: "default",
  DEVOLUCION: "red",
};

function toISODate(d) {
  // d: dayjs
  return d ? d.format("YYYY-MM-DD") : null;
}

export default function Movimientos() {
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modal detalle
  const [openDetalle, setOpenDetalle] = useState(false);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [detalleCab, setDetalleCab] = useState(null);
  const [detalleItems, setDetalleItems] = useState([]);
  const [movIdSel, setMovIdSel] = useState(null);

  const fetchMovimientos = async (opts = {}) => {
    try {
      setLoading(true);

      const values = form.getFieldsValue();

      const params = {
        page: opts.page ?? page,
        pageSize: opts.pageSize ?? pageSize,
        tipo: values.tipo || undefined,
        origen: values.origen || undefined,
        q: values.q || undefined,
      };

      // fechas
      if (values.rango && values.rango.length === 2) {
        params.fecha_desde = toISODate(values.rango[0]);
        params.fecha_hasta = toISODate(values.rango[1]);
      }

      const resp = await api.get("/almacen/movimientos", { params });

      const payload = resp.data || {};
      setData(payload.data || []);
      setTotal(payload.total || 0);
      setPage(payload.page || params.page);
      setPageSize(payload.pageSize || params.pageSize);
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || err?.response?.data?.error;
      message.error(msg || "No se pudo cargar el historial de movimientos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // valores por defecto
    form.setFieldsValue({
      tipo: null,
      origen: null,
      q: "",
      rango: [dayjs().subtract(30, "day"), dayjs()],
    });
    // primera carga
    fetchMovimientos({ page: 1, pageSize });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openVerDetalle = async (id_movimiento) => {
    try {
      setMovIdSel(id_movimiento);
      setOpenDetalle(true);
      setLoadingDetalle(true);

      const resp = await api.get(`/almacen/movimientos/${id_movimiento}`);
      const payload = resp.data || {};

      setDetalleCab(payload.cabecera || null);
      setDetalleItems(payload.detalle || []);
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || err?.response?.data?.error;
      message.error(msg || "No se pudo cargar el detalle del movimiento");
      setOpenDetalle(false);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const closeDetalle = () => {
    setOpenDetalle(false);
    setMovIdSel(null);
    setDetalleCab(null);
    setDetalleItems([]);
  };

  const columns = useMemo(
    () => [
      {
        title: "ID",
        dataIndex: "id_movimiento",
        width: 90,
        fixed: "left",
        align: "center",
        render: (v) => <Text strong>{v}</Text>,
      },
      {
        title: "Tipo",
        dataIndex: "tipo_movimiento",
        width: 110,
        render: (tipo) => (
          <Tag color={TIPO_COLOR[tipo] || "default"} style={{ margin: 0 }}>
            {tipo}
          </Tag>
        ),
      },
      {
        title: "Operación",
        dataIndex: "operacion_nombre",
        ellipsis: true,
        render: (v, r) => (
          <Space direction="vertical" size={0}>
            <Text>{v}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {r.cod_operacion ? `Op ID: ${r.cod_operacion}` : ""}
            </Text>
          </Space>
        ),
      },
      {
        title: "Documento",
        dataIndex: "documento_nombre",
        ellipsis: true,
        render: (v, r) => (
          <Space direction="vertical" size={0}>
            <Text>
              {(r.documento_codigo || "").trim()} {v ? `- ${v}` : ""}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Nota: {r.id_nota ?? "—"}
            </Text>
          </Space>
        ),
      },
      {
        title: "Origen",
        dataIndex: "origen",
        width: 120,
        render: (o) => <Tag color={ORIGEN_TAG[o] || "default"}>{o}</Tag>,
      },
      {
        title: "Almacén",
        key: "almacen",
        width: 240,
        render: (_, r) => {
          const s = r.almacen_salida_nombre || "—";
          const d = r.almacen_destino_nombre || "—";
          if (r.tipo_movimiento === "INGRESO") return <Text>{d}</Text>;
          if (r.tipo_movimiento === "SALIDA") return <Text>{s}</Text>;
          return (
            <Space direction="vertical" size={0}>
              <Text>Salida: {s}</Text>
              <Text>Destino: {d}</Text>
            </Space>
          );
        },
      },
      {
        title: "Tercero",
        key: "tercero",
        width: 240,
        ellipsis: true,
        render: (_, r) => {
          const cliente = r.cliente_nombre;
          const proveedor = r.proveedor_nombre;

          if (cliente) return <Text>Cliente: {cliente}</Text>;
          if (proveedor) return <Text>Proveedor: {proveedor}</Text>;
          return <Text type="secondary">—</Text>;
        },
      },
      {
        title: "Doc. Comercial",
        key: "docCom",
        width: 200,
        render: (_, r) => {
          const td = r.tipo_documento_nombre;
          const serie = r.serie;
          const num = r.numero_documento;

          if (!td && !serie && !num) return <Text type="secondary">—</Text>;

          return (
            <Space direction="vertical" size={0}>
              <Text>{td || "Documento"}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {serie ? `${serie}-` : ""}{num || ""}
              </Text>
            </Space>
          );
        },
      },
      {
        title: "Fecha",
        dataIndex: "fecha_movimiento",
        width: 170,
        render: (f) => (
          <Space direction="vertical" size={0}>
            <Text>{f ? dayjs(f).format("DD/MM/YYYY") : "—"}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {f ? dayjs(f).format("HH:mm") : ""}
            </Text>
          </Space>
        ),
      },
      {
        title: "Acciones",
        key: "acciones",
        width: 110,
        fixed: "right",
        render: (_, r) => (
          <Space>
            <Tooltip title="Ver detalle">
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => openVerDetalle(r.id_movimiento)}
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    []
  );

  const columnsDetalle = useMemo(
    () => [
      {
        title: "Item",
        width: 70,
        render: (_, __, idx) => idx + 1,
      },
      {
        title: "Producto",
        dataIndex: "producto_codigo",
        width: 140,
        render: (_, r) => (
          <Space direction="vertical" size={0}>
            <Text strong>{r.producto_codigo}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {r.producto_descripcion}
            </Text>
          </Space>
        ),
      },
      {
        title: "Almacén",
        dataIndex: "almacen_nombre",
        width: 220,
      },
      {
        title: "UM",
        dataIndex: "unidad_medida",
        width: 110,
      },
      {
        title: "Cantidad",
        dataIndex: "cantidad",
        width: 120,
        align: "right",
        render: (v) =>
          v != null
            ? Number(v).toLocaleString("es-PE", { minimumFractionDigits: 3, maximumFractionDigits: 3 })
            : "",
      },
      {
        title: "Stock (Antes → Después)",
        key: "stock",
        width: 210,
        render: (_, r) => {
          const a = r.stock_actual ?? "—";
          const b = r.stock_resultante ?? "—";
          return (
            <Text>
              {a} → {b}
            </Text>
          );
        },
      },
      {
        title: "Trazabilidad",
        key: "traza",
        render: (_, r) => {
          const parts = [];
          if (r.lote) parts.push(`Lote: ${r.lote}`);
          if (r.serie_producto) parts.push(`Serie: ${r.serie_producto}`);
          if (r.fecha_vencimiento) parts.push(`Vence: ${dayjs(r.fecha_vencimiento).format("DD/MM/YYYY")}`);
          return parts.length ? <Text>{parts.join(" | ")}</Text> : <Text type="secondary">—</Text>;
        },
      },
      {
        title: "Comentario",
        dataIndex: "comentario",
        ellipsis: true,
        render: (t) => (t ? <Text>{t}</Text> : <Text type="secondary">—</Text>),
      },
    ],
    []
  );

  const headerExtra = (
    <Space>
      <Button
        icon={<ReloadOutlined />}
        onClick={() => fetchMovimientos({ page: 1, pageSize })}
        disabled={loading}
      >
        Recargar
      </Button>
    </Space>
  );

  const onBuscar = () => {
    setPage(1);
    fetchMovimientos({ page: 1, pageSize });
  };

  const onReset = () => {
    form.resetFields();
    form.setFieldsValue({
      tipo: null,
      origen: null,
      q: "",
      rango: [dayjs().subtract(30, "day"), dayjs()],
    });
    setPage(1);
    fetchMovimientos({ page: 1, pageSize });
  };

  return (
    <div style={{ padding: 24 }}>
      <Card
        style={{ borderRadius: 14 }}
        bodyStyle={{ padding: 18 }}
        title={
          <Space>
            <Title level={4} style={{ margin: 0 }}>
              Historial de Movimientos
            </Title>
            <Tag color="blue">ALMACÉN</Tag>
          </Space>
        }
        extra={headerExtra}
      >
        {/* FILTROS */}
        <div
          style={{
            background: "#fafafa",
            border: "1px solid #f0f0f0",
            borderRadius: 12,
            padding: 14,
            marginBottom: 14,
          }}
        >
          <Form form={form} layout="vertical">
            <Row gutter={12}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="Tipo" name="tipo">
                  <Select allowClear placeholder="Todos">
                    <Select.Option value="INGRESO">INGRESO</Select.Option>
                    <Select.Option value="SALIDA">SALIDA</Select.Option>
                    <Select.Option value="AJUSTE">AJUSTE</Select.Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item label="Origen" name="origen">
                  <Select allowClear placeholder="Todos">
                    {Object.keys(ORIGEN_TAG).map((k) => (
                      <Select.Option key={k} value={k}>
                        {k}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={8}>
                <Form.Item label="Rango de fechas" name="rango">
                  <RangePicker style={{ width: "100%" }} />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={4}>
                <Form.Item label="Buscar" name="q">
                  <Input
                    placeholder="ID, doc, guía..."
                    allowClear
                    prefix={<SearchOutlined />}
                    onPressEnter={onBuscar}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Space>
              <Button type="primary" onClick={onBuscar} loading={loading}>
                Buscar
              </Button>
              <Button onClick={onReset} disabled={loading}>
                Limpiar
              </Button>
            </Space>
          </Form>
        </div>

        <Table
          rowKey="id_movimiento"
          dataSource={data}
          columns={columns}
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
              fetchMovimientos({ page: p, pageSize: ps });
            },
          }}
        />
      </Card>

      {/* MODAL DETALLE */}
      <Modal
        open={openDetalle}
        onCancel={closeDetalle}
        footer={null}
        width={980}
        destroyOnClose
        title={
          <Space>
            <Text strong style={{ fontSize: 16 }}>
              Detalle Movimiento #{movIdSel ?? ""}
            </Text>
            {detalleCab?.tipo_movimiento && (
              <Tag color={TIPO_COLOR[detalleCab.tipo_movimiento] || "default"}>
                {detalleCab.tipo_movimiento}
              </Tag>
            )}
          </Space>
        }
      >
        {loadingDetalle ? (
          <div style={{ padding: 18 }}>
            <Text>Cargando detalle...</Text>
          </div>
        ) : (
          <>
            <div
              style={{
                background: "#fafafa",
                border: "1px solid #f0f0f0",
                borderRadius: 12,
                padding: 14,
                marginBottom: 12,
              }}
            >
              <Row gutter={12}>
                <Col xs={24} md={8}>
                  <Text type="secondary">Documento</Text>
                  <div>
                    <Text strong>
                      {(detalleCab?.documento_codigo || "").trim()} - {detalleCab?.documento_nombre || "—"}
                    </Text>
                  </div>
                </Col>

                <Col xs={24} md={8}>
                  <Text type="secondary">Operación</Text>
                  <div>
                    <Text strong>{detalleCab?.operacion_nombre || "—"}</Text>
                  </div>
                </Col>

                <Col xs={24} md={8}>
                  <Text type="secondary">Nota</Text>
                  <div>
                    <Text strong>{detalleCab?.id_nota ?? "—"}</Text>
                  </div>
                </Col>

                <Col xs={24} md={8} style={{ marginTop: 10 }}>
                  <Text type="secondary">Origen</Text>
                  <div>
                    {detalleCab?.origen ? (
                      <Tag color={ORIGEN_TAG[detalleCab.origen] || "default"}>{detalleCab.origen}</Tag>
                    ) : (
                      <Text>—</Text>
                    )}
                  </div>
                </Col>

                <Col xs={24} md={8} style={{ marginTop: 10 }}>
                  <Text type="secondary">Almacén</Text>
                  <div>
                    <Text strong>
                      {detalleCab?.tipo_movimiento === "INGRESO"
                        ? detalleCab?.almacen_destino_nombre || "—"
                        : detalleCab?.tipo_movimiento === "SALIDA"
                        ? detalleCab?.almacen_salida_nombre || "—"
                        : `S: ${detalleCab?.almacen_salida_nombre || "—"} | D: ${detalleCab?.almacen_destino_nombre || "—"}`}
                    </Text>
                  </div>
                </Col>

                <Col xs={24} md={8} style={{ marginTop: 10 }}>
                  <Text type="secondary">Fecha</Text>
                  <div>
                    <Text strong>
                      {detalleCab?.fecha_movimiento ? dayjs(detalleCab.fecha_movimiento).format("DD/MM/YYYY HH:mm") : "—"}
                    </Text>
                  </div>
                </Col>

                <Col xs={24} md={12} style={{ marginTop: 10 }}>
                  <Text type="secondary">Cliente / Proveedor</Text>
                  <div>
                    <Text strong>
                      {detalleCab?.cliente_nombre
                        ? `Cliente: ${detalleCab.cliente_nombre}`
                        : detalleCab?.proveedor_nombre
                        ? `Proveedor: ${detalleCab.proveedor_nombre}`
                        : "—"}
                    </Text>
                  </div>
                </Col>

                <Col xs={24} md={12} style={{ marginTop: 10 }}>
                  <Text type="secondary">Doc. Comercial</Text>
                  <div>
                    <Text strong>
                      {detalleCab?.tipo_documento_nombre
                        ? `${detalleCab.tipo_documento_nombre} ${detalleCab?.serie ? detalleCab.serie + "-" : ""}${detalleCab?.numero_documento || ""}`
                        : "—"}
                    </Text>
                  </div>
                </Col>
              </Row>

              <Divider style={{ margin: "10px 0" }} />

              <Text type="secondary">Observaciones</Text>
              <div>
                <Text>{detalleCab?.observaciones || "—"}</Text>
              </div>
            </div>

            <Table
              rowKey={(r) => r.id_detalle}
              dataSource={detalleItems}
              columns={columnsDetalle}
              pagination={false}
              size="small"
              scroll={{ x: 1100 }}
              style={{ borderRadius: 12, overflow: "hidden" }}
            />
          </>
        )}
      </Modal>
    </div>
  );
}
