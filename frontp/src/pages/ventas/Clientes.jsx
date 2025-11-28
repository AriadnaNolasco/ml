import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  message,
  Card,
  Space,
  Tag,
  Spin,
  Row,
  Col,
  Typography,
  Input,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import api from "../../api/api";
import ClienteForm from "./ClienteForm";
import ClienteDetalle from "./ClienteDetalle";

const { Title } = Typography;
const { Search } = Input;

const Clientes = ({ user }) => {
  const [clientes, setClientes] = useState([]);
  const [paises, setPaises] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [formasPago, setFormasPago] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [distritos, setDistritos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingFormData, setLoadingFormData] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    cargarClientes();
    cargarDatosFormulario();
  }, []);

  const cargarClientes = async () => {
    setLoading(true);
    try {
      const response = await api.get("/ventas/clientes");
      setClientes(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
      message.error("Error al cargar la lista de clientes");
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await api.get("/ventas/clientes");
      setClientes(Array.isArray(response.data) ? response.data : []);
      message.success("Lista actualizada");
    } catch (error) {
      console.error("Error al cargar clientes:", error);
      message.error("Error al cargar la lista de clientes");
    } finally {
      setRefreshing(false);
    }
  };

  const cargarDatosFormulario = async () => {
    setLoadingFormData(true);
    try {
      const response = await api.get("/ventas/formularios/datos");
      const formData = response.data;
      setPaises(formData.paises || []);
      setTiposDocumento(formData.tiposDocumento || []);
      setVendedores(formData.vendedores || []);
      setDepartamentos(formData.departamentos || []);
      setDistritos(formData.distritos || []);

      // Si el backend no devuelve formasPago, podemos cargarlas por separado
      if (formData.formasPago) {
        setFormasPago(formData.formasPago);
      } else {
        // Intentar cargar formas de pago por separado si no están en el endpoint
        try {
          const formasPagoResponse = await api.get("/contabilidad/formas-pago");
          setFormasPago(formasPagoResponse.data || []);
        } catch (error) {
          console.warn("No se pudieron cargar las formas de pago:", error);
          setFormasPago([]);
        }
      }
    } catch (error) {
      console.error("Error al cargar datos del formulario:", error);
      message.error("Error al cargar los datos del formulario");
      setPaises([]);
      setTiposDocumento([]);
      setVendedores([]);
      setFormasPago([]);
      setDepartamentos([]);
      setDistritos([]);
    } finally {
      setLoadingFormData(false);
    }
  };

  const handleCreate = () => {
    setEditingCliente(null);
    setModalVisible(true);
  };

  const handleEdit = async (record) => {
    try {
      const response = await api.get(`/ventas/clientes/${record.codigo}`);
      setEditingCliente(response.data);
      setModalVisible(true);
    } catch (error) {
      console.error("Error al cargar cliente:", error);
      message.error("Error al cargar los datos del cliente");
    }
  };

  const handleView = async (record) => {
    try {
      const response = await api.get(`/ventas/clientes/${record.codigo}`);
      setEditingCliente(response.data);
      setDetailModalVisible(true);
    } catch (error) {
      console.error("Error al cargar cliente:", error);
      message.error("Error al cargar los detalles del cliente");
    }
  };

  const handleDelete = async (codigo) => {
    Modal.confirm({
      title: "¿Está seguro de eliminar este cliente?",
      content:
        "El cliente será marcado como inactivo. Esta acción se puede revertir editando el cliente.",
      okText: "Sí, eliminar",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await api.delete(`/ventas/clientes/${codigo}`);
          message.success("Cliente eliminado correctamente");
          cargarClientes();
        } catch (error) {
          console.error("Error al eliminar cliente:", error);
          const errorMsg =
            error.response?.data?.error || "Error al eliminar el cliente";
          message.error(errorMsg);
        }
      },
    });
  };

  const handleToggleStatus = async (codigo, currentStatus) => {
    try {
      // Para cambiar el estado, necesitamos hacer un PUT completo o un PATCH
      // Como el backend no tiene un endpoint específico para estado, usamos PUT
      const cliente = clientes.find((c) => c.codigo === codigo);
      if (!cliente) {
        message.error("Cliente no encontrado");
        return;
      }

      // Obtener datos completos del cliente primero
      const response = await api.get(`/ventas/clientes/${codigo}`);
      const clienteCompleto = response.data;

      // Actualizar solo el estado
      await api.put(`/ventas/clientes/${codigo}`, {
        ...clienteCompleto,
        estado: !currentStatus,
      });

      message.success(
        `Cliente ${!currentStatus ? "activado" : "desactivado"} correctamente`
      );
      cargarClientes();
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      message.error("Error al cambiar el estado del cliente");
    }
  };

  const handleSubmitSuccess = () => {
    setModalVisible(false);
    setEditingCliente(null);
    cargarClientes();
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setEditingCliente(null);
  };

  const handleDetailModalCancel = () => {
    setDetailModalVisible(false);
    setEditingCliente(null);
  };

  const filteredClientes = clientes.filter((cliente) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (cliente.razon_social &&
        cliente.razon_social.toLowerCase().includes(searchLower)) ||
      (cliente.nomb_comercial &&
        cliente.nomb_comercial.toLowerCase().includes(searchLower)) ||
      (cliente.nro_documento && cliente.nro_documento.includes(searchTerm)) ||
      (cliente.codigo && cliente.codigo.toLowerCase().includes(searchLower)) ||
      (cliente.email && cliente.email.toLowerCase().includes(searchLower)) ||
      (cliente.vendedor_nombre &&
        cliente.vendedor_nombre.toLowerCase().includes(searchLower)) ||
      (cliente.departamento &&
        cliente.departamento.toLowerCase().includes(searchLower)) ||
      (cliente.distrito &&
        cliente.distrito.toLowerCase().includes(searchLower)) ||
      (cliente.direccion &&
        cliente.direccion.toLowerCase().includes(searchLower))
    );
  });

  const columns = [
    {
      title: "Código",
      dataIndex: "codigo",
      key: "codigo",
      width: 100,
      sorter: (a, b) => a.codigo.localeCompare(b.codigo),
    },
    {
      title: "Documento",
      key: "documento",
      width: 150,
      render: (_, record) => (
        <div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            {record.tipo_documento || "N/A"}
          </div>
          <div>{record.nro_documento || "N/A"}</div>
        </div>
      ),
    },
    {
      title: "Razón Social",
      dataIndex: "razon_social",
      key: "razon_social",
      ellipsis: true,
      sorter: (a, b) =>
        (a.razon_social || "").localeCompare(b.razon_social || ""),
    },
    {
      title: "Nombre Comercial",
      dataIndex: "nomb_comercial",
      key: "nomb_comercial",
      ellipsis: true,
      render: (text) => text || "N/A",
    },
    {
      title: "Vendedor",
      key: "vendedor",
      width: 150,
      render: (_, record) => (
        <div>
          <div style={{ fontSize: "12px" }}>
            {record.vendedor_codigo || "N/A"}
          </div>
          <div style={{ fontSize: "11px", color: "#666" }}>
            {record.vendedor_nombre || "N/A"}
          </div>
        </div>
      ),
    },
    {
      title: "Ubicación",
      key: "ubicacion",
      width: 180,
      render: (_, record) => (
        <div>
          <div style={{ fontSize: "12px" }}>
            <strong>{record.departamento || "N/A"}</strong>
          </div>
          <div style={{ fontSize: "11px", color: "#666" }}>
            {record.distrito || "N/A"}
          </div>
          {record.direccion && (
            <div style={{ fontSize: "10px", color: "#999", marginTop: "2px" }}>
              {record.direccion.length > 30
                ? `${record.direccion.substring(0, 30)}...`
                : record.direccion}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Contacto",
      key: "contacto",
      width: 140,
      render: (_, record) => {
        const telefono = record.celular1 || record.telefono1 || "N/A";
        const email = record.email || "N/A";
        return (
          <div>
            <div style={{ fontSize: "12px" }}>{telefono}</div>
            <div style={{ fontSize: "11px", color: "#666" }}>{email}</div>
          </div>
        );
      },
    },
    {
      title: "Línea Crédito",
      key: "linea_credito",
      width: 120,
      render: (_, record) => (
        <div style={{ textAlign: "right" }}>
          {record.linea_credito
            ? `S/ ${parseFloat(record.linea_credito).toLocaleString("es-PE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`
            : "S/ 0.00"}
        </div>
      ),
    },
    {
      title: "Estado",
      key: "estado",
      width: 100,
      filters: [
        { text: "Activo", value: true },
        { text: "Inactivo", value: false },
      ],
      onFilter: (value, record) => record.estado === value,
      render: (_, record) => (
        <Tag
          color={record.estado ? "green" : "red"}
          style={{ cursor: "pointer" }}
          onClick={() => handleToggleStatus(record.codigo, record.estado)}
          title="Clic para cambiar estado"
        >
          {record.estado ? "Activo" : "Inactivo"}
        </Tag>
      ),
    },
    {
      title: "Acciones",
      key: "acciones",
      width: 130,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
            title="Ver detalles"
          />
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title="Editar"
          />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.codigo)}
            title="Eliminar"
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: 20 }}
        >
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              Gestión de Clientes
            </Title>
            <p style={{ margin: 0, color: "#666" }}>
              Total de clientes: {clientes.length}{" "}
              {filteredClientes.length !== clientes.length &&
                `(${filteredClientes.length} filtrados)`}
            </p>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={refreshing}
                title="Actualizar lista"
              >
                Actualizar
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
                size="large"
              >
                Nuevo Cliente
              </Button>
            </Space>
          </Col>
        </Row>

        <Row style={{ marginBottom: 20 }}>
          <Col span={24}>
            <Search
              placeholder="Buscar por código, RUC/DNI, razón social, nombre comercial, email, vendedor, departamento, distrito o dirección..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onSearch={handleRefresh}
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredClientes}
          loading={loading}
          rowKey="codigo"
          locale={{
            emptyText: "No se encontraron clientes",
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} de ${total} clientes`,
          }}
          scroll={{ x: 1500 }}
          size="middle"
        />
      </Card>

      {/* Modal para crear/editar cliente */}
      <Modal
        title={
          editingCliente
            ? `Editar Cliente - ${editingCliente.codigo}`
            : "Nuevo Cliente"
        }
        open={modalVisible}
        onCancel={handleModalCancel}
        footer={null}
        width={1000}
        destroyOnClose
        style={{ top: 20 }}
      >
        <ClienteForm
          editingCliente={editingCliente}
          paises={paises}
          tiposDocumento={tiposDocumento}
          vendedores={vendedores}
          formasPago={formasPago}
          departamentos={departamentos}
          distritos={distritos}
          loadingFormData={loadingFormData}
          onSuccess={handleSubmitSuccess}
          onCancel={handleModalCancel}
        />
      </Modal>

      {/* Modal para ver detalles del cliente */}
      <Modal
        title={`Detalles del Cliente - ${editingCliente?.codigo || ""}`}
        open={detailModalVisible}
        onCancel={handleDetailModalCancel}
        footer={[
          <Button key="close" onClick={handleDetailModalCancel}>
            Cerrar
          </Button>,
          <Button
            key="edit"
            type="primary"
            onClick={() => {
              setDetailModalVisible(false);
              // Pequeño delay para asegurar que el modal se cierre antes de abrir el de edición
              setTimeout(() => handleEdit(editingCliente), 100);
            }}
          >
            Editar
          </Button>,
        ]}
        width={1000}
        destroyOnClose
        style={{ top: 20 }}
      >
        <ClienteDetalle cliente={editingCliente} loading={!editingCliente} />
      </Modal>
    </div>
  );
};

export default Clientes;
