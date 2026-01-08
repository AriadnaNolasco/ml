// movimientosController.js
const db = require("../config/db"); 
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");


// helpers
const toDateStart = (d) => `${d} 00:00:00`;
const toDateEnd = (d) => `${d} 23:59:59`;

const safeUpper = (v) => (v == null ? null : String(v).trim().toUpperCase());

const movimientosController = {
  // =========================================================
  // GET /almacen/movimientos
  // Lista movimientos (sin detalle) con filtros opcionales
  // =========================================================
  listMovimientos: async (req, res) => {
    try {
      const {
        tipo,                 // INGRESO | SALIDA | AJUSTE
        documento_interno_id,
        cod_operacion,
        origen,
        id_nota,
        almacen_id,           // filtra si aparece en salida o destino (cabecera)
        fecha_desde,          // YYYY-MM-DD
        fecha_hasta,          // YYYY-MM-DD
        q,                    // búsqueda
        page = 1,
        pageSize = 20,
      } = req.query;

      const where = [];
      const params = [];

      const add = (sql, val) => {
        params.push(val);
        where.push(sql.replace("$$", `$${params.length}`));
      };

      if (tipo) add(`m.tipo_movimiento = $$`, String(tipo).toUpperCase());
      if (documento_interno_id) add(`m.documento_interno_id = $$`, Number(documento_interno_id));
      if (cod_operacion) add(`m.cod_operacion = $$`, Number(cod_operacion));
      if (origen) add(`m.origen = $$`, String(origen));
      if (id_nota) add(`m.id_nota = $$`, Number(id_nota));

      if (almacen_id) {
        params.push(Number(almacen_id));
        where.push(`(m.almacen_salida = $${params.length} OR m.almacen_destino = $${params.length})`);
      }

      if (fecha_desde) add(`m.fecha_movimiento >= $$::timestamp`, `${fecha_desde} 00:00:00`);
      if (fecha_hasta) add(`m.fecha_movimiento <= $$::timestamp`, `${fecha_hasta} 23:59:59`);

      if (q) {
        const qq = `%${String(q).trim()}%`;
        params.push(qq);
        where.push(`
          (
            CAST(m.id_movimiento AS TEXT) ILIKE $${params.length}
            OR COALESCE(m.numero_documento,'') ILIKE $${params.length}
            OR COALESCE(m.numero_guia,'') ILIKE $${params.length}
            OR COALESCE(m.serie,'') ILIKE $${params.length}
            OR COALESCE(d.nombre,'') ILIKE $${params.length}
          )
        `);
      }

      const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

      const limit = Math.min(Number(pageSize) || 20, 100);
      const offset = (Math.max(Number(page), 1) - 1) * limit;

      // TOTAL
      const countSql = `
        SELECT COUNT(*)::int AS total
        FROM almacen.movimientos m
        JOIN public.documentos d ON d.id_documento = m.documento_interno_id
        ${whereSql}
      `;
      const countRes = await db.query(countSql, params);

      // DATA
      const dataSql = `
        SELECT
          m.*,
          d.codigo AS documento_codigo,
          d.nombre AS documento_nombre,
          op.nombre AS operacion_nombre,
          alm_s.nombre AS almacen_salida_nombre,
          alm_d.nombre AS almacen_destino_nombre,
          c.razon_social AS cliente_nombre,
          p.razon_social AS proveedor_nombre,
          td.nombre AS tipo_documento_nombre
        FROM almacen.movimientos m
        JOIN public.documentos d ON d.id_documento = m.documento_interno_id
        JOIN public.cod_operacion op ON op.id_cod_operacion = m.cod_operacion
        LEFT JOIN almacen.almacenes alm_s ON alm_s.id_alm = m.almacen_salida
        LEFT JOIN almacen.almacenes alm_d ON alm_d.id_alm = m.almacen_destino
        LEFT JOIN ventas.clientes c ON c.id_cliente = m.cliente_id
        LEFT JOIN compras.proveedores p ON p.id_prov = m.proveedor_id
        LEFT JOIN public.tipo_documento td ON td.id_doc = m.tipo_documento_id
        ${whereSql}
        ORDER BY m.id_movimiento DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      const dataRes = await db.query(dataSql, params);

      return res.json({
        success: true,
        total: countRes.rows[0]?.total ?? 0,
        page: Number(page),
        pageSize: limit,
        data: dataRes.rows,
      });
    } catch (error) {
      console.error("listMovimientos error:", error);
      return res.status(500).json({
        success: false,
        message: "Error al listar movimientos",
        error: error.message,
      });
    }
  },

  // =========================================================
  // GET /almacen/movimientos/:id
  // Devuelve cabecera + detalle (con joins para mostrar nombres)
  // =========================================================
  getMovimientoById: async (req, res) => {
    try {
      const { id } = req.params;

      // CABECERA
      const cabSql = `
        SELECT
          m.*,
          d.codigo AS documento_codigo,
          d.nombre AS documento_nombre,
          op.nombre AS operacion_nombre,
          alm_s.nombre AS almacen_salida_nombre,
          alm_d.nombre AS almacen_destino_nombre,
          c.razon_social AS cliente_nombre,
          p.razon_social AS proveedor_nombre,
          td.nombre AS tipo_documento_nombre
        FROM almacen.movimientos m
        JOIN public.documentos d ON d.id_documento = m.documento_interno_id
        JOIN public.cod_operacion op ON op.id_cod_operacion = m.cod_operacion
        LEFT JOIN almacen.almacenes alm_s ON alm_s.id_alm = m.almacen_salida
        LEFT JOIN almacen.almacenes alm_d ON alm_d.id_alm = m.almacen_destino
        LEFT JOIN ventas.clientes c ON c.id_cliente = m.cliente_id
        LEFT JOIN compras.proveedores p ON p.id_prov = m.proveedor_id
        LEFT JOIN public.tipo_documento td ON td.id_doc = m.tipo_documento_id
        WHERE m.id_movimiento = $1
      `;

      const cabRes = await db.query(cabSql, [Number(id)]);

      if (!cabRes.rows.length) {
        return res.status(404).json({ success: false, message: "Movimiento no encontrado" });
      }

      const cabecera = cabRes.rows[0];

      // DETALLE
      const detSql = `
        SELECT
          md.*,
          a.nombre AS almacen_nombre,
          pr.codigo AS producto_codigo,
          pr.descripcion AS producto_descripcion
        FROM almacen.movimientos_detalle md
        JOIN almacen.almacenes a ON a.id_alm = md.almacen_id
        JOIN almacen.productos pr ON pr.id_producto = md.id_producto
        WHERE md.id_movimiento = $1
        ORDER BY md.id_detalle ASC
      `;

      const detRes = await db.query(detSql, [Number(id)]);

      return res.json({
        success: true,
        cabecera,
        detalle: detRes.rows,
      });
    } catch (error) {
      console.error("getMovimientoById error:", error);
      return res.status(500).json({
        success: false,
        message: "Error al obtener movimiento",
        error: error.message,
      });
    }
  },


  // =========================================================
  // GET /almacen/movimientos/por-nota/:id_nota
  // Devuelve movimiento asociado a una nota + detalle
  // =========================================================
  getMovimientoByNotaId: async (req, res) => {
    try {
      const { id_nota } = req.params;

      const movRes = await db.query(
        `SELECT id_movimiento FROM almacen.movimientos WHERE id_nota = $1`,
        [Number(id_nota)]
      );

      if (!movRes.rows.length) {
        return res.status(404).json({
          success: false,
          message: "No existe movimiento asociado a esta nota",
        });
      }

      const idMovimiento = movRes.rows[0].id_movimiento;

      // reutiliza el endpoint por ID internamente
      req.params.id = idMovimiento;
      return movimientosController.getMovimientoById(req, res);
    } catch (error) {
      console.error("getMovimientoByNotaId error:", error);
      return res.status(500).json({
        success: false,
        message: "Error al obtener movimiento por nota",
        error: error.message,
      });
    }
  },


// =========================================================
// GET /almacen/movimientos/reportes/kardex-producto
// Params:
//  - id_producto (requerido)
//  - almacen_id (opcional)
//  - desde / hasta (YYYY-MM-DD opcional)
//  - tipo_movimiento (INGRESO|SALIDA|AJUSTE|TRANSFERENCIA opcional)
//  - export=pdf|excel
// =========================================================
reporteKardexProducto : async (req, res) => {
  try {
    const { id_producto, almacen_id, desde, hasta, tipo_movimiento } = req.query;

    if (!id_producto) {
      return res.status(400).json({ success: false, message: "id_producto es requerido" });
    }

    const where = [];
    const params = [];

    const add = (sql, val) => {
      params.push(val);
      where.push(sql.replace("$$", `$${params.length}`));
    };

    add(`md.id_producto = $$`, Number(id_producto));

    if (almacen_id) add(`md.almacen_id = $$`, Number(almacen_id));
    if (tipo_movimiento) add(`m.tipo_movimiento = $$`, safeUpper(tipo_movimiento));
    if (desde) add(`m.fecha_movimiento >= $$::timestamp`, toDateStart(desde));
    if (hasta) add(`m.fecha_movimiento <= $$::timestamp`, toDateEnd(hasta));

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const sql = `
      SELECT
        m.id_movimiento,
        m.fecha_movimiento,
        m.tipo_movimiento,
        m.id_nota,
        d.codigo AS documento_codigo,
        m.documento_interno_id,
        op.codigo AS operacion_codigo,
        op.nombre AS operacion_nombre,
        m.origen,
        alm.nombre AS almacen_nombre,
        md.almacen_id,
        p.codigo AS producto_codigo,
        p.descripcion AS producto_descripcion,
        md.unidad_medida,
        md.cantidad,
        md.stock_actual,
        md.stock_resultante,
        md.lote,
        md.serie_producto,
        md.fecha_vencimiento
      FROM almacen.movimientos_detalle md
      JOIN almacen.movimientos m ON m.id_movimiento = md.id_movimiento
      JOIN almacen.productos p ON p.id_producto = md.id_producto
      LEFT JOIN almacen.almacenes alm ON alm.id_alm = md.almacen_id
      JOIN public.documentos d ON d.id_documento = m.documento_interno_id
      JOIN public.cod_operacion op ON op.id_cod_operacion = m.cod_operacion
      ${whereSql}
      ORDER BY m.fecha_movimiento ASC, m.id_movimiento ASC
    `;

    const r = await db.query(sql, params);
    const rows = r.rows || [];

    // Totales simples
    const totalIngreso = rows
      .filter((x) => x.tipo_movimiento === "INGRESO")
      .reduce((a, x) => a + Number(x.cantidad || 0), 0);
    const totalSalida = rows
      .filter((x) => x.tipo_movimiento === "SALIDA")
      .reduce((a, x) => a + Number(x.cantidad || 0), 0);

    if (wantsExcel(req)) {
      return sendExcel(
        res,
        "kardex_producto",
        "Kardex por Producto",
        [
          { header: "Fecha", key: "fecha_movimiento", width: 20 },
          { header: "Tipo", key: "tipo_movimiento", width: 14 },
          { header: "Doc", key: "documento_codigo", width: 10 },
          { header: "Op", key: "operacion_nombre", width: 28 },
          { header: "Origen", key: "origen", width: 12 },
          { header: "Almacén", key: "almacen_nombre", width: 18 },
          { header: "Producto", key: "producto_descripcion", width: 35 },
          { header: "UM", key: "unidad_medida", width: 10 },
          { header: "Cantidad", key: "cantidad", width: 12 },
          { header: "Stock Actual", key: "stock_actual", width: 14 },
          { header: "Stock Result.", key: "stock_resultante", width: 14 },
          { header: "Lote", key: "lote", width: 14 },
          { header: "Serie", key: "serie_producto", width: 14 },
        ],
        rows
      );
    }

    if (wantsPDF(req)) {
      // Obtener nombre del producto para el subtítulo
      const productoNombre = rows.length > 0 ? rows[0].producto_descripcion : 'N/A';
      
      return sendSimplePDF(
        res,
        "kardex_producto",
        "Kardex por Producto",
        productoNombre,
        [
          { label: "Fecha", key: "fecha_movimiento", w: 2 },
          { label: "Tipo", key: "tipo_movimiento", w: 1 },
          { label: "Op", key: "operacion_codigo", w: 1 },
          { label: "Alm", key: "almacen_nombre", w: 1 },
          { label: "Cant", key: "cantidad", w: 1 },
          { label: "Stock", key: "stock_resultante", w: 1 },
        ],
        rows,
        {
          filters: [
            desde ? `Desde: ${desde}` : null,
            hasta ? `Hasta: ${hasta}` : null,
            `Ingreso: ${totalIngreso.toFixed(3)}`,
            `Salida: ${totalSalida.toFixed(3)}`
          ].filter(Boolean)
        }
      );
    }

    return res.json({
      success: true,
      totals: { ingreso: totalIngreso, salida: totalSalida },
      data: rows,
    });
  } catch (error) {
    console.error("reporteKardexProducto error:", error);
    return res.status(500).json({ success: false, message: "Error kardex producto", error: error.message });
  }
},

// =========================================================
// GET /almacen/movimientos/reportes/stock-almacen
// Params:
//  - almacen_id (opcional)
//  - q (opcional: codigo/descripcion)
//  - id_categoria (opcional)
//  - bajo_stock (true/false)
//  - export=pdf|excel
// =========================================================
reporteStockAlmacen : async (req, res) => {
  try {
    const { almacen_id, q, id_categoria, bajo_stock } = req.query;

    const where = [];
    const params = [];
    const add = (sql, val) => {
      params.push(val);
      where.push(sql.replace("$$", `$${params.length}`));
    };

    if (almacen_id) add(`sa.almacen_id = $$`, Number(almacen_id));
    if (id_categoria) add(`p.id_categoria = $$`, Number(id_categoria));

    if (q && String(q).trim()) {
      const like = `%${String(q).trim()}%`;
      params.push(like);
      where.push(`(p.codigo ILIKE $${params.length} OR p.descripcion ILIKE $${params.length})`);
    }

    if (String(bajo_stock).toLowerCase() === "true") {
      where.push(`sa.stock <= COALESCE(p.stock_minimo,0)`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const sql = `
      SELECT
        sa.almacen_id,
        a.nombre AS almacen_nombre,
        sa.id_producto,
        p.codigo AS producto_codigo,
        p.descripcion AS producto_descripcion,
        p.stock_minimo,
        p.stock_maximo,
        sa.stock,
        sa.actualizado_en
      FROM almacen.stock_almacen sa
      JOIN almacen.almacenes a ON a.id_alm = sa.almacen_id
      JOIN almacen.productos p ON p.id_producto = sa.id_producto
      ${whereSql}
      ORDER BY a.nombre ASC, p.descripcion ASC
    `;

    const r = await db.query(sql, params);
    const rows = r.rows || [];

    if (wantsExcel(req)) {
      return sendExcel(
        res,
        "stock_por_almacen",
        "Stock Actual por Almacén",
        [
          { header: "Almacén", key: "almacen_nombre", width: 22 },
          { header: "Código", key: "producto_codigo", width: 14 },
          { header: "Producto", key: "producto_descripcion", width: 40 },
          { header: "Stock", key: "stock", width: 12 },
          { header: "Mínimo", key: "stock_minimo", width: 12 },
          { header: "Máximo", key: "stock_maximo", width: 12 },
          { header: "Actualizado", key: "actualizado_en", width: 22 },
        ],
        rows
      );
    }

    if (wantsPDF(req)) {
      // Obtener nombre del almacén si se filtró por uno específico
      let almacenNombre = 'Todos los almacenes';
      if (almacen_id && rows.length > 0) {
        almacenNombre = rows[0].almacen_nombre;
      }
      
      return sendSimplePDF(
        res,
        "stock_por_almacen",
        "Stock Actual por Almacén",
        almacenNombre,
        [
          { label: "Almacén", key: "almacen_nombre", w: 2 },
          { label: "Código", key: "producto_codigo", w: 1 },
          { label: "Producto", key: "producto_descripcion", w: 3 },
          { label: "Stock", key: "stock", w: 1 },
          { label: "Min", key: "stock_minimo", w: 1 },
        ],
        rows,
        {
          filters: [
            bajo_stock === 'true' ? 'Bajo stock: Sí' : null
          ].filter(Boolean)
        }
      );
    }

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("reporteStockAlmacen error:", error);
    return res.status(500).json({ success: false, message: "Error stock almacén", error: error.message });
  }
},

// =========================================================
// GET /almacen/movimientos/reportes/resumen-entradas-salidas
// Params:
//  - desde / hasta (YYYY-MM-DD opcional)
//  - almacen_id (opcional) => por detalle md.almacen_id
//  - groupBy: day|month (default day)
//  - export=pdf|excel
// =========================================================
reporteEntradasVsSalidas : async (req, res) => {
  try {
    const { desde, hasta, almacen_id, groupBy } = req.query;

    const g = String(groupBy || "day").toLowerCase() === "month" ? "month" : "day";

    const where = [];
    const params = [];
    const add = (sql, val) => {
      params.push(val);
      where.push(sql.replace("$$", `$${params.length}`));
    };

    if (desde) add(`m.fecha_movimiento >= $$::timestamp`, toDateStart(desde));
    if (hasta) add(`m.fecha_movimiento <= $$::timestamp`, toDateEnd(hasta));
    if (almacen_id) add(`md.almacen_id = $$`, Number(almacen_id));

    // solo ingreso/salida
    where.push(`m.tipo_movimiento IN ('INGRESO','SALIDA')`);

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const sql = `
      SELECT
        date_trunc('${g}', m.fecha_movimiento)::date AS periodo,
        SUM(CASE WHEN m.tipo_movimiento = 'INGRESO' THEN md.cantidad ELSE 0 END) AS total_ingreso,
        SUM(CASE WHEN m.tipo_movimiento = 'SALIDA' THEN md.cantidad ELSE 0 END) AS total_salida
      FROM almacen.movimientos m
      JOIN almacen.movimientos_detalle md ON md.id_movimiento = m.id_movimiento
      ${whereSql}
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    const r = await db.query(sql, params);
    const rows = r.rows || [];

    if (wantsExcel(req)) {
      return sendExcel(
        res,
        "resumen_entradas_salidas",
        "Resumen Entradas vs Salidas",
        [
          { header: "Periodo", key: "periodo", width: 14 },
          { header: "Total Ingreso", key: "total_ingreso", width: 16 },
          { header: "Total Salida", key: "total_salida", width: 16 },
        ],
        rows
      );
    }

    if (wantsPDF(req)) {
      return sendSimplePDF(
        res,
        "resumen_entradas_salidas",
        "Entradas vs Salidas",
        `Agrupado por ${g === 'month' ? 'mes' : 'día'}`,
        [
          { label: "Periodo", key: "periodo", w: 2 },
          { label: "Ingreso", key: "total_ingreso", w: 1 },
          { label: "Salida", key: "total_salida", w: 1 },
        ],
        rows,
        {
          filters: [
            desde ? `Desde: ${desde}` : null,
            hasta ? `Hasta: ${hasta}` : null
          ].filter(Boolean)
        }
      );
    }

    return res.json({ success: true, groupBy: g, data: rows });
  } catch (error) {
    console.error("reporteEntradasVsSalidas error:", error);
    return res.status(500).json({ success: false, message: "Error entradas vs salidas", error: error.message });
  }
},

// =========================================================
// GET /almacen/movimientos/reportes/transferencias
// Soporta 2 diseños:
//  A) tipo_movimiento='TRANSFERENCIA' (1 movimiento)
//  B) 2 movimientos enlazados por transferencia_id (SALIDA + INGRESO)
// Params:
//  - desde / hasta (YYYY-MM-DD opcional)
//  - almacen_salida (opcional)
//  - almacen_destino (opcional)
//  - id_producto (opcional)
//  - export=pdf|excel
// =========================================================
reporteTransferencias : async (req, res) => {
  try {
    const { desde, hasta, almacen_salida, almacen_destino, id_producto } = req.query;

    const where = [];
    const params = [];
    const add = (sql, val) => {
      params.push(val);
      where.push(sql.replace("$$", `$${params.length}`));
    };

    if (desde) add(`m.fecha_movimiento >= $$::timestamp`, toDateStart(desde));
    if (hasta) add(`m.fecha_movimiento <= $$::timestamp`, toDateEnd(hasta));
    if (almacen_salida) add(`m.almacen_salida = $$`, Number(almacen_salida));
    if (almacen_destino) add(`m.almacen_destino = $$`, Number(almacen_destino));
    if (id_producto) add(`md.id_producto = $$`, Number(id_producto));

    // detecta transferencias por cualquiera de las 2 formas
    where.push(`(
      m.tipo_movimiento = 'TRANSFERENCIA'
      OR m.transferencia_id IS NOT NULL
    )`);

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // Para diseño B (dos movimientos), agrupamos por transferencia_id si existe;
    // Si viene null (diseño A), agrupamos por id_movimiento.
    const sql = `
      SELECT
        COALESCE(m.transferencia_id::text, m.id_movimiento::text) AS transferencia_key,
        MIN(m.fecha_movimiento) AS fecha,
        MIN(alm_s.nombre) AS almacen_salida_nombre,
        MIN(alm_d.nombre) AS almacen_destino_nombre,
        p.codigo AS producto_codigo,
        p.descripcion AS producto_descripcion,
        SUM(md.cantidad) AS cantidad_total,
        COUNT(DISTINCT m.id_movimiento) AS movimientos_relacionados
      FROM almacen.movimientos m
      JOIN almacen.movimientos_detalle md ON md.id_movimiento = m.id_movimiento
      JOIN almacen.productos p ON p.id_producto = md.id_producto
      LEFT JOIN almacen.almacenes alm_s ON alm_s.id_alm = m.almacen_salida
      LEFT JOIN almacen.almacenes alm_d ON alm_d.id_alm = m.almacen_destino
      ${whereSql}
      GROUP BY 1, p.codigo, p.descripcion
      ORDER BY fecha ASC
    `;

    const r = await db.query(sql, params);
    const rows = r.rows || [];

    if (wantsExcel(req)) {
      return sendExcel(
        res,
        "transferencias",
        "Transferencias",
        [
          { header: "Transferencia", key: "transferencia_key", width: 16 },
          { header: "Fecha", key: "fecha", width: 20 },
          { header: "Alm Salida", key: "almacen_salida_nombre", width: 20 },
          { header: "Alm Destino", key: "almacen_destino_nombre", width: 20 },
          { header: "Código", key: "producto_codigo", width: 14 },
          { header: "Producto", key: "producto_descripcion", width: 35 },
          { header: "Cantidad", key: "cantidad_total", width: 12 },
          { header: "Mov Rel.", key: "movimientos_relacionados", width: 10 },
        ],
        rows
      );
    }

    if (wantsPDF(req)) {
      return sendSimplePDF(
        res,
        "transferencias",
        "Transferencias Internas",
        "Movimientos entre almacenes",
        [
          { label: "Fecha", key: "fecha", w: 2 },
          { label: "Salida", key: "almacen_salida_nombre", w: 2 },
          { label: "Destino", key: "almacen_destino_nombre", w: 2 },
          { label: "Cant", key: "cantidad_total", w: 1 },
        ],
        rows,
        {
          filters: [
            desde ? `Desde: ${desde}` : null,
            hasta ? `Hasta: ${hasta}` : null
          ].filter(Boolean)
        }
      );
    }

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("reporteTransferencias error:", error);
    return res.status(500).json({ success: false, message: "Error transferencias", error: error.message });
  }
},

// =========================================================
// GET /almacen/movimientos/reportes/auditoria-notas
// Params:
//  - tipo (INGRESO|SALIDA|TRANSFERENCIA) => se filtra por prefijo doc (NI/NS/NT)
//  - estado (BORRADOR|CONFIRMADO|ANULADO)
//  - desde / hasta (YYYY-MM-DD) por fecha_nota
//  - usuario (id)
//  - export=pdf|excel
// =========================================================
reporteAuditoriaNotas : async (req, res) => {
  try {
    const { tipo, estado, desde, hasta, usuario } = req.query;

    const where = [];
    const params = [];
    const add = (sql, val) => {
      params.push(val);
      where.push(sql.replace("$$", `$${params.length}`));
    };

    if (estado) add(`n.estado = $$`, safeUpper(estado));
    if (usuario) add(`n.usuario_registro = $$`, Number(usuario));
    if (desde) add(`n.fecha_nota >= $$::timestamp`, toDateStart(desde));
    if (hasta) add(`n.fecha_nota <= $$::timestamp`, toDateEnd(hasta));

    if (tipo) {
      const t = safeUpper(tipo);
      if (t === "INGRESO") where.push(`d.codigo ILIKE 'NI%'`);
      if (t === "SALIDA") where.push(`d.codigo ILIKE 'NS%'`);
      if (t === "TRANSFERENCIA") where.push(`d.codigo ILIKE 'NT%'`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const sql = `
      SELECT
        n.id_nota,
        d.codigo AS documento_codigo,
        d.nombre AS documento_nombre,
        n.numero,
        n.estado,
        n.fecha_nota,
        op.codigo AS operacion_codigo,
        op.nombre AS operacion_nombre,
        n.origen,
        alm_s.nombre AS almacen_salida_nombre,
        alm_d.nombre AS almacen_destino_nombre,
        n.fecha_registro,
        n.fecha_modificacion,
        u.username AS usuario_registro_nombre,
        um.username AS usuario_modificacion_nombre,
        CASE
          WHEN n.fecha_modificacion IS NOT NULL THEN (n.fecha_modificacion - n.fecha_registro)
          ELSE (NOW() - n.fecha_registro)
        END AS tiempo_en_estado
      FROM almacen.notas n
      JOIN public.documentos d ON d.id_documento = n.documento_interno_id
      JOIN public.cod_operacion op ON op.id_cod_operacion = n.cod_operacion
      LEFT JOIN almacen.almacenes alm_s ON alm_s.id_alm = n.almacen_salida
      LEFT JOIN almacen.almacenes alm_d ON alm_d.id_alm = n.almacen_destino
      LEFT JOIN public.usuarios u ON u.id = n.usuario_registro
      LEFT JOIN public.usuarios um ON um.id = n.usuario_modificacion
      ${whereSql}
      ORDER BY n.fecha_nota DESC, n.id_nota DESC
    `;

    const r = await db.query(sql, params);
    const rows = r.rows || [];

    if (wantsExcel(req)) {
      return sendExcel(
        res,
        "auditoria_notas",
        "Auditoria de Notas",
        [
          { header: "Fecha", key: "fecha_nota", width: 20 },
          { header: "Documento", key: "documento_codigo", width: 10 },
          { header: "Número", key: "numero", width: 14 },
          { header: "Estado", key: "estado", width: 12 },
          { header: "Operación", key: "operacion_nombre", width: 28 },
          { header: "Origen", key: "origen", width: 12 },
          { header: "Alm Salida", key: "almacen_salida_nombre", width: 18 },
          { header: "Alm Destino", key: "almacen_destino_nombre", width: 18 },
          { header: "User Reg.", key: "usuario_registro_nombre", width: 14 },
          { header: "User Mod.", key: "usuario_modificacion_nombre", width: 14 },
        ],
        rows
      );
    }

    if (wantsPDF(req)) {
      const tipoLabel = tipo ? tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase() : 'Todas';
      const estadoLabel = estado ? estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase() : 'Todos';
      
      return sendSimplePDF(
        res,
        "auditoria_notas",
        "Auditoría de Notas",
        "Seguimiento de movimientos",
        [
          { label: "Fecha", key: "fecha_nota", w: 1.5 },
          { label: "Doc", key: "documento_codigo", w: 0.7 },
          { label: "Nro", key: "numero", w: 1 },
          { label: "Estado", key: "estado", w: 1 },
          { label: "Operación", key: "operacion_nombre", w: 2 },
          { label: "Usuario", key: "usuario_registro_nombre", w: 1.5 },
        ],
        rows,
        {
          filters: [
            `Tipo: ${tipoLabel}`,
            `Estado: ${estadoLabel}`,
            desde ? `Desde: ${desde}` : null,
            hasta ? `Hasta: ${hasta}` : null
          ].filter(Boolean)
        }
      );
    }

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("reporteAuditoriaNotas error:", error);
    return res.status(500).json({ success: false, message: "Error auditoría notas", error: error.message });
  }
},

};


module.exports = movimientosController;

// ========================================
// HELPERS
// ========================================

function wantsPDF(req) {
  return String(req.query.export || "").toLowerCase() === "pdf";
}

function wantsExcel(req) {
  return String(req.query.export || "").toLowerCase() === "excel";
}

function nowLimaString() {
  const d = new Date();
  const offsetMinutes = -5 * 60;
  const localTime = new Date(d.getTime() + offsetMinutes * 60000);
  return localTime.toISOString().slice(0, 19).replace("T", " ");
}

async function sendExcel(res, filename, title, columns, rows) {
  const ExcelJS = require("exceljs");
  const fs = require("fs");
  const path = require("path");

  const wb = new ExcelJS.Workbook();
  wb.creator = "Radiadores Fortaleza S.A.";
  wb.created = new Date();

  const ws = wb.addWorksheet(title);

  const company = "Radiadores Fortaleza S.A.";
  const generado = `Generado: ${nowLimaString()}`;

  // Configurar anchos de columnas primero
  ws.columns = columns.map((c) => ({ width: c.width || 14 }));

  // Agregar logo
  const logoPath = path.join(__dirname, "../assets/RF.png");
  try {
    if (fs.existsSync(logoPath)) {
      const logoImage = fs.readFileSync(logoPath);
      const logoId = wb.addImage({
        buffer: logoImage,
        extension: 'png',
      });
      
      // Insertar logo en la esquina superior izquierda (A1:B2)
      ws.addImage(logoId, {
        tl: { col: 0, row: 0 },
        ext: { width: 180, height: 60 }
      });
    }
  } catch (e) {
    console.error("Error al cargar logo:", e);
  }

  // Título (Fila 1) - Merge desde columna C en adelante para dejar espacio al logo
  const titleStartCol = 3; // Columna C (0-based: 2, pero merge usa 1-based)
  ws.mergeCells(1, titleStartCol, 1, Math.max(titleStartCol, columns.length));
  const titleCell = ws.getCell(1, titleStartCol);
  titleCell.value = title;
  titleCell.font = { size: 18, bold: true, color: { argb: "FF1F2937" } };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  ws.getRow(1).height = 32;

  // Subtítulo (Fila 2)
  ws.mergeCells(2, titleStartCol, 2, Math.max(titleStartCol, columns.length));
  const subtitleCell = ws.getCell(2, titleStartCol);
  subtitleCell.value = `${company}     ${generado}`;
  subtitleCell.font = { size: 10, color: { argb: "FF6B7280" } };
  subtitleCell.alignment = { vertical: "middle", horizontal: "center" };
  ws.getRow(2).height = 20;

  // Fila 3 vacía
  ws.getRow(3).height = 10;

  // Headers (Fila 4)
  const headerRowIndex = 4;
  const headerRow = ws.getRow(headerRowIndex);
  
  columns.forEach((col, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = col.header;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF525252" },
    };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = {
      top: { style: "medium", color: { argb: "FF525252" } },
      left: { style: "medium", color: { argb: "FF525252" } },
      bottom: { style: "medium", color: { argb: "FF525252" } },
      right: { style: "medium", color: { argb: "FF525252" } },
    };
  });
  headerRow.height = 22;

  // Data (desde fila 5)
  rows.forEach((rowData, index) => {
    const rowNumber = headerRowIndex + 1 + index;
    const row = ws.getRow(rowNumber);
    
    columns.forEach((col, colIndex) => {
      const cell = row.getCell(colIndex + 1);
      cell.value = rowData[col.key];
    });
    
    // Aplicar estilo zebra
    const zebra = index % 2 === 0;
    
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { size: 10, color: { argb: "FF111827" } };
      cell.alignment = { vertical: "middle", horizontal: "left" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: zebra ? "FFF5F5F5" : "FFFFFFFF" },
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE5E5E5" } },
        left: { style: "thin", color: { argb: "FFE5E5E5" } },
        bottom: { style: "thin", color: { argb: "FFE5E5E5" } },
        right: { style: "thin", color: { argb: "FFE5E5E5" } },
      };
    });
    row.height = 18;
  });

  // Autofilter en fila de headers
  ws.autoFilter = {
    from: { row: headerRowIndex, column: 1 },
    to: { row: headerRowIndex, column: columns.length },
  };
  
  // Freeze panes (congelar título y headers)
  ws.views = [{ 
    state: "frozen", 
    xSplit: 0, 
    ySplit: headerRowIndex, 
    showGridLines: false 
  }];

  // Footer impresión
  ws.headerFooter.oddFooter = `&L${company}&R${generado}`;

  // Respuesta
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.xlsx"`);

  await wb.xlsx.write(res);
  res.end();
}

