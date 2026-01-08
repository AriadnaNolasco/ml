import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, Alert, message, Space, Typography } from 'antd';
import { SearchOutlined, BoxPlotOutlined } from '@ant-design/icons';
import api from '../../../../api/api';

const { Option } = Select;
const { Text } = Typography;

const ModalMaterial = ({ open, onClose, onSubmit, loading }) => {
    const [form] = Form.useForm();
    const [productos, setProductos] = useState([]);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loadingProductos, setLoadingProductos] = useState(false);

    useEffect(() => {
        if (open) {
            loadProductos();
            form.resetFields();
            setProductoSeleccionado(null);
            setSearchTerm('');
        }
    }, [open, form]);

    const loadProductos = async () => {
        try {
            setLoadingProductos(true);
            const response = await api.get('/almacen/productos');
            setProductos(response.data.productos || []);
        } catch (error) {
            console.error('Error cargando productos:', error);
            message.error('Error al cargar la lista de productos');
            setProductos([]);
        } finally {
            setLoadingProductos(false);
        }
    };

    const handleProductoChange = (codigo) => {
        const producto = productos.find(p => p.codigo === codigo);
        
        if (producto) {
            setProductoSeleccionado(producto);
            form.setFieldsValue({
                costo_unitario: producto.precio_venta || '',
                unidad: producto.unidad || 'UND'
            });
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            
            await onSubmit({
                producto_codigo: values.producto_codigo,
                cantidad: parseFloat(values.cantidad),
                unidad: values.unidad,
                costo_unitario: parseFloat(values.costo_unitario)
            });

            form.resetFields();
            setProductoSeleccionado(null);
        } catch (error) {
            console.error('Error en validación:', error);
        }
    };

    const productosFiltrados = productos.filter(p => 
        p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const calcularTotal = () => {
        const cantidad = form.getFieldValue('cantidad') || 0;
        const costo = form.getFieldValue('costo_unitario') || 0;
        return (cantidad * costo).toFixed(2);
    };

    return (
        <Modal
            title={
                <Space>
                    <BoxPlotOutlined />
                    <span>Agregar Material / Repuesto</span>
                </Space>
            }
            open={open}
            onCancel={onClose}
            onOk={handleSubmit}
            confirmLoading={loading}
            okText="Agregar Material"
            cancelText="Cancelar"
            width={700}
            okButtonProps={{
                style: { backgroundColor: '#52c41a', borderColor: '#52c41a' }
            }}
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    unidad: 'UND',
                    cantidad: 1
                }}
            >
                {/* Buscador de Producto */}
                <Form.Item
                    label={
                        <Space>
                            <SearchOutlined />
                            <span>Buscar Producto</span>
                        </Space>
                    }
                >
                    <Input
                        placeholder="Buscar por nombre o código..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        size="large"
                        allowClear
                    />
                </Form.Item>

                {/* Producto */}
                <Form.Item
                    name="producto_codigo"
                    label="Producto"
                    rules={[{ required: true, message: 'Debe seleccionar un producto' }]}
                >
                    <Select
                        placeholder="Seleccionar producto..."
                        size="large"
                        showSearch
                        optionFilterProp="children"
                        loading={loadingProductos}
                        onChange={handleProductoChange}
                        filterOption={(input, option) =>
                            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                        }
                    >
                        {productosFiltrados.map(producto => (
                            <Option key={producto.codigo} value={producto.codigo}>
                                {producto.codigo} - {producto.nombre}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                {/* Información del producto seleccionado */}
                {productoSeleccionado && (
                    <Alert
                        message="Información del Producto"
                        description={
                            <Space direction="vertical" size={0}>
                                <Text>
                                    <strong>Stock disponible:</strong> {productoSeleccionado.stock || 0} {productoSeleccionado.unidad}
                                </Text>
                                <Text>
                                    <strong>Precio referencial:</strong> S/ {parseFloat(productoSeleccionado.precio_venta || 0).toFixed(2)}
                                </Text>
                            </Space>
                        }
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                )}

                {/* Cantidad y Unidad */}
                <Space style={{ width: '100%' }} size="large">
                    <Form.Item
                        name="cantidad"
                        label="Cantidad"
                        rules={[
                            { required: true, message: 'Ingrese cantidad' },
                            { type: 'number', min: 0.01, message: 'Debe ser mayor a 0' }
                        ]}
                        style={{ flex: 1 }}
                    >
                        <InputNumber
                            placeholder="Ej: 5"
                            style={{ width: '100%' }}
                            size="large"
                            min={0.01}
                            step={0.01}
                            precision={2}
                        />
                    </Form.Item>

                    <Form.Item
                        name="unidad"
                        label="Unidad"
                        style={{ flex: 1 }}
                    >
                        <Input
                            placeholder="Ej: UND, KG, M"
                            size="large"
                        />
                    </Form.Item>
                </Space>

                {/* Costo Unitario */}
                <Form.Item
                    name="costo_unitario"
                    label="Costo Unitario (S/)"
                    rules={[
                        { required: true, message: 'Ingrese el costo unitario' },
                        { type: 'number', min: 0.01, message: 'Debe ser mayor a 0' }
                    ]}
                    extra="Este costo se guardará como referencia histórica"
                >
                    <InputNumber
                        placeholder="Ej: 25.50"
                        style={{ width: '100%' }}
                        size="large"
                        min={0.01}
                        step={0.01}
                        precision={2}
                        prefix="S/"
                    />
                </Form.Item>

                {/* Total Calculado */}
                <Alert
                    message={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text strong>Total:</Text>
                            <Text strong style={{ fontSize: '20px', color: '#52c41a' }}>
                                S/ {calcularTotal()}
                            </Text>
                        </div>
                    }
                    type="success"
                    style={{ marginTop: 16 }}
                />
            </Form>
        </Modal>
    );
};

export default ModalMaterial;