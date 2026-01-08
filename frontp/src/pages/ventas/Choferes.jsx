import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  message,
  Card,
  Space,
  Tag,
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
  UserOutlined,
} from "@ant-design/icons";
import api from "../../api/api";
import ChoferForm from "./ChoferForm";
import ChoferDetalle from "./ChoferDetalle";

const { Title } = Typography;
const { Search } = Input;

const Choferes = ({ user }) => {
  const [choferes, setChoferes] = useState([]);
  const [opcionesFormulario, setOpcionesFormulario] = useState({});
  const [datosFormulario, setDatosFormulario] = useState({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingFormData, setLoadingFormData] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingChofer, setEditingChofer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    cargarChoferes();
    cargarDatosFormulario();
    cargarOpcionesFormulario();
  }, []);

  const cargarChoferes = async () => {
    setLoading(true);
    try {
      const response = await api.get("/ventas/choferes");
      setChoferes(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error al cargar choferes:", error);
      message.error("Error al cargar la lista de choferes");
      setChoferes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await api.get("/ventas/choferes");
      setChoferes(Array.isArray(response.data) ? response.data : []);
      message.success("Lista actualizada");
    } catch (error) {
      console.error("Error al cargar choferes:", error);
      message.error("Error al cargar la lista de choferes");
    } finally {
      setRefreshing(false);
    }
  };

  const cargarDatosFormulario = async () => {
    setLoadingFormData(true);
    try {
      const response = await api.get("/ventas/formularios/datos");
      setDatosFormulario(response.data);
    } catch (error) {
      console.error("Error al cargar datos del formulario:", error);
      message.error("Error al cargar los datos del formulario");
      setDatosFormulario({});
    } finally {
      setLoadingFormData(false);
    }
  };

  const cargarOpcionesFormulario = async () => {
    try {
      const response = await api.get("/ventas/choferes/formularios/opciones");
      setOpcionesFormulario(response.data);
    } catch (error) {
      console.error("Error al cargar opciones del formulario:", error);
      message.error("Error al cargar las opciones del formulario");
      setOpcionesFormulario({});
    }
  };

  const handleCreate = () => {
    setEditingChofer(null);
    setModalVisible(true);
  };

  const handleEdit = async (record) => {
    try {
      const response = await api.get(`/ventas/choferes/${record.codigo}`);
      setEditingChofer(response.data);
      setModalVisible(true);
    } catch (error) {
      console.error("Error al cargar chofer:", error);
      message.error("Error al cargar los datos del chofer");
    }
  };

  const handleView = async (record) => {
    try {
      const response = await api.get(`/ventas/choferes/${record.codigo}`);
      setEditingChofer(response.data);
      setDetailModalVisible(true);
    } catch (error) {
      console.error("Error al cargar chofer:", error);
      message.error("Error al cargar los detalles del chofer");
    }
  };

  const handleDelete = async (codigo) => {
    Modal.confirm({
      title: "¿Está seguro de eliminar este chofer?",
      content: "Esta acción no se puede deshacer.",
      okText: "Sí, eliminar",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await api.delete(`/ventas/choferes/${codigo}`);
          message.success("Chofer eliminado correctamente");
          cargarChoferes();
        } catch (error) {
          console.error("Error al eliminar chofer:", error);
          const errorMsg =
            error.response?.data?.error || "Error al eliminar el chofer";
          message.error(errorMsg);
        }
      },
    });
  };

  const handleToggleStatus = async (codigo, currentStatus) => {
    try {
      await api.put(`/ventas/choferes/${codigo}`, {
        estado: !currentStatus,
      });

      message.success(
        `Chofer ${!currentStatus ? "activado" : "desactivado"} correctamente`
      );
      cargarChoferes();
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      message.error("Error al cambiar el estado del chofer");
    }
  };

  const handleSubmitSuccess = () => {
    setModalVisible(false);
    cargarChoferes();
  };

  const getTipoPertenenciaColor = (tipo) => {
    switch (tipo) {
      case "PERSONAL":
        return "blue";
      case "TRANSPORTISTA":
        return "green";
      case "CLIENTE":
        return "orange";
      default:
        return "default";
    }
  };

  const filteredChoferes = choferes.filter((chofer) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (chofer.codigo && chofer.codigo.toLowerCase().includes(searchLower)) ||
      (chofer.nombre_completo &&
        chofer.nombre_completo.toLowerCase().includes(searchLower)) ||
      (chofer.nro_documento &&
        chofer.nro_documento.toLowerCase().includes(searchLower)) ||
      (chofer.nro_licencia &&
        chofer.nro_licencia.toLowerCase().includes(searchLower)) ||
      (chofer.empresa_razon_social &&
        chofer.empresa_razon_social.toLowerCase().includes(searchLower)) ||
      (chofer.tipo_pertenencia &&
        chofer.tipo_pertenencia.toLowerCase().includes(searchLower))
    );
  });

  const columns = [
    {
      title: "Código",
      dataIndex: "codigo",
      key: "codigo",
      width: 100,
      sorter: (a, b) => a.codigo.localeCompare(b.codigo),
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Nº Chofer",
      dataIndex: "cod_chofer",
      key: "cod_chofer",
      width: 90,
      sorter: (a, b) => (a.cod_chofer || 0) - (b.cod_chofer || 0),
      render: (text) => (
        <Tag color="purple">{String(text).padStart(3, "0")}</Tag>
      ),
    },
    {
      title: "Nombre Completo",
      dataIndex: "nombre_completo",
      key: "nombre_completo",
      width: 200,
      sorter: (a, b) =>
        (a.nombre_completo || "").localeCompare(b.nombre_completo || ""),
      render: (text) => (
        <div style={{ fontWeight: "bold" }}>{text || "N/A"}</div>
      ),
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
          <div style={{ fontWeight: "bold" }}>
            {record.nro_documento || "N/A"}
          </div>
        </div>
      ),
    },
    {
      title: "Tipo",
      dataIndex: "tipo_pertenencia",
      key: "tipo_pertenencia",
      width: 130,
      filters: [
        { text: "Personal", value: "PERSONAL" },
        { text: "Transportista", value: "TRANSPORTISTA" },
        { text: "Cliente", value: "CLIENTE" },
      ],
      onFilter: (value, record) => record.tipo_pertenencia === value,
      render: (text) => (
        <Tag color={getTipoPertenenciaColor(text)}>{text || "N/A"}</Tag>
      ),
    },
    {
      title: "Empresa/Entidad",
      key: "empresa",
      width: 200,
      render: (_, record) => {
        let nombre = "N/A";

        if (record.tipo_pertenencia === "PERSONAL" && record.personal_nombre) {
          nombre = record.empresa_razon_social || "N/A";
        } else if (
          record.tipo_pertenencia === "TRANSPORTISTA" &&
          record.transportista_nombre
        ) {
          nombre = record.transportista_nombre;
        } else if (
          record.tipo_pertenencia === "CLIENTE" &&
          record.cliente_nombre
        ) {
          nombre = record.cliente_nombre;
        } else {
          nombre = record.empresa_razon_social || "N/A";
        }

        return (
          <div>
            <div style={{ fontWeight: "bold", fontSize: "13px" }}>{nombre}</div>
            {record.empresa_documento && (
              <div style={{ fontSize: "11px", color: "#666" }}>
                RUC: {record.empresa_documento}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Licencia",
      dataIndex: "nro_licencia",
      key: "nro_licencia",
      width: 120,
      render: (text) => text || "Sin licencia",
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
      width: 120,
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
              <UserOutlined style={{ marginRight: 8 }} />
              Gestión de Choferes
            </Title>
            <p style={{ margin: 0, color: "#666" }}>
              Total de choferes: {choferes.length}
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
                Nuevo Chofer
              </Button>
            </Space>
          </Col>
        </Row>

        <Row style={{ marginBottom: 20 }}>
          <Col span={24}>
            <Search
              placeholder="Buscar por código, nombre, documento, licencia, empresa o tipo..."
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
          dataSource={filteredChoferes}
          loading={loading}
          rowKey="codigo"
          locale={{
            emptyText: "No se encontraron choferes",
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} de ${total} choferes`,
          }}
          scroll={{ x: 1400 }}
          size="middle"
        />
      </Card>

      {/* Modal para crear/editar chofer */}
      <Modal
        title={editingChofer ? "Editar Chofer" : "Nuevo Chofer"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={900}
        destroyOnClose
      >
        <ChoferForm
          editingChofer={editingChofer}
          datosFormulario={datosFormulario}
          opcionesFormulario={opcionesFormulario}
          loadingFormData={loadingFormData}
          onSuccess={handleSubmitSuccess}
          onCancel={() => setModalVisible(false)}
        />
      </Modal>

      {/* Modal para ver detalles del chofer */}
      <Modal
        title="Detalles del Chofer"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Cerrar
          </Button>,
          <Button
            key="edit"
            type="primary"
            onClick={() => {
              setDetailModalVisible(false);
              handleEdit(editingChofer);
            }}
          >
            Editar
          </Button>,
        ]}
        width={900}
      >
        <ChoferDetalle chofer={editingChofer} />
      </Modal>
    </div>
  );
};

export default Choferes;
