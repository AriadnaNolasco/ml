// OrdenFabricacionDetalle.jsx
import React, { useState } from "react";
import {
  Descriptions,
  Table,
  Tag,
  Button,
  InputNumber,
  message,
  Space,
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Modal,
  Select,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SaveOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import axios from "axios";

const OrdenFabricacionDetalle = ({ orden, onActualizado }) => {
  const [cantidadesProducidas, setCantidadesProducidas] = useState({});
  const [loadingUpdate, setLoadingUpdate] = useState({});
  const [estadosItems, setEstadosItems] = useState({});

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-PE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  const getEstadoItemColor = (estado) => {
    const colors = {
      PENDIENTE: "default",
      PROGRAMADO: "blue",
      EN_PROCESO: "processing",
      PAUSADO: "warning",
      EN_CALIDAD: "purple",
      DEVUELTO: "orange",
      TERMINADO: "success",
      ANULADO: "error",
    };
    return colors[estado] || "default";
  };

  const handleCantidadChange = (idDetalle, value) => {
    setCantidadesProducidas((prev) => ({
      ...prev,
      [idDetalle]: value,
    }));
  };

  const handleActualizarCantidad = async (item) => {
    const nuevaCantidad = cantidadesProducidas[item.id_detalle_ord_fab];

    if (nuevaCantidad === undefined || nuevaCantidad === null) {
      message.warning("Ingrese una cantidad válida");
      return;
    }

    if (nuevaCantidad < 0) {
      message.warning("La cantidad no puede ser negativa");
      return;
    }

    if (nuevaCantidad > item.cantidad_requerida) {
      message.warning(
        "La cantidad producida no puede superar la cantidad requerida"
      );
      return;
    }

    Modal.confirm({
      title: "Confirmar actualización",
      content: `¿Actualizar cantidad producida de "${item.descripcion}" a ${nuevaCantidad}?`,
      okText: "Sí, actualizar",
      cancelText: "Cancelar",
      onOk: async () => {
        setLoadingUpdate((prev) => ({ ...prev, [item.id_detalle_ord_fab]: true }));
        try {
          const token = localStorage.getItem("token");
          const response = await axios.put(
            `${import.meta.env.VITE_API_URL}/ordenes-fabricacion/ordenes-fabricacion/detalle/${item.id_detalle_ord_fab}/cantidad-producida`,
            { cantidad_producida: nuevaCantidad },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (response.data.success) {
            message.success("Cantidad actualizada exitosamente");
            if (onActualizado) {
              onActualizado();
            }
          } else {
            message.error(response.data.error || "Error al actualizar cantidad");
          }
        } catch (error) {
          const errorMsg =
            error.response?.data?.error || "Error al actualizar cantidad";
          message.error(errorMsg);
          console.error(error);
        } finally {
          setLoadingUpdate((prev) => ({
            ...prev,
            [item.id_detalle_ord_fab]: false,
          }));
        }
      },
    });
  };

  const calcularEstadisticas = () => {
    if (!orden.items || orden.items.length === 0) {
      return {
        totalItems: 0,
        itemsTerminados: 0,
        itemsEnProceso: 0,
        itemsPendientes: 0,
        porcentajeAvance: 0,
        cantidadTotal: 0,
        cantidadProducida: 0,
      };
    }

    const totalItems = orden.items.length;
    const itemsTerminados = orden.items.filter(
      (i) => i.estado_item === "TERMINADO"
    ).length;
    const itemsEnProceso = orden.items.filter(
      (i) => i.estado_item === "EN_PROCESO"
    ).length;
    const itemsPendientes = orden.items.filter(
      (i) => i.estado_item === "PENDIENTE" || i.estado_item === "PROGRAMADO"
    ).length;

    const cantidadTotal = orden.items.reduce(
      (sum, i) => sum + parseFloat(i.cantidad_requerida || 0),
      0
    );
    const cantidadProducida = orden.items.reduce(
      (sum, i) => sum + parseFloat(i.cantidad_producida || 0),
      0
    );

    const porcentajeAvance =
      cantidadTotal > 0 ? (cantidadProducida / cantidadTotal) * 100 : 0;

    return {
      totalItems,
      itemsTerminados,
      itemsEnProceso,
      itemsPendientes,
      porcentajeAvance: Math.round(porcentajeAvance),
      cantidadTotal,
      cantidadProducida,
    };
  };

  const stats = calcularEstadisticas();

  const columns = [
    {
      title: "Item",
      dataIndex: "num_item",
      key: "num_item",
      width: 60,
      align: "center",
    },
    {
      title: "Código",
      dataIndex: "codigo_producto",
      key: "codigo_producto",
      width: 120,
    },
    {
      title: "Producto",
      dataIndex: "descripcion",
      key: "descripcion",
      width: 300,
      ellipsis: true,
    },
    {
      title: "Unidad",
      dataIndex: "unidad_medida",
      key: "unidad_medida",
      width: 80,
      align: "center",
    },
    {
      title: "Cant. Requerida",
      dataIndex: "cantidad_requerida",
      key: "cantidad_requerida",
      width: 130,
      align: "right",
      render: (text) => parseFloat(text || 0).toFixed(2),
    },
    {
      title: "Cant. Producida",
      dataIndex: "cantidad_producida",
      key: "cantidad_producida",
      width: 130,
      align: "right",
      render: (text) => parseFloat(text || 0).toFixed(2),
    },
    {
      title: "Avance",
      key: "avance",
      width: 120,
      render: (_, record) => {
        const porcentaje =
          record.cantidad_requerida > 0
            ? Math.round(
                (record.cantidad_producida / record.cantidad_requerida) * 100
              )
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
      dataIndex: "estado_item",
      key: "estado_item",
      width: 120,
      align: "center",
      render: (text) => (
        <Tag color={getEstadoItemColor(text)}>{text || "PENDIENTE"}</Tag>
      ),
    },
    {
      title: "Actualizar Producción",
      key: "actualizar",
      width: 250,
      render: (_, record) => {
        // Solo permitir actualizar si la orden está EN_PROCESO
        if (orden.estado !== "EN_PROCESO") {
          return (
            <span style={{ color: "#999" }}>
              Solo en proceso
            </span>
          );
        }

        return (
          <Space>
            <InputNumber
              min={0}
              max={record.cantidad_requerida}
              precision={2}
              placeholder="Cantidad"
              style={{ width: 120 }}
              value={cantidadesProducidas[record.id_detalle_ord_fab]}
              onChange={(value) =>
                handleCantidadChange(record.id_detalle_ord_fab, value)
              }
            />
            <Button
              type="primary"
              size="small"
              icon={<SaveOutlined />}
              loading={loadingUpdate[record.id_detalle_ord_fab]}
              onClick={() => handleActualizarCantidad(record)}
              disabled={
                cantidadesProducidas[record.id_detalle_ord_fab] === undefined
              }
            >
              Guardar
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      {/* Estadísticas de la orden */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Total Items"
              value={stats.totalItems}
              prefix={<ToolOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="En Proceso"
              value={stats.itemsEnProceso}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Terminados"
              value={stats.itemsTerminados}
              valueStyle={{ color: "#52c41a" }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Avance General"
              value={stats.porcentajeAvance}
              suffix="%"
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Información de la orden */}
      <Card title="Información de la Orden" style={{ marginBottom: 16 }}>
        <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label="N° Orden">
            <strong>{orden.numero_ord}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Estado">
            <Tag color={getEstadoColor(orden.estado)}>{orden.estado}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Prioridad">
            <Tag
              color={
                orden.prioridad === "URGENTE" ||
                orden.prioridad === "STOCK URGENTE"
                  ? "red"
                  : "blue"
              }
            >
              {orden.prioridad || "NORMAL"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="N° Pedido">
            {orden.numero_pedido}
          </Descriptions.Item>
          <Descriptions.Item label="Cliente" span={2}>
            {orden.razon_social_cliente}
          </Descriptions.Item>
          <Descriptions.Item label="Fecha Creación">
            {formatDate(orden.fecha_creacion)}
          </Descriptions.Item>
          <Descriptions.Item label="Fecha Inicio">
            {formatDate(orden.fecha_inicio_real)}
          </Descriptions.Item>
          <Descriptions.Item label="Fecha Fin">
            {formatDate(orden.fecha_fin_real)}
          </Descriptions.Item>
          {orden.observaciones && (
            <Descriptions.Item label="Observaciones" span={3}>
              {orden.observaciones}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Tabla de items */}
      <Card title="Items de Fabricación">
        <Table
          columns={columns}
          dataSource={orden.items || []}
          rowKey="id_detalle_ord_fab"
          pagination={false}
          scroll={{ x: 1400 }}
          summary={(pageData) => {
            const totalRequerida = pageData.reduce(
              (sum, item) => sum + parseFloat(item.cantidad_requerida || 0),
              0
            );
            const totalProducida = pageData.reduce(
              (sum, item) => sum + parseFloat(item.cantidad_producida || 0),
              0
            );
            const porcentaje =
              totalRequerida > 0
                ? Math.round((totalProducida / totalRequerida) * 100)
                : 0;

            return (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={4} align="right">
                    <strong>TOTALES:</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <strong>{totalRequerida.toFixed(2)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right">
                    <strong>{totalProducida.toFixed(2)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>
                    <Progress percent={porcentaje} size="small" />
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} colSpan={2} />
                </Table.Summary.Row>
              </Table.Summary>
            );
          }}
        />
      </Card>
    </div>
  );
};

export default OrdenFabricacionDetalle;
