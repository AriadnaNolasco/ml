import { useState, useEffect } from 'react';
import { Modal, Table, Tabs, Input, Tag, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../../api/api';

const ModalSeleccionarOC = ({ visible, onClose, onSelect }) => {
  const [ordenesCompra, setOrdenesCompra] = useState([]);
  const [ordenesCompletas, setOrdenesCompletas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('LOCAL');
  const [busqueda, setBusqueda] = useState('');

  const estadosOC = {
    PENDIENTE: { color: 'orange', text: 'Pendiente' },
    PARCIAL: { color: 'blue', text: 'Parcial' }
  };

  const columnas = [
    {
      title: 'Número OC',
      dataIndex: 'numero',
      key: 'numero',
      width: 150,
      render: (numero) => <strong>{numero}</strong>
    },
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      key: 'fecha',
      width: 110,
      render: (fecha) => dayjs(fecha).format('DD/MM/YYYY')
    },
    {
      title: 'Proveedor',
      dataIndex: 'proveedor_nombre',
      key: 'proveedor_nombre',
      ellipsis: true
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 120,
      align: 'right',
      render: (total, record) => {
        const moneda = record.moneda === 'USD' ? '$' : 'S/';
        return `${moneda} ${parseFloat(total || 0).toFixed(2)}`;
      }
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 100,
      render: (estado) => (
        <Tag color={estadosOC[estado]?.color || 'default'}>
          {estadosOC[estado]?.text || estado}
        </Tag>
      )
    }
  ];

  const items = [
    {
      key: 'LOCAL',
      label: 'Órdenes Locales'
    },
    {
      key: 'EXTERNO',
      label: 'Órdenes Exterior'
    }
  ];

  useEffect(() => {
    if (visible) {
      fetchOrdenesCompra();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, activeTab]);

  useEffect(() => {
    filtrarOrdenes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda, ordenesCompletas, activeTab]);

  const fetchOrdenesCompra = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/almacen/ordenes-compra-disponibles?tipo=${activeTab}`);
      const data = Array.isArray(response.data) ? response.data : [];
      setOrdenesCompletas(data);
      filtrarOrdenes(data);
    } catch (error) {
      message.error('Error al cargar las órdenes de compra disponibles');
      console.error('Error:', error);
      setOrdenesCompletas([]);
      setOrdenesCompra([]);
    } finally {
      setLoading(false);
    }
  };

  const filtrarOrdenes = (ordenesData = ordenesCompletas) => {
    if (!Array.isArray(ordenesData)) {
      setOrdenesCompra([]);
      return;
    }

    let ordenesFiltradas = ordenesData;

    if (busqueda) {
      ordenesFiltradas = ordenesFiltradas.filter(orden =>
        orden.numero?.toLowerCase().includes(busqueda.toLowerCase()) ||
        orden.proveedor_nombre?.toLowerCase().includes(busqueda.toLowerCase())
      );
    }

    setOrdenesCompra(ordenesFiltradas);
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
    setBusqueda('');
  };

  const handleSeleccionar = (orden) => {
    onSelect(orden);
    handleClose();
  };

  const handleClose = () => {
    setBusqueda('');
    setActiveTab('LOCAL');
    onClose();
  };

  return (
    <Modal
      title="Seleccionar Orden de Compra"
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={900}
      destroyOnClose
    >
      <div style={{ marginBottom: '16px' }}>
        <Tabs 
          activeKey={activeTab} 
          onChange={handleTabChange}
          items={items}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <Input
          placeholder="Buscar por número de OC o proveedor"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          prefix={<SearchOutlined />}
          allowClear
        />
      </div>

      <Table
        columns={columnas}
        dataSource={ordenesCompra}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 5,
          showTotal: (total) => `${total} órdenes disponibles`
        }}
        onRow={(record) => ({
          onClick: () => handleSeleccionar(record),
          style: { cursor: 'pointer' }
        })}
        rowClassName="hover-row"
      />

      <style jsx>{`
        .hover-row:hover {
          background-color: #f5f5f5;
        }
      `}</style>
    </Modal>
  );
};

export default ModalSeleccionarOC;
