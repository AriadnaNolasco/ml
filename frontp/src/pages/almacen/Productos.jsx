import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Modal,
  message,
  Card,
  Tag,
  Breadcrumb,
  Tabs,
  Spin,
  Input,
  Row,
  Col,
} from "antd";
import {
  EyeOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import api from "../../api/api";
import ProductoForm from "./ProductoForm";
import ProductoDetalle from "./ProductoDetalle";

const { Search } = Input;

const Productos = ({ user }) => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeTab, setActiveTab] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);

  const cargarCategorias = async () => {
    setLoadingCategorias(true);
    try {
      const response = await api.get("/almacen/categorias");
      setCategorias(response.data);
    } catch (error) {
      console.error("Error al cargar categorías:", error);
      message.error("Error al cargar las categorías");
    } finally {
      setLoadingCategorias(false);
    }
  };

  const cargarProductos = async () => {
    setLoading(true);
    try {
      const response = await api.get("/almacen/productos");
      setProductos(response.data);
    } catch (error) {
      message.error("Error al cargar los productos");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([cargarProductos(), cargarCategorias()]);
      message.success("Lista actualizada");
    } catch (error) {
      message.error("Error al actualizar los datos");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([cargarProductos(), cargarCategorias()]);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getProductosFiltrados = (categoria = null) => {
    let productosFiltrados = productos;

    if (categoria && categoria !== "todos") {
      productosFiltrados = productos.filter(
        (producto) => producto.categoria === categoria
      );
    }

    if (searchTerm) {
      productosFiltrados = productosFiltrados.filter(
        (producto) =>
          producto.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          producto.descripcion
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (producto.codigo_barras &&
            producto.codigo_barras
              .toLowerCase()
              .includes(searchTerm.toLowerCase()))
      );
    }

    return productosFiltrados;
  };

  const columns = [
    {
      title: "Código",
      dataIndex: "codigo",
      key: "codigo",
      sorter: (a, b) => a.codigo.localeCompare(b.codigo),
      width: 120,
      fixed: "left",
    },
    {
      title: "Descripción",
      dataIndex: "descripcion",
      key: "descripcion",
      ellipsis: true,
      width: 250,
    },
    {
      title: "Categoría",
      dataIndex: "categoria",
      key: "categoria",
      width: 150,
    },
    {
      title: "U.M.",
      dataIndex: "unidad_siglas",
      key: "unidad_siglas",
      width: 80,
      render: (siglas) => siglas || "N/A",
    },
    {
      title: "Stock Actual",
      dataIndex: "stock_actual",
      key: "stock_actual",
      sorter: (a, b) => Number(a.stock_actual) - Number(b.stock_actual),
      width: 120,
      render: (stock, record) => {
        const stockNum = Number(stock || 0);
        const stockMin = Number(record.stock_minimo || 0);
        const stockMax = Number(record.stock_maximo || 0);

        let color = "#52c41a";
        if (stockNum <= stockMin) color = "#ff4d4f";
        else if (stockNum >= stockMax) color = "#faad14";

        return (
          <span style={{ color, fontWeight: "bold" }}>
            {stockNum.toFixed(3)}
          </span>
        );
      },
    },
    {
      title: "Precio Venta",
      dataIndex: "precio_venta",
      key: "precio_venta",
      sorter: (a, b) => Number(a.precio_venta) - Number(b.precio_venta),
      width: 120,
      render: (precio, record) => {
        const symbol = record.moneda || "S/";
        return precio ? `${symbol} ${Number(precio).toFixed(2)}` : "N/A";
      },
    },
    {
      title: "Ubicación",
      dataIndex: "ubicacion",
      key: "ubicacion",
      width: 120,
      render: (ubicacion) =>
        ubicacion ? <Tag color="blue">{ubicacion}</Tag> : "N/A",
      filters: [
        { text: "Lima", value: "LIMA" },
        { text: "Mantenimiento", value: "MANTENIMIENTO" },
      ],
      onFilter: (value, record) => record.ubicacion === value,
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      width: 100,
      render: (estado) => (
        <Tag color={estado ? "green" : "red"}>
          {estado ? "Activo" : "Inactivo"}
        </Tag>
      ),
      filters: [
        { text: "Activo", value: true },
        { text: "Inactivo", value: false },
      ],
      onFilter: (value, record) => record.estado === value,
    },
    {
      title: "Acciones",
      key: "acciones",
      fixed: "right",
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleView(record)}
            title="Ver detalles"
          />
          <Button
            type="default"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record.codigo)}
            title="Editar"
          />
          <Button
            type="default"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDelete(record.codigo)}
            disabled={!record.estado}
            title="Eliminar"
          />
        </Space>
      ),
    },
  ];

  const handleView = async (producto) => {
    try {
      const response = await api.get(`/almacen/productos/${producto.codigo}`);
      setSelectedProduct(response.data);
      setDetailModalVisible(true);
    } catch (error) {
      message.error("Error al cargar los detalles del producto");
      console.error(error);
    }
  };

  const handleEdit = (codigo) => {
    setEditingProduct(codigo);
    setFormModalVisible(true);
    setSelectedCategory(null);
  };

  const handleNew = () => {
    setEditingProduct(null);
    setFormModalVisible(true);

    // Obtener la categoría seleccionada en la pestaña activa
    if (activeTab !== "todos") {
      const categoriaActiva = categorias.find(
        (cat) => cat.nombre === activeTab
      );
      if (categoriaActiva) {
        setSelectedCategory(categoriaActiva);
        return;
      }
    }
    setSelectedCategory(null);
  };

  const handleDelete = async (codigo) => {
    Modal.confirm({
      title: "¿Estás seguro de eliminar este producto?",
      content: "Esta acción cambiará el estado del producto a inactivo.",
      okText: "Sí, eliminar",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await api.delete(`/almacen/productos/${codigo}`);
          message.success("Producto eliminado correctamente");
          cargarProductos();
        } catch (error) {
          message.error(
            error.response?.data?.error || "Error al eliminar el producto"
          );
          console.error(error);
        }
      },
    });
  };

  const handleFormSuccess = () => {
    cargarProductos();
    setFormModalVisible(false);
    setSelectedCategory(null);
  };

  const handleFormCancel = () => {
    setFormModalVisible(false);
    setSelectedCategory(null);
  };

  const getTabItems = () => {
    const items = [
      {
        key: "todos",
        label: `Todos (${getProductosFiltrados().length})`,
        children: (
          <Table
            columns={columns}
            dataSource={getProductosFiltrados()}
            rowKey="id_producto"
            loading={loading}
            scroll={{ x: 1400 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} de ${total} productos`,
            }}
            locale={{
              emptyText: "No hay productos que mostrar",
            }}
          />
        ),
      },
    ];

    categorias.forEach((categoria) => {
      const productosCategoria = getProductosFiltrados(categoria.nombre);
      items.push({
        key: categoria.nombre,
        label: `${categoria.nombre} (${productosCategoria.length})`,
        children: (
          <Table
            columns={columns}
            dataSource={productosCategoria}
            rowKey="id_producto"
            loading={loading}
            scroll={{ x: 1400 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} de ${total} productos`,
            }}
            locale={{
              emptyText: `No hay productos en la categoría ${categoria.nombre}`,
            }}
          />
        ),
      });
    });

    return items;
  };

  if (loadingCategorias && categorias.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
        <p>Cargando categorías...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Breadcrumb
        items={[{ title: "Almacén" }, { title: "Productos" }]}
        style={{ marginBottom: 16 }}
      />

      <Card>
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: 20 }}
        >
          <Col>
            <h2 style={{ margin: 0 }}>Gestión de Productos</h2>
            <p style={{ margin: 0, color: "#666" }}>
              Total de productos: {productos.length}
            </p>
          </Col>
          <Col>
            <Space>
              <Search
                placeholder="Buscar productos..."
                style={{ width: 300 }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
                enterButton={<SearchOutlined />}
              />
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
                onClick={handleNew}
              >
                Nuevo Producto
              </Button>
            </Space>
          </Col>
        </Row>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={getTabItems()}
          type="card"
        />
      </Card>

      <Modal
        title={`Detalles del Producto: ${selectedProduct?.codigo || ""}`}
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
              handleEdit(selectedProduct?.codigo);
            }}
          >
            Editar Producto
          </Button>,
        ]}
        width={800}
        style={{ top: 20 }}
      >
        {selectedProduct && <ProductoDetalle producto={selectedProduct} />}
      </Modal>

      <ProductoForm
        visible={formModalVisible}
        onCancel={handleFormCancel}
        onSuccess={handleFormSuccess}
        editingProduct={editingProduct}
        selectedCategory={selectedCategory}
      />
    </div>
  );
};

export default Productos;
