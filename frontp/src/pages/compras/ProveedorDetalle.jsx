import React from 'react';
import { Descriptions, Tag, Divider, Spin, Card, Row, Col, Empty, Typography } from 'antd';
import { 
  IdcardOutlined, 
  ContactsOutlined, 
  UserOutlined, 
  BankOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const ProveedorDetalle = ({ proveedor }) => {
  if (!proveedor) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <Spin size="large" />
      </div>
    );
  }

  const tieneCuentasBancarias = proveedor.cuentas_bancarias && proveedor.cuentas_bancarias.length > 0;

  // Función para formatear fechas
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Función para formatear fecha y hora
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '0 8px' }}>
      {/* Header con información principal */}
      <Card 
        size="small" 
        style={{ 
          marginBottom: 20, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          color: 'white'
        }}
        bodyStyle={{ padding: '20px' }}
      >
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Title level={3} style={{ color: 'white', margin: 0, fontSize: '24px' }}>
              {proveedor.razon_social || 'N/A'}
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
              {proveedor.nomb_comercial || proveedor.razon_social || 'N/A'}
            </Text>
            <div style={{ marginTop: 8 }}>
              <Tag 
                color={proveedor.estado ? "green" : "red"} 
                style={{ 
                  border: 'none', 
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: 'white'
                }}
                icon={proveedor.estado ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
              >
                {proveedor.estado ? 'ACTIVO' : 'INACTIVO'}
              </Tag>
              <Tag 
                style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  border: 'none', 
                  color: 'white',
                  fontSize: '12px',
                  marginLeft: 8
                }}
              >
                {proveedor.tipo_documento_siglas || 'DOC'} {proveedor.nro_documento || 'N/A'}
              </Tag>
            </div>
          </Col>
          <Col>
            <div style={{ textAlign: 'right' }}>
              <Text style={{ color: 'rgba(255,255,255,0.9)', display: 'block' }}>Código</Text>
              <Title level={4} style={{ color: 'white', margin: 0, fontSize: '18px' }}>
                {proveedor.codigo || 'N/A'}
              </Title>
            </div>
          </Col>
        </Row>
      </Card>

      <Row gutter={16}>
        {/* Columna izquierda - Información básica y contacto */}
        <Col span={12}>
          {/* Información Básica */}
          <Card 
            size="small" 
            style={{ marginBottom: 16, borderRadius: 8 }}
            title={
              <span style={{ fontSize: '14px', fontWeight: '600' }}>
                <IdcardOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                Información Básica
              </span>
            }
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Tipo Documento" labelStyle={{ fontWeight: '600', width: '120px' }}>
                {proveedor.tipo_documento_nombre || proveedor.tipo_documento_siglas || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="N° Documento" labelStyle={{ fontWeight: '600', width: '120px' }}>
                <Text strong style={{ fontSize: '13px' }}>
                  {proveedor.nro_documento || 'N/A'}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Fecha Registro" labelStyle={{ fontWeight: '600', width: '120px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CalendarOutlined style={{ color: '#52c41a' }} />
                  {formatDate(proveedor.fecha_registro)}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="País" labelStyle={{ fontWeight: '600', width: '120px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <GlobalOutlined style={{ color: '#fa8c16' }} />
                  {proveedor.pais_nombre || 'N/A'}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="Contacto" labelStyle={{ fontWeight: '600', width: '120px' }}>
                <Text strong style={{ color: '#1890ff' }}>
                  {proveedor.contacto || 'N/A'}
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Información de Contacto */}
          <Card 
            size="small" 
            style={{ marginBottom: 16, borderRadius: 8 }}
            title={
              <span style={{ fontSize: '14px', fontWeight: '600' }}>
                <ContactsOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                Información de Contacto
              </span>
            }
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label={<><EnvironmentOutlined /> Dirección</>} labelStyle={{ fontWeight: '600', width: '120px' }}>
                {proveedor.direccion || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label={<><MailOutlined /> Email</>} labelStyle={{ fontWeight: '600', width: '120px' }}>
                {proveedor.email ? (
                  <a href={`mailto:${proveedor.email}`} style={{ color: '#1890ff' }}>
                    {proveedor.email}
                  </a>
                ) : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label={<><PhoneOutlined /> Teléfono 1</>} labelStyle={{ fontWeight: '600', width: '120px' }}>
                {proveedor.telefono1 || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label={<><PhoneOutlined /> Teléfono 2</>} labelStyle={{ fontWeight: '600', width: '120px' }}>
                {proveedor.telefono2 || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label={<><PhoneOutlined /> Celular 1</>} labelStyle={{ fontWeight: '600', width: '120px' }}>
                {proveedor.celular1 || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label={<><PhoneOutlined /> Celular 2</>} labelStyle={{ fontWeight: '600', width: '120px' }}>
                {proveedor.celular2 || 'N/A'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Columna derecha - Información bancaria y auditoría */}
        <Col span={12}>
          {/* Información Bancaria */}
          <Card 
            size="small" 
            style={{ marginBottom: 16, borderRadius: 8 }}
            title={
              <span style={{ fontSize: '14px', fontWeight: '600' }}>
                <BankOutlined style={{ marginRight: 8, color: '#fa8c16' }} />
                Información Bancaria
                <Tag 
                  style={{ 
                    marginLeft: 8, 
                    fontSize: '11px',
                    background: tieneCuentasBancarias ? '#f6ffed' : '#f5f5f5',
                    border: tieneCuentasBancarias ? '1px solid #b7eb8f' : '1px solid #d9d9d9'
                  }}
                >
                  {tieneCuentasBancarias ? `${proveedor.cuentas_bancarias.length} cuenta(s)` : 'Sin cuentas'}
                </Tag>
              </span>
            }
          >
            {tieneCuentasBancarias ? (
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {proveedor.cuentas_bancarias.map((cuenta, index) => (
                  <Card 
                    key={cuenta.id_cuenta || index} 
                    size="small" 
                    style={{ 
                      marginBottom: 12, 
                      borderLeft: `4px solid #1890ff`,
                      borderRadius: 6
                    }}
                    bodyStyle={{ padding: '12px' }}
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>
                          <BankOutlined style={{ marginRight: 6 }} />
                          Cuenta #{index + 1}
                        </span>
                        <Tag 
                          color={cuenta.estado_cuenta ? "green" : "red"} 
                          style={{ margin: 0, fontSize: '10px' }}
                        >
                          {cuenta.estado_cuenta ? 'Activa' : 'Inactiva'}
                        </Tag>
                      </div>
                    }
                  >
                    <Row gutter={[8, 8]}>
                      <Col span={24}>
                        <div style={{ marginBottom: 8 }}>
                          <Text strong style={{ fontSize: '12px', color: '#666' }}>Banco:</Text>
                          <div style={{ fontSize: '13px', fontWeight: '600' }}>
                            {cuenta.banco_nombre || 'N/A'}
                            {cuenta.banco_siglas && ` (${cuenta.banco_siglas})`}
                          </div>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ marginBottom: 4 }}>
                          <Text strong style={{ fontSize: '11px', color: '#666' }}>N° Cuenta:</Text>
                          <div style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: '600' }}>
                            {cuenta.numero_cuenta || 'N/A'}
                          </div>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ marginBottom: 4 }}>
                          <Text strong style={{ fontSize: '11px', color: '#666' }}>Moneda:</Text>
                          <div style={{ fontSize: '12px' }}>
                            {cuenta.moneda_nombre ? `${cuenta.moneda_nombre} (${cuenta.moneda_simbolo})` : 'N/A'}
                          </div>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ marginBottom: 4 }}>
                          <Text strong style={{ fontSize: '11px', color: '#666' }}>Cuenta Interbancaria:</Text>
                          <div style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                            {cuenta.cta_interbancaria || 'N/A'}
                          </div>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ marginBottom: 4 }}>
                          <Text strong style={{ fontSize: '11px', color: '#666' }}>SWIFT:</Text>
                          <div style={{ fontSize: '11px' }}>
                            {cuenta.codigo_swift || 'N/A'}
                          </div>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ marginBottom: 4 }}>
                          <Text strong style={{ fontSize: '11px', color: '#666' }}>Código ABA:</Text>
                          <div style={{ fontSize: '11px' }}>
                            {cuenta.codigo_aba || 'N/A'}
                          </div>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ marginBottom: 4 }}>
                          <Text strong style={{ fontSize: '11px', color: '#666' }}>País Banco:</Text>
                          <div style={{ fontSize: '11px' }}>
                            {cuenta.pais_banco_nombre || 'N/A'}
                          </div>
                        </div>
                      </Col>
                      <Col span={24}>
                        <div style={{ marginBottom: 4 }}>
                          <Text strong style={{ fontSize: '11px', color: '#666' }}>Dirección Banco:</Text>
                          <div style={{ fontSize: '11px' }}>
                            {cuenta.direccion || cuenta.banco_direccion_base || 'N/A'}
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                ))}
              </div>
            ) : (
              <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE} 
                description="No hay cuentas bancarias registradas"
                imageStyle={{ height: 40 }}
                style={{ margin: '20px 0' }}
              />
            )}
          </Card>

          {/* Información de Auditoría */}
          <Card 
            size="small" 
            style={{ borderRadius: 8 }}
            title={
              <span style={{ fontSize: '14px', fontWeight: '600' }}>
                <UserOutlined style={{ marginRight: 8, color: '#722ed1' }} />
                Información de Auditoría
              </span>
            }
          >
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ marginBottom: 12 }}>
                  <Text strong style={{ fontSize: '11px', color: '#666', display: 'block' }}>Creado Por</Text>
                  <div style={{ fontSize: '12px', fontWeight: '500' }}>
                    {proveedor.creado_por_nombre || 'N/A'}
                  </div>
                  <Text style={{ fontSize: '10px', color: '#999' }}>
                    {formatDateTime(proveedor.created_at)}
                  </Text>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 12 }}>
                  <Text strong style={{ fontSize: '11px', color: '#666', display: 'block' }}>Actualizado Por</Text>
                  <div style={{ fontSize: '12px', fontWeight: '500' }}>
                    {proveedor.actualizado_por_nombre || 'N/A'}
                  </div>
                  <Text style={{ fontSize: '10px', color: '#999' }}>
                    {formatDateTime(proveedor.updated_at)}
                  </Text>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProveedorDetalle;