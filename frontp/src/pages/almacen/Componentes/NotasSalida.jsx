import { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
  message,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  FilePdfOutlined
} from "@ant-design/icons";

import ModalAgregarItem from "./ModalAgregarItem";
import NotasDetalle from "./NotasDetalle";

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function NotasSalida({ filters, refreshKey }) {
  const TIPO = "SALIDA";
  const [notas, setNotas] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
  });

  const [documentos, setDocumentos] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [operaciones, setOperaciones] = useState([]);

  const [itemsNota, setItemsNota] = useState([]);

  const [openForm, setOpenForm] = useState(false);
  const [openItemManual, setOpenItemManual] = useState(false);

  const [detalleOpen, setDetalleOpen] = useState(false);
  const [notaSeleccionadaId, setNotaSeleccionadaId] = useState(null);

  const [editingNotaId, setEditingNotaId] = useState(null);
  const [editingEstado, setEditingEstado] = useState(null);

  const [loadingForm, setLoadingForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [openEditItem, setOpenEditItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm] = Form.useForm();
  
  const [form] = Form.useForm();

  const codOperacionWatch = Form.useWatch("cod_operacion", form);

  // ---------------------------------------------------
  // CARGA INICIAL
  // ---------------------------------------------------
  const fetchData = async () => {
    /*const r1 = await api.get("/almacen/notas?tipo=SALIDA");
    setNotas(r1.data);*/

    // Igual que en ingreso: documentos por tipo_movimiento
    const r2 = await api.get("/documentos/por-tipo-movimiento/SALIDA");
    setDocumentos(r2.data.data || []);

    const r3 = await api.get("/almacen/almacenes");
    setAlmacenes(r3.data);

    // Operaciones se cargan por documento (como en ingreso)
    setOperaciones([]);
  };

  const fetchLista = async (page = 1, pageSize = 10) => {
    const resp = await api.get("/almacen/notas/listar", {
      params: {
        tipo: "SALIDA",
        q: filters?.q,
        estado: filters?.estado,
        desde: filters?.desde,
        hasta: filters?.hasta,
        almacen: filters?.almacen_salida || filters?.almacen_destino,
        operacion: filters?.operacion,
        page,
        pageSize,
      },
    });

    setNotas(resp.data.data);
    setPagination(resp.data.pagination);
  };

  useEffect(() => {
      fetchData();
    }, []);

    useEffect(() => {
    fetchLista(1, pagination.pageSize);
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

  useEffect(() => {
    // Solo para "Nueva Nota" (no edición) y modal abierto
    if (!openForm || editingNotaId) return;
    if (!documentos.length) return;

    // Si ya hay documento seleccionado, no tocar
    const yaTieneDoc = form.getFieldValue("documento_interno_id");
    if (yaTieneDoc) return;

    const docNS = documentos.find((d) => (d.codigo || "").trim() === "NS") || documentos[0];
    if (!docNS) return;

    const docId = docNS.id ?? docNS.id_documento;

    form.setFieldsValue({ documento_interno_id: docId });
    handleDocumentoChange(docId);
  }, [openForm, editingNotaId, documentos, form]);

  const isConfirmed = useMemo(() => editingEstado === "CONFIRMADO", [editingEstado]);

  const requiereOrdenFab = useMemo(() => {
    const opSel = operaciones.find((op) => op.id === codOperacionWatch);
    return (
      (opSel?.tipo_movimiento || "").toUpperCase() === "SALIDA" &&
      opSel?.orden_fabricacion === "CON ORDEN"
    );
  }, [operaciones, codOperacionWatch]);

  // ---------------------------------------------------
  // HELPERS
  // ---------------------------------------------------
  const resetFormState = () => {
    setEditingNotaId(null);
    setEditingEstado(null);
    form.resetFields();
    setItemsNota([]);
    setOperaciones([]);
    setOpenItemManual(false);
    setOpenEditItem(false);
    setEditingItem(null);
    editForm.resetFields();
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

  const estadoTag = (estado) => {
    if (estado === "CONFIRMADO") return <Tag color="green">CONFIRMADO</Tag>;
    if (estado === "ANULADO") return <Tag color="red">ANULADO</Tag>;
    return <Tag color="gold">BORRADOR</Tag>;
  };

  // ---------------------------------------------------
  // OPERACIONES POR DOCUMENTO + ORIGEN AUTOMÁTICO
  // ---------------------------------------------------
  const cargarOperacionesPorDocumento = async (docCodigo) => {
    try {
      const resp = await api.get(`/cod-operacion/por-tipo-movimiento/SALIDA`, {
        params: { documento: docCodigo },
      });
      setOperaciones(resp.data.data || []);
    } catch (error) {
      console.error("Error cargando operaciones:", error);
      setOperaciones([]);
    }
  };

  const cargarSiguienteNumeroNota = async (documentoId) => {
    if (!documentoId) return;
    try {
      const response = await api.get(
        `/almacen/notas/next-number?documento_id=${documentoId}`
      );
      if (response.data?.next) {
        form.setFieldsValue({ numero: response.data.next });
      }
    } catch (error) {
      console.error("Error obteniendo correlativo:", error);
    }
  };

  const handleDocumentoChange = async (docId) => {
    const doc = documentos.find((d) => d.id === docId);
    if (!doc) return;

    // reset dependientes
    form.setFieldsValue({ origen: null, cod_operacion: null });
    setOperaciones([]);
    setItemsNota([]);

    await cargarSiguienteNumeroNota(docId);

    const codigo = doc.codigo?.trim();
    if (codigo) {
      await cargarOperacionesPorDocumento(codigo);
    }
  };

  const handleOperacionChange = (opId) => {
    const opSel = operaciones.find((op) => op.id === opId);

    // 1) origen default
    form.setFieldsValue({ origen: opSel?.origen_default || null });

    // 2) si la operación NO requiere orden de fabricación, limpia ese campo
    // (esto evita que se quede una OF seleccionada de una operación anterior)
    if ((opSel?.orden_fabricacion || "").toUpperCase() !== "CON ORDEN") {
      // Si el campo está en el modal, igual conviene limpiar aquí
      // porque el valor podría estar guardado en el state que mandas al modal
      // o en el form si lo reutilizas.
      form.setFieldsValue({ orden_fab_id: null });
    }
  };


  // ---------------------------------------------------
  // GUARDAR NOTA (BORRADOR)
  // ---------------------------------------------------
  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (itemsNota.length === 0) {
        message.warning("Agregue al menos un ítem antes de guardar.");
        return;
      }

      setSaving(true);

      const payload = {
        ...values,
        tipo: "SALIDA",
        items: itemsNota.map((it, idx) => ({
          ...it,
          numitem: idx + 1,
          // fallback: si el ítem no trae almacén, usamos almacén salida de cabecera
          almacen_id: it.almacen_id ?? values.almacen_salida ?? null,
        })),
        estado: "BORRADOR", // SIEMPRE BORRADOR (backend lo exige)
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

  const handleConfirmarSalida = async () => {
    try {
      // 1) si es nueva => guarda BORRADOR y luego confirma
      if (!editingNotaId) {
        const resp = await handleSave(); // devuelve id_nota
        const idNota = resp?.data?.id_nota;
        if (!idNota) throw new Error("No se obtuvo id_nota");
        await api.post(`/almacen/notas/${idNota}/confirmar`);
      } else {
        // 2) si está editando => actualiza BORRADOR y luego confirma
        await handleSave();
        await api.post(`/almacen/notas/${editingNotaId}/confirmar`);
      }

      message.success("Salida confirmada. Stock actualizado.");
      handleCloseForm();
      fetchLista(pagination.page, pagination.pageSize);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data?.error;
      message.error(msg || "No se pudo confirmar la salida");
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

  // ---------------------------------------------------
  // ÍTEMS
  // ---------------------------------------------------
  const handleEliminarItem = (id_temp) => {
    setItemsNota((prev) => prev.filter((it) => it.id_temp !== id_temp));
  };

  const handleEditarItem = (record) => {
    setEditingItem(record);
    setOpenEditItem(true);

    editForm.setFieldsValue({
      almacen_id: record.almacen_id ?? form.getFieldValue("almacen_salida") ?? null,
      cantidad: record.cantidad,
      comentario: record.comentario || null,
    });
  };

  const handleGuardarEdicionItem = async () => {
    const values = await editForm.validateFields();

    // Validación rápida: si el ítem trae stock_actual, no excederlo
    const stock = Number(editingItem?.stock_actual ?? NaN);
    if (!Number.isNaN(stock) && Number(values.cantidad) > stock) {
      message.error(`No puede exceder el stock actual (${stock}).`);
      return;
    }

    setItemsNota((prev) =>
      prev.map((it) =>
        it.id_temp === editingItem.id_temp
          ? { ...it, almacen_id: values.almacen_id, cantidad: values.cantidad, comentario: values.comentario || null }
          : it
      )
    );

    setOpenEditItem(false);
    setEditingItem(null);
  };

  // ---------------------------------------------------
  // EDITAR NOTA
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

      setEditingEstado(cabecera.estado);

      // documento -> operaciones
      const docCodigo = cabecera.documento_codigo?.trim();
      if (docCodigo) await cargarOperacionesPorDocumento(docCodigo);

      form.setFieldsValue({
        documento_interno_id: cabecera.documento_interno_id,
        numero: cabecera.numero,
        cod_operacion: cabecera.cod_operacion,
        origen: cabecera.origen,
        almacen_salida: cabecera.almacen_salida || null,
        tipo_documento_id: cabecera.tipo_documento_id || null,
        serie: cabecera.serie || null,
        numero_documento: cabecera.numero_documento || null,
        numero_guia: cabecera.numero_guia || null,
        observaciones: cabecera.observaciones || null,
      });

      const itemsFromDetalle = (detalle || []).map((det, idx) => ({
        id_temp: det.id ?? `det-${idx}-${Date.now()}`,
        id_producto: det.id_producto,
        codigo: det.codigo,
        descripcion: det.descripcion,
        unidad_medida: det.unidad_medida,
        cantidad: det.cantidad,
        almacen_id: det.almacen_id || cabecera.almacen_salida || null,
        lote: det.lote || null,
        serie_producto: det.serie_producto || null,
        fecha_vencimiento: det.fecha_vencimiento || null,
        comentario: det.comentario || null,
        // si tu endpoint de productos devuelve stock, puedes traerlo también
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

  const handleExportPdf = (idNota) => {
    const url = `${api.defaults.baseURL}/almacen/notas/${idNota}/export/pdf`;
    window.open(url, "_blank");
  };


  // ---------------------------------------------------
  // TABLA PRINCIPAL
  // ---------------------------------------------------
  const columns = [
    { title: "ID", dataIndex: "id_nota", width: 80 },
    { title: "Documento", dataIndex: "documento_nombre" },
    { title: "Operación", dataIndex: "operacion_nombre" },
    { title: "Almacén Salida", dataIndex: "almacen_salida_nombre" },
    { title: "Estado", dataIndex: "estado", render: (e) => estadoTag(e), width: 130 },
    {
      title: "Acciones",
      key: "acciones",
      width: 110,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditarNota(record.id_nota)}
          />
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => {
              setNotaSeleccionadaId(record.id_nota);
              setDetalleOpen(true);
            }}
          />
          <Tooltip title="Exportar PDF">
            <Button
              type="link"
              icon={<FilePdfOutlined style={{ color: "#cf1322" }} />}
              onClick={() => handleExportPdf(record.id_nota)}
            />
          </Tooltip>

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
                <Button type="link" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // ---------------------------------------------------
  // RENDER
  // ---------------------------------------------------
  return (
    <div style={{ padding: 24 }}>
      <Card
        title={<Title level={4} style={{ margin: 0 }}>Notas de Salida</Title>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenNuevaNota}>
            Nueva Nota
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={notas}
          rowKey="id_nota"
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (page, pageSize) => fetchLista(page, pageSize),
          }}
        />
      </Card>

      {/* MODAL PRINCIPAL */}
      <Modal
        title={
          <Space>
            <span>{editingNotaId ? "Editar Nota de Salida" : "Nueva Nota de Salida"}</span>
            {editingNotaId ? estadoTag(editingEstado) : null}
          </Space>
        }
        open={openForm}
        onCancel={handleCloseForm}
        width={900}
        maskClosable={false}
        footer={[
          <Button key="cancel" onClick={handleCloseForm} disabled={saving}>
            Cancelar
          </Button>,

          // si está CONFIRMADA, no se puede editar ni confirmar, solo cancelar/cerrar
          !isConfirmed && (
            <Button
              key="borrador"
              onClick={() => handleSave()}
              loading={saving}
              disabled={loadingForm}
            >
              Guardar borrador
            </Button>
          ),

          !isConfirmed && (
            <Popconfirm
              key="confirmar"
              title="¿Confirmar salida?"
              description="Esta acción descontará stock del almacén y no se puede deshacer."
              okText="Sí"
              cancelText="No"
              placement="topRight"
              icon={<ExclamationCircleOutlined />}
              onConfirm={handleConfirmarSalida}
            >
              <Button type="primary" loading={saving} disabled={loadingForm}>
                Confirmar salida
              </Button>
            </Popconfirm>
          ),
        ].filter(Boolean)}
      >
        <Form layout="vertical" form={form} disabled={isConfirmed}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Documento"
                name="documento_interno_id"
                rules={[{ required: true, message: "Seleccione un documento" }]}
              >
                <Select placeholder="Seleccione" onChange={handleDocumentoChange}>
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
              <Form.Item
                label="Operación"
                name="cod_operacion"
                rules={[{ required: true, message: "Seleccione una operación" }]}
              >
                <Select placeholder="Seleccione" onChange={handleOperacionChange}>
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

            <Col span={16}>
              <Form.Item
                label="Almacén de salida"
                name="almacen_salida"
                rules={[{ required: true, message: "Seleccione un almacén" }]}
              >
                <Select placeholder="Seleccione">
                  {almacenes.map((a) => (
                    <Select.Option key={a.id_alm} value={a.id_alm}>
                      {a.nombre}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Serie" name="serie">
                <Input placeholder="Serie" />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item label="Número Documento" name="numero_documento">
                <Input placeholder="Número" />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item label="N° Guía" name="numero_guia">
                <Input placeholder="Guía" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Observaciones" name="observaciones">
            <TextArea rows={3} placeholder="Observaciones (opcional)" />
          </Form.Item>

          <Divider />

          {/* AGREGAR ÍTEMS */}
          {!isConfirmed && (
            <Row gutter={16} style={{ marginBottom: 10 }}>
              <Col span={24}>
                <Space wrap>
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      const alm = form.getFieldValue("almacen_salida");
                      if (!alm) {
                        message.warning("Seleccione el almacén de salida antes de agregar ítems.");
                        return;
                      }
                      setOpenItemManual(true);
                    }}
                  >
                    Agregar ítems
                  </Button>

                  <Text type="secondary">
                    Ítems: <Text strong>{itemsNota.length}</Text>
                  </Text>
                </Space>
              </Col>
            </Row>
          )}

          {/* TABLA ÍTEMS */}
          <Table
            dataSource={itemsNota}
            rowKey="id_temp"
            size="small"
            pagination={false}
            columns={[
              { title: "#", width: 60, render: (_, __, i) => i + 1 },
              { title: "Código", dataIndex: "codigo", width: 120 },
              { title: "Descripción", dataIndex: "descripcion" },
              { title: "UM", dataIndex: "unidad_medida", width: 90 },
              {
                title: "Almacén",
                dataIndex: "almacen_id",
                width: 180,
                render: (id) => getAlmacenNombre(id),
              },
              { title: "Cantidad", dataIndex: "cantidad", width: 120 },
              {
                title: "Comentario",
                dataIndex: "comentario",
                width: 220,
                render: (text) =>
                  text ? (
                    <Tooltip title={text}>
                      <Text ellipsis style={{ maxWidth: 200, display: "inline-block" }}>
                        {text}
                      </Text>
                    </Tooltip>
                  ) : (
                    <Text type="secondary">—</Text>
                  ),
              },
              !isConfirmed
                ? {
                    title: "Acciones",
                    key: "acciones",
                    width: 110,
                    render: (_, record) => (
                      <Space>
                        <Button
                          type="link"
                          icon={<EditOutlined />}
                          onClick={() => handleEditarItem(record)}
                        />
                        <Button
                          type="link"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleEliminarItem(record.id_temp)}
                        />
                      </Space>
                    ),
                  }
                : null,
            ].filter(Boolean)}
          />
        </Form>
      </Modal>

      {/* MODAL AGREGAR ITEM (reutilizable) */}
      <ModalAgregarItem
        open={openItemManual}
        onClose={() => setOpenItemManual(false)}
        onAddItem={(item) => {
          // forzamos que el ítem salga del almacén de la cabecera si no lo selecciona
          const alm = form.getFieldValue("almacen_salida");
          setItemsNota((prev) => [
            ...prev,
            { ...item, almacen_id: item.almacen_id ?? alm ?? null },
          ]);
        }}
        almacenes={almacenes}
        modo="SALIDA"
        defaultAlmacenId={form.getFieldValue("almacen_salida")}
        requiereOrdenFab={requiereOrdenFab}
      />

      {/* MODAL EDITAR ITEM */}
      <Modal
        title="Editar ítem"
        open={openEditItem}
        onCancel={() => {
          setOpenEditItem(false);
          setEditingItem(null);
        }}
        onOk={handleGuardarEdicionItem}
        okText="Guardar cambios"
      >
        <Form layout="vertical" form={editForm}>
          <Form.Item
            label="Almacén"
            name="almacen_id"
            rules={[{ required: true, message: "Seleccione un almacén" }]}
          >
            <Select placeholder="Seleccione">
              {almacenes.map((a) => (
                <Select.Option key={a.id_alm} value={a.id_alm}>
                  {a.nombre}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Cantidad"
            name="cantidad"
            rules={[{ required: true, message: "Ingrese la cantidad" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0.001} step={0.001} />
          </Form.Item>

          {editingItem?.stock_actual != null && (
            <Text type="secondary">
              Stock actual: <Text strong>{editingItem.stock_actual}</Text>
            </Text>
          )}

          <Form.Item label="Comentario" name="comentario">
            <Input.TextArea rows={3} placeholder="Comentario del ítem (opcional)" />
          </Form.Item>
        </Form>
      </Modal>

      {/* DETALLE */}
      <NotasDetalle
        open={detalleOpen}
        notaId={notaSeleccionadaId}
        onClose={() => {
          setDetalleOpen(false);
          setNotaSeleccionadaId(null);
        }}
      />
    </div>
  );
}
