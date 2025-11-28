import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Button,
  Modal,
  message,
  Space,
  Row,
  Col,
  Alert,
} from "antd";
import api from "../../api/api";

const { Option } = Select;
const { TextArea } = Input;

const ProductoForm = ({
  visible,
  onCancel,
  onSuccess,
  editingProduct,
  selectedCategory,
}) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [formOptions, setFormOptions] = useState({
    categorias: [],
    unidades_medida: [],
    centros_costo: [],
    monedas: [],
    divisiones_mercaderia: [],
    procedencias: [],
  });
  const [currentCategoryType, setCurrentCategoryType] = useState("default");

  const isEditing = !!editingProduct;

  const cargarOpcionesFormulario = async () => {
    try {
      const response = await api.get("/almacen/productos-form/datos");
      setFormOptions(response.data);
    } catch (error) {
      message.error("Error al cargar opciones del formulario");
      console.error(error);
    }
  };

  const cargarProducto = async () => {
    if (!isEditing) return;

    setLoading(true);
    try {
      const response = await api.get(`/almacen/productos/${editingProduct}`);
      const producto = response.data;

      form.setFieldsValue({
        codigo: producto.codigo,
        codigo_barras: producto.codigo_barras,
        descripcion: producto.descripcion,
        id_categoria: producto.id_categoria,
        id_unidad: producto.id_unidad,
        id_div_merca: producto.id_div_merca,
        moneda_id: producto.moneda_id,
        procedencia: producto.procedencia || "NACIONAL",
        caracteristicas: producto.caracteristicas,
        precio_unitario: producto.precio_unitario,
        precio_total: producto.precio_total,
        precio_fabricacion: producto.precio_fabricacion,
        precio_venta: producto.precio_venta,
        stock_minimo: producto.stock_minimo,
        stock_maximo: producto.stock_maximo,
        stock_actual: producto.stock_actual,
        centro_costo_id: producto.centro_costo_id,
        ubicacion: producto.ubicacion,
        afecto_igv:
          producto.afecto_igv !== undefined ? producto.afecto_igv : true,
        estado: producto.estado !== undefined ? producto.estado : true,
      });

      // Determinar tipo de categoría para el producto en edición
      determinarTipoCategoria(producto.id_categoria);
    } catch (error) {
      message.error("Error al cargar el producto");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const determinarTipoCategoria = (idCategoria) => {
    const categoria = formOptions.categorias.find(
      (cat) => cat.id === idCategoria
    );
    if (categoria) {
      setCurrentCategoryType(getCategoryType(categoria.nombre));
    }
  };

  const getCategoryType = (categoriaNombre) => {
    const nombre = categoriaNombre.toUpperCase();

    if (nombre.includes("PRODUCTO TERMINADO")) return "producto_terminado";
    if (nombre.includes("MERCADERIA")) return "mercaderia";
    if (nombre.includes("MAT.PRIMA") || nombre.includes("MATERIA PRIMA"))
      return "materia_prima";
    if (nombre.includes("HERRAMIENTAS") || nombre.includes("REPUESTOS"))
      return "repuestos_herramientas";
    if (nombre.includes("CONSUMIBLE") || nombre.includes("VARIOS"))
      return "consumibles_varios";
    if (nombre.includes("SERVICIO")) return "servicio";
    if (nombre.includes("ACTIVO")) return "activo_almacen";

    return "default";
  };

  const configurarCamposPorCategoria = (categoria) => {
    if (!categoria) return;

    const categoriaType = getCategoryType(categoria.nombre);
    setCurrentCategoryType(categoriaType);

    const valoresIniciales = {
      id_categoria: categoria.id_categoria,
      estado: true,
      procedencia: "NACIONAL",
      moneda_id: 1, // Soles por defecto
      afecto_igv: true,
    };

    // Configurar campos específicos según el tipo de categoría
    switch (categoriaType) {
      case "producto_terminado":
        valoresIniciales.precio_fabricacion = 0;
        valoresIniciales.precio_venta = 0;
        valoresIniciales.stock_minimo = 0;
        valoresIniciales.stock_maximo = 0;
        valoresIniciales.stock_actual = 0;
        break;

      case "mercaderia":
        valoresIniciales.precio_unitario = 0;
        valoresIniciales.precio_total = 0;
        valoresIniciales.stock_minimo = 0;
        valoresIniciales.stock_maximo = 0;
        valoresIniciales.stock_actual = 0;
        break;

      case "materia_prima":
        valoresIniciales.precio_unitario = 0;
        valoresIniciales.precio_total = 0;
        valoresIniciales.stock_minimo = 0;
        valoresIniciales.stock_maximo = 0;
        valoresIniciales.stock_actual = 0;
        break;

      case "repuestos_herramientas":
        valoresIniciales.precio_unitario = 0;
        valoresIniciales.precio_total = 0;
        valoresIniciales.stock_minimo = 0;
        valoresIniciales.stock_maximo = 0;
        valoresIniciales.stock_actual = 0;
        valoresIniciales.ubicacion = "LIMA";
        break;

      case "consumibles_varios":
        valoresIniciales.precio_unitario = 0;
        valoresIniciales.precio_total = 0;
        valoresIniciales.stock_minimo = 0;
        valoresIniciales.stock_maximo = 0;
        valoresIniciales.stock_actual = 0;
        break;

      case "servicio":
        valoresIniciales.precio_venta = 0;
        // Servicios no tienen unidad de medida ni stock
        break;

      case "activo_almacen":
        valoresIniciales.precio_unitario = 0;
        valoresIniciales.precio_total = 0;
        valoresIniciales.stock_minimo = 0;
        valoresIniciales.stock_maximo = 0;
        valoresIniciales.stock_actual = 0;
        break;

      default:
        valoresIniciales.precio_unitario = 0;
        valoresIniciales.precio_venta = 0;
        valoresIniciales.stock_minimo = 0;
        valoresIniciales.stock_maximo = 0;
        valoresIniciales.stock_actual = 0;
        break;
    }

    form.setFieldsValue(valoresIniciales);
  };

  useEffect(() => {
    if (visible) {
      cargarOpcionesFormulario();
      if (isEditing) {
        cargarProducto();
      } else if (selectedCategory) {
        // Configurar automáticamente cuando se crea desde una pestaña específica
        setTimeout(() => {
          configurarCamposPorCategoria(selectedCategory);
        }, 100);
      }
    }
  }, [visible, isEditing, editingProduct, selectedCategory]);

  useEffect(() => {
    if (!visible) {
      form.resetFields();
      setCurrentCategoryType("default");
    }
  }, [visible, form]);

  // Efecto para detectar cambios en la categoría seleccionada
  useEffect(() => {
    if (
      visible &&
      formOptions.categorias.length > 0 &&
      selectedCategory &&
      !isEditing
    ) {
      configurarCamposPorCategoria(selectedCategory);
    }
  }, [formOptions.categorias, selectedCategory, visible, isEditing]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Validaciones específicas por tipo de categoría
      if (currentCategoryType !== "servicio") {
        if (Number(values.stock_maximo) < Number(values.stock_minimo)) {
          message.error(
            "El stock máximo no puede ser menor que el stock mínimo"
          );
          setLoading(false);
          return;
        }
      }

      if (isEditing) {
        await api.put(`/almacen/productos/${editingProduct}`, values);
        message.success("Producto actualizado correctamente");
      } else {
        await api.post("/almacen/productos", values);
        message.success("Producto creado correctamente");
      }

      onSuccess();
      onCancel();
      form.resetFields();
      setCurrentCategoryType("default");
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Error al guardar el producto";
      message.error(errorMessage);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const validateCodigo = (_, value) => {
    if (!value) return Promise.reject(new Error("El código es requerido"));
    if (!/^[A-Z0-9-]{1,50}$/.test(value)) {
      return Promise.reject(
        new Error(
          "El código solo puede contener letras mayúsculas, números y guiones, máximo 50 caracteres"
        )
      );
    }
    return Promise.resolve();
  };

  const validatePositiveNumber =
    (fieldName, required = true) =>
    (_, value) => {
      if (required && (value === null || value === undefined || value === "")) {
        return Promise.reject(new Error(`${fieldName} es requerido`));
      }
      if (
        value !== null &&
        value !== undefined &&
        value !== "" &&
        Number(value) < 0
      ) {
        return Promise.reject(
          new Error(`${fieldName} debe ser mayor o igual a 0`)
        );
      }
      return Promise.resolve();
    };

  const handleCategoriaChange = (value) => {
    const categoria = formOptions.categorias.find((cat) => cat.id === value);
    if (categoria) {
      setCurrentCategoryType(getCategoryType(categoria.nombre));
    }
  };

  // Renderizado condicional de campos de precio
  const renderCamposPrecio = () => {
    switch (currentCategoryType) {
      case "producto_terminado":
        return (
          <>
            <Col span={12}>
              <Form.Item
                label="Precio Fabricación"
                name="precio_fabricacion"
                rules={[
                  {
                    validator: validatePositiveNumber(
                      "El precio de fabricación",
                      true
                    ),
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  precision={2}
                  style={{ width: "100%" }}
                  placeholder="0.00"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Precio de Venta"
                name="precio_venta"
                rules={[
                  {
                    validator: validatePositiveNumber(
                      "El precio de venta",
                      true
                    ),
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  precision={2}
                  style={{ width: "100%" }}
                  placeholder="0.00"
                />
              </Form.Item>
            </Col>
          </>
        );

      case "servicio":
        return (
          <Col span={24}>
            <Form.Item
              label="Precio de Venta"
              name="precio_venta"
              rules={[
                {
                  validator: validatePositiveNumber("El precio de venta", true),
                },
              ]}
            >
              <InputNumber
                min={0}
                step={0.01}
                precision={2}
                style={{ width: "100%" }}
                placeholder="0.00"
              />
            </Form.Item>
          </Col>
        );

      default:
        return (
          <>
            <Col span={12}>
              <Form.Item
                label="Precio Unitario"
                name="precio_unitario"
                rules={[
                  {
                    validator: validatePositiveNumber(
                      "El precio unitario",
                      true
                    ),
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  precision={2}
                  style={{ width: "100%" }}
                  placeholder="0.00"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Precio Total"
                name="precio_total"
                rules={[
                  {
                    validator: validatePositiveNumber("El precio total", true),
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  precision={2}
                  style={{ width: "100%" }}
                  placeholder="0.00"
                />
              </Form.Item>
            </Col>
          </>
        );
    }
  };

  // Renderizado condicional de campos de stock
  const renderCamposStock = () => {
    if (currentCategoryType === "servicio") {
      return null; // Servicios no tienen stock
    }

    return (
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            label="Stock Mínimo"
            name="stock_minimo"
            rules={[
              {
                validator: validatePositiveNumber("El stock mínimo", true),
              },
            ]}
          >
            <InputNumber
              min={0}
              step={0.001}
              precision={3}
              style={{ width: "100%" }}
              placeholder="0.000"
            />
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item
            label="Stock Actual"
            name="stock_actual"
            rules={[
              {
                validator: validatePositiveNumber("El stock actual", true),
              },
            ]}
          >
            <InputNumber
              min={0}
              step={0.001}
              precision={3}
              style={{ width: "100%" }}
              placeholder="0.000"
            />
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item
            label="Stock Máximo"
            name="stock_maximo"
            rules={[
              {
                validator: validatePositiveNumber("El stock máximo", true),
              },
            ]}
          >
            <InputNumber
              min={0}
              step={0.001}
              precision={3}
              style={{ width: "100%" }}
              placeholder="0.000"
            />
          </Form.Item>
        </Col>
      </Row>
    );
  };

  const getCategoryInfo = () => {
    const categoryTypes = {
      producto_terminado: {
        color: "blue",
        text: "Producto Terminado - Campos: Precio Fabricación, Precio Venta, Stock",
      },
      mercaderia: {
        color: "green",
        text: "Mercadería - Campos: Precio Unitario, Precio Total, Stock",
      },
      materia_prima: {
        color: "orange",
        text: "Materia Prima - Campos: Precio Unitario, Precio Total, Stock",
      },
      repuestos_herramientas: {
        color: "purple",
        text: "Repuestos/Herramientas - Campos: Precio Unitario, Precio Total, Stock, Ubicación, IGV",
      },
      consumibles_varios: {
        color: "cyan",
        text: "Consumibles/Varios - Campos: Precio Unitario, Precio Total, Stock",
      },
      servicio: {
        color: "red",
        text: "Servicio - Campos: Precio Venta, IGV (Sin Stock)",
      },
      activo_almacen: {
        color: "gold",
        text: "Activo en Almacén - Campos: Precio Unitario, Precio Total, Stock",
      },
    };

    return (
      categoryTypes[currentCategoryType] || {
        color: "default",
        text: "Categoría General",
      }
    );
  };

  const categoryInfo = getCategoryInfo();

  return (
    <Modal
      title={isEditing ? "Editar Producto" : "Nuevo Producto"}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={1000}
      style={{ top: 20 }}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          estado: true,
          procedencia: "NACIONAL",
          ubicacion: "LIMA",
          moneda_id: 1,
          precio_unitario: 0,
          precio_total: 0,
          precio_fabricacion: 0,
          precio_venta: 0,
          stock_minimo: 0,
          stock_maximo: 0,
          stock_actual: 0,
          afecto_igv: true,
        }}
        scrollToFirstError
      >
        <div style={{ maxHeight: "65vh", overflowY: "auto", padding: "8px" }}>
          {/* Información de categoría */}
          {selectedCategory && !isEditing && (
            <Alert
              message={`Creando producto para categoría: ${selectedCategory.nombre}`}
              description={categoryInfo.text}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Códigos */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Código"
                name="codigo"
                rules={[
                  { required: true, message: "El código es requerido" },
                  { validator: validateCodigo },
                ]}
                extra="Solo letras mayúsculas, números y guiones, máximo 50 caracteres"
              >
                <Input
                  disabled={isEditing}
                  placeholder="Ej: PROD-001"
                  style={{ textTransform: "uppercase" }}
                  maxLength={50}
                />
              </Form.Item>
            </Col>

            {currentCategoryType === "producto_terminado" && (
              <Col span={12}>
                <Form.Item
                  label="Código de Barras"
                  name="codigo_barras"
                  rules={[{ max: 50, message: "Máximo 50 caracteres" }]}
                >
                  <Input
                    placeholder="Código de barras (opcional)"
                    maxLength={50}
                  />
                </Form.Item>
              </Col>
            )}
          </Row>

          {/* Descripción */}
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Descripción"
                name="descripcion"
                rules={[
                  { required: true, message: "La descripción es requerida" },
                  { min: 5, message: "Mínimo 5 caracteres" },
                  { max: 200, message: "Máximo 200 caracteres" },
                ]}
              >
                <TextArea
                  rows={2}
                  placeholder="Descripción detallada del producto"
                  showCount
                  maxLength={200}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Categoría y Unidad */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Categoría"
                name="id_categoria"
                rules={[
                  { required: true, message: "La categoría es requerida" },
                ]}
              >
                <Select
                  placeholder="Seleccionar categoría"
                  showSearch
                  onChange={handleCategoriaChange}
                  disabled={selectedCategory && !isEditing} // Bloquear si viene de pestaña
                >
                  {formOptions.categorias.map((cat) => (
                    <Option key={cat.id} value={cat.id}>
                      [{cat.codigo}] {cat.nombre}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* Unidad de Medida - No requerida para servicios */}
            {currentCategoryType !== "servicio" && (
              <Col span={12}>
                <Form.Item
                  label="Unidad de Medida"
                  name="id_unidad"
                  rules={[
                    {
                      required: true,
                      message: "La unidad de medida es requerida",
                    },
                  ]}
                >
                  <Select placeholder="Seleccionar unidad" showSearch>
                    {formOptions.unidades_medida.map((um) => (
                      <Option key={um.id} value={um.id}>
                        {um.nombre} ({um.siglas})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            )}
          </Row>

          {/* División y Moneda */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="División Mercadería" name="id_div_merca">
                <Select
                  placeholder="Seleccionar división (opcional)"
                  allowClear
                  showSearch
                >
                  {formOptions.divisiones_mercaderia.map((dm) => (
                    <Option key={dm.id} value={dm.id}>
                      [{dm.codigo}] {dm.nombre}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Moneda"
                name="moneda_id"
                rules={[{ required: true, message: "La moneda es requerida" }]}
              >
                <Select placeholder="Seleccionar moneda">
                  {formOptions.monedas.map((mon) => (
                    <Option key={mon.id} value={mon.id}>
                      {mon.simbolo} - {mon.nombre}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Procedencia y Centro de Costo */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Procedencia"
                name="procedencia"
                rules={[
                  { required: true, message: "La procedencia es requerida" },
                ]}
              >
                <Select placeholder="Seleccionar procedencia">
                  {formOptions.procedencias.map((proc) => (
                    <Option key={proc.value} value={proc.value}>
                      {proc.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="Centro de Costo" name="centro_costo_id">
                <Select
                  placeholder="Seleccionar centro de costo (opcional)"
                  allowClear
                  showSearch
                >
                  {formOptions.centros_costo.map((cc) => (
                    <Option key={cc.id} value={cc.id}>
                      [{cc.codigo}] {cc.nombre}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Características */}
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Características"
                name="caracteristicas"
                rules={[{ max: 1000, message: "Máximo 1000 caracteres" }]}
              >
                <TextArea
                  rows={2}
                  placeholder="Características adicionales del producto (opcional)"
                  showCount
                  maxLength={1000}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Precios - Renderizado condicional */}
          <Row gutter={16}>{renderCamposPrecio()}</Row>

          {/* Stock - Renderizado condicional */}
          {renderCamposStock()}

          {/* Afecto IGV - Especial para servicios */}
          {/* Solo repuestos tienen ubicación */}
          {currentCategoryType === "repuestos_herramientas" && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Ubicación"
                  name="ubicacion"
                  rules={[
                    {
                      required: true,
                      message: "La ubicación es requerida",
                    },
                  ]}
                >
                  <Select placeholder="Seleccionar ubicación">
                    <Option value="LIMA">Lima</Option>
                    <Option value="MANTENIMIENTO">Mantenimiento</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          )}

          {/* Solo servicios tienen IGV */}
          {currentCategoryType === "servicio" && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Afecto a IGV"
                  name="afecto_igv"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="Sí" unCheckedChildren="No" />
                </Form.Item>
              </Col>
            </Row>
          )}

          {/* Estado */}
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Estado" name="estado" valuePropName="checked">
                <Switch
                  checkedChildren="Activo"
                  unCheckedChildren="Inactivo"
                  defaultChecked
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <div
          style={{
            marginTop: "24px",
            textAlign: "right",
            borderTop: "1px solid #f0f0f0",
            paddingTop: "16px",
          }}
        >
          <Space>
            <Button onClick={onCancel}>Cancelar</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {isEditing ? "Actualizar" : "Crear"}
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
};

export default ProductoForm;
