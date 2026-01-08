// =====================================================
// GuiasRemision.jsx
// Página principal para gestión de guías de remisión
// Radiadores Fortaleza S.A.
// =====================================================

import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Tag,
  message,
  Row,
  Col,
  Statistic,
  Select,
  DatePicker,
  Tooltip,
  Modal,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  TruckOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import CrearGuiaRemision from "./Crearguiaremision";

const { RangePicker } = DatePicker;

const GuiasRemision = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPedidoId, setSelectedPedidoId] = useState(null);
  const [estadoFilter, setEstadoFilter] = useState("PENDIENTE");

  const [stats, setStats] = useState({
    totalPedidos: 0,
    pendientes: 0,
    parciales: 0,
    despachados: 0,
  });

  useEffect(() => {
    fetchPedidos();
  }, [estadoFilter]);

  const fetchPedidos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/pedidos/pedidos`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const pedidosData = response.data.success
        ? response.data.data
        : response.data;

      // Filtrar pedidos según estado
      let pedidosFiltrados = pedidosData.filter(
        (p) =>
          p.estado === "PENDIENTE" ||
          p.estado === "PARCIAL" ||
          p.estado === "EN PREPARACIÓN" ||
          p.estado === "DESPACHADO"
      );

      if (estadoFilter) {
        pedidosFiltrados = pedidosFiltrados.filter(
          (p) => p.estado === estadoFilter
        );
      }

      setPedidos(pedidosFiltrados);
      calculateStats(pedidosFiltrados);
    } catch (error) {
      message.error("Error al cargar pedidos");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const pendientes = data.filter((p) => p.estado === "PENDIENTE").length;
    const parciales = data.filter((p) => p.estado === "PARCIAL").length;
    const despachados = data.filter((p) => p.estado === "DESPACHADO").length;

    setStats({
      totalPedidos: data.length,
      pendientes,
      parciales,
      despachados,
    });
  };

  const handleCrearGuia = async (pedido) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Verificar si existe una guía pendiente de confirmación
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/guias-remision/analizar-pedido/${pedido.id_pedido}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const analisis = response.data.data;

      // Si existe una guía con nota en BORRADOR, mostrar alerta y NO abrir el modal
      if (analisis.resumen.tiene_guia_pendiente_confirmacion) {
        const guiaPendiente = analisis.guias_pendientes_confirmacion[0];

        Modal.error({
          title: "⚠️ Ya existe una guía pendiente de confirmación",
          width: 600,
          content: (
            <div style={{ marginTop: 16 }}>
              <p>
                Ya se generó la guía <strong>{guiaPendiente.numero_guia}</strong> con
                nota de salida <strong>{guiaPendiente.numero_nota}</strong> en estado <Tag color="orange">BORRADOR</Tag>.
              </p>
              <p style={{ marginTop: 12 }}>
                <strong>No puedes crear una nueva guía hasta que:</strong>
              </p>
              <ul style={{ marginTop: 8 }}>
                <li>Confirmes la nota de salida existente (para reducir el stock y actualizar el pedido), O</li>
                <li>Anules la nota de salida si no deseas despachar esos productos</li>
              </ul>
              <p style={{ marginTop: 12, color: '#888' }}>
                💡 <strong>Sugerencia:</strong> Ve a "Notas de Salida" → Busca la nota <strong>{guiaPendiente.numero_nota}</strong> → Confírmala o anúlala.
              </p>
            </div>
          ),
          okText: "Entendido",
        });

        setLoading(false);
        return;
      }

      // Si NO hay guías pendientes, abrir el modal normalmente
      setSelectedPedidoId(pedido.id_pedido);
      setModalVisible(true);

    } catch (error) {
      console.error("Error al verificar guías pendientes:", error);
      message.error("Error al verificar el estado del pedido");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setModalVisible(false);
    setSelectedPedidoId(null);
    fetchPedidos();
    message.success("Guía de remisión creada exitosamente");
  };

  const handleCancel = () => {
    setModalVisible(false);
    setSelectedPedidoId(null);
  };

  const columns = [
    {
      title: "Pedido N°",
      dataIndex: "numero",
      key: "numero",
      width: 120,
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Fecha",
      dataIndex: "fecha",
      key: "fecha",
      width: 120,
      render: (fecha) => new Date(fecha).toLocaleDateString("es-PE"),
    },
    {
      title: "Cliente",
      dataIndex: "razon_social_cliente",
      key: "cliente",
      ellipsis: true,
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      width: 120,
      align: "right",
      render: (total) =>
        `S/ ${parseFloat(total).toLocaleString("es-PE", {
          minimumFractionDigits: 2,
        })}`,
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      width: 140,
      render: (estado) => {
        const config = {
          PENDIENTE: { color: "warning", icon: <ClockCircleOutlined /> },
          PARCIAL: { color: "processing", icon: <TruckOutlined /> },
          "EN PREPARACIÓN": { color: "processing", icon: <TruckOutlined /> },
          DESPACHADO: { color: "success", icon: <CheckCircleOutlined /> },
          COMPLETADO: { color: "success", icon: <CheckCircleOutlined /> },
        };
        return (
          <Tag color={config[estado]?.color} icon={config[estado]?.icon}>
            {estado}
          </Tag>
        );
      },
    },
    {
      title: "Items Pendientes",
      key: "items_pendientes",
      width: 140,
      align: "center",
      render: (_, record) => {
        const pendientes = record.productos_pendientes || 0;
        return (
          <Tag color={pendientes > 0 ? "orange" : "green"}>
            {pendientes} items
          </Tag>
        );
      },
    },
    {
      title: "Acciones",
      key: "acciones",
      width: 200,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Ver detalles">
            <Button
              type="default"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => {
                // Implementar modal de detalle si es necesario
                message.info("Función en desarrollo");
              }}
            />
          </Tooltip>
          <Tooltip title="Crear guía de remisión">
            <Button
              type="primary"
              icon={<TruckOutlined />}
              size="small"
              onClick={() => handleCrearGuia(record)}
              disabled={
                record.productos_pendientes === 0 ||
                record.estado === "COMPLETADO" ||
                record.estado === "DESPACHADO"
              }
            >
              Nueva Guía
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const filteredPedidos = pedidos.filter(
    (pedido) =>
      pedido.numero.toLowerCase().includes(searchText.toLowerCase()) ||
      pedido.razon_social_cliente
        .toLowerCase()
        .includes(searchText.toLowerCase())
  );

  return (
    <div style={{ padding: "24px" }}>
      <Card
        title={
          <Space>
            <TruckOutlined style={{ fontSize: "24px" }} />
            <span style={{ fontSize: "20px", fontWeight: "bold" }}>
              Gestión de Guías de Remisión
            </span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<FileTextOutlined />}
            onClick={() => {
              // Ir a ver todas las guías creadas
              message.info("Ver todas las guías - En desarrollo");
            }}
          >
            Ver Guías
          </Button>
        }
      >
        {/* Estadísticas */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Pedidos"
                value={stats.totalPedidos}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Pendientes"
                value={stats.pendientes}
                valueStyle={{ color: "#faad14" }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Parciales"
                value={stats.parciales}
                valueStyle={{ color: "#1890ff" }}
                prefix={<TruckOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Despachados"
                value={stats.despachados}
                valueStyle={{ color: "#52c41a" }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Filtros y búsqueda */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Input
              placeholder="Buscar por número de pedido o cliente..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={12}>
            <Select
              placeholder="Filtrar por estado"
              style={{ width: "100%" }}
              value={estadoFilter}
              onChange={setEstadoFilter}
              allowClear
            >
              <Select.Option value="PENDIENTE">Pendiente</Select.Option>
              <Select.Option value="PARCIAL">Parcial</Select.Option>
              <Select.Option value="EN PREPARACIÓN">
                En Preparación
              </Select.Option>
              <Select.Option value="DESPACHADO">Despachado</Select.Option>
            </Select>
          </Col>
        </Row>

        {/* Tabla de pedidos */}
        <Table
          dataSource={filteredPedidos}
          columns={columns}
          rowKey="id_pedido"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total: ${total} pedidos`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Modal de crear guía */}
      {modalVisible && selectedPedidoId && (
        <CrearGuiaRemision
          pedidoId={selectedPedidoId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default GuiasRemision;
