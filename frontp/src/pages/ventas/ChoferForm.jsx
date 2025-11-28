import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Select,
  Button,
  Space,
  message,
  Switch,
  Row,
  Col,
  Divider,
  Alert,
  Spin,
} from "antd";
import {
  UserOutlined,
  IdcardOutlined,
  CarOutlined,
  TeamOutlined,
  ShopOutlined,
  BankOutlined,
} from "@ant-design/icons";
import api from "../../api/api";

const { Option } = Select;
const { TextArea } = Input;

const ChoferForm = ({
  editingChofer,
  datosFormulario,
  opcionesFormulario,
  loadingFormData,
  onSuccess,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tipoPertenencia, setTipoPertenencia] = useState(null);
  const [empresaInfo, setEmpresaInfo] = useState(null);

  useEffect(() => {
    if (editingChofer) {
      form.setFieldsValue({
        codigo: editingChofer.codigo,
        id_documento: editingChofer.id_documento,
        nro_documento: editingChofer.nro_documento,
        nombre_completo: editingChofer.nombre_completo,
        tipo_pertenencia: editingChofer.tipo_pertenencia,
        id_personal: editingChofer.id_personal,
        id_transportista: editingChofer.id_transportista,
        id_cliente: editingChofer.id_cliente,
        direccion: editingChofer.direccion,
        id_pais: editingChofer.id_pais,
        nro_licencia: editingChofer.nro_licencia,
        estado: editingChofer.estado,
      });
      setTipoPertenencia(editingChofer.tipo_pertenencia);
      setEmpresaInfo({
        documento: editingChofer.empresa_documento,
        razon_social: editingChofer.empresa_razon_social,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        estado: true,
        id_pais: 1, // Default Perú
      });
      setTipoPertenencia(null);
      setEmpresaInfo(null);
    }
  }, [editingChofer, form]);

  const handleTipoPertenenciaChange = (value) => {
    setTipoPertenencia(value);
    setEmpresaInfo(null);

    // Limpiar los campos relacionados
    form.setFieldsValue({
      id_personal: undefined,
      id_transportista: undefined,
      id_cliente: undefined,
      codigo: undefined,
      id_documento: undefined,
      nro_documento: undefined,
      nombre_completo: undefined,
      direccion: undefined,
      id_pais: 1,
    });
  };

  const handlePersonalChange = (value) => {
    if (!value) {
      setEmpresaInfo(null);
      return;
    }

    const personal = opcionesFormulario?.personal?.find(
      (p) => p.id_personal === value
    );

    if (personal) {
      // Auto-completar TODOS los campos del personal
      form.setFieldsValue({
        codigo: String(personal.codigo), // ← Convertir a string
        id_documento: personal.id_documento,
        nro_documento: personal.nro_documento,
        nombre_completo: personal.nombre_completo,
        direccion: personal.direccion,
        id_pais: personal.id_pais || 1,
      });

      // Establecer información de la empresa del personal
      setEmpresaInfo({
        documento: personal.empresa_documento || "N/A",
        razon_social: personal.empresa_razon_social || "N/A",
      });
    }
  };

  const handleTransportistaChange = (value) => {
    if (!value) {
      setEmpresaInfo(null);
      return;
    }

    const transportista = opcionesFormulario?.transportistas?.find(
      (t) => t.id_transportista === value
    );

    if (transportista) {
      // Solo auto-completar código (NO llenar datos personales del chofer)
      form.setFieldsValue({
        codigo: transportista.codigo,
      });

      // Establecer información de la empresa (el transportista mismo)
      setEmpresaInfo({
        documento: transportista.nro_documento,
        razon_social: transportista.nombre,
      });
    }
  };

  const handleClienteChange = (value) => {
    if (!value) {
      setEmpresaInfo(null);
      return;
    }

    const cliente = opcionesFormulario?.clientes?.find(
      (c) => c.id_cliente === value
    );

    if (cliente) {
      // Solo auto-completar código (NO llenar datos personales del chofer)
      form.setFieldsValue({
        codigo: cliente.codigo,
      });

      // Establecer información de la empresa (el cliente mismo)
      setEmpresaInfo({
        documento: cliente.nro_documento,
        razon_social: cliente.nombre,
      });
    }
  };

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      // Validar que se haya seleccionado la entidad correcta según el tipo
      if (values.tipo_pertenencia === "PERSONAL" && !values.id_personal) {
        message.error("Debe seleccionar un personal");
        return;
      }
      if (
        values.tipo_pertenencia === "TRANSPORTISTA" &&
        !values.id_transportista
      ) {
        message.error("Debe seleccionar un transportista");
        return;
      }
      if (values.tipo_pertenencia === "CLIENTE" && !values.id_cliente) {
        message.error("Debe seleccionar un cliente");
        return;
      }

      if (editingChofer) {
        await api.put(`/ventas/choferes/${editingChofer.codigo}`, values);
        message.success("Chofer actualizado correctamente");
      } else {
        await api.post("/ventas/choferes", values);
        message.success("Chofer creado correctamente");
      }

      onSuccess();
    } catch (error) {
      const errorMsg =
        error.response?.data?.error || "Error al guardar el chofer";
      message.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIconForTipo = (tipo) => {
    switch (tipo) {
      case "PERSONAL":
        return <TeamOutlined />;
      case "TRANSPORTISTA":
        return <CarOutlined />;
      case "CLIENTE":
        return <ShopOutlined />;
      default:
        return <UserOutlined />;
    }
  };

  return (
    <Form form={form} layout='vertical' onFinish={handleSubmit}>
      <Row gutter={16}>
        {/* Columna Izquierda */}
        <Col span={12}>
          <Divider orientation='left'>
            <IdcardOutlined /> Información Personal
          </Divider>

          <Form.Item
            label='Código'
            name='codigo'
            rules={[
              { required: true, message: "Por favor ingrese el código" },
              {
                max: 15,
                message: "El código no puede exceder los 15 caracteres",
              },
            ]}
          >
            <Input
              placeholder='Ej: CHO001'
              disabled={!!editingChofer}
              maxLength={15}
              style={{ textTransform: "uppercase" }}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();
                form.setFieldsValue({ codigo: value });
              }}
            />
          </Form.Item>

          <Form.Item
            label='Tipo de Documento'
            name='id_documento'
            rules={[
              {
                required: true,
                message: "Por favor seleccione el tipo de documento",
              },
            ]}
          >
            <Select
              placeholder='Seleccione tipo de documento'
              loading={loadingFormData}
              showSearch
              optionFilterProp='children'
              notFoundContent={
                loadingFormData ? (
                  <Spin size='small' />
                ) : (
                  "No hay tipos de documento disponibles"
                )
              }
            >
              {datosFormulario?.tiposDocumento?.map((tipo) => (
                <Option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label='Número de Documento'
            name='nro_documento'
            rules={[
              {
                required: true,
                message: "Por favor ingrese el número de documento",
              },
              {
                max: 20,
                message:
                  "El número de documento no puede exceder los 20 caracteres",
              },
            ]}
          >
            <Input placeholder='Ej: 12345678' maxLength={20} />
          </Form.Item>

          <Form.Item
            label='Nombre Completo'
            name='nombre_completo'
            rules={[
              {
                required: true,
                message: "Por favor ingrese el nombre completo",
              },
              {
                max: 100,
                message: "El nombre no puede exceder los 100 caracteres",
              },
            ]}
          >
            <Input
              placeholder='Ej: Juan Carlos Pérez González'
              maxLength={100}
            />
          </Form.Item>

          <Form.Item
            label='Número de Licencia'
            name='nro_licencia'
            rules={[
              {
                max: 20,
                message:
                  "El número de licencia no puede exceder los 20 caracteres",
              },
            ]}
          >
            <Input placeholder='Ej: Q12345678' maxLength={20} />
          </Form.Item>
        </Col>

        {/* Columna Derecha */}
        <Col span={12}>
          <Divider orientation='left'>
            {getIconForTipo(tipoPertenencia)} Pertenencia
          </Divider>

          <Form.Item
            label='Tipo de Pertenencia'
            name='tipo_pertenencia'
            rules={[
              {
                required: true,
                message: "Por favor seleccione el tipo de pertenencia",
              },
            ]}
          >
            <Select
              placeholder='Seleccione tipo de pertenencia'
              onChange={handleTipoPertenenciaChange}
              notFoundContent='No hay opciones disponibles'
            >
              {opcionesFormulario?.tiposPertenencia?.map((tipo) => (
                <Option key={tipo} value={tipo}>
                  {tipo}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {tipoPertenencia === "PERSONAL" && (
            <Form.Item
              label='Personal'
              name='id_personal'
              rules={[
                { required: true, message: "Por favor seleccione el personal" },
              ]}
            >
              <Select
                placeholder='Seleccione personal'
                showSearch
                optionFilterProp='children'
                onChange={handlePersonalChange}
                notFoundContent='No hay personal disponible'
              >
                {opcionesFormulario?.personal?.map((personal) => (
                  <Option
                    key={personal.id_personal}
                    value={personal.id_personal}
                  >
                    {personal.nombre_completo} - {personal.nro_documento}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {tipoPertenencia === "TRANSPORTISTA" && (
            <Form.Item
              label='Transportista'
              name='id_transportista'
              rules={[
                {
                  required: true,
                  message: "Por favor seleccione el transportista",
                },
              ]}
            >
              <Select
                placeholder='Seleccione transportista'
                showSearch
                optionFilterProp='children'
                onChange={handleTransportistaChange}
                notFoundContent='No hay transportistas disponibles'
              >
                {opcionesFormulario?.transportistas?.map((transportista) => (
                  <Option
                    key={transportista.id_transportista}
                    value={transportista.id_transportista}
                  >
                    {transportista.nombre} - {transportista.nro_documento}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {tipoPertenencia === "CLIENTE" && (
            <Form.Item
              label='Cliente'
              name='id_cliente'
              rules={[
                { required: true, message: "Por favor seleccione el cliente" },
              ]}
            >
              <Select
                placeholder='Seleccione cliente'
                showSearch
                optionFilterProp='children'
                onChange={handleClienteChange}
                notFoundContent='No hay clientes disponibles'
              >
                {opcionesFormulario?.clientes?.map((cliente) => (
                  <Option key={cliente.id_cliente} value={cliente.id_cliente}>
                    {cliente.nombre} - {cliente.nro_documento}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {empresaInfo && (
            <Alert
              message='Información de la Empresa'
              description={
                <div>
                  <div>
                    <strong>RUC/Doc:</strong> {empresaInfo.documento}
                  </div>
                  <div>
                    <strong>Razón Social:</strong> {empresaInfo.razon_social}
                  </div>
                </div>
              }
              type='info'
              icon={<BankOutlined />}
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Form.Item label='Dirección' name='direccion'>
            <TextArea
              placeholder='Ingrese la dirección'
              rows={3}
              maxLength={200}
            />
          </Form.Item>

          <Form.Item
            label='País'
            name='id_pais'
            rules={[
              { required: true, message: "Por favor seleccione el país" },
            ]}
          >
            <Select
              placeholder='Seleccione país'
              showSearch
              optionFilterProp='children'
              loading={loadingFormData}
              notFoundContent={
                loadingFormData ? (
                  <Spin size='small' />
                ) : (
                  "No hay países disponibles"
                )
              }
            >
              {datosFormulario?.paises?.map((pais) => (
                <Option key={pais.id} value={pais.id}>
                  {pais.nombre}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label='Estado'
            name='estado'
            valuePropName='checked'
            rules={[{ required: true, message: "Por favor defina el estado" }]}
          >
            <Switch checkedChildren='Activo' unCheckedChildren='Inactivo' />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item style={{ marginBottom: 0, textAlign: "right", marginTop: 16 }}>
        <Space>
          <Button onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type='primary'
            htmlType='submit'
            loading={isSubmitting}
            icon={<UserOutlined />}
          >
            {editingChofer ? "Actualizar" : "Crear"}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default ChoferForm;
