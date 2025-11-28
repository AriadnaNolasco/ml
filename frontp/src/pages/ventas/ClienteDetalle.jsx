import React from "react";
import {
  Card,
  Descriptions,
  Tag,
  Row,
  Col,
  Divider,
  Spin,
  Typography,
} from "antd";
import {
  IdcardOutlined,
  ContactsOutlined,
  UserOutlined,
  ShopOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const ClienteDetalle = ({ cliente, loading = false }) => {
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "200px",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!cliente) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Title level={4} type="secondary">
            No se encontraron datos del cliente
          </Title>
        </div>
      </Card>
    );
  }

  // Función para formatear montos en soles
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "N/A";
    return `S/ ${parseFloat(amount).toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Función para formatear porcentajes
  const formatPercentage = (value) => {
    if (!value && value !== 0) return "N/A";
    return `${parseFloat(value).toFixed(2)}%`;
  };

  return (
    <Card>
      {/* Información Básica */}
      <Row gutter={24}>
        <Col xs={24} md={12}>
          <Divider orientation="left" style={{ marginTop: 0 }}>
            <IdcardOutlined style={{ marginRight: 8 }} />
            Información Básica
          </Divider>

          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Código" span={1}>
              <Text strong>{cliente.codigo || "N/A"}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Tipo Documento">
              {cliente.tipo_documento_nombre || cliente.tipo_documento || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Número Documento">
              <Text strong>{cliente.nro_documento || "N/A"}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Fecha Registro">
              {cliente.fecha_registro
                ? new Date(cliente.fecha_registro).toLocaleDateString("es-PE", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Razón Social">
              <Text strong style={{ fontSize: "14px" }}>
                {cliente.razon_social || "N/A"}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Nombre Comercial">
              {cliente.nomb_comercial || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Estado">
              <Tag
                color={cliente.estado ? "green" : "red"}
                style={{ fontSize: "12px" }}
              >
                {cliente.estado ? "Activo" : "Inactivo"}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </Col>

        <Col xs={24} md={12}>
          <Divider orientation="left">
            <ContactsOutlined style={{ marginRight: 8 }} />
            Información de Contacto
          </Divider>

          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="País">
              {cliente.pais_nombre || cliente.pais || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Departamento">
              {cliente.departamento_nombre || cliente.departamento || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Distrito/Provincia">
              {cliente.distrito_nombre || cliente.distrito || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Dirección">
              {cliente.direccion ? (
                <div>
                  <EnvironmentOutlined
                    style={{ marginRight: 8, color: "#1890ff" }}
                  />
                  {cliente.direccion}
                </div>
              ) : (
                "N/A"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {cliente.email ? (
                <div>
                  <MailOutlined style={{ marginRight: 8, color: "#1890ff" }} />
                  <a href={`mailto:${cliente.email}`}>{cliente.email}</a>
                </div>
              ) : (
                "N/A"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Teléfono 1">
              {cliente.telefono1 ? (
                <div>
                  <PhoneOutlined style={{ marginRight: 8, color: "#52c41a" }} />
                  {cliente.telefono1}
                </div>
              ) : (
                "N/A"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Teléfono 2">
              {cliente.telefono2 || "N/A"}
            </Descriptions.Item>
          </Descriptions>
        </Col>
      </Row>

      {/* Información de Contacto Adicional */}
      <Divider orientation="left" style={{ marginTop: 24 }}>
        <PhoneOutlined style={{ marginRight: 8 }} />
        Contactos Adicionales
      </Divider>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Celular 1">
              {cliente.celular1 ? (
                <div>
                  <PhoneOutlined style={{ marginRight: 8, color: "#52c41a" }} />
                  <Text strong>{cliente.celular1}</Text>
                </div>
              ) : (
                "N/A"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Celular 2">
              {cliente.celular2 || "N/A"}
            </Descriptions.Item>
          </Descriptions>
        </Col>
      </Row>

      <Divider orientation="left" style={{ marginTop: 24 }}>
        <ShopOutlined style={{ marginRight: 8 }} />
        Información Comercial
      </Divider>

      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Vendedor Asignado">
          {cliente.vendedor_nombre ? (
            <div>
              <UserOutlined style={{ marginRight: 8, color: "#722ed1" }} />
              <Text strong>
                {cliente.vendedor_codigo ? `[${cliente.vendedor_codigo}] ` : ""}
                {cliente.vendedor_nombre}
              </Text>
            </div>
          ) : (
            "N/A"
          )}
        </Descriptions.Item>
      </Descriptions>

      {/* Información Financiera */}
      {(cliente.linea_credito !== undefined ||
        cliente.forma_pago_nombre ||
        cliente.tasa_interes !== undefined ||
        cliente.descuento_1 !== undefined ||
        cliente.descuento_2 !== undefined) && (
        <>
          <Divider orientation="left" style={{ marginTop: 24 }}>
            <DollarOutlined style={{ marginRight: 8 }} />
            Información Financiera
          </Divider>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Línea de Crédito" span={1}>
                  <Text strong type="success">
                    {formatCurrency(cliente.linea_credito)}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Tasa de Interés">
                  {formatPercentage(cliente.tasa_interes)}
                </Descriptions.Item>
                <Descriptions.Item label="Forma de Pago">
                  {cliente.forma_pago_nombre || "N/A"}
                </Descriptions.Item>
              </Descriptions>
            </Col>
            <Col xs={24} md={12}>
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Descuento 1">
                  {formatPercentage(cliente.descuento_1)}
                </Descriptions.Item>
                <Descriptions.Item label="Descuento 2">
                  {formatPercentage(cliente.descuento_2)}
                </Descriptions.Item>
                <Descriptions.Item label="Cuenta Detracción">
                  {cliente.cuenta_detraccion || "N/A"}
                </Descriptions.Item>
              </Descriptions>
            </Col>
          </Row>

          {/* Estado de la Información Financiera */}
          {cliente.financiera_estado !== undefined && (
            <div style={{ marginTop: 16 }}>
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Estado Información Financiera">
                  <Tag color={cliente.financiera_estado ? "blue" : "orange"}>
                    {cliente.financiera_estado ? "Habilitada" : "Deshabilitada"}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </div>
          )}
        </>
      )}

      {/* Información de Auditoría */}
      <Divider orientation="left" style={{ marginTop: 24 }}>
        <UserOutlined style={{ marginRight: 8 }} />
        Información de Auditoría
      </Divider>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Creado Por">
              {cliente.creado_por_nombre ? (
                <Text strong>{cliente.creado_por_nombre}</Text>
              ) : (
                "N/A"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Fecha Creación">
              {cliente.created_at
                ? new Date(cliente.created_at).toLocaleString("es-PE", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "N/A"}
            </Descriptions.Item>
          </Descriptions>
        </Col>
        <Col xs={24} md={12}>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Actualizado Por">
              {cliente.actualizado_por_nombre ? (
                <Text strong>{cliente.actualizado_por_nombre}</Text>
              ) : (
                "N/A"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Fecha Actualización">
              {cliente.updated_at
                ? new Date(cliente.updated_at).toLocaleString("es-PE", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "N/A"}
            </Descriptions.Item>
          </Descriptions>
        </Col>
      </Row>

      {/* Resumen Visual */}
      <Divider orientation="left" style={{ marginTop: 24 }}>
        Resumen
      </Divider>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Card size="small" style={{ textAlign: "center" }}>
            <Title
              level={4}
              style={{
                margin: 0,
                color: cliente.estado ? "#52c41a" : "#ff4d4f",
              }}
            >
              {cliente.estado ? "ACTIVO" : "INACTIVO"}
            </Title>
            <Text type="secondary">Estado del Cliente</Text>
          </Card>
        </Col>

        {cliente.linea_credito > 0 && (
          <Col xs={24} md={8}>
            <Card size="small" style={{ textAlign: "center" }}>
              <Title level={4} style={{ margin: 0, color: "#1890ff" }}>
                {formatCurrency(cliente.linea_credito)}
              </Title>
              <Text type="secondary">Línea de Crédito</Text>
            </Card>
          </Col>
        )}

        {cliente.vendedor_nombre && (
          <Col xs={24} md={8}>
            <Card size="small" style={{ textAlign: "center" }}>
              <Title level={4} style={{ margin: 0, color: "#722ed1" }}>
                {cliente.vendedor_codigo || "VEND"}
              </Title>
              <Text type="secondary">Vendedor Asignado</Text>
            </Card>
          </Col>
        )}
      </Row>

      {/* Información Adicional si existe */}
      {(cliente.observaciones || cliente.comentarios) && (
        <>
          <Divider orientation="left" style={{ marginTop: 24 }}>
            Información Adicional
          </Divider>
          <Card size="small">
            <Text>{cliente.observaciones || cliente.comentarios}</Text>
          </Card>
        </>
      )}
    </Card>
  );
};

export default ClienteDetalle;
