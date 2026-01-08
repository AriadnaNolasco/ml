import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Card,
  Spin,
  Tag,
  Tooltip,
} from "antd";
import {
  SyncOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  CloseCircleOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import api from "../../api/api";
import ConfiguracionParrillasModal from "./ConfiguracionParrillasModal";

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

  // ⭐ ESTADOS para decodificación de código y validación
  const [decodificando, setDecodificando] = useState(false);
  const [codigoDecodificado, setCodigoDecodificado] = useState(null);
  const [descripcionAutoGenerada, setDescripcionAutoGenerada] = useState(false);
  const [codigoExiste, setCodigoExiste] = useState(false);
  const [verificandoCodigo, setVerificandoCodigo] = useState(false);
  const debounceRef = useRef(null);
  const debounceVerificarRef = useRef(null);

  // ⭐ NUEVOS ESTADOS para configuración de parrillas
  const [modalParrillasVisible, setModalParrillasVisible] = useState(false);
  const [configuracionParrillasActual, setConfiguracionParrillasActual] =
    useState(null);

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

      // ⭐ NUEVO: Cargar configuración de parrillas si existe
      if (producto.configuracion_parrillas) {
        setConfiguracionParrillasActual(producto.configuracion_parrillas);
      }
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
      moneda_id: 1,
      afecto_igv: true,
    };

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

  // ⭐ FUNCIÓN PARA DECODIFICAR CÓDIGO
  const decodificarCodigo = useCallback(
    async (codigo) => {
      if (!codigo || codigo.length < 10) {
        setCodigoDecodificado(null);
        return;
      }

      setDecodificando(true);
      try {
        const response = await api.get(
          `/almacen/productos/decodificar-codigo?codigo=${codigo.toUpperCase()}`
        );

        if (response.data.success) {
          setCodigoDecodificado(response.data);
          // ⭐ SOLO auto-llenar la descripción (NO características)
          form.setFieldsValue({ descripcion: response.data.descripcion });
          setDescripcionAutoGenerada(true);
          message.success("Descripción generada automáticamente");
        } else {
          setCodigoDecodificado(null);
          message.warning(
            response.data.error || "No se pudo decodificar el código"
          );
        }
      } catch (error) {
        console.error("Error al decodificar código:", error);
        setCodigoDecodificado(null);
      } finally {
        setDecodificando(false);
      }
    },
    [form]
  );

  // ⭐ VERIFICAR SI CÓDIGO YA EXISTE
  const verificarCodigo = useCallback(async (codigo) => {
    if (!codigo || codigo.length < 3) {
      setCodigoExiste(false);
      return;
    }

    setVerificandoCodigo(true);
    try {
      const response = await api.get(
        `/almacen/productos/verificar-codigo?codigo=${codigo.toUpperCase()}`
      );

      setCodigoExiste(response.data.existe);

      if (response.data.existe) {
        message.error(
          `El código '${codigo.toUpperCase()}' ya está registrado. Por favor use un código diferente.`
        );
      }
    } catch (error) {
      console.error("Error al verificar código:", error);
      setCodigoExiste(false);
    } finally {
      setVerificandoCodigo(false);
    }
  }, []);

  const handleCodigoChange = (e) => {
    const codigo = e.target.value.toUpperCase();
    form.setFieldValue("codigo", codigo);

    // Limpiar timeouts anteriores
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (debounceVerificarRef.current) {
      clearTimeout(debounceVerificarRef.current);
    }

    // Quitar puntos para contar caracteres reales
    const codigoLimpio = codigo.replace(/[.\s]/g, "");

    // ⭐ Verificar código duplicado (solo si no estamos editando)
    if (!isEditing && codigoLimpio.length >= 3) {
      debounceVerificarRef.current = setTimeout(() => {
        verificarCodigo(codigo);
      }, 600);
    }

    // Solo decodificar si es producto terminado y tiene 9+ caracteres (sin puntos)
    if (
      currentCategoryType === "producto_terminado" &&
      codigoLimpio.length >= 9
    ) {
      // Debounce: esperar 800ms después de dejar de escribir
      debounceRef.current = setTimeout(() => {
        decodificarCodigo(codigo);
      }, 800);
    } else {
      setCodigoDecodificado(null);
      setDescripcionAutoGenerada(false);
    }
  };

  // ⭐ REGENERAR DESCRIPCIÓN
  const regenerarDescripcion = () => {
    const codigo = form.getFieldValue("codigo");
    if (codigo && codigo.length >= 10) {
      decodificarCodigo(codigo);
    }
  };

  // ⭐ FUNCIONES PARA MANEJAR MODAL DE PARRILLAS
  const abrirModalParrillas = () => {
    setModalParrillasVisible(true);
  };

  const cerrarModalParrillas = () => {
    setModalParrillasVisible(false);
  };

  const guardarConfiguracionParrillas = (valores) => {
    setConfiguracionParrillasActual(valores);
    message.success("Configuración de parrillas guardada");
    cerrarModalParrillas();
  };

  useEffect(() => {
    if (visible) {
      cargarOpcionesFormulario();
      if (isEditing) {
        cargarProducto();
      } else if (selectedCategory) {
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
      // ⭐ Limpiar estados de decodificación y validación
      setCodigoDecodificado(null);
      setDescripcionAutoGenerada(false);
      setCodigoExiste(false);
      setVerificandoCodigo(false);
      // ⭐ Limpiar configuración de parrillas
      setConfiguracionParrillasActual(null);
      setModalParrillasVisible(false);
      // Limpiar timeouts
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (debounceVerificarRef.current) {
        clearTimeout(debounceVerificarRef.current);
      }
    }
  }, [visible, form]);

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
      if (currentCategoryType !== "servicio") {
        if (Number(values.stock_maximo) < Number(values.stock_minimo)) {
          message.error(
            "El stock máximo no puede ser menor que el stock mínimo"
          );
          setLoading(false);
          return;
        }
      }

      // ⭐ NUEVO: Agregar configuración de parrillas si existe
      const payload = {
        ...values,
        ...(configuracionParrillasActual && {
          configuracion_parrillas: configuracionParrillasActual,
        }),
      };

      if (isEditing) {
        await api.put(`/almacen/productos/${editingProduct}`, payload);
        message.success("Producto actualizado correctamente");
      } else {
        await api.post("/almacen/productos", payload);
        message.success("Producto creado correctamente");
      }

      onSuccess();
      onCancel();
      form.resetFields();
      setCurrentCategoryType("default");
      setCodigoDecodificado(null);
      setDescripcionAutoGenerada(false);
      // ⭐ Limpiar configuración de parrillas
      setConfiguracionParrillasActual(null);
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Error al guardar el producto";

      // Mensaje más claro para código duplicado
      if (errorMessage.includes("código") && errorMessage.includes("existe")) {
        message.error({
          content: errorMessage,
          duration: 6,
        });
      } else {
        message.error(errorMessage);
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const validateCodigo = (_, value) => {
    if (!value) return Promise.reject(new Error("El código es requerido"));
    // Permitir letras, números, guiones y puntos
    if (!/^[A-Z0-9.-]{1,50}$/.test(value)) {
      return Promise.reject(
        new Error(
          "El código solo puede contener letras mayúsculas, números, guiones y puntos, máximo 50 caracteres"
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
      // Limpiar decodificación al cambiar categoría
      setCodigoDecodificado(null);
      setDescripcionAutoGenerada(false);
    }
  };

  const renderCamposPrecio = () => {
    switch (currentCategoryType) {
      case "producto_terminado":
        return (
          <>
            <Col span={12}>
              <Form.Item
                label='Precio Fabricación'
                name='precio_fabricacion'
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
                  placeholder='0.00'
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label='Precio de Venta'
                name='precio_venta'
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
                  placeholder='0.00'
                />
              </Form.Item>
            </Col>
          </>
        );

      case "mercaderia":
      case "materia_prima":
      case "repuestos_herramientas":
      case "consumibles_varios":
      case "activo_almacen":
        return (
          <>
            <Col span={12}>
              <Form.Item
                label='Precio Unitario'
                name='precio_unitario'
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
                  placeholder='0.00'
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label='Precio Total'
                name='precio_total'
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
                  placeholder='0.00'
                />
              </Form.Item>
            </Col>
          </>
        );

      case "servicio":
        return (
          <Col span={12}>
            <Form.Item
              label='Precio de Venta'
              name='precio_venta'
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
                placeholder='0.00'
              />
            </Form.Item>
          </Col>
        );

      default:
        return (
          <>
            <Col span={8}>
              <Form.Item
                label='Precio Unitario'
                name='precio_unitario'
                rules={[
                  {
                    validator: validatePositiveNumber(
                      "El precio unitario",
                      false
                    ),
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  precision={2}
                  style={{ width: "100%" }}
                  placeholder='0.00'
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label='Precio de Venta'
                name='precio_venta'
                rules={[
                  {
                    validator: validatePositiveNumber(
                      "El precio de venta",
                      false
                    ),
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  precision={2}
                  style={{ width: "100%" }}
                  placeholder='0.00'
                />
              </Form.Item>
            </Col>
          </>
        );
    }
  };

  const renderCamposStock = () => {
    if (currentCategoryType === "servicio") {
      return null;
    }

    return (
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            label='Stock Mínimo'
            name='stock_minimo'
            rules={[
              { validator: validatePositiveNumber("El stock mínimo", true) },
            ]}
          >
            <InputNumber
              min={0}
              step={1}
              precision={3}
              style={{ width: "100%" }}
              placeholder='0'
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label='Stock Máximo'
            name='stock_maximo'
            rules={[
              { validator: validatePositiveNumber("El stock máximo", true) },
            ]}
          >
            <InputNumber
              min={0}
              step={1}
              precision={3}
              style={{ width: "100%" }}
              placeholder='0'
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label='Stock Actual'
            name='stock_actual'
            rules={[
              { validator: validatePositiveNumber("El stock actual", true) },
            ]}
          >
            <InputNumber
              min={0}
              step={1}
              precision={3}
              style={{ width: "100%" }}
              placeholder='0'
            />
          </Form.Item>
        </Col>
      </Row>
    );
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {isEditing ? "Editar Producto" : "Nuevo Producto"}
          {currentCategoryType === "producto_terminado" && (
            <Tag color='blue'>Producto Terminado</Tag>
          )}
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={900}
      destroyOnClose
    >
      <Form
        form={form}
        layout='vertical'
        onFinish={handleSubmit}
        autoComplete='off'
      >
        <div
          style={{
            maxHeight: "calc(100vh - 300px)",
            overflowY: "auto",
            padding: "0 8px",
          }}
        >
          {/* Código y Código de Barras */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={
                  <span>
                    Código del Producto
                    {currentCategoryType === "producto_terminado" && (
                      <Tooltip title='Para productos terminados, el código se decodifica automáticamente'>
                        <InfoCircleOutlined
                          style={{ marginLeft: 4, color: "#1890ff" }}
                        />
                      </Tooltip>
                    )}
                  </span>
                }
                name='codigo'
                rules={[{ validator: validateCodigo }]}
                validateStatus={
                  codigoExiste ? "error" : verificandoCodigo ? "validating" : ""
                }
                help={
                  codigoExiste
                    ? "Este código ya existe. Por favor use un código diferente."
                    : verificandoCodigo
                    ? "Verificando disponibilidad..."
                    : ""
                }
              >
                <Input
                  placeholder='Ej: PT-001 o 1520GK3KLS'
                  maxLength={50}
                  onChange={handleCodigoChange}
                  disabled={isEditing}
                  suffix={
                    verificandoCodigo ? (
                      <Spin size='small' />
                    ) : codigoExiste ? (
                      <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
                    ) : !isEditing && form.getFieldValue("codigo") ? (
                      <CheckCircleOutlined style={{ color: "#52c41a" }} />
                    ) : null
                  }
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label='Código de Barras' name='codigo_barras'>
                <Input
                  placeholder='Código de barras (opcional)'
                  maxLength={50}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Alertas de decodificación */}
          {decodificando && (
            <Alert
              message='Decodificando código...'
              type='info'
              showIcon
              icon={<SyncOutlined spin />}
              style={{ marginBottom: 16 }}
            />
          )}

          {codigoDecodificado && (
            <Alert
              message='Código decodificado correctamente'
              description={
                <div>
                  <p style={{ marginBottom: 8 }}>
                    <strong>Descripción generada:</strong>{" "}
                    {codigoDecodificado.descripcion}
                  </p>
                  {descripcionAutoGenerada && (
                    <Button
                      type='link'
                      size='small'
                      onClick={regenerarDescripcion}
                      icon={<SyncOutlined />}
                      style={{ padding: 0 }}
                    >
                      Regenerar descripción
                    </Button>
                  )}
                </div>
              }
              type='success'
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Descripción */}
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label='Descripción'
                name='descripcion'
                rules={[
                  { required: true, message: "La descripción es requerida" },
                  { min: 5, message: "Mínimo 5 caracteres" },
                  { max: 200, message: "Máximo 200 caracteres" },
                ]}
              >
                <TextArea
                  rows={2}
                  placeholder={
                    currentCategoryType === "producto_terminado"
                      ? "Se genera automáticamente al ingresar el código"
                      : "Descripción detallada del producto"
                  }
                  showCount
                  maxLength={200}
                  onChange={() => setDescripcionAutoGenerada(false)}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* ⭐ BOTÓN DE CONFIGURACIÓN DE PARRILLAS (solo para productos terminados) */}
          {currentCategoryType === "producto_terminado" && (
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item label='Configuración de Parrillas'>
                  <Space>
                    <Button
                      type='default'
                      onClick={abrirModalParrillas}
                      icon={<SettingOutlined />}
                    >
                      {configuracionParrillasActual
                        ? "Editar Configuración de Parrillas"
                        : "Configurar Parrillas"}
                    </Button>
                    {configuracionParrillasActual && (
                      <Tag color='green'>Configuración guardada</Tag>
                    )}
                  </Space>
                </Form.Item>
              </Col>
            </Row>
          )}

          {/* Categoría y Unidad */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label='Categoría'
                name='id_categoria'
                rules={[
                  { required: true, message: "La categoría es requerida" },
                ]}
              >
                <Select
                  placeholder='Seleccionar categoría'
                  showSearch
                  onChange={handleCategoriaChange}
                  disabled={selectedCategory && !isEditing}
                >
                  {formOptions.categorias.map((cat) => (
                    <Option key={cat.id} value={cat.id}>
                      [{cat.codigo}] {cat.nombre}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {currentCategoryType !== "servicio" && (
              <Col span={12}>
                <Form.Item
                  label='Unidad de Medida'
                  name='id_unidad'
                  rules={[
                    {
                      required: true,
                      message: "La unidad de medida es requerida",
                    },
                  ]}
                >
                  <Select placeholder='Seleccionar unidad' showSearch>
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
              <Form.Item label='División Mercadería' name='id_div_merca'>
                <Select
                  placeholder='Seleccionar división (opcional)'
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
                label='Moneda'
                name='moneda_id'
                rules={[{ required: true, message: "La moneda es requerida" }]}
              >
                <Select placeholder='Seleccionar moneda'>
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
                label='Procedencia'
                name='procedencia'
                rules={[
                  { required: true, message: "La procedencia es requerida" },
                ]}
              >
                <Select placeholder='Seleccionar procedencia'>
                  {formOptions.procedencias.map((proc) => (
                    <Option key={proc.value} value={proc.value}>
                      {proc.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label='Centro de Costo' name='centro_costo_id'>
                <Select
                  placeholder='Seleccionar centro de costo (opcional)'
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
                label='Características'
                name='caracteristicas'
                rules={[{ max: 1000, message: "Máximo 1000 caracteres" }]}
              >
                <TextArea
                  rows={2}
                  placeholder='Características adicionales del producto (opcional)'
                  showCount
                  maxLength={1000}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Precios */}
          <Row gutter={16}>{renderCamposPrecio()}</Row>

          {/* Stock */}
          {renderCamposStock()}

          {/* Ubicación para repuestos */}
          {currentCategoryType === "repuestos_herramientas" && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label='Ubicación'
                  name='ubicacion'
                  rules={[
                    {
                      required: true,
                      message: "La ubicación es requerida",
                    },
                  ]}
                >
                  <Select placeholder='Seleccionar ubicación'>
                    <Option value='LIMA'>Lima</Option>
                    <Option value='MANTENIMIENTO'>Mantenimiento</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          )}

          {/* IGV para servicios */}
          {currentCategoryType === "servicio" && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label='Afecto a IGV'
                  name='afecto_igv'
                  valuePropName='checked'
                >
                  <Switch checkedChildren='Sí' unCheckedChildren='No' />
                </Form.Item>
              </Col>
            </Row>
          )}

          {/* Estado */}
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label='Estado' name='estado' valuePropName='checked'>
                <Switch
                  checkedChildren='Activo'
                  unCheckedChildren='Inactivo'
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
            <Button
              type='primary'
              htmlType='submit'
              loading={loading}
              disabled={!isEditing && codigoExiste}
            >
              {isEditing ? "Actualizar" : "Crear"}
            </Button>
          </Space>
        </div>
      </Form>

      {/* ⭐ MODAL DE CONFIGURACIÓN DE PARRILLAS */}
      <ConfiguracionParrillasModal
        visible={modalParrillasVisible}
        onCancel={cerrarModalParrillas}
        onOk={guardarConfiguracionParrillas}
        initialValues={configuracionParrillasActual || {}}
      />
    </Modal>
  );
};

export default ProductoForm;
