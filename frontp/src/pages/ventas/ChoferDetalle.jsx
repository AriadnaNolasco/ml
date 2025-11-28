import React from "react";
import { Card, Descriptions, Tag, Row, Col, Divider, Spin, Alert } from "antd";
import {
  UserOutlined,
  IdcardOutlined,
  CarOutlined,
  BankOutlined,
  TeamOutlined,
  ShopOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";

const ChoferDetalle = ({ chofer, loading = false }) => {
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

  if (!chofer) {
    return <div>No se encontraron datos del chofer</div>;
  }

  const getTipoPertenenciaColor = (tipo) => {
    switch (tipo) {
      case "PERSONAL":
        return "blue";
      case "TRANSPORTISTA":
        return "green";
      case "CLIENTE":
        return "orange";
      default:
        return "default";
    }
  };

  const getTipoPertenenciaIcon = (tipo) => {
    switch (tipo) {
      case "PERSONAL":
        return <TeamOutlined />;
      case "TRANSPORTISTA":
        return <CarOutlined />;
      case "CLIENTE":
        return <ShopOutlined />;
      default:
        return <UserOutlined />;
    }
  };

  const getEntidadNombre = () => {
    if (chofer.tipo_pertenencia === "PERSONAL") {
      return chofer.personal_nombre || "N/A";
    } else if (chofer.tipo_pertenencia === "TRANSPORTISTA") {
      return chofer.transportista_nombre || "N/A";
    } else if (chofer.tipo_pertenencia === "CLIENTE") {
      return chofer.cliente_nombre || "N/A";
    }
    return "N/A";
  };

  return (
    <Card>
      <Row gutter={24}>
        <Col xs={24} md={12}>
          <Divider orientation="left" style={{ marginTop: 0 }}>
            <UserOutlined style={{ marginRight: 8 }} />
            Información Personal
          </Divider>

          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Código">
              <strong>{chofer.codigo || "N/A"}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Nº Chofer">
              <Tag color="purple">
                {String(chofer.cod_chofer || 0).padStart(3, "0")}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Nombre Completo">
              <strong>{chofer.nombre_completo || "N/A"}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Tipo de Documento">
              {chofer.tipo_documento_nombre || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Nº Documento">
              <strong>{chofer.nro_documento || "N/A"}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Nº Licencia">
              {chofer.nro_licencia ? (
                <Tag color="blue">{chofer.nro_licencia}</Tag>
              ) : (
                "Sin licencia"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Estado">
              <Tag color={chofer.estado ? "green" : "red"}>
                {chofer.estado ? "Activo" : "Inactivo"}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </Col>

        <Col xs={24} md={12}>
          <Divider orientation="left">
            {getTipoPertenenciaIcon(chofer.tipo_pertenencia)} Pertenencia
          </Divider>

          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Tipo de Pertenencia">
              <Tag color={getTipoPertenenciaColor(chofer.tipo_pertenencia)}>
                {chofer.tipo_pertenencia || "N/A"}
              </Tag>
            </Descriptions.Item>

            {chofer.tipo_pertenencia === "PERSONAL" && (
              <Descriptions.Item label="Personal">
                {getEntidadNombre()}
              </Descriptions.Item>
            )}

            {chofer.tipo_pertenencia === "TRANSPORTISTA" && (
              <Descriptions.Item label="Transportista">
                {getEntidadNombre()}
              </Descriptions.Item>
            )}

            {chofer.tipo_pertenencia === "CLIENTE" && (
              <Descriptions.Item label="Cliente">
                {getEntidadNombre()}
              </Descriptions.Item>
            )}
          </Descriptions>

          {(chofer.empresa_documento || chofer.empresa_razon_social) && (
            <>
              <Divider orientation="left" style={{ marginTop: 16 }}>
                <BankOutlined style={{ marginRight: 8 }} />
                Información de Empresa
              </Divider>

              <Alert
                message="Datos de la Empresa"
                description={
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="RUC/Documento">
                      <strong>{chofer.empresa_documento || "N/A"}</strong>
                    </Descriptions.Item>
                    <Descriptions.Item label="Razón Social">
                      {chofer.empresa_razon_social || "N/A"}
                    </Descriptions.Item>
                  </Descriptions>
                }
                type="info"
                showIcon
                icon={<BankOutlined />}
              />
            </>
          )}
        </Col>
      </Row>

      <Divider orientation="left" style={{ marginTop: 24 }}>
        <EnvironmentOutlined style={{ marginRight: 8 }} />
        Ubicación
      </Divider>

      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Dirección">
          {chofer.direccion || "No especificada"}
        </Descriptions.Item>
        <Descriptions.Item label="País">
          {chofer.pais_nombre || "N/A"}
        </Descriptions.Item>
      </Descriptions>

      {(chofer.created_at || chofer.updated_at) && (
        <>
          <Divider orientation="left" style={{ marginTop: 24 }}>
            Información de Auditoría
          </Divider>

          <Descriptions column={2} bordered size="small">
            {chofer.created_at && (
              <Descriptions.Item label="Fecha de Creación">
                {new Date(chofer.created_at).toLocaleString("es-PE")}
              </Descriptions.Item>
            )}
            {chofer.creado_por_nombre && (
              <Descriptions.Item label="Creado Por">
                {chofer.creado_por_nombre}
              </Descriptions.Item>
            )}
            {chofer.updated_at && (
              <Descriptions.Item label="Última Actualización">
                {new Date(chofer.updated_at).toLocaleString("es-PE")}
              </Descriptions.Item>
            )}
            {chofer.actualizado_por_nombre && (
              <Descriptions.Item label="Actualizado Por">
                {chofer.actualizado_por_nombre}
              </Descriptions.Item>
            )}
          </Descriptions>
        </>
      )}
    </Card>
  );
};

export default ChoferDetalle;
