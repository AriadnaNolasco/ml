import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
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
  Tabs,
  Tag,
  Typography,
  Tooltip,
} from "antd";
import {
  FileAddOutlined,
  ExportOutlined,
  ReloadOutlined,
  SearchOutlined,
  SwapOutlined,
  FilterOutlined,
} from "@ant-design/icons";

import api from "../../api/api";

import NotasIngreso from "./Componentes/NotasIngreso";
import NotasSalida from "./Componentes/NotasSalida";
import NotasTransferencia from "./Componentes/NotasTransferencia";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function Notas() {
  const [activeKey, setActiveKey] = useState("1");

  // ✅ combos
  const [almacenes, setAlmacenes] = useState([]);
  const [operaciones, setOperaciones] = useState([]);
  const [loadingCombos, setLoadingCombos] = useState(false);

  // ✅ Filtros UI (editables)
  const [filters, setFilters] = useState({
    q: "",
    estado: undefined,
    fecha: null, // [start, end] => dayjs
    almacen_salida: undefined,
    almacen_destino: undefined,
    operacion: undefined,
  });

  // ✅ Filtros aplicados (los que consumen los tabs)
  const [appliedFilters, setAppliedFilters] = useState({
    q: "",
    estado: undefined,
    desde: undefined,
    hasta: undefined,
    almacen_salida: undefined,
    almacen_destino: undefined,
    operacion: undefined,
  });

  const [refreshKey, setRefreshKey] = useState(0);

  const tabMeta = useMemo(() => {
    const map = {
      "1": { label: "Notas de Ingreso", color: "blue" },
      "2": { label: "Notas de Salida", color: "volcano" },
      "3": { label: "Transferencias", color: "geekblue" },
    };
    return map[activeKey] || map["1"];
  }, [activeKey]);

  // =========================
  // Cargar almacenes (1 sola vez)
  // =========================
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoadingCombos(true);
        const r = await api.get("/almacen/almacenes");
        if (!mounted) return;
        setAlmacenes(Array.isArray(r.data) ? r.data : []);
      } catch (e) {
        console.error("Error cargando almacenes:", e);
        setAlmacenes([]);
      } finally {
        setLoadingCombos(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // =========================
  // Cargar operaciones según TAB
  // - Ingreso: tipo_movimiento = INGRESO, documento NI
  // - Salida: tipo_movimiento = SALIDA, documento NS
  // - Transferencia: documento NT (usualmente salida 160)
  // =========================
  useEffect(() => {
    let mounted = true;

    const cargarOperaciones = async () => {
      try {
        setLoadingCombos(true);

        const isIngreso = activeKey === "1";
        const isSalida = activeKey === "2";
        const isTransfer = activeKey === "3";

        // documento para filtrar si tu endpoint lo usa
        const documento = isIngreso ? "NI" : isSalida ? "NS" : "NT";

        // Para transferencias: normalmente se registran con operación de SALIDA (160),
        // por eso pedimos SALIDA para NT.
        const tipoMov = isIngreso ? "INGRESO" : "SALIDA";

        const r = await api.get(`/cod-operacion/por-tipo-movimiento/${tipoMov}`, {
          params: { documento },
        });

        let ops = r.data?.data || [];

        // ✅ Transferencia: deja solo las operaciones de transferencia si vienen mezcladas
        if (isTransfer) {
          ops = ops.filter((op) => {
            const cod = String(op.codigo ?? "").trim();
            const sig = String(op.siglas ?? "").toUpperCase();
            const nombre = String(op.nombre ?? "").toUpperCase();
            return cod === "160" || sig.includes("TRF") || nombre.includes("TRANSFER");
          });
        }

        if (!mounted) return;
        setOperaciones(Array.isArray(ops) ? ops : []);

        // si la operación seleccionada ya no existe en la nueva lista, la limpiamos
        setFilters((prev) => {
          if (!prev.operacion) return prev;
          const exists = ops.some((x) => (x.id_cod_operacion ?? x.id) === prev.operacion);
          return exists ? prev : { ...prev, operacion: undefined };
        });
      } catch (e) {
        console.error("Error cargando operaciones:", e);
        if (!mounted) return;
        setOperaciones([]);
      } finally {
        setLoadingCombos(false);
      }
    };

    cargarOperaciones();

    return () => {
      mounted = false;
    };
  }, [activeKey]);

  const onReset = () => {
    setFilters({
      q: "",
      estado: undefined,
      fecha: null,
      almacen_salida: undefined,
      almacen_destino: undefined,
      operacion: undefined,
    });

    setAppliedFilters({
      q: "",
      estado: undefined,
      desde: undefined,
      hasta: undefined,
      almacen_salida: undefined,
      almacen_destino: undefined,
      operacion: undefined,
    });

    setRefreshKey((k) => k + 1);
  };

  const onBuscar = () => {
    const desde = filters.fecha?.[0]
      ? dayjs(filters.fecha[0]).format("YYYY-MM-DD")
      : undefined;
    const hasta = filters.fecha?.[1]
      ? dayjs(filters.fecha[1]).format("YYYY-MM-DD")
      : undefined;

    setAppliedFilters({
      q: filters.q?.trim() || "",
      estado: filters.estado,
      desde,
      hasta,
      almacen_salida: filters.almacen_salida,
      almacen_destino: filters.almacen_destino,
      operacion: filters.operacion,
    });

    setRefreshKey((k) => k + 1);
  };

  // Options memo
  const almacenesOptions = useMemo(() => {
    return (almacenes || []).map((a) => ({
      value: a.id_alm,
      label: a.nombre,
    }));
  }, [almacenes]);

  const operacionesOptions = useMemo(() => {
    return (operaciones || []).map((op) => ({
      value: op.id_cod_operacion ?? op.id,
      label: `${String(op.codigo).trim()} - ${op.nombre}`,
    }));
  }, [operaciones]);

  return (
    <div style={{ padding: 16 }}>

        <Card
          style={{
            marginBottom: 16,
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
            border: '1px solid #f0f0f0',
          }}
        >
          <Row align="middle" justify="space-between">
            <Col>
              <Space align="center" size={16}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${tabMeta.color}40, ${tabMeta.color}20)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${tabMeta.color}30`
                }}>
                  <SwapOutlined style={{ 
                    fontSize: 24, 
                    color: tabMeta.color,
                    filter: 'brightness(0.9)'
                  }} />
                </div>
                
                <div>
                  <Title level={3} style={{ margin: 0 }}>
                    Gestión de Notas
                  </Title>
                  <Space size={8} style={{ marginTop: 4 }}>
                    <Tag 
                      color={tabMeta.color}
                      style={{
                        borderRadius: 6,
                        fontWeight: 600,
                        border: 'none',
                        padding: '2px 10px'
                      }}
                    >
                      {tabMeta.label}
                    </Tag>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      Filtra y revisa tus notas de almacén
                    </Text>
                  </Space>
                </div>
              </Space>
            </Col>
            
            <Col>
              <Space wrap>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={onReset}
                  style={{
                    borderRadius: 8,
                    padding: '6px 16px',
                    height: 'auto',
                    border: '1px solid #d9d9d9'
                  }}
                >
                  Limpiar filtros
                </Button>
                
                <Button 
                  icon={<ExportOutlined />} 
                  disabled
                  style={{
                    borderRadius: 8,
                    padding: '6px 16px',
                    height: 'auto',
                    background: '#fafafa',
                    border: '1px solid #d9d9d9'
                  }}
                >
                  Exportar
                </Button>
              </Space>
            </Col>
          </Row>
          
        </Card>

        <Card>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} md={10} lg={8}>
              <Input
                allowClear
                value={filters.q}
                onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
                prefix={<SearchOutlined />}
                placeholder="Buscar (número, serie, doc, guía, operación...)"
              />
            </Col>

            <Col xs={24} md={7} lg={4}>
              <Select
                allowClear
                value={filters.estado}
                onChange={(v) => setFilters((p) => ({ ...p, estado: v }))}
                placeholder="Estado"
                style={{ width: "100%" }}
                options={[
                  { value: "BORRADOR", label: "BORRADOR" },
                  { value: "CONFIRMADO", label: "CONFIRMADO" },
                  { value: "ANULADO", label: "ANULADO" },
                ]}
              />
            </Col>

            <Col xs={24} md={7} lg={6}>
              <RangePicker
                value={filters.fecha}
                onChange={(v) => setFilters((p) => ({ ...p, fecha: v }))}
                style={{ width: "100%" }}
                placeholder={["Fecha inicio", "Fecha fin"]}
              />
            </Col>

            <Col xs={24} md={12} lg={6}>
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                loading={loadingCombos}
                value={filters.operacion}
                onChange={(v) => setFilters((p) => ({ ...p, operacion: v }))}
                placeholder="Operación"
                style={{ width: "100%" }}
                options={operacionesOptions}
              />
            </Col>

            <Col xs={24} md={12} lg={6}>
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                loading={loadingCombos}
                value={filters.almacen_salida}
                onChange={(v) => setFilters((p) => ({ ...p, almacen_salida: v }))}
                placeholder="Almacén salida (origen)"
                style={{ width: "100%" }}
                options={almacenesOptions}
              />
            </Col>

            <Col xs={24} md={12} lg={6}>
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                loading={loadingCombos}
                value={filters.almacen_destino}
                onChange={(v) => setFilters((p) => ({ ...p, almacen_destino: v }))}
                placeholder="Almacén destino"
                style={{ width: "100%" }}
                options={almacenesOptions}
              />
            </Col>

            <Col xs={24} md={12} lg={6}>
              <Button
                type="primary"
                icon={<FilterOutlined />}
                onClick={onBuscar}
                style={{ width: "100%" }}
              >
                Aplicar filtros
              </Button>
            </Col>
          </Row>

          <Divider style={{ margin: "12px 0" }} />

          <Tabs
            activeKey={activeKey}
            onChange={setActiveKey}
            items={[
              {
                key: "1",
                label: (
                  <Space size={8}>
                    <Badge color="blue" />
                    Ingreso
                  </Space>
                ),
                children: <NotasIngreso filters={appliedFilters} refreshKey={refreshKey} />,
              },
              {
                key: "2",
                label: (
                  <Space size={8}>
                    <Badge color="volcano" />
                    Salida
                  </Space>
                ),
                children: <NotasSalida filters={appliedFilters} refreshKey={refreshKey} />,
              },
              {
                key: "3",
                label: (
                  <Space size={8}>
                    <Badge color="geekblue" />
                    Transferencia
                  </Space>
                ),
                children: <NotasTransferencia filters={appliedFilters} refreshKey={refreshKey} />,
              },
            ]}
          />
        </Card>

    </div>
  );
}
