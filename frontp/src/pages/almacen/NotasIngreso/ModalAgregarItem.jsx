import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  InputNumber,
  Input,
  Radio,
  Row,
  Col,
  Table,
  Space,
  Typography,
  message,
  Divider
} from 'antd';
import dayjs from 'dayjs';
import api from '../../../api/api';

const { Option } = Select;
const { Text } = Typography;
const { TextArea } = Input;

const ModalAgregarItem = ({ visible, onClose, onAdd, ordenCompra, itemsAgregados }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [almacenes, setAlmacenes] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [estadoCalidad, setEstadoCalidad] = useState('TODO_CONFORME');
  const [productosDisponibles, setProductosDisponibles] = useState([]);

  useEffect(() => {
    if (visible) {
      cargarAlmacenes();
      cargarProductosDisponibles();
      form.resetFields();
      setProductoSeleccionado(null);
      setEstadoCalidad('TODO_CONFORME');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, ordenCompra, itemsAgregados]);

  const cargarAlmacenes = async () => {
    try {
      const response = await api.get('/almacen/almacenes');
      // La tabla almacenes no tiene campo estado, usar todos los almacenes
      setAlmacenes(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error al cargar almacenes:', error);
      message.error('Error al cargar almacenes');
      setAlmacenes([]);
    }
  };

  const cargarProductosDisponibles = () => {
    if (!ordenCompra || !ordenCompra.detalle) {
      setProductosDisponibles([]);
      return;
    }

    // Filtrar productos que ya fueron agregados o que no tienen cantidad pendiente
    const codigosAgregados = itemsAgregados.map(item => item.producto_codigo);
    
    const disponibles = ordenCompra.detalle
      .filter(detalle => {
        const cantidadPendiente = parseFloat(detalle.cantidad_solicitada || 0) - parseFloat(detalle.cantidad_recibida || 0);
        return cantidadPendiente > 0 && !codigosAgregados.includes(detalle.producto_codigo);
      })
      .map(detalle => ({
        ...detalle,
        cantidad_pendiente: parseFloat(detalle.cantidad_solicitada || 0) - parseFloat(detalle.cantidad_recibida || 0)
      }));

    setProductosDisponibles(disponibles);
  };

  const handleProductoChange = (value) => {
    const producto = productosDisponibles.find(p => p.id === value);
    setProductoSeleccionado(producto);
    
    // Resetear campos relacionados con cantidad
    form.setFieldsValue({
      cantidad_ingresada: null,
      cantidad_conforme: null,
      cantidad_no_conforme: null
    });
  };

  const handleEstadoCalidadChange = (e) => {
    const nuevoEstado = e.target.value;
    setEstadoCalidad(nuevoEstado);
    
    // Si cambia a TODO_CONFORME, limpiar campos de observaciones
    if (nuevoEstado === 'TODO_CONFORME') {
      form.setFieldsValue({
        cantidad_conforme: form.getFieldValue('cantidad_ingresada'),
        cantidad_no_conforme: 0,
        motivo_rechazo: null,
        almacen_no_conforme_id: null
      });
    }
  };

  const handleCantidadIngresadaChange = (value) => {
    if (estadoCalidad === 'TODO_CONFORME') {
      form.setFieldsValue({
        cantidad_conforme: value,
        cantidad_no_conforme: 0
      });
    }
  };

  const handleAgregar = async () => {
    try {
      // Validar formulario
      const values = await form.validateFields();

      // Validaciones adicionales
      if (!productoSeleccionado) {
        message.error('Debe seleccionar un producto');
        return;
      }

      if (!values.cantidad_ingresada || values.cantidad_ingresada <= 0) {
        message.error('La cantidad debe ser mayor a 0');
        return;
      }

      if (values.cantidad_ingresada > productoSeleccionado.cantidad_pendiente) {
        message.error(`La cantidad no puede exceder la cantidad pendiente (${productoSeleccionado.cantidad_pendiente})`);
        return;
      }

      if (!values.almacen_id) {
        message.error('Debe seleccionar un almacén destino');
        return;
      }

      // Validaciones de control de calidad
      if (estadoCalidad === 'CON_OBSERVACIONES') {
        const conforme = parseFloat(values.cantidad_conforme || 0);
        const noConforme = parseFloat(values.cantidad_no_conforme || 0);
        const ingresada = parseFloat(values.cantidad_ingresada || 0);

        if (Math.abs((conforme + noConforme) - ingresada) > 0.001) {
          message.error('La suma de cantidad conforme y no conforme debe ser igual a la cantidad ingresada');
          return;
        }

        if (noConforme > 0) {
          if (!values.almacen_no_conforme_id) {
            message.error('Debe seleccionar un almacén para productos no conformes');
            return;
          }
          if (!values.motivo_rechazo || values.motivo_rechazo.trim() === '') {
            message.error('Debe indicar el motivo de rechazo para productos no conformes');
            return;
          }
        }
      }

      // Preparar datos del item
      const almacenSeleccionado = almacenes.find(a => a.id_alm === values.almacen_id);
      const almacenNoConformeSeleccionado = values.almacen_no_conforme_id 
        ? almacenes.find(a => a.id_alm === values.almacen_no_conforme_id)
        : null;

      const nuevoItem = {
        orden_compra_detalle_id: productoSeleccionado.id,
        producto_codigo: productoSeleccionado.producto_codigo,
        producto_descripcion: productoSeleccionado.producto_descripcion || productoSeleccionado.descripcion,
        unidad_medida: productoSeleccionado.unidad_medida,
        almacen_id: values.almacen_id,
        almacen_nombre: almacenSeleccionado?.nombre || '',
        cantidad_ingresada: values.cantidad_ingresada,
        cantidad_conforme: estadoCalidad === 'TODO_CONFORME' ? values.cantidad_ingresada : (values.cantidad_conforme || 0),
        cantidad_no_conforme: estadoCalidad === 'TODO_CONFORME' ? 0 : (values.cantidad_no_conforme || 0),
        estado_calidad: estadoCalidad === 'TODO_CONFORME' ? 'CONFORME' : 
                       (values.cantidad_no_conforme > 0 ? 'NO_CONFORME' : 'CONFORME'),
        motivo_rechazo: values.motivo_rechazo || '',
        almacen_no_conforme_id: values.almacen_no_conforme_id || null,
        almacen_no_conforme_nombre: almacenNoConformeSeleccionado?.nombre || '',
        observaciones: values.observaciones || ''
      };

      // Llamar al callback para agregar el item
      onAdd(nuevoItem);

      // Cerrar modal
      handleCancelar();
    } catch (error) {
      console.error('Error al validar formulario:', error);
      // Los errores de validación ya se muestran automáticamente por Ant Design
    }
  };

  const handleCancelar = () => {
    form.resetFields();
    setProductoSeleccionado(null);
    setEstadoCalidad('TODO_CONFORME');
    onClose();
  };

  const columnasProductos = [
    {
      title: '',
      dataIndex: 'id',
      key: 'radio',
      width: 50,
      render: (id) => (
        <Radio
          value={id}
          checked={productoSeleccionado?.id === id}
          onChange={() => {
            const producto = productosDisponibles.find(p => p.id === id);
            handleProductoChange(id);
            form.setFieldsValue({ producto_id: id });
          }}
        />
      )
    },
    {
      title: 'Código',
      dataIndex: 'producto_codigo',
      key: 'producto_codigo',
      width: 120
    },
    {
      title: 'Descripción',
      dataIndex: 'producto_descripcion',
      key: 'producto_descripcion',
      ellipsis: true,
      render: (text, record) => text || record.descripcion
    },
    {
      title: 'UM',
      dataIndex: 'unidad_medida',
      key: 'unidad_medida',
      width: 80,
      align: 'center'
    },
    {
      title: 'Solicitado',
      dataIndex: 'cantidad_solicitada',
      key: 'cantidad_solicitada',
      width: 100,
      align: 'right',
      render: (text) => parseFloat(text || 0).toFixed(3)
    },
    {
      title: 'Recibido',
      dataIndex: 'cantidad_recibida',
      key: 'cantidad_recibida',
      width: 100,
      align: 'right',
      render: (text) => parseFloat(text || 0).toFixed(3)
    },
    {
      title: 'Pendiente',
      dataIndex: 'cantidad_pendiente',
      key: 'cantidad_pendiente',
      width: 100,
      align: 'right',
      render: (text) => (
        <Text strong style={{ color: '#1890ff' }}>
          {parseFloat(text || 0).toFixed(3)}
        </Text>
      )
    }
  ];

  return (
    <Modal
      title="Agregar Producto"
      open={visible}
      onCancel={handleCancelar}
      onOk={handleAgregar}
      okText="Agregar"
      cancelText="Cancelar"
      width={1000}
      confirmLoading={loading}
    >
      <Form
        form={form}
        layout="vertical"
      >
        {/* Tabla de productos disponibles */}
        <Form.Item
          name="producto_id"
          label="Seleccionar Producto"
          rules={[{ required: true, message: 'Debe seleccionar un producto' }]}
        >
          <Table
            columns={columnasProductos}
            dataSource={productosDisponibles}
            rowKey="id"
            pagination={false}
            size="small"
            scroll={{ y: 200 }}
            locale={{ emptyText: 'No hay productos disponibles para agregar' }}
            onRow={(record) => ({
              onClick: () => {
                handleProductoChange(record.id);
                form.setFieldsValue({ producto_id: record.id });
              },
              style: { cursor: 'pointer' }
            })}
          />
        </Form.Item>

        <Divider />

        {/* Campos de ingreso */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="almacen_id"
              label="Almacén Destino"
              rules={[{ required: true, message: 'Seleccione el almacén destino' }]}
            >
              <Select
                placeholder="Seleccionar almacén"
                showSearch
                optionFilterProp="children"
                disabled={!productoSeleccionado}
              >
                {almacenes.map(alm => (
                  <Option key={alm.id_alm} value={alm.id_alm}>
                    {alm.nombre}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="cantidad_ingresada"
              label="Cantidad a Ingresar"
              rules={[
                { required: true, message: 'Ingrese la cantidad' },
                {
                  validator: (_, value) => {
                    if (!value || value <= 0) {
                      return Promise.reject('La cantidad debe ser mayor a 0');
                    }
                    if (productoSeleccionado && value > productoSeleccionado.cantidad_pendiente) {
                      return Promise.reject(`No puede exceder la cantidad pendiente (${productoSeleccionado.cantidad_pendiente})`);
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={0.001}
                precision={3}
                placeholder="0.000"
                disabled={!productoSeleccionado}
                onChange={handleCantidadIngresadaChange}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider>Control de Calidad</Divider>

        {/* Control de calidad */}
        <Form.Item label="Estado de Calidad">
          <Radio.Group
            value={estadoCalidad}
            onChange={handleEstadoCalidadChange}
            disabled={!productoSeleccionado}
          >
            <Radio value="TODO_CONFORME">Todo Conforme</Radio>
            <Radio value="CON_OBSERVACIONES">Con Observaciones</Radio>
          </Radio.Group>
        </Form.Item>

        {estadoCalidad === 'CON_OBSERVACIONES' && (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="cantidad_conforme"
                  label="Cantidad Conforme"
                  rules={[
                    { required: true, message: 'Ingrese la cantidad conforme' },
                    {
                      validator: (_, value) => {
                        const ingresada = form.getFieldValue('cantidad_ingresada');
                        const noConforme = form.getFieldValue('cantidad_no_conforme') || 0;
                        if (value !== undefined && ingresada !== undefined) {
                          if (Math.abs((parseFloat(value) + parseFloat(noConforme)) - parseFloat(ingresada)) > 0.001) {
                            return Promise.reject('La suma debe ser igual a la cantidad ingresada');
                          }
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    step={0.001}
                    precision={3}
                    placeholder="0.000"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="cantidad_no_conforme"
                  label="Cantidad No Conforme"
                  rules={[
                    { required: true, message: 'Ingrese la cantidad no conforme' },
                    {
                      validator: (_, value) => {
                        const ingresada = form.getFieldValue('cantidad_ingresada');
                        const conforme = form.getFieldValue('cantidad_conforme') || 0;
                        if (value !== undefined && ingresada !== undefined) {
                          if (Math.abs((parseFloat(conforme) + parseFloat(value)) - parseFloat(ingresada)) > 0.001) {
                            return Promise.reject('La suma debe ser igual a la cantidad ingresada');
                          }
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    step={0.001}
                    precision={3}
                    placeholder="0.000"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="almacen_no_conforme_id"
                  label="Almacén No Conformes"
                  rules={[
                    {
                      validator: (_, value) => {
                        const noConforme = form.getFieldValue('cantidad_no_conforme');
                        if (noConforme > 0 && !value) {
                          return Promise.reject('Debe seleccionar un almacén para no conformes');
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <Select
                    placeholder="Seleccionar almacén"
                    showSearch
                    optionFilterProp="children"
                  >
                    {almacenes.map(alm => (
                      <Option key={alm.id_alm} value={alm.id_alm}>
                        {alm.nombre}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="motivo_rechazo"
                  label="Motivo de Rechazo"
                  rules={[
                    {
                      validator: (_, value) => {
                        const noConforme = form.getFieldValue('cantidad_no_conforme');
                        if (noConforme > 0 && (!value || value.trim() === '')) {
                          return Promise.reject('Debe indicar el motivo de rechazo');
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <TextArea
                    rows={2}
                    placeholder="Describa el motivo del rechazo"
                  />
                </Form.Item>
              </Col>
            </Row>
          </>
        )}

        {/* Observaciones */}
        <Form.Item name="observaciones" label="Observaciones">
          <TextArea
            rows={2}
            placeholder="Observaciones adicionales (opcional)"
            disabled={!productoSeleccionado}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ModalAgregarItem;
