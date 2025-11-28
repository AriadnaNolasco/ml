import React from 'react';
import { Descriptions, Tag, Spin, Card, Divider, Alert } from 'antd';
import { 
    UserOutlined, 
    InfoCircleOutlined,
    IdcardOutlined
} from '@ant-design/icons';

const ConsultaDniResult = ({ consulta }) => {
    if (!consulta) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                <Spin size="large" />
            </div>
        );
    }

    const { resultado } = consulta;

    return (
        <div>
            <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="DNI" span={1}>
                    <strong>{resultado.document_number}</strong>
                </Descriptions.Item>
                
                <Descriptions.Item label="Nombres" span={1}>
                    <strong style={{ fontSize: '16px' }}>{resultado.first_name}</strong>
                </Descriptions.Item>
                
                <Descriptions.Item label="Apellido Paterno">
                    <Tag color="blue">{resultado.first_last_name}</Tag>
                </Descriptions.Item>
                
                <Descriptions.Item label="Apellido Materno">
                    <Tag color="blue">{resultado.second_last_name}</Tag>
                </Descriptions.Item>

                <Descriptions.Item label="Nombre Completo">
                    <strong>{resultado.full_name}</strong>
                </Descriptions.Item>
            </Descriptions>

            <Alert
                message="Información de la consulta"
                description={`Consulta realizada el ${new Date(consulta.fecha_consulta).toLocaleString()}`}
                type="info"
                showIcon
                style={{ marginTop: 16 }}
            />

            <Divider orientation="left" style={{ marginTop: 20 }}>
                <InfoCircleOutlined /> Información Adicional
            </Divider>

            <Card size="small">
                <p><strong>Nota:</strong> Esta consulta utiliza la API de RENIEC a través de DECOLECTA.</p>
                <p>Los datos mostrados son los disponibles públicamente en los registros de RENIEC.</p>
            </Card>
        </div>
    );
};

export default ConsultaDniResult;