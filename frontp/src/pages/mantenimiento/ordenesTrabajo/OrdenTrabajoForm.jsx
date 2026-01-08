import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Form, Input, Select, Button, Card, Space, Spin, message, Alert, Divider, Row, Col, Typography
} from 'antd';
import {
    ArrowLeftOutlined, SaveOutlined, ToolOutlined, UserAddOutlined
} from '@ant-design/icons';
import { 
    getEquiposDisponibles, 
    getTecnicos, 
    createOrdenTrabajo 
} from '../../../api/apiOrdenesMantenimiento';
import ModalAgregarTecnico from './components/ModalAgregarTecnico';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const OrdenTrabajoForm = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    
    const [equipos, setEquipos] = useState([]);
    const [tecnicos, setTecnicos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
    const [showModalTecnico, setShowModalTecnico] = useState(false);

    useEffect(() => {
        loadFormData();
    }, []);

    const loadFormData = async () => {
        try {
            setLoadingData(true);
            
            const [equiposRes, tecnicosRes] = await Promise.all([
                getEquiposDisponibles(),
                getTecnicos()
            ]);
            
            console.log('✅ Equipos cargados:', equiposRes);
            console.log('✅ Técnicos cargados:', tecnicosRes);
            
            setEquipos(equiposRes.data || []);
            setTecnicos(tecnicosRes.data || []);
            
        } catch (error) {
            console.error('❌ Error cargando datos:', error);
            message.error('Error al cargar los datos del formulario');
        } finally {
            setLoadingData(false);
        }
    };

    const handleEquipoChange = (equipoId) => {
        const equipo = equipos.find(e => e.id === equipoId);
        setEquipoSeleccionado(equipo);
        
        // Auto-rellenar motivo si existe
        if (equipo?.motivo) {
            form.setFieldsValue({ motivo: equipo.motivo });
        }
    };

    const handleSubmit = async (values) => {
        try {
            setLoading(true);
            const userId = localStorage.getItem('userId');

            // Obtener motivo_id del equipo seleccionado
            const equipoSelected = equipos.find(e => e.id === values.recepcion_equipo_id);

            const payload = {
                recepcion_equipo_id: values.recepcion_equipo_id,
                motivo_id: equipoSelected?.motivo_id || 1,
                prioridad: values.prioridad,
                descripcion_trabajo: values.descripcion_trabajo,
                tecnicos_ids: values.tecnicos_ids || [],
                created_by: parseInt(userId)
            };

            console.log('📤 Enviando payload:', payload);

            await createOrdenTrabajo(payload); // ✅ Quitamos 'response' para evitar el warning

            // ✅ Mostrar mensaje de éxito
            message.success('✅ Orden de Trabajo creada exitosamente');

            // ✅ Redirigir después de un breve delay
            setTimeout(() => {
                navigate('/mantenimiento/ordenes-trabajo');
            }, 1000);
            
        } catch (error) {
            console.error('❌ Error creando orden:', error);
            
            const errorMessage = error.response?.data?.message || 
                               error.response?.data?.error || 
                               'Error al crear la orden de trabajo';
            
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleTecnicoAdded = () => {
        loadFormData(); // Recargar técnicos
        message.success('Técnico agregado. Ya puedes seleccionarlo en el listado.');
    };

    if (loadingData) {
        return (
            <div style={{ textAlign: 'center', padding: '100px' }}>
                <Spin size="large" tip="Cargando datos del formulario..." />
            </div>
        );
    }

    return (
        <div style={{ padding: 24 }}>
            <Card>
                {/* Header */}
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <div>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={() => navigate('/mantenimiento/ordenes-trabajo')}
                            style={{ marginBottom: 16 }}
                        >
                            Volver al listado
                        </Button>
                        <Title level={3} style={{ margin: 0 }}>
                            <ToolOutlined style={{ marginRight: 10, color: '#1890ff' }} />
                            Nueva Orden de Trabajo
                        </Title>
                        <Text type="secondary">
                            El código OT se generará automáticamente al crear la orden
                        </Text>
                    </div>

                    <Divider />

                    {/* Alerta si no hay equipos */}
                    {equipos.length === 0 && (
                        <Alert
                            message="⚠️ No hay equipos disponibles"
                            description="No se encontraron equipos en estado RECEPCIONADO sin orden de trabajo asignada."
                            type="warning"
                            showIcon
                            action={
                                <Button 
                                    size="small" 
                                    onClick={() => navigate('/mantenimiento/recepcion')}
                                >
                                    Ir a Recepción de Equipos
                                </Button>
                            }
                        />
                    )}

                    {/* Formulario */}
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                        initialValues={{
                            prioridad: 'MEDIA',
                            tecnicos_ids: []
                        }}
                    >
                        <Row gutter={24}>
                            {/* EQUIPO */}
                            <Col xs={24} lg={12}>
                                <Form.Item
                                    name="recepcion_equipo_id"
                                    label="Equipo a Intervenir"
                                    rules={[{ required: true, message: 'Por favor seleccione un equipo' }]}
                                >
                                    <Select
                                        placeholder="Seleccionar equipo..."
                                        size="large"
                                        showSearch
                                        disabled={equipos.length === 0}
                                        optionFilterProp="children"
                                        onChange={handleEquipoChange}
                                        filterOption={(input, option) =>
                                            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                        }
                                    >
                                        {equipos.map(equipo => (
                                            <Option key={equipo.id} value={equipo.id}>
                                                {equipo.codigo_bpc} - {equipo.marca} {equipo.modelo} ({equipo.cliente_nombre})
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    📌 Solo se muestran equipos en estado "RECEPCIONADO" sin OT asignada
                                </Text>
                            </Col>

                            {/* PRIORIDAD */}
                            <Col xs={24} lg={12}>
                                <Form.Item
                                    name="prioridad"
                                    label="Prioridad"
                                    rules={[{ required: true, message: 'Por favor seleccione una prioridad' }]}
                                >
                                    <Select size="large">
                                        <Option value="BAJA">🟢 BAJA</Option>
                                        <Option value="MEDIA">🟡 MEDIA</Option>
                                        <Option value="ALTA">🔴 ALTA</Option>
                                    </Select>
                                </Form.Item>
                            </Col>

                            {/* INFO DEL EQUIPO SELECCIONADO */}
                            {equipoSeleccionado && (
                                <Col xs={24}>
                                    <Alert
                                        message="📋 Información del Equipo Seleccionado"
                                        description={
                                            <Row gutter={[16, 8]}>
                                                <Col span={12}>
                                                    <Text strong>Código BPC:</Text> {equipoSeleccionado.codigo_bpc}
                                                </Col>
                                                <Col span={12}>
                                                    <Text strong>SOLPED:</Text> {equipoSeleccionado.codigo_solped || 'N/A'}
                                                </Col>
                                                <Col span={12}>
                                                    <Text strong>Marca:</Text> {equipoSeleccionado.marca}
                                                </Col>
                                                <Col span={12}>
                                                    <Text strong>Modelo:</Text> {equipoSeleccionado.modelo}
                                                </Col>
                                                <Col span={12}>
                                                    <Text strong>Cliente:</Text> {equipoSeleccionado.cliente_nombre}
                                                </Col>
                                                <Col span={12}>
                                                    <Text strong>Motivo:</Text> {equipoSeleccionado.motivo || 'N/A'}
                                                </Col>
                                                {equipoSeleccionado.descripcion_problema && (
                                                    <Col span={24}>
                                                        <Text strong>Descripción:</Text> {equipoSeleccionado.descripcion_problema}
                                                    </Col>
                                                )}
                                            </Row>
                                        }
                                        type="info"
                                        showIcon
                                        style={{ marginBottom: 16 }}
                                    />
                                </Col>
                            )}

                            {/* TÉCNICOS ASIGNADOS */}
                            <Col xs={24}>
                                <Form.Item
                                    label={
                                        <Space>
                                            <span>Técnicos Asignados (Opcional)</span>
                                            <Button
                                                type="link"
                                                size="small"
                                                icon={<UserAddOutlined />}
                                                onClick={() => setShowModalTecnico(true)}
                                                style={{ padding: 0 }}
                                            >
                                                Agregar Nuevo Técnico
                                            </Button>
                                        </Space>
                                    }
                                    name="tecnicos_ids"
                                >
                                    <Select
                                        mode="multiple"
                                        placeholder={tecnicos.length === 0 ? "No hay técnicos registrados" : "Seleccionar técnicos..."}
                                        size="large"
                                        showSearch
                                        disabled={tecnicos.length === 0}
                                        optionFilterProp="children"
                                        filterOption={(input, option) =>
                                            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                        }
                                    >
                                        {tecnicos.map(tecnico => (
                                            <Option key={tecnico.id} value={tecnico.id}>
                                                {tecnico.nombre_completo} 
                                                {tecnico.especialidad && ` - ${tecnico.especialidad}`}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                                {tecnicos.length === 0 && (
                                    <Alert
                                        message="ℹ️ No hay técnicos registrados"
                                        description="Haga clic en 'Agregar Nuevo Técnico' para crear uno"
                                        type="info"
                                        showIcon
                                        style={{ marginBottom: 16 }}
                                    />
                                )}
                            </Col>

                            {/* DESCRIPCIÓN DEL TRABAJO */}
                            <Col xs={24}>
                                <Form.Item
                                    name="descripcion_trabajo"
                                    label="Descripción del Trabajo a Realizar"
                                    rules={[
                                        { required: true, message: 'Por favor ingrese una descripción del trabajo' },
                                        { min: 10, message: 'La descripción debe tener al menos 10 caracteres' }
                                    ]}
                                >
                                    <TextArea
                                        rows={5}
                                        placeholder="Detalle de las actividades de mantenimiento, reparación o evaluación que se realizarán..."
                                        showCount
                                        maxLength={500}
                                    />
                                </Form.Item>
                            </Col>

                            {/* INFORMACIÓN DE FECHAS */}
                            <Col xs={24}>
                                <Alert
                                    message="📅 Información sobre Fechas"
                                    description={
                                        <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                                            <li><strong>Fecha de Creación:</strong> Se registrará automáticamente al crear la OT</li>
                                            <li><strong>Fecha de Inicio:</strong> Se llenará automáticamente al cambiar estado a "En Ejecución"</li>
                                            <li><strong>Fecha de Finalización:</strong> Se llenará automáticamente al cerrar la OT</li>
                                        </ul>
                                    }
                                    type="info"
                                    showIcon
                                />
                            </Col>
                        </Row>

                        <Divider />

                        {/* BOTONES */}
                        <Row justify="end">
                            <Space size="middle">
                                <Button
                                    size="large"
                                    onClick={() => navigate('/mantenimiento/ordenes-trabajo')}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    size="large"
                                    icon={<SaveOutlined />}
                                    loading={loading}
                                    disabled={equipos.length === 0}
                                >
                                    Crear Orden de Trabajo
                                </Button>
                            </Space>
                        </Row>
                    </Form>
                </Space>
            </Card>

            {/* MODAL AGREGAR TÉCNICO */}
            <ModalAgregarTecnico
                open={showModalTecnico}
                onClose={() => setShowModalTecnico(false)}
                onSuccess={handleTecnicoAdded}
            />
        </div>
    );
};

export default OrdenTrabajoForm;