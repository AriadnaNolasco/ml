import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Select,
  Button,
  Space,
  Spin,
  message,
  DatePicker,
  Switch,
  Row,
  Col,
  InputNumber,
  Card,
} from "antd";
import {
  SearchOutlined,
  UserOutlined,
  ShopOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import api from "../../api/api";
import { useDocumentConsulta } from "../../hooks/useDocumentConsulta";
import moment from "moment";

const { Option } = Select;
const { TextArea } = Input;

const ClienteForm = ({
  editingCliente,
  paises,
  tiposDocumento,
  vendedores,
  formasPago,
  departamentos,
  distritos,
  loadingFormData,
  onSuccess,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInfoFinanciera, setShowInfoFinanciera] = useState(false);
  const [departamentoSeleccionado, setDepartamentoSeleccionado] =
    useState(null);
  const [distritosFiltrados, setDistritosFiltrados] = useState([]);

  // Hook para consulta de documentos
  const {
    consultandoDocumento,
    tipoDocumentoSeleccionado,
    handleTipoDocumentoChange,
    handleDocumentoBlur,
    getDocumentoConfig,
  } = useDocumentConsulta(form, {
    enableDni: true,
    enableRuc: true,
    clearFields: [
      "nro_documento",
      "razon_social",
      "direccion",
      "nomb_comercial",
    ],
  });

  // Filtrar distritos cuando cambia el departamento seleccionado
  useEffect(() => {
    if (departamentoSeleccionado && distritos) {
      const filtrados = distritos.filter(
        (distrito) => distrito.departamento_id === departamentoSeleccionado
      );
      setDistritosFiltrados(filtrados);
    } else {
      setDistritosFiltrados([]);
    }
  }, [departamentoSeleccionado, distritos]);

  useEffect(() => {
    if (editingCliente) {
      // Establecer tipo de documento
      const tipoDoc = tiposDocumento.find(
        (t) => t.id === editingCliente.id_documento
      );
      if (tipoDoc) {
        handleTipoDocumentoChange(tipoDoc.id, tiposDocumento);
      }

      // Establecer departamento y distrito si existen
      if (editingCliente.id_departamento) {
        setDepartamentoSeleccionado(editingCliente.id_departamento);
      }

      // Verificar si mostrar información financiera
      const tieneInfoFinanciera =
        editingCliente.linea_credito !== undefined ||
        editingCliente.forma_pago_id !== null ||
        editingCliente.tasa_interes !== undefined;

      setShowInfoFinanciera(tieneInfoFinanciera);

      // Establecer todos los valores
      const formValues = {
        codigo: editingCliente.codigo,
        id_documento: editingCliente.id_documento,
        nro_documento: editingCliente.nro_documento,
        vendedor_id: editingCliente.vendedor_id,
        razon_social: editingCliente.razon_social,
        nomb_comercial: editingCliente.nomb_comercial,
        id_pais: editingCliente.id_pais,
        id_departamento: editingCliente.id_departamento,
        id_distrito: editingCliente.id_distrito,
        direccion: editingCliente.direccion,
        email: editingCliente.email,
        telefono1: editingCliente.telefono1,
        telefono2: editingCliente.telefono2,
        celular1: editingCliente.celular1,
        celular2: editingCliente.celular2,
        fecha_registro: editingCliente.fecha_registro
          ? moment(editingCliente.fecha_registro)
          : null,
        estado: editingCliente.estado,
      };

      // Agregar información financiera si existe
      if (tieneInfoFinanciera) {
        formValues.linea_credito = editingCliente.linea_credito || 0;
        formValues.tasa_interes = editingCliente.tasa_interes || 0;
        formValues.forma_pago_id = editingCliente.forma_pago_id || null;
        formValues.descuento_1 = editingCliente.descuento_1 || 0;
        formValues.descuento_2 = editingCliente.descuento_2 || 0;
        formValues.cuenta_detraccion = editingCliente.cuenta_detraccion || null;
        formValues.financiera_estado =
          editingCliente.financiera_estado !== undefined
            ? editingCliente.financiera_estado
            : true;
      } else {
        // Valores por defecto para información financiera
        formValues.linea_credito = 0;
        formValues.tasa_interes = 0;
        formValues.forma_pago_id = null;
        formValues.descuento_1 = 0;
        formValues.descuento_2 = 0;
        formValues.cuenta_detraccion = null;
        formValues.financiera_estado = true;
      }

      form.setFieldsValue(formValues);
    } else {
      form.resetFields();
      form.setFieldsValue({
        id_pais: 1, // Perú por defecto
        estado: true,
        linea_credito: 0,
        tasa_interes: 0,
        descuento_1: 0,
        descuento_2: 0,
        financiera_estado: true,
      });
    }
  }, [editingCliente, form, tiposDocumento]);

  const handleDepartamentoChange = (value) => {
    setDepartamentoSeleccionado(value);
    form.setFieldsValue({
      id_distrito: null, // Reset distrito cuando cambia el departamento
    });
  };

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      // Preparar datos básicos del cliente
      const payload = {
        id_documento: values.id_documento,
        nro_documento: values.nro_documento,
        vendedor_id: values.vendedor_id,
        razon_social: values.razon_social,
        nomb_comercial: values.nomb_comercial,
        id_pais: values.id_pais,
        id_departamento: values.id_departamento,
        id_distrito: values.id_distrito,
        direccion: values.direccion,
        email: values.email,
        telefono1: values.telefono1,
        telefono2: values.telefono2,
        celular1: values.celular1,
        celular2: values.celular2,
        fecha_registro: values.fecha_registro?.format("YYYY-MM-DD"),
        estado: Boolean(values.estado),
      };

      // Siempre incluir información financiera, incluso si la sección está oculta
      payload.linea_credito = values.linea_credito || 0;
      payload.tasa_interes = values.tasa_interes || 0;
      payload.forma_pago_id = values.forma_pago_id || null;
      payload.descuento_1 = values.descuento_1 || 0;
      payload.descuento_2 = values.descuento_2 || 0;
      payload.cuenta_detraccion = values.cuenta_detraccion || null;
      payload.financiera_estado = Boolean(values.financiera_estado);

      console.log("Enviando datos:", payload); // Para debug

      if (editingCliente) {
        await api.put(`/ventas/clientes/${editingCliente.codigo}`, payload);
        message.success("Cliente actualizado correctamente");
      } else {
        payload.codigo = values.codigo;
        await api.post("/ventas/clientes", payload);
        message.success("Cliente creado correctamente");
      }

      onSuccess();
    } catch (error) {
      console.error("Error completo:", error);
      const errorMsg =
        error.response?.data?.error || "Error al guardar el cliente";
      message.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const documentoConfig = getDocumentoConfig();
  const esRuc = tipoDocumentoSeleccionado?.codigo === "6";
  const esDni = tipoDocumentoSeleccionado?.codigo === "1";

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="Código"
            name="codigo"
            rules={[
              { required: true, message: "Por favor ingrese el código" },
              {
                max: 20,
                message: "El código no puede exceder los 20 caracteres",
              },
            ]}
          >
            <Input
              placeholder="Ej: CLI001"
              disabled={!!editingCliente}
              maxLength={20}
            />
          </Form.Item>

          <Form.Item
            label="Tipo de Documento"
            name="id_documento"
            rules={[
              {
                required: true,
                message: "Por favor seleccione el tipo de documento",
              },
            ]}
          >
            <Select
              placeholder="Seleccione tipo de documento"
              loading={loadingFormData}
              notFoundContent={
                loadingFormData ? (
                  <Spin size="small" />
                ) : (
                  "No hay tipos de documento disponibles"
                )
              }
              showSearch
              optionFilterProp="children"
              onChange={(value) =>
                handleTipoDocumentoChange(value, tiposDocumento)
              }
            >
              {tiposDocumento.map((tipo) => (
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
              {
                required: true,
                message: "Por favor ingrese el número de documento",
              },
              {
                max: 20,
                message:
                  "El número de documento no puede exceder los 20 caracteres",
              },
              ...(esRuc
                ? [
                    {
                      len: 11,
                      message: "El RUC debe tener exactamente 11 dígitos",
                    },
                    {
                      pattern: /^\d+$/,
                      message: "El RUC debe contener solo números",
                    },
                  ]
                : []),
              ...(esDni
                ? [
                    {
                      len: 8,
                      message: "El DNI debe tener exactamente 8 dígitos",
                    },
                    {
                      pattern: /^\d+$/,
                      message: "El DNI debe contener solo números",
                    },
                  ]
                : []),
            ]}
            extra={
              tipoDocumentoSeleccionado &&
              (esRuc
                ? "Se completará automáticamente al ingresar RUC válido"
                : esDni
                ? "Se completará automáticamente al ingresar DNI válido"
                : null)
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
                  <ShopOutlined
                    style={{ color: "#1890ff" }}
                    title="Se consultará automáticamente en SUNAT"
                  />
                ) : esDni ? (
                  <UserOutlined
                    style={{ color: "#1890ff" }}
                    title="Se consultará automáticamente en RENIEC"
                  />
                ) : (
                  <SearchOutlined style={{ color: "#ccc" }} />
                )
              }
            />
          </Form.Item>

          <Form.Item
            label="Vendedor Asignado"
            name="vendedor_id"
            rules={[
              { required: true, message: "Por favor seleccione un vendedor" },
            ]}
          >
            <Select
              placeholder="Seleccione vendedor"
              loading={loadingFormData}
              notFoundContent={
                loadingFormData ? (
                  <Spin size="small" />
                ) : (
                  "No hay vendedores disponibles"
                )
              }
              showSearch
              optionFilterProp="children"
            >
              {vendedores.map((vendedor) => (
                <Option key={vendedor.id_vendedor} value={vendedor.id_vendedor}>
                  [{vendedor.codigo}] {vendedor.nombre}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Fecha de Registro"
            name="fecha_registro"
            rules={[
              {
                required: true,
                message: "Por favor seleccione la fecha de registro",
              },
            ]}
          >
            <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item
            label="Razón Social"
            name="razon_social"
            rules={[
              { required: true, message: "Por favor ingrese la razón social" },
              {
                max: 100,
                message: "La razón social no puede exceder los 100 caracteres",
              },
            ]}
            extra={
              tipoDocumentoSeleccionado &&
              (esRuc
                ? "Se completará automáticamente al ingresar RUC válido"
                : esDni
                ? "Se completará automáticamente al ingresar DNI válido"
                : null)
            }
          >
            <Input
              placeholder={
                esDni ? "Ej: Juan Pérez García" : "Ej: EMPRESA EJEMPLO S.A.C."
              }
              maxLength={100}
              disabled={consultandoDocumento}
            />
          </Form.Item>

          <Form.Item
            label="Nombre Comercial"
            name="nomb_comercial"
            rules={[
              {
                max: 100,
                message:
                  "El nombre comercial no puede exceder los 100 caracteres",
              },
            ]}
            extra={
              tipoDocumentoSeleccionado &&
              (esRuc
                ? "Se completará automáticamente al ingresar RUC válido"
                : esDni
                ? "Se completará automáticamente al ingresar DNI válido"
                : null)
            }
          >
            <Input
              placeholder="Ej: Empresa Ejemplo"
              maxLength={100}
              disabled={consultandoDocumento}
            />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { type: "email", message: "Ingrese un email válido" },
              {
                max: 100,
                message: "El email no puede exceder los 100 caracteres",
              },
            ]}
          >
            <Input placeholder="Ej: cliente@ejemplo.com" maxLength={100} />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            label="País"
            name="id_pais"
            rules={[
              { required: true, message: "Por favor seleccione un país" },
            ]}
          >
            <Select
              placeholder="Seleccione país"
              loading={loadingFormData}
              notFoundContent={
                loadingFormData ? (
                  <Spin size="small" />
                ) : (
                  "No hay países disponibles"
                )
              }
              showSearch
              optionFilterProp="children"
            >
              {paises.map((pais) => (
                <Option key={pais.id} value={pais.id}>
                  {pais.nombre}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Departamento" name="id_departamento">
                <Select
                  placeholder="Seleccione departamento"
                  loading={loadingFormData}
                  onChange={handleDepartamentoChange}
                  showSearch
                  optionFilterProp="children"
                  allowClear
                >
                  {departamentos.map((departamento) => (
                    <Option key={departamento.id} value={departamento.id}>
                      {departamento.nombre}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Distrito/Provincia" name="id_distrito">
                <Select
                  placeholder="Seleccione distrito"
                  loading={loadingFormData}
                  disabled={!departamentoSeleccionado}
                  showSearch
                  optionFilterProp="children"
                  allowClear
                >
                  {distritosFiltrados.map((distrito) => (
                    <Option key={distrito.id} value={distrito.id}>
                      {distrito.nombre}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Dirección"
            name="direccion"
            rules={[
              {
                max: 200,
                message: "La dirección no puede exceder los 200 caracteres",
              },
            ]}
            extra={
              esRuc
                ? "Se completará automáticamente al ingresar RUC válido"
                : null
            }
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
                rules={[
                  {
                    max: 20,
                    message: "El teléfono no puede exceder los 20 caracteres",
                  },
                ]}
              >
                <Input placeholder="Ej: 01-2345678" maxLength={20} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Teléfono 2"
                name="telefono2"
                rules={[
                  {
                    max: 20,
                    message: "El teléfono no puede exceder los 20 caracteres",
                  },
                ]}
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
                rules={[
                  {
                    max: 20,
                    message: "El celular no puede exceder los 20 caracteres",
                  },
                ]}
              >
                <Input placeholder="Ej: 987654321" maxLength={20} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Celular 2"
                name="celular2"
                rules={[
                  {
                    max: 20,
                    message: "El celular no puede exceder los 20 caracteres",
                  },
                ]}
              >
                <Input placeholder="Ej: 987654322" maxLength={20} />
              </Form.Item>
            </Col>
          </Row>

          {/* Estado del Cliente */}
          <Card
            size="small"
            title="Estado del Cliente"
            style={{ marginBottom: 16 }}
          >
            <Form.Item
              name="estado"
              valuePropName="checked"
              rules={[
                {
                  required: true,
                  message: "Por favor defina el estado del cliente",
                },
              ]}
            >
              <Switch checkedChildren="Activo" unCheckedChildren="Inactivo" />
            </Form.Item>
          </Card>

          {/* Información Financiera - SIEMPRE PRESENTE EN EL FORMULARIO PERO OCULTA VISUALMENTE */}
          <div style={{ marginBottom: 16 }}>
            <Button
              type="dashed"
              icon={<DollarOutlined />}
              onClick={() => setShowInfoFinanciera(!showInfoFinanciera)}
            >
              {showInfoFinanciera ? "Ocultar" : "Mostrar"} Información
              Financiera
            </Button>
          </div>

          {/* Campos financieros siempre presentes en el formulario pero ocultos visualmente */}
          <div style={{ display: "none" }}>
            <Form.Item name="linea_credito">
              <InputNumber />
            </Form.Item>
            <Form.Item name="tasa_interes">
              <InputNumber />
            </Form.Item>
            <Form.Item name="forma_pago_id">
              <Select />
            </Form.Item>
            <Form.Item name="descuento_1">
              <InputNumber />
            </Form.Item>
            <Form.Item name="descuento_2">
              <InputNumber />
            </Form.Item>
            <Form.Item name="cuenta_detraccion">
              <Input />
            </Form.Item>
            <Form.Item name="financiera_estado">
              <Switch />
            </Form.Item>
          </div>

          {showInfoFinanciera && (
            <Card
              size="small"
              title="Información Financiera"
              style={{ marginBottom: 16 }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Línea de Crédito"
                    name="linea_credito"
                    rules={[
                      {
                        type: "number",
                        min: 0,
                        message:
                          "La línea de crédito debe ser un número positivo",
                      },
                    ]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      placeholder="0.00"
                      min={0}
                      step={100}
                      formatter={(value) =>
                        `S/ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                      parser={(value) => value.replace(/S\/\s?|(,*)/g, "")}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Tasa de Interés (%)"
                    name="tasa_interes"
                    rules={[
                      {
                        type: "number",
                        min: 0,
                        max: 100,
                        message: "La tasa debe estar entre 0 y 100",
                      },
                    ]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      placeholder="0.00"
                      min={0}
                      max={100}
                      step={0.1}
                      formatter={(value) => `${value}%`}
                      parser={(value) => value.replace("%", "")}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Forma de Pago" name="forma_pago_id">
                <Select
                  placeholder="Seleccione forma de pago"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                >
                  {formasPago?.map((forma) => (
                    <Option key={forma.id} value={forma.id}>
                      {forma.nombre}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Descuento 1 (%)"
                    name="descuento_1"
                    rules={[
                      {
                        type: "number",
                        min: 0,
                        max: 100,
                        message: "El descuento debe estar entre 0 y 100",
                      },
                    ]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      placeholder="0.00"
                      min={0}
                      max={100}
                      step={0.1}
                      formatter={(value) => `${value}%`}
                      parser={(value) => value.replace("%", "")}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Descuento 2 (%)"
                    name="descuento_2"
                    rules={[
                      {
                        type: "number",
                        min: 0,
                        max: 100,
                        message: "El descuento debe estar entre 0 y 100",
                      },
                    ]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      placeholder="0.00"
                      min={0}
                      max={100}
                      step={0.1}
                      formatter={(value) => `${value}%`}
                      parser={(value) => value.replace("%", "")}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Cuenta de Detracción"
                name="cuenta_detraccion"
                rules={[
                  {
                    max: 50,
                    message: "La cuenta no puede exceder los 50 caracteres",
                  },
                ]}
              >
                <Input
                  placeholder="Número de cuenta de detracción"
                  maxLength={50}
                />
              </Form.Item>

              {/* Estado de la Información Financiera */}
              <Card
                size="small"
                title="Estado de la Información Financiera"
                style={{ marginTop: 16 }}
              >
                <Form.Item
                  name="financiera_estado"
                  valuePropName="checked"
                  label="Activar información financiera"
                >
                  <Switch
                    checkedChildren="Habilitada"
                    unCheckedChildren="Deshabilitada"
                    defaultChecked={true}
                  />
                </Form.Item>
              </Card>
            </Card>
          )}
        </Col>
      </Row>

      <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
        <Space>
          <Button
            onClick={onCancel}
            disabled={isSubmitting || consultandoDocumento}
          >
            Cancelar
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={isSubmitting}
            disabled={consultandoDocumento}
          >
            {editingCliente ? "Actualizar" : "Crear"}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default ClienteForm;
