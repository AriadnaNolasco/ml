import React from "react";
import { Descriptions, Tag, Divider } from "antd";

const ProductoDetalle = ({ producto }) => {
  if (!producto) {
    return <div>Producto no encontrado</div>;
  }

  const formatCurrency = (value, symbol = null) => {
    if (value === null || value === undefined) return "N/A";
    const sym = symbol || producto.moneda_simbolo || "S/";
    return `${sym} ${Number(value).toFixed(2)}`;
  };

  const formatStock = (value) => {
    if (value === null || value === undefined) return "N/A";
    return Number(value).toFixed(3);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-PE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStockColor = (actual, minimo, maximo) => {
    const stockNum = Number(actual || 0);
    const stockMin = Number(minimo || 0);
    const stockMax = Number(maximo || 0);

    if (stockNum <= stockMin) return "#ff4d4f";
    if (stockNum >= stockMax) return "#faad14";
    return "#52c41a";
  };

  return (
    <>
      {/* Información Básica */}
      <Descriptions bordered column={2} size='small'>
        <Descriptions.Item label='Código'>{producto.codigo}</Descriptions.Item>
        <Descriptions.Item label='Código de Barras'>
          {producto.codigo_barras || "N/A"}
        </Descriptions.Item>

        <Descriptions.Item label='Descripción' span={2}>
          <strong>{producto.descripcion}</strong>
        </Descriptions.Item>

        <Descriptions.Item label='Categoría'>
          {producto.categoria_nombre || producto.categoria || "N/A"}
          {producto.categoria_codigo && ` [${producto.categoria_codigo}]`}
        </Descriptions.Item>
        <Descriptions.Item label='Unidad de Medida'>
          {producto.unidad_medida_nombre || producto.unidad_medida || "N/A"}
          {(producto.unidad_medida_siglas || producto.unidad_siglas) &&
            ` (${producto.unidad_medida_siglas || producto.unidad_siglas})`}
        </Descriptions.Item>

        <Descriptions.Item label='División Mercadería'>
          {producto.division_mercaderia_nombre ||
            producto.division_mercaderia ||
            "N/A"}
          {producto.division_mercaderia_codigo &&
            ` [${producto.division_mercaderia_codigo}]`}
        </Descriptions.Item>
        <Descriptions.Item label='Procedencia'>
          <Tag color={producto.procedencia === "NACIONAL" ? "green" : "blue"}>
            {producto.procedencia || "N/A"}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label='Moneda'>
          {producto.moneda_nombre || "N/A"}
          {producto.moneda_simbolo && ` (${producto.moneda_simbolo})`}
        </Descriptions.Item>
        <Descriptions.Item label='Centro de Costo'>
          {producto.centro_costo_nombre || producto.centro_costo || "N/A"}
        </Descriptions.Item>
      </Descriptions>

      {/* Información Económica */}
      <Divider orientation='left'>Información Económica</Divider>

      <Descriptions bordered column={3} size='small'>
        <Descriptions.Item label='Precio Unitario'>
          <strong style={{ color: "#1890ff" }}>
            {formatCurrency(producto.precio_unitario)}
          </strong>
        </Descriptions.Item>

        <Descriptions.Item label='Precio Fabricación'>
          <strong style={{ color: "#722ed1" }}>
            {formatCurrency(producto.precio_fabricacion)}
          </strong>
        </Descriptions.Item>

        <Descriptions.Item label='Precio de Venta'>
          <strong style={{ color: "#52c41a" }}>
            {formatCurrency(producto.precio_venta)}
          </strong>
        </Descriptions.Item>

        <Descriptions.Item label='Precio Total'>
          <strong>{formatCurrency(producto.precio_total)}</strong>
        </Descriptions.Item>

        <Descriptions.Item label='Afecto IGV' span={2}>
          <Tag color={producto.afecto_igv ? "green" : "red"}>
            {producto.afecto_igv ? "SÍ" : "NO"}
          </Tag>
        </Descriptions.Item>

        {producto.precio_fabricacion > 0 && producto.precio_venta > 0 && (
          <Descriptions.Item label='Margen' span={3}>
            <span
              style={{
                color:
                  Number(producto.precio_venta) >=
                  Number(producto.precio_fabricacion)
                    ? "#52c41a"
                    : "#ff4d4f",
              }}
            >
              {(
                ((Number(producto.precio_venta) -
                  Number(producto.precio_fabricacion)) /
                  Number(producto.precio_venta)) *
                100
              ).toFixed(2)}
              %
            </span>
          </Descriptions.Item>
        )}
      </Descriptions>

      {/* Control de Stock */}
      <Divider orientation='left'>Control de Stock</Divider>

      <Descriptions bordered column={3} size='small'>
        <Descriptions.Item label='Stock Mínimo'>
          <span style={{ color: "#faad14" }}>
            {formatStock(producto.stock_minimo)}
          </span>
        </Descriptions.Item>
        <Descriptions.Item label='Stock Actual'>
          <span
            style={{
              color: getStockColor(
                producto.stock_actual,
                producto.stock_minimo,
                producto.stock_maximo
              ),
              fontWeight: "bold",
              fontSize: "16px",
            }}
          >
            {formatStock(producto.stock_actual)}
          </span>
        </Descriptions.Item>
        <Descriptions.Item label='Stock Máximo'>
          <span style={{ color: "#ff4d4f" }}>
            {formatStock(producto.stock_maximo)}
          </span>
        </Descriptions.Item>

        <Descriptions.Item label='Estado de Stock' span={3}>
          {(() => {
            const stockNum = Number(producto.stock_actual || 0);
            const stockMin = Number(producto.stock_minimo || 0);
            const stockMax = Number(producto.stock_maximo || 0);

            if (stockNum <= stockMin) {
              return <Tag color='red'>STOCK CRÍTICO - Requiere reposición</Tag>;
            }
            if (stockNum >= stockMax) {
              return <Tag color='orange'>STOCK ALTO - Revisar rotación</Tag>;
            }
            return <Tag color='green'>STOCK NORMAL</Tag>;
          })()}
        </Descriptions.Item>
      </Descriptions>

      {/* Información Adicional */}
      <Divider orientation='left'>Información Adicional</Divider>

      <Descriptions bordered column={2} size='small'>
        <Descriptions.Item label='Estado'>
          <Tag
            color={producto.estado ? "green" : "red"}
            style={{ fontSize: "14px" }}
          >
            {producto.estado ? "ACTIVO" : "INACTIVO"}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label='ID Producto'>
          <code>{producto.id_producto}</code>
        </Descriptions.Item>

        {producto.ubicacion && (
          <Descriptions.Item label='Ubicación' span={2}>
            <Tag color='blue'>{producto.ubicacion}</Tag>
          </Descriptions.Item>
        )}

        {producto.fecha && (
          <Descriptions.Item label='Fecha Registro' span={2}>
            {new Date(producto.fecha).toLocaleDateString("es-PE")}
          </Descriptions.Item>
        )}

        {producto.caracteristicas && (
          <Descriptions.Item label='Características' span={2}>
            <div
              style={{
                background: "#fafafa",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #d9d9d9",
              }}
            >
              {producto.caracteristicas}
            </div>
          </Descriptions.Item>
        )}
      </Descriptions>

      {/* Información de Auditoría */}
      <Divider orientation='left'>Información de Auditoría</Divider>

      <Descriptions bordered column={2} size='small'>
        <Descriptions.Item label='Creado Por'>
          <strong>{producto.creado_por_nombre || "N/A"}</strong>
        </Descriptions.Item>
        <Descriptions.Item label='Fecha Creación'>
          {formatDate(producto.created_at)}
        </Descriptions.Item>

        <Descriptions.Item label='Actualizado Por'>
          <strong>{producto.actualizado_por_nombre || "N/A"}</strong>
        </Descriptions.Item>
        <Descriptions.Item label='Última Actualización'>
          {formatDate(producto.updated_at)}
        </Descriptions.Item>
      </Descriptions>

      {/* Alertas importantes */}
      {Number(producto.stock_actual || 0) <=
        Number(producto.stock_minimo || 0) && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            background: "#fff2e8",
            border: "1px solid #ffbb96",
            borderRadius: "4px",
          }}
        >
          <strong style={{ color: "#d4380d" }}>⚠️ ALERTA:</strong> El stock
          actual está por debajo del mínimo establecido. Se requiere reposición
          inmediata.
        </div>
      )}

      {Number(producto.precio_venta || 0) > 0 &&
        Number(producto.precio_fabricacion || 0) > 0 &&
        Number(producto.precio_venta || 0) <
          Number(producto.precio_fabricacion || 0) && (
          <div
            style={{
              marginTop: "8px",
              padding: "12px",
              background: "#fff1f0",
              border: "1px solid #ffa39e",
              borderRadius: "4px",
            }}
          >
            <strong style={{ color: "#cf1322" }}>⚠️ ADVERTENCIA:</strong> El
            precio de venta es menor que el precio de fabricación. Revisar
            márgenes de rentabilidad.
          </div>
        )}
    </>
  );
};

export default ProductoDetalle;
