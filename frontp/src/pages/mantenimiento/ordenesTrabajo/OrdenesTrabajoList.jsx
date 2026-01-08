import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Table, Button, Card, Space, Tag, Spin, Row, Col, Typography, Input, Select, Modal, message
} from "antd";
import {
    PlusOutlined, EyeOutlined, DeleteOutlined, ReloadOutlined, SearchOutlined, ToolOutlined
} from "@ant-design/icons";
import { getDashboardCounters, getOrdenesTrabajo, deleteOrdenTrabajo } from '../../../api/apiOrdenesMantenimiento';
import ContadoresOT from './components/ContadoresOT';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

const OrdenesTrabajoList = () => {
    const navigate = useNavigate();
    const [contadores, setContadores] = useState({});
    const [ordenes, setOrdenes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    const [search, setSearch] = useState('');
    const [motivoFilter, setMotivoFilter] = useState('');
    const [estadoFilter, setEstadoFilter] = useState('');
    const [page, setPage] = useState(1);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [countersData, ordenesData] = await Promise.all([
                getDashboardCounters(),
                getOrdenesTrabajo({ search, motivo: motivoFilter, estado: estadoFilter, page, limit: 10 })
            ]);
            
            setContadores(countersData);
            setOrdenes(ordenesData.data || []);
        } catch (error) {
            console.error('Error cargando datos:', error);
            message.error('Error al cargar las órdenes de trabajo');
        } finally {
            setLoading(false);
        }
    }, [search, motivoFilter, estadoFilter, page]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleDelete = (id, codigo) => {
        Modal.confirm({
            title: `Confirmar eliminación de orden ${codigo}`,
            content: 'Esta acción eliminará permanentemente la orden de trabajo.',
            okText: 'Eliminar',
            okType: 'danger',
            cancelText: 'Cancelar',
            onOk: async () => {
                try {
                    await deleteOrdenTrabajo(id);
                    message.success('Orden eliminada correctamente');
                    loadData();
                } catch (error) {
                    console.error('Error eliminando OT:', error);
                    message.error('Error al eliminar la orden');
                }
            }
        });
    };

    const getPrioridadColor = (prioridad) => {
        const colors = {
            'ALTA': 'red',
            'MEDIA': 'orange',
            'BAJA': 'green'
        };
        return colors[prioridad] || 'default';
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

    const columns = [
        {
            title: 'Código OT',
            dataIndex: 'codigo_ot',
            key: 'codigo_ot',
            width: 130,
            render: (text) => (
                <span style={{ fontWeight: 600, color: '#1677ff' }}>
                    {text}
                </span>
            ),
            sorter: (a, b) => (a.codigo_ot || '').localeCompare(b.codigo_ot || ''),
        },
        {
            title: 'Equipo',
            key: 'equipo',
            width: 250,
            render: (_, record) => (
                <div>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>
                        {record.equipo_bpc}
                    </div>
                    <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
                        {record.equipo_marca} {record.equipo_modelo}
                    </div>
                </div>
            ),
        },
        {
            title: 'Motivo',
            dataIndex: 'motivo',
            key: 'motivo',
            width: 150,
            filters: [
                { text: 'Reclamo', value: 'Reclamo' },
                { text: 'Muestra Fabricante', value: 'Muestra Fabricante' },
                { text: 'Muestra Evaluación', value: 'Muestra Evaluación' },
            ],
            onFilter: (value, record) => record.motivo === value,
        },
        {
            title: 'Técnico(s)',
            dataIndex: 'tecnicos_asignados',
            key: 'tecnicos_asignados',
            width: 180,
            render: (text) => text || <span style={{ color: '#bfbfbf' }}>Sin asignar</span>,
        },
        {
            title: 'Prioridad',
            dataIndex: 'prioridad',
            key: 'prioridad',
            width: 110,
            render: (prioridad) => (
                <Tag color={getPrioridadColor(prioridad)} style={{ fontWeight: 600, border: 'none' }}>
                    {prioridad}
                </Tag>
            ),
            filters: [
                { text: 'ALTA', value: 'ALTA' },
                { text: 'MEDIA', value: 'MEDIA' },
                { text: 'BAJA', value: 'BAJA' },
            ],
            onFilter: (value, record) => record.prioridad === value,
        },
        {
            title: 'Estado',
            dataIndex: 'estado',
            key: 'estado',
            width: 130,
            render: (estado) => (
                <Tag color={getEstadoColor(estado)} style={{ fontWeight: 600, border: 'none' }}>
                    {estado}
                </Tag>
            ),
            filters: [
                { text: 'SOLICITUD', value: 'SOLICITUD' },
                { text: 'REVISION', value: 'REVISION' },
                { text: 'EVALUACION', value: 'EVALUACION' },
                { text: 'EJECUCION', value: 'EJECUCION' },
                { text: 'CERRADA', value: 'CERRADA' },
            ],
            onFilter: (value, record) => record.estado === value,
        },
        {
            title: 'Fecha Creación',
            dataIndex: 'fecha_creacion',
            key: 'fecha_creacion',
            width: 130,
            render: (text) => new Date(text).toLocaleDateString('es-ES'),
            sorter: (a, b) => new Date(a.fecha_creacion) - new Date(b.fecha_creacion),
        },
        {
            title: 'Acciones',
            key: 'acciones',
            width: 100,
            fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/mantenimiento/ordenes-trabajo/${record.id}`)}
                        title="Ver detalle"
                    />
                    <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record.id, record.codigo_ot)}
                        title="Eliminar"
                    />
                </Space>
            ),
        },
    ];

    const filteredOrdenes = ordenes.filter((orden) => {
        const matchSearch = search
            ? (orden.codigo_ot || '').toLowerCase().includes(search.toLowerCase()) ||
              (orden.equipo_bpc || '').toLowerCase().includes(search.toLowerCase()) ||
              (orden.tecnicos_asignados || '').toLowerCase().includes(search.toLowerCase())
            : true;

        const matchMotivo = motivoFilter ? orden.motivo === motivoFilter : true;
        const matchEstado = estadoFilter ? orden.estado === estadoFilter : true;

        return matchSearch && matchMotivo && matchEstado;
    });

    return (
        <div style={{ padding: 24 }}>
            <Card bordered={false} style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)' }}>
                <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                    <Col>
                        <Title level={4} style={{ margin: 0, fontWeight: 500 }}>
                            <ToolOutlined style={{ marginRight: 12, color: '#1677ff' }} />
                            Órdenes de Trabajo
                        </Title>
                        <p style={{ margin: '4px 0 0', color: '#8c8c8c', fontSize: '13px' }}>
                            Total de órdenes: {ordenes.length}
                            {filteredOrdenes.length !== ordenes.length &&
                                ` (${filteredOrdenes.length} filtradas)`}
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
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => navigate('/mantenimiento/ordenes-trabajo/nuevo')}
                                size="large"
                            >
                                Nueva Orden
                            </Button>
                        </Space>
                    </Col>
                </Row>

                <div style={{ marginBottom: 24 }}>
                    <ContadoresOT contadores={contadores} />
                </div>

                <Row gutter={16} style={{ marginBottom: 24 }}>
                    <Col xs={24} md={12}>
                        <Search
                            placeholder="Buscar por código, equipo o técnico"
                            allowClear
                            enterButton={<SearchOutlined />}
                            size="large"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onSearch={loadData}
                        />
                    </Col>
                    <Col xs={12} md={6}>
                        <Select
                            placeholder="Filtrar por Motivo"
                            allowClear
                            style={{ width: '100%' }}
                            size="large"
                            value={motivoFilter || undefined}
                            onChange={(value) => setMotivoFilter(value || '')}
                        >
                            <Option value="Reclamo">Reclamo</Option>
                            <Option value="Muestra Fabricante">Muestra Fabricante</Option>
                            <Option value="Muestra Evaluación">Muestra Evaluación</Option>
                        </Select>
                    </Col>
                    <Col xs={12} md={6}>
                        <Select
                            placeholder="Filtrar por Estado"
                            allowClear
                            style={{ width: '100%' }}
                            size="large"
                            value={estadoFilter || undefined}
                            onChange={(value) => setEstadoFilter(value || '')}
                        >
                            <Option value="SOLICITUD">Solicitud</Option>
                            <Option value="REVISION">Revisión</Option>
                            <Option value="EVALUACION">Evaluación</Option>
                            <Option value="EJECUCION">Ejecución</Option>
                            <Option value="CERRADA">Cerrada</Option>
                        </Select>
                    </Col>
                </Row>

                {loading && !refreshing ? (
                    <div style={{ textAlign: 'center', padding: '60px' }}>
                        <Spin size="large" />
                        <p style={{ marginTop: 16, color: '#8c8c8c' }}>Cargando órdenes de trabajo</p>
                    </div>
                ) : (
                    <Table
                        columns={columns}
                        dataSource={filteredOrdenes}
                        loading={refreshing}
                        rowKey="id"
                        locale={{
                            emptyText: 'No se encontraron órdenes de trabajo',
                        }}
                        pagination={{
                            current: page,
                            pageSize: 10,
                            total: filteredOrdenes.length,
                            showSizeChanger: true,
                            pageSizeOptions: ['10', '20', '50'],
                            showQuickJumper: true,
                            showTotal: (total, range) =>
                                `${range[0]}-${range[1]} de ${total} órdenes`,
                            onChange: (newPage) => setPage(newPage),
                        }}
                        scroll={{ x: 1300 }}
                        size="middle"
                        style={{ border: '1px solid #f0f0f0', borderRadius: '2px' }}
                    />
                )}
            </Card>
        </div>
    );
};

export default OrdenesTrabajoList;