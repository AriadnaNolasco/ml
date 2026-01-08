// frontend/src/pages/mantenimiento/components/CrearPlan.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Modal, Form, Input, Select, DatePicker, Button, message, InputNumber, Spin } from "antd";
import dayjs from "dayjs";

import {
  crearPlan,
  getEquiposForPlanificacion,
  getTecnicosForPlanificacion,
} from "../../../api/apiPlanificacion";

const { Option } = Select;

const CrearPlan = ({ visible, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [equipos, setEquipos] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [form] = Form.useForm();

  // ==========================
  // Cargar data para selects
  // ==========================
  const cargarOptions = async () => {
    setLoadingOptions(true);
    try {
      const [eqResp, tecResp] = await Promise.all([
        getEquiposForPlanificacion(),
        getTecnicosForPlanificacion(),
      ]);

      setEquipos(eqResp.data || []);
      setTecnicos(tecResp.data || []);
    } catch (err) {
      console.error("❌ Error cargando options:", err);
      message.error("No se pudo cargar equipos/técnicos");
    } finally {
      setLoadingOptions(false);
    }
  };

  useEffect(() => {
    if (visible) {
      cargarOptions();
      // valores por defecto
      form.setFieldsValue({
        estado: "ACTIVO",
        proxima_fecha: dayjs(), // opcional: hoy
      });
    } else {
      form.resetFields();
      setEquipos([]);
      setTecnicos([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Para armar payload de forma segura
  const equiposById = useMemo(() => {
    const map = new Map();
    equipos.forEach((e) => map.set(e.id, e));
    return map;
  }, [equipos]);

  const tecnicosById = useMemo(() => {
    const map = new Map();
    tecnicos.forEach((t) => map.set(t.id, t));
    return map;
  }, [tecnicos]);

  // ==========================
  // Submit
  // ==========================
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const equipo = equiposById.get(values.equipo_id);
      const tecnico = values.tecnico_id ? tecnicosById.get(values.tecnico_id) : null;

      if (!equipo) {
        return message.error("Selecciona un equipo válido.");
      }

      const payload = {
        equipo_id: equipo.id,
        // Ajusta nombre según lo que quieras guardar:
        // aquí guardo "marca modelo" + el código aparte
        equipo_nombre: `${equipo.marca || ""} ${equipo.modelo || ""}`.trim() || equipo.codigo_bpc,
        equipo_codigo: equipo.codigo_bpc || null,

        tecnico_id: tecnico?.id || null,
        tecnico_nombre: tecnico?.nombre_completo || null,

        frecuencia_valor: Number(values.frecuencia_valor),
        frecuencia_tipo: values.frecuencia_tipo,

        descripcion: values.descripcion,
        proxima_fecha: values.proxima_fecha.format("YYYY-MM-DD"),
        estado: values.estado,
      };

      console.log("📤 Enviando payload:", payload);

      setLoading(true);
      const resp = await crearPlan(payload);

      console.log("✅ Respuesta crearPlan:", resp.data);

      message.success("Plan creado correctamente");
      form.resetFields();
      onSuccess(); // cierra modal + recarga datos
    } catch (error) {
      console.error("❌ Error al crear plan:", error);

      if (error?.errorFields?.length) {
        // validación antd
        return;
      }

      if (error.response) {
        console.error("Respuesta backend:", error.response.data);
        message.error(error.response.data.error || "Error al crear el plan (backend)");
      } else {
        message.error("Error al crear el plan (frontend)");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Crear Plan de Mantenimiento Preventivo"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancelar
        </Button>,
        <Button
          key="ok"
          loading={loading}
          type="primary"
          onClick={handleSubmit}
          disabled={loadingOptions}
        >
          Crear Plan
        </Button>,
      ]}
    >
      {loadingOptions ? (
        <div style={{ padding: 20, textAlign: "center" }}>
          <Spin />
          <div style={{ marginTop: 10 }}>Cargando equipos y técnicos...</div>
        </div>
      ) : (
        <Form layout="vertical" form={form}>
          {/* ✅ EQUIPO: SELECT (NO INPUT) */}
          <Form.Item
            name="equipo_id"
            label="Equipo"
            rules={[{ required: true, message: "Selecciona un equipo" }]}
          >
            <Select
              placeholder="Seleccionar equipo"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children ?? "")
                  .toString()
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {equipos.map((e) => (
                <Option key={e.id} value={e.id}>
                  {e.codigo_bpc} - {e.marca} {e.modelo}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* ✅ TECNICO: SELECT */}
          <Form.Item name="tecnico_id" label="Técnico Responsable">
            <Select placeholder="Asignar técnico" allowClear showSearch optionFilterProp="children">
              {tecnicos.map((t) => (
                <Option key={t.id} value={t.id}>
                  {t.nombre_completo}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* ✅ FRECUENCIA: SOLO NÚMEROS */}
          <Form.Item
            name="frecuencia_valor"
            label="Frecuencia"
            rules={[{ required: true, message: "Ingresa la frecuencia" }]}
          >
            <InputNumber style={{ width: "100%" }} min={1} placeholder="Ej: 30" />
          </Form.Item>

          {/* ✅ TIPO FRECUENCIA: COMPLETO */}
          <Form.Item
            name="frecuencia_tipo"
            label="Tipo de Frecuencia"
            rules={[{ required: true, message: "Selecciona el tipo" }]}
          >
            <Select placeholder="Seleccionar">
              <Option value="DIAS">Días</Option>
              <Option value="SEMANAS">Semanas</Option>
              <Option value="MESES">Meses</Option>
              <Option value="HORAS">Horas</Option>
              <Option value="KILOMETROS">Kilómetros</Option>
            </Select>
          </Form.Item>

          {/* ✅ DESCRIPCIÓN */}
          <Form.Item
            name="descripcion"
            label="Descripción"
            rules={[{ required: true, message: "Ingresa la descripción" }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          {/* ✅ PRÓXIMA FECHA */}
          <Form.Item
            name="proxima_fecha"
            label="Próxima Fecha"
            rules={[{ required: true, message: "Selecciona la fecha" }]}
          >
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>

          {/* ✅ ESTADO INICIAL */}
          <Form.Item name="estado" label="Estado Inicial" initialValue="ACTIVO">
            <Select>
              <Option value="ACTIVO">Activo</Option>
              <Option value="INACTIVO">Inactivo</Option>
              <Option value="VENCIDO">Vencido</Option>
            </Select>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};

export default CrearPlan;
