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
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  TruckOutlined,
} from "@ant-design/icons";
import api from "../../api/api";
import EquiposForm from "./EquiposForm";
import EquiposDetalle from "./EquiposDetalle";

const { Title } = Typography;
const { Search } = Input;

const Equipos = ({ user }) => {
  const [recepciones, setRecepciones] = useState([]);
  const [motivosRecepcion, setMotivosRecepcion] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingFormData, setLoadingFormData] = useState(false);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingRecepcion, setEditingRecepcion] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarRecepciones();
    cargarDatosFormulario();
  }, []);

  const cargarRecepciones = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/mantenimiento/equipos");
      setRecepciones(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error al cargar recepciones:", error);
      const errorMsg = error.response?.data?.error || "Error al cargar la lista de recepciones.";
      message.error(errorMsg);
      setError(errorMsg);
      setRecepciones([]);
    } finally {
      setLoading(false);
    }
  };

  const cargarDatosFormulario = async () => {
    setLoadingFormData(true);
    try {
      const response = await api.get("/mantenimiento/equipos/options");
      setMotivosRecepcion(response.data.motivos_recepcion || []);
    } catch (error) {
      console.error("Error al cargar datos del formulario:", error);
      message.error("Error al cargar datos de apoyo para el formulario.");
      setMotivosRecepcion([]);
    } finally {
      setLoadingFormData(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await cargarRecepciones();
    setRefreshing(false);
  };

  const handleCreate = () => {
    setEditingRecepcion(null);
    setModalVisible(true);
  };

  const handleEdit = async (record) => {
    try {
      // 1. Cargamos la data completa de la recepción (incluye cliente_id y cliente_ruc_guardado)
      const response = await api.get(`/mantenimiento/equipos/${record.id}`);
      const recepcionData = response.data;
      
      // Usamos el RUC que viene en la data completa para asegurar la búsqueda
      const rucToSearch = recepcionData.cliente_ruc_guardado; 
      
      // 2. Obtenemos los datos completos del cliente por RUC para el formulario (incluye id_cliente, razon_social, etc.)
      const clienteResponse = await api.get(`/mantenimiento/clientes/search?ruc=${rucToSearch}`);
      
      setEditingRecepcion({
        ...recepcionData,
        cliente_ruc: rucToSearch, // Para poblar el campo de RUC
        cliente_info: clienteResponse.data, 
      });

      setModalVisible(true);
    } catch (error) {
      console.error("Error al cargar recepción para edición:", error);
      message.error("Error al cargar los datos de la recepción para edición.");
    }
  };

  const handleView = async (record) => {
    try {
      // Cargamos la data completa para el detalle (incluye los nombres necesarios)
      const response = await api.get(`/mantenimiento/equipos/${record.id}`);
      
      // Para el detalle, necesitamos unir la data de la recepción con el nombre del cliente
      const clienteResponse = await api.get(`/mantenimiento/clientes/search?ruc=${record.cliente_ruc}`);
      
      setEditingRecepcion({
        ...response.data,
        cliente_nombre: clienteResponse.data.nombre_cliente,
        cliente_ruc: clienteResponse.data.ruc,
        // Agregamos el motivo_recepcion para el detalle (asumiendo que está en el listado)
        motivo_recepcion: record.motivo_recepcion
      });
      setDetailModalVisible(true);
    } catch (error) {
      console.error("Error al cargar detalles:", error);
      message.error("Error al cargar los detalles de la recepción.");
    }
  };

  const handleDelete = (id, codigo_bpc) => {
    Modal.confirm({
      title: `¿Está seguro de eliminar la recepción con BPC: ${codigo_bpc}?`,
      content: "Esta acción eliminará permanentemente la recepción y cualquier seguimiento asociado. ¿Desea continuar?",
      okText: "Sí, Eliminar",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await api.delete(`/mantenimiento/equipos/${id}`);
          message.success("Recepción eliminada correctamente");
          cargarRecepciones();
        } catch (error) {
          console.error("Error al eliminar recepción:", error);
          const errorMsg =
            error.response?.data?.error || "Error al eliminar la recepción. Verifique si tiene procesos de seguimiento asociados.";
          message.error(errorMsg);
        }
      },
    });
  };

  const handleSubmitSuccess = () => {
    setModalVisible(false);
    setEditingRecepcion(null);
    cargarRecepciones();
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setEditingRecepcion(null);
  };

  const handleDetailModalCancel = () => {
    setDetailModalVisible(false);
    setEditingRecepcion(null);
  };

  const getEstadoClass = (estado) => {
    switch (estado) {
        case 'RECEPCIONADO':
            return 'blue';
        case 'EN EVALUACION':
            return 'gold';
        case 'EN REPARACION':
            return 'orange';
        case 'COMPLETADO':
            return 'green';
        case 'COTIZACION PENDIENTE':
            return 'purple';
        default:
            return 'default';
    }
  };

  const filteredRecepciones = recepciones.filter((recepcion) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (recepcion.codigo_bpc && recepcion.codigo_bpc.toLowerCase().includes(searchLower)) ||
      (recepcion.codigo_solped && recepcion.codigo_solped.toLowerCase().includes(searchLower)) ||
      (recepcion.cliente_nombre && recepcion.cliente_nombre.toLowerCase().includes(searchLower)) ||
      (recepcion.cliente_ruc && recepcion.cliente_ruc.includes(searchTerm)) ||
      (recepcion.nro_serie_equipo && recepcion.nro_serie_equipo.toLowerCase().includes(searchLower)) ||
      (recepcion.marca && recepcion.marca.toLowerCase().includes(searchLower)) ||
      (recepcion.modelo && recepcion.modelo.toLowerCase().includes(searchLower))
    );
  });

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: "BPC / SOLPED",
      key: "codigos",
      width: 180,
      render: (_, record) => (
        <div>
          <div style={{ fontSize: "14px", fontWeight: 'bold', color: '#1890ff' }}>
            {record.codigo_bpc || "N/A"}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            {record.codigo_solped || "S/SOLPED"}
          </div>
        </div>
      ),
      sorter: (a, b) => (a.codigo_bpc || "").localeCompare(b.codigo_bpc || ""),
    },
    {
      title: "Cliente",
      key: "cliente",
      width: 250,
      ellipsis: true,
      render: (_, record) => (
        <Tooltip title={record.cliente_nombre}>
          <div>
            <div style={{ fontSize: "12px", fontWeight: '500' }}>
              {record.cliente_nombre || "N/A"}
            </div>
            <div style={{ fontSize: "11px", color: "#666" }}>
              RUC: {record.cliente_ruc || "N/A"}
            </div>
          </div>
        </Tooltip>
      ),
      sorter: (a, b) => (a.cliente_nombre || "").localeCompare(b.cliente_nombre || ""),
    },
    {
      title: "Equipo / Serie",
      key: "equipo",
      width: 220,
      render: (_, record) => (
        <div>
          <div style={{ fontSize: "12px" }}>
            <span className="font-semibold">{record.marca || "S/Marca"}</span> / {record.modelo || "S/Modelo"}
          </div>
          <div style={{ fontSize: "11px", color: "#666" }}>
            SN: {record.nro_serie_equipo || "N/A"}
          </div>
        </div>
      ),
    },
    {
      title: "Motivo",
      dataIndex: "motivo_recepcion",
      key: "motivo_recepcion",
      width: 130,
      render: (text) => text || "N/A",
    },
    {
      title: "Fecha Rec.",
      dataIndex: "fecha_recepcion",
      key: "fecha_recepcion",
      width: 120,
      render: (text) => new Date(text).toLocaleDateString(),
      sorter: (a, b) => new Date(a.fecha_recepcion) - new Date(b.fecha_recepcion),
    },
    {
      title: "Estado Proceso",
      dataIndex: "estado_proceso",
      key: "estado_proceso",
      width: 150,
      render: (_, record) => (
        <Tag color={getEstadoClass(record.estado_proceso)} style={{ fontWeight: 'bold' }}>
          {record.estado_proceso}
        </Tag>
      ),
      filters: [
        { text: "RECEPCIONADO", value: "RECEPCIONADO" },
        { text: "EN EVALUACION", value: "EN EVALUACION" },
        { text: "EN REPARACION", value: "EN REPARACION" },
        { text: "COMPLETADO", value: "COMPLETADO" },
        { text: "COTIZACION PENDIENTE", value: "COTIZACION PENDIENTE" },
      ],
      onFilter: (value, record) => record.estado_proceso === value,
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
            onClick={() => handleDelete(record.id, record.codigo_bpc)}
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
              <TruckOutlined style={{ marginRight: 10, color: '#1890ff' }} /> Gestión de Recepción de Equipos
            </Title>
            <p style={{ margin: 0, color: "#666" }}>
              Total de recepciones: {recepciones.length}{" "}
              {filteredRecepciones.length !== recepciones.length &&
                `(${filteredRecepciones.length} filtradas)`}
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
                Nueva Recepción
              </Button>
            </Space>
          </Col>
        </Row>

        <Row style={{ marginBottom: 20 }}>
          <Col span={24}>
            <Search
              placeholder="Buscar por BPC, SOLPED, Cliente, RUC o Nro. Serie..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onSearch={handleRefresh}
            />
          </Col>
        </Row>

        {error && <div style={{ color: 'red', marginBottom: 15 }}>{error}</div>}

        {loading && !refreshing ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <p style={{ marginTop: 20 }}>Cargando datos...</p>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredRecepciones}
            loading={refreshing}
            rowKey="id"
            locale={{
              emptyText: "No se encontraron recepciones de equipos",
            }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50"],
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} de ${total} recepciones`,
            }}
            scroll={{ x: 1400 }}
            size="middle"
          />
        )}
      </Card>

      {/* Modal para crear/editar recepción */}
      <Modal
        title={
          editingRecepcion
            ? `Editar Recepción - BPC: ${editingRecepcion.codigo_bpc}`
            : "Registrar Nueva Recepción de Equipo"
        }
        open={modalVisible}
        onCancel={handleModalCancel}
        footer={null}
        width={1000}
        destroyOnClose
        style={{ top: 20 }}
      >
        {loadingFormData ? (
            <div style={{ textAlign: 'center', padding: '50px' }}><Spin tip="Cargando datos del formulario..." /></div>
        ) : (
            <EquiposForm
                editingRecepcion={editingRecepcion}
                motivosRecepcion={motivosRecepcion}
                onSuccess={handleSubmitSuccess}
                onCancel={handleModalCancel}
                user={user} 
            />
        )}
      </Modal>

      {/* Modal para ver detalles de la recepción */}
      <Modal
        title={`Detalles de Recepción - BPC: ${editingRecepcion?.codigo_bpc || ""}`}
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
              setTimeout(() => handleEdit(editingRecepcion), 100);
            }}
          >
            Editar
          </Button>,
        ]}
        width={1000}
        destroyOnClose
        style={{ top: 20 }}
      >
        <EquiposDetalle recepcion={editingRecepcion} loading={!editingRecepcion} />
      </Modal>
    </div>
  );
};

export default Equipos;