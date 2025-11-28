import React from 'react';
import { Form, Input, Button, Space, message, Card, Alert } from 'antd';
import { SearchOutlined, InfoCircleOutlined } from '@ant-design/icons';

const ConsultaRucForm = ({ onConsultar, onCancel, loading }) => {
    const [form] = Form.useForm();

    const handleSubmit = async (values) => {
        if (values.numero_ruc.length !== 11) {
            message.error('El RUC debe tener exactamente 11 dígitos');
            return;
        }

        if (!/^\d+$/.test(values.numero_ruc)) {
            message.error('El RUC debe contener solo números');
            return;
        }

        onConsultar(values);
    };

    return (
        <div>
            <Alert
                message="Información importante"
                description="Esta consulta utiliza la API de SUNAT a través de DECOLECTA. Asegúrese de tener créditos disponibles."
                type="info"
                showIcon
                icon={<InfoCircleOutlined />}
                style={{ marginBottom: 16 }}
            />

            <Card size="small" style={{ marginBottom: 16 }}>
                <p><strong>Formato RUC:</strong> 11 dígitos numéricos</p>
                <p><strong>Ejemplos:</strong> 20100070970, 20601030013</p>
            </Card>

            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
            >
                <Form.Item
                    label="Número de RUC"
                    name="numero_ruc"
                    rules={[
                        { required: true, message: 'Por favor ingrese el número de RUC' },
                        { len: 11, message: 'El RUC debe tener exactamente 11 dígitos' },
                        { pattern: /^\d+$/, message: 'El RUC debe contener solo números' }
                    ]}
                >
                    <Input
                        placeholder="Ingrese los 11 dígitos del RUC"
                        maxLength={11}
                        disabled={loading}
                        size="large"
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
                            {loading ? 'Consultando...' : 'Consultar RUC'}
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </div>
    );
};

export default ConsultaRucForm;