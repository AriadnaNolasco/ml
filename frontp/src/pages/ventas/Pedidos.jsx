// Pedidos.jsx (CORREGIDO PARA API MEJORADA)
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
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  FileAddOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import PedidoForm from "./PedidoForm";
import PedidoDetalle from "./PedidoDetalle";

const { RangePicker } = DatePicker;

const Pedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [detalleVisible, setDetalleVisible] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [estadoFilter, setEstadoFilter] = useState(null);
  const [fechaFilter, setFechaFilter] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pendientes: 0,
    parciales: 0,
    preparacion: 0,
    despachados: 0,
    totalMonto: 0,
  });

  useEffect(() => {
    fetchPedidos();
  }, []);

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

      // ✅ CORRECCIÓN: Acceder correctamente al array de datos
      const pedidosData = response.data.success
        ? response.data.data // Nueva estructura: { success, data: [...] }
        : response.data; // Estructura antigua: directamente el array

      setPedidos(pedidosData);
      calculateStats(pedidosData);
    } catch (error) {
      message.error("Error al cargar pedidos");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    // Asegurar que data sea un array
    if (!Array.isArray(data)) {
      console.error("calculateStats: data no es un array", data);
      return;
    }

    const pendientes = data.filter((p) => p.estado === "PENDIENTE").length;
    const parciales = data.filter((p) => p.estado === "PARCIAL").length;
    const preparacion = data.filter(
      (p) => p.estado === "EN PREPARACIÓN"
    ).length;
    const despachados = data.filter((p) => p.estado === "DESPACHADO").length;
    const totalMonto = data.reduce(
      (sum, p) => sum + parseFloat(p.total || 0),
      0
    );

    setStats({
      total: data.length,
      pendientes,
      parciales,
      preparacion,
      despachados,
      totalMonto,
    });
  };

  const handleNuevoPedido = () => {
    setSelectedPedido(null);
    setModalVisible(true);
  };

  const handleVerDetalle = async (record) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Obtener el detalle completo del pedido
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/pedidos/pedidos/${record.id_pedido}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Acceder correctamente a los datos
      const pedidoCompleto = response.data.success
        ? response.data.data
        : response.data;

      setSelectedPedido(pedidoCompleto);
      setDetalleVisible(true);
    } catch (error) {
      message.error("Error al cargar detalle del pedido");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = (record) => {
    // Solo permitir editar pedidos pendientes
    if (record.estado !== "PENDIENTE") {
      message.warning("Solo se pueden editar pedidos en estado PENDIENTE");
      return;
    }
    setSelectedPedido(record);
    setModalVisible(true);
  };

  const handleEliminar = (record) => {
    if (record.estado !== "PENDIENTE") {
      message.warning("Solo se pueden anular pedidos en estado PENDIENTE");
      return;
    }

    Modal.confirm({
      title: "¿Está seguro de anular este pedido?",
      content: `Pedido N° ${record.numero}`,
      okText: "Sí, anular",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await axios.put(
            `${import.meta.env.VITE_API_URL}/pedidos/pedidos/${
              record.id_pedido
            }/estado`,
            { estado: "ANULADO" },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          // Verificar respuesta
          if (response.data.success) {
            message.success("Pedido anulado exitosamente");
            fetchPedidos();
          } else {
            message.error(response.data.error || "Error al anular pedido");
          }
        } catch (error) {
          const errorMsg =
            error.response?.data?.error || "Error al anular pedido";
          message.error(errorMsg);
          console.error(error);
        }
      },
    });
  };

  const handleActualizarEstado = (record, nuevoEstado) => {
    Modal.confirm({
      title: `¿Está seguro de cambiar el estado a ${nuevoEstado}?`,
      content: `Pedido N° ${record.numero}`,
      okText: "Sí, cambiar",
      okType: "primary",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await axios.put(
            `${import.meta.env.VITE_API_URL}/pedidos/pedidos/${
              record.id_pedido
            }/estado`,
            { estado: nuevoEstado },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          // Verificar respuesta
          if (response.data.success) {
            message.success(`Estado cambiado a ${nuevoEstado}`);
            fetchPedidos();
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

  // ✅ Generar Orden de Fabricación Rápida
  const handleGenerarOrdenRapida = (record) => {
    Modal.confirm({
      title: "Generar Orden de Fabricación",
      content: (
        <div>
          <p>
            <strong>Pedido:</strong> {record.numero}
          </p>
          <p>
            <strong>Cliente:</strong> {record.razon_social_cliente}
          </p>
          <p>
            <strong>Productos sin stock:</strong> {record.productos_sin_stock}
          </p>
          <p style={{ marginTop: 12, color: "#fa8c16" }}>
            ⚠️ Se generará una orden de fabricación para los productos que no tienen stock suficiente.
          </p>
        </div>
      ),
      okText: "Generar Orden",
      okType: "primary",
      okButtonProps: { style: { backgroundColor: "#fa8c16", borderColor: "#fa8c16" } },
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await axios.post(
            `${import.meta.env.VITE_API_URL}/ordenes-fabricacion/generar`,
            { pedido_id: record.id_pedido },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (response.data.success) {
            const ordenGenerada = response.data.data.orden_fabricacion;
            message.success(
              `Orden de fabricación ${ordenGenerada.numero_ord} generada exitosamente`
            );
            fetchPedidos(); // Recargar lista para actualizar indicadores
          } else {
            message.error(
              response.data.message || "Error al generar orden de fabricación"
            );
          }
        } catch (error) {
          console.error("Error al generar orden:", error);
          const errorMsg =
            error.response?.data?.message ||
            "Error al generar orden de fabricación";
          message.error(errorMsg);
        }
      },
    });
  };

  const handleModalClose = (refresh) => {
    setModalVisible(false);
    setSelectedPedido(null);
    if (refresh) {
      fetchPedidos();
    }
  };

  const formatCurrency = (amount) => {
    return `S/ ${parseFloat(amount || 0).toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-PE");
  };

  const columns = [
    {
      title: "N° Pedido",
      dataIndex: "numero",
      key: "numero",
      fixed: "left",
      width: 120,
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Fecha",
      dataIndex: "fecha",
      key: "fecha",
      width: 110,
      render: formatDate,
    },
    {
      title: "Cliente",
      dataIndex: "razon_social_cliente",
      key: "razon_social_cliente",
      width: 250,
      ellipsis: true,
    },
    {
      title: "Código Cliente",
      dataIndex: "codigo_cliente",
      key: "codigo_cliente",
      width: 120,
    },
    {
      title: "Cotización",
      dataIndex: "cotizacion_numero",
      key: "cotizacion_numero",
      width: 120,
      render: (text) => text || "N/A",
    },
    {
      title: "F. Entrega Prevista",
      dataIndex: "fecha_entrega_prevista",
      key: "fecha_entrega_prevista",
      width: 130,
      render: formatDate,
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      width: 130,
      align: "right",
      render: (text) => <strong>{formatCurrency(text)}</strong>,
    },
    {
      title: "Prioridad",
      dataIndex: "prioridad",
      key: "prioridad",
      width: 120,
      align: "center",
      render: (text) => {
        const colors = {
          NORMAL: "blue",
          URGENTE: "red",
          "STOCK URGENTE": "orange",
          "STOCK NORMAL": "green",
        };
        return <Tag color={colors[text] || "default"}>{text || "NORMAL"}</Tag>;
      },
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      width: 140,
      align: "center",
      render: (text, record) => {
        const colors = {
          PENDIENTE: "warning",
          PARCIAL: "processing",
          "EN PREPARACIÓN": "processing",
          DESPACHADO: "success",
          ENTREGADO: "green",
          FACTURADO: "purple",
          ANULADO: "default",
        };
        return <Tag color={colors[text]}>{text}</Tag>;
      },
    },
    {
      title: "Estado Fabricación",
      key: "estado_fabricacion",
      width: 180,
      align: "center",
      render: (_, record) => {
        // Si ya tiene orden de fabricación
        if (record.tiene_orden_fabricacion) {
          const estadoColors = {
            PROGRAMADA: "blue",
            EN_PROCESO: "processing",
            PAUSADA: "warning",
            TERMINADA: "success",
            ANULADA: "default",
          };
          return (
            <div>
              <Tag color={estadoColors[record.estado_orden_fabricacion] || "blue"}>
                {record.numero_orden_fabricacion}
              </Tag>
              <div style={{ fontSize: "11px", color: "#888", marginTop: 2 }}>
                {record.estado_orden_fabricacion}
              </div>
            </div>
          );
        }

        // Si requiere fabricación pero no tiene orden
        if (record.requiere_fabricacion) {
          return (
            <Tag icon={<ExclamationCircleOutlined />} color="orange">
              Requiere Fabricación
              {record.productos_sin_stock > 0 && (
                <div style={{ fontSize: "11px" }}>
                  ({record.productos_sin_stock} producto{record.productos_sin_stock > 1 ? "s" : ""})
                </div>
              )}
            </Tag>
          );
        }

        // Stock disponible
        return (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Stock Disponible
          </Tag>
        );
      },
    },
    {
      title: "Acciones",
      key: "acciones",
      fixed: "right",
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Ver detalle">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleVerDetalle(record)}
            />
          </Tooltip>

          {/* Botón Generar OF - Solo si requiere fabricación y no tiene orden */}
          {record.estado === "PENDIENTE" &&
           record.requiere_fabricacion &&
           !record.tiene_orden_fabricacion && (
            <Tooltip title="Generar Orden de Fabricación">
              <Button
                type="primary"
                size="small"
                icon={<FileAddOutlined />}
                onClick={() => handleGenerarOrdenRapida(record)}
                style={{ backgroundColor: "#fa8c16", borderColor: "#fa8c16" }}
              >
                Generar OF
              </Button>
            </Tooltip>
          )}

          {/* Botón Anular - Solo para pedidos pendientes */}
          {record.estado === "PENDIENTE" && (
            <Tooltip title="Anular pedido">
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleEliminar(record)}
              />
            </Tooltip>
          )}

          {record.estado === "EN PREPARACIÓN" && (
            <Tooltip title="Marcar como despachado">
              <Button
                type="link"
                icon={<CheckCircleOutlined />}
                onClick={() => handleActualizarEstado(record, "DESPACHADO")}
              >
                Despachar
              </Button>
            </Tooltip>
          )}

          {record.estado === "DESPACHADO" && (
            <Tooltip title="Marcar como entregado">
              <Button
                type="link"
                icon={<CheckCircleOutlined />}
                onClick={() => handleActualizarEstado(record, "ENTREGADO")}
              >
                Entregar
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // Asegurar que pedidos sea siempre un array antes de filtrar
  const filteredData = Array.isArray(pedidos)
    ? pedidos.filter((item) => {
        const matchSearch =
          item.numero?.toLowerCase().includes(searchText.toLowerCase()) ||
          item.razon_social_cliente
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ||
          item.codigo_cliente
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ||
          item.cotizacion_numero
            ?.toLowerCase()
            .includes(searchText.toLowerCase());

        const matchEstado = estadoFilter ? item.estado === estadoFilter : true;

        const matchFecha = fechaFilter
          ? new Date(item.fecha) >= new Date(fechaFilter[0]) &&
            new Date(item.fecha) <= new Date(fechaFilter[1])
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
                title="Total Pedidos"
                value={stats.total}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card>
              <Statistic
                title="Pendientes"
                value={stats.pendientes}
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card>
              <Statistic
                title="Parciales"
                value={stats.parciales}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card>
              <Statistic
                title="En Preparación"
                value={stats.preparacion}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card>
              <Statistic
                title="Despachados"
                value={stats.despachados}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic
                title="Total en Soles"
                value={stats.totalMonto}
                precision={2}
                prefix={<DollarOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
        </Row>

        <div style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Input
                placeholder="Buscar por N° pedido, cliente, código, cotización..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={12} md={4}>
              <Select
                placeholder="Filtrar por estado"
                style={{ width: "100%" }}
                allowClear
                onChange={setEstadoFilter}
              >
                <Select.Option value="PENDIENTE">Pendiente</Select.Option>
                <Select.Option value="PARCIAL">Parcial</Select.Option>
                <Select.Option value="EN PREPARACIÓN">
                  En Preparación
                </Select.Option>
                <Select.Option value="DESPACHADO">Despachado</Select.Option>
                <Select.Option value="ENTREGADO">Entregado</Select.Option>
                <Select.Option value="FACTURADO">Facturado</Select.Option>
                <Select.Option value="ANULADO">Anulado</Select.Option>
              </Select>
            </Col>
            <Col xs={12} md={6}>
              <RangePicker
                style={{ width: "100%" }}
                placeholder={["Fecha desde", "Fecha hasta"]}
                format="DD/MM/YYYY"
                onChange={(dates) => setFechaFilter(dates)}
              />
            </Col>
            <Col xs={24} md={6}>
              <Button
                type="primary"
                icon={<FileAddOutlined />}
                onClick={handleNuevoPedido}
                block
              >
                Nuevo Pedido
              </Button>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          rowKey="id_pedido"
          scroll={{ x: 1500 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} pedidos`,
          }}
        />
      </Card>

      <Modal
        title={
          selectedPedido ? "Editar Pedido" : "Crear Pedido desde Cotización"
        }
        open={modalVisible}
        onCancel={() => handleModalClose(false)}
        footer={null}
        width={1200}
        destroyOnHidden // ✅ Cambio: destroyOnClose → destroyOnHidden
      >
        <PedidoForm
          pedido={selectedPedido}
          onSuccess={() => handleModalClose(true)}
          onCancel={() => handleModalClose(false)}
        />
      </Modal>

      <Modal
        title="Detalle de Pedido"
        open={detalleVisible}
        onCancel={() => setDetalleVisible(false)}
        footer={null}
        width={1000}
        destroyOnHidden // ✅ Cambio: destroyOnClose → destroyOnHidden
      >
        {selectedPedido && (
          <PedidoDetalle
            pedido={selectedPedido}
            onOrdenGenerada={(data) => {
              message.success(
                `Orden de fabricación ${data.orden_fabricacion.numero_ord} generada exitosamente`
              );
              setDetalleVisible(false);
              fetchPedidos(); // Recargar lista de pedidos
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default Pedidos;
