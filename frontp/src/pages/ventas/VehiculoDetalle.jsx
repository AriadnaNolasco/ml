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
    CarOutlined,
    ToolOutlined,
    CalendarOutlined
} from '@ant-design/icons';

const VehiculoDetalle = ({ vehiculo, loading = false }) => {

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!vehiculo) {
        return <div>No se encontraron datos del vehículo</div>;
    }

    return (
        <Card>
            <Row gutter={24}>
                <Col xs={24} md={12}>
                    <Divider orientation="left" style={{ marginTop: 0 }}>
                        <CarOutlined style={{ marginRight: 8 }} />
                        Información del Vehículo
                    </Divider>

                    <Descriptions column={1} bordered size="small">
                        <Descriptions.Item label="Placa">
                            <strong>{vehiculo.placa || 'N/A'}</strong>
                        </Descriptions.Item>
                        <Descriptions.Item label="Marca">
                            {vehiculo.marca || 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Modelo">
                            {vehiculo.modelo || 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Año de Fabricación">
                            {vehiculo.anio_fabricacion || 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Estado">
                            <Tag color={vehiculo.estado ? "green" : "red"}>
                                {vehiculo.estado ? 'Activo' : 'Inactivo'}
                            </Tag>
                        </Descriptions.Item>
                    </Descriptions>
                </Col>

                <Col xs={24} md={12}>
                    <Divider orientation="left">
                        <ToolOutlined style={{ marginRight: 8 }} />
                        Especificaciones Técnicas
                    </Divider>

                    <Descriptions column={1} bordered size="small">
                        <Descriptions.Item label="Combustible">
                            {vehiculo.combustible || 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Carrocería">
                            {vehiculo.carroceria || 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Tipo de Transmisión">
                            {vehiculo.tipo_transmision || 'N/A'}
                        </Descriptions.Item>
                    </Descriptions>
                </Col>
            </Row>

            <Divider orientation="left" style={{ marginTop: 24 }}>
                <CalendarOutlined style={{ marginRight: 8 }} />
                Información de Registro
            </Divider>

            <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Fecha de Registro">
                    {vehiculo.fecha_registro ? new Date(vehiculo.fecha_registro).toLocaleDateString('es-PE') : 'N/A'}
                </Descriptions.Item>
            </Descriptions>
        </Card>
    );
};

export default VehiculoDetalle;