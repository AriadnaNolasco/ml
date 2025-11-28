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
  EyeOutlined,
  UserOutlined,
  IdcardOutlined
} from '@ant-design/icons';
import { sunatApi } from '../../api/sunatApi';  // ✅ Importación corregida
import ConsultaDniForm from './ConsultaDniForm';
import ConsultaDniResult from './ConsultaDniResult';

const { Title } = Typography;
const { Search } = Input;

const ConsultaDni = ({ user }) => {
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [selectedConsulta, setSelectedConsulta] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [consultando, setConsultando] = useState(false);

  const cargarConsultas = async () => {
    setLoading(true);
    try {
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

  const handleConsultarDni = async (dniData) => {
    setConsultando(true);
    try {
      // ✅ LLAMADA CORREGIDA - Usar sunatApi.consultarDni()
      const resultado = await sunatApi.consultarDni(dniData.numero_dni);
      
      // Agregar a la lista de consultas
      const nuevaConsulta = {
        id: Date.now(),
        numero_dni: dniData.numero_dni,
        fecha_consulta: new Date().toISOString(),
        resultado: resultado,
        nombre_completo: resultado.full_name,
        nombres: resultado.first_name
      };

      setConsultas(prev => [nuevaConsulta, ...prev]);
      setModalVisible(false);
      setSelectedConsulta(nuevaConsulta);
      setResultModalVisible(true);
      
      message.success('Consulta realizada correctamente');
    } catch (error) {
      console.error('Error en consulta DNI:', error);
      // ✅ ERROR SIMPLIFICADO - ya viene formateado de sunatApi
      message.error(error.message);
    } finally {
      setConsultando(false);
    }
  };

  const filteredConsultas = consultas.filter(consulta => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (consulta.numero_dni && consulta.numero_dni.includes(searchTerm)) ||
      (consulta.nombre_completo && consulta.nombre_completo.toLowerCase().includes(searchLower)) ||
      (consulta.nombres && consulta.nombres.toLowerCase().includes(searchLower))
    );
  });

  const columns = [
    {
      title: 'DNI',
      dataIndex: 'numero_dni',
      key: 'numero_dni',
      width: 100,
      sorter: (a, b) => a.numero_dni.localeCompare(b.numero_dni),
    },
    {
      title: 'Nombres',
      dataIndex: 'nombres',
      key: 'nombres',
      ellipsis: true,
      sorter: (a, b) => a.nombres?.localeCompare(b.nombres),
    },
    {
      title: 'Nombre Completo',
      dataIndex: 'nombre_completo',
      key: 'nombre_completo',
      ellipsis: true,
      sorter: (a, b) => a.nombre_completo?.localeCompare(b.nombre_completo),
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
              <IdcardOutlined /> Consulta DNI - RENIEC
            </Title>
            <p style={{ margin: 0, color: '#666' }}>
              Consulta información de personas registradas en RENIEC
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
                icon={<UserOutlined />}
                onClick={handleNuevaConsulta}
                size="large"
              >
                Nueva Consulta DNI
              </Button>
            </Space>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 20 }}>
          <Col span={24}>
            <Card size="small">
              <Statistic
                title="Total Consultas DNI"
                value={consultas.length}
                prefix={<IdcardOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Row style={{ marginBottom: 20 }}>
          <Col span={24}>
            <Search
              placeholder="Buscar por DNI, nombres o nombre completo..."
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
            emptyText: 'No se han realizado consultas DNI aún'
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
        title="Consulta de DNI"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
        destroyOnClose
      >
        <ConsultaDniForm
          onConsultar={handleConsultarDni}
          onCancel={() => setModalVisible(false)}
          loading={consultando}
        />
      </Modal>

      {/* Modal para ver resultados */}
      <Modal
        title={`Resultado Consulta DNI: ${selectedConsulta?.numero_dni}`}
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
        width={600}
      >
        <ConsultaDniResult
          consulta={selectedConsulta}
        />
      </Modal>
    </div>
  );
};

export default ConsultaDni;