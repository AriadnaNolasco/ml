// pages/contabilidad/PlanCuentas.jsx
import React, { useState, useEffect } from 'react';
import {
  Table, Button, Card, Row, Col,
  Input, Select, Space, Modal, Form,
  Switch, Tag, message, Popconfirm,
  Typography, Divider
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  SearchOutlined, ReloadOutlined
} from '@ant-design/icons';
import api from '../../api/api';

const { Title } = Typography;
const { Option } = Select;

const PlanCuentas = () => {
  const [planCuentas, setPlanCuentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [bancos, setBancos] = useState([]);
  const [form] = Form.useForm();

  // Filtros
  const [filters, setFilters] = useState({
    estado: '',
    search: ''
  });

  // Cargar datos
  useEffect(() => {
    loadPlanCuentas();
    loadBancos();
  }, []);

  const loadPlanCuentas = async () => {
    setLoading(true);
    try {
      let url = '/contabilidad/plan-cuentas';
      const params = new URLSearchParams();
      
      if (filters.estado) params.append('estado', filters.estado);
      if (filters.search) params.append('search', filters.search);
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await api.get(url);
      setPlanCuentas(response.data.data);
    } catch (error) {
      message.error('Error al cargar el plan de cuentas');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadBancos = async () => {
    try {
      const response = await api.get('/contabilidad/bancos');
      setBancos(response.data.data);
    } catch (error) {
      console.error('Error al cargar bancos:', error);
    }
  };

  const handleCreate = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      id_banco: record.id_banco || undefined
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/contabilidad/plan-cuentas/${id}`);
      message.success('Plan de cuenta eliminado correctamente');
      loadPlanCuentas();
    } catch (error) {
      message.error('Error al eliminar el plan de cuenta');
      console.error(error);
    }
  };

  const toggleEstado = async (id, currentEstado) => {
    try {
      const response = await api.patch(`/contabilidad/plan-cuentas/${id}/toggle-estado`);
      message.success(`Plan de cuenta ${response.data.data.estado ? 'activado' : 'desactivado'} correctamente`);
      loadPlanCuentas();
    } catch (error) {
      message.error('Error al cambiar el estado');
      console.error(error);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingRecord) {
        await api.put(`/contabilidad/plan-cuentas/${editingRecord.id_plan}`, values);
        message.success('Plan de cuenta actualizado correctamente');
      } else {
        await api.post('/contabilidad/plan-cuentas', values);
        message.success('Plan de cuenta creado correctamente');
      }
      
      setModalVisible(false);
      loadPlanCuentas();
    } catch (error) {
      if (error.response?.status === 400) {
        message.error(error.response.data.message);
      } else {
        message.error('Error al guardar el plan de cuenta');
      }
      console.error(error);
    }
  };

  const columns = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      width: 100,
      sorter: (a, b) => a.codigo - b.codigo,
    },
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      ellipsis: true,
    },
    {
      title: 'Moneda',
      dataIndex: 'moneda',
      key: 'moneda',
      width: 120,
      filters: [
        { text: 'AMBAS', value: 'AMBAS' },
        { text: 'NUEVO SOL', value: 'NUEVO SOL' },
        { text: 'DOLAR', value: 'DOLAR' },
      ],
      onFilter: (value, record) => record.moneda === value,
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      width: 100,
      filters: [
        { text: 'TITULO', value: 'TITULO' },
        { text: 'DIGITABLE', value: 'DIGITABLE' },
      ],
      onFilter: (value, record) => record.tipo === value,
    },
    {
      title: 'Centro Costo',
      dataIndex: 'centro_costo',
      key: 'centro_costo',
      width: 120,
      render: (centro_costo) => (
        <Tag color={centro_costo ? 'green' : 'red'}>
          {centro_costo ? 'Sí' : 'No'}
        </Tag>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 100,
      render: (estado) => (
        <Tag color={estado ? 'green' : 'red'}>
          {estado ? 'Activo' : 'Inactivo'}
        </Tag>
      ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Popconfirm
            title="¿Cambiar estado?"
            description={`¿Está seguro de ${record.estado ? 'desactivar' : 'activar'} este plan de cuenta?`}
            onConfirm={() => toggleEstado(record.id_plan, record.estado)}
            okText="Sí"
            cancelText="No"
          >
            <Button
              type="link"
              danger={record.estado}
              icon={record.estado ? <DeleteOutlined /> : <PlusOutlined />}
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>Plan de Cuentas Contables</Title>
      
      <Card>
        {/* Filtros */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filtrar por estado"
              value={filters.estado || null}
              onChange={(value) => setFilters({ ...filters, estado: value })}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="true">Activos</Option>
              <Option value="false">Inactivos</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Buscar por código o nombre..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onPressEnter={loadPlanCuentas}
              suffix={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={24} md={10}>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={loadPlanCuentas}
              >
                Buscar
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  setFilters({ estado: '', search: '' });
                  loadPlanCuentas();
                }}
              >
                Limpiar
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                Nuevo Plan
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Tabla */}
        <Table
          columns={columns}
          dataSource={planCuentas}
          loading={loading}
          rowKey="id_plan"
          scroll={{ x: 800 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} de ${total} items`,
          }}
        />
      </Card>

      {/* Modal de formulario */}
      <Modal
        title={editingRecord ? 'Editar Plan de Cuenta' : 'Nuevo Plan de Cuenta'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            estado: true,
            cuenta_corriente: false,
            diferencia_cambio: false,
            cuenta_restringida_caja: false,
            centro_costo: false,
            importaciones: false,
            imprime_inven_balance: false,
          }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Código"
                name="codigo"
                rules={[{ required: true, message: 'El código es obligatorio' }]}
              >
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Nombre"
                name="nombre"
                rules={[{ required: true, message: 'El nombre es obligatorio' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Moneda"
                name="moneda"
                rules={[{ required: true, message: 'La moneda es obligatoria' }]}
              >
                <Select>
                  <Option value="AMBAS">AMBAS</Option>
                  <Option value="NUEVO SOL">NUEVO SOL</Option>
                  <Option value="DOLAR">DOLAR</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="Tipo" name="tipo">
                <Select>
                  <Option value="TITULO">TITULO</Option>
                  <Option value="DIGITABLE">DIGITABLE</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="Balance Comprobación" name="balance_comprobacion">
                <Select>
                  <Option value="RESULTADO">RESULTADO</Option>
                  <Option value="SALDO">SALDO</Option>
                  <Option value="INVENTARIO">INVENTARIO</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item label="Transferencias" name="transferencias">
                <Select>
                  <Option value="SIN TRANSFERENCIA">SIN TRANSFERENCIA</Option>
                  <Option value="CON TRANSFERENCIA">CON TRANSFERENCIA</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="BG EGP" name="bg_egp">
                <Select>
                  <Option value="AMBOS">AMBOS</Option>
                  <Option value="SOLO BALANCE x FUNCION">SOLO BALANCE x FUNCION</Option>
                  <Option value="SOLO NATURALEZA">SOLO NATURALEZA</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="Tabla EGP Balances" name="tabla_egp_balances">
                <Select>
                  <Option value="ACTIVO CORRIENTE">ACTIVO CORRIENTE</Option>
                  <Option value="ACTIVO NO CORRIENTE">ACTIVO NO CORRIENTE</Option>
                  <Option value="CTAS. ORDEN DEUDORAS">CTAS. ORDEN DEUDORAS</Option>
                  <Option value="PASIVO CORRIENTE">PASIVO CORRIENTE</Option>
                  <Option value="PASIVO NO CORRIENTE">PASIVO NO CORRIENTE</Option>
                  <Option value="PATRIMONIO">PATRIMONIO</Option>
                  <Option value="CTAS. ORDEN ACREEDOR">CTAS. ORDEN ACREEDOR</Option>
                  <Option value="GASTOS POR NATURALEZA">GASTOS POR NATURALEZA</Option>
                  <Option value="UTILIDAD BRUTA">UTILIDAD BRUTA</Option>
                  <Option value="GASTOS DE OPERACION">GASTOS DE OPERACION</Option>
                  <Option value="RESULTADOS">RESULTADOS</Option>
                  <Option value="R.E.I DEL EJERCICIO">R.E.I DEL EJERCICIO</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Banco" name="id_banco">
                <Select allowClear>
                  {bancos.map(banco => (
                    <Option key={banco.id} value={banco.id}>
                      {banco.codigo_banco} - {banco.nombre}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider>Opciones</Divider>

          <Row gutter={16}>
            <Col xs={12} sm={6}>
              <Form.Item name="cuenta_corriente" valuePropName="checked">
                <Switch /> Cuenta Corriente
              </Form.Item>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Item name="diferencia_cambio" valuePropName="checked">
                <Switch /> Diferencia Cambio
              </Form.Item>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Item name="cuenta_restringida_caja" valuePropName="checked">
                <Switch /> Cta. Restringida Caja
              </Form.Item>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Item name="centro_costo" valuePropName="checked">
                <Switch /> Centro Costo
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={12} sm={6}>
              <Form.Item name="importaciones" valuePropName="checked">
                <Switch /> Importaciones
              </Form.Item>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Item name="imprime_inven_balance" valuePropName="checked">
                <Switch /> Imprime Inv/Balance
              </Form.Item>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Item name="estado" valuePropName="checked">
                <Switch /> Activo
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingRecord ? 'Actualizar' : 'Crear'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                Cancelar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PlanCuentas;