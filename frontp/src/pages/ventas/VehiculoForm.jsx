import React, { useEffect, useState } from 'react';
import { Form, Input, Select, Button, Space, Spin, message, Switch, Row, Col, InputNumber } from 'antd';
import { CarOutlined } from '@ant-design/icons';
import api from '../../api/api';

const { Option } = Select;

const VehiculoForm = ({ editingVehiculo, datosFormulario, loadingFormData, onSuccess, onCancel }) => {
    const [form] = Form.useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (editingVehiculo) {
            form.setFieldsValue({
                placa: editingVehiculo.placa,
                marca: editingVehiculo.marca,
                modelo: editingVehiculo.modelo,
                anio_fabricacion: editingVehiculo.anio_fabricacion,
                combustible: editingVehiculo.combustible,
                carroceria: editingVehiculo.carroceria,
                tipo_transmision: editingVehiculo.tipo_transmision,
                estado: editingVehiculo.estado
            });
        } else {
            form.resetFields();
            form.setFieldsValue({
                estado: true
            });
        }
    }, [editingVehiculo, form]);

    const handleSubmit = async (values) => {
        setIsSubmitting(true);
        try {
            if (editingVehiculo) {
                await api.put(`/ventas/vehiculos/${editingVehiculo.placa}`, values);
                message.success('Vehículo actualizado correctamente');
            } else {
                await api.post('/ventas/vehiculos', values);
                message.success('Vehículo creado correctamente');
            }

            onSuccess();
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Error al guardar el vehículo';
            message.error(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item
                        label="Placa"
                        name="placa"
                        rules={[
                            { required: true, message: 'Por favor ingrese la placa' },
                            { max: 10, message: 'La placa no puede exceder los 10 caracteres' },
                            { pattern: /^[A-Z0-9-]+$/, message: 'La placa solo puede contener letras mayúsculas, números y guiones' }
                        ]}
                    >
                        <Input
                            placeholder="Ej: ABC-123"
                            disabled={!!editingVehiculo}
                            maxLength={10}
                            style={{ textTransform: 'uppercase' }}
                            onChange={(e) => {
                                const value = e.target.value.toUpperCase();
                                form.setFieldsValue({ placa: value });
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Marca"
                        name="marca"
                        rules={[
                            { required: true, message: 'Por favor ingrese la marca' },
                            { max: 50, message: 'La marca no puede exceder los 50 caracteres' }
                        ]}
                    >
                        <Input
                            placeholder="Ej: Toyota, Volvo, Mercedes-Benz"
                            maxLength={50}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Modelo"
                        name="modelo"
                        rules={[
                            { required: true, message: 'Por favor ingrese el modelo' },
                            { max: 50, message: 'El modelo no puede exceder los 50 caracteres' }
                        ]}
                    >
                        <Input
                            placeholder="Ej: Hilux, FH, Actros"
                            maxLength={50}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Año de Fabricación"
                        name="anio_fabricacion"
                        rules={[
                            { required: true, message: 'Por favor ingrese el año de fabricación' },
                            {
                                type: 'number',
                                min: 1900,
                                max: new Date().getFullYear() + 1,
                                message: `El año debe estar entre 1900 y ${new Date().getFullYear() + 1}`
                            }
                        ]}
                    >
                        <InputNumber
                            placeholder="Ej: 2020"
                            style={{ width: '100%' }}
                            min={1900}
                            max={new Date().getFullYear() + 1}
                        />
                    </Form.Item>
                </Col>

                <Col span={12}>
                    <Form.Item
                        label="Combustible"
                        name="combustible"
                        rules={[{ required: true, message: 'Por favor seleccione el tipo de combustible' }]}
                    >
                        <Select
                            placeholder="Seleccione tipo de combustible"
                            loading={loadingFormData}
                            notFoundContent={loadingFormData ? <Spin size="small" /> : "No hay opciones disponibles"}
                        >
                            {datosFormulario?.combustibles?.map(combustible => (
                                <Option key={combustible} value={combustible}>
                                    {combustible}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Carrocería"
                        name="carroceria"
                        rules={[{ required: true, message: 'Por favor seleccione el tipo de carrocería' }]}
                    >
                        <Select
                            placeholder="Seleccione tipo de carrocería"
                            loading={loadingFormData}
                            notFoundContent={loadingFormData ? <Spin size="small" /> : "No hay opciones disponibles"}
                        >
                            {datosFormulario?.carrocerias?.map(carroceria => (
                                <Option key={carroceria} value={carroceria}>
                                    {carroceria}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Tipo de Transmisión"
                        name="tipo_transmision"
                        rules={[{ required: true, message: 'Por favor seleccione el tipo de transmisión' }]}
                    >
                        <Select
                            placeholder="Seleccione tipo de transmisión"
                            loading={loadingFormData}
                            notFoundContent={loadingFormData ? <Spin size="small" /> : "No hay opciones disponibles"}
                        >
                            {datosFormulario?.transmisiones?.map(transmision => (
                                <Option key={transmision} value={transmision}>
                                    {transmision}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Estado"
                        name="estado"
                        valuePropName="checked"
                        rules={[{ required: true, message: 'Por favor defina el estado' }]}
                    >
                        <Switch checkedChildren="Activo" unCheckedChildren="Inactivo" />
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Space>
                    <Button onClick={onCancel} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={isSubmitting}
                        icon={<CarOutlined />}
                    >
                        {editingVehiculo ? 'Actualizar' : 'Crear'}
                    </Button>
                </Space>
            </Form.Item>
        </Form>
    );
};

export default VehiculoForm;