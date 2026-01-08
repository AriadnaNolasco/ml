import React, { useState, useEffect } from 'react';
import {
    Button, Card, Col, Form, Input, InputNumber, Row, Select, Space,
    Spin, Typography, message, Descriptions, DatePicker, Table, List, Modal
} from 'antd';
import {
    SaveOutlined, PlusOutlined, DeleteOutlined, ArrowLeftOutlined,
    PlusCircleOutlined, MinusCircleOutlined
} from '@ant-design/icons';
import api from '../../api/api';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;
const API_BASE = '/mantenimiento/evaluaciones';
const API_RECEPCIONES = '/mantenimiento/equipos';

// =========================================================================
// W R A P P E R S   D E   F O R M U L A R I O S   S I N   < F O R M >
// =========================================================================

// Componente para añadir Materiales (NO genera <form>)
const MaterialFormWrapper = ({ form, onAddMaterial, productosOptions }) => {
    const selectedProduct = productosOptions.find(p => p.codigo === form.getFieldValue('producto_codigo'));

    return (
        <Card size="small" title="Añadir Materiales" style={{ marginBottom: 16 }}>
            <Form form={form} layout="vertical" onFinish={onAddMaterial} component={false}> {/* component={false} EVITA EL ANIDAMIENTO */}
                <Row gutter={16}>
                    <Col span={14}>
                        <Form.Item name="producto_codigo" label="Producto" rules={[{ required: true, message: 'Seleccione un producto' }]}>
                            <Select placeholder="Seleccionar producto" showSearch optionFilterProp="children">
                                {productosOptions.map(p => (
                                    <Option key={p.codigo} value={p.codigo}>
                                        {p.nombre_completo}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item name="cantidad" label="Cantidad" rules={[{ required: true, message: 'Ingrese cantidad' }]}>
                            <InputNumber min={0.01} step={0.01} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col span={4} style={{ display: 'flex', alignItems: 'flex-end' }}>
                        {/* Usa el submit del formulario interno */}
                        <Button type="dashed" onClick={() => form.submit()} icon={<PlusCircleOutlined />} block>
                            Añadir
                        </Button>
                    </Col>

                </Row>
            </Form>
        </Card>
    );
};

// Componente para añadir Mano de Obra (NO genera <form>)
const ManoObraFormWrapper = ({ form, onAddManoObra, actividadesOptions }) => {
    const selectedActividad = actividadesOptions.find(a => a.id.toString() === form.getFieldValue('actividad_id')?.toString());

    return (
        <Card size="small" title="Añadir Mano de Obra" style={{ marginBottom: 16 }}>
            <Form form={form} layout="vertical" onFinish={onAddManoObra} component={false}> {/* component={false} EVITA EL ANIDAMIENTO */}
                <Row gutter={16}>
                    <Col span={14}>
                        <Form.Item name="actividad_id" label="Actividad" rules={[{ required: true, message: 'Seleccione actividad' }]}>
                            <Select placeholder="Seleccionar actividad" showSearch optionFilterProp="children">
                                {actividadesOptions.map(a => (
                                    <Option key={a.id} value={a.id}>
                                        {a.nombre}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item name="cantidad_horas" label="Horas Estimadas" rules={[{ required: true, message: 'Ingrese horas' }]}>
                            <InputNumber min={0.01} step={0.01} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col span={4} style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <Button type="dashed" onClick={() => form.submit()} icon={<PlusCircleOutlined />} block>
                            Añadir
                        </Button>
                    </Col>
                </Row>
            </Form>
        </Card>
    );
};


// =========================================================================
// C O M P O N E N T E   P R I N C I P A L
// =========================================================================

const EvaluacionesForm = ({ recepcionId, evaluacionId, navigate }) => {
    const [form] = Form.useForm();
    // Formularios de detalle internos
    const [mForm] = Form.useForm();
    const [moForm] = Form.useForm();

    const isEditing = !!evaluacionId;
    const [recepcionData, setRecepcionData] = useState(null);
    const [materiales, setMateriales] = useState([]);
    const [manoObra, setManoObra] = useState([]);

    const [actividadesOptions, setActividadesOptions] = useState([]);
    const [productosOptions, setProductosOptions] = useState([]);

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Efectos de Carga Inicial ---
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [actResp, prodResp] = await Promise.all([
                    api.get(`${API_BASE}/options/actividades`),
                    api.get(`${API_BASE}/options/productos`),
                ]);
                setActividadesOptions(actResp.data);
                setProductosOptions(prodResp.data);
            } catch (err) {
                message.error('Error al cargar opciones de formularios.');
                console.error(err);
            }
        };
        fetchOptions();
    }, []);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                if (isEditing) {
                    // Carga de datos para edición...
                    const response = await api.get(`${API_RECEPCIONES}/${recepcionId || evaluacionId}`);
                    setRecepcionData(response.data);

                    // Asumiendo que evalData se carga de forma asíncrona
                    const evalResp = await api.get(`${API_BASE}/${evaluacionId}`);
                    const evalData = evalResp.data;

                    form.setFieldsValue({
                        comentarios: evalData.cabecera.comentarios,
                        fecha_evaluacion: moment(evalData.cabecera.fecha_evaluacion),
                    });

                } else if (recepcionId) {
                    // Modo Creación: Cargar datos de Recepción por ID
                    const response = await api.get(`${API_RECEPCIONES}/${recepcionId}`);
                    setRecepcionData(response.data);

                    form.setFieldsValue({
                        fecha_evaluacion: moment(),
                    });
                }
            } catch (err) {
                message.error('Error al cargar los datos iniciales.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [evaluacionId, recepcionId, isEditing, form]);


    // --- Lógica de Manejo de Detalles Locales ---

    const onAddMaterial = (values) => {
        // CORRECCIÓN DE ERROR: Usar mForm para obtener el valor más reciente
        const selectedProduct = productosOptions.find(p => p.codigo === values.producto_codigo);

        // Verificación de existencia del producto (resuelve TypeError: Cannot read properties of undefined)
        if (!selectedProduct) {
            message.error('Producto seleccionado no válido o no encontrado.');
            return;
        }
        if (materiales.find(m => m.producto_codigo === values.producto_codigo)) {
            message.warning('Ese material ya está en la lista.');
            return;
        }

        const newMaterial = {
            producto_codigo: values.producto_codigo,
            cantidad: values.cantidad,
            nombre_display: selectedProduct.nombre_completo,
        };
        setMateriales([...materiales, newMaterial]);
        mForm.resetFields();
    };

    const onAddManoObra = (values) => {
        const selectedActividad = actividadesOptions.find(a => a.id.toString() === values.actividad_id?.toString());

        // Verificación de existencia de la actividad (resuelve TypeError: Cannot read properties of undefined)
        if (!selectedActividad) {
            message.error('Actividad seleccionada no válida o no encontrada.');
            return;
        }
        if (manoObra.find(m => m.actividad_id === values.actividad_id)) {
            message.warning('Esa actividad ya está en la lista.');
            return;
        }

        const newMo = {
            actividad_id: values.actividad_id,
            cantidad_horas: values.cantidad_horas,
            nombre_display: selectedActividad.nombre,
        };
        setManoObra([...manoObra, newMo]);
        moForm.resetFields();
    };

    // --- Función de Envío Única ---
    const handleSubmit = async (values) => {
        if (!recepcionData) {
            message.error('No se ha cargado la información de la recepción.');
            return;
        }
        if (materiales.length === 0 && manoObra.length === 0) {
            Modal.confirm({
                title: 'Confirmación',
                content: 'No ha añadido Materiales ni Mano de Obra. ¿Desea continuar y crear solo la cabecera?',
                okText: 'Sí, continuar',
                cancelText: 'Cancelar',
                onOk: () => submitFinalPayload(values)
            });
        } else {
            submitFinalPayload(values);
        }
    };

    const submitFinalPayload = async (values) => {
        setIsSubmitting(true);

        // El backend necesita 'observaciones' en null, no enviamos campos de display.
        const cleanedMateriales = materiales.map(({ nombre_display, ...rest }) => rest);
        const cleanedManoObra = manoObra.map(({ nombre_display, ...rest }) => ({
            ...rest,
            observaciones: null // Aseguramos el campo nulo para el backend
        }));

        const payload = {
            recepcion_equipo_id: recepcionData.id,
            comentarios: values.comentarios,
            fecha_evaluacion: values.fecha_evaluacion.format('YYYY-MM-DD'),

            materiales: cleanedMateriales,
            manoObra: cleanedManoObra,
            auxiliares: [],
        };

        if (isEditing) {
            // En este flujo, si se está editando, solo se actualiza la cabecera
            try {
                await api.put(`${API_BASE}/${evaluacionId}`, {
                    comentarios: values.comentarios,
                    fecha_evaluacion: payload.fecha_evaluacion
                });
                message.success('Cabecera de Evaluación actualizada.');
                navigate('/mantenimiento/evaluaciones');
            } catch (error) {
                message.error(error.response?.data?.error || 'Error al actualizar la cabecera.');
            }
        } else {
            // Flujo de creación unificada
            try {
                const response = await api.post(API_BASE, payload);
                message.success(response.data.message);
                navigate('/mantenimiento/evaluaciones');
            } catch (error) {
                const errorMsg = error.response?.data?.error || 'Error al guardar la evaluación completa.';
                message.error(errorMsg);
                console.error(error);
            }
        }

        setIsSubmitting(false);
    };


    if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>;
    if (!recepcionData) return <Card><div style={{ textAlign: 'center', padding: '20px' }}>No se pudo cargar la información de la Recepción.</div></Card>;
    if (isEditing) return <Card><div style={{ textAlign: 'center', padding: '20px' }}>El modo de edición aún no soporta este flujo de formulario.</div></Card>;


    return (
        <div style={{ padding: 24 }}>
            <Card>
                <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
                    <Title level={3} style={{ margin: 0 }}>
                        Crear Evaluación Técnica
                    </Title>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/mantenimiento/evaluaciones')}>
                        Volver al Listado
                    </Button>
                </Row>

                {/* Información de Recepción (BPC y SOLPED SEPARADOS) */}
                <Card title="Información de Recepción" size="small" style={{ marginBottom: 20 }}>
                    <Descriptions
                        bordered
                        column={4}
                        size="small"
                        styles={{ label: { fontWeight: 'bold' } }} // Corregida la advertencia labelStyle
                    >
                        <Descriptions.Item label="Cliente" span={2}>
                            {recepcionData?.cliente_nombre || 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="BPC" span={1}>
                            {recepcionData?.codigo_bpc || 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="SOLPED" span={1}>
                            {recepcionData?.codigo_solped || 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Problema Reportado" span={4}>
                            {recepcionData?.descripcion_problema || 'N/A'}
                        </Descriptions.Item>
                    </Descriptions>
                </Card>

                {/* Formulario Principal */}
                <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ fecha_evaluacion: moment() }}>

                    {/* 1. SECCIÓN DE MATERIALES Y MANO DE OBRA */}
                    <Title level={4} style={{ marginTop: 0, marginBottom: 15 }}>1. Definición de Recursos y Horas</Title>

                    <Row gutter={24}>
                        <Col span={12}>
                            {/* Componente que usa el formulario interno mForm */}
                            <MaterialFormWrapper form={mForm} onAddMaterial={onAddMaterial} productosOptions={productosOptions} />
                        </Col>
                        <Col span={12}>
                            {/* Componente que usa el formulario interno moForm */}
                            <ManoObraFormWrapper form={moForm} onAddManoObra={onAddManoObra} actividadesOptions={actividadesOptions} />
                        </Col>
                    </Row>

                    {/* RESUMEN DE MATERIALES Y MANO DE OBRA SELECCIONADOS */}
                    <Card title="Resumen de Elementos Seleccionados" size="small" style={{ marginBottom: 20 }}>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Text strong>Materiales ({materiales.length})</Text>
                                <List
                                    size="small"
                                    bordered
                                    dataSource={materiales}
                                    renderItem={(item, index) => (
                                        <List.Item
                                            actions={[<Button danger icon={<MinusCircleOutlined />} size="small" onClick={() => setMateriales(materiales.filter((_, i) => i !== index))} />]}
                                        >
                                            <Text>{item.nombre_display}</Text>
                                            <Text type="secondary">x {parseFloat(item.cantidad).toFixed(2)}</Text>
                                        </List.Item>
                                    )}
                                    locale={{ emptyText: 'No hay materiales seleccionados' }}
                                />
                            </Col>
                            <Col span={12}>
                                <Text strong>Mano de Obra ({manoObra.length})</Text>
                                <List
                                    size="small"
                                    bordered
                                    dataSource={manoObra}
                                    renderItem={(item, index) => (
                                        <List.Item
                                            actions={[<Button danger icon={<MinusCircleOutlined />} size="small" onClick={() => setManoObra(manoObra.filter((_, i) => i !== index))} />]}
                                        >
                                            <Text>{item.nombre_display}</Text>
                                            <Text type="secondary">x {parseFloat(item.cantidad_horas).toFixed(2)} hrs</Text>
                                        </List.Item>
                                    )}
                                    locale={{ emptyText: 'No hay actividades de MO seleccionadas' }}
                                />
                            </Col>
                        </Row>
                    </Card>

                    {/* 2. DATOS DE CABECERA Y COMENTARIOS DEL TÉCNICO (SECCIÓN FINAL) */}
                    <Title level={4} style={{ marginTop: 0, marginBottom: 15 }}>2. Hallazgos y Fecha Final</Title>
                    <Card title="Datos Finales de la Evaluación" size="small" style={{ marginBottom: 20 }}>
                        <Row gutter={16}>
                            <Col span={6}>
                                <Form.Item name="fecha_evaluacion" label="Fecha Evaluación" rules={[{ required: true }]}>
                                    <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col span={18}>
                                <Form.Item name="comentarios" label="Comentarios del Técnico (Hallazgos)">
                                    <Input.TextArea rows={3} placeholder="Ingrese los hallazgos principales y la conclusión técnica..." />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>

                    <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="large" loading={isSubmitting}>
                            Crear Evaluación Completa
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default EvaluacionesForm;