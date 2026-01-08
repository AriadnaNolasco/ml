import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, DatePicker, message, Space } from 'antd';
import { ToolOutlined, UserOutlined } from '@ant-design/icons';
import api from '../../../../api/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const ModalActividad = ({ open, onClose, onSubmit, loading }) => {
    const [form] = Form.useForm();
    const [tecnicos, setTecnicos] = useState([]);
    const [loadingTecnicos, setLoadingTecnicos] = useState(false);

    useEffect(() => {
        if (open) {
            loadTecnicos();
            form.resetFields();
            // Establecer fecha actual por defecto
            form.setFieldsValue({
                fecha_actividad: dayjs()
            });
        }
    }, [open, form]);

    const loadTecnicos = async () => {
        try {
            setLoadingTecnicos(true);
            const response = await api.get('/usuarios?rol=tecnico');
            setTecnicos(response.data.data || []);
        } catch (error) {
            console.error('Error cargando técnicos:', error);
            message.error('Error al cargar la lista de técnicos');
            setTecnicos([]);
        } finally {
            setLoadingTecnicos(false);
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            
            await onSubmit({
                tecnico_id: values.tecnico_id,
                fecha_actividad: values.fecha_actividad.format('YYYY-MM-DD'),
                tarea_realizada: values.tarea_realizada,
                duracion_horas: parseFloat(values.duracion_horas),
                observaciones: values.observaciones || ''
            });

            form.resetFields();
        } catch (error) {
            console.error('Error en validación:', error);
        }
    };

    return (
        <Modal
            title={
                <Space>
                    <ToolOutlined />
                    <span>Registrar Actividad</span>
                </Space>
            }
            open={open}
            onCancel={onClose}
            onOk={handleSubmit}
            confirmLoading={loading}
            okText="Registrar Actividad"
            cancelText="Cancelar"
            width={700}
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    duracion_horas: 1
                }}
            >
                {/* Técnico */}
                <Form.Item
                    name="tecnico_id"
                    label={
                        <Space>
                            <UserOutlined />
                            <span>Técnico</span>
                        </Space>
                    }
                    rules={[{ required: true, message: 'Debe seleccionar un técnico' }]}
                >
                    <Select
                        placeholder="Seleccionar técnico..."
                        size="large"
                        showSearch
                        loading={loadingTecnicos}
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                        }
                    >
                        {tecnicos.map(tecnico => (
                            <Option key={tecnico.id} value={tecnico.id}>
                                {tecnico.nombre_completo} - {tecnico.area_nombre}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                {/* Fecha y Duración */}
                <Space style={{ width: '100%' }} size="large">
                    <Form.Item
                        name="fecha_actividad"
                        label="Fecha"
                        rules={[{ required: true, message: 'Ingrese la fecha' }]}
                        style={{ flex: 1 }}
                    >
                        <DatePicker
                            style={{ width: '100%' }}
                            size="large"
                            format="DD/MM/YYYY"
                            placeholder="Seleccionar fecha"
                        />
                    </Form.Item>

                    <Form.Item
                        name="duracion_horas"
                        label="Duración (horas)"
                        rules={[
                            { required: true, message: 'Ingrese duración' },
                            { type: 'number', min: 0.1, message: 'Debe ser mayor a 0' }
                        ]}
                        style={{ flex: 1 }}
                    >
                        <InputNumber
                            placeholder="Ej: 2.5"
                            style={{ width: '100%' }}
                            size="large"
                            min={0.1}
                            step={0.5}
                            precision={2}
                            suffix="hrs"
                        />
                    </Form.Item>
                </Space>

                {/* Tarea Realizada */}
                <Form.Item
                    name="tarea_realizada"
                    label="Tarea Realizada"
                    rules={[{ required: true, message: 'Describa la tarea realizada' }]}
                >
                    <TextArea
                        rows={4}
                        placeholder="Descripción detallada de la tarea realizada..."
                        showCount
                        maxLength={500}
                    />
                </Form.Item>

                {/* Observaciones */}
                <Form.Item
                    name="observaciones"
                    label="Observaciones (Opcional)"
                >
                    <TextArea
                        rows={3}
                        placeholder="Observaciones adicionales, hallazgos, recomendaciones..."
                        showCount
                        maxLength={300}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ModalActividad;