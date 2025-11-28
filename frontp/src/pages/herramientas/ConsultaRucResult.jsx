import React from 'react';
import { Descriptions, Tag, Spin, Card, Divider, Alert } from 'antd';
import { 
    ShopOutlined, 
    EnvironmentOutlined, 
    InfoCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined
} from '@ant-design/icons';

const ConsultaRucResult = ({ consulta }) => {
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
                <Descriptions.Item label="RUC" span={1}>
                    <strong>{resultado.numero_documento}</strong>
                </Descriptions.Item>
                
                <Descriptions.Item label="Razón Social" span={1}>
                    <strong style={{ fontSize: '16px' }}>{resultado.razon_social}</strong>
                </Descriptions.Item>
                
                <Descriptions.Item label="Estado">
                    <Tag 
                        color={resultado.estado === 'ACTIVO' ? 'green' : 'red'} 
                        icon={resultado.estado === 'ACTIVO' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                    >
                        {resultado.estado}
                    </Tag>
                </Descriptions.Item>
                
                <Descriptions.Item label="Condición">
                    <Tag color={resultado.condicion === 'HABIDO' ? 'blue' : 'orange'}>
                        {resultado.condicion}
                    </Tag>
                </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" style={{ marginTop: 20 }}>
                <EnvironmentOutlined /> Dirección
            </Divider>

            <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Dirección Completa">
                    {resultado.direccion}
                </Descriptions.Item>
                
                <Descriptions.Item label="Distrito">{resultado.distrito}</Descriptions.Item>
                <Descriptions.Item label="Provincia">{resultado.provincia}</Descriptions.Item>
                <Descriptions.Item label="Departamento">{resultado.departamento}</Descriptions.Item>
                <Descriptions.Item label="Ubigeo">{resultado.ubigeo}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" style={{ marginTop: 20 }}>
                <InfoCircleOutlined /> Información Adicional
            </Divider>

            <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Tipo de Empresa">
                    {resultado.tipo}
                </Descriptions.Item>
                
                <Descriptions.Item label="Actividad Económica">
                    {resultado.actividad_economica}
                </Descriptions.Item>
                
                <Descriptions.Item label="N° de Trabajadores">
                    {resultado.numero_trabajadores}
                </Descriptions.Item>
                
                <Descriptions.Item label="Agente de Retención">
                    <Tag color={resultado.es_agente_retencion ? 'green' : 'default'}>
                        {resultado.es_agente_retencion ? 'Sí' : 'No'}
                    </Tag>
                </Descriptions.Item>
                
                <Descriptions.Item label="Buen Contribuyente">
                    <Tag color={resultado.es_buen_contribuyente ? 'green' : 'default'}>
                        {resultado.es_buen_contribuyente ? 'Sí' : 'No'}
                    </Tag>
                </Descriptions.Item>
            </Descriptions>

            <Alert
                message="Información de la consulta"
                description={`Consulta realizada el ${new Date(consulta.fecha_consulta).toLocaleString()}`}
                type="info"
                showIcon
                style={{ marginTop: 16 }}
            />
        </div>
    );
};

export default ConsultaRucResult;