function sendSimplePDF(res, filename, title, subtitle, columns, rows, opts = {}) {
  const PDFDocument = require("pdfkit");

  const manyCols = (columns?.length || 0) > 6;
  const doc = new PDFDocument({
    margin: 36,
    size: "A4",
    layout: manyCols ? "landscape" : "portrait",
    bufferPages: true,
  });

  const company = opts.companyName || "Radiadores Fortaleza S.A.";
  const generado = `Generado: ${nowLimaString()}`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.pdf"`);

  doc.pipe(res);

  const pageW = () => doc.page.width;
  const pageH = () => doc.page.height;
  const left = () => doc.page.margins.left;
  const right = () => doc.page.margins.right;
  const top = () => doc.page.margins.top;
  const bottom = () => doc.page.margins.bottom;

  const usableW = () => pageW() - left() - right();

  // layout
  const headerH = 90; // Aumentado para mejor espaciado
  const footerH = 22;
  const tableTopY = () => top() + headerH;
  const tableBottomY = () => pageH() - bottom() - footerH;

  const totalW = columns.reduce((a, c) => a + (c.w || 1), 0);

  function buildColXs() {
    const xs = [];
    let x = left();
    columns.forEach((c) => {
      xs.push(x);
      x += usableW() * ((c.w || 1) / totalW);
    });
    return xs;
  }

  function formatVal(v, key) {
    if (v == null) return "";
    const k = String(key || "").toLowerCase();
    if (k.includes("fecha") || k.includes("actualizado")) {
      const d = new Date(v);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 19).replace("T", " ");
    }
    if (typeof v === "number") return String(v);
    return String(v);
  }

  function drawHeader() {
    const path = require("path");
    const logoPath = path.join(__dirname, "../assets/RF.png");

    // Colores
    const red = "#C4161C";
    const darkText = "#111827";
    const mutedText = "#6B7280";
    const lightBorder = "#E5E5E5";

    const x0 = left();
    const y0 = top() - 6;
    const w = usableW();
    const h = headerH;

    // Fondo blanco con barra roja
    doc.save();
    doc.rect(x0, y0, w, h).fill("white");
    doc.rect(x0, y0, w, 5).fill(red);
    doc.moveTo(x0, y0 + h).lineTo(x0 + w, y0 + h).stroke(lightBorder);

    // Dimensiones de cajas
    const logoBoxW = 130;
    const metaBoxW = 180;
    const centerBoxW = w - logoBoxW - metaBoxW;

    const padX = 14;
    const contentY = y0 + 18;

    // Logo izquierda
    const logoX = x0 + padX;
    const logoY = contentY;
    try {
      doc.image(logoPath, logoX, logoY, {
        fit: [logoBoxW - 20, 40],
        align: "left",
        valign: "center",
      });
    } catch (e) {}

    // Centro - Título y subtítulo
    const centerX = x0 + padX + logoBoxW;
    
    // Título principal
    doc.fillColor(darkText).font("Helvetica-Bold").fontSize(14);
    doc.text(title, centerX, contentY + 6, { 
      width: centerBoxW - 20, 
      align: "left",
      ellipsis: true 
    });

    // Subtítulo en línea separada con más espacio
    doc.fillColor(mutedText).font("Helvetica").fontSize(10);
    doc.text(subtitle, centerX, contentY + 24, { 
      width: centerBoxW - 20, 
      align: "left",
      ellipsis: true 
    });

    // Filtros adicionales si existen (en línea separada)
    if (opts.filters && opts.filters.length > 0) {
      const filtersText = opts.filters.join(' • ');
      doc.fillColor(mutedText).font("Helvetica").fontSize(8);
      doc.text(filtersText, centerX, contentY + 40, { 
        width: centerBoxW - 20, 
        align: "left",
        ellipsis: true 
      });
    }

    // Derecha - Fecha de generación
    const metaX = x0 + w - padX - metaBoxW;
    doc.fillColor(mutedText).font("Helvetica").fontSize(9);
    doc.text(generado, metaX, contentY + 8, { 
      width: metaBoxW, 
      align: "right" 
    });

    doc.restore();
  }

  function drawFooter(pageNumber, pageCount) {
    doc.save();
    doc.font("Helvetica").fontSize(8).fillColor("#6B7280");
    doc.text(`${company}`, left(), pageH() - bottom() - 14, { width: usableW(), align: "left" });
    doc.text(`Página ${pageNumber} / ${pageCount}`, left(), pageH() - bottom() - 14, { width: usableW(), align: "right" });
    doc.restore();
  }

  function drawTableHeader(colXs, y) {
    doc.save();
    doc.rect(left(), y, usableW(), 18).fill("#525252");
    doc.fillColor("white").font("Helvetica-Bold").fontSize(8.5);

    columns.forEach((c, i) => {
      const x = colXs[i] + 4;
      const w = (i === columns.length - 1)
        ? (left() + usableW() - colXs[i]) - 8
        : (colXs[i + 1] - colXs[i]) - 8;

      doc.text(String(c.label ?? ""), x, y + 5, { width: w, ellipsis: true });
    });

    doc.restore();
    doc.moveTo(left(), y + 18).lineTo(left() + usableW(), y + 18).stroke("#D4D4D4");
  }

  function drawRow(colXs, y, rowObj, rowIndex) {
    const rowH = 16;

    // zebra
    if (rowIndex % 2 === 0) {
      doc.save();
      doc.rect(left(), y, usableW(), rowH).fill("#F5F5F5");
      doc.restore();
    }

    doc.fillColor("#111827").font("Helvetica").fontSize(8);

    columns.forEach((c, i) => {
      const x = colXs[i] + 4;
      const w = (i === columns.length - 1)
        ? (left() + usableW() - colXs[i]) - 8
        : (colXs[i + 1] - colXs[i]) - 8;

      const val = formatVal(rowObj?.[c.key], c.key);

      doc.text(val, x, y + 4, {
        width: w,
        height: rowH,
        ellipsis: true,
      });
    });

    // línea inferior suave
    doc.save();
    doc.moveTo(left(), y + rowH).lineTo(left() + usableW(), y + rowH).stroke("#E5E5E5");
    doc.restore();

    return rowH;
  }

  // Render
  const colXs = buildColXs();

  drawHeader();
  let y = tableTopY();
  drawTableHeader(colXs, y);
  y += 18;

  for (let i = 0; i < rows.length; i++) {
    if (y + 16 > tableBottomY()) {
      doc.addPage();
      drawHeader();
      y = tableTopY();
      drawTableHeader(colXs, y);
      y += 18;
    }
    y += drawRow(colXs, y, rows[i], i);
  }

  // Paginación
  const range = doc.bufferedPageRange(); // { start, count }
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    drawFooter(i + 1, range.count);
  }

  doc.end();
}
