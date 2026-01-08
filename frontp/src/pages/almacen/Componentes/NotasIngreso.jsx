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
  InputNumber,
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
  FilePdfOutlined
} from "@ant-design/icons";
import ModalAgregarItemsOC from "./ModalAgregarItemsOC";
import ModalAgregarItem from "./ModalAgregarItem";
import NotasDetalle from "./NotasDetalle";

const { TextArea } = Input;
const { Title, Text } = Typography;

const ESTADO_COLOR = {
  BORRADOR: "orange",
  CONFIRMADO: "green",
  ANULADO: "red",
};

const renderEstadoTag = (estado) => {
  if (!estado) return null;
  return <Tag color={ESTADO_COLOR[estado] || "default"}>{estado}</Tag>;
};

export default function NotasIngreso({ filters, refreshKey }) {
  const TIPO = "INGRESO";

  const [notas, setNotas] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [documentos, setDocumentos] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [operaciones, setOperaciones] = useState([]);
  const [tiposDocumentoComercial, setTiposDocumentoComercial] = useState([]);

  const [ordenesCompra, setOrdenesCompra] = useState([]);
  const [itemsNota, setItemsNota] = useState([]);

  const [openForm, setOpenForm] = useState(false);
  const [openItemsModal, setOpenItemsModal] = useState(false);

  const [detalleOpen, setDetalleOpen] = useState(false);
  const [notaSeleccionadaId, setNotaSeleccionadaId] = useState(null);

  const [form] = Form.useForm();
  const [requiereOC, setRequiereOC] = useState(false);

  const [clientes, setClientes] = useState([]);
  const [proveedorInfo, setProveedorInfo] = useState(null); // { id, nombre } opcional para mostrar

  const [openItemManual, setOpenItemManual] = useState(false);

  const [editingItem, setEditingItem] = useState(null);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editForm] = Form.useForm();

  const [editingNotaId, setEditingNotaId] = useState(null);
  const [estadoNota, setEstadoNota] = useState("BORRADOR"); // 👈 clave
  const [loadingForm, setLoadingForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const esConfirmado = estadoNota === "CONFIRMADO";
  const esAnulado = estadoNota === "ANULADO";
  const readOnly = esConfirmado || esAnulado; // si quieres, también bloquear anulado

  // --------------------------------------------------------------------
  // CARGA INICIAL
  // --------------------------------------------------------------------
  const fetchData = async () => {
    /*const r1 = await api.get("/almacen/notas?tipo=INGRESO");
    setNotas(r1.data);*/

    const r2 = await api.get("/documentos/por-tipo-movimiento/INGRESO");
    setDocumentos(r2.data.data || []);

    const r3 = await api.get("/almacen/almacenes");
    setAlmacenes(r3.data || []);

    const r5 = await api.get("/tipos-documento/comerciales");
    setTiposDocumentoComercial(r5.data.data || []);

    const r6 = await api.get("/ventas/clientes");
    setClientes(r6.data?.data || r6.data || []);

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

        // si tu backend ya soporta separados:
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
    fetchData();        // combos del form
    fetchLista(1, 10);  // lista inicial
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

  useEffect(() => {
    // Solo para "Nueva Nota" (no edición) y cuando el modal está abierto
    if (!openForm || editingNotaId) return;

    // Si todavía no cargaron documentos, espera
    if (!documentos.length) return;

    // Si ya hay documento seleccionado, no tocar
    const yaTieneDoc = form.getFieldValue("documento_interno_id");
    if (yaTieneDoc) return;

    const docNI = documentos.find((d) => (d.codigo || "").trim() === "NI") || documentos[0];
    if (!docNI) return;

    const docId = docNI.id ?? docNI.id_documento;

    // Setear documento por defecto y disparar lógica normal
    form.setFieldsValue({ documento_interno_id: docId });
    handleDocumentoChange(docId);
  }, [openForm, editingNotaId, documentos, form]);

  const cargarOperacionesPorDocumento = async (docCodigo) => {
    try {
      const resp = await api.get(`/cod-operacion/por-tipo-movimiento/INGRESO`, {
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
      const response = await api.get(`/almacen/notas/next-number?documento_id=${documentoId}`);
      if (response.data?.next) {
        form.setFieldsValue({ numero: response.data.next });
      }
    } catch (error) {
      console.error("Error obteniendo correlativo:", error);
    }
  };

  // --------------------------------------------------------------------
  // EVENTOS FORM
  // --------------------------------------------------------------------
  const handleDocumentoChange = async (docId) => {
    if (readOnly) return;

    const doc = documentos.find((d) => (d.id ?? d.id_documento) === docId);
    if (!doc) return;

    // limpiar OC/ítems al cambiar documento
    form.setFieldsValue({ orden_compra_id: null, origen: null, estado_oc: null, cliente_id: null, proveedor_id: null, cod_operacion: null });
    setProveedorInfo(null);
    setOrdenesCompra([]);
    setItemsNota([]);

    const codigo = (doc.codigo || "").trim();
    const esOC = codigo === "NIC" || codigo === "NIE";
    setRequiereOC(esOC);

    if (esOC) {
      form.setFieldsValue({ origen: "O/C" });
      const tipo = codigo === "NIC" ? "LOCAL" : "EXTERNO";
      const oc = await api.get(`/almacen/ordenes-compra/disponibles?tipo=${tipo}`);
      setOrdenesCompra(oc.data || []);
    }

    await cargarSiguienteNumeroNota(docId);
    setOperaciones([]);
    await cargarOperacionesPorDocumento(codigo);
  };

  const handleOrdenCompraChange = (ocId) => {
    if (readOnly) return;

    if (itemsNota.length > 0) setItemsNota([]);

    const ocSel = ordenesCompra.find((oc) => oc.id === ocId);
    form.setFieldsValue({ estado_oc: ocSel ? ocSel.estado : null,
      proveedor_id: ocSel?.proveedor_id ?? null
     });

    setProveedorInfo(
      ocSel?.proveedor_id
        ? {
            id: ocSel.proveedor_id,
            nombre: ocSel.proveedor_nombre || "",
            documento: ocSel.proveedor_documento || "",
          }
        : null
    );
  };

  const handleOperacionChange = (opId) => {
    if (readOnly) return;

    const opSel = operaciones.find((op) => (op.id_cod_operacion ?? op.id) === opId);
    if (opSel?.origen_default) form.setFieldsValue({ origen: opSel.origen_default });
    else form.setFieldsValue({ origen: null });

    const opCodigo = Number(opSel?.codigo);
    if (opCodigo !== 140) {
      form.setFieldsValue({ cliente_id: null });
    }
  };

  // --------------------------------------------------------------------
  // GUARDAR
  // --------------------------------------------------------------------
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const payload = {
        ...values,
        tipo: "INGRESO",
        items: itemsNota,
        estado: "BORRADOR", // siempre BORRADOR (backend lo exige)
      };

      const resp = await (editingNotaId
        ? api.put(`/almacen/notas/${editingNotaId}`, payload)
        : api.post("/almacen/notas", payload));

      message.success(editingNotaId ? "Borrador actualizado" : "Borrador creado");
      handleCloseForm();
      fetchLista(1, pagination.pageSize);
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

  const handleConfirmarNota = async () => {
    try {
      if (!editingNotaId) {
        const resp = await handleSave();
        const idNota = resp?.data?.id_nota;
        if (!idNota) throw new Error("No se obtuvo id_nota");
        await api.post(`/almacen/notas/${idNota}/confirmar`);
      } else {
        // si estás editando, primero actualiza borrador y luego confirma
        await handleSave(); // guarda BORRADOR
        await api.post(`/almacen/notas/${editingNotaId}/confirmar`);
      }

      message.success("Nota confirmada. Stock actualizado.");
      handleCloseForm();
      fetchLista(1, pagination.pageSize);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data?.error;
      message.error(msg || "No se pudo confirmar la nota");
    }
  };

  const handleAnularNota = async (notaId) => {
    try {
      await api.post(`/almacen/notas/${notaId}/anular`);
      message.success("Nota anulada. Stock revertido.");
      fetchLista(1, pagination.pageSize);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data?.error;
      message.error(msg || "No se pudo anular la nota");
    }
  };

  // --------------------------------------------------------------------
  // CONTROL MODAL
  // --------------------------------------------------------------------
  const resetFormState = () => {
    setEditingNotaId(null);
    setEstadoNota("BORRADOR");
    form.resetFields();
    setItemsNota([]);
    setOrdenesCompra([]);
    setRequiereOC(false);
    setOperaciones([]);
    setOpenItemsModal(false);
    setOpenItemManual(false);
    setOpenEditModal(false);
    setEditingItem(null);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    resetFormState();
  };

  const handleOpenNuevaNota = () => {
    resetFormState();
    setEstadoNota("BORRADOR");
    setOpenForm(true);
  };

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

      const docCodigo = (cabecera.documento_codigo || "").trim();
      const requiere = docCodigo === "NIC" || docCodigo === "NIE";
      setRequiereOC(requiere);

      // Limpia operaciones antes de recargar (evita que queden las del doc anterior)
      setOperaciones([]);
      if (docCodigo) await cargarOperacionesPorDocumento(docCodigo);

      // Siempre setea campos base primero (PERO sin proveedor_id aquí si requiereOC)
      const baseValues = {
        documento_interno_id: cabecera.documento_interno_id,
        numero: cabecera.numero,
        cod_operacion: cabecera.cod_operacion,
        origen: cabecera.origen,
        orden_compra_id: cabecera.orden_compra_id || null,
        almacen_destino: cabecera.almacen_destino || null,
        tipo_documento_id: cabecera.tipo_documento_id || null,
        serie: cabecera.serie || null,
        numero_documento: cabecera.numero_documento || null,
        observaciones: cabecera.observaciones || null,
        cliente_id: cabecera.cliente_id || null,
        // 👇 NO pongas proveedor_id aquí todavía si requiereOC, para no pisar lo de la OC
      };

      // Si NO requiereOC, ahí sí setea proveedor desde cabecera (si aplica)
      if (!requiere) {
        baseValues.proveedor_id = cabecera.proveedor_id || null;

        setProveedorInfo(
          cabecera.proveedor_id
            ? {
                id: cabecera.proveedor_id,
                nombre: cabecera.proveedor_nombre || "",
                documento: cabecera.proveedor_documento || "",
              }
            : null
        );
      } else {
        // si requiereOC, por seguridad limpia proveedor (se seteará desde OC)
        baseValues.proveedor_id = null;
        setProveedorInfo(null);
      }

      form.setFieldsValue(baseValues);

      // Si requiereOC: cargar OC disponibles y setear proveedor desde OC seleccionada
      if (requiere) {
        const tipo = docCodigo === "NIC" ? "LOCAL" : "EXTERNO";

        const ocResp = await api.get(`/almacen/ordenes-compra/disponibles?tipo=${tipo}`);
        const ocs = ocResp.data || [];
        setOrdenesCompra(ocs);

        const ocSel = ocs.find((ocItem) => ocItem.id === cabecera.orden_compra_id);

        form.setFieldsValue({
          estado_oc: ocSel?.estado || null,
          orden_compra_id: cabecera.orden_compra_id || null,
        });

        if (ocSel?.proveedor_id) {
          form.setFieldsValue({ proveedor_id: ocSel.proveedor_id });

          setProveedorInfo({
            id: ocSel.proveedor_id,
            nombre: ocSel.proveedor_nombre || "",
            documento: ocSel.proveedor_documento || "",
          });
        } else {
          form.setFieldsValue({ proveedor_id: null });
          setProveedorInfo(null);
        }
      } else {
        // no requiere OC
        setOrdenesCompra([]);
        form.setFieldsValue({
          estado_oc: null,
          orden_compra_id: null,
        });
      }

      // Detalle
      const itemsFromDetalle = (detalle || []).map((det, idx) => {
        const almacenId =
          det.almacen_id ||
          cabecera.almacen_destino ||
          almacenes.find((a) => a.nombre === det.almacen_nombre)?.id_alm ||
          null;

        return {
          id_temp: det.id ?? `det-${idx}-${Date.now()}`,
          id_producto: det.id_producto,
          codigo: det.codigo,
          descripcion: det.descripcion,
          unidad_medida: det.unidad_medida,
          cantidad: det.cantidad,
          almacen_id: almacenId,
          orden_compra_detalle_id: det.orden_compra_detalle_id || null,
          lote: det.lote || null,
          serie_producto: det.serie_producto || null,
          fecha_vencimiento: det.fecha_vencimiento || null,
          comentario: det.comentario || null,
          pendiente_max: det.pendiente_max || null,
        };
      });

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

  // --------------------------------------------------------------------
  // ITEMS
  // --------------------------------------------------------------------
  const getAlmacenNombre = (id) => {
    const alm = almacenes.find((a) => a.id_alm === id);
    return alm ? alm.nombre : "";
  };

  const handleEliminarItem = (id_temp) => {
    if (readOnly) return;
    setItemsNota((prev) => prev.filter((it) => it.id_temp !== id_temp));
  };

  const handleEditarItem = (record) => {
    if (readOnly) return;
    setEditingItem(record);
    setOpenEditModal(true);
    editForm.setFieldsValue({
      almacen_id: record.almacen_id,
      cantidad: record.cantidad,
      comentario: record.comentario || null,
    });
  };

  const handleGuardarEdicion = async () => {
    const values = await editForm.validateFields();

    setItemsNota((prev) =>
      prev.map((it) =>
        it.id_temp === editingItem.id_temp
          ? { ...it, almacen_id: values.almacen_id, cantidad: values.cantidad, comentario: values.comentario || null }
          : it
      )
    );

    setOpenEditModal(false);
    setEditingItem(null);
  };

  const handleAgregarItem = () => {
    if (readOnly) return;

    const docId = form.getFieldValue("documento_interno_id");
    if (!docId) return;

    const doc = documentos.find((d) => (d.id ?? d.id_documento) === docId);
    if (!doc) return;

    const codigo = (doc.codigo || "").trim();
    const esOC = codigo === "NIC" || codigo === "NIE";

    if (esOC) setOpenItemsModal(true);
    else setOpenItemManual(true);
  };

  const handleExportPdf = (idNota) => {
    const url = `${api.defaults.baseURL}/almacen/notas/${idNota}/export/pdf`;
    window.open(url, "_blank");
  };

  // --------------------------------------------------------------------
  // TABLA PRINCIPAL
  // --------------------------------------------------------------------
  const columns = useMemo(
    () => [
      {
        title: "ID",
        dataIndex: "id_nota",
        width: 90,
        align: "center",
        render: (id) => (
          <Text strong>{id}</Text>
        ),
      },
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
      { title: "Almacén destino", dataIndex: "almacen_destino_nombre" },
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
        width: 120,
        render: (_, record) => (
          <Space>
            <Tooltip title="Editar">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleEditarNota(record.id_nota)}
              />
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
    [documentos]
  );

  // --------------------------------------------------------------------
  // FOOTER MODAL (condicional por estado)
  // --------------------------------------------------------------------
  const modalFooter = [
    <Button key="cancel" onClick={handleCloseForm} disabled={saving}>
      Cancelar
    </Button>,

    // 👇 Solo si NO está confirmado/anulado
    !readOnly && (
      <Button
        key="borrador"
        onClick={() => handleSave().catch(() => {})}
        loading={saving}
        disabled={loadingForm}
      >
        Guardar borrador
      </Button>
    ),

    // 👇 Solo si NO está confirmado/anulado
    !readOnly && (
      <Popconfirm
        key="confirm"
        title="¿Confirmar ingreso?"
        description="Esta acción agregará los productos al almacén y no se puede deshacer."
        okText="Sí"
        cancelText="No"
        placement="topRight"
        icon={<ExclamationCircleOutlined />}
        onConfirm={handleConfirmarNota}
      >
        <Button type="primary" loading={saving}>
          Confirmar ingreso
        </Button>
      </Popconfirm>
    ),
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        style={{ borderRadius: 14 }}
        bodyStyle={{ padding: 18 }}
        title={
          <Space>
            <Title level={4} style={{ margin: 0 }}>
              Notas de Ingreso
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
        <Table
          dataSource={notas}
          columns={columns}
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
            <Text strong style={{ fontSize: 16 }}>
              {editingNotaId ? "Editar Nota de Ingreso" : "Nueva Nota de Ingreso"}
            </Text>
            {renderEstadoTag(estadoNota)}
          </Space>
        }
        open={openForm}
        onCancel={handleCloseForm}
        width={920}
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
                  <Select
                    placeholder="Seleccione"
                    onChange={handleDocumentoChange}
                    disabled={readOnly}
                  >
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
                <Form.Item label="Operación" name="cod_operacion" rules={[{ required: true }]}>
                  <Select
                    placeholder="Seleccione"
                    onChange={handleOperacionChange}
                    disabled={readOnly}
                  >
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

              {requiereOC && (
                <Col span={8}>
                  <Form.Item
                    label="Orden de Compra"
                    name="orden_compra_id"
                    rules={requiereOC ? [{ required: true, message: "Seleccione una orden de compra" }] : []}
                  >
                    <Select
                      placeholder="Buscar por N° OC o Proveedor"
                      showSearch
                      disabled={!requiereOC || readOnly}
                      onChange={handleOrdenCompraChange}
                      optionFilterProp="data-search"
                      filterOption={(input, option) =>
                        (option?.props?.["data-search"] ?? "")
                          .toString()
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                    >
                      {ordenesCompra.map((oc) => {
                        const docCode = (oc.documento_codigo || "").trim();
                        const label = `${docCode} - ${oc.numero}`;
                        const searchText = `${oc.numero} ${oc.proveedor_nombre} ${oc.proveedor_documento} ${docCode}`;
                        return (
                          <Select.Option key={oc.id} value={oc.id} data-search={searchText}>
                            {label}
                          </Select.Option>
                        );
                      })}
                    </Select>
                  </Form.Item>
                </Col>
              )}

              {requiereOC && (
                <>
                  <Col span={8}>
                    <Form.Item label="Estado O/C" name="estado_oc">
                      <Input readOnly />
                    </Form.Item>
                  </Col>

                  <Form.Item name="proveedor_id" hidden>
                    <Input />
                  </Form.Item>

                  <Col span={8}>
                    <Form.Item label="Proveedor">
                      <Input
                        readOnly
                        value={
                          proveedorInfo
                            ? `${proveedorInfo.nombre}${proveedorInfo.documento ? " - " + proveedorInfo.documento : ""}`
                            : ""
                        }
                        placeholder="Se completa desde la O/C"
                      />
                    </Form.Item>
                  </Col>
                </>
              )}
            </Row>

            <Form.Item shouldUpdate>
              {({ getFieldValue }) => {
                const opId = getFieldValue("cod_operacion");
                const opSel = operaciones.find((op) => (op.id_cod_operacion ?? op.id) === opId);
                const es140 = Number(opSel?.codigo) === 140;

                if (!es140) return null;

                return (
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="Cliente"
                        name="cliente_id"
                        rules={[{ required: true, message: "Seleccione un cliente (solo para devolución de cliente)" }]}
                      >
                        <Select
                          placeholder="Seleccione cliente"
                          showSearch
                          disabled={readOnly}
                          optionFilterProp="children"
                          filterOption={(input, option) =>
                            (option?.children ?? "").toString().toLowerCase().includes(input.toLowerCase())
                          }
                        >
                          {clientes.map((c) => (
                            <Select.Option key={c.id_cliente ?? c.id} value={c.id_cliente ?? c.id}>
                              {c.nombre ?? c.razon_social ?? c.cliente_nombre ?? `Cliente ${c.id_cliente ?? c.id}`}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                );
              }}
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Almacén Destino" name="almacen_destino" rules={[{ required: true }]}>
                  <Select placeholder="Seleccione" disabled={readOnly}>
                    {almacenes.map((a) => (
                      <Select.Option key={a.id_alm} value={a.id_alm}>
                        {a.nombre}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Divider style={{ margin: "10px 0 14px" }} />

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="Tipo Documento Comercial" name="tipo_documento_id">
                  <Select placeholder="Seleccione" disabled={readOnly}>
                    {tiposDocumentoComercial.map((td) => (
                      <Select.Option key={td.id} value={td.id}>
                        {td.codigo} - {td.nombre}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item label="Serie" name="serie">
                  <Input disabled={readOnly} />
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item label="Número" name="numero_documento">
                  <Input disabled={readOnly} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Observaciones" name="observaciones">
              <TextArea rows={3} disabled={readOnly} />
            </Form.Item>

            <Divider style={{ margin: "10px 0 14px" }} />

            <Form.Item shouldUpdate>
              {({ getFieldValue }) => {
                const docId = getFieldValue("documento_interno_id");
                const doc = documentos.find((d) => (d.id ?? d.id_documento) === docId);
                const codigo = (doc?.codigo || "").trim();
                const requiere = codigo === "NIC" || codigo === "NIE";
                const disabled = (requiere && !getFieldValue("orden_compra_id")) || readOnly;

                return (
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    disabled={disabled}
                    onClick={handleAgregarItem}
                    style={{ borderRadius: 10 }}
                  >
                    Agregar ítems
                  </Button>
                );
              }}
            </Form.Item>

            <Table
              dataSource={itemsNota}
              rowKey="id_temp"
              size="small"
              pagination={false}
              style={{ borderRadius: 12, overflow: "hidden" }}
              columns={[
                {
                  title: "Item",
                  render: (_, __, index) => index + 1,
                  width: 70,
                },
                { title: "Código", dataIndex: "codigo", width: 140 },
                { title: "Descripción", dataIndex: "descripcion" },
                { title: "UM", dataIndex: "unidad_medida", width: 110 },
                {
                  title: "Almacén",
                  dataIndex: "almacen_id",
                  width: 200,
                  render: (id) => getAlmacenNombre(id),
                },
                {
                  title: "Cantidad",
                  dataIndex: "cantidad",
                  width: 120,
                  align: "right",
                  render: (v) =>
                    v != null
                      ? Number(v).toLocaleString("es-PE", { minimumFractionDigits: 3, maximumFractionDigits: 3 })
                      : "",
                },
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
                {
                  title: "Acciones",
                  key: "acciones",
                  width: 120,
                  render: (_, record) => (
                    <Space>
                      <Tooltip title={readOnly ? "Bloqueado (Confirmado)" : "Editar ítem"}>
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          onClick={() => handleEditarItem(record)}
                          disabled={readOnly}
                        />
                      </Tooltip>
                      <Tooltip title={readOnly ? "Bloqueado (Confirmado)" : "Eliminar ítem"}>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleEliminarItem(record.id_temp)}
                          disabled={readOnly}
                        />
                      </Tooltip>
                    </Space>
                  ),
                },
              ]}
            />
          </Form>
        </div>
      </Modal>

      {/* MODAL PARA AGREGAR ITEMS DESDE OC */}
      <ModalAgregarItemsOC
        open={openItemsModal}
        close={() => setOpenItemsModal(false)}
        onSelectItems={(items) => setItemsNota([...itemsNota, ...items])}
        ordenesCompra={ordenesCompra}
        selectedOC={form.getFieldValue("orden_compra_id")}
        itemsExistentes={itemsNota}
      />

      {/* MODAL EDITAR ITEM */}
      <Modal
        title="Editar ítem"
        open={openEditModal}
        onCancel={() => {
          setOpenEditModal(false);
          setEditingItem(null);
        }}
        onOk={handleGuardarEdicion}
        okText="Guardar cambios"
        okButtonProps={{ disabled: readOnly }}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical">
          <Form.Item label="Almacén" name="almacen_id" rules={[{ required: true, message: "Seleccione un almacén" }]}>
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
            rules={[
              { required: true, message: "Ingrese la cantidad" },
              () => ({
                validator(_, value) {
                  if (value == null || value === "") return Promise.resolve();
                  const max = editingItem?.pendiente_max ?? editingItem?.pendiente ?? null;
                  if (max == null) return Promise.resolve();
                  if (Number(value) > Number(max)) {
                    return Promise.reject(new Error(`No puede exceder la cantidad pendiente (${max})`));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <InputNumber style={{ width: "100%" }} min={0.001} step={0.001} max={editingItem?.pendiente_max ?? editingItem?.pendiente} />
          </Form.Item>
          <Form.Item label="Comentario" name="comentario">
            <Input.TextArea rows={3} placeholder="Comentario del ítem (opcional)" />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL ITEM MANUAL */}
      <ModalAgregarItem
        open={openItemManual}
        onClose={() => setOpenItemManual(false)}
        onAddItem={(item) => setItemsNota((prev) => [...prev, item])}
        almacenes={almacenes}
      />

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
