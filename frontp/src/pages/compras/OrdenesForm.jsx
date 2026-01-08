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
  InputNumber,
  Space,
  Typography,
  Divider,
  message,
  Switch,
  Tag,
  Alert,
  Spin
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  SearchOutlined,
  CalculatorOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../api/api';

const { Option } = Select;
const { Text } = Typography;

const OrdenesForm = ({ orden, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loadingDatos, setLoadingDatos] = useState(false);
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [requerimientos, setRequerimientos] = useState([]);
  const [formasPago, setFormasPago] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [aduanas, setAduanas] = useState([]);
  const [incoterms, setIncoterms] = useState([]);
  const [mediosTransporte, setMediosTransporte] = useState([]);
  const [items, setItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [igv, setIgv] = useState(0);
  const [total, setTotal] = useState(0);
  const [documentos, setDocumentos] = useState([]);
  const [tipoOrden, setTipoOrden] = useState('LOCAL');
  const watchTipo = Form.useWatch('tipo', form);

  const esNueva = !orden;  // si no existe orden, estamos creando
  const estadoOrden = orden?.estado;
  const esPendiente = esNueva || estadoOrden === "PENDIENTE";
  const esParcial = estadoOrden === "PARCIAL";


  const [tiposIgv, setTiposIgv] = useState([]);
  const [puntosPartida, setPuntosPartida] = useState([]);
const [itemsOriginales, setItemsOriginales] = useState([]);

  const puedeAgregar = esPendiente;

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatosIniciales();
    if (orden) {
      cargarOrdenExistente();
    }
  }, [orden]);

  useEffect(() => {
    cargarDatosIniciales();
    
    // Verificar si hay datos de requerimiento almacenados
    const requerimientoData = sessionStorage.getItem('requerimientoParaOrden');
    if (requerimientoData && !orden) {
      const data = JSON.parse(requerimientoData);
      
      // Precargar los datos del requerimiento en el formulario
      form.setFieldsValue({
        requerimiento_id: data.requerimiento.id,
        // Otros campos que quieras precargar
      });
      
      // Cargar los productos del requerimiento
      if (data.requerimiento.detalles) {
        setProductos(data.requerimiento.detalles);
      }
      
      // Limpiar el almacenamiento
      sessionStorage.removeItem('requerimientoParaOrden');
    }
    
    if (orden) {
      cargarOrdenExistente();
    }
  }, [orden]);

  useEffect(() => {
    if (watchTipo) {
        setTipoOrden(watchTipo);
        
        // Si cambia a LOCAL, limpiar campos de importación
        if (watchTipo === 'LOCAL') {
        form.setFieldsValue({
            aduana_id: undefined,
            incoterm_id: undefined,
            medio_transporte_id: undefined
        });
        }
    }
    }, [watchTipo, form]);

  useEffect(() => {
    if (orden && orden.requerimiento_id) {
      // Si la orden viene de un requerimiento, cargar sus productos automáticamente
      const itemsDesdeRequerimiento = orden.items || [];
      setItems(itemsDesdeRequerimiento);
      calcularTotales(itemsDesdeRequerimiento);
      
      // También podemos precargar otros datos del requerimiento si es necesario
      form.setFieldsValue({
        requerimiento_id: orden.requerimiento_id,
        fecha_entrega_prevista: dayjs(orden.fecha_entrega_prevista),
        tipo: orden.tipo
      });
    }
  }, [orden, form]);

  // Cargar datos iniciales
  const cargarDatosIniciales = async () => {
    setLoadingDatos(true);
    try {
      const response = await api.get('/compras/ordenes-compra/formulario/datos');
      
      setProveedores(response.data.proveedores);
      setRequerimientos(response.data.requerimientos);
      setFormasPago(response.data.formasPago);
      setMonedas(response.data.monedas);
      setAduanas(response.data.aduanas);
      setIncoterms(response.data.incoterms);
      setMediosTransporte(response.data.mediosTransporte);
      setDocumentos(response.data.documentos);
      setTiposIgv(response.data.tiposIgv || []);
      setPuntosPartida(response.data.puntosPartida);
    } catch (error) {
      message.error('Error al cargar datos iniciales');
      console.error('Error:', error);
    } finally {
      setLoadingDatos(false);
    }
  };

  // Filtrar documentos según el tipo de orden - CON DEBUG
