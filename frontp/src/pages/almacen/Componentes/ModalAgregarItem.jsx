import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Form,
  Select,
  InputNumber,
  Input,
  DatePicker,
  Row,
  Col,
  Typography,
  Spin,
  Divider,
  Alert,
} from "antd";
import api from "../../../api/api";

const { Title, Text } = Typography;

export default function ModalAgregarItem({
  open,
  onClose,
  onAddItem,
  almacenes = [],
  modo = "INGRESO", // "INGRESO" | "SALIDA"
  defaultAlmacenId = null,
  requiereOrdenFab = false,
}) {
  const [form] = Form.useForm();
  const [ordenesFabricacion, setOrdenesFabricacion] = useState([]);
  const [cargandoOF, setCargandoOF] = useState(false);

  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [productos, setProductos] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  const esSalida = useMemo(() => (modo || "").toUpperCase() === "SALIDA", [modo]);

  const formatNumber = (val) => {
    if (val == null) return "-";
    const n = Number(val);
    if (Number.isNaN(n)) return val;
    return n.toLocaleString("es-PE", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  };

  // -------------------------------
  // Cargar productos (según modo)
  // -------------------------------
  const cargarProductos = async (almacenIdParaSalida = null) => {
    try {
      setCargandoProductos(true);

      // ✅ SALIDA: cargar productos con stock del almacén seleccionado
      if (esSalida) {
        const almacenId = Number(almacenIdParaSalida);
        if (!almacenId) {
          setProductos([]);
          return;
        }

        const res = await api.get("/almacen/stock-almacen/productos", {
          params: { almacen_id: almacenId, solo_con_stock: 1 },
        });

        const data = Array.isArray(res.data) ? res.data : res.data.data || [];
        setProductos(data);
        return;
      }

      // ✅ INGRESO: comportamiento normal (lista general)
      const res = await api.get("/almacen/productos");
      const data = Array.isArray(res.data) ? res.data : res.data.data || [];
      setProductos(data);
    } catch (error) {
      console.error("Error cargando productos:", error);
      setProductos([]);
    } finally {
      setCargandoProductos(false);
    }
  };

  // Al abrir modal: reset + set almacén default + cargar productos
  useEffect(() => {
    if (!open) return;

    form.resetFields();
    setProductoSeleccionado(null);

    // set default almacén (cabecera)
    if (defaultAlmacenId) {
      form.setFieldsValue({ almacen_id: defaultAlmacenId });
    }

    // cargar productos según modo
    const almInicial = defaultAlmacenId || form.getFieldValue("almacen_id") || null;
    cargarProductos(almInicial);
  }, [open, form, defaultAlmacenId, esSalida]);

  // Cargar OF si aplica
  useEffect(() => {
    const cargarOF = async () => {
      try {
        setCargandoOF(true);
        const res = await api.get("/almacen/ordenes-fabricacion/disponibles");
        const data = Array.isArray(res.data) ? res.data : res.data.data || [];
        setOrdenesFabricacion(data);
      } catch (e) {
        console.error("Error cargando OF:", e);
        setOrdenesFabricacion([]);
      } finally {
        setCargandoOF(false);
      }
    };

    if (open && requiereOrdenFab) cargarOF();
    if (open && !requiereOrdenFab) setOrdenesFabricacion([]);
  }, [open, requiereOrdenFab]);

  // ✅ Cuando cambia el almacén dentro del modal (CLAVE PARA SALIDA)
  const handleAlmacenChange = async (almId) => {
    form.setFieldsValue({ producto_id: null, cantidad: null });
    setProductoSeleccionado(null);

    // si es salida, recargar productos por ese almacén
    if (esSalida) {
      await cargarProductos(almId);
    }
  };

  // Cuando seleccionas un producto del combo
  const handleSelectProducto = (idProducto) => {
    const prod = productos.find((p) => Number(p.id_producto) === Number(idProducto));
    setProductoSeleccionado(prod || null);

    // si es salida, resetea cantidad para forzar validación con stock del almacén
    form.setFieldsValue({ cantidad: null });
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (!productoSeleccionado) return;

      const item = {
        id_temp: Date.now(),
        id_producto: productoSeleccionado.id_producto,
        codigo: productoSeleccionado.codigo,
        descripcion: productoSeleccionado.descripcion,
        unidad_medida:
          productoSeleccionado.unidad_medida ||
          productoSeleccionado.unidad_siglas ||
          productoSeleccionado.unidad_medida_abrev ||
          "UND",
        cantidad: values.cantidad,
        almacen_id: values.almacen_id,
        lote: values.lote || null,
        serie_producto: values.serie_producto || null,
        fecha_vencimiento: values.fecha_vencimiento ? values.fecha_vencimiento.format("YYYY-MM-DD") : null,
        comentario: values.comentario || null,
        orden_fab_id: values.orden_fab_id || null,
        orden_compra_detalle_id: null,
        pendiente_max: null,
        // ✅ stock del almacén (para validar y para mostrar)
        stock_actual: productoSeleccionado.stock_actual ?? null,
      };

      onAddItem(item);
      form.resetFields();
      setProductoSeleccionado(null);
      onClose();
    } catch {
      // validación fallida
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setProductoSeleccionado(null);
    onClose();
  };

  const almacIdActual = Form.useWatch("almacen_id", form);

  return (
    <Modal
      open={open}
      title={esSalida ? "Agregar ítem a la Nota de Salida" : "Agregar ítem a la Nota de Ingreso"}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Agregar"
      cancelText="Cancelar"
      destroyOnClose
      width={780}
      getContainer={false}
      zIndex={2000}
      maskClosable={false}
      okButtonProps={{
        // ✅ en SALIDA, si no hay almacén seleccionado, bloquea agregar
        disabled: esSalida && !almacIdActual,
      }}
    >
      <Form form={form} layout="vertical">
        <Title level={5} style={{ marginTop: 0 }}>
          {esSalida ? "Datos de salida" : "Datos de ingreso"}
        </Title>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={esSalida ? "Almacén de salida" : "Almacén destino"}
              name="almacen_id"
              rules={[{ required: true, message: "Seleccione el almacén" }]}
            >
              <Select placeholder="Seleccione almacén" onChange={handleAlmacenChange}>
                {almacenes.map((a) => (
                  <Select.Option key={a.id_alm} value={a.id_alm}>
                    {a.nombre}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Cantidad"
              name="cantidad"
              rules={[
                { required: true, message: "Ingrese la cantidad" },
                () => ({
                  validator(_, value) {
                    if (value == null || value === "") return Promise.resolve();

                    if (esSalida && productoSeleccionado?.stock_actual != null) {
                      const stock = Number(productoSeleccionado.stock_actual);
                      if (!Number.isNaN(stock) && Number(value) > stock) {
                        return Promise.reject(
                          new Error(`No puede exceder el stock actual (${formatNumber(stock)}).`)
                        );
                      }
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <InputNumber style={{ width: "100%" }} min={0.001} step={0.001} />
            </Form.Item>
          </Col>
        </Row>

        <Divider style={{ margin: "10px 0 14px" }} />

        <Title level={5} style={{ marginTop: 0 }}>
          Selección de producto
        </Title>

        {esSalida && !almacIdActual && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 12 }}
            message="Seleccione primero el almacén para listar los productos disponibles."
          />
        )}

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Producto"
              name="producto_id"
              rules={[{ required: true, message: "Seleccione un producto" }]}
            >
              <Select
                showSearch
                placeholder={esSalida ? "Productos disponibles en el almacén..." : "Buscar por código o descripción..."}
                loading={cargandoProductos}
                disabled={esSalida && !almacIdActual}
                notFoundContent={cargandoProductos ? <Spin size="small" /> : "Sin resultados"}
                optionFilterProp="data-search"
                filterOption={(input, option) =>
                  (option?.props?.["data-search"] ?? "").toString().toLowerCase().includes(input.toLowerCase())
                }
                onChange={handleSelectProducto}
              >
                {productos.map((p) => (
                  <Select.Option
                    key={p.id_producto}
                    value={p.id_producto}
                    data-search={`${p.codigo} ${p.descripcion}`}
                  >
                    {p.codigo} - {p.descripcion}
                    {esSalida && p.stock_actual != null ? `  (Stock: ${formatNumber(p.stock_actual)})` : ""}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {productoSeleccionado && (
          <>
            <Divider style={{ margin: "8px 0 14px" }} />

            {esSalida && productoSeleccionado?.stock_actual != null && (
              <Alert
                showIcon
                type="info"
                style={{ marginBottom: 14 }}
                message={
                  <span>
                    Stock actual: <b>{formatNumber(productoSeleccionado.stock_actual)}</b>
                    {"  "} / Stock mínimo: <b>{formatNumber(productoSeleccionado.stock_minimo)}</b>
                  </span>
                }
              />
            )}

            <Row gutter={16} style={{ marginBottom: 10 }}>
              <Col span={12}>
                <Text type="secondary">Código</Text>
                <div>
                  <Text strong>{productoSeleccionado.codigo}</Text>
                </div>
              </Col>
              <Col span={12}>
                <Text type="secondary">Unidad de medida</Text>
                <div>
                  <Text strong>
                    {productoSeleccionado.unidad_siglas || productoSeleccionado.unidad_medida || "UND"}
                  </Text>
                </div>
              </Col>
            </Row>

            <Row style={{ marginBottom: 10 }}>
              <Col span={24}>
                <Text type="secondary">Descripción</Text>
                <div>
                  <Text>{productoSeleccionado.descripcion}</Text>
                </div>
              </Col>
            </Row>
          </>
        )}

        {requiereOrdenFab && (
          <Form.Item
            label="Orden de fabricación"
            name="orden_fab_id"
            rules={[{ required: true, message: "Seleccione la orden de fabricación" }]}
          >
            <Select
              showSearch
              placeholder="Seleccione OF"
              loading={cargandoOF}
              optionFilterProp="label"
              options={ordenesFabricacion.map((of) => ({
                value: of.id_ord ?? of.id,
                label: of.numero_ord ? `${of.numero_ord}` : `${of.codigo ?? "OF"} ${of.descripcion ?? ""}`.trim(),
              }))}
            />
          </Form.Item>
        )}

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Lote" name="lote">
              <Input />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="Serie producto" name="serie_producto">
              <Input />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="Fecha vencimiento" name="fecha_vencimiento">
              <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
        </Row>

        <Row>
          <Col span={24}>
            <Form.Item label="Comentario" name="comentario">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
