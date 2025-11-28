import React, { useEffect } from 'react';
import { Form, Input, Select, Button, Space, Spin, message } from 'antd';
import api from '../../api/api';

const { Option } = Select;

const AlmacenForm = ({ editingAlmacen, categorias, loadingCategorias, onSuccess, onCancel }) => {
    const [form] = Form.useForm();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    useEffect(() => {
        if (editingAlmacen) {
            form.setFieldsValue({
                codigo: editingAlmacen.codigo,
                nombre: editingAlmacen.nombre,
                siglas: editingAlmacen.siglas,
                id_categoria: editingAlmacen.id_categoria,
                tipo_alm: editingAlmacen.tipo_alm
            });
        } else {
            form.resetFields();
            form.setFieldsValue({
                tipo_alm: 'INTERNO'
            });
        }
    }, [editingAlmacen, form]);

    const handleSubmit = async (values) => {
        setIsSubmitting(true);
        try {
            if (editingAlmacen) {
                await api.put(`/almacen/almacenes/${editingAlmacen.codigo}`, values);
                message.success('Almacén actualizado correctamente');
            } else {
                await api.post('/almacen/almacenes', values);
                message.success('Almacén creado correctamente');
            }

            onSuccess();
        } catch (error) {
            console.error('Error al guardar almacén:', error);
            const errorMsg = error.response?.data?.error || 'Error al guardar el almacén';
            message.error(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
        >
            <Form.Item
                label="Código"
                name="codigo"
                rules={[
                    { required: true, message: 'Por favor ingrese el código' },
                    { max: 3, message: 'El código no puede exceder los 3 caracteres' },
                    { pattern: /^[0-9]+$/, message: 'El código debe contener solo números' }
                ]}
            >
                <Input
                    placeholder="Ej: 110"
                    disabled={!!editingAlmacen}
                    maxLength={3}
                />
            </Form.Item>

            <Form.Item
                label="Nombre"
                name="nombre"
                rules={[
                    { required: true, message: 'Por favor ingrese el nombre' },
                    { max: 40, message: 'El nombre no puede exceder los 40 caracteres' }
                ]}
            >
                <Input placeholder="Ej: Almacén Central PT" maxLength={40} />
            </Form.Item>

            <Form.Item
                label="Siglas"
                name="siglas"
                rules={[{ max: 10, message: 'Las siglas no pueden exceder los 10 caracteres' }]}
            >
                <Input placeholder="Ej: ALMCEN" maxLength={10} />
            </Form.Item>

            <Form.Item
                label="Categoría"
                name="id_categoria"
                rules={[{ required: true, message: 'Por favor seleccione una categoría' }]}
            >
                <Select
                    placeholder="Seleccione una categoría"
                    loading={loadingCategorias}
                    notFoundContent={loadingCategorias ? <Spin size="small" /> : "No hay categorías disponibles"}
                    showSearch
                    optionFilterProp="children"
                >
                    {categorias.map(categoria => (
                        <Option key={categoria.id} value={categoria.id}>
                            [{categoria.codigo}] {categoria.nombre}
                        </Option>
                    ))}
                </Select>
            </Form.Item>

            <Form.Item
                label="Tipo de Almacén"
                name="tipo_alm"
                rules={[{ required: true, message: 'Por favor seleccione el tipo de almacén' }]}
            >
                <Select placeholder="Seleccione el tipo de almacén">
                    <Option value="INTERNO">Interno</Option>
                    <Option value="EXTERNO">Externo</Option>
                </Select>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Space>
                    <Button onClick={onCancel}>
                        Cancelar
                    </Button>
                    <Button type="primary" htmlType="submit" loading={isSubmitting}>
                        {editingAlmacen ? 'Actualizar' : 'Crear'}
                    </Button>
                </Space>
            </Form.Item>
        </Form>
    );
};

export default AlmacenForm;