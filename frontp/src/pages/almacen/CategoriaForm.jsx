import React, { useEffect } from "react";
import { Form, Input, Select, Button, Space, Spin, message } from "antd";
import api from "../../api/api";

const { Option } = Select;

const CategoriaForm = ({
  editingCategoria,
  tiposExistencia,
  onSuccess,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  useEffect(() => {
    if (editingCategoria) {
      form.setFieldsValue({
        codigo: editingCategoria.codigo,
        nombre: editingCategoria.nombre,
        siglas: editingCategoria.siglas,
        id_exist: editingCategoria.id_exist,
        ind_venta: editingCategoria.ind_venta,
        ind_critico: editingCategoria.ind_critico,
        ind_importacion: editingCategoria.ind_importacion,
        ind_almac_x_compra: editingCategoria.ind_almac_x_compra,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        ind_venta: "NO VENDIBLE",
        ind_critico: "NO CRITICO",
        ind_importacion: "NO SE IMPORTA",
        ind_almac_x_compra: "NO ING. ALMACEN",
      });
    }
  }, [editingCategoria, form]);

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      if (editingCategoria) {
        await api.put(`/almacen/categorias/${editingCategoria.codigo}`, values);
        message.success("Categoría actualizada correctamente");
      } else {
        await api.post("/almacen/categorias", values);
        message.success("Categoría creada correctamente");
      }

      onSuccess();
    } catch (error) {
      message.error(
        error.response?.data?.error || "Error al guardar la categoría"
      );
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form form={form} layout='vertical' onFinish={handleSubmit}>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}
      >
        <Form.Item
          name='codigo'
          label='Código'
          rules={[
            { required: true, message: "El código es requerido" },
            { max: 2, message: "El código no puede exceder los 2 caracteres" },
          ]}
        >
          <Input
            placeholder='Ej: T, M, S, etc.'
            maxLength={2}
            disabled={!!editingCategoria}
            style={{ textTransform: "uppercase" }}
            onChange={(e) => {
              e.target.value = e.target.value.toUpperCase();
            }}
          />
        </Form.Item>

        <Form.Item
          name='siglas'
          label='Siglas'
          rules={[
            {
              max: 6,
              message: "Las siglas no pueden exceder los 6 caracteres",
            },
          ]}
        >
          <Input
            maxLength={6}
            placeholder='Abreviatura'
            style={{ textTransform: "uppercase" }}
            onChange={(e) => {
              e.target.value = e.target.value.toUpperCase();
            }}
          />
        </Form.Item>
      </div>

      <Form.Item
        name='nombre'
        label='Nombre'
        rules={[
          { required: true, message: "El nombre es requerido" },
          { max: 35, message: "El nombre no puede exceder los 35 caracteres" },
        ]}
      >
        <Input placeholder='Nombre de la categoría' maxLength={35} />
      </Form.Item>

      <Form.Item name='id_exist' label='Tipo de Existencia'>
        <Select
          placeholder='Seleccionar tipo de existencia'
          allowClear
          showSearch
          optionFilterProp='children'
        >
          {tiposExistencia.map((tipo) => (
            <Option key={tipo.id_exist} value={tipo.id_exist}>
              [{tipo.codigo}] {tipo.nombre}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}
      >
        <Form.Item
          name='ind_venta'
          label='Indicador Venta'
          rules={[{ required: true, message: "Este campo es requerido" }]}
        >
          <Select>
            <Option value='NO VENDIBLE'>NO VENDIBLE</Option>
            <Option value='SE VENDE'>SE VENDE</Option>
            <Option value='SERVICIOS'>SERVICIOS</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name='ind_critico'
          label='Indicador Crítico'
          rules={[{ required: true, message: "Este campo es requerido" }]}
        >
          <Select>
            <Option value='NO CRITICO'>NO CRITICO</Option>
            <Option value='CRITICO'>CRITICO</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name='ind_importacion'
          label='Indicador Importación'
          rules={[{ required: true, message: "Este campo es requerido" }]}
        >
          <Select>
            <Option value='NO SE IMPORTA'>NO SE IMPORTA</Option>
            <Option value='SE IMPORTA'>SE IMPORTA</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name='ind_almac_x_compra'
          label='Indicador Almacén por Compra'
          rules={[{ required: true, message: "Este campo es requerido" }]}
        >
          <Select>
            <Option value='NO ING. ALMACEN'>NO ING. ALMACEN</Option>
            <Option value='SI ING. ALMACEN'>SI ING. ALMACEN</Option>
          </Select>
        </Form.Item>
      </div>

      <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
        <Space>
          <Button onClick={onCancel}>Cancelar</Button>
          <Button type='primary' htmlType='submit' loading={isSubmitting}>
            {editingCategoria ? "Actualizar" : "Crear"}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default CategoriaForm;
