import React, { useState, useEffect } from 'react';
import {
    Modal, Form, InputNumber, Select, message, Input, Button, Space,
    Row, Col, Divider, Typography, Card, Statistic, Spin
} from 'antd';
import { DollarOutlined, CalculatorOutlined, SaveOutlined } from '@ant-design/icons';
import api from '../../api/api';

const { Title, Text } = Typography;
const { Option } = Select;
const API_BASE = '/mantenimiento/evaluaciones';

const CotizacionMantenimiento = ({ visible, onCancel, evaluacionId, refreshDetalle }) => {
    const [form] = Form.useForm();
    const [cotizacionData, setCotizacionData] = useState(null);
    const [calculating, setCalculating] = useState(false);
    const [saving, setSaving] = useState(false);

    // Opciones reales extraídas de tu base de datos (simulación de carga inicial)
    // Moneda: PEN (1), USD (2) 
    const opcionesMoneda = [{ id: 1, nombre: 'SOLES (PEN)' }, { id: 2, nombre: 'DÓLARES (USD)' }];
    // Forma de Pago: Se asume que se cargan de contabilidad.formas_pago (IDs 1 y 5 son CONTADO y CRÉDITO 30 DÍAS)
    const opcionesFormaPago = [
        { id: 1, nombre: 'CONTADO (001)' },
        { id: 5, nombre: 'CRÉDITO 30 DÍAS (005)' },
        { id: 48, nombre: 'FACTORING 60 DÍAS (048)' },
    ];

    // Valores iniciales (coinciden con CotizadorService.js)
    const initialValues = {
        tasa_cambio: 3.20,
        tipo_flete: 'maritimo',
        // Valores de factores inicializados como inactivos (0) con factor 0
        factoring_estado: 0, factoring_factor: 0,
        gastos_financieros_estado: 0, gastos_financieros_factor: 0,
        negociacion_estado: 0, negociacion_factor: 0,
        moneda_id: opcionesMoneda.find(m => m.nombre.includes('DÓLARES'))?.id || 2,
        forma_pago_id: opcionesFormaPago[0]?.id || 1,
    };

    // --- Lógica de Cálculo (llama al POST /evaluaciones/:id/cotizacion/calcular) ---
    const handleCalcularCotizacion = async (values) => {
        setCalculating(true);
        setCotizacionData(null);
        try {
            // Estructura de envío basada en cotizacionManController.js y CotizadorService.js
            const payload = {
                tasa_cambio: values.tasa_cambio,
                tipo: values.tipo_flete,
                factores: {
                    factoring: { checked: values.factoring_estado === 1, num: values.factoring_factor },
                    gastos_financieros: { checked: values.gastos_financieros_estado === 1, num: values.gastos_financieros_factor },
                    negociacion: { checked: values.negociacion_estado === 1, num: values.negociacion_factor }
                }
            };

            const response = await api.post(`${API_BASE}/${evaluacionId}/cotizacion/calcular`, payload);

            setCotizacionData(response.data.cotizacion_calculada);
            message.success('Cálculo de cotización completado.');

        } catch (error) {
            console.error("Error al calcular cotización:", error);
            const errorMsg = error.response?.data?.details || error.response?.data?.error || 'Error al calcular cotización.';
            message.error(errorMsg);
        } finally {
            setCalculating(false);
        }
    };

    // --- Lógica de Guardado (llama al POST /evaluaciones/:id/cotizacion/guardar) ---
    const handleGuardarCotizacion = async (values) => {
        if (!cotizacionData || !cotizacionData.calculos_globales_cotizacion) {
            message.error("Debe realizar un cálculo de cotización primero.");
            return;
        }

        setSaving(true);
        try {
            // Se asume que Total Estimado es Costos Directos + Servicios Con Utilidad (Total a vender)
            const servConUtilidadTotal = cotizacionData?.servicios_data_procesada?.con_utilidad?.calculos?.totalusd || 0;
            const costosDirectos = cotizacionData?.calculos_globales_cotizacion?.costos_directos || 0;
            const totalEstimado = (costosDirectos + servConUtilidadTotal).toFixed(2);

            if (parseFloat(totalEstimado) <= 0) {
                message.error("El total estimado debe ser mayor a cero.");
                setSaving(false);
                return;
            }

            // Payload final para la inserción en ventas.cotizacion_cliente
            await api.post(`${API_BASE}/${evaluacionId}/cotizacion/guardar`, {
                evaluacionId: evaluacionId,
                totalEstimado: totalEstimado,
                comentarios: values.comentarios_cotizacion,
                monedaId: values.moneda_id,
                formaPagoId: values.forma_pago_id,
            });

            message.success('Cotización guardada exitosamente y equipo actualizado a COTIZACION PENDIENTE.');
            onCancel();
            refreshDetalle();

        } catch (error) {
            console.error("Error al guardar cotización:", error);
            const errorMsg = error.response?.data?.details || error.response?.data?.error || 'Error al guardar cotización.';
            message.error(errorMsg);
        } finally {
            setSaving(false);
        }
    };

    // --- Resumen de Costos ---
    const materialesTotal = cotizacionData?.materiales_data_procesada?.calculos?.totalusd || 0;
    const manoObraTotal = cotizacionData?.mano_obra_data_procesada?.calculos?.totalusd || 0;
    const servSinUtilidadTotal = cotizacionData?.servicios_data_procesada?.sin_utilidad?.calculos?.totalusd || 0;
    const servConUtilidadTotal = cotizacionData?.servicios_data_procesada?.con_utilidad?.calculos?.totalusd || 0;
    const costosDirectos = cotizacionData?.calculos_globales_cotizacion?.costos_directos || 0;

    const renderResumenCostos = () => (
        <Row gutter={16} style={{ marginTop: 20 }}>
            <Col span={12}>
                <Card size="small" title="Costos Directos Calculados (USD)" style={{ backgroundColor: '#e6f7ff' }}>
                    <Statistic title="1. Materiales" value={materialesTotal} precision={2} prefix="$" />
                    <Statistic title="2. Mano de Obra" value={manoObraTotal} precision={2} prefix="$" />
                    <Statistic title="3. Auxiliares Sin Utilidad" value={servSinUtilidadTotal} precision={2} prefix="$" />
                    <Divider style={{ margin: '8px 0' }} />
                    <Statistic title="TOTAL COSTOS DIRECTOS" value={costosDirectos} precision={2} prefix="$" valueStyle={{ color: '#096dd9' }} />
                </Card>
            </Col>
            <Col span={12}>
                <Card size="small" title="Venta Final Estimada (USD)" style={{ backgroundColor: '#fffbe6', height: '100%' }}>
                    <Statistic title="4. Auxiliares Con Utilidad" value={servConUtilidadTotal} precision={2} prefix="$" />
                    <Divider style={{ margin: '8px 0' }} />
                    <Statistic
                        title="TOTAL A VENDER (CD + Utilidad)"
                        value={costosDirectos + servConUtilidadTotal}
                        precision={2}
                        prefix="$"
                        valueStyle={{ color: '#d46b08' }}
                    />
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                        * Este valor será la base para la Cotización de Ventas (El backend aplica IGV).
                    </Text>
                </Card>
            </Col>
        </Row>
    );

    return (
        <Modal
            title={<Title level={4} style={{ margin: 0 }}><CalculatorOutlined /> Cálculo de Cotización Técnica</Title>}
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={1000}
            destroyOnClose
        >
            <Spin spinning={calculating || saving} tip={saving ? "Guardando Cotización en Ventas..." : "Calculando costos..."}>
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={initialValues}
                    onFinish={handleCalcularCotizacion}
                >
                    <Title level={5} style={{ marginTop: 0 }}>1. Parámetros de Cálculo (Recálculo)</Title>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="tasa_cambio" label="Tasa de Cambio (PEN/USD)" rules={[{ required: true, message: 'Requerido' }]}>
                                <InputNumber min={0.01} step={0.01} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="tipo_flete" label="Tipo de Flete">
                                <Select>
                                    <Option value="maritimo">Marítimo</Option>
                                    <Option value="aereo">Aéreo</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Ejecutar Cálculo">
                                <Button type="primary" htmlType="submit" icon={<CalculatorOutlined />} block loading={calculating}>
                                    {cotizacionData ? 'Recalcular' : 'Calcular Costos'}
                                </Button>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider orientation="left" style={{ margin: '15px 0' }}>Factores Adicionales (%)</Divider>
                    <Row gutter={16}>
                        {['factoring', 'gastos_financieros', 'negociacion'].map(key => (
                            <Col span={8} key={key}>
                                <Form.Item label={key.charAt(0).toUpperCase() + key.slice(1)}>
                                    <Input.Group compact>
                                        <Form.Item name={`${key}_estado`} noStyle>
                                            <Select style={{ width: '30%' }}>
                                                <Option value={1}>Activo</Option>
                                                <Option value={0}>Inactivo</Option>
                                            </Select>
                                        </Form.Item>
                                        <Form.Item name={`${key}_factor`} noStyle>
                                            <InputNumber
                                                min={0} step={0.01}
                                                placeholder="Factor (%)"
                                                style={{ width: '70%' }}
                                                formatter={value => `${value}%`}
                                                parser={value => value.replace('%', '')}
                                            />
                                        </Form.Item>
                                    </Input.Group>
                                </Form.Item>
                            </Col>
                        ))}
                    </Row>

                    {cotizacionData && renderResumenCostos()}

                    <Divider orientation="left" style={{ margin: '15px 0' }}><DollarOutlined /> 2. Registro Final en Ventas</Divider>

                    <Form.Item noStyle shouldUpdate>
                        {() => (
                            <Row gutter={16}>
                                <Col span={8}>
                                    <Form.Item name="moneda_id" label="Moneda de Venta" rules={[{ required: true, message: 'Requerido' }]}>
                                        <Select placeholder="Seleccione Moneda" disabled={!cotizacionData}>
                                            {opcionesMoneda.map(m => <Option key={m.id} value={m.id}>{m.nombre}</Option>)}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name="forma_pago_id" label="Forma de Pago" rules={[{ required: true, message: 'Requerido' }]}>
                                        <Select placeholder="Seleccione Forma de Pago" disabled={!cotizacionData}>
                                            {opcionesFormaPago.map(fp => <Option key={fp.id} value={fp.id}>{fp.nombre}</Option>)}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name="comentarios_cotizacion" label="Comentarios para la Cotización (Ventas)">
                                        <Input.TextArea rows={1} disabled={!cotizacionData} />
                                    </Form.Item>
                                </Col>
                            </Row>
                        )}
                    </Form.Item>

                    <Form.Item style={{ textAlign: 'right', marginTop: 20 }}>
                        <Space>
                            <Button onClick={onCancel} disabled={saving}>
                                Cancelar
                            </Button>
                            <Button
                                type="primary"
                                onClick={() => form.validateFields().then(handleGuardarCotizacion)}
                                loading={saving}
                                disabled={!cotizacionData || saving}
                                icon={<SaveOutlined />}
                            >
                                Guardar Cotización Final en Ventas
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Spin>
        </Modal>
    );
};

export default CotizacionMantenimiento;