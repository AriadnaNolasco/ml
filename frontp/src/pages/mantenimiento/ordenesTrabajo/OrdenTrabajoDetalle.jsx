import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Card, Button, Space, Tag, Tabs, Spin, message
} from 'antd';
import {
    ArrowLeftOutlined,
    FileTextOutlined,
    HistoryOutlined,
    DollarOutlined,
    PaperClipOutlined,
    FilePdfOutlined,
    SaveOutlined
} from '@ant-design/icons';
import { getOrdenTrabajoById, updateOrdenTrabajo } from '../../../api/apiOrdenesMantenimiento';
import TabGeneral from './components/TabGeneral';
import TabHistorial from './components/TabHistorial';
import TabCostos from './components/TabCostos';
import TabAdjuntos from './components/TabAdjuntos';

const { TabPane } = Tabs;

const OrdenTrabajoDetalle = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [orden, setOrden] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('general');
    const [hasChanges, setHasChanges] = useState(false);
    const [saving, setSaving] = useState(false);

    const loadOrden = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getOrdenTrabajoById(id);
            setOrden(data.data);
        } catch (error) {
            console.error('Error cargando OT:', error);
            message.error('Error al cargar la orden de trabajo');
            navigate('/mantenimiento/ordenes-trabajo');
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        loadOrden();
    }, [loadOrden]);

    const handleSaveChanges = async (updatedData) => {
        try {
            setSaving(true);
            const userId = localStorage.getItem('userId');
            await updateOrdenTrabajo(id, {
                ...updatedData,
                updated_by: parseInt(userId)
            });
            
            message.success('Cambios guardados correctamente');
            setHasChanges(false);
            loadOrden();
        } catch (error) {
            console.error('Error guardando cambios:', error);
            message.error('Error al guardar los cambios');
        } finally {
            setSaving(false);
        }
    };

    const handleGeneratePDF = () => {
        message.info('Funcionalidad de PDF en desarrollo');
    };

    const getEstadoColor = (estado) => {
        const colors = {
            'SOLICITUD': 'blue',
            'REVISION': 'purple',
            'EVALUACION': 'orange',
            'EJECUCION': 'gold',
            'CERRADA': 'green'
        };
        return colors[estado] || 'default';
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px' }}>
                <Spin size="large" />
                <p style={{ marginTop: 20 }}>Cargando orden de trabajo...</p>
            </div>
        );
    }

    if (!orden) {
        return (
            <div style={{ textAlign: 'center', padding: '100px' }}>
                <p style={{ fontSize: '18px', color: '#ff4d4f' }}>
                    No se encontró la orden de trabajo
                </p>
            </div>
        );
    }

    return (
        <div style={{ padding: 24 }}>
            {/* Header */}
            <Card style={{ marginBottom: 24 }}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    {/* Barra Superior */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space>
                            <Button
                                icon={<ArrowLeftOutlined />}
                                onClick={() => navigate('/mantenimiento/ordenes-trabajo')}
                            >
                                Volver
                            </Button>
                            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
                                {orden.codigo_ot}
                            </h2>
                        </Space>

                        <Space>
                            <Button
                                icon={<FilePdfOutlined />}
                                onClick={handleGeneratePDF}
                            >
                                Generar PDF
                            </Button>
                            {hasChanges && (
                                <Button
                                    type="primary"
                                    icon={<SaveOutlined />}
                                    onClick={() => handleSaveChanges(orden)}
                                    loading={saving}
                                >
                                    Guardar Cambios
                                </Button>
                            )}
                        </Space>
                    </div>

                    {/* Tags de Motivo y Estado */}
                    <Space>
                        <Tag color="purple" style={{ fontSize: '13px', padding: '4px 12px' }}>
                            {orden.motivo}
                        </Tag>
                        <Tag color={getEstadoColor(orden.estado)} style={{ fontSize: '13px', padding: '4px 12px', fontWeight: 'bold' }}>
                            {orden.estado}
                        </Tag>
                    </Space>
                </Space>
            </Card>

            {/* Pestañas */}
            <Card>
                <Tabs 
                    activeKey={activeTab} 
                    onChange={setActiveTab}
                    size="large"
                >
                    <TabPane
                        tab={
                            <span>
                                <FileTextOutlined />
                                General
                            </span>
                        }
                        key="general"
                    >
                        <TabGeneral 
                            orden={orden}
                            setHasChanges={setHasChanges}
                            onSave={handleSaveChanges}
                        />
                    </TabPane>

                    <TabPane
                        tab={
                            <span>
                                <HistoryOutlined />
                                Historial
                            </span>
                        }
                        key="historial"
                    >
                        <TabHistorial 
                            orden={orden}
                            onReload={loadOrden}
                        />
                    </TabPane>

                    <TabPane
                        tab={
                            <span>
                                <DollarOutlined />
                                Costos
                            </span>
                        }
                        key="costos"
                    >
                        <TabCostos orden={orden} />
                    </TabPane>

                    <TabPane
                        tab={
                            <span>
                                <PaperClipOutlined />
                                Adjuntos
                            </span>
                        }
                        key="adjuntos"
                    >
                        <TabAdjuntos 
                            ordenId={id}
                            adjuntos={orden.adjuntos || []}
                            onReload={loadOrden}
                        />
                    </TabPane>
                </Tabs>
            </Card>
        </div>
    );
};

export default OrdenTrabajoDetalle;