const getDocumentosFiltrados = () => {
  // Limpiar los códigos de documentos (eliminar espacios extras)
  const documentosLimpios = documentos.map(doc => ({
    ...doc,
    codigo: doc.codigo?.trim()
  }));

  console.log('Documentos originales:', documentos);
  console.log('Documentos limpios:', documentosLimpios);
  console.log('Tipo orden actual:', tipoOrden);

  let documentosFiltrados = [];
  
  if (tipoOrden === 'LOCAL') {
    documentosFiltrados = documentosLimpios.filter(doc => doc.codigo === 'OCO');
  } else if (tipoOrden === 'EXTERNO') {
    documentosFiltrados = documentosLimpios.filter(doc => 
      ['IP1', 'IP2', 'IP3', 'IP4', 'IP5', 'IP6'].includes(doc.codigo)
    );
  } else {
    documentosFiltrados = documentosLimpios;
  }

  console.log('Documentos filtrados:', documentosFiltrados);
  return documentosFiltrados;
};

  // Agregar esta función para cargar el siguiente número
const cargarSiguienteNumero = async (documentoId) => {
    if (!documentoId || orden) return; // No cargar nuevo número si es edición
    
    try {
        const response = await api.get(`/compras/ordenes-compra/next-number?documento_id=${documentoId}`);
        form.setFieldsValue({ numero: response.data.nextNumber });
    } catch (error) {
        console.error('Error al obtener siguiente número:', error);
        message.error('No se pudo obtener el siguiente número');
    }
};

// Modificar el efecto que maneja cambios en el tipo para que también maneje cambios en el documento
useEffect(() => {
    if (watchTipo) {
        handleTipoChange(watchTipo);
    }
}, [watchTipo]);

// Agregar efecto para manejar cambios en el documento
const watchDocumento = Form.useWatch('id_documento', form);

useEffect(() => {
    if (watchDocumento) {
        cargarSiguienteNumero(watchDocumento);
    }
}, [watchDocumento]);

// Modificar la función handleTipoChange
const handleTipoChange = (value) => {
    setTipoOrden(value);
    
    // Limpiar campos de importación cuando cambia a LOCAL
    if (value === 'LOCAL') {
        form.setFieldsValue({
            aduana_id: undefined,
            incoterm_id: undefined,
            medio_transporte_id: undefined
        });
    }
    
    // Establecer automáticamente el documento correspondiente
    const documentosFiltrados = getDocumentosFiltrados();
    if (documentosFiltrados.length > 0) {
        const nuevoDocumentoId = documentosFiltrados[0].id;
        form.setFieldsValue({ 
            id_documento: nuevoDocumentoId 
        });
    }
};

  // Filtrar requerimientos según tipo de orden y estado
