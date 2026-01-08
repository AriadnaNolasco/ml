import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  Switch, 
  Button, 
  Row, 
  Col, 
  Spin, 
  message,
  Card,
  Divider,
  Space
} from 'antd';
import { 
  SearchOutlined, 
  ShopOutlined, 
  BankOutlined,
  PlusOutlined,
  MinusCircleOutlined 
} from '@ant-design/icons';
import moment from 'moment';
import api from '../../api/api';
import { useDocumentConsulta } from '../../hooks/useDocumentConsulta';

const { Option } = Select;
const { TextArea } = Input;

const ProveedorForm = ({
  user,
  editingProveedor,
  paises,
  tiposDocumento,
  loadingDatos,
  onSuccess,
  onCancel,
  form
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [datosBancarios, setDatosBancarios] = useState({
    bancos: [],
    monedas: [],
    paises: []
  });
  const [loadingBancos, setLoadingBancos] = useState(false);
  const [direccionBancoSeleccionado, setDireccionBancoSeleccionado] = useState('');

  // Hook para consulta de documentos
  const {
    consultandoDocumento,
    tipoDocumentoSeleccionado,
    handleTipoDocumentoChange,
    handleDocumentoBlur,
    getDocumentoConfig
  } = useDocumentConsulta(form, {
    enableDni: false,
    enableRuc: true,
    clearFields: ['nro_documento', 'razon_social', 'direccion', 'nomb_comercial']
  });

  // Cargar datos bancarios
  useEffect(() => {
    cargarDatosBancarios();
    if (editingProveedor) {
      cargarCuentasBancariasProveedor();
    }
  }, [editingProveedor]);

  const cargarDatosBancarios = async () => {
    setLoadingBancos(true);
    try {
      const response = await api.get('/compras/datos-cuentas-bancarias');
      setDatosBancarios(response.data);
    } catch (error) {
      console.error('Error al cargar datos bancarios:', error);
      message.error('Error al cargar datos bancarios');
    } finally {
      setLoadingBancos(false);
    }
  };

  const handleBancoChange = (bancoId, fieldName) => {
    if (bancoId) {
      const bancoSeleccionado = datosBancarios.bancos.find(banco => banco.id === bancoId);
      if (bancoSeleccionado && bancoSeleccionado.direccion) {
        setDireccionBancoSeleccionado(bancoSeleccionado.direccion);
        // Establecer la dirección en el campo correspondiente
        form.setFieldValue(['cuentas_bancarias', fieldName, 'direccion'], bancoSeleccionado.direccion);
      } else {
        setDireccionBancoSeleccionado('');
        // Limpiar la dirección si el banco no tiene
        form.setFieldValue(['cuentas_bancarias', fieldName, 'direccion'], '');
      }
    } else {
      setDireccionBancoSeleccionado('');
      form.setFieldValue(['cuentas_bancarias', fieldName, 'direccion'], '');
    }
  };

  const cargarCuentasBancariasProveedor = async () => {
    try {
      const response = await api.get(`/compras/proveedores/${editingProveedor.id}/cuentas-bancarias`);
      if (response.data.success) {
        // Establecer las cuentas bancarias en el formulario
        form.setFieldValue('cuentas_bancarias', response.data.data);
      }
    } catch (error) {
      console.error('Error al cargar cuentas bancarias:', error);
      // No mostrar error para no interrumpir la carga del formulario
    }
  };

  useEffect(() => {
    if (editingProveedor) {
      // Primero establecer el tipo de documento
      const tipoDoc = tiposDocumento.find(t => t.id === editingProveedor.id_documento);
      if (tipoDoc) {
        handleTipoDocumentoChange(tipoDoc.id, tiposDocumento);
      }

      // Luego establecer todos los valores
      const initialValues = {
        codigo: editingProveedor.codigo,
        id_documento: editingProveedor.id_documento,
        nro_documento: editingProveedor.nro_documento,
        razon_social: editingProveedor.razon_social,
        nomb_comercial: editingProveedor.nomb_comercial,
        id_pais: editingProveedor.id_pais,
        direccion: editingProveedor.direccion,
        email: editingProveedor.email,
        telefono1: editingProveedor.telefono1,
        telefono2: editingProveedor.telefono2,
        celular1: editingProveedor.celular1,
        celular2: editingProveedor.celular2,
        contacto: editingProveedor.contacto,
        fecha_registro: editingProveedor.fecha_registro ? moment(editingProveedor.fecha_registro) : null,
        estado: editingProveedor.estado
      };

      form.setFieldsValue(initialValues);
    } else {
      form.setFieldsValue({
        id_pais: 1, // Perú por defecto
        estado: true,
        cuentas_bancarias: [],
        fecha_registro: moment()
      });
    }
  }, [editingProveedor, form, tiposDocumento]);

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      const formattedValues = {
        ...values,
        fecha_registro: values.fecha_registro?.format('DD-MM-YYYY') || moment().format('DD-MM-YYYY'),
        cuentas_bancarias: values.cuentas_bancarias || []
      };

      if (editingProveedor) {
        await api.put(`/compras/proveedores/${editingProveedor.id}`, formattedValues);
        message.success('Proveedor actualizado correctamente');
      } else {
        await api.post('/compras/proveedores', formattedValues);
        message.success('Proveedor creado correctamente');
      }

      onSuccess();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Error al guardar el proveedor';
      message.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingDatos) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <Spin size="large" />
      </div>
    );
  }

  const documentoConfig = getDocumentoConfig();
  const esRuc = tipoDocumentoSeleccionado?.codigo === '6';

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        cuentas_bancarias: []
      }}
      scrollToFirstError
    >
      {/* Sección de Información Básica */}
      <Card 
        title="Información del Proveedor" 
        size="small" 
        style={{ marginBottom: 16 }}
      >
        <Row gutter={16}>
          <Col span={12}>
            {/* Código, Tipo Documento, Nro Documento, Fecha Registro */}
            <Form.Item
              name="codigo"
              label="Código"
              rules={[
                { required: true, message: 'Por favor ingrese el código' },
                { max: 15, message: 'El código no puede exceder los 15 caracteres' } 
              ]}
            >
              <Input
                placeholder="Código del proveedor"
                disabled={!!editingProveedor}
                maxLength={15}
              />
            </Form.Item>

            <Form.Item
              name="id_documento"
              label="Tipo de Documento"
              rules={[{ required: true, message: 'Por favor seleccione el tipo de documento' }]}
            >
              <Select
                placeholder="Seleccionar tipo de documento"
                onChange={(value) => handleTipoDocumentoChange(value, tiposDocumento)}
                loading={loadingDatos}
                showSearch
                optionFilterProp="children"
              >
                {tiposDocumento.map(tipo => (
                  <Option key={tipo.id} value={tipo.id}>
                    [{tipo.codigo}] {tipo.nombre}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="nro_documento"
              label="Número de Documento"
              rules={[
                { required: true, message: 'Por favor ingrese el número de documento' },
                { max: 20, message: 'El documento no puede exceder los 20 caracteres' },
                ...(esRuc ? [
                  { len: 11, message: 'El RUC debe tener exactamente 11 dígitos' },
                  { pattern: /^\d+$/, message: 'El RUC debe contener solo números' }
                ] : [])
              ]}
              extra={esRuc ? "Se completará automáticamente al ingresar RUC válido" : null}
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
                  ) : (
                    <SearchOutlined style={{ color: '#ccc' }} />
                  )
                }
              />
            </Form.Item>

            {/* CAMPO CONTACTO */}
            <Form.Item
              name="contacto"
              label="Persona de Contacto"
              rules={[
                { max: 100, message: 'El contacto no puede exceder los 100 caracteres' }
              ]}
            >
              <Input
                placeholder="Nombre de la persona de contacto"
                maxLength={100}
              />
            </Form.Item>

          </Col>

          <Col span={12}>
            {/* Razón Social, Nombre Comercial, País, Estado */}
            <Form.Item
              name="razon_social"
              label="Razón Social"
              rules={[
                { required: true, message: 'Por favor ingrese la razón social' },
                { max: 200, message: 'La razón social no puede exceder los 200 caracteres' } 
              ]}
              extra={esRuc ? "Se completará automáticamente al ingresar RUC válido" : null}
            >
              <Input
                placeholder="Razón social"
                maxLength={200}
                disabled={consultandoDocumento}
              />
            </Form.Item>

            <Form.Item
              name="nomb_comercial"
              label="Nombre Comercial"
              rules={[
                { required: true, message: 'Por favor ingrese el nombre comercial' }, 
                { max: 200, message: 'El nombre comercial no puede exceder los 200 caracteres' } 
              ]}
              extra={esRuc ? "Se completará automáticamente al ingresar RUC válido" : null}
            >
              <Input
                placeholder="Nombre comercial"
                maxLength={200}
                disabled={consultandoDocumento}
              />
            </Form.Item>

            <Form.Item
              name="id_pais"
              label="País"
              rules={[{ required: true, message: 'Por favor seleccione un país' }]}
            >
              <Select
                placeholder="Seleccionar país"
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
              name="fecha_registro"
              label="Fecha de Registro"
            >
              <DatePicker 
                style={{ width: '100%' }} 
                format="DD-MM-YYYY" 
                disabled
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Dirección */}
        <Form.Item
          name="direccion"
          label="Dirección"
          rules={[{ max: 200, message: 'La dirección no puede exceder los 200 caracteres' }]}
          extra={esRuc ? "Se completará automáticamente al ingresar RUC válido" : null}
        >
          <TextArea
            rows={2}
            placeholder="Dirección completa"
            maxLength={200}
            disabled={consultandoDocumento}
          />
        </Form.Item>

        {/* Campos de contacto (email, teléfonos) */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { type: 'email', message: 'Ingrese un email válido' },
                { max: 100, message: 'El email no puede exceder los 100 caracteres' }
              ]}
            >
              <Input placeholder="correo@ejemplo.com" maxLength={100} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="telefono1"
              label="Teléfono Principal"
              rules={[{ max: 20, message: 'El teléfono no puede exceder los 20 caracteres' }]}
            >
              <Input placeholder="Teléfono principal" maxLength={20} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="telefono2"
              label="Teléfono Secundario"
              rules={[{ max: 20, message: 'El teléfono no puede exceder los 20 caracteres' }]}
            >
              <Input placeholder="Teléfono secundario (opcional)" maxLength={20} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="celular1"
              label="Celular Principal"
              rules={[{ max: 20, message: 'El celular no puede exceder los 20 caracteres' }]}
            >
              <Input placeholder="Celular principal" maxLength={20} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="celular2"
          label="Celular Secundario"
          rules={[{ max: 20, message: 'El celular no puede exceder los 20 caracteres' }]}
        >
          <Input placeholder="Celular secundario (opcional)" maxLength={20} />
        </Form.Item>

        <Form.Item
          name="estado"
          label="Estado"
          valuePropName="checked"
          rules={[{ required: true, message: 'Por favor defina el estado' }]}
        >
          <Switch checkedChildren="Activo" unCheckedChildren="Inactivo" />
        </Form.Item>
      </Card>

      {/* Sección de Cuentas Bancarias */}
      <Card 
        title={
          <span>
            <BankOutlined /> Información Bancaria (Opcional)
          </span>
        } 
        size="small" 
        style={{ marginBottom: 16 }}
        loading={loadingBancos}
      >
        <Form.List name="cuentas_bancarias">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <div key={key}>
                  {fields.length > 1 && (
                    <Divider orientation="left" plain>
                      Cuenta Bancaria #{name + 1}
                      <Button
                        type="link"
                        danger
                        icon={<MinusCircleOutlined />}
                        onClick={() => remove(name)}
                        style={{ marginLeft: 8 }}
                        size="small"
                      >
                        Eliminar
                      </Button>
                    </Divider>
                  )}
                  
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'id_bancos']}
                        label="Banco"
                      >
                        <Select 
                          placeholder="Seleccionar banco (opcional)" 
                          showSearch 
                          optionFilterProp="children"
                          allowClear
                          onChange={(value) => handleBancoChange(value, name)}
                        >
                          {datosBancarios.bancos.map(banco => (
                            <Option key={banco.id} value={banco.id}>
                              {banco.nombre}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'id_moneda']}
                        label="Moneda"
                        // REMOVIDA REGLA REQUIRED
                      >
                        <Select 
                          placeholder="Seleccionar moneda (opcional)" 
                          showSearch 
                          optionFilterProp="children"
                          allowClear
                        >
                          {datosBancarios.monedas.map(moneda => (
                            <Option key={moneda.id} value={moneda.id}>
                              {moneda.nombre} ({moneda.simbolo})
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    {...restField}
                    name={[name, 'numero_cuenta']}
                    label="Número de Cuenta"
                    rules={[
                      // REMOVIDA REGLA REQUIRED, solo mantiene max
                      { max: 50, message: 'Máximo 50 caracteres' }
                    ]}
                  >
                    <Input placeholder="Número de cuenta (opcional)" maxLength={50} />
                  </Form.Item>

                  {/* Resto de campos bancarios se mantienen opcionales */}
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'cta_interbancaria']}
                        label="Cuenta Interbancaria"
                        rules={[{ max: 50, message: 'Máximo 50 caracteres' }]}
                      >
                        <Input placeholder="Cuenta interbancaria (opcional)" maxLength={50} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'codigo_swift']}
                        label="Código SWIFT"
                        rules={[{ max: 20, message: 'Máximo 20 caracteres' }]}
                      >
                        <Input placeholder="Código SWIFT (opcional)" maxLength={20} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'codigo_aba']}
                        label="Código ABA"
                        rules={[{ max: 20, message: 'Máximo 20 caracteres' }]}
                      >
                        <Input placeholder="Código ABA (opcional)" maxLength={20} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'id_pais']}
                        label="País del Banco"
                      >
                        <Select 
                          placeholder="Seleccionar país (opcional)" 
                          showSearch 
                          optionFilterProp="children"
                          allowClear
                        >
                          {datosBancarios.paises.map(pais => (
                            <Option key={pais.id} value={pais.id}>
                              {pais.nombre}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    {...restField}
                    name={[name, 'direccion']}
                    label="Dirección del Banco"
                    rules={[{ max: 150, message: 'Máximo 150 caracteres' }]}
                  >
                    <Input.TextArea 
                      rows={2} 
                      placeholder="Dirección de la sucursal bancaria (se completa automáticamente)" 
                      maxLength={150}
                      readOnly
                    />
                  </Form.Item>

                  {fields.length > 1 && <Divider />}
                </div>
              ))}
              
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                  disabled={loadingBancos}
                >
                  Agregar Cuenta Bancaria (Opcional)
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Card>

      {/* Botones de acción */}
      <div style={{ textAlign: 'right', marginTop: '16px' }}>
        <Space>
          <Button 
            onClick={onCancel} 
            disabled={isSubmitting || consultandoDocumento}
            size="large"
          >
            Cancelar
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={isSubmitting} 
            disabled={consultandoDocumento || loadingBancos}
            size="large"
          >
            {editingProveedor ? 'Actualizar Proveedor' : 'Crear Proveedor'}
          </Button>
        </Space>
      </div>
    </Form>
  );
};

export default ProveedorForm;