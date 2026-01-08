import { useEffect, useMemo, useState } from "react";
import { Badge, Descriptions, Modal, Table, Tag, Typography } from "antd";
import api from "../../../api/api";

const { Text } = Typography;

const ESTADO_COLOR = {
  BORRADOR: "orange",
  CONFIRMADO: "green",
  ANULADO: "red",
};

const renderEstado = (estado) => {
  if (!estado) return null;
  return (
    <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
      <Badge color={ESTADO_COLOR[estado] || "default"} />
      <Tag color={ESTADO_COLOR[estado] || "default"} style={{ margin: 0 }}>
        {estado}
      </Tag>
    </span>
  );
};

export default function NotasDetalle({ open, onClose, notaId }) {
  const [loading, setLoading] = useState(false);
  const [cabecera, setCabecera] = useState(null);
  const [detalle, setDetalle] = useState([]);

  useEffect(() => {
    const fetchNotaDetalle = async () => {
      if (!open || !notaId) return;

      try {
        setLoading(true);
        const resp = await api.get(`/almacen/notas/${notaId}`);
        setCabecera(resp.data.cabecera || null);
        setDetalle(resp.data.detalle || []);
      } catch (error) {
        console.error("Error obteniendo detalle de nota:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotaDetalle();
  }, [open, notaId]);

  const handleClose = () => {
    setCabecera(null);
    setDetalle([]);
    onClose && onClose();
  };

  const columnsDetalle = useMemo(
    () => [
      { title: "Ítem", dataIndex: "numitem", key: "numitem", width: 70 },
      { title: "Código", dataIndex: "codigo", key: "codigo", width: 130 },
      { title: "Descripción", dataIndex: "descripcion", key: "descripcion" },
      { title: "UM", dataIndex: "unidad_medida", key: "unidad_medida", width: 90 },
      { title: "Almacén", dataIndex: "almacen_nombre", key: "almacen_nombre", width: 220 },
      {
        title: "Cantidad",
        dataIndex: "cantidad",
        key: "cantidad",
        align: "right",
        width: 120,
        render: (value) =>
          value != null
            ? Number(value).toLocaleString("es-PE", { minimumFractionDigits: 3, maximumFractionDigits: 3 })
            : "",
      },
      { title: "Lote", dataIndex: "lote", key: "lote", width: 120, render: (v) => v || "-" },
      { title: "Serie", dataIndex: "serie_producto", key: "serie_producto", width: 160, render: (v) => v || "-" },
      {
        title: "Fec. Venc.",
        dataIndex: "fecha_vencimiento",
        key: "fecha_vencimiento",
        width: 120,
        render: (val) => (val ? new Date(val).toLocaleDateString("es-PE") : "-"),
      },
      { title: "Comentario", dataIndex: "comentario", key: "comentario", render: (v) => v || "-" },
    ],
    []
  );

  const docCode = (cabecera?.documento_codigo || "").trim();
  const tituloModal = cabecera ? `Detalle ${docCode} - ${cabecera.numero}` : "Detalle de Nota";

  const docComercial =
    cabecera?.tipo_documento_id || cabecera?.serie || cabecera?.numero_documento
      ? `${cabecera?.tipo_documento_id ?? ""}${cabecera?.serie ? ` - ${cabecera.serie}` : ""}${
          cabecera?.numero_documento ? ` ${cabecera.numero_documento}` : ""
        }`
      : "-";

  return (
    <Modal
      title={tituloModal}
      open={open}
      onCancel={handleClose}
      footer={null}
      width={1050}
      destroyOnClose
      confirmLoading={loading}
    >
      <div
        style={{
          background: "#fafafa",
          borderRadius: 12,
          padding: 14,
        }}
      >
        <Descriptions
          bordered
          size="small"
          column={{ xs: 1, sm: 2, md: 3 }}
          style={{ marginBottom: 14, background: "#fff", borderRadius: 12, overflow: "hidden" }}
        >
          <Descriptions.Item label="Documento">
            {cabecera ? `${docCode} - ${cabecera.documento_nombre}` : ""}
          </Descriptions.Item>

          <Descriptions.Item label="Número">{cabecera?.numero}</Descriptions.Item>

          <Descriptions.Item label="Estado">{renderEstado(cabecera?.estado)}</Descriptions.Item>

          <Descriptions.Item label="Operación">{cabecera?.operacion_nombre || "-"}</Descriptions.Item>

          <Descriptions.Item label="Origen">{cabecera?.origen || "-"}</Descriptions.Item>

          <Descriptions.Item label="Fecha Nota">
            {cabecera?.fecha_nota ? new Date(cabecera.fecha_nota).toLocaleString("es-PE") : "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Almacén Salida">{cabecera?.almacen_salida_nombre || "-"}</Descriptions.Item>

          <Descriptions.Item label="Almacén Destino">{cabecera?.almacen_destino_nombre || "-"}</Descriptions.Item>

          <Descriptions.Item label="Cliente">{cabecera?.cliente_nombre || "-"}</Descriptions.Item>

          <Descriptions.Item label="Proveedor">{cabecera?.proveedor_nombre || "-"}</Descriptions.Item>

          <Descriptions.Item label="Doc. Comercial">{docComercial}</Descriptions.Item>

          <Descriptions.Item label="Guía">{cabecera?.numero_guia || "-"}</Descriptions.Item>

          <Descriptions.Item label="Observaciones" span={3}>
            <Text>{cabecera?.observaciones || "-"}</Text>
          </Descriptions.Item>
        </Descriptions>

        <Table
          dataSource={detalle}
          rowKey="id"
          size="small"
          loading={loading}
          columns={columnsDetalle}
          pagination={false}
          style={{ background: "#fff", borderRadius: 12, overflow: "hidden" }}
        />
      </div>
    </Modal>
  );
}
