import { useEffect, useMemo, useState } from "react";
import {
  Card,
  Col,
  Row,
  Select,
  Input,
  Button,
  Table,
  Tag,
  Space,
  Typography,
  Divider,
  Statistic,
  message,
} from "antd";
import { ReloadOutlined, SearchOutlined, ClearOutlined } from "@ant-design/icons";
import api from "../../api/api";

const { Title, Text } = Typography;

const ESTADOS = [
  { value: "TODOS", label: "Todos" },
  { value: "SIN", label: "Sin stock" },
  { value: "BAJO", label: "Stock bajo" },
  { value: "OK", label: "Normal" },
  { value: "SOBRE", label: "Sobre stock" },
];

export default function ConsultaStock() {
  const [loading, setLoading] = useState(false);
  const [loadingExpand, setLoadingExpand] = useState(false);

  const [almacenes, setAlmacenes] = useState([]);
  const [categorias, setCategorias] = useState([]);

  const [filters, setFilters] = useState({
    q: "",
    almacen_id: "TODOS",
    estado: "TODOS",
    categoria_id: undefined,
    solo_con_stock: "0",
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [kpis, setKpis] = useState({
    total_items: 0,
    sin_stock: 0,
    stock_bajo: 0,
    ok: 0,
    sobre_stock: 0,
  });

  // Cache de detalle por producto (expand)
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [stockByProducto, setStockByProducto] = useState({}); // { [id_producto]: rows[] }

  const fetchCombos = async () => {
    try {
      const [almRes, catRes] = await Promise.all([
        api.get("/almacen/almacenes"),
        api.get("/almacen/categorias"),
      ]);
      setAlmacenes(almRes.data || []);
      setCategorias(catRes.data || []);
    } catch (e) {
      console.error(e);
      message.error("No se pudo cargar almacenes/categorías.");
    }
  };

  const fetchStock = async (opts = {}) => {
    try {
      setLoading(true);

      const params = {
        ...filters,
        page: opts.page ?? page,
        limit: opts.limit ?? limit,
      };

      // normaliza
      if (!params.q) delete params.q;
      if (!params.categoria_id) delete params.categoria_id;

      const resp = await api.get("/almacen/stock/consulta", { params });
      const payload = resp.data;

      setData(payload.rows || []);
      setTotal(payload.total || 0);
      setKpis(payload.kpis || kpis);
    } catch (e) {
      console.error(e);
      message.error("Error consultando stock.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCombos();
    // carga inicial
    fetchStock({ page: 1, limit });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onBuscar = () => {
    setPage(1);
    setExpandedRowKeys([]);
    fetchStock({ page: 1 });
  };

  const onLimpiar = () => {
    setFilters({
      q: "",
      almacen_id: "TODOS",
      estado: "TODOS",
      categoria_id: undefined,
      solo_con_stock: "0",
    });
    setPage(1);
    setExpandedRowKeys([]);
    // dispara consulta “limpia”
    setTimeout(() => fetchStock({ page: 1 }), 0);
  };

  const onRefrescar = () => {
    fetchStock();
  };

  const estadoTag = (row) => {
    const st = Number(row.stock || 0);
    const min = Number(row.stock_minimo || 0);
    const max = row.stock_maximo === null || row.stock_maximo === undefined ? null : Number(row.stock_maximo);

    if (st === 0) return <Tag color="default">SIN STOCK</Tag>;
    if (st > 0 && st <= min) return <Tag color="orange">BAJO</Tag>;
    if (max !== null && st > max) return <Tag color="red">SOBRE</Tag>;
    return <Tag color="green">NORMAL</Tag>;
  };

  const columns = useMemo(
    () => [
      {
        title: "Código",
        dataIndex: "producto_codigo",
        key: "producto_codigo",
        width: 120,
        sorter: (a, b) => String(a.producto_codigo).localeCompare(String(b.producto_codigo)),
        render: (v) => <Text strong>{v}</Text>,
      },
      {
        title: "Producto",
        dataIndex: "producto_descripcion",
        key: "producto_descripcion",
        ellipsis: true,
      },
      {
        title: "UM",
        dataIndex: "um",
        key: "um",
        width: 70,
        align: "center",
      },
      {
        title: "Categoría",
        dataIndex: "categoria",
        key: "categoria",
        width: 180,
        ellipsis: true,
      },
      {
        title: "Stock",
        dataIndex: "stock",
        key: "stock",
        width: 120,
        align: "right",
        render: (v) => <Text>{Number(v || 0).toFixed(3)}</Text>,
      },
      {
        title: "Mín",
        dataIndex: "stock_minimo",
        key: "stock_minimo",
        width: 110,
        align: "right",
        render: (v) => <Text type="secondary">{Number(v || 0).toFixed(3)}</Text>,
      },
      {
        title: "Máx",
        dataIndex: "stock_maximo",
        key: "stock_maximo",
        width: 110,
        align: "right",
        render: (v) => (v === null || v === undefined ? <Text type="secondary">—</Text> : <Text type="secondary">{Number(v).toFixed(3)}</Text>),
      },
      {
        title: "Estado",
        key: "estado",
        width: 110,
        render: (_, row) => estadoTag(row),
      },
      {
        title: "Actualizado",
        dataIndex: "actualizado_en",
        key: "actualizado_en",
        width: 160,
        render: (v) => (v ? new Date(v).toLocaleString() : "—"),
      },
    ],
    []
  );

  const fetchExpand = async (id_producto) => {
    try {
      setLoadingExpand(true);
      const resp = await api.get(`/almacen/stock/producto/${id_producto}/almacenes`);
      setStockByProducto((prev) => ({
        ...prev,
        [id_producto]: resp.data.rows || [],
      }));
    } catch (e) {
      console.error(e);
      message.error("No se pudo cargar el stock por almacenes.");
    } finally {
      setLoadingExpand(false);
    }
  };

  const expandedRowRender = (record) => {
    const rows = stockByProducto[record.id_producto] || [];

    if (!rows.length) {
    return (
        <Card size="small" bordered style={{ background: "#fafafa" }}>
        <Text type="secondary">Este producto no tiene stock en ningún almacén.</Text>
        </Card>
    );
    }

    const cols = [
      { title: "Código", dataIndex: "almacen_codigo", key: "almacen_codigo", width: 90 },
      { title: "Almacén", dataIndex: "almacen_nombre", key: "almacen_nombre" },
      { title: "Tipo", dataIndex: "tipo_alm", key: "tipo_alm", width: 110, render: (v) => <Tag>{v}</Tag> },
      {
        title: "Stock",
        dataIndex: "stock",
        key: "stock",
        width: 120,
        align: "right",
        render: (v) => <Text>{Number(v || 0).toFixed(3)}</Text>,
      },
      {
        title: "Actualizado",
        dataIndex: "actualizado_en",
        key: "actualizado_en",
        width: 170,
        render: (v) => (v ? new Date(v).toLocaleString() : "—"),
      },
    ];

    return (
      <Card size="small" bordered style={{ background: "#fafafa" }}>
        <Table
          size="small"
          rowKey="almacen_id"
          loading={loadingExpand}
          columns={cols}
          dataSource={rows}
          pagination={false}
        />
      </Card>
    );
    
  };

  return (
    <div style={{ padding: 16 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>Consulta de Stock</Title>
          <Text type="secondary">Radiadores Fortaleza S.A. • Almacén</Text>
        </Col>
        <Col>
          <Button icon={<ReloadOutlined />} onClick={onRefrescar}>
            Refrescar
          </Button>
        </Col>
      </Row>

      <Row gutter={[12, 12]}>
        <Col xs={24} md={16}>
          <Card>
            <Row gutter={[12, 12]}>
              <Col xs={24} md={10}>
                <Text strong>Búsqueda</Text>
                <Input
                  value={filters.q}
                  placeholder="Código o descripción..."
                  onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
                  allowClear
                />
              </Col>

              <Col xs={24} md={7}>
                <Text strong>Almacén</Text>
                <Select
                  value={filters.almacen_id}
                  style={{ width: "100%" }}
                  onChange={(v) => setFilters((p) => ({ ...p, almacen_id: v }))}
                  options={[
                    { value: "TODOS", label: "Todos" },
                    ...almacenes.map((a) => ({
                      value: a.id_alm,
                      label: `${a.codigo} - ${a.nombre}`,
                    })),
                  ]}
                  showSearch
                  optionFilterProp="label"
                />
              </Col>

              <Col xs={24} md={7}>
                <Text strong>Estado</Text>
                <Select
                  value={filters.estado}
                  style={{ width: "100%" }}
                  onChange={(v) => setFilters((p) => ({ ...p, estado: v }))}
                  options={ESTADOS}
                />
              </Col>

              <Col xs={24} md={10}>
                <Text strong>Categoría</Text>
                <Select
                  allowClear
                  value={filters.categoria_id}
                  style={{ width: "100%" }}
                  onChange={(v) => setFilters((p) => ({ ...p, categoria_id: v }))}
                  options={categorias.map((c) => ({
                    value: c.id_categoria,
                    label: `${c.codigo} - ${c.nombre}`,
                  }))}
                  showSearch
                  optionFilterProp="label"
                  placeholder="Todas"
                />
              </Col>

              <Col xs={24} md={7}>
                <Text strong>Solo con stock</Text>
                <Select
                  value={filters.solo_con_stock}
                  style={{ width: "100%" }}
                  onChange={(v) => setFilters((p) => ({ ...p, solo_con_stock: v }))}
                  options={[
                    { value: "0", label: "No" },
                    { value: "1", label: "Sí" },
                  ]}
                />
              </Col>

              <Col xs={24} md={7} style={{ display: "flex", alignItems: "end" }}>
                <Space>
                  <Button type="primary" icon={<SearchOutlined />} onClick={onBuscar}>
                    Buscar
                  </Button>
                  <Button icon={<ClearOutlined />} onClick={onLimpiar}>
                    Limpiar
                  </Button>
                </Space>
              </Col>
            </Row>

            <Divider style={{ margin: "12px 0" }} />

            <Row gutter={[12, 12]}>
              <Col xs={12} md={4}>
                <Statistic title="Registros" value={total} />
              </Col>
              <Col xs={12} md={5}>
                <Statistic title="Sin stock (página)" value={kpis.sin_stock} />
              </Col>
              <Col xs={12} md={5}>
                <Statistic title="Stock bajo (página)" value={kpis.stock_bajo} />
              </Col>
              <Col xs={12} md={5}>
                <Statistic title="Normal (página)" value={kpis.ok} />
              </Col>
              <Col xs={12} md={5}>
                <Statistic title="Sobre stock (página)" value={kpis.sobre_stock} />
              </Col>
            </Row>

            <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
              Tip: Expande una fila para ver el stock por almacén del producto.
            </Text>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <Title level={5} style={{ marginTop: 0 }}>Resumen</Title>
            <Text type="secondary">
              Esta consulta usa <b>stock_almacen</b> para mostrar stock total o por almacén (si filtras).
            </Text>

            <Divider />

            <Row gutter={[12, 12]}>
              <Col span={24}>
                <Tag color="default">SIN STOCK</Tag> stock = 0
              </Col>
              <Col span={24}>
                <Tag color="orange">BAJO</Tag> stock &le; mínimo
              </Col>
              <Col span={24}>
                <Tag color="green">NORMAL</Tag> stock &gt; mínimo
              </Col>
              <Col span={24}>
                <Tag color="red">SOBRE</Tag> stock &gt; máximo (si está definido)
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 12 }}>
        <Table
          rowKey="id_producto"
          loading={loading}
          columns={columns}
          dataSource={data}
          expandable={{
            expandedRowKeys,
            onExpand: async (expanded, record) => {
              const key = record.id_producto;

              if (expanded) {
                // cargar si no está cacheado
                if (!stockByProducto[key]) await fetchExpand(key);
                setExpandedRowKeys((prev) => [...prev, key]);
              } else {
                setExpandedRowKeys((prev) => prev.filter((k) => k !== key));
              }
            },
            expandedRowRender,
          }}
          pagination={{
            current: page,
            pageSize: limit,
            total,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            onChange: (p, ps) => {
              setPage(p);
              setLimit(ps);
              setExpandedRowKeys([]);
              fetchStock({ page: p, limit: ps });
            },
          }}
        />
      </Card>
    </div>
  );
}
