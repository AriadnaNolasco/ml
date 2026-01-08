import React from 'react';
import { Card, Row, Col, Table, Statistic, Typography, Divider } from 'antd';
import { 
    UserOutlined, 
    ToolOutlined, 
    DollarOutlined,
    BoxPlotOutlined 
} from '@ant-design/icons';

const { Text, Title } = Typography;

const TabCostos = ({ orden }) => {
    // Cálculo de Mano de Obra
    const calcularCostoManoObra = () => {
        if (!orden.actividades || orden.actividades.length === 0) return [];

        // Agrupar actividades por técnico
        const tecnicosMap = {};
        orden.actividades.forEach(actividad => {
            const tecnicoId = actividad.tecnico_id;
            if (!tecnicosMap[tecnicoId]) {
                tecnicosMap[tecnicoId] = {
                    nombre: actividad.tecnico_nombre,
                    horas: 0,
                    tarifa: 25.00 // Tarifa por hora (puedes hacerla dinámica)
                };
            }
            tecnicosMap[tecnicoId].horas += parseFloat(actividad.duracion_horas || 0);
        });

        return Object.values(tecnicosMap);
    };

    const tecnicosData = calcularCostoManoObra();
    const totalManoObra = tecnicosData.reduce((sum, t) => sum + (t.horas * t.tarifa), 0);

    // Cálculo de Materiales
    const totalMateriales = orden.materiales?.reduce((sum, mat) => 
        sum + parseFloat(mat.costo_total || 0), 0
    ) || 0;

    // Total General
    const totalGeneral = totalManoObra + totalMateriales;

    // Columnas para Mano de Obra
    const manoObraColumns = [
        {
            title: 'Técnico',
            dataIndex: 'nombre',
            key: 'nombre',
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: 'Horas',
            dataIndex: 'horas',
            key: 'horas',
            align: 'right',
            render: (value) => value.toFixed(2),
        },
        {
            title: 'Tarifa/Hora',
            dataIndex: 'tarifa',
            key: 'tarifa',
            align: 'right',
            render: (value) => `S/ ${value.toFixed(2)}`,
        },
        {
            title: 'Total',
            key: 'total',
            align: 'right',
            render: (_, record) => (
                <Text strong style={{ color: '#1890ff' }}>
                    S/ {(record.horas * record.tarifa).toFixed(2)}
                </Text>
            ),
        },
    ];

    // Columnas para Materiales
    const materialesColumns = [
        {
            title: 'Producto',
            dataIndex: 'producto_nombre',
            key: 'producto_nombre',
            ellipsis: true,
        },
        {
            title: 'Cantidad',
            dataIndex: 'cantidad',
            key: 'cantidad',
            align: 'right',
        },
        {
            title: 'Unidad',
            dataIndex: 'unidad',
            key: 'unidad',
            width: 80,
        },
        {
            title: 'Costo Unit.',
            dataIndex: 'costo_unitario',
            key: 'costo_unitario',
            align: 'right',
            render: (value) => `S/ ${parseFloat(value).toFixed(2)}`,
        },
        {
            title: 'Total',
            dataIndex: 'costo_total',
            key: 'costo_total',
            align: 'right',
            render: (value) => (
                <Text strong style={{ color: '#52c41a' }}>
                    S/ {parseFloat(value).toFixed(2)}
                </Text>
            ),
        },
    ];

    return (
        <div>
            {/* Tarjetas de Resumen Superior */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col xs={24} md={8}>
                    <Card bordered={false} style={{ backgroundColor: '#e6f7ff', borderLeft: '4px solid #1890ff' }}>
                        <Statistic
                            title={
                                <span>
                                    <UserOutlined /> Mano de Obra
                                </span>
                            }
                            value={totalManoObra.toFixed(2)}
                            prefix="S/"
                            valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>

                <Col xs={24} md={8}>
                    <Card bordered={false} style={{ backgroundColor: '#f6ffed', borderLeft: '4px solid #52c41a' }}>
                        <Statistic
                            title={
                                <span>
                                    <BoxPlotOutlined /> Materiales
                                </span>
                            }
                            value={totalMateriales.toFixed(2)}
                            prefix="S/"
                            valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>

                <Col xs={24} md={8}>
                    <Card bordered={false} style={{ backgroundColor: '#f9f0ff', borderLeft: '4px solid #722ed1' }}>
                        <Statistic
                            title={
                                <span>
                                    <DollarOutlined /> Total OT
                                </span>
                            }
                            value={totalGeneral.toFixed(2)}
                            prefix="S/"
                            valueStyle={{ color: '#722ed1', fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Detalle de Mano de Obra */}
            <Card 
                title={
                    <span>
                        <UserOutlined /> Detalle de Mano de Obra
                    </span>
                }
                style={{ marginBottom: 24 }}
                size="small"
            >
                <Table
                    columns={manoObraColumns}
                    dataSource={tecnicosData}
                    rowKey={(record, index) => index}
                    pagination={false}
                    locale={{
                        emptyText: 'No hay actividades registradas',
                    }}
                    summary={() => (
                        <Table.Summary fixed>
                            <Table.Summary.Row style={{ backgroundColor: '#e6f7ff' }}>
                                <Table.Summary.Cell index={0} colSpan={3}>
                                    <Text strong style={{ fontSize: '15px' }}>Total Mano de Obra:</Text>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={1} align="right">
                                    <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
                                        S/ {totalManoObra.toFixed(2)}
                                    </Text>
                                </Table.Summary.Cell>
                            </Table.Summary.Row>
                        </Table.Summary>
                    )}
                    size="small"
                />
            </Card>

            {/* Materiales y Repuestos */}
            <Card
                title={
                    <span>
                        <ToolOutlined /> Materiales y Repuestos Utilizados
                    </span>
                }
                style={{ marginBottom: 24 }}
                size="small"
            >
                <Table
                    columns={materialesColumns}
                    dataSource={orden.materiales || []}
                    rowKey={(record, index) => index}
                    pagination={false}
                    locale={{
                        emptyText: 'No hay materiales registrados',
                    }}
                    summary={() => (
                        <Table.Summary fixed>
                            <Table.Summary.Row style={{ backgroundColor: '#f6ffed' }}>
                                <Table.Summary.Cell index={0} colSpan={4}>
                                    <Text strong style={{ fontSize: '15px' }}>Total Materiales y Repuestos:</Text>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={1} align="right">
                                    <Text strong style={{ color: '#52c41a', fontSize: '16px' }}>
                                        S/ {totalMateriales.toFixed(2)}
                                    </Text>
                                </Table.Summary.Cell>
                            </Table.Summary.Row>
                        </Table.Summary>
                    )}
                    size="small"
                />
            </Card>

            {/* Resumen Final */}
            <Card
                style={{
                    background: 'linear-gradient(135deg, #f9f0ff 0%, #e6f7ff 100%)',
                    border: '2px solid #d3adf7',
                }}
            >
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={12} style={{ textAlign: 'right' }}>
                        <Text style={{ fontSize: '16px' }}>Subtotal Mano de Obra:</Text>
                    </Col>
                    <Col xs={24} md={12}>
                        <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                            S/ {totalManoObra.toFixed(2)}
                        </Text>
                    </Col>

                    <Col xs={24} md={12} style={{ textAlign: 'right' }}>
                        <Text style={{ fontSize: '16px' }}>Subtotal Materiales:</Text>
                    </Col>
                    <Col xs={24} md={12}>
                        <Text strong style={{ fontSize: '16px', color: '#52c41a' }}>
                            S/ {totalMateriales.toFixed(2)}
                        </Text>
                    </Col>

                    <Col xs={24}>
                        <Divider style={{ margin: '12px 0', borderColor: '#722ed1' }} />
                    </Col>

                    <Col xs={24} md={12} style={{ textAlign: 'right' }}>
                        <Title level={4} style={{ margin: 0, color: '#262626' }}>
                            TOTAL GENERAL:
                        </Title>
                    </Col>
                    <Col xs={24} md={12}>
                        <Title level={3} style={{ margin: 0, color: '#722ed1' }}>
                            S/ {totalGeneral.toFixed(2)}
                        </Title>
                    </Col>
                </Row>
            </Card>
        </div>
    );
};

export default TabCostos;