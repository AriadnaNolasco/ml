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
  Breadcrumb,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import api from "../../api/api";
import CategoriaForm from "./CategoriaForm";
import CategoriaDetalle from "./CategoriaDetalle";

const { Title } = Typography;
const { Search } = Input;

const Categorias = ({ user }) => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState(null);
  const [tiposExistencia, setTiposExistencia] = useState([]);

  const fetchCategorias = async () => {
    try {
      setLoading(true);
      const response = await api.get("/almacen/categorias");
      setCategorias(response.data);
    } catch (error) {
      message.error("Error al cargar las categorías");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await api.get("/almacen/categorias");
      setCategorias(response.data);
      message.success("Lista actualizada");
    } catch (error) {
      message.error("Error al cargar las categorías");
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  };

  // En Categorias.jsx, reemplaza la función fetchTiposExistencia:
  const fetchTiposExistencia = async () => {
    try {
      const response = await api.get("/almacen/tipos-existencia");
      setTiposExistencia(response.data);
    } catch (error) {
      console.error("Error al cargar tipos de existencia:", error);
      message.error("Error al cargar tipos de existencia");

      // Fallback por si hay error (opcional)
      setTiposExistencia([
        { id_exist: 1, nombre: "MERCADERIA", codigo: "001" },
        { id_exist: 2, nombre: "PRODUCTOS TERMINADOS", codigo: "002" },
        { id_exist: 3, nombre: "MATERIAS PRIMAS Y AUXILIARES", codigo: "003" },
        { id_exist: 4, nombre: "ENVASES Y EMBALAJES", codigo: "004" },
        { id_exist: 5, nombre: "SUMINISTROS DIVERSOS", codigo: "005" },
        { id_exist: 6, nombre: "ACTIVOS", codigo: "006" },
        { id_exist: 7, nombre: "OTROS", codigo: "099" },
      ]);
    }
  };

  const handleCreate = () => {
    setEditingCategoria(null);
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingCategoria(record);
    setModalVisible(true);
  };

  const handleView = (record) => {
    setEditingCategoria(record);
    setDetailModalVisible(true);
  };

  const handleDelete = async (codigo) => {
    Modal.confirm({
      title: "¿Estás seguro de eliminar esta categoría?",
      content: "Esta acción no se puede deshacer.",
      okText: "Sí, eliminar",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await api.delete(`/almacen/categorias/${codigo}`);
          message.success("Categoría eliminada correctamente");
          fetchCategorias();
        } catch (error) {
          message.error(
            error.response?.data?.error || "Error al eliminar la categoría"
          );
          console.error(error);
        }
      },
    });
  };

  const handleSubmitSuccess = () => {
    setModalVisible(false);
    setEditingCategoria(null);
    fetchCategorias();
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchCategorias(), fetchTiposExistencia()]);
      } catch (error) {
        console.error("Error loading data:", error);
        message.error("Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredData = categorias.filter(
    (cat) =>
      cat.nombre.toLowerCase().includes(searchText.toLowerCase()) ||
      cat.codigo.toLowerCase().includes(searchText.toLowerCase()) ||
      (cat.siglas &&
        cat.siglas.toLowerCase().includes(searchText.toLowerCase()))
  );

  const columns = [
    {
      title: "Código",
      dataIndex: "codigo",
      key: "codigo",
      width: 80,
      sorter: (a, b) => a.codigo.localeCompare(b.codigo),
    },
    {
      title: "Nombre",
      dataIndex: "nombre",
      key: "nombre",
      sorter: (a, b) => a.nombre.localeCompare(b.nombre),
      ellipsis: true,
    },
    {
      title: "Siglas",
      dataIndex: "siglas",
      key: "siglas",
      width: 80,
      render: (text) => text || "N/A",
    },
    {
      title: "Tipo Existencia",
      dataIndex: "tipo_existencia_nombre",
      key: "tipo_existencia_nombre",
      render: (text) => text || "N/A",
      ellipsis: true,
    },
    {
      title: "Ind. Venta",
      dataIndex: "ind_venta",
      key: "ind_venta",
      width: 120,
      render: (text) => {
        const colorMap = {
          "SE VENDE": "green",
          SERVICIOS: "blue",
          "NO VENDIBLE": "default",
        };
        return <Tag color={colorMap[text] || "default"}>{text}</Tag>;
      },
      filters: [
        { text: "No Vendible", value: "NO VENDIBLE" },
        { text: "Se Vende", value: "SE VENDE" },
        { text: "Servicios", value: "SERVICIOS" },
      ],
      onFilter: (value, record) => record.ind_venta === value,
    },
    {
      title: "Ind. Crítico",
      dataIndex: "ind_critico",
      key: "ind_critico",
      width: 100,
      render: (text) => (
        <Tag color={text === "CRITICO" ? "red" : "default"}>{text}</Tag>
      ),
      filters: [
        { text: "Crítico", value: "CRITICO" },
        { text: "No Crítico", value: "NO CRITICO" },
      ],
      onFilter: (value, record) => record.ind_critico === value,
    },
    {
      title: "Ind. Importación",
      dataIndex: "ind_importacion",
      key: "ind_importacion",
      width: 120,
      render: (text) => (
        <Tag color={text === "SE IMPORTA" ? "orange" : "default"}>{text}</Tag>
      ),
      filters: [
        { text: "Se Importa", value: "SE IMPORTA" },
        { text: "No se Importa", value: "NO SE IMPORTA" },
      ],
      onFilter: (value, record) => record.ind_importacion === value,
    },
    {
      title: "Ind. Almacén",
      dataIndex: "ind_almac_x_compra",
      key: "ind_almac_x_compra",
      width: 120,
      render: (text) => (
        <Tag color={text === "SI ING. ALMACEN" ? "green" : "default"}>
          {text}
        </Tag>
      ),
    },
    {
      title: "Acciones",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space size='small'>
          <Button
            size='small'
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title='Editar'
          />
          <Button
            size='small'
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.codigo)}
            title='Eliminar'
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Breadcrumb
        items={[{ title: "Almacén" }, { title: "Categorías" }]}
        style={{ marginBottom: 16 }}
      />

      <Card>
        <Row
          justify='space-between'
          align='middle'
          style={{ marginBottom: 20 }}
        >
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              Categorías de Productos
            </Title>
            <p style={{ margin: 0, color: "#666" }}>
              Total de categorías: {categorias.length} | Filtradas:{" "}
              {filteredData.length}
            </p>
          </Col>
          <Col>
            <Space>
              <Search
                placeholder='Buscar categorías'
                allowClear
                enterButton={<SearchOutlined />}
                size='large'
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onSearch={handleRefresh}
              />
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={refreshing}
                title='Actualizar lista'
              >
                Actualizar
              </Button>
              <Button
                type='primary'
                icon={<PlusOutlined />}
                onClick={handleCreate}
                size='large'
              >
                Nueva Categoría
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey='codigo'
          loading={loading}
          locale={{
            emptyText: "No se encontraron categorías",
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} de ${total} categorías`,
          }}
          size='middle'
          scroll={{ x: 1200 }}
        />

        {/* Modal para crear/editar categoría */}
        <Modal
          title={editingCategoria ? "Editar Categoría" : "Nueva Categoría"}
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            setEditingCategoria(null);
          }}
          footer={null}
          width={800}
          destroyOnClose
        >
          <CategoriaForm
            editingCategoria={editingCategoria}
            tiposExistencia={tiposExistencia}
            onSuccess={handleSubmitSuccess}
            onCancel={() => {
              setModalVisible(false);
              setEditingCategoria(null);
            }}
          />
        </Modal>

        {/* Modal para ver detalles de la categoría */}
        <Modal
          title='Detalles de la Categoría'
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={[
            <Button key='close' onClick={() => setDetailModalVisible(false)}>
              Cerrar
            </Button>,
            <Button
              key='edit'
              type='primary'
              onClick={() => {
                setDetailModalVisible(false);
                handleEdit(editingCategoria);
              }}
            >
              Editar
            </Button>,
          ]}
          width={800}
        >
          <CategoriaDetalle categoria={editingCategoria} />
        </Modal>
      </Card>
    </div>
  );
};

export default Categorias;
