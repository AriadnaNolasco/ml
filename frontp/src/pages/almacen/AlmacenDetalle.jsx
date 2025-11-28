import React from "react";
import { Descriptions, Tag, Spin, Card } from "antd";
import { ShopOutlined, TagOutlined, AppstoreOutlined } from "@ant-design/icons";

const AlmacenDetalle = ({ almacen }) => {
  if (!almacen) {
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

  return (
    <Card>
      <Descriptions column={1} bordered>
        <Descriptions.Item label="ID">{almacen.id_alm}</Descriptions.Item>
        <Descriptions.Item label="Código">{almacen.codigo}</Descriptions.Item>
        <Descriptions.Item label="Nombre">{almacen.nombre}</Descriptions.Item>
        <Descriptions.Item label="Siglas">
          {almacen.siglas || "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Categoría">
          {almacen.categoria_nombre || "No asignada"}
        </Descriptions.Item>
        <Descriptions.Item label="Tipo de Almacén">
          <Tag color={almacen.tipo_alm === "INTERNO" ? "blue" : "green"}>
            {almacen.tipo_alm}
          </Tag>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

export default AlmacenDetalle;
