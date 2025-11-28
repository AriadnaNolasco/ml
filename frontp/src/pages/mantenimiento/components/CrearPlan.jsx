// src/pages/mantenimiento/components/CrearPlan.jsx
import React from "react";
import { Modal, Form, Input, DatePicker, Button, Select, InputNumber, message } from "antd";
import { crearPlan } from "../../../api/apiPlanificacion";

const { Option } = Select;

const CrearPlan = ({ visible, onClose, onSuccess }) => {
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    try {
      const payload = {
        equipo_nombre: values.equipo_nombre,
        equipo_codigo: values.equipo_codigo,
        tecnico_nombre: values.tecnico_nombre,
        frecuencia_valor: values.frecuencia_valor,
        frecuencia_tipo: values.frecuencia_tipo,
        descripcion: values.descripcion,
        proxima_fecha: values.proxima_fecha.format("YYYY-MM-DD"),
        estado: "ACTIVO"
      };

      await crearPlan(payload);

      message.success("Plan creado correctamente");
      form.resetFields();
      onSuccess();
    } catch (error) {
      console.error(error);
      message.error("Error al crear plan");
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      title="Crear Plan Preventivo"
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item name="equipo_nombre" label="Equipo" rules={[{ required: true }]}>
          <Input placeholder="Ej: Torno hidráulico" />
        </Form.Item>

        <Form.Item name="equipo_codigo" label="Código">
          <Input placeholder="Código opcional del equipo" />
        </Form.Item>

        <Form.Item name="tecnico_nombre" label="Técnico Responsable">
          <Input placeholder="Nombre del técnico" />
        </Form.Item>

        <Form.Item name="frecuencia_valor" label="Frecuencia" rules={[{ required: true }]}>
          <InputNumber min={1} style={{ width: "100%" }} placeholder="Ej: 30" />
        </Form.Item>

        <Form.Item name="frecuencia_tipo" label="Tipo de Frecuencia" rules={[{ required: true }]}>
          <Select placeholder="Seleccionar">
            <Option value="DIAS">Dias</Option>
            <Option value="SEMANAS">Semanas</Option>
            <Option value="MESES">Meses</Option>
          </Select>
        </Form.Item>

        <Form.Item name="descripcion" label="Descripción" rules={[{ required: true }]}>
          <Input.TextArea rows={3} placeholder="Detalle actividades preventivas..." />
        </Form.Item>

        <Form.Item name="proxima_fecha" label="Próxima Fecha" rules={[{ required: true }]}>
          <DatePicker format="YYYY-MM-DD" style={{ width: "100%" }} />
        </Form.Item>

        <Button type="primary" htmlType="submit" block>
          Crear Plan
        </Button>
      </Form>
    </Modal>
  );
};

export default CrearPlan;
