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
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import axios from "axios";
import CotizacionForm from "./CotizacionForm";
import CotizacionDetalle from "./CotizacionDetalle";

const { RangePicker } = DatePicker;

const Cotizaciones = () => {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [detalleVisible, setDetalleVisible] = useState(false);
  const [selectedCotizacion, setSelectedCotizacion] = useState(null);
  const [estadoFilter, setEstadoFilter] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pendientes: 0,
    aprobadas: 0,
    totalMonto: 0,
  });

  useEffect(() => {
    fetchCotizaciones();
  }, []);

  const fetchCotizaciones = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/ventas/cotizaciones`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCotizaciones(response.data);
      calculateStats(response.data);
    } catch (error) {
      message.error("Error al cargar cotizaciones");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const pendientes = data.filter((c) => c.estado === "PENDIENTE").length;
    const aprobadas = data.filter((c) => c.estado === "APROBADO").length;
    const totalMonto = data.reduce(
      (sum, c) => sum + parseFloat(c.total || 0),
      0
    );

    setStats({
      total: data.length,
      pendientes,
      aprobadas,
      totalMonto,
    });
  };

  const handleNuevaCotizacion = () => {
    setSelectedCotizacion(null);
    setModalVisible(true);
  };

  const handleVerDetalle = (record) => {
    setSelectedCotizacion(record);
    setDetalleVisible(true);
  };

  const handleEditar = (record) => {
    setSelectedCotizacion(record);
    setModalVisible(true);
  };

  const handleEliminar = (record) => {
    Modal.confirm({
      title: "¿Está seguro de anular esta cotización?",
      content: `Cotización N° ${record.numero}`,
      okText: "Sí, anular",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          const token = localStorage.getItem("token");
          await axios.put(
            `${import.meta.env.VITE_API_URL}/ventas/cotizaciones/${
              record.id_cotizacion
            }/anular`,
            {},
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          message.success("Cotización anulada exitosamente");
          fetchCotizaciones();
        } catch (error) {
          message.error("Error al anular cotización");
          console.error(error);
        }
      },
    });
  };

  const handleModalClose = (refresh) => {
    setModalVisible(false);
    setSelectedCotizacion(null);
    if (refresh) {
      fetchCotizaciones();
    }
  };

  const formatCurrency = (amount) => {
    return `S/ ${parseFloat(amount || 0).toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const columns = [
    {
      title: "N° Cotización",
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
      render: (text) => new Date(text).toLocaleDateString("es-PE"),
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
      title: "Vendedor",
      key: "vendedor",
      width: 150,
      render: (_, record) => record.vendedor_nombre || "N/A",
    },
    {
      title: "Moneda",
      dataIndex: "moneda_codigo",
      key: "moneda_codigo",
      width: 80,
      align: "center",
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
          NORMAL: "default",
          URGENTE: "red",
          "STOCK URGENTE": "orange",
          "STOCK NORMAL": "blue",
        };
        return <Tag color={colors[text] || "default"}>{text}</Tag>;
      },
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      width: 120,
      align: "center",
      render: (text) => {
        const colors = {
          PENDIENTE: "warning",
          APROBADO: "success",
          RECHAZADO: "error",
          ANULADO: "default",
        };
        return <Tag color={colors[text]}>{text}</Tag>;
      },
    },
    {
      title: "Acciones",
      key: "acciones",
      fixed: "right",
      width: 150,
      render: (_, record) => (
        <Space size='small'>
          <Button
            type='link'
            icon={<EyeOutlined />}
            onClick={() => handleVerDetalle(record)}
          >
            Ver
          </Button>
          {record.estado === "PENDIENTE" && (
            <>
              <Button
                type='link'
                icon={<EditOutlined />}
                onClick={() => handleEditar(record)}
              >
                Editar
              </Button>
              <Button
                type='link'
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleEliminar(record)}
              >
                Anular
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const filteredData = cotizaciones.filter((item) => {
    const matchSearch =
      item.numero?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.razon_social_cliente
        ?.toLowerCase()
        .includes(searchText.toLowerCase()) ||
      item.codigo_cliente?.toLowerCase().includes(searchText.toLowerCase());

    const matchEstado = estadoFilter ? item.estado === estadoFilter : true;

    return matchSearch && matchEstado;
  });

  return (
    <div style={{ padding: "24px" }}>
      <Card>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title='Total Cotizaciones'
                value={stats.total}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title='Pendientes'
                value={stats.pendientes}
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title='Aprobadas'
                value={stats.aprobadas}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title='Total en Soles'
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
            <Col xs={24} md={12}>
              <Input
                placeholder='Buscar por N° cotización, cliente, código...'
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={12} md={6}>
              <Select
                placeholder='Filtrar por estado'
                style={{ width: "100%" }}
                allowClear
                onChange={setEstadoFilter}
              >
                <Select.Option value='PENDIENTE'>Pendiente</Select.Option>
                <Select.Option value='APROBADO'>Aprobado</Select.Option>
                <Select.Option value='RECHAZADO'>Rechazado</Select.Option>
                <Select.Option value='ANULADO'>Anulado</Select.Option>
              </Select>
            </Col>
            <Col xs={12} md={6}>
              <Button
                type='primary'
                icon={<PlusOutlined />}
                onClick={handleNuevaCotizacion}
                block
              >
                Nueva Cotización
              </Button>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          rowKey='id_cotizacion'
          scroll={{ x: 1500 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} cotizaciones`,
          }}
        />
      </Card>

      <Modal
        title={selectedCotizacion ? "Editar Cotización" : "Nueva Cotización"}
        open={modalVisible}
        onCancel={() => handleModalClose(false)}
        footer={null}
        width={1200}
        destroyOnClose
      >
        <CotizacionForm
          cotizacion={selectedCotizacion}
          onSuccess={() => handleModalClose(true)}
          onCancel={() => handleModalClose(false)}
        />
      </Modal>

      <Modal
        title='Detalle de Cotización'
        open={detalleVisible}
        onCancel={() => setDetalleVisible(false)}
        footer={null}
        width={1000}
        destroyOnClose
      >
        <CotizacionDetalle cotizacion={selectedCotizacion} />
      </Modal>
    </div>
  );
};

export default Cotizaciones;
