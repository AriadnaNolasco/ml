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
  Collapse,
  Row,
  Col,
  message,
} from 'antd';
import moment from 'moment';
import api from '../../api/api';

const { Option } = Select;
const { TextArea } = Input;
const { Panel } = Collapse;

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

  /** ==============================
   *  EFECTOS REACTIVOS
   *  ============================== */

  // Inicialización del formulario
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

  // Calcular importe_soles al cambiar total o tipo_cambio
  useEffect(() => {
    const total = form.getFieldValue('total');
    const tipoCambio = form.getFieldValue('tipo_cambio');
    if (tipoCompraSeleccionado === 'EXTERNO' && total && tipoCambio) {
      calcularImporteSoles(total, tipoCambio);
    }
  }, [form.getFieldValue('total'), form.getFieldValue('tipo_cambio')]);

  // Limpiar cuentas bancarias si se borra proveedor
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

  // Cargar factura en modo edición cuando ya existan proveedores
  useEffect(() => {
    if (factura && proveedores.length > 0) {
      cargarFacturaParaEditar(factura.id);
    }
  }, [factura, proveedores]);

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
      setProductosOrdenCompra(data.data);
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
    } catch (error) {
      console.error('Error cargando factura para editar:', error);
      message.error('Error al cargar los datos de la factura');
    }
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
      message.error('Error guardando la factura');
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
    { title: 'Item', dataIndex: 'numitem', key: 'numitem', width: 60, align: 'center' },
    { title: 'Código', dataIndex: 'producto_codigo', key: 'producto_codigo', width: 120 },
    { title: 'Descripción', dataIndex: 'producto_descripcion', key: 'producto_descripcion', ellipsis: true },
    { title: 'Unidad', dataIndex: 'unidad_medida', key: 'unidad_medida', width: 80 },
    {
      title: 'Cantidad',
      dataIndex: 'cantidad_solicitada',
      key: 'cantidad_solicitada',
      width: 100,
      align: 'right',
      render: (v) => parseFloat(v).toFixed(3),
    },
    {
      title: 'Precio Unit.',
      dataIndex: 'precio_unitario',
      key: 'precio_unitario',
      width: 120,
      align: 'right',
      render: (v) => `${simboloMoneda} ${parseFloat(v).toFixed(4)}`,
    },
    {
      title: 'Desc. %',
      dataIndex: 'descuento_porcentaje',
      key: 'descuento_porcentaje',
      width: 80,
      align: 'right',
      render: (v) => (v ? `${parseFloat(v).toFixed(2)}%` : '-'),
    },
    {
      title: 'Valor Venta',
      dataIndex: 'valor_venta',
      key: 'valor_venta',
      width: 120,
      align: 'right',
      render: (v) => `${simboloMoneda} ${parseFloat(v).toFixed(2)}`,
    },
    ...(tipoCompraSeleccionado === 'LOCAL'
      ? [
          {
            title: 'IGV',
            dataIndex: 'igv',
            key: 'igv',
            width: 100,
            align: 'right',
            render: (v) => `${simboloMoneda} ${parseFloat(v).toFixed(2)}`,
          },
        ]
      : []),
    {
      title: 'Total',
      dataIndex: 'precio_total',
      key: 'precio_total',
      width: 120,
      align: 'right',
      render: (v) => `${simboloMoneda} ${parseFloat(v).toFixed(2)}`,
    },
  ];

  const totales = calcularTotalesProductos();
  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{ tipo_compra: tipoCompraDefault, estado: 'REGISTRADA' }} // CAMBIADO
      scrollToFirstError
    >
      <Collapse defaultActiveKey={['1', '2', '3', '4', '5', '6']} ghost>
        <Panel header="Datos Generales" key="1">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Tipo de Compra"
                name="tipo_compra"
                rules={[{ required: true, message: 'Seleccione tipo de compra' }]}
              >
                <Select onChange={onTipoCompraChange}>
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
                label="Documento"
                name="documento_id"
                rules={[{ required: true, message: 'Seleccione el documento' }]}
              >
                <Select placeholder="Seleccione documento">
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
                label="Número"
                name="numero"
                rules={[{ required: true, message: 'El número se generará automáticamente' }]}
              >
                <Input readOnly placeholder="Se generará automáticamente" />
              </Form.Item>
            </Col>

          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Orden de Compra"
                name="orden_compra_id"
                rules={[{ required: true, message: 'Seleccione una orden de compra' }]}
              >
                <Select
                  showSearch
                  placeholder="Selecciona la orden de compra"
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                  onChange={onOrdenCompraChange}
                  allowClear
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
                label="Proveedor"
                name="proveedor_id"
                rules={[{ required: true, message: 'Seleccione proveedor' }]}
              >
                <Select 
                  placeholder="Seleccione proveedor" 
                  showSearch 
                  optionFilterProp="children"
                  onChange={onProveedorChange}
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
                label="Dirección"
                name="direccion"
              >
                <Input readOnly />
              </Form.Item>
            </Col>

          </Row>

          <Row gutter={16}>
        

            {tipoCompraSeleccionado === 'LOCAL' && (
              <>
                <Col span={8}>
                  <Form.Item
                    label="Tipo de Documento"
                    name="tipo_doc"
                    rules={[{ required: true, message: 'Seleccione tipo de documento' }]}
                  >
                    <Select placeholder="Seleccione tipo de documento">
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
                    label="Serie"
                    name="serie"
                    rules={[{ required: true, message: 'Ingrese la serie' }]}
                  >
                    <Input maxLength={10} />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item
                    label="Número Factura"
                    name="numero_fac"
                    rules={[{ required: true, message: 'Ingrese el número de factura' }]}
                  >
                    <Input maxLength={20} />
                  </Form.Item>
                </Col>
              </>
            )}
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Fecha de Emisión"
                name="fecha_emision"
                rules={[{ required: true, message: 'Seleccione fecha de emisión' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  onChange={onFechaEmisionChange}
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="Fecha de Vencimiento"
                name="fecha_vencimiento"
                rules={[{ required: true, message: 'Seleccione fecha de vencimiento' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="Moneda"
                name="moneda_id"
                rules={[{ required: true, message: 'Seleccione moneda' }]}
              >
                <Select placeholder="Seleccione moneda" disabled>
                  {monedas.map((m) => (
                    <Option key={m.id_moneda} value={m.id_moneda}>
                      {m.codigo} - {m.nombre}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Tipo de Cambio"
                name="tipo_cambio"
                rules={[{ required: true, message: 'Ingrese tipo de cambio' }]}
              >
                <InputNumber min={0} step={0.0001} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item 
                label="Forma de Pago" 
                name="forma_pago_id"
                rules={[{ required: true, message: 'Seleccione forma de pago' }]}
              >
                <Select placeholder="Seleccione forma de pago">
                  {formasPago.map((f) => (
                    <Option key={f.id} value={f.id}>
                      {f.nombre}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

        </Panel>

        <Panel header="Montos" key="2">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Subtotal"
                name="subtotal"
                rules={[{ required: true, message: 'Ingrese subtotal' }]}
              >
                <InputNumber 
                  readOnly
                  min={0} 
                  style={{ width: '100%' }} 
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
                  label="IGV"
                  name="igv"
                  rules={[{ required: true, message: 'Ingrese IGV' }]}
                >
                  <InputNumber 
                    readOnly
                    min={0} 
                    style={{ width: '100%' }} 
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
                label="Total"
                name="total"
                rules={[{ required: true, message: 'Ingrese total' }]}
              >
                <InputNumber 
                  readOnly
                  min={0} 
                  style={{ width: '100%' }} 
                  formatter={(value) => {
                    const monedaId = form.getFieldValue('moneda_id');
                    const moneda = monedas.find(m => m.id_moneda === monedaId);
                    const simbolo = moneda ? moneda.simbolo : '';
                    return value !== undefined ? `${simbolo} ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '';
                  }}
                  parser={(value) => value?.replace(/[^\d.-]/g, '')}
                  onChange={(value) => {
                    if (tipoCompraSeleccionado === 'EXTERNO') {
                      const tipoCambio = form.getFieldValue('tipo_cambio');
                      if (value && tipoCambio) {
                        calcularImporteSoles(value, tipoCambio);
                      }
                    }
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

            {(() => {
              const monedaId = form.getFieldValue('moneda_id');
              const monedaSeleccionada = monedas.find(m => m.id_moneda === monedaId);
              
              if (monedaSeleccionada?.codigo === 'USD') {
                return (
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item
                        label="Importe en Soles"
                        name="importe_soles"
                      >
                        <InputNumber
                          readOnly
                          min={0}
                          style={{ width: '100%' }}
                          formatter={value => `S/ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                );
              }
              return null;
            })()}

        
        </Panel>

        <Panel header={tipoCompraSeleccionado === 'LOCAL' ? 'Datos Locales' : 'Datos de Importación'} key="3">
          {tipoCompraSeleccionado === 'LOCAL' && (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Guía de Remisión" name="guia_remision">
                    <Input maxLength={50} />
                  </Form.Item>
                </Col>

                <Col span={6}>
                  <Form.Item label="Detracción" name="detraccion">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>

                <Col span={6}>
                  <Form.Item label="Retención" name="retencion">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Fecha Guía de Remisión" name="fecha_guia_remision">
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          {tipoCompraSeleccionado === 'EXTERNO' && (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item 
                    label="Número Invoice" 
                    name="numero_invoice"
                    rules={[{ required: true, message: 'Ingrese número de invoice' }]}
                  >
                    <Input maxLength={50} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item label="Fecha de Llegada" name="fecha_llegada">
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="Incoterm" name="incoterm_id">
                    <Select placeholder="Seleccione incoterm">
                      {incoterms.map((i) => (
                        <Option key={i.id} value={i.id}>
                          {i.codigo} - {i.nombre}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item label="Medio de Transporte" name="medio_transporte_id">
                    <Select placeholder="Seleccione medio de transporte">
                      {mediosTransporte.map((m) => (
                        <Option key={m.id} value={m.id}>
                          {m.nombre}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item label="Aduana" name="aduana_id">
                    <Select placeholder="Seleccione aduana">
                      {aduanas.map((a) => (
                        <Option key={a.id_aduana} value={a.id_aduana}>
                          {a.nombre}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item label="Importe FOB" name="importe_fob">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>

                <Col span={6}>
                  <Form.Item label="Flete" name="flete">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>

                <Col span={6}>
                  <Form.Item label="Seguro" name="seguro">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>

                <Col span={6}>
                  <Form.Item label="Otros Gastos" name="otros_gastos">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item label="Importe CIF" name="importe_cif">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item 
                    label="Importe en Moneda del Proveedor" 
                    name="importe_moneda_prov"
                    rules={[{ required: true, message: 'Ingrese el importe en moneda del proveedor' }]}
                  >
                    <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                
              </Row>
              
            </>
          )}
        </Panel>

        {/* PANEL PARA PRODUCTOS DE LA ORDEN DE COMPRA */}
        <Panel header="Productos de la Orden de Compra" key="6">
          <Card 
            size="small" 
            loading={loadingProductos}
            title={`Productos (${productosOrdenCompra.length} items)`}
            extra={
              productosOrdenCompra.length > 0 && (
                <span>
                  Subtotal: S/ {totales.subtotal.toFixed(2)} 
                  {tipoCompraSeleccionado === 'LOCAL' && ` | IGV: S/ ${totales.igv.toFixed(2)}`} 
                  | Total: S/ {totales.total.toFixed(2)}
                </span>
              )
            }
          >
            {productosOrdenCompra.length > 0 ? (
              <Table
                size="small"
                columns={columnasProductos}
                dataSource={productosOrdenCompra}
                pagination={false}
                scroll={{ x: tipoCompraSeleccionado === 'LOCAL' ? 1000 : 900 }}
                rowKey="id"
                summary={() => (
                  <Table.Summary>
                    <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 'bold' }}>
                      <Table.Summary.Cell index={0} colSpan={tipoCompraSeleccionado === 'LOCAL' ? 5 : 4} align="right">
                        TOTAL
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        {productosOrdenCompra.reduce((sum, item) => sum + parseFloat(item.cantidad_solicitada || 0), 0).toFixed(3)}
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} align="right">-</Table.Summary.Cell>
                      <Table.Summary.Cell index={3} align="right">
                        {simboloMoneda} {totales.subtotal.toFixed(2)}
                      </Table.Summary.Cell>
                      {tipoCompraSeleccionado === 'LOCAL' && (
                        <Table.Summary.Cell index={4} align="right">
                          {simboloMoneda} {totales.igv.toFixed(2)}
                        </Table.Summary.Cell>
                      )}
                      <Table.Summary.Cell index={tipoCompraSeleccionado === 'LOCAL' ? 5 : 4} align="right">
                        {simboloMoneda} {totales.total.toFixed(2)}
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                {form.getFieldValue('orden_compra_id') 
                  ? 'No hay productos en esta orden de compra' 
                  : 'Seleccione una orden de compra para ver los productos'}
              </div>
            )}
          </Card>
        </Panel>

        <Panel header="Datos Bancarios" key="4">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Banco" name="banco_id">
                <Select
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
                      // Si se limpia la selección, limpiar los campos
                      form.setFieldsValue({
                        cuenta_bancaria: null,
                        cuenta_interbancaria: null,
                        swift: null,
                        direccion_banco: null
                      });
                    }
                  }}
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
              <Form.Item label="Cuenta Bancaria" name="cuenta_bancaria">
                <Input 
                  maxLength={50} 
                  placeholder="Número de cuenta bancaria"
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item label="Cuenta Interbancaria" name="cuenta_interbancaria">
                <Input 
                  maxLength={50} 
                  placeholder="Número de cuenta interbancaria"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="SWIFT" name="swift">
                <Input 
                  maxLength={20} 
                  placeholder="Código SWIFT"
                />
              </Form.Item>
            </Col>

            <Col span={16}>
              <Form.Item label="Dirección del Banco" name="direccion_banco">
                <Input 
                  maxLength={200} 
                  placeholder="Dirección del banco"
                />
              </Form.Item>
            </Col>
          </Row>
        </Panel>

        <Panel header="Otros Datos" key="5">
          <Form.Item label="Comentario" name="comentario">
            <TextArea rows={3} />
          </Form.Item>

          <Form.Item label="Archivo Factura" name="archivo_factura">
            <Input placeholder="Ruta o URL del archivo" />
          </Form.Item>

          <Form.Item label="Estado" name="estado">
            <Select>
              <Option value="REGISTRADA">REGISTRADA</Option>
              <Option value="OBSERVADA">OBSERVADA</Option>
              <Option value="PAGADA">PAGADA</Option>
              <Option value="ANULADA">ANULADA</Option>
            </Select>
          </Form.Item>
        </Panel>
      </Collapse>
      <Divider />

      <Form.Item style={{ textAlign: 'right' }}>
        <Button onClick={onCancel} style={{ marginRight: 8 }}>
          Cancelar
        </Button>
        <Button type="primary" htmlType="submit">
          {factura ? 'Actualizar' : 'Crear'}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default FacturaForm;