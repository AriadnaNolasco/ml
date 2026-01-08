const db = require("../config/db");

const stockAlmacenController = {
  /**
   * GET /almacen/stock-almacen/productos?almacen_id=1&solo_con_stock=1&search=...
   * Devuelve productos del almacén con stock (por almacén).
   */
  listProductosPorAlmacen: async (req, res) => {
    try {
      const almacen_id = Number(req.query.almacen_id);
      const soloConStock = String(req.query.solo_con_stock ?? "1") === "1";
      const search = (req.query.search || "").trim();

      if (!almacen_id) {
        return res.status(400).json({
          success: false,
          message: "almacen_id es requerido",
        });
      }

      const params = [almacen_id];
      let whereExtra = "";

      if (soloConStock) {
        whereExtra += ` AND sa.stock > 0 `;
      }

      if (search) {
        params.push(`%${search.toLowerCase()}%`);
        whereExtra += `
          AND (
            LOWER(p.codigo) LIKE $${params.length}
            OR LOWER(p.descripcion) LIKE $${params.length}
          )
        `;
      }

      const sql = `
        SELECT
          p.id_producto,
          p.codigo,
          p.descripcion,
          p.id_unidad,
          COALESCE(um.siglas, um.nombre, '') AS unidad_siglas,
          p.stock_minimo,
          p.stock_maximo,
          COALESCE(sa.stock, 0) AS stock_actual,
          sa.actualizado_en
        FROM almacen.stock_almacen sa
        INNER JOIN almacen.productos p ON p.id_producto = sa.id_producto
        LEFT JOIN public.unidades_medida um ON um.id_unidades = p.id_unidad
        WHERE sa.almacen_id = $1
          AND p.estado = true
          ${whereExtra}
        ORDER BY p.descripcion ASC
      `;

      const { rows } = await db.query(sql, params);

      return res.json({
        success: true,
        data: rows,
      });
    } catch (error) {
      console.error("listProductosPorAlmacen error:", error);
      return res.status(500).json({
        success: false,
        message: "Error al listar productos por almacén",
        error: error.message,
      });
    }
  },

  /**
   * GET /almacen/stock-almacen/:almacen_id/:id_producto
   * Devuelve el stock de un producto específico en un almacén.
   */
  getStockProducto: async (req, res) => {
    try {
      const almacen_id = Number(req.params.almacen_id);
      const id_producto = Number(req.params.id_producto);

      if (!almacen_id || !id_producto) {
        return res.status(400).json({
          success: false,
          message: "almacen_id e id_producto son requeridos",
        });
      }

      const sql = `
        SELECT
          sa.almacen_id,
          sa.id_producto,
          COALESCE(sa.stock, 0) AS stock
        FROM almacen.stock_almacen sa
        WHERE sa.almacen_id = $1
          AND sa.id_producto = $2
      `;

      const { rows } = await db.query(sql, [almacen_id, id_producto]);

      return res.json({
        success: true,
        data: rows[0] || { almacen_id, id_producto, stock: 0 },
      });
    } catch (error) {
      console.error("getStockProducto error:", error);
      return res.status(500).json({
        success: false,
        message: "Error al obtener stock del producto",
        error: error.message,
      });
    }
  },
};

module.exports = stockAlmacenController;
