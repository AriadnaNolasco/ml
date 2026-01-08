import React, { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Modal,
    message,
    Card,
    Space,
    Tag,
    Spin,
    Row,
    Col,
    Typography,
    Input
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    EyeOutlined,
    DeleteOutlined,
    ReloadOutlined,
    SearchOutlined
} from '@ant-design/icons';
import api from '../../api/api';
import TransportistaForm from './TransportistaForm';
import TransportistaDetalle from './TransportistaDetalle';

const { Title } = Typography;
const { Search } = Input;

const Transportistas = ({ user }) => {
    const [transportistas, setTransportistas] = useState([]);
    const [paises, setPaises] = useState([]);
    const [tiposDocumento, setTiposDocumento] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingFormData, setLoadingFormData] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [editingTransportista, setEditingTransportista] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        cargarTransportistas();
        cargarDatosFormulario();
    }, []);

    const cargarTransportistas = async () => {
        setLoading(true);
        try {
            const response = await api.get('/ventas/transportistas');
            setTransportistas(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error al cargar transportistas:', error);
            message.error('Error al cargar la lista de transportistas');
            setTransportistas([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            const response = await api.get('/ventas/transportistas');
            setTransportistas(Array.isArray(response.data) ? response.data : []);
            message.success('Lista actualizada');
        } catch (error) {
            console.error('Error al cargar transportistas:', error);
            message.error('Error al cargar la lista de transportistas');
        } finally {
            setRefreshing(false);
        }
    };

    const cargarDatosFormulario = async () => {
        setLoadingFormData(true);
        try {
            const response = await api.get('/ventas/formularios/datos');
            const formData = response.data;
            setPaises(formData.paises || []);
            setTiposDocumento(formData.tiposDocumento || []);
        } catch (error) {
            console.error('Error al cargar datos del formulario:', error);
            message.error('Error al cargar los datos del formulario');
            setPaises([]);
            setTiposDocumento([]);
        } finally {
            setLoadingFormData(false);
        }
    };

    const handleCreate = () => {
        setEditingTransportista(null);
        setModalVisible(true);
    };

    const handleEdit = async (record) => {
        try {
            const response = await api.get(`/ventas/transportistas/${record.codigo}`);
            setEditingTransportista(response.data);
            setModalVisible(true);
        } catch (error) {
            console.error('Error al cargar transportista:', error);
            message.error('Error al cargar los datos del transportista');
        }
    };

    const handleView = async (record) => {
        try {
            const response = await api.get(`/ventas/transportistas/${record.codigo}`);
            setEditingTransportista(response.data);
            setDetailModalVisible(true);
        } catch (error) {
            console.error('Error al cargar transportista:', error);
            message.error('Error al cargar los detalles del transportista');
        }
    };

    const handleDelete = async (codigo) => {
        Modal.confirm({
            title: '¿Está seguro de eliminar este transportista?',
            content: 'Esta acción no se puede deshacer.',
            okText: 'Sí, eliminar',
            okType: 'danger',
            cancelText: 'Cancelar',
            onOk: async () => {
                try {
                    await api.delete(`/ventas/transportistas/${codigo}`);
                    message.success('Transportista eliminado correctamente');
                    cargarTransportistas();
                } catch (error) {
                    console.error('Error al eliminar transportista:', error);
                    const errorMsg = error.response?.data?.error || 'Error al eliminar el transportista';
                    message.error(errorMsg);
                }
            }
        });
    };

    const handleToggleStatus = async (codigo, currentStatus) => {
        try {
            await api.patch(`/ventas/transportistas/${codigo}/estado`, {
                estado: !currentStatus
            });

            message.success(`Transportista ${!currentStatus ? 'activado' : 'desactivado'} correctamente`);
            cargarTransportistas();
        } catch (error) {
            console.error('Error al cambiar estado:', error);
            message.error('Error al cambiar el estado del transportista');
        }
    };

    const handleSubmitSuccess = () => {
        setModalVisible(false);
        cargarTransportistas();
    };

    const filteredTransportistas = transportistas.filter(transportista => {
        const searchLower = searchTerm.toLowerCase();
        return (
            (transportista.razon_social && transportista.razon_social.toLowerCase().includes(searchLower)) ||
            (transportista.nomb_comercial && transportista.nomb_comercial.toLowerCase().includes(searchLower)) ||
            (transportista.nro_documento && transportista.nro_documento.includes(searchTerm)) ||
            (transportista.codigo && transportista.codigo.toLowerCase().includes(searchLower)) ||
            (transportista.email && transportista.email.toLowerCase().includes(searchLower))
        );
    });

    const columns = [
        {
            title: 'Código',
            dataIndex: 'codigo',
            key: 'codigo',
            width: 100,
            sorter: (a, b) => a.codigo.localeCompare(b.codigo),
        },
        {
            title: 'Documento',
            key: 'documento',
            width: 150,
            render: (_, record) => (
                <div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                        {record.tipo_documento || 'N/A'}
                    </div>
                    <div>{record.nro_documento || 'N/A'}</div>
                </div>
            ),
        },
        {
            title: 'Razón Social',
            dataIndex: 'razon_social',
            key: 'razon_social',
            ellipsis: true,
            sorter: (a, b) => (a.razon_social || '').localeCompare(b.razon_social || ''),
        },
        {
            title: 'Nombre Comercial',
            dataIndex: 'nomb_comercial',
            key: 'nomb_comercial',
            ellipsis: true,
            render: (text) => text || 'N/A'
        },
        {
            title: 'País',
            dataIndex: 'pais',
            key: 'pais',
            width: 100,
            render: (text) => text || 'N/A'
        },
        {
            title: 'Contacto',
            key: 'contacto',
            width: 120,
            render: (_, record) => {
                const telefono = record.celular1 || record.telefono1 || 'N/A';
                const email = record.email || 'N/A';
                return (
                    <div>
                        <div style={{ fontSize: '12px' }}>{telefono}</div>
                        <div style={{ fontSize: '11px', color: '#666' }}>{email}</div>
                    </div>
                );
            },
        },
        {
            title: 'Estado',
            key: 'estado',
            width: 100,
            filters: [
                { text: 'Activo', value: true },
                { text: 'Inactivo', value: false },
            ],
            onFilter: (value, record) => record.estado === value,
            render: (_, record) => (
                <Tag
                    color={record.estado ? 'green' : 'red'}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleToggleStatus(record.codigo, record.estado)}
                    title="Clic para cambiar estado"
                >
                    {record.estado ? 'Activo' : 'Inactivo'}
                </Tag>
            ),
        },
        {
            title: 'Acciones',
            key: 'acciones',
            width: 120,
            render: (_, record) => (
                <Space size="small">
                    <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => handleView(record)}
                        title="Ver detalles"
                    />
                    <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                        title="Editar"
                    />
                    <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record.codigo)}
                        title="Eliminar"
                    />
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            <Card>
                <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
                    <Col>
                        <Title level={3} style={{ margin: 0 }}>
                            Gestión de Transportistas
                        </Title>
                        <p style={{ margin: 0, color: '#666' }}>
                            Total de transportistas: {transportistas.length}
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
                                onClick={handleCreate}
                                size="large"
                            >
                                Nuevo Transportista
                            </Button>
                        </Space>
                    </Col>
                </Row>

                <Row style={{ marginBottom: 20 }}>
                    <Col span={24}>
                        <Search
                            placeholder="Buscar por código, RUC/DNI, razón social, nombre comercial o email..."
                            allowClear
                            enterButton={<SearchOutlined />}
                            size="large"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onSearch={handleRefresh}
                        />
                    </Col>
                </Row>

                <Table
                    columns={columns}
                    dataSource={filteredTransportistas}
                    loading={loading}
                    rowKey="codigo"
                    locale={{
                        emptyText: 'No se encontraron transportistas'
                    }}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50'],
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} de ${total} transportistas`
                    }}
                    scroll={{ x: 1200 }}
                    size="middle"
                />
            </Card>

            {/* Modal para crear/editar transportista */}
            <Modal
                title={editingTransportista ? 'Editar Transportista' : 'Nuevo Transportista'}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width={900}
                destroyOnClose
            >
                <TransportistaForm
                    editingTransportista={editingTransportista}
                    paises={paises}
                    tiposDocumento={tiposDocumento}
                    loadingFormData={loadingFormData}
                    onSuccess={handleSubmitSuccess}
                    onCancel={() => setModalVisible(false)}
                />
            </Modal>

            {/* Modal para ver detalles del transportista */}
            <Modal
                title="Detalles del Transportista"
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setDetailModalVisible(false)}>
                        Cerrar
                    </Button>,
                    <Button
                        key="edit"
                        type="primary"
                        onClick={() => {
                            setDetailModalVisible(false);
                            handleEdit(editingTransportista);
                        }}
                    >
                        Editar
                    </Button>
                ]}
                width={900}
            >
                <TransportistaDetalle
                    transportista={editingTransportista}
                />
            </Modal>
        </div>
    );
};

export default Transportistas;