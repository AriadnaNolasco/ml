import React, { useState, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { Button, Space, Table, message, Modal, Form, Input, Switch } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import api from '../../api/api';

const CentrosCosto = ({ user }) => {
  const [centros, setCentros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCentro, setEditingCentro] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const columns = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
    },
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
      render: (text) => text || '-',
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      render: (activo) => (
        <span style={{ color: activo ? 'green' : 'red' }}>
          {activo ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button onClick={() => handleEdit(record)}>Editar</Button>
        </Space>
      ),
    },
  ];

  const fetchCentros = async () => {
    try {
      setLoading(true);
      const response = await api.get('/almacen/centros-costo');
      setCentros(response.data);
    } catch (error) {
      message.error('Error al cargar los centros de costo');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setEditingCentro(record);
    form.setFieldsValue({
      codigo: record.codigo,
      nombre: record.nombre,
      descripcion: record.descripcion,
      activo: record.activo !== false,
    });
    setIsModalOpen(true);
  };

  const handleNewCentro = () => {
    setEditingCentro(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      if (editingCentro) {
        await api.put(`/almacen/centros-costo/${editingCentro.id}`, values);
        message.success('Centro de costo actualizado correctamente');
      } else {
        await api.post('/almacen/centros-costo', values);
        message.success('Centro de costo creado correctamente');
      }
      
      setIsModalOpen(false);
      fetchCentros();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Error al guardar el centro de costo';
      message.error(errorMsg);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCentros();
  }, []);

  return (
    <div className="container">
      <div className="page-header">
        <h1>Centros de Costo</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleNewCentro}
        >
          Nuevo Centro
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={centros}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editingCentro ? 'Editar Centro de Costo' : 'Nuevo Centro de Costo'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={loading}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            activo: true,
          }}
        >
          <Form.Item
            label="Código"
            name="codigo"
            rules={[
              { required: true, message: 'El código es requerido' },
              { max: 20, message: 'Máximo 20 caracteres' },
            ]}
          >
            <Input placeholder="CC001" />
          </Form.Item>

          <Form.Item
            label="Nombre"
            name="nombre"
            rules={[
              { required: true, message: 'El nombre es requerido' },
              { max: 100, message: 'Máximo 100 caracteres' },
            ]}
          >
            <Input placeholder="Nombre del centro de costo" />
          </Form.Item>

          <Form.Item
            label="Descripción"
            name="descripcion"
            rules={[{ max: 255, message: 'Máximo 255 caracteres' }]}
          >
            <Input.TextArea rows={3} placeholder="Descripción del centro de costo" />
          </Form.Item>

          <Form.Item
            label="Activo"
            name="activo"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CentrosCosto;