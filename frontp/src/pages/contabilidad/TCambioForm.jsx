import React, { useEffect, useState } from 'react';
import { Form, InputNumber, DatePicker, Select, Button, Row, Col, message } from 'antd';
import api from '../../api/api'; 
import moment from 'moment';

const { Option } = Select;

const TCambioForm = ({ tipoCambio = null, onSave, onCancel }) => {
  const [form] = Form.useForm();
  const [monedas, setMonedas] = useState([]);

  useEffect(() => {
    // cargar monedas para select
    async function fetchMonedas() {
        try {
        const res = await api.get('/contabilidad/monedas');
        const monedasData = Array.isArray(res.data.data) ? res.data.data : [];
        setMonedas(monedasData);
        
        // Si no estamos editando, preseleccionar Dólar -> Soles
        if (!tipoCambio) {
            const dolar = monedasData.find(m => m.codigo === 'USD');
            const sol = monedasData.find(m => m.codigo === 'PEN');
            
            if (dolar && sol) {
            form.setFieldsValue({
                moneda_origen_id: dolar.id,
                moneda_destino_id: sol.id
            });
            }
        }
        } catch (error) {
        message.error('Error cargando monedas');
        }
    }
    fetchMonedas();
  }, []);

  useEffect(() => {
    if (tipoCambio) {
      form.setFieldsValue({
        ...tipoCambio,
        fecha: tipoCambio.fecha ? moment(tipoCambio.fecha) : null,
      });
    } else {
      form.resetFields();
    }
  }, [tipoCambio, form]);

  const onFinish = async (values) => {
    try {
      const payload = {
        ...values,
        fecha: values.fecha.format('YYYY-MM-DD'),
      };
      if (tipoCambio) {
        await api.put(`/contabilidad/tipo-cambio/${tipoCambio.id}`, payload);
        message.success('Tipo de cambio actualizado');
      } else {
        await api.post('/contabilidad/tipo-cambio', payload);
        message.success('Tipo de cambio creado');
      }
      onSave();
      form.resetFields();
    } catch (error) {
      message.error('Error guardando tipo de cambio');
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="fecha"
            label="Fecha"
            rules={[{ required: true, message: 'Selecciona la fecha' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="moneda_origen_id"
            label="Moneda Origen"
            rules={[{ required: true, message: 'Selecciona moneda origen' }]}
          >
            <Select placeholder="Seleccione moneda">
              {monedas.map((m) => (
                <Option key={m.id} value={m.id}>
                    {m.codigo} - {m.nombre}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="moneda_destino_id"
            label="Moneda Destino"
            rules={[{ required: true, message: 'Selecciona moneda destino' }]}
          >
            <Select placeholder="Seleccione moneda">
              {monedas.map((m) => (
                <Option key={m.id} value={m.id}>
                    {m.codigo} - {m.nombre}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="compra"
            label="Tipo Compra (SUNAT)"
            rules={[{ required: true, message: 'Ingresa valor de compra' }]}
          >
            <InputNumber min={0} step={0.0001} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="venta"
            label="Tipo Venta (SUNAT)"
            rules={[{ required: true, message: 'Ingresa valor de venta' }]}
          >
            <InputNumber min={0} step={0.0001} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item style={{ textAlign: 'right' }}>
        <Button onClick={onCancel} style={{ marginRight: 8 }}>
          Cancelar
        </Button>
        <Button type="primary" htmlType="submit">
          {tipoCambio ? 'Actualizar' : 'Crear'}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default TCambioForm;
