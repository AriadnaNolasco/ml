import React, { useState } from 'react';
import {
  Table,
  Button,
  Modal,
  message,
  Card,
  Space,
  Tag,
  Spin,
  Row,
  Col,
  Typography,
  Input,
  Statistic
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  FileSearchOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { sunatApi } from '../../api/sunatApi';
import ConsultaRucForm from './ConsultaRucForm';
import ConsultaRucResult from './ConsultaRucResult';

const { Title } = Typography;
const { Search } = Input;

const ConsultaRuc = ({ user }) => {
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [selectedConsulta, setSelectedConsulta] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [consultando, setConsultando] = useState(false);

  // Cargar historial de consultas (si lo tienes en tu base de datos)
  const cargarConsultas = async () => {
    setLoading(true);
    try {
      // Aquí puedes implementar la carga del historial si lo guardas en BD
      // const response = await api.get('/sunat/historial-consultas');
      // setConsultas(response.data);

      // Por ahora, solo cargamos las consultas en memoria
      message.info('Funcionalidad de historial pendiente de implementar');
    } catch (error) {
      console.error('Error al cargar consultas:', error);
      message.error('Error al cargar el historial de consultas');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Recargar historial
      await cargarConsultas();
      message.success('Lista actualizada');
    } catch (error) {
      console.error('Error al actualizar:', error);
      message.error('Error al actualizar la lista');
    } finally {
      setRefreshing(false);
    }
  };

  const handleNuevaConsulta = () => {
    setSelectedConsulta(null);
    setModalVisible(true);
  };

  const handleVerResultado = (consulta) => {
    setSelectedConsulta(consulta);
    setResultModalVisible(true);
  };

  const handleConsultarRuc = async (rucData) => {
    setConsultando(true);
    try {
      // ✅ LLAMADA CORREGIDA - Usar sunatApi.consultarRuc()
      const resultado = await sunatApi.consultarRuc(rucData.numero_ruc);

      // Agregar a la lista de consultas
      const nuevaConsulta = {
        id: Date.now(),
        numero_ruc: rucData.numero_ruc,
        fecha_consulta: new Date().toISOString(),
        resultado: resultado,
        razon_social: resultado.razon_social,
        estado: resultado.estado
      };

      setConsultas(prev => [nuevaConsulta, ...prev]);
      setModalVisible(false);
      setSelectedConsulta(nuevaConsulta);
      setResultModalVisible(true);

      message.success('Consulta realizada correctamente');
    } catch (error) {
      console.error('Error en consulta RUC:', error);
      // ✅ ERROR SIMPLIFICADO - ya viene formateado de sunatApi
      message.error(error.message);
    } finally {
      setConsultando(false);
    }
  };

  const filteredConsultas = consultas.filter(consulta => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (consulta.numero_ruc && consulta.numero_ruc.includes(searchTerm)) ||
      (consulta.razon_social && consulta.razon_social.toLowerCase().includes(searchLower)) ||
      (consulta.estado && consulta.estado.toLowerCase().includes(searchLower))
    );
  });

  const columns = [
    {
      title: 'RUC',
      dataIndex: 'numero_ruc',
      key: 'numero_ruc',
      width: 120,
      sorter: (a, b) => a.numero_ruc.localeCompare(b.numero_ruc),
    },
    {
      title: 'Razón Social',
      dataIndex: 'razon_social',
      key: 'razon_social',
      ellipsis: true,
      sorter: (a, b) => a.razon_social?.localeCompare(b.razon_social),
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 100,
      render: (estado) => (
        <Tag color={estado === 'ACTIVO' ? 'green' : 'red'}>
          {estado}
        </Tag>
      ),
      filters: [
        { text: 'Activo', value: 'ACTIVO' },
        { text: 'Inactivo', value: 'INACTIVO' },
      ],
      onFilter: (value, record) => record.estado === value,
    },
    {
      title: 'Fecha Consulta',
      dataIndex: 'fecha_consulta',
      key: 'fecha_consulta',
      width: 180,
      render: (fecha) => new Date(fecha).toLocaleString(),
      sorter: (a, b) => new Date(a.fecha_consulta) - new Date(b.fecha_consulta),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleVerResultado(record)}
            title="Ver detalles"
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              <FileSearchOutlined /> Consulta RUC - SUNAT
            </Title>
            <p style={{ margin: 0, color: '#666' }}>
              Consulta información de empresas registradas en SUNAT
            </p>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={refreshing}
                title="Actualizar lista"
              >
                Actualizar
              </Button>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleNuevaConsulta}
                size="large"
              >
                Nueva Consulta RUC
              </Button>
            </Space>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 20 }}>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="Total Consultas"
                value={consultas.length}
                prefix={<FileSearchOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="Activos"
                value={consultas.filter(c => c.estado === 'ACTIVO').length}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="Inactivos"
                value={consultas.filter(c => c.estado === 'INACTIVO').length}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>

        <Row style={{ marginBottom: 20 }}>
          <Col span={24}>
            <Search
              placeholder="Buscar por RUC, razón social o estado..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onSearch={handleRefresh}
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredConsultas}
          loading={loading}
          rowKey="id"
          locale={{
            emptyText: 'No se han realizado consultas aún'
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} de ${total} consultas`
          }}
          scroll={{ x: 800 }}
          size="middle"
        />
      </Card>

      {/* Modal para nueva consulta */}
      <Modal
        title="Consulta de RUC"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
        destroyOnClose
      >
        <ConsultaRucForm
          onConsultar={handleConsultarRuc}
          onCancel={() => setModalVisible(false)}
          loading={consultando}
        />
      </Modal>

      {/* Modal para ver resultados */}
      <Modal
        title={`Resultado Consulta RUC: ${selectedConsulta?.numero_ruc}`}
        open={resultModalVisible}
        onCancel={() => setResultModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setResultModalVisible(false)}>
            Cerrar
          </Button>,
          <Button
            key="new"
            type="primary"
            onClick={() => {
              setResultModalVisible(false);
              handleNuevaConsulta();
            }}
          >
            Nueva Consulta
          </Button>
        ]}
        width={700}
      >
        <ConsultaRucResult
          consulta={selectedConsulta}
        />
      </Modal>
    </div>
  );
};

export default ConsultaRuc;