const getRequerimientosFiltrados = () => {
  const filtrados = requerimientos.filter(req => 
    req.tipo === (tipoOrden === 'LOCAL' ? 'INTERNO' : 'EXTERNO') &&
    req.estado === 'APROBADO'
  );

  console.log("Requerimientos filtrados:", filtrados);
  return filtrados;
};


  const cargarOrdenExistente = async () => {
    try {
      const response = await api.get(`/compras/ordenes-compra/${orden.id}/detalles`);
      const ordenCompleta = response.data;
      
      setTipoOrden(ordenCompleta.tipo);
      
      form.setFieldsValue({
        ...ordenCompleta,
        fecha: dayjs(ordenCompleta.fecha),
        fecha_entrega_prevista: dayjs(ordenCompleta.fecha_entrega_prevista),
        proveedor_id: ordenCompleta.proveedor_id,
        moneda_id: ordenCompleta.moneda_id,
        forma_pago: ordenCompleta.forma_pago,
        aduana_id: ordenCompleta.aduana_id,
        incoterm_id: ordenCompleta.incoterm_id,
        medio_transporte_id: ordenCompleta.medio_transporte_id,
        id_documento: ordenCompleta.id_documento,
        lugar_entrega: ordenCompleta.lugar_entrega_id || ordenCompleta.lugar_entrega
      });

      const lugar = puntosPartida.find(p => p.id === ordenCompleta.lugar_entrega);
      if (lugar) {
        form.setFieldsValue({ lugar_entrega: lugar.id });
      }

      // Establecer dirección del proveedor al editar
      const prov = proveedores.find(p => p.id === ordenCompleta.proveedor_id);
      if (prov) {
        form.setFieldsValue({ direccion: prov.direccion });
      }

      setItems(ordenCompleta.detalles.map((item, index) => ({
        key: index,
        ...item
      })));

     setItemsOriginales(ordenCompleta.detalles.map(d => d.producto_codigo));

      
      calcularTotales(ordenCompleta.detalles);
    } catch (error) {
      message.error('Error al cargar la orden');
      console.error('Error:', error);
    }
  };

  const buscarProductosRequerimiento = async (requerimientoId) => {
    try {
      const response = await api.get(
        `/compras/requerimientos/${requerimientoId}/detalles`
      );

      const detalles = response.data.detalles || [];

      let productosFiltrados;

      if (!orden) {
        // CREANDO nueva OC:
        // solo productos que NO están en ninguna OC
        productosFiltrados = detalles.filter(d => !d.ya_en_orden_compra);
      } else {
        // EDITANDO una OC:
        // mostrar:
        //  - los que no están en ninguna OC
        //  - los que están ligados a ESTA misma OC
        productosFiltrados = detalles.filter(d => 
          !d.ya_en_orden_compra || String(d.orden_compra_id) === String(orden.id)
        );
      }

      setProductos(productosFiltrados);
    } catch (error) {
      message.error('Error al cargar productos del requerimiento');
      console.error('Error:', error);
    }
  };

  const agregarProducto = (producto) => {
    const nuevoItem = {
      key: Date.now(),
      producto_codigo: producto.producto_codigo,
      producto_descripcion: producto.producto_descripcion,
      cantidad_solicitada: producto.cantidad_solicitada,
      precio_unitario: 0,
      descuento_porcentaje: 0,
      valor_venta: 0,
      igv: 0,
      precio_total: 0,
      centro_costo_id: producto.centro_costo_id,
      centro_costo_nombre: producto.centro_costo_nombre,
      requerimiento_id: producto.requerimiento_id,
      requerimiento_detalle_id: producto.id,   // 🔹 este es el ID del detalle
      requerimiento_codigo: producto.requerimiento_codigo,
      requerimiento_numero: producto.requerimiento_numero
    };
    
    setItems([...items, nuevoItem]);
  };

  const eliminarProducto = (key) => {
    setItems(items.filter(item => item.key !== key));
  };

  const actualizarItem = (key, campo, valor) => {
    const nuevosItems = items.map(item => {
      if (item.key === key) {
        const itemActualizado = { ...item, [campo]: valor };
        
        // Recalcular valores
        if (campo === 'precio_unitario' || campo === 'cantidad_solicitada' || campo === 'descuento_porcentaje') {
          const precio = parseFloat(itemActualizado.precio_unitario) || 0;
          const cantidad = parseFloat(itemActualizado.cantidad_solicitada) || 0;
          const descuentoPorcentaje = parseFloat(itemActualizado.descuento_porcentaje) || 0;
          
          const valorVenta = precio * cantidad;
          const descuentoMonto = valorVenta * (descuentoPorcentaje / 100);
          const valorNeto = valorVenta - descuentoMonto;
          const igvSeleccionado = tiposIgv.find(igv => igv.id === form.getFieldValue('igv_id'));
          const porcentajeIgv = igvSeleccionado ? igvSeleccionado.porcentaje / 100 : 0;

          const igvCalc = tipoOrden === 'LOCAL' ? valorNeto * porcentajeIgv : 0;
          const totalItem = valorNeto + igvCalc;
          
          itemActualizado.valor_venta = valorNeto;
          itemActualizado.descuento_monto = descuentoMonto;
          itemActualizado.igv = igvCalc;
          itemActualizado.precio_total = totalItem;
        }
        
        return itemActualizado;
      }
      return item;
    });
    
    setItems(nuevosItems);
    calcularTotales(nuevosItems);
  };

  const calcularTotales = (itemsList) => {
    const sub = itemsList.reduce((sum, item) => sum + (parseFloat(item.valor_venta) || 0), 0);
    const igvSeleccionado = tiposIgv.find(igv => igv.id === form.getFieldValue('igv_id'));
    const porcentajeIgv = igvSeleccionado ? igvSeleccionado.porcentaje / 100 : 0;
    const igvCalc = tipoOrden === 'LOCAL'
    ? itemsList.reduce((sum, item) => sum + (parseFloat(item.valor_venta) || 0) * porcentajeIgv, 0)
    : 0;
    const totalCalc = sub + igvCalc;
    
    setSubtotal(sub);
    setIgv(igvCalc);
    setTotal(totalCalc);
  };

  const handleSubmit = async (values) => {
    setLoading(true);
      try {
      if (esParcial) {
        const productosOriginales = itemsOriginales;
        const productosActuales = items.map(i => i.producto_codigo);

        const nuevos = productosActuales.filter(p => !productosOriginales.includes(p));
        if (nuevos.length > 0) {
          return message.error("No se pueden agregar productos en estado PARCIAL");
        }

        const eliminados = productosOriginales.filter(p => !productosActuales.includes(p));
        if (eliminados.length > 0) {
          return message.error("No se pueden eliminar productos en estado PARCIAL");
        }
      }

        const ordenData = {
        ...values,
        id_documento: values.id_documento,
        fecha: values.fecha.format('YYYY-MM-DD'),
        fecha_entrega_prevista: values.fecha_entrega_prevista.format('YYYY-MM-DD'),
        proveedor_id: values.proveedor_id,
        direccion: values.direccion,
        moneda_id: values.moneda_id,
        lugar_entrega: values.lugar_entrega,
        igv_id: values.igv_id, 
        sub_total: subtotal,
        igv: igv,
        total: total,
        items: items.map(item => ({
          producto_codigo: item.producto_codigo,
          cantidad_solicitada: item.cantidad_solicitada,
          precio_unitario: item.precio_unitario,
          descuento_porcentaje: item.descuento_porcentaje,
          centro_costo_id: item.centro_costo_id,
          comentario: item.comentario,
          requerimiento_id: item.requerimiento_id,
          requerimiento_detalle_id: item.requerimiento_detalle_id,
          linea_cerrada: item.linea_cerrada ?? false,   // ← AGREGAR ESTO
          cantidad_recibida: item.cantidad_recibida ?? 0    // ← NECESARIO PARA VALIDAR PARCIAL / COMPLETA
        }))
      };

      // Si es orden local, eliminar campos de importación
      if (values.tipo === 'LOCAL') {
        delete ordenData.aduana_id;
        delete ordenData.incoterm_id;
        delete ordenData.medio_transporte_id;
      }

      if (orden) {
        await api.put(`/compras/ordenes-compra/${orden.id}`, ordenData);
      } else {
        await api.post('/compras/ordenes-compra', ordenData);
      }

      message.success(orden ? 'Orden actualizada correctamente' : 'Orden creada correctamente');
      onClose(true);
    } catch (error) {
      message.error('Error al guardar la orden');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const columnasItems = [
    {
      title: 'Requerimiento',
      key: 'requerimiento',
      width: 120,
      render: (_, record) => (
        <span>
          {record.requerimiento_codigo?.trim() || 'DOC'}-{record.requerimiento_numero || '---'}
        </span>
      )
    },
    {
      title: 'Producto',
      dataIndex: 'producto_descripcion',
      key: 'producto_descripcion',
      width: 200,
      ellipsis: true
    },
    {
      title: 'Cantidad',
      dataIndex: 'cantidad_solicitada',
      key: 'cantidad_solicitada',
      width: 80,
      render: (text, record) => (
        <InputNumber
          min={0.001}
          step={0.001}
          value={text}
          onChange={(value) => actualizarItem(record.key, 'cantidad_solicitada', value)}
          disabled={esParcial}   // ❌ bloquear cambio
          style={{ width: '80px' }}
        />
      )
    },
    {
      title: 'Precio Unit.',
      dataIndex: 'precio_unitario',
      key: 'precio_unitario',
      width: 100,
      render: (text, record) => (
        <InputNumber
          min={0}
          step={0.01}
          value={text}
          onChange={(value) => actualizarItem(record.key, 'precio_unitario', value)}
          style={{ width: '90px' }}
        />
      )
    },
    {
      title: 'Desc. %',
      dataIndex: 'descuento_porcentaje',
      key: 'descuento_porcentaje',
      width: 80,
      render: (text, record) => (
        <InputNumber
          min={0}
          max={100}
          value={text}
          onChange={(value) => actualizarItem(record.key, 'descuento_porcentaje', value)}
          style={{ width: '70px' }}
        />
      )
    },
    {
      title: 'Valor Venta',
      dataIndex: 'valor_venta',
      key: 'valor_venta',
      width: 100,
      render: (text) => `S/ ${parseFloat(text || 0).toFixed(2)}`
    },
    ...(tipoOrden === 'LOCAL'
    ? [{
        title: 'IGV',
        dataIndex: 'igv',
        key: 'igv',
        width: 90,
        render: (text) => `S/ ${parseFloat(text || 0).toFixed(2)}`
      }]
    : []),
    {
      title: 'Total',
      dataIndex: 'precio_total',
      key: 'precio_total',
      width: 100,
      render: (text) => `S/ ${parseFloat(text || 0).toFixed(2)}`
    },
    {
      title: 'Acción',
      key: 'accion',
      width: 60,
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => eliminarProducto(record.key)}
          disabled={esParcial}   // ❌ no permitir eliminar en PARCIAL
        />
      )
    },
    {
      title: 'Cerrar línea',
      dataIndex: 'linea_cerrada',
      key: 'linea_cerrada',
      width: 60,

      render: (value, record) => {
  // No mostrar si es creación de nueva orden
  if (!orden) {
    return null;
  }

  const esOrdenParcial = orden?.estado === 'PARCIAL';
  const cantidadSolicitada = parseFloat(record.cantidad_solicitada) || 0;
  const cantidadRecibida = parseFloat(record.cantidad_recibida) || 0;
  const hayDiferencia = cantidadRecibida !== cantidadSolicitada;

  if (esOrdenParcial && hayDiferencia) {
    return (
      <Switch
        checked={record.linea_cerrada}
        onChange={async (checked) => {
          try {
            await api.patch(`/compras/ordenes-compra/detalle/${record.id}/linea-cerrada`, {
              linea_cerrada: checked
            });
            message.success(checked ? 'Línea cerrada' : 'Línea reabierta');
            setItems(items.map(item =>
              item.id === record.id ? { ...item, linea_cerrada: checked } : item
            ));
          } catch (error) {
            console.error(error);
            message.error('Error al actualizar línea');
          }
        }}
      />
    );
  }

  return (
    <Tag
      color={record.linea_cerrada ? 'red' : 'green'}
      style={{ margin: 0 }}
    >
      {record.linea_cerrada ? 'Cerrada' : 'Completa'}
    </Tag>
  );
},
    }
  ];

  if (loadingDatos) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Cargando datos...</div>
      </div>
    );
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        tipo: 'LOCAL',
        moneda: 'PEN',
        tipo_cambio: 1.0,
        estado: 'PENDIENTE',
        fecha: dayjs() 
      }}
    >
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="tipo" label="Tipo">
            <Select disabled={esParcial} onChange={handleTipoChange}>
              <Option value="LOCAL">Local</Option>
              <Option value="EXTERNO">Externo</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="id_documento"
            label="Documento"
            rules={[{ required: true, message: 'Seleccione el documento' }]}
          >
            <Select disabled={esParcial} placeholder="Seleccionar documento">
              {getDocumentosFiltrados().map(doc => (
                <Option key={doc.id} value={doc.id}>
                  {doc.nombre} ({doc.codigo})
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
              name="numero"
              label="Número de Orden"
              rules={[{ required: true, message: 'El número de orden es requerido' }]}
          >
              <Input placeholder="000000001" readOnly />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="requerimiento_id"
            label="Requerimiento"
          >
            <Select
              placeholder="Seleccionar requerimiento"
              onChange={buscarProductosRequerimiento}
              allowClear
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option?.children?.toString().toLowerCase().includes(input.toLowerCase())
              }
            >
              {getRequerimientosFiltrados().map(req => (
                <Option key={req.id} value={req.id}>
                  {`${req.documento_codigo || 'DOC'} - ${req.numero}`} ({dayjs(req.fecha).format('DD/MM/YYYY')})
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="lugar_entrega"
            label="Lugar de Entrega"
          >
            <Select
              placeholder="Seleccionar lugar de entrega"
              optionFilterProp="children"
            >
              {puntosPartida.map(p => (
                <Option key={p.id} value={p.id}>
                  {p.direccion}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>      
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="proveedor_id"
            label="Proveedor"
            rules={[{ required: true, message: 'Seleccione un proveedor' }]}
          >
            <Select
              placeholder="Seleccionar proveedor"
              showSearch
              allowClear
              onChange={(value) => {
                const prov = proveedores.find(p => p.id === value);
                if (prov) {
                  form.setFieldsValue({ direccion: prov.direccion });
                } else {
                  form.setFieldsValue({ direccion: '' });
                }
              }}
              filterOption={(input, option) => {
                const text = option?.children?.toString().toLowerCase() || "";
                return text.includes(input.toLowerCase());
              }}
            >
              {proveedores.map(prov => (
                <Option 
                  key={prov.id} 
                  value={prov.id}
                >
                  {`${prov.razon_social} - ${prov.nro_documento}`}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="direccion"
            label="Dirección"
            rules={[{ required: true, message: 'La dirección es obligatoria' }]}
          >
            <Input placeholder="Dirección del proveedor" readOnly />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="fecha"
            label="Fecha"
            rules={[{ required: true, message: 'Seleccione la fecha' }]}
          >
            <DatePicker style={{ width: '100%' }} disabled/>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="fecha_entrega_prevista"
            label="Fecha Entrega Prevista"
            rules={[{ required: true, message: 'Seleccione la fecha de entrega' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="forma_pago"
            label="Forma de Pago"
            rules={[{ required: true, message: 'Seleccione la forma de pago' }]}
          >
            <Select placeholder="Seleccionar forma de pago">
              {formasPago.map(fp => (
                <Option key={fp.id} value={fp.id}>
                  {fp.nombre}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item 
            name="moneda_id" 
            label="Moneda"
            rules={[{ required: true, message: 'Seleccione la moneda' }]}
          >
            <Select disabled={esParcial} placeholder="Seleccionar moneda">
              {monedas.map(moneda => (
                <Option key={moneda.id} value={moneda.id}>
                  {moneda.nombre} ({moneda.simbolo})
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="tipo_cambio" label="Tipo de Cambio">
            <InputNumber
              min={0}
              step={0.01}
              style={{ width: '100%' }}
              disabled={form.getFieldValue('moneda') === 'PEN'}
            />
          </Form.Item>
        </Col>
        
        {/* Campo IGV - Solo para tipo LOCAL */}
        {tipoOrden === 'LOCAL' && (
          <Col span={8}>
            <Form.Item 
              name="igv_id" 
              label="IGV"
              rules={[{ required: tipoOrden === 'LOCAL', message: 'Seleccione el tipo de IGV' }]}
            >
              <Select placeholder="Seleccionar IGV">
                {tiposIgv.map(igv => (
                  <Option key={igv.id} value={igv.id}>
                    {igv.descripcion} ({igv.porcentaje}%)
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        )}

        <Col span={8}>
          <Form.Item
            name="estado"
            label="Estado"
            rules={[{ required: true, message: 'Seleccione el estado' }]}
          >
            <Select placeholder="Seleccionar estado" disabled>
              <Option value="PENDIENTE">Pendiente</Option>
              <Option value="PARCIAL">Parcial</Option>
              <Option value="ENTREGADA">Entregada</Option>
              <Option value="CERRADA">Cerrada</Option>
              <Option value="ANULADA">Anulada</Option>
            </Select>
          </Form.Item>
        </Col>

      </Row>

      {/* Campos de importación (solo para tipo EXTERNO) */}
      {tipoOrden === 'EXTERNO' && (
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item 
              name="aduana_id" 
              label="Aduana"
              rules={[{ required: tipoOrden === 'EXTERNO', message: 'Seleccione una aduana' }]}
            >
              <Select placeholder="Seleccionar aduana">
                {aduanas.map(aduana => (
                  <Option key={aduana.id} value={aduana.id}>
                    {aduana.nombre}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item 
              name="incoterm_id" 
              label="Incoterm"
              rules={[{ required: tipoOrden === 'EXTERNO', message: 'Seleccione un incoterm' }]}
            >
              <Select placeholder="Seleccionar incoterm">
                {incoterms.map(incoterm => (
                  <Option key={incoterm.id} value={incoterm.id}>
                    {incoterm.codigo} - {incoterm.nombre}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item 
              name="medio_transporte_id" 
              label="Medio de Transporte"
              rules={[{ required: tipoOrden === 'EXTERNO', message: 'Seleccione un medio de transporte' }]}
            >
              <Select placeholder="Seleccionar medio de transporte">
                {mediosTransporte.map(medio => (
                  <Option key={medio.id} value={medio.id}>
                    {medio.nombre}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
      )}

      <Form.Item name="observaciones" label="Observaciones">
        <Input.TextArea rows={2} />
      </Form.Item>

      {/* Productos del requerimiento */}
      {productos.length > 0 && (
        <Card size="small" title="Productos del Requerimiento" style={{ marginBottom: 16 }}>
          {productos.map(producto => (
            <div key={producto.id} style={{ marginBottom: 8, padding: 8, border: '1px solid #d9d9d9', borderRadius: 4 }}>
              <Row align="middle" gutter={8}>
                <Col flex="auto">
                  <Text strong>{producto.producto_descripcion}</Text>
                  <br />
                  <Text type="secondary">
                    Cantidad: {producto.cantidad_aprobada || producto.cantidad_solicitada} | 
                    Centro Costo: {producto.centro_costo_nombre}
                  </Text>
                </Col>
                <Col>
                  <Button
  type="primary"
  size="small"
  icon={<PlusOutlined />}
  onClick={() => agregarProducto(producto)}
  disabled={!esPendiente || items.some(item => item.producto_codigo === producto.producto_codigo)}
>
  Agregar
</Button>

                </Col>
              </Row>
            </div>
          ))}
        </Card>
      )}

      {/* Items de la orden */}
      <Card 
        title="Productos de la Orden" 
        size="small"
        extra={
          <Space>
            <Text>Subtotal: S/ {subtotal.toFixed(2)}</Text>
            <Text>IGV: S/ {igv.toFixed(2)}</Text>
            <Text strong>Total: S/ {total.toFixed(2)}</Text>
          </Space>
        }
      >
        {esParcial && (
          <Alert
            message="Esta orden está en estado PARCIAL"
            description="No puede agregar, eliminar ni modificar la cantidad solicitada. Solo puede cerrar líneas o completar cantidades recibidas."
            type="warning"
            showIcon
            style={{ marginBottom: 15 }}
          />
        )}
        {items.length === 0 ? (
          <Alert
            message="No hay productos"
            description="Agregue productos desde el requerimiento o manualmente"
            type="info"
            showIcon
          />
        ) : (
          <Table
            columns={columnasItems}
            dataSource={items}
            pagination={false}
            size="small"
            scroll={{ x: 800 }}
          />
        )}
      </Card>

      <Divider />

      <Row justify="end" gutter={16}>
        <Col>
          <Button onClick={() => onClose(false)}>
            Cancelar
          </Button>
        </Col>
        <Col>
          <Button type="primary" htmlType="submit" loading={loading}>
            {orden ? 'Actualizar' : 'Crear'} Orden
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

export default OrdenesForm;