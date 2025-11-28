import React from 'react';
import { Form, Input, Button, Space, message, Card, Alert } from 'antd';
import { SearchOutlined, InfoCircleOutlined, UserOutlined } from '@ant-design/icons';

const ConsultaDniForm = ({ onConsultar, onCancel, loading }) => {
    const [form] = Form.useForm();

    const handleSubmit = async (values) => {
        if (values.numero_dni.length !== 8) {
            message.error('El DNI debe tener exactamente 8 dígitos');
            return;
        }

        if (!/^\d+$/.test(values.numero_dni)) {
            message.error('El DNI debe contener solo números');
            return;
        }

        onConsultar(values);
    };

    return (
        <div>
            <Alert
                message="Información importante"
                description="Esta consulta utiliza la API de RENIEC a través de DECOLECTA. Asegúrese de tener créditos disponibles."
                type="info"
                showIcon
                icon={<InfoCircleOutlined />}
                style={{ marginBottom: 16 }}
            />

            <Card size="small" style={{ marginBottom: 16 }}>
                <p><strong>Formato DNI:</strong> 8 dígitos numéricos</p>
                <p><strong>Ejemplos:</strong> 46027897, 12345678</p>
            </Card>

            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
            >
                <Form.Item
                    label="Número de DNI"
                    name="numero_dni"
                    rules={[
                        { required: true, message: 'Por favor ingrese el número de DNI' },
                        { len: 8, message: 'El DNI debe tener exactamente 8 dígitos' },
                        { pattern: /^\d+$/, message: 'El DNI debe contener solo números' }
                    ]}
                >
                    <Input
                        placeholder="Ingrese los 8 dígitos del DNI"
                        maxLength={8}
                        disabled={loading}
                        size="large"
                        prefix={<UserOutlined />}
                    />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                    <Space>
                        <Button onClick={onCancel} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button 
                            type="primary" 
                            htmlType="submit" 
                            loading={loading}
                            icon={<SearchOutlined />}
                            size="large"
                        >
                            {loading ? 'Consultando...' : 'Consultar DNI'}
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </div>
    );
};

export default ConsultaDniForm;