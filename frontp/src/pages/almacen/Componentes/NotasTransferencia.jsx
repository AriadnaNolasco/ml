// NotasTransferencia.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import {
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";

import ModalAgregarItem from "./ModalAgregarItem";
import NotasDetalle from "./NotasDetalle";

const { Title, Text } = Typography;
const { TextArea } = Input;

const ESTADO_COLOR = {
  BORRADOR: "orange",
  CONFIRMADO: "green",
  ANULADO: "red",
};

const renderEstadoTag = (estado) => {
  if (!estado) return null;
  return <Tag color={ESTADO_COLOR[estado] || "default"}>{estado}</Tag>;
};

export default function NotasTransferencia({ filters, refreshKey }) {
  const TIPO = "TRANSFERENCIA";

  const [notas, setNotas] = useState([]);

  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [documentos, setDocumentos] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [operaciones, setOperaciones] = useState([]);

  const [itemsNota, setItemsNota] = useState([]);

  const [openForm, setOpenForm] = useState(false);
  const [openItemManual, setOpenItemManual] = useState(false);

  const [detalleOpen, setDetalleOpen] = useState(false);
  const [notaSeleccionadaId, setNotaSeleccionadaId] = useState(null);

  const [editingNotaId, setEditingNotaId] = useState(null);
  const [estadoNota, setEstadoNota] = useState("BORRADOR");

  const [loadingForm, setLoadingForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form] = Form.useForm();

  const esConfirmado = estadoNota === "CONFIRMADO";
  const esAnulado = estadoNota === "ANULADO";
  const readOnly = esConfirmado || esAnulado;

  // ---------------------------------------------------
  // CARGA INICIAL
  // ---------------------------------------------------
  const fetchData = async () => {
    /*const r1 = await api.get(`/almacen/notas?tipo=${TIPO}`);
    setNotas(r1.data || []);*/

    // NT tiene tipo_movimiento = 'NO APLICA'
    const r2 = await api.get("/documentos/por-tipo-movimiento/NO%20APLICA");
    setDocumentos(r2.data?.data || []);

    const r3 = await api.get("/almacen/almacenes");
    setAlmacenes(r3.data || []);

    setOperaciones([]);
  };

  const fetchLista = async (page = 1, pageSize = pagination.pageSize || 10) => {
    const resp = await api.get("/almacen/notas/listar", {
      params: {
        tipo: TIPO,

        q: filters?.q || undefined,
        estado: filters?.estado || undefined,
        desde: filters?.desde || undefined,
        hasta: filters?.hasta || undefined,

        //si tu backend YA soporta separados (recomendado):
        almacen_salida: filters?.almacen_salida || undefined,
        almacen_destino: filters?.almacen_destino || undefined,

        operacion: filters?.operacion || undefined,

        page,
        pageSize,
        orderBy: "fecha_nota",
        orderDir: "DESC",
      },
    });

    const data = resp.data?.data || [];
    const pag = resp.data?.pagination || {};

    setNotas(data);
    setPagination({
      page: pag.page || page,
      pageSize: pag.pageSize || pageSize,
      total: pag.total || 0,
    });
  };

  useEffect(() => {
    fetchData();        // combos del modal
    fetchLista(1, 10);  // tabla inicial
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchLista(1, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    refreshKey,
    filters?.q,
    filters?.estado,
    filters?.desde,
    filters?.hasta,
    filters?.almacen_salida,
    filters?.almacen_destino,
    filters?.operacion,
  ]);

  // Set doc default NT al abrir "Nueva nota"
  useEffect(() => {
    if (!openForm || editingNotaId) return;
    if (!documentos.length) return;

    const yaTieneDoc = form.getFieldValue("documento_interno_id");
    if (yaTieneDoc) return;

    const docNT = documentos.find((d) => (d.codigo || "").trim() === "NT") || documentos[0];
    if (!docNT) return;

    const docId = docNT.id ?? docNT.id_documento;
    form.setFieldsValue({ documento_interno_id: docId });
    handleDocumentoChange(docId);
  }, [openForm, editingNotaId, documentos, form]);

  // ---------------------------------------------------
  // HELPERS
  // ---------------------------------------------------
  const resetFormState = () => {
    setEditingNotaId(null);
    setEstadoNota("BORRADOR");
    form.resetFields();
    setItemsNota([]);
    setOperaciones([]);
    setOpenItemManual(false);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    resetFormState();
  };

  const handleOpenNuevaNota = () => {
    resetFormState();
    setOpenForm(true);
  };

  const getAlmacenNombre = (id) => {
    const alm = almacenes.find((a) => a.id_alm === id);
    return alm ? alm.nombre : "";
  };

  // ---------------------------------------------------
  // OPERACIONES + ORIGEN AUTOMÁTICO (NO EDITABLE)
  // ---------------------------------------------------
    const cargarOperacionesParaTransferencia = async () => {
    try {
        const resp = await api.get(`/cod-operacion/por-tipo-movimiento/SALIDA`, {
        params: { documento: "NT" },
        });

        const ops = resp.data?.data || [];

        // ✅ Me quedo solo con la operación transferencia
        const opsTransfer = ops.filter((op) => {
        const siglas = (op.siglas || "").toUpperCase().trim();
        const nombre = (op.nombre || "").toUpperCase();
        const codigo = String(op.codigo || "").trim();

        return (
            siglas === "SAL_TRF" ||
            nombre.includes("TRANSFERENCIA") ||
            codigo === "160"
        );
        });

        setOperaciones(opsTransfer);

        // ✅ si solo queda 1, la selecciono automáticamente
        if (opsTransfer.length === 1) {
        const opId = opsTransfer[0].id_cod_operacion ?? opsTransfer[0].id;
        form.setFieldsValue({ cod_operacion: opId });
        form.setFieldsValue({ origen: opsTransfer[0]?.origen_default || null });
        }
    } catch (error) {
        console.error("Error cargando operaciones:", error);
        setOperaciones([]);
    }
    };

  const cargarSiguienteNumeroNota = async (documentoId) => {
    if (!documentoId) return;
    try {
      const response = await api.get(`/almacen/notas/next-number?documento_id=${documentoId}`);
      if (response.data?.next) form.setFieldsValue({ numero: response.data.next });
    } catch (error) {
      console.error("Error obteniendo correlativo:", error);
    }
  };

  const handleDocumentoChange = async (docId) => {
    if (readOnly) return;

    const doc = documentos.find((d) => (d.id ?? d.id_documento) === docId);
    if (!doc) return;

    // reset dependientes
    form.setFieldsValue({
      origen: null,
      cod_operacion: null,
      almacen_salida: null,
      almacen_destino: null,
    });
    setItemsNota([]);

    await cargarSiguienteNumeroNota(docId);

    // cargar operaciones para NT
    await cargarOperacionesParaTransferencia();
  };

  const handleOperacionChange = (opId) => {
    if (readOnly) return;

    const opSel = operaciones.find((op) => (op.id_cod_operacion ?? op.id) === opId);
    // ✅ Origen se asigna automático y NO editable (tal como Ingreso/Salida)
    form.setFieldsValue({ origen: opSel?.origen_default || null });
  };

  // ---------------------------------------------------
  // VALIDACIONES DE CABECERA
  // ---------------------------------------------------
  const validarCabeceraAntesItems = () => {
    const almSalida = form.getFieldValue("almacen_salida");
    const almDestino = form.getFieldValue("almacen_destino");
    const op = form.getFieldValue("cod_operacion");
    const doc = form.getFieldValue("documento_interno_id");

    if (!doc) return message.warning("Seleccione el documento.");
    if (!op) return message.warning("Seleccione la operación.");
    if (!almSalida) return message.warning("Seleccione el almacén origen.");
    if (!almDestino) return message.warning("Seleccione el almacén destino.");
    if (Number(almSalida) === Number(almDestino))
      return message.warning("El almacén origen y destino no pueden ser el mismo.");

    return true;
  };

  // ---------------------------------------------------
  // GUARDAR / CONFIRMAR / ANULAR
  // ---------------------------------------------------
  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (itemsNota.length === 0) {
        message.warning("Agregue al menos un ítem antes de guardar.");
        return;
      }

      if (Number(values.almacen_salida) === Number(values.almacen_destino)) {
        message.warning("El almacén origen y destino no pueden ser el mismo.");
        return;
      }

      setSaving(true);

      const payload = {
        ...values,
        tipo: TIPO,
        // en transferencia los ítems salen del almacén ORIGEN
        items: itemsNota.map((it, idx) => ({
          ...it,
          numitem: idx + 1,
          almacen_id: it.almacen_id ?? values.almacen_salida ?? null,
        })),
        estado: "BORRADOR",
      };

      const resp = await (editingNotaId
        ? api.put(`/almacen/notas/${editingNotaId}`, payload)
        : api.post("/almacen/notas", payload));

      message.success(editingNotaId ? "Borrador actualizado" : "Borrador creado");
      handleCloseForm();
      fetchLista(pagination.page, pagination.pageSize);
      return resp;
    } catch (error) {
      const msg = error?.response?.data?.message || error?.response?.data?.error;
      if (error?.errorFields) message.warning("Complete los campos obligatorios.");
      else message.error(msg || "No se pudo guardar la nota");
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmarTransferencia = async () => {
    try {
      let idNota = editingNotaId;

      // Si es nueva: primero guardar para obtener id_nota
      if (!idNota) {
        const resp = await handleSave();
        idNota = resp?.data?.id_nota;
        if (!idNota) throw new Error("No se obtuvo id_nota");
      } else {
        // Si ya existe: guardar cambios antes de confirmar
        await handleSave();
      }

      // ✅ Confirmar por la ruta de transferencias
      await api.post(`/almacen/notas/${idNota}/confirmar-transferencia`);

      message.success("Transferencia confirmada. Stock actualizado.");
      handleCloseForm();
      fetchLista(pagination.page, pagination.pageSize);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data?.error;
      message.error(msg || "No se pudo confirmar la transferencia");
    }
  };

  const handleAnularNota = async (notaId) => {
    try {
      await api.post(`/almacen/notas/${notaId}/anular`);
      message.success("Nota anulada. Stock revertido.");
      fetchLista(pagination.page, pagination.pageSize);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data?.error;
      message.error(msg || "No se pudo anular la nota");
    }
  };

  const handleExportPdf = (idNota) => {
    const url = `${api.defaults.baseURL}/almacen/notas/${idNota}/export/pdf`;
    window.open(url, "_blank");
  };

  // ---------------------------------------------------
  // ITEMS
  // ---------------------------------------------------
  const handleAgregarItem = () => {
    if (readOnly) return;
    const ok = validarCabeceraAntesItems();
    if (ok !== true) return;
    setOpenItemManual(true);
  };

  const handleEliminarItem = (id_temp) => {
    if (readOnly) return;
    setItemsNota((prev) => prev.filter((it) => it.id_temp !== id_temp));
  };

  // ---------------------------------------------------
  // TABLA PRINCIPAL
  // ---------------------------------------------------
  const columns = useMemo(
    () => [
      { title: "ID", dataIndex: "id_nota", width: 90, align: "center", render: (id) => <Text strong>{id}</Text> },
      {
        title: "N°",
        dataIndex: "numero",
        width: 110,
        render: (val, record) => (
          <Space direction="vertical" size={0}>
            <Text strong>{val}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.documento_nombre}
            </Text>
          </Space>
        ),
      },
      { title: "Operación", dataIndex: "operacion_nombre" },
      { title: "Almacén Origen", dataIndex: "almacen_salida_nombre" },
      { title: "Almacén Destino", dataIndex: "almacen_destino_nombre" },
      {
        title: "Estado",
        dataIndex: "estado",
        width: 130,
        render: (estado) => (
          <Space>
            <Badge color={ESTADO_COLOR[estado] || "default"} />
            {renderEstadoTag(estado)}
          </Space>
        ),
      },
      {
        title: "Acciones",
        key: "acciones",
        width: 160,
        render: (_, record) => (
          <Space>
            <Tooltip title="Editar">
              <Button type="text" icon={<EditOutlined />} onClick={() => handleEditarNota(record.id_nota)} />
            </Tooltip>

            <Tooltip title="Ver detalle">
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => {
                  setNotaSeleccionadaId(record.id_nota);
                  setDetalleOpen(true);
                }}
              />
            </Tooltip>

            {record.estado === "CONFIRMADO" && (
              <Tooltip title="Exportar PDF">
                <Button
                  type="text"
                  icon={<FilePdfOutlined style={{ color: "#cf1322" }} />}
                  onClick={() => handleExportPdf(record.id_nota)}
                />
              </Tooltip>
            )}

            {record.estado === "CONFIRMADO" && (
              <Popconfirm
                title="¿Anular nota?"
                description="Esto generará un movimiento reverso y revertirá el stock."
                okText="Sí, anular"
                cancelText="No"
                icon={<ExclamationCircleOutlined />}
                onConfirm={() => handleAnularNota(record.id_nota)}
              >
                <Tooltip title="Anular">
                  <Button type="text" danger icon={<DeleteOutlined />} />
                </Tooltip>
              </Popconfirm>
            )}
          </Space>
        ),
      },
    ],
    [operaciones, documentos]
  );

  // ---------------------------------------------------
  // EDITAR NOTA (carga cabecera + detalle)
  // ---------------------------------------------------
  const handleEditarNota = async (notaId) => {
    setLoadingForm(true);
    resetFormState();
    setOpenForm(true);
    setEditingNotaId(notaId);

    try {
      const resp = await api.get(`/almacen/notas/${notaId}`);
      const { cabecera, detalle } = resp.data || {};
      if (!cabecera) throw new Error("Nota sin cabecera");

      setEstadoNota(cabecera.estado || "BORRADOR");

      // cargar operaciones
      await cargarOperacionesParaTransferencia();

      form.setFieldsValue({
        documento_interno_id: cabecera.documento_interno_id,
        numero: cabecera.numero,
        cod_operacion: cabecera.cod_operacion,
        origen: cabecera.origen,
        almacen_salida: cabecera.almacen_salida || null,
        almacen_destino: cabecera.almacen_destino || null,
        observaciones: cabecera.observaciones || null,
      });

      const itemsFromDetalle = (detalle || []).map((det, idx) => ({
        id_temp: det.id ?? `det-${idx}-${Date.now()}`,
        id_producto: det.id_producto,
        codigo: det.codigo,
        descripcion: det.descripcion,
        unidad_medida: det.unidad_medida,
        cantidad: det.cantidad,
        // por coherencia: en transferencia, el almacén del ítem es el ORIGEN
        almacen_id: det.almacen_id || cabecera.almacen_salida || null,
        lote: det.lote || null,
        serie_producto: det.serie_producto || null,
        fecha_vencimiento: det.fecha_vencimiento || null,
        comentario: det.comentario || null,
        stock_actual: det.stock_actual ?? null,
      }));

      setItemsNota(itemsFromDetalle);
    } catch (error) {
      console.error("Error cargando nota:", error);
      message.error("No se pudo cargar la nota para editar");
      setEditingNotaId(null);
      setOpenForm(false);
    } finally {
      setLoadingForm(false);
    }
  };

  // ---------------------------------------------------
  // FOOTER MODAL
  // ---------------------------------------------------
  const modalFooter = [
    <Button key="cancel" onClick={handleCloseForm} disabled={saving}>
      Cancelar
    </Button>,

    !readOnly && (
      <Button key="borrador" onClick={() => handleSave().catch(() => {})} loading={saving} disabled={loadingForm}>
        Guardar borrador
      </Button>
    ),

    !readOnly && (
      <Popconfirm
        key="confirm"
        title="¿Confirmar transferencia?"
        description="Esta acción descontará stock del almacén origen y lo ingresará al almacén destino."
        okText="Sí"
        cancelText="No"
        placement="topRight"
        icon={<ExclamationCircleOutlined />}
        onConfirm={handleConfirmarTransferencia}
      >
        <Button type="primary" loading={saving}>
          Confirmar transferencia
        </Button>
      </Popconfirm>
    ),
  ].filter(Boolean);

  const almacenOrigenSeleccionado = Form.useWatch("almacen_salida", form);

  // ---------------------------------------------------
  // RENDER
  // ---------------------------------------------------
  return (
    <div style={{ padding: 24 }}>
      <Card
        style={{ borderRadius: 14 }}
        bodyStyle={{ padding: 18 }}
        title={
          <Space>
            <Title level={4} style={{ margin: 0 }}>
              Notas de Transferencia
            </Title>
            <Tag color="blue">ALMACÉN</Tag>
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenNuevaNota}>
            Nueva nota
          </Button>
        }
      >
        <Table dataSource={notas} columns={columns} rowKey="id_nota" pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          onChange: (page, pageSize) => fetchLista(page, pageSize),
        }} />
      </Card>

      {/* MODAL PRINCIPAL */}
      <Modal
        title={
          <Space>
            <Text strong style={{ fontSize: 16 }}>
              {editingNotaId ? "Editar Nota de Transferencia" : "Nueva Nota de Transferencia"}
            </Text>
            {renderEstadoTag(estadoNota)}
          </Space>
        }
        open={openForm}
        onCancel={handleCloseForm}
        width={980}
        footer={modalFooter}
        destroyOnClose
        maskClosable={false}
      >
        <div
          style={{
            background: "#fafafa",
            borderRadius: 12,
            padding: 14,
            border: "1px solid #f0f0f0",
          }}
        >
          <Form layout="vertical" form={form} disabled={loadingForm}>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="Documento" name="documento_interno_id" rules={[{ required: true }]}>
                  <Select placeholder="Seleccione" onChange={handleDocumentoChange} disabled={readOnly}>
                    {documentos.map((d) => {
                      const id = d.id ?? d.id_documento;
                      return (
                        <Select.Option key={id} value={id}>
                          {(d.codigo || "").trim()} - {d.nombre}
                        </Select.Option>
                      );
                    })}
                  </Select>
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item label="Número" name="numero" rules={[{ required: true }]}>
                  <Input disabled placeholder="000000001" />
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item label="Operación" name="cod_operacion" rules={[{ required: true, message: "Seleccione una operación" }]}>
                  <Select placeholder="Seleccione" onChange={handleOperacionChange} disabled={readOnly}>
                    {operaciones.map((op) => {
                      const opId = op.id_cod_operacion ?? op.id;
                      return (
                        <Select.Option key={opId} value={opId}>
                          {(op.codigo || "").trim()} - {op.nombre}
                        </Select.Option>
                      );
                    })}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="Origen" name="origen">
                  <Input disabled placeholder="Se asigna automáticamente" />
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item
                  label="Almacén Origen"
                  name="almacen_salida"
                  rules={[{ required: true, message: "Seleccione el almacén origen" }]}
                >
                  <Select
                    placeholder="Seleccione"
                    disabled={readOnly}
                    onChange={() => {
                        if (itemsNota.length) setItemsNota([]);
                        form.setFieldsValue({ almacen_destino: null });
                    }}
                >
                    {almacenes.map((a) => (
                      <Select.Option key={a.id_alm} value={a.id_alm}>
                        {a.nombre}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item
                  label="Almacén Destino"
                  name="almacen_destino"
                  rules={[{ required: true, message: "Seleccione el almacén destino" }]}
                >
                  <Select placeholder="Seleccione" disabled={readOnly}>
                    {almacenes
                        .filter((a) => a.id_alm !== almacenOrigenSeleccionado)
                        .map((a) => (
                        <Select.Option key={a.id_alm} value={a.id_alm}>
                            {a.nombre}
                        </Select.Option>
                        ))}
                    </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Observaciones" name="observaciones">
              <TextArea rows={3} disabled={readOnly} />
            </Form.Item>

            <Divider style={{ margin: "10px 0 14px" }} />

            <Space style={{ marginBottom: 12 }}>
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                disabled={readOnly}
                onClick={handleAgregarItem}
                style={{ borderRadius: 10 }}
              >
                Agregar ítems
              </Button>
              <Text type="secondary">
                Ítems: <Text strong>{itemsNota.length}</Text>
              </Text>
              {itemsNota.length > 0 && (
                <Text type="secondary">
                  (Si cambias el almacén origen, se limpiarán los ítems)
                </Text>
              )}
            </Space>

            <Table
              dataSource={itemsNota}
              rowKey="id_temp"
              size="small"
              pagination={false}
              style={{ borderRadius: 12, overflow: "hidden" }}
              columns={[
                { title: "#", width: 60, render: (_, __, i) => i + 1 },
                { title: "Código", dataIndex: "codigo", width: 120 },
                { title: "Descripción", dataIndex: "descripcion" },
                { title: "UM", dataIndex: "unidad_medida", width: 90 },
                {
                  title: "Almacén (sale de)",
                  dataIndex: "almacen_id",
                  width: 190,
                  render: (id) => getAlmacenNombre(id),
                },
                { title: "Cantidad", dataIndex: "cantidad", width: 120 },
                {
                  title: "Comentario",
                  dataIndex: "comentario",
                  width: 220,
                  render: (text) => (text ? <Text ellipsis style={{ maxWidth: 200, display: "inline-block" }}>{text}</Text> : <Text type="secondary">—</Text>),
                },
                !readOnly
                  ? {
                      title: "Acciones",
                      key: "acciones",
                      width: 110,
                      render: (_, record) => (
                        <Space>
                          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleEliminarItem(record.id_temp)} />
                        </Space>
                      ),
                    }
                  : null,
              ].filter(Boolean)}
            />
          </Form>
        </div>
      </Modal>

      {/* MODAL DETALLE */}
      <NotasDetalle
        open={detalleOpen}
        onClose={() => setDetalleOpen(false)}
        notaId={notaSeleccionadaId}
      />

      {/* MODAL AGREGAR ITEM (SALIDA: valida stock en almacén origen) */}
      <ModalAgregarItem
        open={openItemManual}
        onClose={() => setOpenItemManual(false)}
        almacenes={almacenes}
        modo="SALIDA"
        defaultAlmacenId={form.getFieldValue("almacen_salida")}
        requiereOrdenFab={false}
        onAddItem={(item) => {
          const almOrigen = form.getFieldValue("almacen_salida");
          setItemsNota((prev) => [...prev, { ...item, almacen_id: item.almacen_id ?? almOrigen ?? null }]);
        }}
      />
    </div>
  );
}
