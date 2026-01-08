// OrdenesFabricacion.jsx
import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Input,
  Space,
  Tag,
  Modal,
  message,
  Card,
  Row,
  Col,
  Statistic,
  Select,
  DatePicker,
  Tooltip,
  Progress,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  FileTextOutlined,
  ToolOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import OrdenFabricacionDetalle from "./OrdenFabricacionDetalle";

const { RangePicker } = DatePicker;

const OrdenesFabricacion = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [detalleVisible, setDetalleVisible] = useState(false);
  const [selectedOrden, setSelectedOrden] = useState(null);
  const [estadoFilter, setEstadoFilter] = useState(null);
  const [fechaFilter, setFechaFilter] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    programadas: 0,
    enProceso: 0,
    pausadas: 0,
    terminadas: 0,
    porcentajePromedio: 0,
  });

  useEffect(() => {
    fetchOrdenes();
  }, []);

  const fetchOrdenes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/ordenes-fabricacion/ordenes-fabricacion`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const ordenesData = response.data.success
        ? response.data.data
        : response.data;

      setOrdenes(ordenesData);
      calculateStats(ordenesData);
    } catch (error) {
      message.error("Error al cargar órdenes de fabricación");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    if (!Array.isArray(data)) {
      console.error("calculateStats: data no es un array", data);
      return;
    }

    const programadas = data.filter((o) => o.estado === "PROGRAMADA").length;
    const enProceso = data.filter((o) => o.estado === "EN_PROCESO").length;
    const pausadas = data.filter((o) => o.estado === "PAUSADA").length;
    const terminadas = data.filter((o) => o.estado === "TERMINADA").length;

    // Calcular porcentaje promedio de avance
    const ordenesConItems = data.filter((o) => o.total_items > 0);
    const porcentajePromedio =
      ordenesConItems.length > 0
        ? ordenesConItems.reduce((sum, o) => {
            const porcentaje =
              o.items_terminados && o.total_items
                ? (o.items_terminados / o.total_items) * 100
                : 0;
            return sum + porcentaje;
          }, 0) / ordenesConItems.length
        : 0;

    setStats({
      total: data.length,
      programadas,
      enProceso,
      pausadas,
      terminadas,
      porcentajePromedio: Math.round(porcentajePromedio),
    });
  };

  const handleVerDetalle = async (record) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/ordenes-fabricacion/ordenes-fabricacion/${record.id_ord_fab}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const ordenCompleta = response.data.success
        ? response.data.data
        : response.data;

      setSelectedOrden(ordenCompleta);
      setDetalleVisible(true);
    } catch (error) {
      message.error("Error al cargar detalle de la orden");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarEstado = (record, nuevoEstado) => {
    const estadosPermitidos = {
      PROGRAMADA: ["EN_PROCESO", "ANULADA"],
      EN_PROCESO: ["PAUSADA", "TERMINADA", "ANULADA"],
      PAUSADA: ["EN_PROCESO", "ANULADA"],
      TERMINADA: [],
      ANULADA: [],
    };

    if (!estadosPermitidos[record.estado]?.includes(nuevoEstado)) {
      message.warning(
        `No se puede cambiar de ${record.estado} a ${nuevoEstado}`
      );
      return;
    }

    const accionTexto = {
      EN_PROCESO: "iniciar",
      PAUSADA: "pausar",
      TERMINADA: "finalizar",
      ANULADA: "anular",
    };

    Modal.confirm({
      title: `¿Está seguro de ${accionTexto[nuevoEstado]} esta orden?`,
      content: `Orden N° ${record.numero_ord}`,
      okText: "Sí, confirmar",
      okType: nuevoEstado === "ANULADA" ? "danger" : "primary",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await axios.put(
            `${import.meta.env.VITE_API_URL}/ordenes-fabricacion/ordenes-fabricacion/${record.id_ord_fab}/estado`,
            { estado: nuevoEstado },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (response.data.success) {
            message.success(`Orden ${accionTexto[nuevoEstado]}da exitosamente`);
            fetchOrdenes();
          } else {
            message.error(response.data.error || "Error al cambiar estado");
          }
        } catch (error) {
          const errorMsg =
            error.response?.data?.error || "Error al cambiar estado";
          message.error(errorMsg);
          console.error(error);
        }
      },
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-PE");
  };

  const getEstadoColor = (estado) => {
    const colors = {
      PROGRAMADA: "blue",
      EN_PROCESO: "processing",
      PAUSADA: "warning",
      TERMINADA: "success",
      ANULADA: "default",
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
      title: "N° Orden",
      dataIndex: "numero_ord",
      key: "numero_ord",
      fixed: "left",
      width: 130,
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Fecha Creación",
      dataIndex: "fecha_creacion",
      key: "fecha_creacion",
      width: 120,
      render: formatDate,
    },
    {
      title: "N° Pedido",
      dataIndex: "numero_pedido",
      key: "numero_pedido",
      width: 120,
    },
    {
      title: "Cliente",
      dataIndex: "razon_social_cliente",
      key: "razon_social_cliente",
      width: 250,
      ellipsis: true,
    },
    {
      title: "Prioridad",
      dataIndex: "prioridad",
      key: "prioridad",
      width: 130,
      align: "center",
      render: (text) => (
        <Tag color={getPrioridadColor(text)}>{text || "NORMAL"}</Tag>
      ),
    },
    {
      title: "Items",
      key: "items",
      width: 100,
      align: "center",
      render: (_, record) => (
        <span>
          {record.items_terminados || 0} / {record.total_items || 0}
        </span>
      ),
    },
    {
      title: "Avance",
      key: "avance",
      width: 150,
      render: (_, record) => {
        const porcentaje =
          record.total_items > 0
            ? Math.round((record.items_terminados / record.total_items) * 100)
            : 0;
        return (
          <Progress
            percent={porcentaje}
            size="small"
            status={porcentaje === 100 ? "success" : "active"}
          />
        );
      },
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      width: 140,
      align: "center",
      render: (text) => <Tag color={getEstadoColor(text)}>{text}</Tag>,
    },
    {
      title: "Fecha Inicio",
      dataIndex: "fecha_inicio_real",
      key: "fecha_inicio_real",
      width: 120,
      render: formatDate,
    },
    {
      title: "Fecha Fin",
      dataIndex: "fecha_fin_real",
      key: "fecha_fin_real",
      width: 120,
      render: formatDate,
    },
    {
      title: "Acciones",
      key: "acciones",
      fixed: "right",
      width: 220,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Ver detalle">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleVerDetalle(record)}
            />
          </Tooltip>

          {record.estado === "PROGRAMADA" && (
            <>
              <Tooltip title="Iniciar producción">
                <Button
                  type="link"
                  icon={<PlayCircleOutlined />}
                  onClick={() => handleCambiarEstado(record, "EN_PROCESO")}
                  style={{ color: "#52c41a" }}
                >
                  Iniciar
                </Button>
              </Tooltip>
              <Tooltip title="Anular orden">
                <Button
                  type="link"
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleCambiarEstado(record, "ANULADA")}
                />
              </Tooltip>
            </>
          )}

          {record.estado === "EN_PROCESO" && (
            <>
              <Tooltip title="Pausar producción">
                <Button
                  type="link"
                  icon={<PauseCircleOutlined />}
                  onClick={() => handleCambiarEstado(record, "PAUSADA")}
                  style={{ color: "#faad14" }}
                >
                  Pausar
                </Button>
              </Tooltip>
              <Tooltip title="Finalizar orden">
                <Button
                  type="link"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleCambiarEstado(record, "TERMINADA")}
                  style={{ color: "#52c41a" }}
                >
                  Finalizar
                </Button>
              </Tooltip>
            </>
          )}

          {record.estado === "PAUSADA" && (
            <>
              <Tooltip title="Reanudar producción">
                <Button
                  type="link"
                  icon={<PlayCircleOutlined />}
                  onClick={() => handleCambiarEstado(record, "EN_PROCESO")}
                  style={{ color: "#52c41a" }}
                >
                  Reanudar
                </Button>
              </Tooltip>
              <Tooltip title="Anular orden">
                <Button
                  type="link"
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleCambiarEstado(record, "ANULADA")}
                />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  const filteredData = Array.isArray(ordenes)
    ? ordenes.filter((item) => {
        const matchSearch =
          item.numero_ord?.toLowerCase().includes(searchText.toLowerCase()) ||
          item.numero_pedido
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ||
          item.razon_social_cliente
            ?.toLowerCase()
            .includes(searchText.toLowerCase());

        const matchEstado = estadoFilter ? item.estado === estadoFilter : true;

        const matchFecha = fechaFilter
          ? new Date(item.fecha_creacion) >= new Date(fechaFilter[0]) &&
            new Date(item.fecha_creacion) <= new Date(fechaFilter[1])
          : true;

        return matchSearch && matchEstado && matchFecha;
      })
    : [];

  return (
    <div style={{ padding: "24px" }}>
      <Card>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={4}>
            <Card>
              <Statistic
                title="Total Órdenes"
                value={stats.total}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card>
              <Statistic
                title="Programadas"
                value={stats.programadas}
                valueStyle={{ color: "#1890ff" }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card>
              <Statistic
                title="En Proceso"
                value={stats.enProceso}
                valueStyle={{ color: "#faad14" }}
                prefix={<ToolOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card>
              <Statistic
                title="Pausadas"
                value={stats.pausadas}
                valueStyle={{ color: "#fa8c16" }}
                prefix={<PauseCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card>
              <Statistic
                title="Terminadas"
                value={stats.terminadas}
                valueStyle={{ color: "#52c41a" }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card>
              <Statistic
                title="Avance Promedio"
                value={stats.porcentajePromedio}
                suffix="%"
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
        </Row>

        <div style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={24} md={10}>
              <Input
                placeholder="Buscar por N° orden, N° pedido, cliente..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={12} md={5}>
              <Select
                placeholder="Filtrar por estado"
                style={{ width: "100%" }}
                allowClear
                onChange={setEstadoFilter}
              >
                <Select.Option value="PROGRAMADA">Programada</Select.Option>
                <Select.Option value="EN_PROCESO">En Proceso</Select.Option>
                <Select.Option value="PAUSADA">Pausada</Select.Option>
                <Select.Option value="TERMINADA">Terminada</Select.Option>
                <Select.Option value="ANULADA">Anulada</Select.Option>
              </Select>
            </Col>
            <Col xs={12} md={9}>
              <RangePicker
                style={{ width: "100%" }}
                placeholder={["Fecha desde", "Fecha hasta"]}
                format="DD/MM/YYYY"
                onChange={(dates) => setFechaFilter(dates)}
              />
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          rowKey="id_ord_fab"
          scroll={{ x: 1600 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} órdenes`,
          }}
        />
      </Card>

      <Modal
        title="Detalle de Orden de Fabricación"
        open={detalleVisible}
        onCancel={() => setDetalleVisible(false)}
        footer={null}
        width={1200}
        destroyOnClose
      >
        {selectedOrden && (
          <OrdenFabricacionDetalle
            orden={selectedOrden}
            onActualizado={() => {
              setDetalleVisible(false);
              fetchOrdenes();
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default OrdenesFabricacion;
