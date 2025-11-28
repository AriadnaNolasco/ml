import React, { useEffect, useState } from 'react';
import { Form, Input, Select, Button, Space, Spin, message, DatePicker, Switch, Row, Col } from 'antd';
import { SearchOutlined, UserOutlined, ShopOutlined } from '@ant-design/icons';
import api from '../../api/api';
import { useDocumentConsulta } from '../../hooks/useDocumentConsulta';
import moment from 'moment';

const { Option } = Select;
const { TextArea } = Input;

const TransportistaForm = ({ editingTransportista, paises, tiposDocumento, loadingFormData, onSuccess, onCancel }) => {
    const [form] = Form.useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Hook para consulta de documentos (RUC y DNI para transportistas)
    const {
        consultandoDocumento,
        tipoDocumentoSeleccionado,
        handleTipoDocumentoChange,
        handleDocumentoBlur,
        getDocumentoConfig
    } = useDocumentConsulta(form, {
        enableDni: true,
        enableRuc: true,
        clearFields: ['nro_documento', 'razon_social', 'direccion', 'nomb_comercial']
    });

    useEffect(() => {
        if (editingTransportista) {
            // Primero establecer el tipo de documento
            const tipoDoc = tiposDocumento.find(t => t.id === editingTransportista.id_documento);
            if (tipoDoc) {
                handleTipoDocumentoChange(tipoDoc.id, tiposDocumento);
            }

            // Luego establecer todos los valores
            form.setFieldsValue({
                codigo: editingTransportista.codigo,
                id_documento: editingTransportista.id_documento,
                nro_documento: editingTransportista.nro_documento,
                razon_social: editingTransportista.razon_social,
                nomb_comercial: editingTransportista.nomb_comercial,
                id_pais: editingTransportista.id_pais,
                direccion: editingTransportista.direccion,
                email: editingTransportista.email,
                telefono1: editingTransportista.telefono1,
                telefono2: editingTransportista.telefono2,
                celular1: editingTransportista.celular1,
                celular2: editingTransportista.celular2,
                fecha_registro: editingTransportista.fecha_registro ? moment(editingTransportista.fecha_registro) : null,
                estado: editingTransportista.estado
            });
        } else {
            form.resetFields();
            form.setFieldsValue({
                id_pais: 1,
                estado: true
            });
        }
    }, [editingTransportista, form, tiposDocumento]);

    const handleSubmit = async (values) => {
        setIsSubmitting(true);
        try {
            const formattedValues = {
                ...values,
                fecha_registro: values.fecha_registro?.format('YYYY-MM-DD')
            };

            if (editingTransportista) {
                await api.put(`/ventas/transportistas/${editingTransportista.codigo}`, formattedValues);
                message.success('Transportista actualizado correctamente');
            } else {
                await api.post('/ventas/transportistas', formattedValues);
                message.success('Transportista creado correctamente');
            }

            onSuccess();
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Error al guardar el transportista';
            message.error(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const documentoConfig = getDocumentoConfig();
    const esRuc = tipoDocumentoSeleccionado?.codigo === '6';
    const esDni = tipoDocumentoSeleccionado?.codigo === '1';

    return (
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item
                        label="Código"
                        name="codigo"
                        rules={[
                            { required: true, message: 'Por favor ingrese el código' },
                            { max: 20, message: 'El código no puede exceder los 20 caracteres' }
                        ]}
                    >
                        <Input
                            placeholder="Ej: TRANS001"
                            disabled={!!editingTransportista}
                            maxLength={20}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Tipo de Documento"
                        name="id_documento"
                        rules={[{ required: true, message: 'Por favor seleccione el tipo de documento' }]}
                    >
                        <Select
                            placeholder="Seleccione tipo de documento"
                            loading={loadingFormData}
                            notFoundContent={loadingFormData ? <Spin size="small" /> : "No hay tipos de documento disponibles"}
                            showSearch
                            optionFilterProp="children"
                            onChange={(value) => handleTipoDocumentoChange(value, tiposDocumento)}
                        >
                            {tiposDocumento.map(tipo => (
                                <Option key={tipo.id} value={tipo.id}>
                                    [{tipo.codigo}] {tipo.nombre}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Número de Documento"
                        name="nro_documento"
                        rules={[
                            { required: true, message: 'Por favor ingrese el número de documento' },
                            { max: 20, message: 'El número de documento no puede exceder los 20 caracteres' },
                            ...(esRuc ? [
                                { len: 11, message: 'El RUC debe tener exactamente 11 dígitos' },
                                { pattern: /^\d+$/, message: 'El RUC debe contener solo números' }
                            ] : []),
                            ...(esDni ? [
                                { len: 8, message: 'El DNI debe tener exactamente 8 dígitos' },
                                { pattern: /^\d+$/, message: 'El DNI debe contener solo números' }
                            ] : [])
                        ]}
                        extra={
                            tipoDocumentoSeleccionado && (
                                esRuc ? "Se completará automáticamente al ingresar RUC válido" :
                                    esDni ? "Se completará automáticamente al ingresar DNI válido" : null
                            )
                        }
                    >
                        <Input
                            placeholder={documentoConfig.placeholder}
                            maxLength={documentoConfig.maxLength}
                            onBlur={handleDocumentoBlur}
                            disabled={consultandoDocumento}
                            suffix={
                                consultandoDocumento ? (
                                    <Spin size="small" />
                                ) : esRuc ? (
                                    <ShopOutlined style={{ color: '#1890ff' }} title="Se consultará automáticamente en SUNAT" />
                                ) : esDni ? (
                                    <UserOutlined style={{ color: '#1890ff' }} title="Se consultará automáticamente en RENIEC" />
                                ) : (
                                    <SearchOutlined style={{ color: '#ccc' }} />
                                )
                            }
                        />
                    </Form.Item>

                    <Form.Item
                        label="Fecha de Registro"
                        name="fecha_registro"
                        rules={[{ required: true, message: 'Por favor seleccione la fecha de registro' }]}
                    >
                        <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                    </Form.Item>

                    <Form.Item
                        label="Razón Social"
                        name="razon_social"
                        rules={[
                            { required: true, message: 'Por favor ingrese la razón social' },
                            { max: 100, message: 'La razón social no puede exceder los 100 caracteres' }
                        ]}
                        extra={
                            tipoDocumentoSeleccionado && (
                                esRuc ? "Se completará automáticamente al ingresar RUC válido" :
                                    esDni ? "Se completará automáticamente al ingresar DNI válido" : null
                            )
                        }
                    >
                        <Input
                            placeholder={esDni ? "Ej: Juan Pérez García" : "Ej: EMPRESA DE TRANSPORTE S.A.C."}
                            maxLength={100}
                            disabled={consultandoDocumento}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Nombre Comercial"
                        name="nomb_comercial"
                        rules={[{ max: 100, message: 'El nombre comercial no puede exceder los 100 caracteres' }]}
                        extra={
                            tipoDocumentoSeleccionado && (
                                esRuc ? "Se completará automáticamente al ingresar RUC válido" :
                                    esDni ? "Se completará automáticamente al ingresar DNI válido" : null
                            )
                        }
                    >
                        <Input
                            placeholder="Ej: Transportes Ejemplo"
                            maxLength={100}
                            disabled={consultandoDocumento}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            { type: 'email', message: 'Ingrese un email válido' },
                            { max: 100, message: 'El email no puede exceder los 100 caracteres' }
                        ]}
                    >
                        <Input placeholder="Ej: transportista@ejemplo.com" maxLength={100} />
                    </Form.Item>
                </Col>

                <Col span={12}>
                    <Form.Item
                        label="País"
                        name="id_pais"
                        rules={[{ required: true, message: 'Por favor seleccione un país' }]}
                    >
                        <Select
                            placeholder="Seleccione país"
                            loading={loadingFormData}
                            notFoundContent={loadingFormData ? <Spin size="small" /> : "No hay países disponibles"}
                            showSearch
                            optionFilterProp="children"
                        >
                            {paises.map(pais => (
                                <Option key={pais.id} value={pais.id}>
                                    {pais.nombre}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Dirección"
                        name="direccion"
                        rules={[{ max: 200, message: 'La dirección no puede exceder los 200 caracteres' }]}
                        extra={esRuc ? "Se completará automáticamente al ingresar RUC válido" : null}
                    >
                        <TextArea
                            rows={3}
                            placeholder="Ej: Av. Ejemplo 123, Lima, Perú"
                            maxLength={200}
                            disabled={consultandoDocumento}
                        />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="Teléfono 1"
                                name="telefono1"
                                rules={[{ max: 20, message: 'El teléfono no puede exceder los 20 caracteres' }]}
                            >
                                <Input placeholder="Ej: 01-2345678" maxLength={20} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Teléfono 2"
                                name="telefono2"
                                rules={[{ max: 20, message: 'El teléfono no puede exceder los 20 caracteres' }]}
                            >
                                <Input placeholder="Ej: 01-2345679" maxLength={20} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="Celular 1"
                                name="celular1"
                                rules={[{ max: 20, message: 'El celular no puede exceder los 20 caracteres' }]}
                            >
                                <Input placeholder="Ej: 987654321" maxLength={20} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Celular 2"
                                name="celular2"
                                rules={[{ max: 20, message: 'El celular no puede exceder los 20 caracteres' }]}
                            >
                                <Input placeholder="Ej: 987654322" maxLength={20} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        label="Estado"
                        name="estado"
                        valuePropName="checked"
                        rules={[{ required: true, message: 'Por favor defina el estado' }]}
                    >
                        <Switch checkedChildren="Activo" unCheckedChildren="Inactivo" />
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Space>
                    <Button onClick={onCancel} disabled={isSubmitting || consultandoDocumento}>
                        Cancelar
                    </Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={isSubmitting}
                        disabled={consultandoDocumento}
                    >
                        {editingTransportista ? 'Actualizar' : 'Crear'}
                    </Button>
                </Space>
            </Form.Item>
        </Form>
    );
};

export default TransportistaForm;