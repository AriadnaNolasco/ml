import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Row, Col, Card, Divider, Typography, Space, message } from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const TabGeneral = ({ orden, setHasChanges, onSave }) => {
    const [form] = Form.useForm();
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (orden) {
            form.setFieldsValue({
                estado: orden.estado,
                prioridad: orden.prioridad,
                descripcion: orden.descripcion_trabajo,
                observaciones: orden.observaciones
            });
        }
    }, [orden, form]);

    const handleEdit = () => {
        setEditing(true);
    };

    const handleCancel = () => {
        form.resetFields();
        setEditing(false);
        setHasChanges(false);
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            await onSave(values);
            setEditing(false);
            message.success('Cambios guardados correctamente');
        } catch (error) {
            console.error('Error al guardar:', error);
            message.error('Error al guardar los cambios');
        } finally {
            setLoading(false);
        }
    };

    const handleFieldChange = () => {
        setHasChanges(true);
    };

    return (
        <div>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* Botones de Edición */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    {!editing ? (
                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={handleEdit}
                        >
                            Editar
                        </Button>
                    ) : (
                        <Space>
                            <Button
                                icon={<CloseOutlined />}
                                onClick={handleCancel}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="primary"
                                icon={<SaveOutlined />}
                                onClick={handleSave}
                                loading={loading}
                            >
                                Guardar
                            </Button>
                        </Space>
                    )}
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onValuesChange={handleFieldChange}
                    disabled={!editing}
                >
                    {/* Información del Equipo */}
                    <Card title="📦 Información del Equipo" size="small" style={{ marginBottom: 24 }}>
                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <div style={{ marginBottom: 16 }}>
                                    <Text strong>Código BPC:</Text>
                                    <div>{orden.equipo_bpc || 'N/A'}</div>
                                </div>
                            </Col>
                            <Col xs={24} md={12}>
                                <div style={{ marginBottom: 16 }}>
                                    <Text strong>Código SOLPED:</Text>
                                    <div>{orden.equipo_solped || 'N/A'}</div>
                                </div>
                            </Col>
                            <Col xs={24} md={12}>
                                <div style={{ marginBottom: 16 }}>
                                    <Text strong>Marca:</Text>
                                    <div>{orden.equipo_marca || 'N/A'}</div>
                                </div>
                            </Col>
                            <Col xs={24} md={12}>
                                <div style={{ marginBottom: 16 }}>
                                    <Text strong>Modelo:</Text>
                                    <div>{orden.equipo_modelo || 'N/A'}</div>
                                </div>
                            </Col>
                            <Col xs={24}>
                                <div style={{ marginBottom: 16 }}>
                                    <Text strong>Cliente:</Text>
                                    <div>{orden.cliente_nombre || 'N/A'}</div>
                                </div>
                            </Col>
                        </Row>
                    </Card>

                    {/* Detalles de la Orden */}
                    <Card title="📋 Detalles de la Orden" size="small" style={{ marginBottom: 24 }}>
                        <Row gutter={16}>
                            <Col xs={24} md={8}>
                                <Form.Item
                                    name="estado"
                                    label="Estado"
                                    rules={[{ required: true }]}
                                >
                                    <Select size="large">
                                        <Option value="SOLICITUD">Solicitud</Option>
                                        <Option value="REVISION">Revisión</Option>
                                        <Option value="EVALUACION">Evaluación</Option>
                                        <Option value="EJECUCION">Ejecución</Option>
                                        <Option value="CERRADA">Cerrada</Option>
                                    </Select>
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={8}>
                                <Form.Item
                                    name="prioridad"
                                    label="Prioridad"
                                    rules={[{ required: true }]}
                                >
                                    <Select size="large">
                                        <Option value="BAJA">🟢 BAJA</Option>
                                        <Option value="MEDIA">🟡 MEDIA</Option>
                                        <Option value="ALTA">🔴 ALTA</Option>
                                    </Select>
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={8}>
                                <div style={{ marginBottom: 16 }}>
                                    <Text strong>Técnico(s):</Text>
                                    <div>{orden.tecnicos_asignados || 'Sin asignar'}</div>
                                </div>
                            </Col>

                            <Col xs={24}>
                                <Form.Item
                                    name="descripcion"
                                    label="Descripción del Trabajo"
                                    rules={[{ required: true }]}
                                >
                                    <TextArea rows={4} />
                                </Form.Item>
                            </Col>

                            <Col xs={24}>
                                <Form.Item
                                    name="observaciones"
                                    label="Observaciones Adicionales"
                                >
                                    <TextArea rows={3} />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>

                    {/* Fechas */}
                    <Card title="📅 Fechas" size="small">
                        <Row gutter={16}>
                            <Col xs={24} md={8}>
                                <div style={{ marginBottom: 16 }}>
                                    <Text strong>Fecha Creación:</Text>
                                    <div>{new Date(orden.fecha_creacion).toLocaleString('es-ES')}</div>
                                </div>
                            </Col>
                            <Col xs={24} md={8}>
                                <div style={{ marginBottom: 16 }}>
                                    <Text strong>Fecha Inicio:</Text>
                                    <div>{orden.fecha_inicio ? new Date(orden.fecha_inicio).toLocaleString('es-ES') : 'No iniciada'}</div>
                                </div>
                            </Col>
                            <Col xs={24} md={8}>
                                <div style={{ marginBottom: 16 }}>
                                    <Text strong>Fecha Finalización:</Text>
                                    <div>{orden.fecha_fin ? new Date(orden.fecha_fin).toLocaleString('es-ES') : 'No finalizada'}</div>
                                </div>
                            </Col>
                        </Row>
                    </Card>
                </Form>
            </Space>
        </div>
    );
};

export default TabGeneral;