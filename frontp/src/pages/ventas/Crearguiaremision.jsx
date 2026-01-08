// =====================================================
// CrearGuiaRemision.jsx
// Componente React para crear guías de remisión
// Radiadores Fortaleza S.A.
// =====================================================

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Form,
  Table,
  Button,
  Select,
  DatePicker,
  InputNumber,
  Input,
  Space,
  Tag,
  Alert,
  Divider,
  Row,
  Col,
  Steps,
  message,
  Modal,
  Spin,
  Checkbox,
  Typography,
  Statistic,
} from "antd";
import {
  TruckOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  SendOutlined,
  ArrowLeftOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";

// Configurar baseURL de axios
const API_URL = import.meta.env.VITE_API_URL;

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================
const CrearGuiaRemision = ({ pedidoId, onSuccess, onCancel }) => {
  // Estados del wizard
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Datos del pedido
  const [analisisPedido, setAnalisisPedido] = useState(null);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);

  // Datos del formulario
  const [datosFormulario, setDatosFormulario] = useState(null);
  const [savedFormValues, setSavedFormValues] = useState({}); // Guardar valores entre pasos
  const [form] = Form.useForm();

  // =====================================================
  // CARGAR DATOS INICIALES
  // =====================================================
  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      // Cargar análisis del pedido y datos del formulario en paralelo
      const [analisisRes, formularioRes] = await Promise.all([
        axios.get(`${API_URL}/guias-remision/analizar-pedido/${pedidoId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/guias-remision/formulario/datos`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setAnalisisPedido(analisisRes.data.data);
      setDatosFormulario(formularioRes.data.data);
    } catch (error) {
      message.error("Error al cargar datos del pedido");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [pedidoId]);

  useEffect(() => {
    if (pedidoId) {
      cargarDatos();
    }
  }, [pedidoId, cargarDatos]);

  // Restaurar valores del formulario cuando se vuelve al paso 2
  useEffect(() => {
    if (currentStep === 1 && Object.keys(savedFormValues).length > 0) {
      form.setFieldsValue(savedFormValues);
    } else if (currentStep === 1 && analisisPedido) {
      // Establecer valores iniciales la primera vez
      form.setFieldsValue({
        fecha_traslado: dayjs(),
        motivo_traslado: "VENTA",
        direccion_llegada: analisisPedido?.pedido?.direccion_cliente || "",
      });
    }
  }, [currentStep, savedFormValues, form, analisisPedido]);

  // =====================================================
  // PASO 1: SELECCIÓN DE PRODUCTOS
  // =====================================================
  const renderPaso1 = () => {
    if (!analisisPedido) return <Spin />;

    const { pedido, productos, resumen, resumen_almacenes, guias_existentes } =
      analisisPedido;

    // Ya no agrupamos por almacén, el almacén se seleccionará en el formulario de la guía

    const columnas = [
      {
        title: "Seleccionar",
        dataIndex: "id_detalle_pedido",
        width: 80,
        render: (id, record) => (
          <Checkbox
            checked={productosSeleccionados.some(
              (p) => p.detalle_pedido_id === id
            )}
            disabled={record.estado_disponibilidad === "SIN_STOCK"}
            onChange={(e) => handleSeleccionProducto(record, e.target.checked)}
          />
        ),
      },
      {
        title: "Código",
        dataIndex: "codigo_producto",
        width: 120,
      },
      {
        title: "Descripción",
        dataIndex: "descripcion_producto",
        ellipsis: true,
      },
      {
        title: "Solicitado",
        dataIndex: "cantidad_solicitada",
        width: 100,
        align: "right",
      },
      {
        title: "Despachado",
        dataIndex: "cantidad_despachada",
        width: 100,
        align: "right",
      },
      {
        title: "Pendiente",
        dataIndex: "cantidad_pendiente",
        width: 100,
        align: "right",
      },
      {
        title: "Stock",
        dataIndex: "stock_disponible",
        width: 100,
        align: "right",
        render: (stock) => (
          <Text type={stock > 0 ? "success" : "danger"}>{stock}</Text>
        ),
      },
      {
        title: "A Despachar",
        dataIndex: "cantidad_despachable",
        width: 120,
        render: (cant, record) => {
          const seleccionado = productosSeleccionados.find(
            (p) => p.detalle_pedido_id === record.id_detalle_pedido
          );
          if (!seleccionado) return "-";
          return (
            <InputNumber
              min={1}
              max={record.cantidad_despachable}
              value={seleccionado.cantidad}
              onChange={(value) =>
                handleCambiarCantidad(record.id_detalle_pedido, value)
              }
              size="small"
            />
          );
        },
      },
      {
        title: "Estado",
        dataIndex: "estado_disponibilidad",
        width: 120,
        render: (estado) => {
          const config = {
            DISPONIBLE: { color: "success", icon: <CheckCircleOutlined /> },
            PARCIAL: { color: "warning", icon: <WarningOutlined /> },
            SIN_STOCK: { color: "error", icon: <CloseCircleOutlined /> },
          };
          return (
            <Tag color={config[estado]?.color} icon={config[estado]?.icon}>
              {estado}
            </Tag>
          );
        },
      },
    ];

    return (
      <div>
        {/* Cabecera del pedido */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic title="Pedido N°" value={pedido.numero} />
            </Col>
            <Col span={6}>
              <Statistic title="Cliente" value={pedido.razon_social_cliente} />
            </Col>
            <Col span={6}>
              <Statistic
                title="Items Pendientes"
                value={resumen.total_productos_pendientes}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Guías Generadas"
                value={guias_existentes.length}
              />
            </Col>
          </Row>
        </Card>

        {/* Alertas */}
        {resumen.tiene_guia_pendiente_confirmacion && analisisPedido.guias_pendientes_confirmacion && (
          <Alert
            message="⚠️ Ya existe una guía pendiente de confirmación"
            description={
              <div>
                <p>
                  Ya se generó la guía <strong>{analisisPedido.guias_pendientes_confirmacion[0]?.numero_guia}</strong> con
                  nota de salida <strong>{analisisPedido.guias_pendientes_confirmacion[0]?.numero_nota}</strong> en estado BORRADOR.
                </p>
                <p>
                  <strong>No puedes crear una nueva guía hasta que:</strong>
                </p>
                <ul>
                  <li>Confirmes la nota de salida existente (para reducir el stock y actualizar el pedido), O</li>
                  <li>Anules la nota de salida si no deseas despachar esos productos</li>
                </ul>
              </div>
            }
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
            banner
          />
        )}

        {resumen.requiere_multiples_guias && (
          <Alert
            message="Múltiples Almacenes Detectados"
            description="Los productos están en diferentes almacenes. Seleccione productos de un solo almacén por guía."
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {resumen.productos_sin_stock > 0 && (
          <Alert
            message={`${resumen.productos_sin_stock} producto(s) sin stock`}
            description="Estos productos requieren orden de fabricación y no pueden despacharse."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Tabla de productos del pedido */}
        <Card
          title={
            <Space>
              <InboxOutlined />
              <span>Productos del Pedido</span>
              <Tag>{productos.length} productos</Tag>
            </Space>
          }
          style={{ marginBottom: 16 }}
        >
          <Table
            dataSource={productos}
            columns={columnas}
            rowKey="id_detalle_pedido"
            pagination={false}
            size="small"
          />
        </Card>

        {/* Resumen de selección */}
        {productosSeleccionados.length > 0 && (
          <Card size="small" style={{ background: "#f6ffed" }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Text strong>
                  Seleccionados: {productosSeleccionados.length} productos
                </Text>
              </Col>
              <Col>
                <Text strong>
                  Total a despachar:{" "}
                  {productosSeleccionados.reduce(
                    (sum, p) => sum + p.cantidad,
                    0
                  )}{" "}
                  unidades
                </Text>
              </Col>
            </Row>
          </Card>
        )}
      </div>
    );
  };

  // =====================================================
  // PASO 2: DATOS DE TRANSPORTE
  // =====================================================
  const renderPaso2 = () => {
    if (!datosFormulario) return <Spin />;

    const {
      puntos_partida,
      almacenes,
      vehiculos,
      choferes,
      transportistas,
      motivos_traslado,
    } = datosFormulario;

    return (
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          fecha_traslado: dayjs(),
          motivo_traslado: "VENTA",
          direccion_llegada: analisisPedido?.pedido?.direccion_cliente || "",
        }}
      >
        {/* Datos del Cliente */}
        <Card size="small" style={{ marginBottom: 16, background: "#f0f5ff" }}>
          <Title level={5}>Datos del Cliente</Title>
          <Row gutter={16}>
            <Col span={8}>
              <Text strong>RUC/DNI:</Text>
              <br />
              <Text>{analisisPedido?.pedido?.nro_documento_cliente || "-"}</Text>
            </Col>
            <Col span={16}>
              <Text strong>Razón Social:</Text>
              <br />
              <Text>{analisisPedido?.pedido?.razon_social_cliente || "-"}</Text>
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 8 }}>
            <Col span={24}>
              <Text strong>Dirección:</Text>
              <br />
              <Text>{analisisPedido?.pedido?.direccion_cliente || "-"}</Text>
            </Col>
          </Row>
        </Card>

        <Divider>Datos de Traslado</Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="fecha_traslado"
              label="Fecha de Traslado"
              rules={[{ required: true, message: "Requerido" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="motivo_traslado"
              label="Motivo de Traslado"
              rules={[{ required: true }]}
            >
              <Select>
                {motivos_traslado.map((m) => (
                  <Option key={m.value} value={m.value}>
                    {m.codigo} - {m.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="punto_partida_id"
              label="Punto de Partida"
              rules={[{ required: true, message: "Requerido" }]}
            >
              <Select placeholder="Seleccione punto de partida">
                {puntos_partida.map((p) => (
                  <Option key={p.id_partida} value={p.id_partida}>
                    {p.codigo} - {p.direccion}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="almacen_id"
              label="Almacén de Despacho"
              rules={[{ required: true, message: "Seleccione un almacén" }]}
            >
              <Select placeholder="Seleccione almacén">
                {almacenes.map((a) => (
                  <Option key={a.id_alm} value={a.id_alm}>
                    {a.codigo} - {a.nombre}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="direccion_llegada"
              label="Dirección de Llegada"
              rules={[{ required: true, message: "Requerido" }]}
            >
              <Input placeholder="Dirección del cliente" />
            </Form.Item>
          </Col>
        </Row>

        <Divider>Datos del Transporte</Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="vehiculo_id" label="Vehículo">
              <Select placeholder="Seleccione vehículo" allowClear>
                {vehiculos.map((v) => (
                  <Option key={v.id_vehiculo} value={v.id_vehiculo}>
                    {v.placa} - {v.marca} {v.modelo}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="chofer_id" label="Conductor">
              <Select placeholder="Seleccione conductor" allowClear>
                {choferes.map((c) => (
                  <Option key={c.id_chofer} value={c.id_chofer}>
                    {c.nombre_completo} ({c.nro_licencia})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="transportista_id"
          label="Empresa Transportista (Opcional)"
        >
          <Select placeholder="Seleccione transportista" allowClear>
            {transportistas.map((t) => (
              <Option key={t.id_transportista} value={t.id_transportista}>
                {t.razon_social} - RUC: {t.nro_documento}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Divider>Datos Adicionales</Divider>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="peso_bruto" label="Peso Bruto (Kg)">
              <InputNumber min={0} step={0.1} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="numero_bultos" label="Número de Bultos">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="observaciones" label="Observaciones">
          <TextArea rows={3} />
        </Form.Item>
      </Form>
    );
  };

  // =====================================================
  // PASO 3: CONFIRMACIÓN
  // =====================================================
  const renderPaso3 = () => {
    return (
      <div>
        <Alert
          message="Confirme los datos de la guía"
          description="Revise la información antes de generar la guía de remisión."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Card
          title="Productos a Despachar"
          size="small"
          style={{ marginBottom: 16 }}
        >
          <Table
            dataSource={productosSeleccionados.map((p) => {
              const producto = analisisPedido.productos.find(
                (pr) => pr.id_detalle_pedido === p.detalle_pedido_id
              );
              return { ...p, ...producto };
            })}
            columns={[
              { title: "Código", dataIndex: "codigo_producto" },
              { title: "Descripción", dataIndex: "descripcion_producto" },
              { title: "Cantidad", dataIndex: "cantidad", align: "right" },
            ]}
            rowKey="detalle_pedido_id"
            pagination={false}
            size="small"
          />
        </Card>

        <Card title="Datos de Transporte" size="small">
          <Row gutter={[16, 8]}>
            <Col span={12}>
              <Text type="secondary">Fecha de Traslado: </Text>
              <Text strong>
                {savedFormValues.fecha_traslado?.format("DD/MM/YYYY") || "-"}
              </Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">Motivo: </Text>
              <Text strong>{savedFormValues.motivo_traslado || "-"}</Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">Almacén de Despacho: </Text>
              <Text strong>
                {datosFormulario?.almacenes?.find(a => a.id_alm === savedFormValues.almacen_id)?.nombre || "-"}
              </Text>
            </Col>
          </Row>
        </Card>
      </div>
    );
  };

  // =====================================================
  // HANDLERS
  // =====================================================
  const handleSeleccionProducto = (producto, checked) => {
    if (checked) {
      setProductosSeleccionados([
        ...productosSeleccionados,
        {
          detalle_pedido_id: producto.id_detalle_pedido,
          cantidad: producto.cantidad_despachable,
        },
      ]);
    } else {
      setProductosSeleccionados(
        productosSeleccionados.filter(
          (p) => p.detalle_pedido_id !== producto.id_detalle_pedido
        )
      );
    }
  };

  const handleCambiarCantidad = (detalleId, cantidad) => {
    setProductosSeleccionados(
      productosSeleccionados.map((p) =>
        p.detalle_pedido_id === detalleId ? { ...p, cantidad } : p
      )
    );
  };

  const handleSiguiente = async () => {
    if (currentStep === 0) {
      if (productosSeleccionados.length === 0) {
        message.warning("Debe seleccionar al menos un producto");
        return;
      }
    }

    // Si estamos en el paso 2 (formulario), guardar los valores antes de avanzar
    if (currentStep === 1) {
      try {
        const values = await form.validateFields();
        setSavedFormValues(values);
      } catch (error) {
        message.error("Por favor complete todos los campos requeridos");
        return;
      }
    }

    setCurrentStep(currentStep + 1);
  };

  const handleAnterior = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleCrearGuia = async () => {
    try {
      setLoading(true);

      // Usar los valores guardados del formulario
      if (!savedFormValues.fecha_traslado) {
        message.error("Faltan datos del formulario. Por favor regrese al paso anterior.");
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("token");
      const payload = {
        pedido_id: pedidoId,
        fecha_traslado: savedFormValues.fecha_traslado.format("YYYY-MM-DD"),
        punto_partida_id: savedFormValues.punto_partida_id,
        direccion_llegada: savedFormValues.direccion_llegada,
        motivo_traslado: savedFormValues.motivo_traslado,
        almacen_id: savedFormValues.almacen_id,
        transportista_id: savedFormValues.transportista_id || null,
        vehiculo_id: savedFormValues.vehiculo_id || null,
        chofer_id: savedFormValues.chofer_id || null,
        peso_bruto: savedFormValues.peso_bruto || 0,
        numero_bultos: savedFormValues.numero_bultos || 0,
        observaciones: savedFormValues.observaciones || "",
        detalles: productosSeleccionados.map((p) => ({
          detalle_pedido_id: p.detalle_pedido_id,
          cantidad: p.cantidad,
        })),
      };

      console.log("📤 Payload enviado:", payload);

      const response = await axios.post(`${API_URL}/guias-remision`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        message.success(
          `Guía ${response.data.data.guia.numero} creada exitosamente`
        );
        onSuccess?.(response.data.data);
      }
    } catch (error) {
      console.error("❌ Error completo:", error);
      console.error("📋 Response data:", error.response?.data);
      message.error(error.response?.data?.message || "Error al crear la guía");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // RENDER PRINCIPAL
  // =====================================================
  const steps = [
    { title: "Seleccionar Productos", icon: <InboxOutlined /> },
    { title: "Datos de Transporte", icon: <TruckOutlined /> },
    { title: "Confirmar", icon: <CheckCircleOutlined /> },
  ];

  return (
    <Modal
      title={
        <Space>
          <TruckOutlined />
          <span>Nueva Guía de Remisión</span>
        </Space>
      }
      open={true}
      onCancel={onCancel}
      width={1000}
      footer={
        <Row justify="space-between">
          <Col>
            {currentStep > 0 && (
              <Button onClick={handleAnterior} icon={<ArrowLeftOutlined />}>
                Anterior
              </Button>
            )}
          </Col>
          <Col>
            <Space>
              <Button onClick={onCancel}>Cancelar</Button>
              {currentStep < 2 ? (
                <Button
                  type="primary"
                  onClick={handleSiguiente}
                  disabled={
                    currentStep === 0 &&
                    analisisPedido?.resumen?.tiene_guia_pendiente_confirmacion
                  }
                >
                  Siguiente
                </Button>
              ) : (
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleCrearGuia}
                  loading={loading}
                  disabled={analisisPedido?.resumen?.tiene_guia_pendiente_confirmacion}
                >
                  Generar Guía
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      }
    >
      <Steps current={currentStep} items={steps} style={{ marginBottom: 24 }} />

      <Spin spinning={loading}>
        {currentStep === 0 && renderPaso1()}
        {currentStep === 1 && renderPaso2()}
        {currentStep === 2 && renderPaso3()}
      </Spin>
    </Modal>
  );
};

export default CrearGuiaRemision;
