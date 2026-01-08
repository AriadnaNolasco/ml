import React from "react";
import { Descriptions, Tag, Spin, Card } from "antd";
import {
  AppstoreOutlined,
  TagOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

const CategoriaDetalle = ({ categoria }) => {
  if (!categoria) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "200px",
        }}
      >
        <Spin size='large' />
      </div>
    );
  }

  const getTagColor = (value, type) => {
    const colorMap = {
      ind_venta: {
        "SE VENDE": "green",
        SERVICIOS: "blue",
        "NO VENDIBLE": "default",
      },
      ind_critico: {
        CRITICO: "red",
        "NO CRITICO": "default",
      },
      ind_importacion: {
        "SE IMPORTA": "orange",
        "NO SE IMPORTA": "default",
      },
      ind_almac_x_compra: {
        "SI ING. ALMACEN": "green",
        "NO ING. ALMACEN": "default",
      },
    };

    return colorMap[type]?.[value] || "default";
  };

  return (
    <Card>
      <Descriptions column={1} bordered>
        <Descriptions.Item label='Código'>{categoria.codigo}</Descriptions.Item>
        <Descriptions.Item label='Nombre'>{categoria.nombre}</Descriptions.Item>
        <Descriptions.Item label='Siglas'>
          {categoria.siglas || "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label='Tipo de Existencia'>
          {categoria.tipo_existencia_nombre || "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label='Indicador Venta'>
          <Tag color={getTagColor(categoria.ind_venta, "ind_venta")}>
            {categoria.ind_venta}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label='Indicador Crítico'>
          <Tag color={getTagColor(categoria.ind_critico, "ind_critico")}>
            {categoria.ind_critico}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label='Indicador Importación'>
          <Tag
            color={getTagColor(categoria.ind_importacion, "ind_importacion")}
          >
            {categoria.ind_importacion}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label='Indicador Almacén por Compra'>
          <Tag
            color={getTagColor(
              categoria.ind_almac_x_compra,
              "ind_almac_x_compra"
            )}
          >
            {categoria.ind_almac_x_compra}
          </Tag>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

export default CategoriaDetalle;
