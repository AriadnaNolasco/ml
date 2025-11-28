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
  ReloadOutlined,
  SearchOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import api from "../../api/api";

const { Title } = Typography;
const { Search } = Input;
const API_BASE = '/mantenimiento/evaluaciones';
const API_RECEPCIONES = '/mantenimiento/equipos';

const Evaluaciones = ({ navigate }) => {
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [recepciones, setRecepciones] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modales
  const [modalVisible, setModalVisible] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    setLoading(true);
    try {
      const [evaluacionesResp, recepcionesResp] = await Promise.all([
        api.get(API_BASE),
        api.get(API_RECEPCIONES, { params: { estado_proceso: 'RECEPCIONADO' } })
      ]);

      setEvaluaciones(Array.isArray(evaluacionesResp.data) ? evaluacionesResp.data : []);
      
      const recepcionesDisponibles = (Array.isArray(recepcionesResp.data) ? recepcionesResp.data : [])
        .filter(r => r.estado_proceso === 'RECEPCIONADO'); // Se filtrará más a fondo en el backend o en la UI si es necesario

      setRecepciones(recepcionesDisponibles);

    } catch (error) {
      console.error("Error al cargar datos:", error);
      message.error("Error al cargar las evaluaciones o recepciones.");
      setEvaluaciones([]);
      setRecepciones([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await cargarDatosIniciales();
    message.success("Lista actualizada");
  };
  
  const handleCreate = () => {
    setModalVisible(true);
  };
  
  const handleEdit = (record) => {
    navigate(`/mantenimiento/evaluaciones/editar/${record.id}`);
  };

  const handleView = (record) => {
    navigate(`/mantenimiento/evaluaciones/detalle/${record.id}`);
  };
  
  const handleSelectRecepcion = (recepcionId) => {
      // Navegar a la ruta de creación que usa el ID de recepción
      navigate(`/mantenimiento/evaluaciones/crear/${recepcionId}`);
      setModalVisible(false);
  }

  const handleModalCancel = () => {
    setModalVisible(false);
  };

  const filteredEvaluaciones = evaluaciones.filter((evaluacion) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (evaluacion.codigo_bpc && evaluacion.codigo_bpc.toLowerCase().includes(searchLower)) ||
      (evaluacion.codigo_solped && evaluacion.codigo_solped.toLowerCase().includes(searchLower)) ||
      (evaluacion.cliente_nombre && evaluacion.cliente_nombre.toLowerCase().includes(searchLower)) ||
      (evaluacion.tecnico_nombre && evaluacion.tecnico_nombre.toLowerCase().includes(searchLower))
    );
  });

  const columns = [
    {
      title: "ID Evaluación",
      dataIndex: "id",
      key: "id",
      width: 120,
      sorter: (a, b) => a.id - b.id,
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Equipo (BPC/SOLPED)",
      key: "equipo",
      width: 180,
      render: (_, record) => (
        <div>
          <div style={{ fontSize: "12px" }}>
            <strong>BPC: {record.codigo_bpc || "N/A"}</strong>
          </div>
          <div style={{ fontSize: "11px", color: "#666" }}>
            SOLPED: {record.codigo_solped || "N/A"}
          </div>
        </div>
      ),
    },
    {
      title: "Cliente",
      dataIndex: "cliente_nombre",
      key: "cliente_nombre",
      ellipsis: true,
      sorter: (a, b) => (a.cliente_nombre || "").localeCompare(b.cliente_nombre || ""),
    },
    {
      title: "Técnico a Cargo",
      dataIndex: "tecnico_nombre",
      key: "tecnico_nombre",
      width: 180,
      render: (text) => text || "N/A",
    },
    {
      title: "Fecha Evaluación",
      dataIndex: "fecha_evaluacion",
      key: "fecha_evaluacion",
      width: 150,
      sorter: (a, b) => new Date(b.fecha_evaluacion) - new Date(a.fecha_evaluacion),
      render: (date) => new Date(date).toLocaleDateString(),
    },
    
    {
      title: "Acciones",
      key: "acciones",
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
            title="Ver Detalle"
          />
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title="Editar Evaluación"
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              <ToolOutlined style={{ marginRight: 8 }} />
              Gestión de Evaluaciones Técnicas
            </Title>
            <p style={{ margin: 0, color: "#666" }}>
              Total de evaluaciones: {evaluaciones.length}{" "}
              {filteredEvaluaciones.length !== evaluaciones.length &&
                `(${filteredEvaluaciones.length} filtradas)`}
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
                Crear Evaluación
              </Button>
            </Space>
          </Col>
        </Row>

        <Row style={{ marginBottom: 20 }}>
          <Col span={24}>
            <Search
              placeholder="Buscar por BPC, SOLPED, Cliente o Técnico..."
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
          dataSource={filteredEvaluaciones}
          loading={loading}
          rowKey="id"
          locale={{ emptyText: "No se encontraron evaluaciones" }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} de ${total} evaluaciones`,
          }}
          scroll={{ x: 1000 }}
          size="middle"
        />
      </Card>

      {/* Modal para seleccionar Recepción (Creación) */}
      <Modal
        title="Seleccionar Equipo para Evaluar"
        open={modalVisible}
        onCancel={handleModalCancel}
        footer={null}
        width={800}
        destroyOnClose
        style={{ top: 50 }}
      >
        <Spin spinning={loading}>
            <p>Seleccione el equipo que pasará por una Evaluación Técnica:</p>
            <Table
                columns={[
                    { title: 'ID Recepción', dataIndex: 'id', key: 'id', width: 100 },
                    { title: 'Cliente', dataIndex: 'cliente_nombre', key: 'cliente_nombre', ellipsis: true },
                    { title: 'BPC/SOLPED', key: 'bpc_solped', render: (_, r) => `${r.codigo_bpc || 'N/A'}/${r.codigo_solped || 'N/A'}` },
                    { title: 'Acción', key: 'accion', width: 100, 
                        render: (_, r) => (
                            <Button type="primary" size="small" onClick={() => handleSelectRecepcion(r.id)}>Seleccionar</Button>
                        ) 
                    },
                ]}
                dataSource={recepciones}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 5 }}
                locale={{ emptyText: "No hay equipos pendientes de evaluación" }}
            />
        </Spin>
      </Modal>

    </div>
  );
};

export default Evaluaciones;