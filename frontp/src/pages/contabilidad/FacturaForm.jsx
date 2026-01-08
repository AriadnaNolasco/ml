import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Button,
  Divider,
  Row,
  Col,
  message,
  Typography,
  Space,
  Tag
} from 'antd';
import {
  FileTextOutlined,
  DollarOutlined,
  BankOutlined,
  InfoCircleOutlined,
  ShoppingOutlined,
  GlobalOutlined,
  HomeOutlined
} from '@ant-design/icons';
import moment from 'moment';
import api from '../../api/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const FacturaForm = ({ factura = null, onSave, onCancel, tipoCompraDefault = 'LOCAL' }) => {
  const [form] = Form.useForm();

  /** ==============================
   *  ESTADOS
   *  ============================== */
  const [tiposCompra] = useState(['LOCAL', 'EXTERNO']);
  const [documentos, setDocumentos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [formasPago, setFormasPago] = useState([]);
  const [incoterms, setIncoterms] = useState([]);
  const [mediosTransporte, setMediosTransporte] = useState([]);
  const [aduanas, setAduanas] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [ordenesCompra, setOrdenesCompra] = useState([]);

  const [tipoCompraSeleccionado, setTipoCompraSeleccionado] = useState(
    factura?.tipo_compra || tipoCompraDefault
  );
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [importeSoles, setImporteSoles] = useState(0);
  const [productosOrdenCompra, setProductosOrdenCompra] = useState([]);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [cuentasProveedor, setCuentasProveedor] = useState([]);

  /** ==============================
   *  CARGA INICIAL DE DATOS
   *  ============================== */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get('/contabilidad/datos-formulario-facturas');
        const d = data.data;

        setDocumentos(d.documentos);
        setProveedores(d.proveedores);
        setMonedas(d.monedas);
        setFormasPago(d.formas_pago);
        setIncoterms(d.incoterms);
        setMediosTransporte(d.medios_transporte);
        setAduanas(d.aduanas);
        setBancos(d.bancos);
        setOrdenesCompra(d.ordenes_compra);

        if (!factura) cargarSiguienteNumero(tipoCompraDefault);
      } catch (error) {
        console.error('Error cargando datos del formulario:', error);
        message.error('Error cargando datos del formulario');
      }
    };
    fetchData();
  }, []);

  /** ==============================
   *  FUNCIONES AUXILIARES
   *  ============================== */

  const cargarSiguienteNumero = async (tipoCompra = 'LOCAL') => {
    try {
      const res = await api.get(`/contabilidad/facturas-proveedor/next-number?tipo_compra=${tipoCompra}`);
      form.setFieldsValue({ numero: res.data.nextNumber });
    } catch (error) {
      console.error('Error al obtener siguiente número:', error);
      message.error('No se pudo obtener el siguiente número');
    }
  };

  const calcularImporteSoles = (total, tipoCambio) => {
    if (total && tipoCambio > 0) {
      const importe = parseFloat(total) * parseFloat(tipoCambio);
      setImporteSoles(importe);
      form.setFieldsValue({ importe_soles: parseFloat(importe.toFixed(2)) });
    } else {
      setImporteSoles(0);
      form.setFieldsValue({ importe_soles: 0 });
    }
  };

  const calcularTotalesProductos = () => {
    const subtotal = productosOrdenCompra.reduce((sum, item) => sum + parseFloat(item.valor_venta || 0), 0);
    const igv = tipoCompraSeleccionado === 'LOCAL'
      ? productosOrdenCompra.reduce((sum, item) => sum + parseFloat(item.igv || 0), 0)
      : 0;
    const total = productosOrdenCompra.reduce((sum, item) => sum + parseFloat(item.precio_total || 0), 0);
    return { subtotal, igv, total };
  };

  const recalcularTotales = (items) => {
    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.valor_venta || 0), 0);
    const igv = tipoCompraSeleccionado === 'LOCAL'
      ? items.reduce((sum, item) => sum + parseFloat(item.igv || 0), 0)
      : 0;
    const total = items.reduce((sum, item) => sum + parseFloat(item.precio_total || 0), 0);

    return { subtotal, igv, total };
  };

  /** ==============================
   *  EFECTOS REACTIVOS
   *  ============================== */

  useEffect(() => {
    if (factura) {
      form.setFieldsValue({
        tipo_compra: factura.tipo_compra || tipoCompraDefault,
      });
      setTipoCompraSeleccionado(factura.tipo_compra);
    } else {
      form.resetFields();
      setTipoCompraSeleccionado(tipoCompraDefault);

      setTimeout(() => {
        const docFiltrado = documentos.find((d) =>
          tipoCompraDefault === 'LOCAL' ? d.codigo.trim() === 'FAP' : d.codigo.trim() === 'FPE'
        );
        if (docFiltrado) {
          form.setFieldsValue({
            documento_id: docFiltrado.id_documento,
            tipo_compra: tipoCompraDefault,
          });
        }
      }, 100);
    }
  }, [factura, documentos, tipoCompraDefault]);

  useEffect(() => {
    const total = form.getFieldValue('total');
    const tipoCambio = form.getFieldValue('tipo_cambio');
    if (tipoCompraSeleccionado === 'EXTERNO' && total && tipoCambio) {
      calcularImporteSoles(total, tipoCambio);
    }
  }, [form.getFieldValue('total'), form.getFieldValue('tipo_cambio')]);

  useEffect(() => {
    const proveedorId = form.getFieldValue('proveedor_id');
    if (!proveedorId) {
      setCuentasProveedor([]);
      form.setFieldsValue({
        banco_id: null,
        cuenta_bancaria: null,
        cuenta_interbancaria: null,
        swift: null,
        direccion_banco: null,
      });
    }
  }, [form.getFieldValue('proveedor_id')]);

  useEffect(() => {
    if (factura && proveedores.length > 0) {
      cargarFacturaParaEditar(factura.id);
    }
  }, [factura, proveedores]);

  useEffect(() => {
    const total = form.getFieldValue('total');
    if (tipoCompraSeleccionado === 'EXTERNO' && total != null) {
      form.setFieldsValue({ importe_moneda_prov: total });
    }
  }, [form.getFieldValue('total'), tipoCompraSeleccionado]);

  /** ==============================
   *  MANEJADORES DE EVENTOS
   *  ============================== */

  const onTipoCompraChange = (value) => {
    setTipoCompraSeleccionado(value);
    form.setFieldsValue({ tipo_compra: value });
    if (!factura) cargarSiguienteNumero(value);

    const documento = documentos.find((d) =>
      value === 'LOCAL' ? d.codigo.trim() === 'FAP' : d.codigo.trim() === 'FPE'
    );
    if (documento) form.setFieldsValue({ documento_id: documento.id_documento });
  };

  const onProveedorChange = async (value) => {
    const proveedor = proveedores.find((p) => p.id_prov === value);
    setProveedorSeleccionado(proveedor);
    form.setFieldsValue({ direccion: proveedor?.direccion });

    if (proveedor) {
      try {
        const res = await api.get(`/contabilidad/proveedores/${proveedor.id_prov}/cuentas-bancarias`);
        const cuentas = res.data.data || [];
        setCuentasProveedor(cuentas);

        if (!factura) {
          if (cuentas.length === 1) {
            const c = cuentas[0];
            form.setFieldsValue({
              banco_id: c.id_bancos,
              cuenta_bancaria: c.cuenta_bancaria,
              cuenta_interbancaria: c.cuenta_interbancaria,
              swift: c.swift,
              direccion_banco: c.direccion_banco,
            });
            message.info('Se ha autocompletado la cuenta bancaria del proveedor.');
          } else if (cuentas.length > 1) {
            message.info(`El proveedor tiene ${cuentas.length} cuentas bancarias. Seleccione una.`);
          }
        }
      } catch (error) {
        console.error('Error al obtener cuentas bancarias del proveedor:', error);
        message.error('Error al cargar las cuentas bancarias del proveedor');
      }
    } else setCuentasProveedor([]);
  };

  const onOrdenCompraChange = async (value) => {
    const oc = ordenesCompra.find((o) => o.id === value);
    if (!oc) {
      setProductosOrdenCompra([]);
      setCuentasProveedor([]);
      return;
    }

    const proveedor = proveedores.find((p) => p.id_prov === oc.proveedor_id);
    const doc = documentos.find((d) =>
      oc.tipo === 'LOCAL' ? d.codigo.trim() === 'FAP' : d.codigo.trim() === 'FPE'
    );

    form.setFieldsValue({
      orden_compra_id: oc.id,
      proveedor_id: oc.proveedor_id,
      moneda_id: oc.moneda_id,
      forma_pago_id: oc.forma_pago,
      tipo_cambio: oc.tipo_cambio,
      incoterm_id: oc.incoterm_id,
      medio_transporte_id: oc.medio_transporte_id,
      aduana_id: oc.aduana_id,
      subtotal: oc.sub_total,
      igv: oc.igv,
      total: oc.total,
      documento_id: doc?.id_documento,
      direccion: proveedor?.direccion,
    });

    if (oc.tipo === 'EXTERNO') {
      valores.importe_moneda_prov = oc.total;
    }

    form.setFieldsValue(valores);

    await cargarProductosOrdenCompra(oc.id);
    setTipoCompraSeleccionado(oc.tipo);
    if (proveedor) await onProveedorChange(proveedor.id_prov);

    if (oc.tipo === 'EXTERNO' && oc.total && oc.tipo_cambio)
      calcularImporteSoles(oc.total, oc.tipo_cambio);
  };

  const onFechaEmisionChange = async (date) => {
    if (!date) return;
    try {
      const fechaStr = date.format('YYYY-MM-DD');
      const { data } = await api.get(`/contabilidad/tipo-cambio-por-fecha?fecha=${fechaStr}`);
      if (data.success) {
        form.setFieldsValue({ tipo_cambio: data.data.compra });
        const total = form.getFieldValue('total');
        if (total) calcularImporteSoles(total, data.data.compra);
      }
    } catch (error) {
      console.error('Error obteniendo tipo de cambio:', error);
      message.warning('No se encontró tipo de cambio para esta fecha');
    }
  };

  /** ==============================
   *  CARGA Y GUARDADO DE FACTURA
   *  ============================== */

  const cargarProductosOrdenCompra = async (id) => {
    if (!id) return setProductosOrdenCompra([]);
    setLoadingProductos(true);
    try {
      const { data } = await api.get(`/contabilidad/orden-compra/${id}/productos`);
      
      const productos = (data.data || []).map(item => ({
        ...item,
        orden_compra_detalle_id: item.orden_compra_detalle_id ?? item.id,
        cantidad_facturada: 
          item.cantidad_facturada != null 
            ? item.cantidad_facturada 
            : (item.cantidad_recibida || 0),
      }));

      setProductosOrdenCompra(productos);
    } catch (error) {
      console.error('Error cargando productos:', error);
      message.error('Error cargando productos de la orden de compra');
      setProductosOrdenCompra([]);
    } finally {
      setLoadingProductos(false);
    }
  };

  const cargarFacturaParaEditar = async (facturaId) => {
    try {
      const { data } = await api.get(`/contabilidad/facturas-proveedor/${facturaId}/detalles`);
      const f = data.data;
      const formatDate = (d) => (d ? moment(d) : null);
      setTipoCompraSeleccionado(f.tipo_compra);

      const proveedor = proveedores.find((p) => p.id_prov === f.proveedor_id);
      setProveedorSeleccionado(proveedor);

      let cuentas = [];
      if (proveedor) {
        const res = await api.get(`/contabilidad/proveedores/${proveedor.id_prov}/cuentas-bancarias`);
        cuentas = res.data.data || [];
        setCuentasProveedor(cuentas);
      }

      form.setFieldsValue({
        ...f,
        fecha_emision: formatDate(f.fecha_emision),
        fecha_vencimiento: formatDate(f.fecha_vencimiento),
        fecha_llegada: formatDate(f.fecha_llegada),
        fecha_guia_remision: formatDate(f.fecha_guia_remision),
      });

      if (f.orden_compra_id) cargarProductosOrdenCompra(f.orden_compra_id);
      if (f.tipo_compra === 'EXTERNO' && f.total && f.tipo_cambio)
        calcularImporteSoles(f.total, f.tipo_cambio);
      if (f.tipo_compra === 'EXTERNO') {
        form.setFieldsValue({
          importe_moneda_prov: f.total
        });
      }
    } catch (error) {
      console.error('Error cargando factura para editar:', error);
      message.error('Error al cargar los datos de la factura');
    }
  };

  const handleCantidadFacturadaChange = (value, index) => {
    setProductosOrdenCompra(prev => {
      const updated = [...prev];
      const item = { ...updated[index] };
      item.cantidad_facturada = value || 0;

      const cantidad = parseFloat(item.cantidad_facturada || 0);
      const precio = parseFloat(item.precio_unitario || 0);
      const desc = parseFloat(item.descuento_porcentaje || 0) / 100;

      const valorVenta = cantidad * precio * (1 - desc);
      item.valor_venta = valorVenta;

      if (tipoCompraSeleccionado === 'LOCAL') {
        const igvPorc = item.igv_porcentaje || 18;
        const igv = valorVenta * (igvPorc / 100);
        item.igv = igv;
        item.precio_total = valorVenta + igv;
      } else {
        item.igv = null;
        item.precio_total = valorVenta;
      }

      updated[index] = item;
      const { subtotal, igv, total } = recalcularTotales(updated);
      form.setFieldsValue({
        subtotal,
        igv: tipoCompraSeleccionado === 'LOCAL' ? igv : null,
        total,
      });

      return updated;
    });
  };

  const onFinish = async (values) => {
    try {
      const payload = {
        ...values,
        fecha_emision: values.fecha_emision.format('YYYY-MM-DD'),
        fecha_vencimiento: values.fecha_vencimiento.format('YYYY-MM-DD'),
        fecha_llegada: values.fecha_llegada?.format('YYYY-MM-DD') || null,
        fecha_guia_remision: values.fecha_guia_remision?.format('YYYY-MM-DD') || null,
        importe_soles: values.importe_soles || importeSoles,
        items: productosOrdenCompra
      };

      if (tipoCompraSeleccionado === 'LOCAL' && !payload.igv)
        return message.error('IGV es requerido para compras LOCALES');

      if (tipoCompraSeleccionado === 'EXTERNO' && !payload.importe_moneda_prov)
        return message.error('Importe en dólares es requerido para compras EXTERNAS');

      if (factura?.id) {
        await api.put(`/contabilidad/facturas-proveedor/${factura.id}`, payload);
        message.success('Factura actualizada exitosamente');
      } else {
        await api.post('/contabilidad/facturas-proveedor', payload);
        message.success('Factura creada exitosamente');
      }

      onSave();
      form.resetFields();
    } catch (error) {
      console.error('Error guardando factura:', error);
      const backendMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Error guardando la factura';

      message.error(backendMessage);
    }
  };

  /** ==============================
   *  RENDER
   *  ============================== */

  const documentosFiltrados = documentos.filter((d) =>
    tipoCompraSeleccionado === 'LOCAL'
      ? d.codigo.trim() === 'FAP'
      : d.codigo.trim() === 'FPE'
  );

  const ordenesCompraFiltradas = ordenesCompra.filter(
    (oc) => oc.tipo === tipoCompraSeleccionado && oc.estado === 'ENTREGADA'
  );

  const monedaSeleccionada = monedas.find((m) => m.id_moneda === form.getFieldValue('moneda_id'));
  const simboloMoneda = monedaSeleccionada ? monedaSeleccionada.simbolo : '';

  const columnasProductos = [
    { 
      title: 'Item', 
      dataIndex: 'numitem', 
      key: 'numitem', 
      width: 60, 
      align: 'center',
      render: (text) => <Text style={{ fontSize: '12px' }}>{text}</Text>
    },
    { 
      title: 'Código', 
      dataIndex: 'producto_codigo', 
      key: 'producto_codigo', 
      width: 100,
      render: (text) => <Text style={{ fontSize: '12px' }}>{text}</Text>
    },
    { 
      title: 'Descripción', 
      dataIndex: 'producto_descripcion', 
      key: 'producto_descripcion', 
      ellipsis: true,
      render: (text) => <Text style={{ fontSize: '12px' }}>{text}</Text>
    },
    { 
      title: 'Unidad', 
      dataIndex: 'unidad_medida', 
      key: 'unidad_medida', 
      width: 80,
      render: (text) => <Text style={{ fontSize: '12px' }}>{text}</Text>
    },
    {
      title: 'Cantidad',
      dataIndex: 'cantidad_solicitada',
      key: 'cantidad_solicitada',
      width: 90,
      align: 'right',
      render: (v) => <Text style={{ fontSize: '12px' }}>{parseFloat(v).toFixed(3)}</Text>,
    },
    {
      title: 'Cant. Recibida',
      dataIndex: 'cantidad_recibida',
      key: 'cantidad_recibida',
      width: 100,
      align: 'right',
      render: (v) => <Text style={{ fontSize: '12px' }}>{parseFloat(v || 0).toFixed(3)}</Text>,
    },
    {
      title: 'Cant. Facturada',
      dataIndex: 'cantidad_facturada',
      key: 'cantidad_facturada',
      width: 120,
      align: 'right',
      render: (value, record, index) => (
        <InputNumber
          min={0}
          step={0.001}
          size="small"
          style={{ width: '100%', fontSize: '12px' }}
          value={record.cantidad_facturada}
          onChange={(val) => handleCantidadFacturadaChange(val, index)}
        />
      ),
    },
    {
      title: 'Precio Unit.',
      dataIndex: 'precio_unitario',
      key: 'precio_unitario',
      width: 100,
      align: 'right',
      render: (v) => <Text style={{ fontSize: '12px' }}>{`${simboloMoneda} ${parseFloat(v).toFixed(4)}`}</Text>,
    },
    {
      title: 'Desc. %',
      dataIndex: 'descuento_porcentaje',
      key: 'descuento_porcentaje',
      width: 80,
      align: 'right',
      render: (v) => <Text style={{ fontSize: '12px' }}>{v ? `${parseFloat(v).toFixed(2)}%` : '-'}</Text>,
    },
    {
      title: 'Valor Venta',
      dataIndex: 'valor_venta',
      key: 'valor_venta',
      width: 100,
      align: 'right',
      render: (v) => <Text style={{ fontSize: '12px' }}>{`${simboloMoneda} ${parseFloat(v).toFixed(2)}`}</Text>,
    },
    ...(tipoCompraSeleccionado === 'LOCAL'
      ? [
          {
            title: 'IGV',
            dataIndex: 'igv',
            key: 'igv',
            width: 90,
            align: 'right',
            render: (v) => <Text style={{ fontSize: '12px' }}>{`${simboloMoneda} ${parseFloat(v).toFixed(2)}`}</Text>,
          },
        ]
      : []),
    {
      title: 'Total',
      dataIndex: 'precio_total',
      key: 'precio_total',
      width: 100,
      align: 'right',
      render: (v) => <Text style={{ fontSize: '12px', fontWeight: '500' }}>{`${simboloMoneda} ${parseFloat(v).toFixed(2)}`}</Text>,
    },
  ];

  const totales = calcularTotalesProductos();

  return (
    <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '4px' }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ tipo_compra: tipoCompraDefault, estado: 'REGISTRADA' }}
        scrollToFirstError
        size="small"
      >
        {/* SECCIÓN 1: DATOS GENERALES */}
        <Card 
          title={
            <Space>
              <FileTextOutlined style={{ color: '#1890ff' }} />
              <span>Datos Generales</span>
            </Space>
          }
          size="small"
          style={{ marginBottom: 16, border: '1px solid #f0f0f0' }}
          bodyStyle={{ padding: '16px' }}
        >
          <Row gutter={[16, 8]}>
            <Col span={8}>
              <Form.Item
                label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>Tipo de Compra</Text>}
                name="tipo_compra"
                rules={[{ required: true, message: 'Seleccione tipo de compra' }]}
              >
                <Select 
                  size="small" 
                  onChange={onTipoCompraChange}
                  style={{ fontSize: '12px' }}
                >
                  {tiposCompra.map((tipo) => (
                    <Option key={tipo} value={tipo}>
                      {tipo}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>Documento</Text>}
                name="documento_id"
                rules={[{ required: true, message: 'Seleccione el documento' }]}
              >
                <Select 
                  size="small" 
                  placeholder="Seleccione documento"
                  style={{ fontSize: '12px' }}
                >
                  {documentosFiltrados.map((doc) => (
                    <Option key={doc.id_documento} value={doc.id_documento}>
                      {doc.nombre} ({doc.codigo})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>Número</Text>}
                name="numero"
                rules={[{ required: true, message: 'El número se generará automáticamente' }]}
              >
                <Input 
                  size="small" 
                  readOnly 
                  placeholder="Se generará automáticamente"
                  style={{ fontSize: '12px' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 8]}>
            <Col span={8}>
              <Form.Item
                label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>Orden de Compra</Text>}
                name="orden_compra_id"
                rules={[{ required: true, message: 'Seleccione una orden de compra' }]}
              >
                <Select
                  size="small"
                  showSearch
                  placeholder="Selecciona la orden de compra"
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                  onChange={onOrdenCompraChange}
                  allowClear
                  style={{ fontSize: '12px' }}
                >
                  {ordenesCompraFiltradas.map((oc) => (
                    <Option key={oc.id} value={oc.id}>
                      {oc.numero} - {oc.proveedor_nombre}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>Proveedor</Text>}
                name="proveedor_id"
                rules={[{ required: true, message: 'Seleccione proveedor' }]}
              >
                <Select 
                  size="small"
                  placeholder="Seleccione proveedor" 
                  showSearch 
                  optionFilterProp="children"
                  onChange={onProveedorChange}
                  style={{ fontSize: '12px' }}
                >
                  {proveedores.map((p) => (
                    <Option key={p.id_prov} value={p.id_prov}>
                      {p.razon_social}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>Dirección</Text>}
                name="direccion"
              >
                <Input 
                  size="small" 
                  readOnly 
                  style={{ fontSize: '12px' }}
                />
              </Form.Item>
            </Col>
          </Row>

          {tipoCompraSeleccionado === 'LOCAL' && (
            <Row gutter={[16, 8]}>
              <Col span={8}>
                <Form.Item
                  label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>Tipo de Documento</Text>}
                  name="tipo_doc"
                  rules={[{ required: true, message: 'Seleccione tipo de documento' }]}
                >
                  <Select 
                    size="small" 
                    placeholder="Seleccione tipo de documento"
                    style={{ fontSize: '12px' }}
                  >
                    <Option value="Factura">Factura</Option>
                    <Option value="Boleta de Venta">Boleta de Venta</Option>
                    <Option value="Nota de Crédito">Nota de Crédito</Option>
                    <Option value="Nota de Débito">Nota de Débito</Option>
                    <Option value="Formular Declaración">Formular Declaración</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>Serie</Text>}
                  name="serie"
                  rules={[{ required: true, message: 'Ingrese la serie' }]}
                >
                  <Input 
                    size="small" 
                    maxLength={10} 
                    style={{ fontSize: '12px' }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>Número Factura</Text>}
                  name="numero_fac"
                  rules={[{ required: true, message: 'Ingrese el número de factura' }]}
                >
                  <Input 
                    size="small" 
                    maxLength={20} 
                    style={{ fontSize: '12px' }}
                  />
                </Form.Item>
              </Col>
            </Row>
          )}

          <Row gutter={[16, 8]}>
            <Col span={8}>
              <Form.Item
                label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>Fecha de Emisión</Text>}
                name="fecha_emision"
                rules={[{ required: true, message: 'Seleccione fecha de emisión' }]}
              >
                <DatePicker 
                  size="small"
                  style={{ width: '100%', fontSize: '12px' }} 
                  onChange={onFechaEmisionChange}
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>Fecha de Vencimiento</Text>}
                name="fecha_vencimiento"
                rules={[{ required: true, message: 'Seleccione fecha de vencimiento' }]}
              >
                <DatePicker 
                  size="small" 
                  style={{ width: '100%', fontSize: '12px' }} 
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>Moneda</Text>}
                name="moneda_id"
                rules={[{ required: true, message: 'Seleccione moneda' }]}
              >
                <Select 
                  size="small" 
                  placeholder="Seleccione moneda" 
                  disabled
                  style={{ fontSize: '12px' }}
                >
                  {monedas.map((m) => (
                    <Option key={m.id_moneda} value={m.id_moneda}>
                      {m.codigo} - {m.nombre}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 8]}>
            <Col span={8}>
              <Form.Item
                label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>Tipo de Cambio</Text>}
                name="tipo_cambio"
                rules={[{ required: true, message: 'Ingrese tipo de cambio' }]}
              >
                <InputNumber 
                  size="small"
                  min={0} 
                  step={0.0001} 
                  style={{ width: '100%', fontSize: '12px' }} 
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item 
                label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>Forma de Pago</Text>}
                name="forma_pago_id"
                rules={[{ required: true, message: 'Seleccione forma de pago' }]}
              >
                <Select 
                  size="small" 
                  placeholder="Seleccione forma de pago"
                  style={{ fontSize: '12px' }}
                >
                  {formasPago.map((f) => (
                    <Option key={f.id} value={f.id}>
                      {f.nombre}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* SECCIÓN 2: MONTOS */}
        <Card 
          title={
            <Space>
              <DollarOutlined style={{ color: '#52c41a' }} />
              <span>Montos</span>
            </Space>
          }
          size="small"
          style={{ marginBottom: 16, border: '1px solid #f0f0f0' }}
          bodyStyle={{ padding: '16px' }}
        >
          <Row gutter={[16, 8]}>
            <Col span={8}>
              <Form.Item
                label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>Subtotal</Text>}
                name="subtotal"
                rules={[{ required: true, message: 'Ingrese subtotal' }]}
              >
                <InputNumber 
                  size="small"
                  readOnly
                  min={0} 
                  style={{ width: '100%', fontSize: '12px' }} 
                  formatter={(value) => {
                    const monedaId = form.getFieldValue('moneda_id');
                    const moneda = monedas.find(m => m.id_moneda === monedaId);
                    const simbolo = moneda ? moneda.simbolo : '';
                    return value !== undefined ? `${simbolo} ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '';
                  }}
                  parser={(value) => value?.replace(/[^\d.-]/g, '')}
                />
              </Form.Item>
            </Col>

            {tipoCompraSeleccionado === 'LOCAL' && (
              <Col span={8}>
                <Form.Item
                  label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>IGV</Text>}
                  name="igv"
                  rules={[{ required: true, message: 'Ingrese IGV' }]}
                >
                  <InputNumber 
                    size="small"
                    readOnly
                    min={0} 
                    style={{ width: '100%', fontSize: '12px' }} 
                    formatter={(value) => {
                      const monedaId = form.getFieldValue('moneda_id');
                      const moneda = monedas.find(m => m.id_moneda === monedaId);
                      const simbolo = moneda ? moneda.simbolo : '';
                      return value !== undefined ? `${simbolo} ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '';
                    }}
                    parser={(value) => value?.replace(/[^\d.-]/g, '')}
                  />
                </Form.Item>
              </Col>
            )}

            <Col span={8}>
              <Form.Item
                label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>Total</Text>}
                name="total"
                rules={[{ required: true, message: 'Ingrese total' }]}
              >
                <InputNumber 
                  size="small"
                  readOnly
                  min={0} 
                  style={{ width: '100%', fontSize: '12px' }} 
                  formatter={(value) => {
                    const monedaId = form.getFieldValue('moneda_id');
                    const moneda = monedas.find(m => m.id_moneda === monedaId);
                    const simbolo = moneda ? moneda.simbolo : '';
                    return value !== undefined ? `${simbolo} ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '';
                  }}
                  parser={(value) => value?.replace(/[^\d.-]/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>

          {(() => {
            const monedaId = form.getFieldValue('moneda_id');
            const monedaSeleccionada = monedas.find(m => m.id_moneda === monedaId);
            
            if (monedaSeleccionada?.codigo === 'USD') {
              return (
                <Row gutter={[16, 8]}>
                  <Col span={8}>
                    <Form.Item
                      label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>Importe en Soles</Text>}
                      name="importe_soles"
                    >
                      <InputNumber
                        size="small"
                        readOnly
                        min={0}
                        style={{ width: '100%', fontSize: '12px' }}
                        formatter={value => `S/ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              );
            }
            return null;
          })()}
        </Card>

        {/* SECCIÓN 3: DATOS ESPECÍFICOS */}
        <Card 
          title={
            <Space>
              {tipoCompraSeleccionado === 'LOCAL' ? <HomeOutlined /> : <GlobalOutlined />}
              <span>{tipoCompraSeleccionado === 'LOCAL' ? 'Datos Locales' : 'Datos de Importación'}</span>
            </Space>
          }
          size="small"
          style={{ marginBottom: 16, border: '1px solid #f0f0f0' }}
          bodyStyle={{ padding: '16px' }}
        >
          {tipoCompraSeleccionado === 'LOCAL' ? (
            <Row gutter={[16, 8]}>
              <Col span={12}>
                <Form.Item 
                  label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>Guía de Remisión</Text>} 
                  name="guia_remision"
                >
                  <Input 
                    size="small" 
                    maxLength={50} 
                    style={{ fontSize: '12px' }}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item 
                  label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>Detracción</Text>} 
                  name="detraccion"
                >
                  <InputNumber 
                    size="small" 
                    min={0} 
                    style={{ width: '100%', fontSize: '12px' }} 
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item 
                  label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>Retención</Text>} 
                  name="retencion"
                >
                  <InputNumber 
                    size="small" 
                    min={0} 
                    style={{ width: '100%', fontSize: '12px' }} 
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>Fecha Guía de Remisión</Text>} 
                  name="fecha_guia_remision"
                >
                  <DatePicker 
                    size="small" 
                    style={{ width: '100%', fontSize: '12px' }} 
                  />
                </Form.Item>
              </Col>
            </Row>
          ) : (
            <>
              <Row gutter={[16, 8]}>
                <Col span={12}>
                  <Form.Item 
                    label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>Número Invoice</Text>} 
                    name="numero_invoice"
                    rules={[{ required: true, message: 'Ingrese número de invoice' }]}
                  >
                    <Input 
                      size="small" 
                      maxLength={50} 
                      style={{ fontSize: '12px' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item 
                    label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>Fecha de Llegada</Text>} 
                    name="fecha_llegada"
                  >
                    <DatePicker 
                      size="small" 
                      style={{ width: '100%', fontSize: '12px' }} 
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 8]}>
                <Col span={8}>
                  <Form.Item 
                    label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>Incoterm</Text>} 
                    name="incoterm_id"
                  >
                    <Select 
                      size="small" 
                      placeholder="Seleccione incoterm"
                      style={{ fontSize: '12px' }}
                    >
                      {incoterms.map((i) => (
                        <Option key={i.id} value={i.id}>
                          {i.codigo} - {i.nombre}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item 
                    label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>Medio de Transporte</Text>} 
                    name="medio_transporte_id"
                  >
                    <Select 
                      size="small" 
                      placeholder="Seleccione medio de transporte"
                      style={{ fontSize: '12px' }}
                    >
                      {mediosTransporte.map((m) => (
                        <Option key={m.id} value={m.id}>
                          {m.nombre}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item 
                    label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>Aduana</Text>} 
                    name="aduana_id"
                  >
                    <Select 
                      size="small" 
                      placeholder="Seleccione aduana"
                      style={{ fontSize: '12px' }}
                    >
                      {aduanas.map((a) => (
                        <Option key={a.id_aduana} value={a.id_aduana}>
                          {a.nombre}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 8]}>
                <Col span={6}>
                  <Form.Item 
                    label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>Importe FOB</Text>} 
                    name="importe_fob"
                  >
                    <InputNumber 
                      size="small" 
                      min={0} 
                      style={{ width: '100%', fontSize: '12px' }} 
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item 
                    label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>Flete</Text>} 
                    name="flete"
                  >
                    <InputNumber 
                      size="small" 
                      min={0} 
                      style={{ width: '100%', fontSize: '12px' }} 
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item 
                    label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>Seguro</Text>} 
                    name="seguro"
                  >
                    <InputNumber 
                      size="small" 
                      min={0} 
                      style={{ width: '100%', fontSize: '12px' }} 
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item 
                    label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>Otros Gastos</Text>} 
                    name="otros_gastos"
                  >
                    <InputNumber 
                      size="small" 
                      min={0} 
                      style={{ width: '100%', fontSize: '12px' }} 
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 8]}>
                <Col span={6}>
                  <Form.Item 
                    label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>Importe CIF</Text>} 
                    name="importe_cif"
                  >
                    <InputNumber 
                      size="small" 
                      min={0} 
                      style={{ width: '100%', fontSize: '12px' }} 
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    label="Importe en Moneda del Proveedor"
                    name="importe_moneda_prov"
                    rules={[
                      {
                        required: true,
                        message: 'Ingrese el importe en moneda del proveedor',
                      },
                    ]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      formatter={(value) => {
                        if (value == null || value === '') return '';
                        // mostramos símbolo + separador de miles
                        return `${monedaSeleccionada?.simbolo || ''} ${value}`
                          .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                      }}
                      parser={(value) => {
                        if (!value) return null;
                        // quitamos símbolo, espacios y comas -> solo número con punto
                        return value
                          .toString()
                          .replace(/[^\d.-]/g, '')   // elimina todo menos dígitos, punto y signo
                          .replace(/,/g, '');        // por si queda alguna coma
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}
        </Card>

        {/* SECCIÓN 4: PRODUCTOS */}
        <Card 
          title={
            <Space>
              <ShoppingOutlined style={{ color: '#fa8c16' }} />
              <span>Productos de la Orden de Compra</span>
              <Tag color="blue">{productosOrdenCompra.length} items</Tag>
            </Space>
          }
          size="small"
          style={{ marginBottom: 16, border: '1px solid #f0f0f0' }}
          bodyStyle={{ padding: '16px' }}
          loading={loadingProductos}
        >
          {productosOrdenCompra.length > 0 ? (
            <div style={{ border: '1px solid #f0f0f0', borderRadius: '6px' }}>
              <Table
                size="small"
                columns={columnasProductos}
                dataSource={productosOrdenCompra}
                pagination={false}
                scroll={{ x: tipoCompraSeleccionado === 'LOCAL' ? 1000 : 900 }}
                rowKey="id"
                style={{ fontSize: '12px' }}
                summary={() => (
                  <Table.Summary>
                    <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 'bold' }}>
                      <Table.Summary.Cell index={0} colSpan={tipoCompraSeleccionado === 'LOCAL' ? 5 : 4} align="right">
                        <Text style={{ fontSize: '12px' }}>TOTAL</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <Text style={{ fontSize: '12px' }}>
                          {productosOrdenCompra.reduce((sum, item) => sum + parseFloat(item.cantidad_solicitada || 0), 0).toFixed(3)}
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} align="right">-</Table.Summary.Cell>
                      <Table.Summary.Cell index={3} align="right">
                        <Text style={{ fontSize: '12px' }}>{simboloMoneda} {totales.subtotal.toFixed(2)}</Text>
                      </Table.Summary.Cell>
                      {tipoCompraSeleccionado === 'LOCAL' && (
                        <Table.Summary.Cell index={4} align="right">
                          <Text style={{ fontSize: '12px' }}>{simboloMoneda} {totales.igv.toFixed(2)}</Text>
                        </Table.Summary.Cell>
                      )}
                      <Table.Summary.Cell index={tipoCompraSeleccionado === 'LOCAL' ? 5 : 4} align="right">
                        <Text style={{ fontSize: '12px' }}>{simboloMoneda} {totales.total.toFixed(2)}</Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
              <Text style={{ fontSize: '12px' }}>
                {form.getFieldValue('orden_compra_id') 
                  ? 'No hay productos en esta orden de compra' 
                  : 'Seleccione una orden de compra para ver los productos'}
              </Text>
            </div>
          )}
        </Card>

        {/* SECCIÓN 5: DATOS BANCARIOS */}
        <Card 
          title={
            <Space>
              <BankOutlined style={{ color: '#722ed1' }} />
              <span>Datos Bancarios</span>
            </Space>
          }
          size="small"
          style={{ marginBottom: 16, border: '1px solid #f0f0f0' }}
          bodyStyle={{ padding: '16px' }}
        >
          <Row gutter={[16, 8]}>
            <Col span={8}>
              <Form.Item 
                label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>Banco</Text>} 
                name="banco_id"
              >
                <Select
                  size="small"
                  placeholder={cuentasProveedor.length > 0 ? "Seleccione banco" : "Primero seleccione un proveedor"}
                  allowClear
                  disabled={cuentasProveedor.length === 0}
                  onChange={(value) => {
                    const cuentaSeleccionada = cuentasProveedor.find(c => c.id_bancos === value);
                    if (cuentaSeleccionada) {
                      form.setFieldsValue({
                        cuenta_bancaria: cuentaSeleccionada.cuenta_bancaria,
                        cuenta_interbancaria: cuentaSeleccionada.cuenta_interbancaria,
                        swift: cuentaSeleccionada.swift,
                        direccion_banco: cuentaSeleccionada.direccion_banco
                      });
                    } else {
                      form.setFieldsValue({
                        cuenta_bancaria: null,
                        cuenta_interbancaria: null,
                        swift: null,
                        direccion_banco: null
                      });
                    }
                  }}
                  style={{ fontSize: '12px' }}
                >
                  {cuentasProveedor.map((cuenta) => (
                    <Option key={cuenta.id_cuenta} value={cuenta.id_bancos}>
                      {cuenta.banco_nombre} - {cuenta.cuenta_bancaria} 
                      {cuenta.moneda_codigo ? ` (${cuenta.moneda_codigo})` : ''}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item 
                label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>Cuenta Bancaria</Text>} 
                name="cuenta_bancaria"
              >
                <Input 
                  size="small"
                  maxLength={50} 
                  placeholder="Número de cuenta bancaria"
                  style={{ fontSize: '12px' }}
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item 
                label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>Cuenta Interbancaria</Text>} 
                name="cuenta_interbancaria"
              >
                <Input 
                  size="small"
                  maxLength={50} 
                  placeholder="Número de cuenta interbancaria"
                  style={{ fontSize: '12px' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 8]}>
            <Col span={8}>
              <Form.Item 
                label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>SWIFT</Text>} 
                name="swift"
              >
                <Input 
                  size="small"
                  maxLength={20} 
                  placeholder="Código SWIFT"
                  style={{ fontSize: '12px' }}
                />
              </Form.Item>
            </Col>

            <Col span={16}>
              <Form.Item 
                label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>Dirección del Banco</Text>} 
                name="direccion_banco"
              >
                <Input 
                  size="small"
                  maxLength={200} 
                  placeholder="Dirección del banco"
                  style={{ fontSize: '12px' }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* SECCIÓN 6: OTROS DATOS */}
        <Card 
          title={
            <Space>
              <InfoCircleOutlined style={{ color: '#faad14' }} />
              <span>Otros Datos</span>
            </Space>
          }
          size="small"
          style={{ marginBottom: 16, border: '1px solid #f0f0f0' }}
          bodyStyle={{ padding: '16px' }}
        >
          <Row gutter={[16, 8]}>
            <Col span={24}>
              <Form.Item 
                label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>Comentario</Text>} 
                name="comentario"
              >
                <TextArea 
                  size="small"
                  rows={2} 
                  style={{ fontSize: '12px' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 8]}>
            <Col span={12}>
              <Form.Item 
                label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>Archivo Factura</Text>} 
                name="archivo_factura"
              >
                <Input 
                  size="small"
                  placeholder="Ruta o URL del archivo"
                  style={{ fontSize: '12px' }}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item 
                label={<Text style={{ fontSize: '12px', fontWeight: '500' }}>Estado</Text>} 
                name="estado"
              >
                <Select 
                  size="small"
                  style={{ fontSize: '12px' }}
                >
                  <Option value="REGISTRADA">REGISTRADA</Option>
                  <Option value="OBSERVADA">OBSERVADA</Option>
                  <Option value="PAGADA">PAGADA</Option>
                  <Option value="ANULADA">ANULADA</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* BOTONES */}
        <div style={{ textAlign: 'right', padding: '16px 0' }}>
          <Space>
            <Button onClick={onCancel} size="small">
              Cancelar
            </Button>
            <Button type="primary" htmlType="submit" size="small">
              {factura ? 'Actualizar' : 'Crear'}
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
};

export default FacturaForm;