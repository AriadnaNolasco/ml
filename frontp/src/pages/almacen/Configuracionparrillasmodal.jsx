import React, { useState } from "react";
import {
  Modal,
  Form,
  InputNumber,
  Select,
  Switch,
  Row,
  Col,
  Card,
  Divider,
  Typography,
} from "antd";

const { Option } = Select;
const { Title } = Typography;

/**
 * Modal para configurar las parrillas de un radiador
 *
 * @param {boolean} visible - Controla la visibilidad del modal
 * @param {function} onCancel - Función a ejecutar al cancelar
 * @param {function} onOk - Función a ejecutar al confirmar (recibe los valores)
 * @param {object} initialValues - Valores iniciales de la configuración
 */
const ConfiguracionParrillasModal = ({
  visible,
  onCancel,
  onOk,
  initialValues = {},
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      await onOk(values);
      form.resetFields();
    } catch (error) {
      console.error("Error al validar formulario:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title='Configuración de Parrillas'
      open={visible}
      onCancel={handleCancel}
      onOk={handleOk}
      confirmLoading={loading}
      width={800}
      okText='Guardar'
      cancelText='Cancelar'
    >
      <Form form={form} layout='vertical' initialValues={initialValues}>
        {/* PARRILLA SUPERIOR */}
        <Card
          title={<Title level={5}>Parrilla Superior</Title>}
          size='small'
          style={{ marginBottom: 16 }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label='Largo (cm)'
                name='ps_largo'
                rules={[
                  { required: true, message: "Ingrese el largo" },
                  {
                    type: "number",
                    min: 0,
                    message: "Debe ser mayor a 0",
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  step={0.1}
                  precision={2}
                  style={{ width: "100%" }}
                  placeholder='0.00'
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label='Ancho (cm)'
                name='ps_ancho'
                rules={[
                  { required: true, message: "Ingrese el ancho" },
                  {
                    type: "number",
                    min: 0,
                    message: "Debe ser mayor a 0",
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  step={0.1}
                  precision={2}
                  style={{ width: "100%" }}
                  placeholder='0.00'
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label='Espesor (mm)'
                name='ps_espesor'
                rules={[
                  { required: true, message: "Ingrese el espesor" },
                  {
                    type: "number",
                    min: 0,
                    message: "Debe ser mayor a 0",
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  step={0.1}
                  precision={2}
                  style={{ width: "100%" }}
                  placeholder='0.00'
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label='Tipo'
                name='ps_tipo'
                rules={[{ required: true, message: "Seleccione el tipo" }]}
              >
                <Select placeholder='Seleccione'>
                  <Option value='PLANAS'>Planas</Option>
                  <Option value='EMBUTIDAS'>Embutidas</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label='Posición'
                name='ps_posicion'
                rules={[{ required: true, message: "Seleccione la posición" }]}
              >
                <Select placeholder='Seleccione'>
                  <Option value='CENTRADA'>Centrada</Option>
                  <Option value='VOLADA'>Volada</Option>
                  <Option value='FULL'>Full</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label='Fijación'
                name='ps_fijacion'
                rules={[{ required: true, message: "Seleccione la fijación" }]}
              >
                <Select placeholder='Seleccione'>
                  <Option value='EMPERNAR'>Empernar</Option>
                  <Option value='SOLDAR'>Soldar</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label='Perforación'
                name='ps_perforacion'
                rules={[
                  { required: true, message: "Seleccione la perforación" },
                ]}
              >
                <Select placeholder='Seleccione'>
                  <Option value='PERFORADA'>Perforada</Option>
                  <Option value='CIEGA'>Ciega</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* PARRILLA INFERIOR */}
        <Card
          title={<Title level={5}>Parrilla Inferior</Title>}
          size='small'
          style={{ marginBottom: 16 }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label='Largo (cm)'
                name='pi_largo'
                rules={[
                  { required: true, message: "Ingrese el largo" },
                  {
                    type: "number",
                    min: 0,
                    message: "Debe ser mayor a 0",
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  step={0.1}
                  precision={2}
                  style={{ width: "100%" }}
                  placeholder='0.00'
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label='Ancho (cm)'
                name='pi_ancho'
                rules={[
                  { required: true, message: "Ingrese el ancho" },
                  {
                    type: "number",
                    min: 0,
                    message: "Debe ser mayor a 0",
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  step={0.1}
                  precision={2}
                  style={{ width: "100%" }}
                  placeholder='0.00'
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label='Espesor (mm)'
                name='pi_espesor'
                rules={[
                  { required: true, message: "Ingrese el espesor" },
                  {
                    type: "number",
                    min: 0,
                    message: "Debe ser mayor a 0",
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  step={0.1}
                  precision={2}
                  style={{ width: "100%" }}
                  placeholder='0.00'
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label='Tipo'
                name='pi_tipo'
                rules={[{ required: true, message: "Seleccione el tipo" }]}
              >
                <Select placeholder='Seleccione'>
                  <Option value='PLANAS'>Planas</Option>
                  <Option value='EMBUTIDAS'>Embutidas</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label='Posición'
                name='pi_posicion'
                rules={[{ required: true, message: "Seleccione la posición" }]}
              >
                <Select placeholder='Seleccione'>
                  <Option value='CENTRADA'>Centrada</Option>
                  <Option value='VOLADA'>Volada</Option>
                  <Option value='FULL'>Full</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label='Fijación'
                name='pi_fijacion'
                rules={[{ required: true, message: "Seleccione la fijación" }]}
              >
                <Select placeholder='Seleccione'>
                  <Option value='EMPERNAR'>Empernar</Option>
                  <Option value='SOLDAR'>Soldar</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label='Perforación'
                name='pi_perforacion'
                rules={[
                  { required: true, message: "Seleccione la perforación" },
                ]}
              >
                <Select placeholder='Seleccione'>
                  <Option value='PERFORADA'>Perforada</Option>
                  <Option value='CIEGA'>Ciega</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* CONFIGURACIONES ADICIONALES */}
        <Card
          title={<Title level={5}>Configuraciones Adicionales</Title>}
          size='small'
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label='Tubos Flotantes'
                name='tubos_flotantes'
                valuePropName='checked'
              >
                <Switch />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label='Parrilla Intermedia'
                name='parrilla_intermedia'
                valuePropName='checked'
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>
    </Modal>
  );
};

export default ConfiguracionParrillasModal;
