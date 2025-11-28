import React from 'react';
import { Descriptions, Tag, Divider, Spin, Card } from 'antd';
import { IdcardOutlined, ContactsOutlined, UserOutlined } from '@ant-design/icons';

const VendedorDetalle = ({ vendedor }) => {
  if (!vendedor) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Card>
      <Divider orientation="left" style={{ marginTop: 0 }}>
        <IdcardOutlined style={{ marginRight: 8 }} />
        Información Básica
      </Divider>

      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Código">{vendedor.codigo || 'N/A'}</Descriptions.Item>
        <Descriptions.Item label="Nombre Completo">
          <strong>{vendedor.nombre || 'N/A'}</strong>
        </Descriptions.Item>
        <Descriptions.Item label="Siglas">{vendedor.siglas || 'N/A'}</Descriptions.Item>
        <Descriptions.Item label="Estado">
          <Tag color={vendedor.estado ? "green" : "red"}>
            {vendedor.estado ? 'Activo' : 'Inactivo'}
          </Tag>
        </Descriptions.Item>
      </Descriptions>

      <Divider orientation="left">
        <ContactsOutlined style={{ marginRight: 8 }} />
        Permisos y Configuración
      </Divider>

      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Maneja Contado">
          <Tag color={vendedor.con_contado ? "green" : "red"}>
            {vendedor.con_contado ? 'Sí' : 'No'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Maneja Crédito">
          <Tag color={vendedor.con_credito ? "green" : "red"}>
            {vendedor.con_credito ? 'Sí' : 'No'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Maneja Cobranza">
          <Tag color={vendedor.con_cobranza ? "green" : "red"}>
            {vendedor.con_cobranza ? 'Sí' : 'No'}
          </Tag>
        </Descriptions.Item>
      </Descriptions>

      <Divider orientation="left">
        <UserOutlined style={{ marginRight: 8 }} />
        Información de Auditoría
      </Divider>

      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Creado Por"><strong>{vendedor.creado_por_nombre || 'N/A'} </strong></Descriptions.Item>
        <Descriptions.Item label="Fecha Creación">
          {vendedor.created_at ? new Date(vendedor.created_at).toLocaleString('es-PE') : 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Actualizado Por"><strong>{vendedor.actualizado_por_nombre || 'N/A'}</strong></Descriptions.Item>
        <Descriptions.Item label="Fecha Actualización">
          {vendedor.updated_at ? new Date(vendedor.updated_at).toLocaleString('es-PE') : 'N/A'}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

export default VendedorDetalle;