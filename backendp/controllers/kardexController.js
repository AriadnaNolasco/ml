// kardexController.js
const db = require("../config/db");
const ExcelJS = require("exceljs"); //npm i exceljs
const PDFDocument = require("pdfkit");

const kardexController = {
  // =========================================================
  // GET /almacen/kardex
  // - Si viene id_producto: Kardex real cronológico (ASC)
  // - Si NO viene id_producto: Feed de últimos movimientos (DESC)
  // =========================================================
  listKardex: async (req, res) => {
    try {
      const {
        id_producto,
        almacen_id,
        tipo_movimiento,
        documento_interno_id,
        cod_operacion,
        origen,
        fecha_desde,
        fecha_hasta,
        q,
        page = 1,
        pageSize = 20,
      } = req.query;

      const where = [];
      const params = [];

      const add = (sql, val) => {
        params.push(val);
        where.push(sql.replace("$$", `$${params.length}`));
      };

      const hasProducto = !!id_producto;

      // filtros base
      if (id_producto) add(`md.id_producto = $$`, Number(id_producto));
      if (almacen_id) add(`md.almacen_id = $$`, Number(almacen_id));

      if (tipo_movimiento) add(`m.tipo_movimiento = $$`, String(tipo_movimiento).toUpperCase());
      if (documento_interno_id) add(`m.documento_interno_id = $$`, Number(documento_interno_id));
      if (cod_operacion) add(`m.cod_operacion = $$`, Number(cod_operacion));
      if (origen) add(`m.origen = $$`, String(origen));

      if (fecha_desde) add(`m.fecha_movimiento >= $$::timestamp`, `${fecha_desde} 00:00:00`);
      if (fecha_hasta) add(`m.fecha_movimiento <= $$::timestamp`, `${fecha_hasta} 23:59:59`);

      if (q) {
        const qq = `%${String(q).trim()}%`;
        params.push(qq);
        const p = `$${params.length}`;

        where.push(`
          (
            COALESCE(d.codigo,'') ILIKE ${p}
            OR COALESCE(d.nombre,'') ILIKE ${p}
            OR COALESCE(op.nombre,'') ILIKE ${p}
            OR COALESCE(a.nombre,'') ILIKE ${p}
            OR COALESCE(pr.codigo,'') ILIKE ${p}
            OR COALESCE(pr.descripcion,'') ILIKE ${p}
            OR COALESCE(m.numero_documento,'') ILIKE ${p}
            OR COALESCE(m.numero_guia,'') ILIKE ${p}
            OR COALESCE(m.serie,'') ILIKE ${p}
            OR CAST(m.id_movimiento AS TEXT) ILIKE ${p}
          )
        `);
      }

      const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

      const limit = Math.min(Number(pageSize) || 20, 200);
      const offset = (Math.max(Number(page), 1) - 1) * limit;

      // ORDER ERP:
      // - Kardex por producto: ASC (histórico)
      // - Feed general: DESC (últimos primero)
      const orderBy = hasProducto
        ? "ORDER BY m.fecha_movimiento ASC, md.id_detalle ASC"
        : "ORDER BY m.fecha_movimiento DESC, md.id_detalle DESC";

      // TOTAL
      const countSql = `
        SELECT COUNT(*)::int AS total
        FROM almacen.movimientos_detalle md
        JOIN almacen.movimientos m ON m.id_movimiento = md.id_movimiento
        JOIN public.documentos d ON d.id_documento = m.documento_interno_id
        JOIN public.cod_operacion op ON op.id_cod_operacion = m.cod_operacion
        JOIN almacen.almacenes a ON a.id_alm = md.almacen_id
        JOIN almacen.productos pr ON pr.id_producto = md.id_producto
        ${whereSql}
      `;
      const countRes = await db.query(countSql, params);

      // DATA
      const dataSql = `
        SELECT
          md.id_detalle,
          m.id_movimiento,
          m.fecha_movimiento,
          m.tipo_movimiento,
          m.origen,

          m.documento_interno_id,
          d.codigo AS documento_codigo,
          d.nombre AS documento_nombre,

          m.cod_operacion,
          op.nombre AS operacion_nombre,

          md.almacen_id,
          a.nombre AS almacen_nombre,

          md.id_producto,
          pr.codigo AS producto_codigo,
          pr.descripcion AS producto_descripcion,
          md.unidad_medida,

          CASE WHEN m.tipo_movimiento = 'INGRESO' THEN md.cantidad ELSE 0 END AS entrada,
          CASE WHEN m.tipo_movimiento = 'SALIDA'  THEN md.cantidad ELSE 0 END AS salida,
          md.cantidad AS cantidad_mov,

          md.stock_actual,
          md.stock_resultante,

          m.id_nota,
          m.numero_documento,
          m.numero_guia,
          m.serie,
          md.lote,
          md.serie_producto,
          md.fecha_vencimiento,
          md.comentario
        FROM almacen.movimientos_detalle md
        JOIN almacen.movimientos m ON m.id_movimiento = md.id_movimiento
        JOIN public.documentos d ON d.id_documento = m.documento_interno_id
        JOIN public.cod_operacion op ON op.id_cod_operacion = m.cod_operacion
        JOIN almacen.almacenes a ON a.id_alm = md.almacen_id
        JOIN almacen.productos pr ON pr.id_producto = md.id_producto
        ${whereSql}
        ${orderBy}
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
      console.error("listKardex error:", error);
      return res.status(500).json({
        success: false,
        message: "Error al obtener kárdex",
        error: error.message,
      });
    }
  },

  // =========================================================
  // GET /almacen/kardex/resumen?id_producto=&almacen_id=
  // =========================================================
  resumenKardex: async (req, res) => {
    try {
      const { id_producto, almacen_id } = req.query;

      if (!id_producto) {
        return res.status(400).json({ success: false, message: "id_producto es requerido" });
      }

      const params = [Number(id_producto)];
      let whereAlm = "";

      if (almacen_id) {
        params.push(Number(almacen_id));
        whereAlm = `AND sa.almacen_id = $2`;
      }

      const stockSql = `
        SELECT
          sa.almacen_id,
          a.nombre AS almacen_nombre,
          sa.id_producto,
          p.codigo AS producto_codigo,
          p.descripcion AS producto_descripcion,
          sa.stock,
          sa.actualizado_en
        FROM almacen.stock_almacen sa
        JOIN almacen.almacenes a ON a.id_alm = sa.almacen_id
        JOIN almacen.productos p ON p.id_producto = sa.id_producto
        WHERE sa.id_producto = $1
        ${whereAlm}
        ORDER BY a.nombre
      `;
      const stockRes = await db.query(stockSql, params);

      const lastMovSql = `
        SELECT MAX(m.fecha_movimiento) AS ultima_fecha
        FROM almacen.movimientos_detalle md
        JOIN almacen.movimientos m ON m.id_movimiento = md.id_movimiento
        WHERE md.id_producto = $1
        ${almacen_id ? "AND md.almacen_id = $2" : ""}
      `;
      const lastMovRes = await db.query(lastMovSql, params);

      return res.json({
        success: true,
        ultima_fecha: lastMovRes.rows[0]?.ultima_fecha ?? null,
        stock: stockRes.rows,
      });
    } catch (error) {
      console.error("resumenKardex error:", error);
      return res.status(500).json({
        success: false,
        message: "Error al obtener resumen de kárdex",
        error: error.message,
      });
    }
  },

  // =========================================================
  // GET /almacen/kardex/saldo-inicial?id_producto=&almacen_id=&fecha_desde=
  // =========================================================
  saldoInicial: async (req, res) => {
    try {
      const { id_producto, almacen_id, fecha_desde } = req.query;

      if (!id_producto || !almacen_id || !fecha_desde) {
        return res.status(400).json({
          success: false,
          message: "id_producto, almacen_id y fecha_desde son requeridos",
        });
      }

      const sql = `
        SELECT
          md.stock_resultante,
          m.fecha_movimiento,
          m.id_movimiento
        FROM almacen.movimientos_detalle md
        JOIN almacen.movimientos m ON m.id_movimiento = md.id_movimiento
        WHERE md.id_producto = $1
          AND md.almacen_id = $2
          AND m.fecha_movimiento < $3::timestamp
        ORDER BY m.fecha_movimiento DESC, md.id_detalle DESC
        LIMIT 1
      `;

      const r = await db.query(sql, [
        Number(id_producto),
        Number(almacen_id),
        `${fecha_desde} 00:00:00`,
      ]);

      const row = r.rows[0] || null;
      return res.json({
        success: true,
        saldo_inicial: row?.stock_resultante ?? 0,
        referencia: row,
      });
    } catch (error) {
      console.error("saldoInicial error:", error);
      return res.status(500).json({
        success: false,
        message: "Error al obtener saldo inicial",
        error: error.message,
      });
    }
  },

  // GET /almacen/kardex/export/pdf
  exportPdf: async (req, res) => {
    try {
      const rows = await fetchKardexRowsForExport(req.query);

      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: 28,        // ✅ un poco menos margen para ganar espacio
        bufferPages: true,
      });

      const filename = `kardex_${Date.now()}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

      doc.pipe(res);

      // -----------------------------
      // Helpers visuales
      // -----------------------------
      const pageW = doc.page.width;
      const pageH = doc.page.height;
      const margin = doc.page.margins.left;

      const formatDate = (d) => {
        if (!d) return "";
        const dt = new Date(d);
        const pad = (n) => String(n).padStart(2, "0");
        return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()} ${pad(
          dt.getHours()
        )}:${pad(dt.getMinutes())}`;
      };

      const drawHR = (y) => {
        doc
          .save()
          .moveTo(margin, y)
          .lineTo(pageW - margin, y)
          .lineWidth(1)
          .strokeColor("#e6e6e6")
          .stroke()
          .restore();
      };

      const drawBox = (x, y, w, h, opts = {}) => {
        const { fill = "#f7f9fc", stroke = "#d9e2ef" } = opts;
        doc
          .save()
          .roundedRect(x, y, w, h, 8)
          .fillColor(fill)
          .fill()
          .strokeColor(stroke)
          .lineWidth(1)
          .stroke()
          .restore();
      };

      const generatedAt = formatDate(new Date());

      const buildFiltrosTxt = () => {
        const parts = [
          req.query.id_producto ? `Producto: ${req.query.id_producto}` : "Producto: Todos",
          req.query.almacen_id ? `Almacén: ${req.query.almacen_id}` : "Almacén: Todos",
          req.query.tipo_movimiento ? `Tipo: ${req.query.tipo_movimiento}` : "Tipo: Todos",
          req.query.fecha_desde ? `Desde: ${req.query.fecha_desde}` : null,
          req.query.fecha_hasta ? `Hasta: ${req.query.fecha_hasta}` : null,
          req.query.q ? `Búsqueda: ${req.query.q}` : null,
        ].filter(Boolean);
        return parts.join("  |  ");
      };

      // -----------------------------
      // Encabezado
      // -----------------------------
      const drawHeader = () => {
        const topY = 18;

        doc
          .fontSize(15)
          .fillColor("#0b1f3a")
          .font("Helvetica-Bold")
          .text("Radiadores Fortaleza S.A.", margin, topY, { align: "left" });

        doc
          .fontSize(9)
          .fillColor("#4b5563")
          .font("Helvetica")
          .text("RUC: 20101636411", margin, topY + 20);

        doc
          .fontSize(9)
          .fillColor("#4b5563")
          .text(`Generado: ${generatedAt}`, pageW - margin - 220, topY + 20, {
            width: 220,
            align: "right",
          });

        doc
          .fontSize(13)
          .fillColor("#111827")
          .font("Helvetica-Bold")
          .text("KÁRDEX (FÍSICO) - ALMACÉN", margin, topY + 42, {
            width: pageW - margin * 2,
            align: "center",
          });

        const boxY = topY + 64;
        drawBox(margin, boxY, pageW - margin * 2, 34, { fill: "#f8fafc", stroke: "#e5e7eb" });

        doc
          .fontSize(8) // ✅ más chico
          .fillColor("#374151")
          .font("Helvetica")
          .text(buildFiltrosTxt(), margin + 10, boxY + 11, {
            width: pageW - margin * 2 - 20,
            align: "left",
          });

        drawHR(boxY + 44);
        doc.y = boxY + 52;
      };

      // -----------------------------
      // Tabla: columnas que SI entran
      // -----------------------------
      const tableX = margin;
      const tableYStart = () => doc.y;

      const rowH = 16;       // ✅ más compacto
      const padX = 4;        // ✅ menos padding

      const usableW = pageW - margin * 2; // ancho real para la tabla

      // fijas (compactas)
      const fixed = {
        fecha: 74,
        doc: 34,
        alm: 110,
        tipo: 52,
        ent: 58,
        sal: 58,
        saldo: 62,
      };

      // flexibles (se ajustan según espacio restante)
      // producto + operación + obs deben adaptarse
      const fixedSum = Object.values(fixed).reduce((a, b) => a + b, 0);

      // deja un colchón mínimo para que no se rompa
      const minFlex = { prod: 190, oper: 120, obs: 80 };
      const minFlexSum = minFlex.prod + minFlex.oper + minFlex.obs;

      // espacio restante real
      const remaining = usableW - fixedSum;

      // si por alguna razón queda corto, igual ajustamos proporcionalmente
      const flexFactor = remaining / minFlexSum;

      const flex = {
        prod: Math.max(160, Math.floor(minFlex.prod * flexFactor)),
        oper: Math.max(100, Math.floor(minFlex.oper * flexFactor)),
        obs: Math.max(70, Math.floor(minFlex.obs * flexFactor)),
      };

      // si sobra o falta por redondeos, lo ajustamos en prod
      const tableW = fixedSum + flex.prod + flex.oper + flex.obs;
      const diff = usableW - tableW;
      flex.prod += diff; // compensa para que calce exacto

      const col = {
        fecha: fixed.fecha,
        doc: fixed.doc,
        prod: flex.prod,
        alm: fixed.alm,
        oper: flex.oper,
        tipo: fixed.tipo,
        ent: fixed.ent,
        sal: fixed.sal,
        saldo: fixed.saldo,
        obs: flex.obs,
      };

      const drawTableHeader = (y) => {
        doc.save().rect(tableX, y, usableW, rowH).fillColor("#eef2ff").fill().restore();

        doc.fontSize(7).fillColor("#111827").font("Helvetica-Bold");

        let x = tableX;
        doc.text("Fecha", x + padX, y + 4, { width: col.fecha - padX }); x += col.fecha;
        doc.text("Doc", x + padX, y + 4, { width: col.doc - padX }); x += col.doc;
        doc.text("Producto", x + padX, y + 4, { width: col.prod - padX }); x += col.prod;
        doc.text("Almacén", x + padX, y + 4, { width: col.alm - padX }); x += col.alm;
        doc.text("Operación", x + padX, y + 4, { width: col.oper - padX }); x += col.oper;
        doc.text("Tipo", x + padX, y + 4, { width: col.tipo - padX }); x += col.tipo;

        doc.text("Entrada", x, y + 4, { width: col.ent - padX, align: "right" }); x += col.ent;
        doc.text("Salida", x, y + 4, { width: col.sal - padX, align: "right" }); x += col.sal;
        doc.text("Saldo", x, y + 4, { width: col.saldo - padX, align: "right" }); x += col.saldo;

        doc.text("Obs.", x + padX, y + 4, { width: col.obs - padX });

        doc.save()
          .moveTo(tableX, y + rowH)
          .lineTo(tableX + usableW, y + rowH)
          .strokeColor("#dbeafe")
          .stroke()
          .restore();
      };

      const drawRow = (r, y, isOdd) => {
        if (isOdd) {
          doc.save().rect(tableX, y, usableW, rowH).fillColor("#fafafa").fill().restore();
        }

        doc.fontSize(7).fillColor("#111827").font("Helvetica");

        const prodTxt = `${r.producto_codigo || ""} ${r.producto_descripcion || ""}`.trim();

        let x = tableX;

        doc.text(formatDate(r.fecha_movimiento), x + padX, y + 4, { width: col.fecha - padX }); x += col.fecha;
        doc.text(r.documento_codigo || "", x + padX, y + 4, { width: col.doc - padX }); x += col.doc;

        doc.text(prodTxt, x + padX, y + 4, { width: col.prod - padX, ellipsis: true }); x += col.prod;
        doc.text(r.almacen_nombre || "", x + padX, y + 4, { width: col.alm - padX, ellipsis: true }); x += col.alm;
        doc.text(r.operacion_nombre || "", x + padX, y + 4, { width: col.oper - padX, ellipsis: true }); x += col.oper;

        const tipo = r.tipo_movimiento || "";
        const tipoColor = tipo === "INGRESO" ? "#16a34a" : tipo === "SALIDA" ? "#dc2626" : "#2563eb";
        doc.fillColor(tipoColor).text(tipo, x + padX, y + 4, { width: col.tipo - padX });
        doc.fillColor("#111827");
        x += col.tipo;

        doc.text(Number(r.entrada || 0).toFixed(3), x, y + 4, { width: col.ent - padX, align: "right" }); x += col.ent;
        doc.text(Number(r.salida || 0).toFixed(3), x, y + 4, { width: col.sal - padX, align: "right" }); x += col.sal;
        doc.text(Number(r.stock_resultante || 0).toFixed(3), x, y + 4, { width: col.saldo - padX, align: "right" }); x += col.saldo;

        doc.text(r.comentario || "", x + padX, y + 4, { width: col.obs - padX, ellipsis: true });

        doc.save()
          .moveTo(tableX, y + rowH)
          .lineTo(tableX + usableW, y + rowH)
          .strokeColor("#f0f0f0")
          .stroke()
          .restore();
      };

      // -----------------------------
      // Render
      // -----------------------------
      drawHeader();
      let y = tableYStart();

      drawTableHeader(y);
      y += rowH;

      let totalEntrada = 0;
      let totalSalida = 0;

      const bottomLimit = pageH - 54; // deja espacio para footer

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        totalEntrada += Number(r.entrada || 0);
        totalSalida += Number(r.salida || 0);

        if (y + rowH > bottomLimit) {
          doc.addPage();
          drawHeader();
          y = tableYStart();
          drawTableHeader(y);
          y += rowH;
        }

        drawRow(r, y, i % 2 === 1);
        y += rowH;
      }

      // Totales
      const boxY = Math.min(y + 10, pageH - 48 - 28);
      drawBox(tableX, boxY, usableW, 28, { fill: "#f8fafc", stroke: "#e5e7eb" });

      doc
        .font("Helvetica-Bold")
        .fillColor("#111827")
        .fontSize(8)
        .text(`Total Entrada: ${totalEntrada.toFixed(3)}`, tableX + 10, boxY + 9);

      doc
        .font("Helvetica-Bold")
        .fillColor("#111827")
        .fontSize(8)
        .text(`Total Salida: ${totalSalida.toFixed(3)}`, tableX + 200, boxY + 9);

      doc
        .font("Helvetica")
        .fillColor("#4b5563")
        .fontSize(8)
        .text(`Total registros: ${rows.length}`, tableX + usableW - 200, boxY + 9, {
          width: 190,
          align: "right",
        });

      // -----------------------------
      // Footer con numeración
      // -----------------------------
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);

        const footerY = doc.page.height - 20;
        drawHR(footerY - 6);

        doc
          .fontSize(7)
          .fillColor("#6b7280")
          .font("Helvetica")
          .text(`Radiadores Fortaleza S.A. · RUC 20101636411`, margin, footerY, { align: "left" });

        doc
          .fontSize(7)
          .fillColor("#6b7280")
          .text(`Página ${i + 1} de ${range.count}`, pageW - margin - 120, footerY, {
            width: 120,
            align: "right",
          });
      }

      doc.end();
    } catch (error) {
      console.error("exportPdf error:", error);
      return res.status(500).json({
        success: false,
        message: "Error exportando PDF",
        error: error.message,
      });
    }
  },


  // GET /almacen/kardex/export/excel
  exportExcel: async (req, res) => {
  try {
    const rows = await fetchKardexRowsForExport(req.query);

    const wb = new ExcelJS.Workbook();
    wb.creator = "Radiadores Fortaleza S.A.";
    wb.created = new Date();

    const ws = wb.addWorksheet("Kardex", {
      properties: { defaultRowHeight: 16 },
      pageSetup: {
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
      },
    });

    // -----------------------------
    // Helpers
    // -----------------------------
    const fmtDate = (d) => (d ? new Date(d) : null);

    const filtrosTxt = [
      req.query.id_producto ? `Producto: ${req.query.id_producto}` : "Producto: Todos",
      req.query.almacen_id ? `Almacén: ${req.query.almacen_id}` : "Almacén: Todos",
      req.query.tipo_movimiento ? `Tipo: ${req.query.tipo_movimiento}` : "Tipo: Todos",
      req.query.fecha_desde ? `Desde: ${req.query.fecha_desde}` : null,
      req.query.fecha_hasta ? `Hasta: ${req.query.fecha_hasta}` : null,
      req.query.q ? `Búsqueda: ${req.query.q}` : null,
    ]
      .filter(Boolean)
      .join("  |  ");

    const columns = [
      { header: "Fecha", key: "fecha", width: 20 },
      { header: "Documento", key: "doc", width: 10 },
      { header: "Operación", key: "op", width: 26 },
      { header: "Almacén", key: "alm", width: 24 },
      { header: "Tipo", key: "tipo", width: 10 },
      { header: "Código", key: "prodCod", width: 14 },
      { header: "Producto", key: "prodNom", width: 44 },
      { header: "UM", key: "um", width: 10 },
      { header: "Entrada", key: "entrada", width: 12 },
      { header: "Salida", key: "salida", width: 12 },
      { header: "Saldo", key: "saldo", width: 12 },
      { header: "Obs.", key: "obs", width: 28 },
    ];

    // aplicar anchos
    ws.columns = columns.map((c) => ({ key: c.key, width: c.width }));

    // -----------------------------
    // Header corporativo (1-4)
    // -----------------------------
    ws.mergeCells("A1:L1");
    ws.getCell("A1").value = "Radiadores Fortaleza S.A.";
    ws.getCell("A1").font = { bold: true, size: 14 };
    ws.getCell("A1").alignment = { vertical: "middle", horizontal: "left" };

    ws.mergeCells("A2:L2");
    ws.getCell("A2").value = "RUC: 20101636411";
    ws.getCell("A2").font = { size: 10, color: { argb: "FF555555" } };
    ws.getCell("A2").alignment = { vertical: "middle", horizontal: "left" };

    ws.mergeCells("A3:L3");
    ws.getCell("A3").value = `KÁRDEX (FÍSICO) - ALMACÉN   |   ${filtrosTxt}`;
    ws.getCell("A3").font = { bold: true, size: 10, color: { argb: "FF111827" } };
    ws.getCell("A3").alignment = { vertical: "middle", horizontal: "left", wrapText: true };

    ws.addRow([]); // fila 4 separador

    // -----------------------------
    // Encabezado REAL en fila 5 (alineado)
    // -----------------------------
    const headerRowIndex = 5;
    const headers = columns.map((c) => c.header);

    const headerRow = ws.getRow(headerRowIndex);
    headerRow.values = headers; // 1-based
    headerRow.height = 18;

    // ✅ color header (gris claro profesional)
    headerRow.font = { bold: true, size: 10, color: { argb: "FF111827" } };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE5E7EB" }, // gris claro
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFCBD5E1" } },
        left: { style: "thin", color: { argb: "FFCBD5E1" } },
        bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
        right: { style: "thin", color: { argb: "FFCBD5E1" } },
      };
    });

    // Congelar y autofiltro
    ws.views = [{ state: "frozen", ySplit: headerRowIndex }];
    ws.autoFilter = {
      from: { row: headerRowIndex, column: 1 },
      to: { row: headerRowIndex, column: 12 },
    };

    // -----------------------------
    // Data (desde fila 6) - en ARRAY para que nunca se desordene
    // -----------------------------
    const startDataRow = headerRowIndex + 1;

    let totalEntrada = 0;
    let totalSalida = 0;

    rows.forEach((r) => {
      const entrada = Number(r.entrada || 0);
      const salida = Number(r.salida || 0);
      totalEntrada += entrada;
      totalSalida += salida;

      ws.addRow([
        fmtDate(r.fecha_movimiento),       // A Fecha
        r.documento_codigo || "",          // B Documento
        r.operacion_nombre || "",          // C Operación
        r.almacen_nombre || "",            // D Almacén
        r.tipo_movimiento || "",           // E Tipo
        r.producto_codigo || "",           // F Código
        r.producto_descripcion || "",      // G Producto
        r.unidad_medida || "",             // H UM
        entrada,                           // I Entrada
        salida,                            // J Salida
        Number(r.stock_resultante || 0),   // K Saldo
        r.comentario || "",                // L Obs
      ]);
    });

    const endRow = ws.lastRow.number;

    // -----------------------------
    // Formatos / alineación (por columnas)
    // -----------------------------
    ws.getColumn(1).numFmt = "dd/mm/yyyy hh:mm"; // A
    [9, 10, 11].forEach((idx) => {
      ws.getColumn(idx).numFmt = "0.000";
      ws.getColumn(idx).alignment = { horizontal: "right", vertical: "middle" };
    });

    ws.getColumn(2).alignment = { horizontal: "center", vertical: "middle" }; // Doc
    ws.getColumn(5).alignment = { horizontal: "center", vertical: "middle" }; // Tipo
    ws.getColumn(6).alignment = { horizontal: "center", vertical: "middle" }; // Código
    ws.getColumn(8).alignment = { horizontal: "center", vertical: "middle" }; // UM

    ws.getColumn(7).alignment = { wrapText: true, vertical: "middle" }; // Producto
    ws.getColumn(12).alignment = { wrapText: true, vertical: "middle" }; // Obs

    // -----------------------------
    // Zebra + bordes + fuente (solo data)
    // -----------------------------
    for (let r = startDataRow; r <= endRow; r++) {
      const row = ws.getRow(r);
      const isOdd = (r - startDataRow) % 2 === 1;

      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.font = { name: "Calibri", size: 10 };

        if (isOdd) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF8FAFC" },
          };
        }

        cell.border = {
          top: { style: "thin", color: { argb: "FFE5E7EB" } },
          left: { style: "thin", color: { argb: "FFE5E7EB" } },
          bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
          right: { style: "thin", color: { argb: "FFE5E7EB" } },
        };
      });

      row.height = 16;
    }

    // Colorear Tipo (col E)
    for (let r = startDataRow; r <= endRow; r++) {
      const tipoCell = ws.getCell(r, 5);
      const tipo = String(tipoCell.value || "").toUpperCase();

      if (tipo === "INGRESO") tipoCell.font = { name: "Calibri", size: 10, color: { argb: "FF16A34A" }, bold: true };
      else if (tipo === "SALIDA") tipoCell.font = { name: "Calibri", size: 10, color: { argb: "FFDC2626" }, bold: true };
      else if (tipo === "AJUSTE") tipoCell.font = { name: "Calibri", size: 10, color: { argb: "FF2563EB" }, bold: true };
    }

    // -----------------------------
    // Totales (fila final)
    // -----------------------------
    const totalRow = ws.addRow([
      null, "", "", "", "", "", "TOTALES", "",
      totalEntrada, totalSalida, null, ""
    ]);

    totalRow.font = { bold: true, size: 10 };
    totalRow.height = 18;

    totalRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
      cell.border = {
        top: { style: "thin", color: { argb: "FFCBD5E1" } },
        left: { style: "thin", color: { argb: "FFCBD5E1" } },
        bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
        right: { style: "thin", color: { argb: "FFCBD5E1" } },
      };
      cell.alignment = { vertical: "middle" };
    });

    ws.getCell(totalRow.number, 7).alignment = { horizontal: "right", vertical: "middle" };
    ws.getCell(totalRow.number, 9).numFmt = "0.000";
    ws.getCell(totalRow.number, 10).numFmt = "0.000";

    // -----------------------------
    // Respuesta
    // -----------------------------
    const filename = `kardex_${Date.now()}.xlsx`;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    await wb.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("exportExcel error:", error);
    return res.status(500).json({
      success: false,
      message: "Error exportando Excel",
      error: error.message,
    });
  }
},



};

module.exports = kardexController;

  function buildKardexFilters(query) {
    const {
      id_producto,
      almacen_id,
      tipo_movimiento,
      documento_interno_id,
      cod_operacion,
      origen,
      fecha_desde,
      fecha_hasta,
      q,
    } = query;

    const where = [];
    const params = [];

    const add = (sql, val) => {
      params.push(val);
      where.push(sql.replace("$$", `$${params.length}`));
    };

    const hasProducto = !!id_producto;

    if (id_producto) add(`md.id_producto = $$`, Number(id_producto));
    if (almacen_id) add(`md.almacen_id = $$`, Number(almacen_id));

    if (tipo_movimiento) add(`m.tipo_movimiento = $$`, String(tipo_movimiento).toUpperCase());
    if (documento_interno_id) add(`m.documento_interno_id = $$`, Number(documento_interno_id));
    if (cod_operacion) add(`m.cod_operacion = $$`, Number(cod_operacion));
    if (origen) add(`m.origen = $$`, String(origen));

    if (fecha_desde) add(`m.fecha_movimiento >= $$::timestamp`, `${fecha_desde} 00:00:00`);
    if (fecha_hasta) add(`m.fecha_movimiento <= $$::timestamp`, `${fecha_hasta} 23:59:59`);

    if (q) {
      const qq = `%${String(q).trim()}%`;
      params.push(qq);
      const p = `$${params.length}`;

      where.push(`
        (
          COALESCE(d.codigo,'') ILIKE ${p}
          OR COALESCE(d.nombre,'') ILIKE ${p}
          OR COALESCE(op.nombre,'') ILIKE ${p}
          OR COALESCE(a.nombre,'') ILIKE ${p}
          OR COALESCE(pr.codigo,'') ILIKE ${p}
          OR COALESCE(pr.descripcion,'') ILIKE ${p}
          OR COALESCE(m.numero_documento,'') ILIKE ${p}
          OR COALESCE(m.numero_guia,'') ILIKE ${p}
          OR COALESCE(m.serie,'') ILIKE ${p}
          OR CAST(m.id_movimiento AS TEXT) ILIKE ${p}
        )
      `);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const orderBy = hasProducto
      ? "ORDER BY m.fecha_movimiento ASC, md.id_detalle ASC"
      : "ORDER BY m.fecha_movimiento DESC, md.id_detalle DESC";

    return { whereSql, params, orderBy, hasProducto };
  }

  async function fetchKardexRowsForExport(query) {
    const { whereSql, params, orderBy } = buildKardexFilters(query);

    // ⚠️ Exportación: no paginar, pero sí pon un límite de seguridad
    const LIMIT_EXPORT = 10000;

    const sql = `
      SELECT
        md.id_detalle,
        m.id_movimiento,
        m.fecha_movimiento,
        m.tipo_movimiento,
        m.origen,

        d.codigo AS documento_codigo,
        op.nombre AS operacion_nombre,

        a.nombre AS almacen_nombre,

        pr.codigo AS producto_codigo,
        pr.descripcion AS producto_descripcion,
        md.unidad_medida,

        CASE WHEN m.tipo_movimiento = 'INGRESO' THEN md.cantidad ELSE 0 END AS entrada,
        CASE WHEN m.tipo_movimiento = 'SALIDA'  THEN md.cantidad ELSE 0 END AS salida,
        md.stock_resultante,

        m.id_nota,
        md.comentario
      FROM almacen.movimientos_detalle md
      JOIN almacen.movimientos m ON m.id_movimiento = md.id_movimiento
      JOIN public.documentos d ON d.id_documento = m.documento_interno_id
      JOIN public.cod_operacion op ON op.id_cod_operacion = m.cod_operacion
      JOIN almacen.almacenes a ON a.id_alm = md.almacen_id
      JOIN almacen.productos pr ON pr.id_producto = md.id_producto
      ${whereSql}
      ${orderBy}
      LIMIT ${LIMIT_EXPORT}
    `;

    const r = await db.query(sql, params);
    return r.rows || [];
  }
