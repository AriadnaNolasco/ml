import React, { useState } from 'react';
import { Modal, Form, Input, message } from 'antd';
import { UserAddOutlined } from '@ant-design/icons';
import { createTecnico } from '../../../../api/apiOrdenesMantenimiento';

const ModalAgregarTecnico = ({ open, onClose, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            await createTecnico(values);

            message.success('✅ Técnico agregado exitosamente');
            form.resetFields();
            onSuccess(); // Recargar lista de técnicos
            onClose();
        } catch (error) {
            console.error('Error agregando técnico:', error);
            if (error.response?.data?.message) {
                message.error(error.response.data.message);
            } else {
                message.error('Error al agregar técnico');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        onClose();
    };

    return (
        <Modal
            title={
                <span>
                    <UserAddOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                    Agregar Nuevo Técnico
                </span>
            }
            open={open}
            onCancel={handleCancel}
            onOk={handleSubmit}
            confirmLoading={loading}
            okText="Agregar Técnico"
            cancelText="Cancelar"
            width={600}
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                style={{ marginTop: 20 }}
            >
                <Form.Item
                    name="nombre_completo"
                    label="Nombre Completo"
                    rules={[
                        { required: true, message: 'El nombre es requerido' },
                        { min: 3, message: 'Mínimo 3 caracteres' },
                        { max: 150, message: 'Máximo 150 caracteres' }
                    ]}
                >
                    <Input 
                        placeholder="Ej: Carlos Rodríguez Pérez"
                        size="large"
                    />
                </Form.Item>

                <Form.Item
                    name="especialidad"
                    label="Especialidad"
                    rules={[
                        { required: true, message: 'La especialidad es requerida' },
                        { max: 100, message: 'Máximo 100 caracteres' }
                    ]}
                >
                    <Input 
                        placeholder="Ej: Electrónica Industrial, Mecánica de Precisión, Sistemas"
                        size="large"
                    />
                </Form.Item>

                <Form.Item
                    name="telefono"
                    label="Teléfono (Opcional)"
                    rules={[
                        { pattern: /^[0-9]{9}$/, message: 'Debe ser un número de 9 dígitos' }
                    ]}
                >
                    <Input 
                        placeholder="Ej: 987654321"
                        size="large"
                        maxLength={9}
                    />
                </Form.Item>

                <Form.Item
                    name="email"
                    label="Email (Opcional)"
                    rules={[
                        { type: 'email', message: 'Email inválido' }
                    ]}
                >
                    <Input 
                        placeholder="Ej: tecnico@empresa.com"
                        size="large"
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ModalAgregarTecnico;