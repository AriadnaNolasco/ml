import React, { useState, useEffect } from "react";
import {
    Table, Button, Card, Space, Tag, Spin, Row, Col, Typography, Input, Tooltip, Modal
} from "antd";
import { DollarOutlined, ReloadOutlined, SearchOutlined, FileTextOutlined } from "@ant-design/icons";
import api from "../../api/api";
import CotizacionMantenimiento from './CotizacionMantenimiento';

const { Title } = Typography;
const { Search } = Input;
const API_BASE = '/mantenimiento/evaluaciones';

const CotizacionList = ({ navigate }) => {
    const [evaluacionesPendientes, setEvaluacionesPendientes] = useState([]);
    const [cotizacionesRealizadas, setCotizacionesRealizadas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Estados para el modal de cotización
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedEvaluacionId, setSelectedEvaluacionId] = useState(null);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            // Endpoint para obtener todas las evaluaciones (el backend debería filtrar los datos esenciales)
            const [evalResp, cotizResp] = await Promise.all([
                api.get(`${API_BASE}/pendientes-cotizacion`), // Asumimos este endpoint para pendientes
                api.get('/ventas/cotizaciones/mantenimiento') // Asumimos este endpoint para cotizaciones realizadas
            ]);

            // Filtrar las evaluaciones que aún no tienen una cotización finalizada (estado 'EN EVALUACION')
            // Se necesita una forma de obtener solo las evaluaciones que el Encargado debe cotizar.
            // Por ahora, usaremos las que están en estado 'EN EVALUACION' o 'COTIZACION PENDIENTE'
            const todasEvaluaciones = Array.isArray(evalResp.data) ? evalResp.data : [];
            setEvaluacionesPendientes(todasEvaluaciones.filter(e =>
                e.estado_proceso === 'EN EVALUACION' || e.estado_proceso === 'COTIZACION PENDIENTE'
            ));

            setCotizacionesRealizadas(Array.isArray(cotizResp.data) ? cotizResp.data : []);

        } catch (error) {
            console.error("Error al cargar datos de cotización:", error);
            message.error("Error al cargar listados de cotización.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await cargarDatos();
        message.success("Lista de cotizaciones actualizada.");
    };

    const handleCotizar = (evaluacionId) => {
        setSelectedEvaluacionId(evaluacionId);
        setIsModalVisible(true);
    };

    const handleModalClose = () => {
        setIsModalVisible(false);
        setSelectedEvaluacionId(null);
        handleRefresh(); // Recargar datos después de guardar/cancelar
    }

    // Columnas para Evaluaciones Pendientes de Cotización
    const columnsPendientes = [
        {
            title: "ID Evaluación",
            dataIndex: "id",
            key: "id",
            width: 120,
            render: (text) => <Tag color="blue">{text}</Tag>,
        },
        {
            title: "Equipo (BPC)",
            dataIndex: "codigo_bpc",
            key: "codigo_bpc",
            width: 150,
            render: (text) => <strong>{text}</strong>,
        },
        {
            title: "Cliente",
            dataIndex: "cliente_nombre",
            key: "cliente_nombre",
            ellipsis: true,
        },
        {
            title: "Técnico Eval.",
            dataIndex: "tecnico_nombre",
            key: "tecnico_nombre",
            width: 150,
            render: (text) => text || "N/A",
        },
        {
            title: "Fecha Eval.",
            dataIndex: "fecha_evaluacion",
            key: "fecha_evaluacion",
            width: 120,
            render: (date) => new Date(date).toLocaleDateString(),
        },
        {
            title: "Acciones",
            key: "acciones",
            width: 150,
            render: (_, record) => (
                <Button
                    size="small"
                    type="primary"
                    icon={<DollarOutlined />}
                    onClick={() => handleCotizar(record.id)}
                >
                    Cotizar
                </Button>
            ),
        },
    ];

    // Columnas para Cotizaciones Realizadas
    const columnsRealizadas = [
        {
            title: "ID Cotiz.",
            dataIndex: "id_cotizacion",
            key: "id_cotizacion",
            width: 100,
            render: (text) => <Tag color="green">{text}</Tag>,
        },
        {
            title: "Nro. Venta",
            dataIndex: "numero",
            key: "numero",
            width: 120,
        },
        {
            title: "BPC",
            dataIndex: "codigo_bpc",
            key: "codigo_bpc",
            width: 100,
        },
        {
            title: "Cliente",
            dataIndex: "razon_social_cliente",
            key: "razon_social_cliente",
            ellipsis: true,
        },
        {
            title: "Monto Total",
            dataIndex: "total",
            key: "total",
            width: 120,
            align: 'right',
            render: (total, record) => {
                const moneda = record.moneda_codigo || 'S/'; // Asumir la moneda
                return <strong>{moneda} {parseFloat(total).toFixed(2)}</strong>;
            }
        },
        {
            title: "Estado",
            dataIndex: "estado",
            key: "estado",
            width: 120,
            render: (estado) => <Tag color={estado === 'APROBADO' ? 'success' : 'processing'}>{estado}</Tag>
        },
        {
            title: "Acciones",
            key: "acciones",
            width: 120,
            render: (_, record) => (
                <Tooltip title="Ver detalle de Cotización">
                    <Button size="small" icon={<FileTextOutlined />} />
                </Tooltip>
            ),
        },
    ];

    // Filtrado simple (puedes implementarlo de forma más robusta)
    const filteredPendientes = evaluacionesPendientes.filter(e =>
        e.cliente_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.codigo_bpc?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredRealizadas = cotizacionesRealizadas.filter(c =>
        c.razon_social_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.codigo_bpc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.numero?.includes(searchTerm)
    );

    return (
        <div style={{ padding: 24 }}>
            <Card>
                <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
                    <Col>
                        <Title level={3} style={{ margin: 0 }}>
                            <DollarOutlined style={{ marginRight: 8 }} />
                            Gestión de Cotizaciones de Mantenimiento
                        </Title>
                        <p style={{ margin: 0, color: "#666" }}>
                            Panel para el rol de Encargado/Comercial.
                        </p>
                    </Col>
                    <Col>
                        <Space>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={handleRefresh}
                                loading={refreshing}
                                title="Actualizar lista"
                            >
                                Actualizar
                            </Button>
                        </Space>
                    </Col>
                </Row>

                <Row style={{ marginBottom: 20 }}>
                    <Col span={24}>
                        <Search
                            placeholder="Buscar por BPC o Cliente..."
                            allowClear
                            enterButton={<SearchOutlined />}
                            size="large"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </Col>
                </Row>

                <Spin spinning={loading}>
                    {/* 1. Evaluaciones Pendientes de Cotización */}
                    <Title level={4} style={{ marginTop: 0 }}>Evaluaciones Pendientes de Cotización</Title>
                    <Table
                        columns={columnsPendientes}
                        dataSource={filteredPendientes}
                        rowKey="id"
                        pagination={{ pageSize: 5 }}
                        locale={{ emptyText: "No hay evaluaciones pendientes para cotizar" }}
                        size="middle"
                        style={{ marginBottom: 40 }}
                    />

                    {/* 2. Cotizaciones Realizadas */}
                    <Title level={4}>Historial de Cotizaciones Generadas</Title>
                    <Table
                        columns={columnsRealizadas}
                        dataSource={filteredRealizadas}
                        rowKey="id_cotizacion"
                        pagination={{ pageSize: 10 }}
                        locale={{ emptyText: "No hay cotizaciones realizadas" }}
                        size="middle"
                    />
                </Spin>
            </Card>

            {/* Modal de Cotización */}
            {selectedEvaluacionId && (
                <CotizacionMantenimiento
                    visible={isModalVisible}
                    onCancel={handleModalClose}
                    evaluacionId={selectedEvaluacionId}
                    refreshDetalle={handleRefresh}
                />
            )}
        </div>
    );
};

export default CotizacionList;