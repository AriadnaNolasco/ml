import React from 'react';
import {
    Card,
    Descriptions,
    Tag,
    Row,
    Col,
    Divider,
    Spin
} from 'antd';
import {
    IdcardOutlined,
    ContactsOutlined,
    UserOutlined,
    EnvironmentOutlined
} from '@ant-design/icons';

const TransportistaDetalle = ({ transportista, loading = false }) => {

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!transportista) {
        return <div>No se encontraron datos del transportista</div>;
    }

    return (
        <Card>
            <Row gutter={24}>
                <Col xs={24} md={12}>
                    <Divider orientation="left" style={{ marginTop: 0 }}>
                        <IdcardOutlined style={{ marginRight: 8 }} />
                        Información Básica
                    </Divider>

                    <Descriptions column={1} bordered size="small">
                        <Descriptions.Item label="Código">
                            {transportista.codigo || 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Tipo Documento">
                            {transportista.tipo_documento_nombre || transportista.tipo_documento_codigo || 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Número Documento">
                            {transportista.nro_documento || 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Fecha Registro">
                            {transportista.fecha_registro ? new Date(transportista.fecha_registro).toLocaleDateString('es-PE') : 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Razón Social">
                            <strong>{transportista.razon_social || 'N/A'}</strong>
                        </Descriptions.Item>
                        <Descriptions.Item label="Nombre Comercial">
                            {transportista.nomb_comercial || 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Estado">
                            <Tag color={transportista.estado ? "green" : "red"}>
                                {transportista.estado ? 'Activo' : 'Inactivo'}
                            </Tag>
                        </Descriptions.Item>
                    </Descriptions>
                </Col>

                <Col xs={24} md={12}>
                    <Divider orientation="left">
                        <ContactsOutlined style={{ marginRight: 8 }} />
                        Información de Contacto
                    </Divider>

                    <Descriptions column={1} bordered size="small">
                        <Descriptions.Item label="País">
                            {transportista.pais_nombre || 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Dirección">
                            {transportista.direccion || 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Teléfono 1">
                            {transportista.telefono1 || 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Teléfono 2">
                            {transportista.telefono2 || 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Celular 1">
                            {transportista.celular1 || 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Celular 2">
                            {transportista.celular2 || 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Email">
                            {transportista.email || 'N/A'}
                        </Descriptions.Item>
                    </Descriptions>
                </Col>
            </Row>

            <Divider orientation="left" style={{ marginTop: 24 }}>
                <EnvironmentOutlined style={{ marginRight: 8 }} />
                Información de Auditoría
            </Divider>

            <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="Fecha Creación">
                    {transportista.created_at ? new Date(transportista.created_at).toLocaleString('es-PE') : 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Fecha Actualización">
                    {transportista.updated_at ? new Date(transportista.updated_at).toLocaleString('es-PE') : 'N/A'}
                </Descriptions.Item>
            </Descriptions>
        </Card>
    );
};

export default TransportistaDetalle;