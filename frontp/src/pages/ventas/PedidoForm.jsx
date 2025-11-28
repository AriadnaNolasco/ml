// PedidoForm.jsx (VERSIÓN COMPLETA CORREGIDA)
import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Row,
  Col,
  Select,
  DatePicker,
  Table,
  message,
  Space,
  Card,
  Divider,
  Tag,
  Alert,
  Descriptions,
  Spin,
} from "antd";
import {
  SaveOutlined,
  CloseOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";

const { TextArea } = Input;

const PedidoForm = ({ pedido, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [cotizacionesAprobadas, setCotizacionesAprobadas] = useState([]);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [productos, setProductos] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [formasPago, setFormasPago] = useState([]);
  const [puntosPartida, setPuntosPartida] = useState([]);
  const [cargandoCotizaciones, setCargandoCotizaciones] = useState(false);
  const [cargandoCotizacionDetalle, setCargandoCotizacionDetalle] =
    useState(false);
  const [totales, setTotales] = useState({
    importe_bruto: 0,
    descuentos: 0,
    valor_venta: 0,
    igv: 0,
    total: 0,
  });

  // Cargar datos al iniciar
  useEffect(() => {
    if (pedido) {
      cargarPedidoCompleto(pedido.id_pedido);
    } else {
      fetchDatosFormulario();
      fetchCotizacionesAprobadas();
    }
  }, [pedido]);

  // Calcular totales cuando cambian los productos
  useEffect(() => {
    calcularTotales();
  }, [productos]);

  const fetchDatosFormulario = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/ventas/formularios/datos`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { formasPago: formasPagoData = [], monedas: monedasData = [] } =
        response.data;

      setFormasPago(formasPagoData);
      setMonedas(monedasData);

      // Cargar puntos de partida
      const puntosResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/ventas/puntos-partida`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPuntosPartida(puntosResponse.data);
    } catch (error) {
      console.error("Error al cargar datos del formulario:", error);
      message.error("Error al cargar datos del formulario");
    }
  };

  // CARGAR TODAS LAS COTIZACIONES APROBADAS DISPONIBLES - CORREGIDO
  const fetchCotizacionesAprobadas = async () => {
    try {
      setCargandoCotizaciones(true);
      const token = localStorage.getItem("token");

      console.log("🔍 Buscando todas las cotizaciones aprobadas...");

      // Primero, obtener todas las cotizaciones aprobadas
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/ventas/cotizaciones?estado=APROBADO`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("📋 Todas las cotizaciones aprobadas:", response.data);

      // Verificar cuáles ya tienen pedido - CORRECCIÓN APLICADA
      const cotizacionesConInfo = await Promise.all(
        response.data.map(async (cotizacion) => {
          try {
            // VERIFICAR SI YA EXISTE UN PEDIDO PARA ESTA COTIZACIÓN - CORREGIDO
            const pedidoResponse = await axios.get(
              `${import.meta.env.VITE_API_URL}/pedidos/pedidos`,
              {
                headers: { Authorization: `Bearer ${token}` },
                params: { cotizacion: cotizacion.id_cotizacion },
              }
            );

            // Si hay resultados, significa que ya existe un pedido
            const tienePedido =
              Array.isArray(pedidoResponse.data) &&
              pedidoResponse.data.length > 0 &&
              pedidoResponse.data.some(
                (pedido) => pedido.id_cotizacion === cotizacion.id_cotizacion
              );

            console.log(
              `📊 Cotización ${cotizacion.numero} - Tiene pedido: ${tienePedido}`
            );

            return {
              ...cotizacion,
              convertida_a_pedido: tienePedido,
            };
          } catch (error) {
            // Si hay error 404 o no encuentra pedidos, asumimos que no tiene pedido
            if (error.response && error.response.status === 404) {
              console.log(
                `📊 Cotización ${cotizacion.numero} - Sin pedidos (404)`
              );
              return {
                ...cotizacion,
                convertida_a_pedido: false,
              };
            }

            console.error(
              `Error verificando pedido para cotización ${cotizacion.numero}:`,
              error
            );
            return {
              ...cotizacion,
              convertida_a_pedido: false, // Por defecto, asumir que no tiene pedido en caso de error
            };
          }
        })
      );

      // Filtrar solo las que NO tienen pedido
      const cotizacionesDisponibles = cotizacionesConInfo.filter(
        (cot) => !cot.convertida_a_pedido
      );

      console.log("✅ Cotizaciones disponibles:", cotizacionesDisponibles);
      setCotizacionesAprobadas(cotizacionesDisponibles);

      if (cotizacionesDisponibles.length === 0) {
        message.info(
          "No hay cotizaciones aprobadas disponibles para convertir en pedido"
        );
      } else {
        message.success(
          `Se encontraron ${cotizacionesDisponibles.length} cotizaciones aprobadas disponibles`
        );
      }
    } catch (error) {
      console.error("❌ Error al cargar cotizaciones:", error);
      message.error("Error al cargar las cotizaciones aprobadas");
    } finally {
      setCargandoCotizaciones(false);
    }
  };

  const seleccionarCotizacion = async (cotizacionId) => {
    if (!cotizacionId) {
      setCotizacionSeleccionada(null);
      setClienteSeleccionado(null);
      setProductos([]);
      form.setFieldsValue({
        codigo_cliente: "",
        razon_social: "",
        nro_documento: "",
        direccion: "",
        telefono_cliente: "",
        vendedor: "",
      });
      return;
    }

    try {
      setCargandoCotizacionDetalle(true);
      const token = localStorage.getItem("token");

      console.log(`🔍 Cargando detalles de cotización ID: ${cotizacionId}`);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/ventas/cotizaciones/${cotizacionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const cotizacion = response.data;
      console.log("✅ Cotización cargada:", cotizacion);

      setCotizacionSeleccionada(cotizacion);

      // CARGAR DATOS DEL CLIENTE AUTOMÁTICAMENTE
      const clienteData = {
        id_cliente: cotizacion.id_cliente,
        codigo: cotizacion.codigo_cliente,
        razon_social: cotizacion.razon_social_cliente,
        nro_documento: cotizacion.nro_documento_cliente,
        direccion: cotizacion.direccion_cliente,
        telefono: cotizacion.telefono_cliente,
      };
      setClienteSeleccionado(clienteData);

      // Llenar automáticamente TODOS los datos en el formulario
      form.setFieldsValue({
        // Datos del cliente
        codigo_cliente: cotizacion.codigo_cliente,
        razon_social: cotizacion.razon_social_cliente,
        nro_documento: cotizacion.nro_documento_cliente,
        direccion: cotizacion.direccion_cliente,
        telefono_cliente: cotizacion.telefono_cliente,
        vendedor: cotizacion.vendedor,

        // Datos de la cotización
        moneda_id: cotizacion.moneda_id,
        forma_pago: cotizacion.forma_pago,
        prioridad: cotizacion.prioridad,
        observaciones: `Pedido generado desde cotización: ${cotizacion.numero}`,
      });

      // Cargar productos de la cotización (SOLO LECTURA)
      if (cotizacion.detalles && Array.isArray(cotizacion.detalles)) {
        const productosTransformados = cotizacion.detalles.map(
          (detalle, index) => ({
            numitem: index + 1,
            producto_id: detalle.producto_id,
            producto_codigo: detalle.producto_codigo,
            descripcion: detalle.descripcion_producto || detalle.descripcion,
            cantidad_solicitada: detalle.cantidad,
            precio_unitario: detalle.precio_unitario,
            descuento_1: detalle.descuento_1 || 0,
            descuento_2: detalle.descuento_2 || 0,
            descuento_monto: detalle.descuento_monto || 0,
            valor_venta: detalle.valor_venta,
            igv: detalle.igv,
            precio_total: detalle.precio_total,
            fecha_entrega_item: detalle.fecha_entrega,
            id_detalle_cotizacion: detalle.id_detalle_cotizacion,
          })
        );

        setProductos(productosTransformados);
        console.log(`📦 Productos cargados: ${productosTransformados.length}`);
      }

      message.success(
        "Cotización cargada exitosamente. Datos del cliente y productos cargados automáticamente."
      );
    } catch (error) {
      console.error("❌ Error al cargar cotización:", error);
      message.error("Error al cargar la cotización seleccionada");
    } finally {
      setCargandoCotizacionDetalle(false);
    }
  };

  const cargarPedidoCompleto = async (idPedido) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/pedidos/pedidos/${idPedido}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data) {
        cargarDatosPedido(response.data);
      }
    } catch (error) {
      console.error("Error al cargar pedido completo:", error);
      message.error("Error al cargar los datos del pedido");
    } finally {
      setLoading(false);
    }
  };

  const cargarDatosPedido = (pedidoData) => {
    if (pedidoData) {
      // Establecer cliente seleccionado
      if (pedidoData.id_cliente) {
        const clienteDelPedido = {
          id_cliente: pedidoData.id_cliente,
          codigo: pedidoData.codigo_cliente,
          razon_social: pedidoData.razon_social_cliente,
          nro_documento: pedidoData.nro_documento_cliente,
          direccion: pedidoData.direccion_cliente,
          telefono: pedidoData.telefono_cliente,
        };
        setClienteSeleccionado(clienteDelPedido);
      }

      form.setFieldsValue({
        // Información del cliente
        codigo_cliente: pedidoData.codigo_cliente,
        razon_social: pedidoData.razon_social_cliente,
        nro_documento: pedidoData.nro_documento_cliente,
        direccion: pedidoData.direccion_cliente,
        telefono_cliente: pedidoData.telefono_cliente,
        vendedor: pedidoData.vendedor,

        // Datos del pedido
        fecha: pedidoData.fecha ? dayjs(pedidoData.fecha) : dayjs(),
        moneda_id: pedidoData.moneda_id,
        forma_pago: pedidoData.forma_pago,
        prioridad: pedidoData.prioridad,
        fecha_entrega_prevista: pedidoData.fecha_entrega_prevista
          ? dayjs(pedidoData.fecha_entrega_prevista)
          : dayjs().add(7, "days"),
        lugar_entrega: pedidoData.lugar_entrega,
        observaciones: pedidoData.observaciones,
      });

      // Cargar productos (solo lectura en edición)
      if (pedidoData.detalles && Array.isArray(pedidoData.detalles)) {
        setProductos(
          pedidoData.detalles.map((detalle, index) => ({
            ...detalle,
            numitem: index + 1,
          }))
        );
      }
    }
  };

  const calcularTotales = () => {
    if (!Array.isArray(productos) || productos.length === 0) {
      setTotales({
        importe_bruto: 0,
        descuentos: 0,
        valor_venta: 0,
        igv: 0,
        total: 0,
      });
      return;
    }

    const importe_bruto = productos.reduce(
      (sum, p) =>
        sum +
        (parseFloat(p.precio_unitario) * parseFloat(p.cantidad_solicitada) ||
          0),
      0
    );

    const descuentos = productos.reduce(
      (sum, p) => sum + (parseFloat(p.descuento_monto) || 0),
      0
    );

    const valor_venta = productos.reduce(
      (sum, p) => sum + (parseFloat(p.valor_venta) || 0),
      0
    );

    const igv = productos.reduce((sum, p) => sum + (parseFloat(p.igv) || 0), 0);
    const total = productos.reduce(
      (sum, p) => sum + (parseFloat(p.precio_total) || 0),
      0
    );

    setTotales({
      importe_bruto: parseFloat(importe_bruto.toFixed(2)),
      descuentos: parseFloat(descuentos.toFixed(2)),
      valor_venta: parseFloat(valor_venta.toFixed(2)),
      igv: parseFloat(igv.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
    });
  };

  const guardarPedido = async (values) => {
    if (productos.length === 0) {
      message.warning("Debe seleccionar una cotización con productos");
      return;
    }

    if (!clienteSeleccionado) {
      message.warning(
        "Debe seleccionar una cotización para obtener los datos del cliente"
      );
      return;
    }

    if (!cotizacionSeleccionada && !pedido) {
      message.warning("Debe seleccionar una cotización aprobada");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      // Para NUEVO pedido (convertir cotización)
      if (!pedido) {
        const pedidoData = {
          id_cotizacion: cotizacionSeleccionada.id_cotizacion,
          fecha_entrega_prevista:
            values.fecha_entrega_prevista.format("YYYY-MM-DD"),
          lugar_entrega: values.lugar_entrega,
          observaciones:
            values.observaciones ||
            `Pedido generado desde cotización: ${cotizacionSeleccionada.numero}`,
        };

        console.log("📤 Enviando datos para crear pedido:", pedidoData);

        const response = await axios.post(
          `${
            import.meta.env.VITE_API_URL
          }/pedidos/pedidos/convertir-cotizacion`,
          pedidoData,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("✅ Respuesta del servidor:", response.data);

        message.success({
          content: `Pedido ${
            response.data.pedido?.numero || ""
          } creado exitosamente`,
          duration: 3,
        });

        if (onSuccess) {
          onSuccess(response.data.pedido);
        }
      } else {
        // Para EDITAR pedido existente
        const pedidoData = {
          moneda_id: values.moneda_id,
          forma_pago: values.forma_pago,
          prioridad: values.prioridad,
          fecha_entrega_prevista:
            values.fecha_entrega_prevista.format("YYYY-MM-DD"),
          lugar_entrega: values.lugar_entrega,
          observaciones: values.observaciones,
        };

        const response = await axios.put(
          `${import.meta.env.VITE_API_URL}/pedidos/pedidos/${pedido.id_pedido}`,
          pedidoData,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        message.success({
          content: `Pedido ${
            response.data.pedido?.numero || ""
          } actualizado exitosamente`,
          duration: 3,
        });

        if (onSuccess) {
          onSuccess(response.data.pedido);
        }
      }
    } catch (error) {
      console.error("❌ Error al guardar pedido:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detalle ||
        "Error al guardar el pedido";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "#",
      dataIndex: "numitem",
      key: "numitem",
      width: 50,
      align: "center",
    },
    {
      title: "Código",
      dataIndex: "producto_codigo",
      key: "producto_codigo",
      width: 100,
    },
    {
      title: "Descripción",
      dataIndex: "descripcion",
      key: "descripcion",
      width: 250,
    },
    {
      title: "Cantidad",
      dataIndex: "cantidad_solicitada",
      key: "cantidad_solicitada",
      width: 100,
      align: "right",
      render: (cantidad) => parseFloat(cantidad || 0).toFixed(3),
    },
    {
      title: "P. Unitario",
      dataIndex: "precio_unitario",
      key: "precio_unitario",
      width: 120,
      align: "right",
      render: (precio) => `S/ ${parseFloat(precio || 0).toFixed(2)}`,
    },
    // ✅ COLUMNAS DE DESCUENTOS
    {
      title: "Desc. 1 %",
      dataIndex: "descuento_1",
      key: "descuento_1",
      width: 80,
      align: "right",
      render: (descuento) => `${parseFloat(descuento || 0).toFixed(1)}%`,
    },
    {
      title: "Desc. 2 %",
      dataIndex: "descuento_2",
      key: "descuento_2",
      width: 80,
      align: "right",
      render: (descuento) => `${parseFloat(descuento || 0).toFixed(1)}%`,
    },
    {
      title: "Desc. Monto",
      dataIndex: "descuento_monto",
      key: "descuento_monto",
      width: 120,
      align: "right",
      render: (monto) => (
        <span style={{ color: "#ff4d4f" }}>
          - S/ {parseFloat(monto || 0).toFixed(2)}
        </span>
      ),
    },
    {
      title: "Valor Venta",
      dataIndex: "valor_venta",
      key: "valor_venta",
      width: 120,
      align: "right",
      render: (valor) => `S/ ${parseFloat(valor || 0).toFixed(2)}`,
    },
    {
      title: "IGV",
      dataIndex: "igv",
      key: "igv",
      width: 100,
      align: "right",
      render: (igv) => `S/ ${parseFloat(igv || 0).toFixed(2)}`,
    },
    {
      title: "Total",
      dataIndex: "precio_total",
      key: "precio_total",
      width: 120,
      align: "right",
      render: (total) => (
        <strong>S/ {parseFloat(total || 0).toFixed(2)}</strong>
      ),
    },
    {
      title: "F. Entrega",
      dataIndex: "fecha_entrega_item",
      key: "fecha_entrega_item",
      width: 120,
      render: (fecha) => (fecha ? formatDate(fecha) : "-"),
    },
  ];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-PE");
  };

  const formatCurrency = (amount) => {
    return `S/ ${parseFloat(amount || 0).toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={guardarPedido}
      initialValues={{
        fecha: dayjs(),
        prioridad: "NORMAL",
        fecha_entrega_prevista: dayjs().add(7, "days"),
      }}
    >
      {/* PRIMERO: SELECCIÓN DE COTIZACIÓN */}
      <Card
        title="Seleccionar Cotización Aprobada"
        style={{ marginBottom: 16 }}
      >
        <Row gutter={16}>
          <Col xs={24} md={16}>
            <Form.Item
              label="Cotizaciones Aprobadas Disponibles"
              rules={[
                { required: true, message: "Debe seleccionar una cotización" },
              ]}
            >
              <Spin spinning={cargandoCotizaciones}>
                <Select
                  placeholder={
                    cargandoCotizaciones
                      ? "Cargando cotizaciones..."
                      : "Seleccione una cotización aprobada"
                  }
                  onChange={seleccionarCotizacion}
                  allowClear
                  disabled={cargandoCotizaciones || !!pedido}
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {cotizacionesAprobadas.map((cotizacion) => (
                    <Select.Option
                      key={cotizacion.id_cotizacion}
                      value={cotizacion.id_cotizacion}
                    >
                      {cotizacion.numero} - {cotizacion.razon_social_cliente} -{" "}
                      {formatDate(cotizacion.fecha)} -{" "}
                      {formatCurrency(cotizacion.total)}
                    </Select.Option>
                  ))}
                </Select>
              </Spin>
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            {cotizacionSeleccionada ? (
              <Alert
                message={`Cotización ${cotizacionSeleccionada.numero} seleccionada`}
                description={`Cliente: ${
                  cotizacionSeleccionada.razon_social_cliente
                } | Total: ${formatCurrency(cotizacionSeleccionada.total)}`}
                type="success"
                showIcon
              />
            ) : (
              <Alert
                message="Seleccione una cotización"
                description={
                  cotizacionesAprobadas.length > 0
                    ? `${cotizacionesAprobadas.length} cotización(es) disponible(s)`
                    : "No hay cotizaciones aprobadas disponibles"
                }
                type="info"
                showIcon
              />
            )}
          </Col>
        </Row>
      </Card>

      {/* Información del Cliente - SE CARGA AUTOMÁTICAMENTE */}
      {clienteSeleccionado && (
        <Card title="Información del Cliente" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Código Cliente">
                <Input value={clienteSeleccionado.codigo} readOnly />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Razón Social">
                <Input value={clienteSeleccionado.razon_social} readOnly />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="RUC/DNI">
                <Input value={clienteSeleccionado.nro_documento} readOnly />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Teléfono">
                <Input value={clienteSeleccionado.telefono || ""} readOnly />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="Dirección">
                <Input value={clienteSeleccionado.direccion} readOnly />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      )}

      {/* Información de la Cotización Seleccionada */}
      {cotizacionSeleccionada && (
        <Card title="Información de la Cotización" style={{ marginBottom: 16 }}>
          <Spin spinning={cargandoCotizacionDetalle}>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="N° Cotización">
                <strong>{cotizacionSeleccionada.numero}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Fecha">
                {formatDate(cotizacionSeleccionada.fecha)}
              </Descriptions.Item>
              <Descriptions.Item label="Moneda">
                {cotizacionSeleccionada.moneda_codigo}
              </Descriptions.Item>
              <Descriptions.Item label="Forma de Pago">
                {cotizacionSeleccionada.forma_pago_nombre}
              </Descriptions.Item>
              <Descriptions.Item label="Prioridad">
                <Tag color="blue">{cotizacionSeleccionada.prioridad}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Total">
                <strong>{formatCurrency(cotizacionSeleccionada.total)}</strong>
              </Descriptions.Item>
            </Descriptions>
          </Spin>
        </Card>
      )}

      {/* Productos (SOLO LECTURA) - SE CARGA AUTOMÁTICAMENTE */}
      {productos.length > 0 && (
        <Card title="Productos de la Cotización" style={{ marginBottom: 16 }}>
          <Alert
            message="Los productos son de solo lectura. Se cargan automáticamente desde la cotización seleccionada."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Table
            columns={columns}
            dataSource={productos}
            rowKey={(record) => record.numitem}
            pagination={false}
            scroll={{ x: 1400 }}
            size="small"
            loading={cargandoCotizacionDetalle}
          />
        </Card>
      )}

      {/* Datos del Pedido */}
      <Card title="Datos del Pedido" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} md={6}>
            <Form.Item label="Fecha" name="fecha">
              <DatePicker
                style={{ width: "100%" }}
                format="DD/MM/YYYY"
                disabled={!!pedido}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={6}>
            <Form.Item
              label="Moneda"
              name="moneda_id"
              rules={[{ required: true, message: "Seleccione la moneda" }]}
            >
              <Select
                placeholder="Seleccione moneda"
                disabled={!!cotizacionSeleccionada}
              >
                {monedas.map((moneda) => (
                  <Select.Option key={moneda.id} value={moneda.id}>
                    {moneda.codigo} - {moneda.nombre}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={6}>
            <Form.Item
              label="Forma de Pago"
              name="forma_pago"
              rules={[{ required: true, message: "Seleccione forma de pago" }]}
            >
              <Select
                placeholder="Seleccione forma de pago"
                allowClear
                disabled={!!cotizacionSeleccionada}
              >
                {formasPago.map((fp) => (
                  <Select.Option key={fp.id} value={fp.id}>
                    {fp.nombre}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={6}>
            <Form.Item label="Prioridad" name="prioridad">
              <Select disabled={!!cotizacionSeleccionada}>
                <Select.Option value="NORMAL">Normal</Select.Option>
                <Select.Option value="URGENTE">Urgente</Select.Option>
                <Select.Option value="STOCK NORMAL">Stock Normal</Select.Option>
                <Select.Option value="STOCK URGENTE">
                  Stock Urgente
                </Select.Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              label="Fecha Entrega Prevista"
              name="fecha_entrega_prevista"
              rules={[
                { required: true, message: "Seleccione fecha de entrega" },
              ]}
            >
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="Lugar de Entrega" name="lugar_entrega">
              <Select placeholder="Seleccione lugar de entrega" allowClear>
                {puntosPartida.map((punto) => (
                  <Select.Option
                    key={punto.id_partida}
                    value={punto.id_partida}
                  >
                    {punto.direccion}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {pedido && (
            <Col xs={24} md={8}>
              <Form.Item label="Estado">
                <Tag
                  color={
                    pedido.estado === "DESPACHADO"
                      ? "green"
                      : pedido.estado === "ANULADO"
                      ? "red"
                      : pedido.estado === "EN PREPARACIÓN"
                      ? "blue"
                      : "orange"
                  }
                  style={{ fontSize: "14px", padding: "4px 8px" }}
                >
                  {pedido.estado}
                </Tag>
              </Form.Item>
            </Col>
          )}

          <Col xs={24}>
            <Form.Item label="Observaciones" name="observaciones">
              <TextArea
                rows={2}
                placeholder="Observaciones adicionales para el pedido"
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* Totales */}
      <Card title="Resumen" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Importe Bruto:</span>
                <strong>{formatCurrency(totales.importe_bruto)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Descuentos:</span>
                <strong style={{ color: "#ff4d4f" }}>
                  - {formatCurrency(totales.descuentos)}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Valor de Venta:</span>
                <strong>{formatCurrency(totales.valor_venta)}</strong>
              </div>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>IGV (18%):</span>
                <strong>{formatCurrency(totales.igv)}</strong>
              </div>
              <Divider style={{ margin: "8px 0" }} />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "18px",
                }}
              >
                <span>TOTAL:</span>
                <strong style={{ color: "#1890ff" }}>
                  {formatCurrency(totales.total)}
                </strong>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>

      <div style={{ marginTop: 24, textAlign: "right" }}>
        <Space>
          <Button icon={<CloseOutlined />} onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            htmlType="submit"
            loading={loading}
            disabled={
              !clienteSeleccionado || (!pedido && !cotizacionSeleccionada)
            }
          >
            {pedido ? "Actualizar Pedido" : "Crear Pedido"}
          </Button>
        </Space>
      </div>
    </Form>
  );
};

export default PedidoForm;
