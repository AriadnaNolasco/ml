import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Select,
  DatePicker,
  Row,
  Col,
  Card,
  Table,
  Space,
  Typography,
  Divider,
  message,
  Tag,
  Spin,
  Collapse,
  Modal
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../../../api/api';
import ModalAgregarItem from './ModalAgregarItem';

const { Option } = Select;
const { Text } = Typography;
const { TextArea } = Input;
const { Panel } = Collapse;

const NotasIngresoForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [form] = Form.useForm();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(false);
  const [loadingDatos, setLoadingDatos] = useState(false);
  const [ordenCompra, setOrdenCompra] = useState(null);
  const [items, setItems] = useState([]);
  const [transportistas, setTransportistas] = useState([]);
  const [aduanas, setAduanas] = useState([]);
  const [incoterms, setIncoterms] = useState([]);
  const [mediosTransporte, setMediosTransporte] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [modalAgregarVisible, setModalAgregarVisible] = useState(false);
  const [itemEditando, setItemEditando] = useState(null);
  const [numeroNota, setNumeroNota] = useState(null);

  // Función para cargar nota de ingreso en modo edición
  const cargarNotaIngreso = async () => {
    setLoadingDatos(true);
    try {
      const response = await api.get(`/almacen/notas-ingreso/${id}`);
      const nota = response.data;

      // Guardar el número de la nota
      setNumeroNota(nota.numero);

      // Verificar que esté en estado BORRADOR
      if (nota.estado !== 'BORRADOR') {
        message.error('Solo se pueden editar notas de ingreso en estado BORRADOR');
        navigate('/almacen/notas-ingreso');
        return;
      }

      // Cargar orden de compra asociada
      const ocResponse = await api.get(`/compras/ordenes-compra/${nota.orden_compra_id}/detalles`);
      const oc = ocResponse.data;
      
      // Transformar detalles a detalle para consistencia
      if (oc.detalles && !oc.detalle) {
        oc.detalle = oc.detalles;
      }
      
      setOrdenCompra(oc);

      // Cargar catálogos
      await cargarDatosIniciales(oc.tipo);

      // Llenar formulario con datos de la OC y la nota
      form.setFieldsValue({
        tipo: oc.tipo,
        fecha_ingreso: nota.fecha_ingreso ? dayjs(nota.fecha_ingreso) : dayjs(),
        orden_compra_numero: oc.numero,
        orden_compra_id: oc.id,
        estado_oc: oc.estado,
        proveedor_id: oc.proveedor_id,
        
        // Datos del proveedor
        proveedor_ruc: oc.proveedor_num_doc || '',
        proveedor_razon_social: oc.proveedor_nombre || '',
        proveedor_direccion: oc.proveedor_direccion || '',
        proveedor_telefono: oc.proveedor_telefono || '',
        
        // Moneda
        moneda_id: oc.moneda_id,
        
        // Datos de la nota de ingreso
        fecha_recepcion: nota.fecha_recepcion ? dayjs(nota.fecha_recepcion) : null,
        guia_remision: nota.guia_remision,
        observaciones: nota.observaciones,
        
        // Campos LOCAL
        transportista_id: nota.transportista_id,
        placa_vehiculo: nota.placa_vehiculo,
        nombre_conductor: nota.nombre_conductor,
        
        // Campos EXTERNO
        numero_dam: nota.numero_dam,
        fecha_dam: nota.fecha_dam ? dayjs(nota.fecha_dam) : null,
        aduana_id: nota.aduana_id,
        incoterm_id: nota.incoterm_id,
        medio_transporte_id: nota.medio_transporte_id,
        numero_contenedor: nota.numero_contenedor,
        numero_precinto: nota.numero_precinto
      });

      // Cargar items del detalle
      if (nota.detalle && nota.detalle.length > 0) {
        const itemsFormateados = nota.detalle.map(item => ({
          key: item.numitem,
          numitem: item.numitem,
          producto_codigo: item.producto_codigo,
          producto_descripcion: item.producto_descripcion,
          cantidad_ingresada: item.cantidad_ingresada,
          cantidad_conforme: item.cantidad_conforme,
          cantidad_no_conforme: item.cantidad_no_conforme,
          almacen_id: item.almacen_id,
          almacen_no_conforme_id: item.almacen_no_conforme_id,
          observaciones: item.observaciones
        }));
        setItems(itemsFormateados);
      }

    } catch (error) {
      console.error('Error al cargar nota de ingreso:', error);
      message.error('Error al cargar la nota de ingreso');
      navigate('/almacen/notas-ingreso');
    } finally {
      setLoadingDatos(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    if (isEditMode) {
      // Modo edición: cargar nota de ingreso existente
      cargarNotaIngreso();
    } else if (location.state?.ordenCompra) {
      // Modo creación: obtener orden de compra desde location state
      setOrdenCompra(location.state.ordenCompra);
      cargarDatosIniciales();
      cargarDatosOrdenCompra(location.state.ordenCompra);
    } else {
      message.error('No se ha seleccionado una orden de compra');
      navigate('/almacen/notas-ingreso');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const cargarDatosIniciales = async (tipoOrden = null) => {
    setLoadingDatos(true);
    try {
      const tipo = tipoOrden || location.state?.ordenCompra?.tipo;
      
      // Cargar catálogos necesarios según el tipo de orden
      const requests = [
        api.get('/almacen/almacenes')
      ];

      // Solo cargar transportistas si es LOCAL
      if (tipo === 'LOCAL') {
        requests.push(api.get('/ventas/transportistas'));
      }

      // Solo cargar catálogos de importación si es EXTERNO
      if (tipo === 'EXTERNO') {
        requests.push(
          api.get('/public/aduanas'),
          api.get('/public/incoterms'),
          api.get('/public/medios-transporte')
        );
      }

      const responses = await Promise.all(requests);
      
      // Almacenes siempre es el primero
      setAlmacenes(responses[0].data.filter(alm => alm.estado === 'ACTIVO'));

      // Asignar el resto según el tipo
      if (tipo === 'LOCAL') {
        setTransportistas(responses[1]?.data || []);
      } else if (tipo === 'EXTERNO') {
        setAduanas(responses[1]?.data || []);
        setIncoterms(responses[2]?.data || []);
        setMediosTransporte(responses[3]?.data || []);
      }
    } catch (error) {
      message.error('Error al cargar datos iniciales');
      console.error('Error:', error);
    } finally {
      setLoadingDatos(false);
    }
  };

  const cargarDatosOrdenCompra = async (oc) => {
    try {
      // Cargar detalle completo de la orden de compra
      const response = await api.get(`/compras/ordenes-compra/${oc.id}/detalles`);
      const ocCompleta = response.data;
      
      // Transformar detalles a detalle para consistencia
      if (ocCompleta.detalles && !ocCompleta.detalle) {
        ocCompleta.detalle = ocCompleta.detalles;
      }
      
      setOrdenCompra(ocCompleta);

      // Auto-rellenar formulario con datos de la OC
      const formValues = {
        tipo: ocCompleta.tipo,
        fecha_ingreso: dayjs(),
        orden_compra_numero: ocCompleta.numero,
        orden_compra_id: ocCompleta.id,
        estado_oc: ocCompleta.estado,
        proveedor_id: ocCompleta.proveedor_id,
        
        // Datos del proveedor (vienen directos del query, no anidados)
        proveedor_ruc: ocCompleta.proveedor_num_doc || '',
        proveedor_razon_social: ocCompleta.proveedor_nombre || '',
        proveedor_direccion: ocCompleta.proveedor_direccion || '',
        proveedor_telefono: ocCompleta.proveedor_telefono || '',
        
        // Moneda (para referencia)
        moneda_id: ocCompleta.moneda_id
      };

      form.setFieldsValue(formValues);
    } catch (error) {
      message.error('Error al cargar datos de la orden de compra');
      console.error('Error:', error);
    }
  };

  const handleAgregarItem = () => {
    if (!ordenCompra) {
      message.error('No hay orden de compra cargada');
      return;
    }
    setItemEditando(null);
    setModalAgregarVisible(true);
  };

  const handleEditarItem = (item) => {
    setItemEditando(item);
    setModalAgregarVisible(true);
  };

  const handleEliminarItem = (key) => {
    setItems(items.filter(item => item.key !== key));
    message.success('Item eliminado');
  };

  const handleAgregarItemConfirmado = (nuevoItem) => {
    if (itemEditando) {
      // Editar item existente
      setItems(items.map(item => 
        item.key === itemEditando.key ? { ...nuevoItem, key: itemEditando.key } : item
      ));
      message.success('Item actualizado correctamente');
    } else {
      // Agregar nuevo item
      const itemConKey = {
        ...nuevoItem,
        key: Date.now(),
        numitem: items.length + 1
      };
      setItems([...items, itemConKey]);
      message.success('Item agregado correctamente');
    }
    setModalAgregarVisible(false);
    setItemEditando(null);
  };

  const handleCerrarModal = () => {
    setModalAgregarVisible(false);
    setItemEditando(null);
  };

  const handleGuardarBorrador = async () => {
    try {
      // Validar campos obligatorios básicos
      await form.validateFields([
        'fecha_ingreso',
        'tipo'
      ]);

      const values = form.getFieldsValue();
      const tipoOrden = values.tipo;

      setLoading(true);

      // Preparar datos para enviar
      const notaIngresoData = {
        tipo: tipoOrden,
        fecha_ingreso: values.fecha_ingreso.format('YYYY-MM-DD'),
        orden_compra_id: ordenCompra.id,
        proveedor_id: ordenCompra.proveedor_id,
        estado: 'BORRADOR',
        observaciones: values.observaciones || '',
        
        // Detalle de items
        detalle: items.map((item, index) => ({
          numitem: index + 1,
          orden_compra_detalle_id: item.orden_compra_detalle_id,
          producto_codigo: item.producto_codigo,
          almacen_id: item.almacen_id,
          cantidad_ingresada: item.cantidad_ingresada,
          cantidad_conforme: item.cantidad_conforme,
          cantidad_no_conforme: item.cantidad_no_conforme || 0,
          estado_calidad: item.estado_calidad || 'CONFORME',
          motivo_rechazo: item.motivo_rechazo || '',
          almacen_no_conforme_id: item.almacen_no_conforme_id || null,
          observaciones: item.observaciones || ''
        }))
      };

      console.log('Enviando notaIngresoData (borrador):', JSON.stringify(notaIngresoData, null, 2));

      let response;
      if (isEditMode) {
        // Actualizar nota existente
        response = await api.put(`/almacen/notas-ingreso/${id}`, notaIngresoData);
      } else {
        // Crear nueva nota
        response = await api.post('/almacen/notas-ingreso', notaIngresoData);
      }

      // Mostrar mensaje de éxito
      await Swal.fire({
        icon: 'success',
        title: isEditMode ? 'Borrador Actualizado' : 'Borrador Guardado',
        text: `Nota de ingreso ${response.data.nota?.numero || response.data.numero || ''} ${isEditMode ? 'actualizada' : 'guardada'} como borrador`,
        confirmButtonText: 'Aceptar'
      });

      // Navegar al listado
      navigate('/almacen/notas-ingreso');
    } catch (error) {
      console.error('Error al guardar borrador:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.data?.errores) {
        // Mostrar errores de validación del backend
        const erroresHtml = error.response.data.errores
          .map(err => `<li>${err}</li>`)
          .join('');
        
        Swal.fire({
          icon: 'error',
          title: 'Errores de Validación',
          html: `<ul style="text-align: left;">${erroresHtml}</ul>`,
          confirmButtonText: 'Aceptar'
        });
      } else {
        message.error(error.response?.data?.error || error.response?.data?.message || 'Error al guardar el borrador');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarIngreso = async () => {
    try {
      // Validar todos los campos según tipo
      const values = form.getFieldsValue();
      const tipoOrden = values.tipo;

      // Validar campos obligatorios
      await form.validateFields([
        'fecha_ingreso',
        'tipo'
      ]);

      // Validar que haya al menos un item
      if (items.length === 0) {
        message.error('Debe agregar al menos un producto para confirmar el ingreso');
        return;
      }

      // Validar cada item
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        if (!item.almacen_id) {
          message.error(`Item ${i + 1}: Debe seleccionar un almacén`);
          return;
        }
        
        if (!item.cantidad_ingresada || item.cantidad_ingresada <= 0) {
          message.error(`Item ${i + 1}: La cantidad debe ser mayor a 0`);
          return;
        }

        // Validar control de calidad
        const conforme = parseFloat(item.cantidad_conforme || 0);
        const noConforme = parseFloat(item.cantidad_no_conforme || 0);
        const ingresada = parseFloat(item.cantidad_ingresada || 0);

        if (Math.abs((conforme + noConforme) - ingresada) > 0.001) {
          message.error(`Item ${i + 1}: La suma de cantidad conforme y no conforme debe ser igual a la cantidad ingresada`);
          return;
        }

        if (noConforme > 0) {
          if (!item.almacen_no_conforme_id) {
            message.error(`Item ${i + 1}: Debe seleccionar un almacén para productos no conformes`);
            return;
          }
          if (!item.motivo_rechazo) {
            message.error(`Item ${i + 1}: Debe indicar el motivo de rechazo para productos no conformes`);
            return;
          }
        }
      }

      // Mostrar confirmación
      const result = await Swal.fire({
        icon: 'warning',
        title: '¿Confirmar Ingreso?',
        html: `
          <p>Esta acción confirmará el ingreso de los productos al almacén y actualizará el inventario.</p>
          <p><strong>¿Está seguro de continuar?</strong></p>
        `,
        showCancelButton: true,
        confirmButtonText: 'Sí, Confirmar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#1890ff',
        cancelButtonColor: '#d33'
      });

      if (!result.isConfirmed) {
        return;
      }

      setLoading(true);

      // Preparar datos para enviar
      const notaIngresoData = {
        tipo: tipoOrden,
        fecha_ingreso: values.fecha_ingreso.format('YYYY-MM-DD'),
        orden_compra_id: ordenCompra.id,
        proveedor_id: ordenCompra.proveedor_id,
        estado: 'BORRADOR', // Se crea como borrador y luego se confirma
        observaciones: values.observaciones || '',
        
        // Detalle de items
        detalle: items.map((item, index) => ({
          numitem: index + 1,
          orden_compra_detalle_id: item.orden_compra_detalle_id,
          producto_codigo: item.producto_codigo,
          almacen_id: item.almacen_id,
          cantidad_ingresada: item.cantidad_ingresada,
          cantidad_conforme: item.cantidad_conforme,
          cantidad_no_conforme: item.cantidad_no_conforme || 0,
          estado_calidad: item.estado_calidad || 'CONFORME',
          motivo_rechazo: item.motivo_rechazo || '',
          almacen_no_conforme_id: item.almacen_no_conforme_id || null,
          observaciones: item.observaciones || ''
        }))
      };

      console.log('Enviando notaIngresoData:', JSON.stringify(notaIngresoData, null, 2));

      let notaId, notaNumero;
      
      if (isEditMode) {
        // Actualizar nota existente
        const responseActualizar = await api.put(`/almacen/notas-ingreso/${id}`, notaIngresoData);
        notaId = id;
        notaNumero = responseActualizar.data.nota?.numero || responseActualizar.data.numero;
      } else {
        // Crear la nota de ingreso
        const responseCrear = await api.post('/almacen/notas-ingreso', notaIngresoData);
        notaId = responseCrear.data.nota?.id || responseCrear.data.id;
        notaNumero = responseCrear.data.nota?.numero || responseCrear.data.numero;
      }

      // Confirmar la nota de ingreso
      await api.post(`/almacen/notas-ingreso/${notaId}/confirmar`);

      // Mostrar mensaje de éxito
      await Swal.fire({
        icon: 'success',
        title: 'Ingreso Confirmado',
        html: `
          <p>Nota de ingreso <strong>${notaNumero || 'creada'}</strong> confirmada exitosamente.</p>
          <p>El inventario ha sido actualizado.</p>
        `,
        confirmButtonText: 'Aceptar'
      });

      // Navegar al listado
      navigate('/almacen/notas-ingreso');
    } catch (error) {
      console.error('Error al confirmar ingreso:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.data?.errores) {
        // Mostrar errores de validación del backend
        const erroresHtml = error.response.data.errores
          .map(err => `<li>${err}</li>`)
          .join('');
        
        Swal.fire({
          icon: 'error',
          title: 'Errores de Validación',
          html: `<ul style="text-align: left;">${erroresHtml}</ul>`,
          confirmButtonText: 'Aceptar'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response?.data?.error || error.response?.data?.message || 'Error al confirmar el ingreso',
          confirmButtonText: 'Aceptar'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = () => {
    navigate('/almacen/notas-ingreso');
  };

  const columnasItems = [
    {
      title: 'Item',
      dataIndex: 'numitem',
      key: 'numitem',
      width: 60,
      align: 'center'
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
      ellipsis: true
    },
    {
      title: 'UM',
      dataIndex: 'unidad_medida',
      key: 'unidad_medida',
      width: 80,
      align: 'center'
    },
    {
      title: 'Almacén',
      dataIndex: 'almacen_nombre',
      key: 'almacen_nombre',
      width: 150
    },
    {
      title: 'Cantidad',
      dataIndex: 'cantidad_ingresada',
      key: 'cantidad_ingresada',
      width: 100,
      align: 'right',
      render: (text) => parseFloat(text || 0).toFixed(3)
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditarItem(record)}
            size="small"
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleEliminarItem(record.key)}
            size="small"
          />
        </Space>
      )
    }
  ];

  if (loadingDatos || !ordenCompra) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Cargando datos...</div>
      </div>
    );
  }

  const tipoOrden = form.getFieldValue('tipo');

  return (
    <div style={{ padding: '24px' }}>
      <Card title={isEditMode ? "Editar Nota de Ingreso" : "Nueva Nota de Ingreso"} bordered={false}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            fecha_ingreso: dayjs(),
            estado: 'BORRADOR'
          }}
        >
          <Collapse defaultActiveKey={['1', '2', '3', '4']} style={{ marginBottom: 16 }}>
            {/* Card 1: Datos Generales */}
            <Panel header="Datos Generales" key="1">
              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item name="tipo" label="Tipo Documento">
                    <Input
                      readOnly
                      value={tipoOrden === 'LOCAL' ? 'NIC - Nota Ingreso Compra Local' : 'NIE - Nota Ingreso Compra Exterior'}
                      addonBefore={tipoOrden === 'LOCAL' ? 'NIC' : 'NIE'}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="Número">
                    <Input 
                      readOnly 
                      value={numeroNota || ''} 
                      placeholder={isEditMode ? 'Cargando...' : 'Se generará automáticamente'} 
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    name="fecha_ingreso"
                    label="Fecha Ingreso"
                    rules={[{ required: true, message: 'Seleccione la fecha de ingreso' }]}
                  >
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="orden_compra_numero" label="Orden de Compra">
                    <Input readOnly />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item name="estado_oc" label="Estado OC">
                    <Tag color={
                      ordenCompra?.estado === 'PENDIENTE' ? 'orange' :
                      ordenCompra?.estado === 'PARCIAL' ? 'blue' :
                      ordenCompra?.estado === 'ENTREGADA' ? 'green' : 'default'
                    }>
                      {ordenCompra?.estado || 'N/A'}
                    </Tag>
                  </Form.Item>
                </Col>
              </Row>
            </Panel>

            {/* Card 2: Datos del Proveedor */}
            <Panel header="Datos del Proveedor" key="2">
              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item name="proveedor_ruc" label={tipoOrden === 'LOCAL' ? 'RUC' : 'Tax ID'}>
                    <Input readOnly />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="proveedor_razon_social" label="Razón Social">
                    <Input readOnly />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="proveedor_telefono" label="Teléfono">
                    <Input readOnly />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item name="proveedor_direccion" label="Dirección">
                    <Input readOnly />
                  </Form.Item>
                </Col>
              </Row>
            </Panel>

            {/* Card 3: Productos a Ingresar */}
            <Panel header="Productos a Ingresar" key="3">
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAgregarItem}
                >
                  Agregar Item
                </Button>

                <Table
                  columns={columnasItems}
                  dataSource={items}
                  pagination={false}
                  size="small"
                  scroll={{ x: 800 }}
                  locale={{
                    emptyText: 'No hay productos agregados. Haga clic en "Agregar Item" para comenzar.'
                  }}
                />

                <Text strong>Total de items: {items.length}</Text>
              </Space>
            </Panel>

            {/* Card 4: Observaciones */}
            <Panel header="Observaciones" key="4">
              <Form.Item name="observaciones" label="Observaciones Generales">
                <TextArea
                  rows={4}
                  placeholder="Ingrese observaciones adicionales sobre la recepción..."
                />
              </Form.Item>
            </Panel>
          </Collapse>

          <Divider />

          {/* Botones de acción */}
          <Row justify="end">
            <Space size="middle">
              <Button onClick={handleCancelar} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleGuardarBorrador} loading={loading} disabled={loading}>
                Guardar Borrador
              </Button>
              <Button type="primary" onClick={handleConfirmarIngreso} loading={loading} disabled={loading}>
                Confirmar Ingreso
              </Button>
            </Space>
          </Row>
        </Form>
      </Card>

      {/* Modal Agregar Item */}
      <ModalAgregarItem
        visible={modalAgregarVisible}
        onClose={handleCerrarModal}
        onAdd={handleAgregarItemConfirmado}
        ordenCompra={ordenCompra}
        itemsAgregados={items}
      />
    </div>
  );
};

export default NotasIngresoForm;
