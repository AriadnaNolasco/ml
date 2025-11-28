import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  DatePicker,
  Select,
  Row,
  Col,
  Card,
  message,
  Divider,
  Spin,
  Typography,
  Space,
} from "antd";
import { SearchOutlined, UserOutlined, TruckOutlined, SaveOutlined } from "@ant-design/icons";
import moment from "moment";
import api from "../../api/api";

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const EquiposForm = ({ editingRecepcion, motivosRecepcion, onSuccess, onCancel, user }) => {
  const [form] = Form.useForm();
  const [clienteData, setClienteData] = useState(null); // Data completa del cliente para el formulario
  const [isSearching, setIsSearching] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (editingRecepcion) {
      setClienteData(editingRecepcion.cliente_info);

      form.setFieldsValue({
        ...editingRecepcion,
        cliente_ruc: editingRecepcion.cliente_ruc, 
        fecha_recepcion: moment(editingRecepcion.fecha_recepcion),
        motivo_id: editingRecepcion.motivo_id || motivosRecepcion.find(m => m.nombre === editingRecepcion.motivo_recepcion)?.id, 
        id_cliente: editingRecepcion.cliente_id, // Usar cliente_id del objeto de edición
      });
    } else {
      form.resetFields();
      setClienteData(null);
      form.setFieldsValue({
        motivo_id: motivosRecepcion.length > 0 ? motivosRecepcion[0].id : undefined,
        fecha_recepcion: moment(),
      });
    }
  }, [editingRecepcion, form, motivosRecepcion]);

  const handleSearchCliente = async (ruc) => {
    if (!ruc || ruc.length < 8) {
      message.warning("Ingrese un RUC o DNI válido (mínimo 8 caracteres).");
      setClienteData(null);
      form.setFieldsValue({ id_cliente: null });
      return;
    }

    setIsSearching(true);
    try {
      const response = await api.get(`/mantenimiento/clientes/search?ruc=${ruc}`);
      const cliente = response.data;
      
      if (cliente && cliente.id) { // Usar cliente.id para id_cliente
        setClienteData(cliente);
        form.setFieldsValue({
          id_cliente: cliente.id, 
          cliente_ruc: cliente.ruc,
        });
        message.success(`Cliente encontrado: ${cliente.nombre_cliente}`);
      } else {
        message.error("Cliente no encontrado en el ERP.");
        setClienteData(null);
        form.setFieldsValue({ id_cliente: null });
      }
    } catch (error) {
      console.error("Error buscando cliente:", error);
      message.error(error.response?.data?.error || "Error al buscar cliente. Verifique la conexión.");
      setClienteData(null);
      form.setFieldsValue({ id_cliente: null });
    } finally {
      setIsSearching(false);
    }
  };

  const onFinish = async (values) => {
    if (!clienteData || !values.id_cliente) {
      message.error("Debe buscar y seleccionar un cliente válido.");
      return;
    }

    const data = {
      ...values,
      cliente_id: values.id_cliente,
      fecha_recepcion: values.fecha_recepcion.format("YYYY-MM-DD"),
      created_by: user?.id,
      updated_by: user?.id,
    };
    
    delete data.cliente_ruc;
    delete data.id_cliente;

    if (editingRecepcion) {
        data.estado_proceso = editingRecepcion.estado_proceso; // Mantener el estado si no hay un campo para él
    }
    
    // Asegurarse de que el ID del cliente se envíe como cliente_id
    if (!data.cliente_id) { 
        data.cliente_id = values.id_cliente; 
    }

    setSubmitLoading(true);

    try {
      if (editingRecepcion) {
        await api.put(`/mantenimiento/equipos/${editingRecepcion.id}`, data);
        message.success("Recepción de Equipo actualizada correctamente.");
      } else {
        await api.post("/mantenimiento/equipos", data);
        message.success("Recepción de Equipo registrada correctamente.");
      }
      onSuccess();
    } catch (error) {
      console.error("Error en la operación:", error);
      const errorMsg = 
        error.response?.data?.detalle || 
        error.response?.data?.error || 
        (editingRecepcion ? "Error al actualizar la recepción." : "Error al crear la recepción.");
      message.error(errorMsg);
    } finally {
      setSubmitLoading(false);
    }
  };

  const motivoOptions = motivosRecepcion.map(motivo => ({
    value: motivo.id,
    label: motivo.nombre,
  }));

  return (
    <Spin spinning={submitLoading} tip={editingRecepcion ? "Actualizando..." : "Registrando..."}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <Card size="small" title={<Title level={5} className="flex items-center"><UserOutlined style={{ marginRight: 8 }} /> Información del Cliente</Title>}>
          <Row gutter={16}>
            <Col span={10}>
              <Form.Item
                label={<Text strong>RUC / DNI del Cliente</Text>}
                name="cliente_ruc"
                rules={[
                  {
                    required: true,
                    message: "Ingrese el RUC o DNI del cliente.",
                  },
                ]}
              >
                <Input.Search
                  placeholder="Buscar RUC / DNI"
                  enterButton={<SearchOutlined />}
                  onSearch={handleSearchCliente}
                  loading={isSearching}
                  disabled={editingRecepcion}
                  maxLength={11}
                  size="large"
                />
              </Form.Item>
              <Form.Item hidden name="id_cliente">
                <Input />
              </Form.Item>
            </Col>
            <Col span={14}>
              <Card 
                size="small" 
                title={<Text strong type={clienteData ? 'success' : 'danger'}><UserOutlined style={{ marginRight: 5 }} /> Cliente: {clienteData?.nombre_cliente || 'No Seleccionado'}</Text>}
                style={{ height: '100%' }}
              >
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {clienteData ? `Código: ${clienteData.codigo} | Tlf: ${clienteData.telefono1 || 'N/A'}` : 'Use el botón de búsqueda para cargar los datos del cliente.'}
                </Text>
              </Card>
            </Col>
          </Row>
        </Card>
        
        <Divider orientation="left"><Title level={5} className="flex items-center"><TruckOutlined style={{ marginRight: 8 }} /> Datos de la Recepción (Equipo)</Title></Divider>

        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              label={<Text strong>Código BPC</Text>}
              name="codigo_bpc"
              rules={[
                { required: true, message: "Ingrese el código BPC." },
                { max: 4, message: "Máximo 4 caracteres." }
              ]}
              tooltip="Código interno BPC de la recepción."
            >
              <Input placeholder="Ej. BPC0" maxLength={4} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label={<Text strong>Código SOLPED</Text>}
              name="codigo_solped"
              rules={[{ max: 12, message: "Máximo 12 caracteres." }]}
              tooltip="Código de solicitud de pedido (SOLPED)."
            >
              <Input placeholder="Ej. 100000000000" maxLength={12} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label={<Text strong>Fecha Recepción</Text>}
              name="fecha_recepcion"
              rules={[{ required: true, message: "Seleccione la fecha de recepción." }]}
            >
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label={<Text strong>Motivo del Envío</Text>}
              name="motivo_id"
              rules={[{ required: true, message: "Seleccione el motivo de envío." }]}
            >
              <Select placeholder="Seleccione Motivo" size="middle">
                {motivoOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label={<Text strong>Marca (Equipo)</Text>}
              name="marca"
              rules={[{ max: 50, message: "Máximo 50 caracteres." }]}
            >
              <Input placeholder="Ej. Caterpillar" maxLength={50} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={<Text strong>Modelo (Equipo)</Text>}
              name="modelo"
              rules={[{ max: 50, message: "Máximo 50 caracteres." }]}
            >
              <Input placeholder="Ej. C15" maxLength={50} />
            </Form.Item>
          </Col>
          
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={<Text strong>Descripción del Problema</Text>}
              name="descripcion_problema"
              rules={[{ required: true, message: "Ingrese la descripción inicial del problema." }]}
            >
              <TextArea rows={4} placeholder="Detalle lo más claramente posible el problema o falla reportada." />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={<Text strong>Observaciones Adicionales</Text>}
              name="observaciones"
            >
              <TextArea rows={4} placeholder="Notas internas o comentarios adicionales sobre la recepción." />
            </Form.Item>
          </Col>
        </Row>
        
        <Divider />
        <Form.Item style={{ textAlign: "right" }}>
          <Space>
            <Button onClick={onCancel} disabled={submitLoading}>
              Cancelar
            </Button>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={submitLoading}>
              {editingRecepcion ? "Actualizar Recepción" : "Guardar Recepción"}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Spin>
  );
};

export default EquiposForm;