import React, { useState } from 'react';
import { Form, Input, Switch, Button, Row, Col, Spin, message } from 'antd';
import api from '../../api/api';

const VendedorForm = ({ 
  user, 
  editingVendedor, 
  onSuccess, 
  onCancel 
}) => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Setear valores iniciales si estamos editando
  React.useEffect(() => {
    if (editingVendedor) {
      form.setFieldsValue({
        codigo: editingVendedor.codigo,
        nombre: editingVendedor.nombre,
        siglas: editingVendedor.siglas,
        con_contado: editingVendedor.con_contado,
        con_credito: editingVendedor.con_credito,
        con_cobranza: editingVendedor.con_cobranza,
        estado: editingVendedor.estado
      });
    }
  }, [editingVendedor, form]);

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      const formattedValues = {
        ...values,
        siglas: values.siglas || null,
        con_contado: values.con_contado || false,
        con_credito: values.con_credito || false,
        con_cobranza: values.con_cobranza || false
      };

      if (editingVendedor) {
        await api.put(`/ventas/vendedores/${editingVendedor.codigo}`, formattedValues);
        message.success('Vendedor actualizado correctamente');
      } else {
        await api.post('/ventas/vendedores', formattedValues);
        message.success('Vendedor creado correctamente');
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error al guardar vendedor:', error);
      const errorMsg = error.response?.data?.error || 'Error al guardar el vendedor';
      message.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        con_contado: false,
        con_credito: false,
        con_cobranza: false,
        estado: true
      }}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="codigo"
            label="Código"
            rules={[
              { required: true, message: 'Por favor ingrese el código' },
              { max: 20, message: 'El código no puede exceder los 20 caracteres' }
            ]}
          >
            <Input placeholder="Código del vendedor" />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name="siglas"
            label="Siglas"
            rules={[{ max: 10, message: 'Las siglas no pueden exceder los 10 caracteres' }]}
          >
            <Input placeholder="Siglas (opcional)" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="nombre"
        label="Nombre Completo"
        rules={[
          { required: true, message: 'Por favor ingrese el nombre' },
          { max: 100, message: 'El nombre no puede exceder los 100 caracteres' }
        ]}
      >
        <Input placeholder="Nombre completo del vendedor" />
      </Form.Item>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="con_contado"
            label="Maneja Contado"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item
            name="con_credito"
            label="Maneja Crédito"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item
            name="con_cobranza"
            label="Maneja Cobranza"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="estado"
        label="Estado"
        valuePropName="checked"
      >
        <Switch checkedChildren="Activo" unCheckedChildren="Inactivo" />
      </Form.Item>

      <div style={{ textAlign: 'right', marginTop: '16px' }}>
        <Button onClick={onCancel} style={{ marginRight: '8px' }}>
          Cancelar
        </Button>
        <Button type="primary" htmlType="submit" loading={isSubmitting}>
          {editingVendedor ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </Form>
  );
};

export default VendedorForm;