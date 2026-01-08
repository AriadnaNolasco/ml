import React, { useState } from 'react';
import { Card, Button, Space, Table, Typography, Timeline, message } from 'antd';
import { PlusOutlined, HistoryOutlined, ToolOutlined, BoxPlotOutlined } from '@ant-design/icons';
import { addActividad, addMaterial } from '../../../../api/apiOrdenesMantenimiento';
import ModalActividad from './ModalActividad';
import ModalMaterial from './ModalMaterial';

const { Title, Text } = Typography;

const TabHistorial = ({ orden, onReload }) => {
    const [showModalActividad, setShowModalActividad] = useState(false);
    const [showModalMaterial, setShowModalMaterial] = useState(false);
    const [loadingActividad, setLoadingActividad] = useState(false);
    const [loadingMaterial, setLoadingMaterial] = useState(false);

    const handleAddActividad = async (data) => {
        try {
            setLoadingActividad(true);
            await addActividad(orden.id, data);
            message.success('Actividad registrada correctamente');
            setShowModalActividad(false);
            onReload();
        } catch (error) {
            console.error('Error registrando actividad:', error);
            message.error('Error al registrar la actividad');
        } finally {
            setLoadingActividad(false);
        }
    };

    const handleAddMaterial = async (data) => {
        try {
            setLoadingMaterial(true);
            await addMaterial(orden.id, data);
            message.success('Material agregado correctamente');
            setShowModalMaterial(false);
            onReload();
        } catch (error) {
            console.error('Error agregando material:', error);
            message.error('Error al agregar el material');
        } finally {
            setLoadingMaterial(false);
        }
    };

    const totalHoras = orden.actividades?.reduce((sum, act) => sum + parseFloat(act.duracion_horas || 0), 0) || 0;
    const totalMateriales = orden.materiales?.reduce((sum, mat) => sum + parseFloat(mat.costo_total || 0), 0) || 0;

    // Columnas para la tabla de actividades
    const actividadesColumns = [
        {
            title: 'Fecha',
            dataIndex: 'fecha_actividad',
            key: 'fecha_actividad',
            width: 120,
            render: (text) => new Date(text).toLocaleDateString('es-ES'),
            sorter: (a, b) => new Date(a.fecha_actividad) - new Date(b.fecha_actividad),
        },
        {
            title: 'Técnico',
            dataIndex: 'tecnico_nombre',
            key: 'tecnico_nombre',
            width: 180,
        },
        {
            title: 'Tarea Realizada',
            dataIndex: 'tarea_realizada',
            key: 'tarea_realizada',
            ellipsis: true,
        },
        {
            title: 'Duración (hrs)',
            dataIndex: 'duracion_horas',
            key: 'duracion_horas',
            width: 120,
            align: 'right',
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: 'Observaciones',
            dataIndex: 'observaciones',
            key: 'observaciones',
            ellipsis: true,
            render: (text) => text || <Text type="secondary">-</Text>,
        },
    ];

    // Columnas para la tabla de materiales
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
            width: 100,
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
            width: 120,
            align: 'right',
            render: (value) => `S/ ${parseFloat(value).toFixed(2)}`,
        },
        {
            title: 'Total',
            dataIndex: 'costo_total',
            key: 'costo_total',
            width: 120,
            align: 'right',
            render: (value) => <Text strong>S/ {parseFloat(value).toFixed(2)}</Text>,
        },
    ];

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Historial de Estados */}
            <Card 
                title={
                    <Space>
                        <HistoryOutlined />
                        <span>Historial de Estados</span>
                    </Space>
                }
                size="small"
            >
                {orden.historial_estados && orden.historial_estados.length > 0 ? (
                    <Timeline mode="left">
                        {orden.historial_estados.map((estado, index) => (
                            <Timeline.Item
                                key={index}
                                color="blue"
                                label={
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                        {new Date(estado.fecha_cambio).toLocaleString('es-ES')}
                                    </Text>
                                }
                            >
                                <Card size="small" style={{ backgroundColor: '#f0f5ff' }}>
                                    <Space direction="vertical" size={0}>
                                        <Text strong style={{ color: '#1890ff' }}>
                                            {estado.estado_nuevo}
                                        </Text>
                                        {estado.nota && (
                                            <Text type="secondary" style={{ fontSize: '13px' }}>
                                                {estado.nota}
                                            </Text>
                                        )}
                                        {estado.usuario_nombre && (
                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                Usuario: {estado.usuario_nombre}
                                            </Text>
                                        )}
                                    </Space>
                                </Card>
                            </Timeline.Item>
                        ))}
                    </Timeline>
                ) : (
                    <Text type="secondary">No hay cambios de estado registrados</Text>
                )}
            </Card>

            {/* Actividades Realizadas */}
            <Card
                title={
                    <Space>
                        <ToolOutlined />
                        <span>Actividades Realizadas</span>
                    </Space>
                }
                extra={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setShowModalActividad(true)}
                    >
                        Registrar Actividad
                    </Button>
                }
                size="small"
            >
                <Table
                    columns={actividadesColumns}
                    dataSource={orden.actividades || []}
                    rowKey={(record, index) => index}
                    pagination={false}
                    locale={{
                        emptyText: 'No hay actividades registradas',
                    }}
                    summary={() => (
                        <Table.Summary fixed>
                            <Table.Summary.Row style={{ backgroundColor: '#fafafa' }}>
                                <Table.Summary.Cell index={0} colSpan={3} align="right">
                                    <Text strong>Total Horas Trabajadas:</Text>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={1} align="right">
                                    <Text strong style={{ color: '#1890ff', fontSize: '15px' }}>
                                        {totalHoras.toFixed(2)} hrs
                                    </Text>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={2} />
                            </Table.Summary.Row>
                        </Table.Summary>
                    )}
                    size="small"
                    scroll={{ x: 800 }}
                />
            </Card>

            {/* Materiales y Repuestos */}
            <Card
                title={
                    <Space>
                        <BoxPlotOutlined />
                        <span>Materiales y Repuestos Utilizados</span>
                    </Space>
                }
                extra={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setShowModalMaterial(true)}
                        style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                    >
                        Agregar Material
                    </Button>
                }
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
                            <Table.Summary.Row style={{ backgroundColor: '#fafafa' }}>
                                <Table.Summary.Cell index={0} colSpan={4} align="right">
                                    <Text strong>Total Materiales:</Text>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={1} align="right">
                                    <Text strong style={{ color: '#52c41a', fontSize: '15px' }}>
                                        S/ {totalMateriales.toFixed(2)}
                                    </Text>
                                </Table.Summary.Cell>
                            </Table.Summary.Row>
                            <Table.Summary.Row style={{ backgroundColor: '#fafafa' }}>
                                <Table.Summary.Cell index={0} colSpan={4} align="right">
                                    <Text strong># de Items:</Text>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={1} align="right">
                                    <Text strong>{orden.materiales?.length || 0}</Text>
                                </Table.Summary.Cell>
                            </Table.Summary.Row>
                        </Table.Summary>
                    )}
                    size="small"
                    scroll={{ x: 700 }}
                />
            </Card>

            {/* Modales */}
            {showModalActividad && (
                <ModalActividad
                    open={showModalActividad}
                    onClose={() => setShowModalActividad(false)}
                    onSubmit={handleAddActividad}
                    ordenId={orden.id}
                    loading={loadingActividad}
                />
            )}

            {showModalMaterial && (
                <ModalMaterial
                    open={showModalMaterial}
                    onClose={() => setShowModalMaterial(false)}
                    onSubmit={handleAddMaterial}
                    ordenId={orden.id}
                    loading={loadingMaterial}
                />
            )}
        </Space>
    );
};

export default TabHistorial;