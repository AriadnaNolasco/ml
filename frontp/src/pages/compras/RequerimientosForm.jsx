import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  message,
  Row,
  Col,
  Table,
  InputNumber,
  Card,
  Divider,
  Typography
} from 'antd';
import {
  PlusOutlined,
  MinusOutlined,
  SaveOutlined,
  CloseOutlined,
  UserOutlined,
  TeamOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../api/api';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const RequerimientosForm = ({ requerimiento, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [productos, setProductos] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [codigosCompras, setCodigosCompras] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [items, setItems] = useState([]);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [areaUsuario, setAreaUsuario] = useState('');
  const [tipoSeleccionado, setTipoSeleccionado] = useState('INTERNO');

useEffect(() => {
  cargarUsuarioYArea();
  cargarDatosFormulario();

  if (requerimiento) {
    cargarRequerimientoExistente();
  } else {
    cargarSiguienteNumero('INTERNO');
  }
}, [requerimiento]);

const cargarSiguienteNumero = async (tipo = 'INTERNO') => {
  try {
    const res = await api.get(`/compras/requerimientos/next-number?tipo=${tipo}`);
    form.setFieldsValue({ numero: res.data.nextNumber });
  } catch (error) {
    console.error('Error al obtener siguiente número:', error);
    message.error('No se pudo obtener el siguiente número');
  }
};

  // Función para establecer valores por defecto
  const establecerValoresPorDefecto = () => {
    // Encontrar el documento REQ por defecto para INTERNO
    const documentosLimpios = documentos.map(doc => ({
      ...doc,
      codigo: doc.codigo?.trim()
    }));
    
    const documentoRequerimiento = documentosLimpios.find(doc => doc.codigo === 'REQ');
    
    form.setFieldsValue({
      tipo: 'INTERNO',
      estado: 'PENDIENTE',
      documento_id: documentoRequerimiento?.id // Establecer documento automáticamente
    });
    setTipoSeleccionado('INTERNO');
  };



const cargarUsuarioYArea = async () => {
  try {
    let finalUserData = null;

    // Forzar siempre refrescar desde el backend
    const userRes = await api.get('/auth/me');
    finalUserData = userRes.data;

    // Guardar en localStorage para próximos usos
    localStorage.setItem('userData', JSON.stringify(finalUserData));

    setUsuarioActual(finalUserData);

    //Tomar área
    if (finalUserData.area) {
      setAreaUsuario(finalUserData.area.nombre);
    } else {
      setAreaUsuario('Sin área asignada');
    }

    console.log('Usuario cargado desde API:', finalUserData);

  } catch (error) {
    console.error('Error al cargar datos del usuario:', error);
  }
};



  const cargarDatosFormulario = async () => {
  try {
    const [
      productosRes,
      centrosRes,
      codigosRes,
      documentosRes
    ] = await Promise.all([
      api.get('/almacen/productos?activo=true'),
      api.get('/contabilidad/centros-costo?activo=true'),
      api.get('/compras/codigos-compras'),
      api.get('/documentos?codigo=REQ,REX') // Cargar todos los documentos
    ]);

    // Establecer productos (ajusta según lo que veas en la consola)
    setProductos(Array.isArray(productosRes.data) ? productosRes.data : 
                Array.isArray(productosRes.data?.data) ? productosRes.data.data : 
                Array.isArray(productosRes.data?.productos) ? productosRes.data.productos : []);

    // Establecer centros de costo
    setCentrosCosto(Array.isArray(centrosRes.data) ? centrosRes.data : 
                   Array.isArray(centrosRes.data?.data) ? centrosRes.data.data : 
                   Array.isArray(centrosRes.data?.centros) ? centrosRes.data.centros : []);

    // Establecer códigos de compras
    setCodigosCompras(Array.isArray(codigosRes.data) ? codigosRes.data : 
                 Array.isArray(codigosRes.data?.data) ? codigosRes.data.data : 
                 Array.isArray(codigosRes.data?.codigos) ? codigosRes.data.codigos : []);

    const documentosData = documentosRes.data?.data || documentosRes.data;
    setDocumentos(Array.isArray(documentosData) ? documentosData : []);

    // Establecer valores por defecto después de cargar documentos
    if (!requerimiento) {
      const documentosLimpios = documentosData.map(doc => ({
        ...doc,
        codigo: doc.codigo?.trim()
      }));
      
      const documentoRequerimiento = documentosLimpios.find(doc => doc.codigo === 'REQ');
      
      form.setFieldsValue({
        tipo: 'INTERNO',
        estado: 'PENDIENTE',
        documento_id: documentoRequerimiento?.id
      });
      setTipoSeleccionado('INTERNO');
    }

  } catch (error) {
    console.error('Error al cargar datos del formulario:', error);
    message.error('Error al cargar datos del formulario');
  }
};

  const cargarRequerimientoExistente = async () => {
  try {
    setTipoSeleccionado(requerimiento.tipo || 'INTERNO');

    form.setFieldsValue({
      ...requerimiento,
      fecha: dayjs(requerimiento.fecha),
      fecha_entrega: dayjs(requerimiento.fecha_entrega),
      documento_id: requerimiento.id_documento,
      id_cod_compras: requerimiento.id_cod_compras
    });

    const detallesRes = await api.get(`/compras/requerimientos/${requerimiento.id}/detalles`);
    
    console.log('Detalles del requerimiento:', detallesRes.data.detalles);
    
    setItems(detallesRes.data.detalles.map(item => ({
      ...item,
      key: item.id || Math.random()
    })));
  } catch (error) {
    console.error('Error al cargar requerimiento:', error);
    message.error('Error al cargar el requerimiento');
  }
};

useEffect(() => {
  console.log('Requerimiento recibido:', requerimiento);
  console.log('Códigos de compras:', codigosCompras);
  console.log('Documentos:', documentos);
}, [requerimiento, codigosCompras, documentos]);

  // Filtrar documentos según el tipo seleccionado
  const getDocumentosFiltrados = () => {
    const documentosLimpios = documentos.map(doc => ({
      ...doc,
      codigo: doc.codigo?.trim() // Limpiar espacios en blanco
    }));

    if (tipoSeleccionado === 'INTERNO') {
      return documentosLimpios.filter(doc => doc.codigo === 'REQ');
    } else if (tipoSeleccionado === 'EXTERNO') {
      return documentosLimpios.filter(doc => doc.codigo === 'REX');
    }
    return documentosLimpios;
  };

  const handleTipoChange = (value) => {
    setTipoSeleccionado(value);
    cargarSiguienteNumero(value); // 🔹 recalcular número al cambiar tipo

    // Encontrar el documento correspondiente al tipo seleccionado
    const documentosLimpios = documentos.map(doc => ({
      ...doc,
      codigo: doc.codigo?.trim()
    }));

    let documentoCorrespondiente = null;

    if (value === 'INTERNO') {
      documentoCorrespondiente = documentosLimpios.find(doc => doc.codigo === 'REQ');
    } else if (value === 'EXTERNO') {
      documentoCorrespondiente = documentosLimpios.find(doc => doc.codigo === 'REX');
    }

    // Establecer automáticamente el documento correspondiente
    if (documentoCorrespondiente) {
      form.setFieldsValue({ 
        documento_id: documentoCorrespondiente.id 
      });
    }
  };

  const handleAddItem = () => {
    setItems([...items, {
      key: Date.now(),
      num_item: items.length + 1,
      producto_codigo: '',
      cantidad_solicitada: 0,
      centro_costo_id: '',
      comentario: ''
    }]);
  };

  const handleRemoveItem = (key) => {
    setItems(items.filter(item => item.key !== key));
  };

  const handleItemChange = (key, field, value) => {
    setItems(items.map(item => 
      item.key === key ? { ...item, [field]: value } : item
    ));
  };

  const calcularTotal = () => {
    return items.reduce((total, item) => total + (Number(item.cantidad_solicitada) || 0), 0);
  };

  const handleSubmit = async (values) => {
    try {
      // Validación de items antes de enviar
      if (items.length === 0) {
        message.error('Debe agregar al menos un item');
        return;
      }

      const invalidItem = items.find(item => !item.cantidad_solicitada || Number(item.cantidad_solicitada) <= 0);
      if (invalidItem) {
        message.error(`El producto ${invalidItem.producto_codigo || '(sin código)'} tiene una cantidad inválida`);
        return;
      }

      setLoading(true);

      const payload = {
        ...values,
        fecha: values.fecha.format('YYYY-MM-DD'),
        fecha_entrega: values.fecha_entrega
          ? values.fecha_entrega.format('YYYY-MM-DD')
          : null,
        id_documento: values.documento_id,
        id_cod_compras: values.id_cod_compras,
        centro_costo_id: values.centro_costo_id, 
        proposito: values.proposito || 'COMPRA',
        prioridad: values.prioridad?.toUpperCase(),
        items: items.map((item) => ({
          producto_codigo: item.producto_codigo,
          cantidad_solicitada: Number(item.cantidad_solicitada),
          comentario: item.comentario || '',
        })),
      };

      // Elimina solicitante_id del payload ya que el backend lo obtiene del token
      delete payload.solicitante_id;
      delete payload.documento_id;
      delete payload.codigo_compras_id;

      if (requerimiento) {
        await api.put(`/compras/requerimientos/${requerimiento.id}`, payload);
        message.success('Requerimiento actualizado correctamente');
      } else {
        await api.post('/compras/requerimientos', payload);
        message.success('Requerimiento creado correctamente');
      }

      // En handleSubmit, verifica que los items tengan el centro_costo_id
      console.log('Items a enviar:', items.map(item => ({
          producto_codigo: item.producto_codigo,
          cantidad_solicitada: Number(item.cantidad_solicitada),
          centro_costo_id: item.centro_costo_id, // Verifica que esto no sea undefined
          comentario: item.comentario || ''
      })));

      onSuccess();
    } catch (error) {
      console.error('Error al guardar requerimiento:', error);
      console.error('Detalles del error:', error.response?.data);
      message.error(error.response?.data?.error || 'Error al guardar el requerimiento');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Item',
      dataIndex: 'num_item',
      key: 'num_item',
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Producto',
      key: 'producto_codigo',
      render: (_, record, index) => (
        <Select
          placeholder="Seleccionar producto"
          value={record.producto_codigo}
          onChange={(value) => handleItemChange(record.key, 'producto_codigo', value)}
          style={{ width: '100%' }}
          showSearch
          optionFilterProp="children"
          filterOption={(input, option) => {
            // option.value contiene el código del producto
            const product = productos.find(p => p.codigo === option.value);
            if (!product) return false;
            
            const searchText = input.toLowerCase();
            return (
              product.descripcion.toLowerCase().includes(searchText) ||
              product.codigo.toLowerCase().includes(searchText) ||
              (product.codigo_barras && product.codigo_barras.toLowerCase().includes(searchText))
            );
          }}
          filterSort={(optionA, optionB) => {
            const productA = productos.find(p => p.codigo === optionA.value);
            const productB = productos.find(p => p.codigo === optionB.value);
            return productA.descripcion.localeCompare(productB.descripcion);
          }}
        >
          {productos.map(producto => (
            <Option key={producto.codigo} value={producto.codigo}>
              {producto.descripcion} ({producto.codigo})
            </Option>
          ))}
        </Select>
      ),
    }, 
    {
      title: 'U.M.',
      key: 'unidad_medida',
      width: 80,
      render: (_, record) => {
        const producto = productos.find(p => p.codigo === record.producto_codigo);
        return producto ? (
          <div style={{ 
            textAlign: 'center', 
            fontWeight: 'bold',
            padding: '4px',
            background: '#f0f0f0',
            borderRadius: '4px'
          }}>
            {producto.unidad_medida_abreviatura || 
            producto.unidad_medida_abreviada || 
            producto.unidad_medida || 
            producto.abreviatura || 
            'UND'}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#999' }}>-</div>
        );
      },
    },
    {
      title: 'Cantidad',
      key: 'cantidad_solicitada',
      width: 120,
      render: (_, record) => (
        <InputNumber
          value={record.cantidad_solicitada}
          onChange={(value) => handleItemChange(record.key, 'cantidad_solicitada', value)}
          min={0.000} 
          step={0.001}
          precision={3}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Stock Actual',
      key: 'stock_actual',
      width: 100,
      render: (_, record) => {
        const producto = productos.find(p => p.codigo === record.producto_codigo);
        return producto ? (
          <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
            {Number(producto.stock_actual || 0).toLocaleString('es-PE', {
              minimumFractionDigits: 3,
              maximumFractionDigits: 3
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#999' }}>-</div>
        );
      },
    },
    {
      title: 'Comentario',
      key: 'comentario',
      render: (_, record) => (
        <Input
          value={record.comentario}
          onChange={(e) => handleItemChange(record.key, 'comentario', e.target.value)}
          placeholder="Comentario opcional"
        />
      ),
    },
    {
      title: 'Acción',
      key: 'accion',
      width: 60,
      render: (_, record) => (
        <Button
          danger
          size="small"
          icon={<MinusOutlined />}
          onClick={() => handleRemoveItem(record.key)}
        />
      ),
    },
  ];

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        tipo: 'INTERNO',
        estado: 'PENDIENTE',
        prioridad: 'Normal',
        total_cantidad_solicitada: 0,
        fecha: dayjs() 
      }}
    >
    {/* Sección de Información del Solicitante */}
    <Card 
        size="small" 
        style={{ 
            marginBottom: 16,
            border: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.09)'
        }}
        bodyStyle={{ padding: '20px' }}
        >
        <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{
                background: '#1890ff',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '12px'
            }}>
                <UserOutlined style={{ color: 'white', fontSize: '18px' }} />
            </div>
            <div>
                <Text strong style={{ display: 'block', color: '#262626' }}>
                {usuarioActual?.nombre_completo || 'Usuario no identificado'}
                </Text>
                <Text type="secondary" style={{ fontSize: '13px' }}>
                {requerimiento ? 'Solicitante original' : 'Usted será el solicitante'}
                </Text>
            </div>
            </div>
            
            <div style={{ 
            background: '#f6ffed',
            padding: '8px 16px',
            borderRadius: '16px',
            border: '1px solid #b7eb8f'
            }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <TeamOutlined style={{ 
                color: '#52c41a', 
                marginRight: '6px',
                fontSize: '14px'
                }} />
                <Text style={{ color: '#389e0d', fontSize: '13px' }}>
                  {areaUsuario || 'Área no especificada'}
                </Text>
            </div>
            </div>
        </div>

        {requerimiento && requerimiento.solicitante_id !== usuarioActual?.id && (
            <div style={{ 
            marginTop: '12px',
            padding: '8px 12px',
            background: '#fffbe6',
            border: '1px dashed #ffe58f',
            borderRadius: '6px'
            }}>
            <Text type="warning" style={{ fontSize: '12px' }}>
                ⚠️ Este requerimiento fue creado por otro usuario. No puedes cambiar el solicitante.
            </Text>
            </div>
        )}
        </Card>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            label="Tipo"
            name="tipo"
            rules={[{ required: true, message: 'El tipo es requerido' }]}
          >
            <Select 
              onChange={handleTipoChange}
              placeholder="Seleccionar tipo de requerimiento"
            >
              <Option value="INTERNO">Interno</Option>
              <Option value="EXTERNO">Externo</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="Documento"
            name="documento_id"
            rules={[{ required: true, message: 'El documento es requerido' }]}
          >
            <Select >
              {getDocumentosFiltrados().map(doc => (
                <Option key={doc.id} value={doc.id}>
                  {doc.nombre} ({doc.codigo?.trim()})
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="Número" name="numero">
            <Input readOnly />
          </Form.Item>
        </Col>
      </Row>

      {/* Segunda fila: Fechas y Código Compra */}
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            label="Fecha"
            name="fecha"
            rules={[{ required: true, message: 'La fecha es requerida' }]}
            initialValue={dayjs()}
          >
            <DatePicker 
              format="DD/MM/YYYY" 
              style={{ width: '100%' }} 
              disabled 
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="Fecha Entrega"
            name="fecha_entrega"
            rules={[{ required: true, message: 'La fecha de entrega es requerida' }]}
          >
            <DatePicker 
              format="DD/MM/YYYY" 
              style={{ width: '100%' }} 
              placeholder="Seleccionar fecha de entrega"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="Código Compra"
            name="id_cod_compras"  // Cambiado de codigo_compras_id a id_cod_compras
            rules={[{ required: true, message: 'El código de compra es requerido' }]}
          >
            <Select placeholder="Seleccionar código compra">
              {codigosCompras.map(codigo => (
                <Option 
                  key={codigo.id_cod_compras || codigo.id} 
                  value={codigo.id_cod_compras || codigo.id}
                >
                  {codigo.codigo} - {codigo.nombre}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      {/* Tercera fila: Estado y Prioridad */}
      <Row gutter={16}>
        <Col span={6}>
          <Form.Item
            label="Estado"
            name="estado"
            rules={[{ required: true, message: 'El estado es requerido' }]}
          >
            <Select 
              disabled={!requerimiento}
              placeholder="Seleccionar estado"
            >
              {!requerimiento ? (
                <Option value="PENDIENTE">Pendiente</Option>
              ) : (
                <>
                  <Option value="PENDIENTE">Pendiente</Option>
                  <Option value="APROBADO">Aprobado</Option>
                  <Option value="RECHAZADO">Rechazado</Option>
                  <Option value="PROCESADO">Procesado</Option>
                  <Option value="CERRADO">Cerrado</Option>
                </>
              )}
            </Select>
          </Form.Item>
        </Col>

        <Col span={6}>
          <Form.Item
            label="Prioridad"
            name="prioridad"
            rules={[{ required: true, message: 'La prioridad es requerida' }]}
          >
            <Select placeholder="Seleccionar prioridad">
              <Option value="Normal">Normal</Option>
              <Option value="Urgente">Urgente</Option>
            </Select>
          </Form.Item>
        </Col>

        <Col span={6}>
          <Form.Item
            label="Propósito"
            name="proposito"
            rules={[{ required: true, message: 'El propósito es requerido' }]}
            initialValue="COMPRA"
          >
            <Select>
              <Option value="PRODUCCION">Producción</Option>
              <Option value="MANTENIMIENTO">Mantenimiento</Option>
              <Option value="COMPRA">Compra</Option>
            </Select>
          </Form.Item>
        </Col>

        <Col span={6}>
          <Form.Item
            label="Centro de Costo"
            name="centro_costo_id"
            rules={[{ required: true, message: 'El centro de costo es requerido' }]}
          >
            <Select placeholder="Seleccionar centro de costo">
              {centrosCosto.map(c => (
                <Option key={c.id_c_costo || c.id} value={c.id_c_costo || c.id}>
                  {c.codigo} - {c.nombre}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>


      <Divider>Items del Requerimiento</Divider>

      <Card size="small">
        <Table
          columns={columns}
          dataSource={items}
          pagination={false}
          size="small"
          scroll={{ x: 800 }}
          footer={() => (
            <div style={{ textAlign: 'center' }}>
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={handleAddItem}
                style={{ width: '100%' }}
              >
                Agregar Item
              </Button>
            </div>
          )}
        />
        
        <div style={{ marginTop: 16, textAlign: 'right', fontWeight: 'bold' }}>
          Total Solicitado: {calcularTotal().toLocaleString('es-PE', {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3
          })}
        </div>
      </Card>

      <Form.Item style={{ marginTop: 24, marginBottom: 0, textAlign: 'right' }}>
        <Space>
          <Button onClick={onCancel} icon={<CloseOutlined />}>
            Cancelar
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            icon={<SaveOutlined />}
            disabled={items.length === 0}
          >
            {requerimiento ? 'Actualizar' : 'Crear'}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default RequerimientosForm;