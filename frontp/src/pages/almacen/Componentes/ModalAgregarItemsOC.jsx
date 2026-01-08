import { useEffect, useState } from "react";
import {
  Modal,
  Table,
  Form,
  InputNumber,
  Select,
  Button,
  Row,
  Col,
  Typography,
} from "antd";
import api from "../../../api/api";

const { Title } = Typography;

export default function ModalAgregarItemsOC({
  open,
  close,
  onSelectItems,
  ordenesCompra,
  selectedOC,
  itemsExistentes = [],
}) {
  const [detallesOC, setDetallesOC] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [almacenes, setAlmacenes] = useState([]);

  const [form] = Form.useForm();

  // Cargar almacenes cuando abre
  useEffect(() => {
    if (open) cargarAlmacenes();
  }, [open]);

  const cargarAlmacenes = async () => {
    const res = await api.get("/almacen/almacenes");
    setAlmacenes(res.data);
  };

  // Cargar detalles de la OC SELECCIONADA desde NotasIngreso
  useEffect(() => {
    if (open && selectedOC) cargarDetalles(selectedOC);
  }, [open, selectedOC]);

  const cargarDetalles = async (ocId) => {
    setSelectedRow(null);
    form.resetFields();

    const res = await api.get(`/compras/ordenes-compra/${ocId}/detalles`);

    const detalles = Array.isArray(res.data.detalles) ? res.data.detalles : [];

    // Mapeo base desde la OC
    let procesado = detalles.map((item) => {
      const solicitado = Number(item.cantidad_solicitada || 0);
      const recibido = Number(item.cantidad_recibida || 0);

      const pendienteOC = solicitado - recibido;

      const yaTieneItemEnNota = itemsExistentes.some(
        (it) => it.orden_compra_detalle_id === item.id
      );

      return {
        id_detalle: item.id,
        numitem: item.numitem,
        id_producto: item.id_producto,
        codigo: item.producto_codigo,
        descripcion: item.producto_descripcion,
        unidad_medida: item.unidad_medida,
        solicitado,
        recibido,
        pendiente: pendienteOC,
        yaTieneItemEnNota,
        linea_cerrada: Boolean(item.linea_cerrada),
      };
    });

    // NO mostrar: ya usados, sin pendiente, o con línea cerrada
    procesado = procesado.filter(
      (item) => !item.yaTieneItemEnNota && item.pendiente > 0 && !item.linea_cerrada
    );

    setDetallesOC(procesado);
  };

  // Guardar ítem seleccionado
  const handleAgregar = async () => {
    const values = await form.validateFields();

    const item = detallesOC.find((i) => i.numitem === selectedRow);

    const newItem = {
      id_temp: Date.now(),
      id_producto: item.id_producto, // ✅ OBLIGATORIO
      codigo: item.codigo,
      descripcion: item.descripcion,
      unidad_medida: item.unidad_medida,
      cantidad: values.cantidad_ingresar,
      almacen_id: values.almacen_destino,
      orden_compra_detalle_id: item.id_detalle,
      pendiente_max: item.pendiente,
    };

    onSelectItems([newItem]);
    close();
  };

  return (
    <Modal
      open={open}
      onCancel={close}
      title="Seleccionar Ítems de la Orden de Compra"
      width={900}
      footer={null}
      zIndex={2000}
    >
      <Form form={form} layout="vertical">
        <Title level={5}>Ítems pendientes de la OC</Title>

        {/* TABLA DE ÍTEMS */}
        <Table
          dataSource={detallesOC}
          columns={[
            { title: "Código", dataIndex: "codigo", width: 120 },
            { title: "Descripción", dataIndex: "descripcion", width: 250 },
            { title: "UM", dataIndex: "unidad_medida", width: 80 },
            { title: "Solicitado", dataIndex: "solicitado", align: "right" },
            { title: "Recibido", dataIndex: "recibido", align: "right" },
            {
              title: "Pendiente",
              dataIndex: "pendiente",
              align: "right",
              render: (v) => (
                <span style={{ fontWeight: "bold", color: "#1677ff" }}>{v}</span>
              ),
            },
          ]}
          rowKey="numitem"
          pagination={false}
          rowSelection={{
            type: "radio",
            selectedRowKeys: [selectedRow],
            onChange: (keys) => {
              setSelectedRow(keys[0]);
              form.resetFields();
            },
          }}
          scroll={{ y: 300 }}
        />

        {/* FORMULARIO DE CANTIDAD + ALMACÉN */}
        {selectedRow && (
          <>
            <Title level={5} style={{ marginTop: 20 }}>
              Datos del Ítem Seleccionado
            </Title>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Almacén Destino"
                  name="almacen_destino"
                  rules={[{ required: true, message: "Seleccione almacén" }]}
                >
                  <Select placeholder="Seleccione almacén">
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
                  label="Cantidad a Ingresar"
                  name="cantidad_ingresar"
                  rules={[{ required: true, message: "Ingrese la cantidad" }]}
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    min={0.001}
                    step={0.001}
                    max={detallesOC.find((i) => i.numitem === selectedRow)?.pendiente}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row justify="end">
              <Button type="primary" onClick={handleAgregar}>
                Agregar Ítem
              </Button>
            </Row>
          </>
        )}
      </Form>
    </Modal>
  );
}
