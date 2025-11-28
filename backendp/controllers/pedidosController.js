//pedidosController.js

const pool = require("../config/db");

// =====================================================
// FUNCIONES PARA PEDIDOS DE CLIENTES
// =====================================================

// Obtener todos los pedidos
const obtenerPedidos = async (req, res) => {
  try {
    const { estado, fecha_desde, fecha_hasta, cliente } = req.query;

    let query = `
      SELECT 
        p.id_pedido,
        p.id_documento,
        d.codigo as documento_codigo,
        d.nombre as documento_nombre,
        p.numero,
        p.fecha,
        p.id_cotizacion,
        c.numero as cotizacion_numero,
        p.id_cliente,
        p.codigo_cliente,
        p.razon_social_cliente,
        p.nro_documento_cliente,
        p.direccion_cliente,
        p.telefono_cliente,
        p.vendedor,
        p.moneda_id,
        m.codigo as moneda_codigo,
        m.nombre as moneda_nombre,
        p.forma_pago,
        fp.nombre as forma_pago_nombre,
        p.fecha_entrega_prevista,
        p.lugar_entrega,
        pp.direccion as lugar_entrega_direccion,
        p.prioridad,
        p.importe_bruto,
        p.monto_descuento,
        p.valor_venta,
        p.igv_id,
        p.igv,
        p.total,
        p.estado,
        p.observaciones,
        p.created_at,
        p.updated_at,
        u_created.nombre_completo as creado_por_nombre,
        u_updated.nombre_completo as actualizado_por_nombre
      FROM ventas.pedidos_cliente p
      LEFT JOIN public.documentos d ON p.id_documento = d.id_documento
      LEFT JOIN ventas.cotizacion_cliente c ON p.id_cotizacion = c.id_cotizacion
      LEFT JOIN contabilidad.cod_moneda m ON p.moneda_id = m.id_moneda
      LEFT JOIN contabilidad.formas_pago fp ON p.forma_pago = fp.id
      LEFT JOIN ventas.puntos_partida pp ON p.lugar_entrega = pp.id_partida
      LEFT JOIN public.usuarios u_created ON p.created_by = u_created.id
      LEFT JOIN public.usuarios u_updated ON p.updated_by = u_updated.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    // Filtro por estado
    if (estado) {
      query += ` AND p.estado = $${paramCount}`;
      params.push(estado);
      paramCount++;
    }

    // Filtro por fecha desde
    if (fecha_desde) {
      query += ` AND p.fecha >= $${paramCount}`;
      params.push(fecha_desde);
      paramCount++;
    }

    // Filtro por fecha hasta
    if (fecha_hasta) {
      query += ` AND p.fecha <= $${paramCount}`;
      params.push(fecha_hasta);
      paramCount++;
    }

    // Filtro por cliente
    if (cliente) {
      query += ` AND (p.codigo_cliente ILIKE $${paramCount} OR p.razon_social_cliente ILIKE $${paramCount})`;
      params.push(`%${cliente}%`);
      paramCount++;
    }

    query += ` ORDER BY p.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      detalle: error.message,
    });
  }
};

// Obtener pedido por ID
const obtenerPedidoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener cabecera del pedido
    const cabeceraQuery = `
      SELECT 
        p.*,
        d.codigo as documento_codigo,
        d.nombre as documento_nombre,
        c.numero as cotizacion_numero,
        m.codigo as moneda_codigo,
        m.nombre as moneda_nombre,
        fp.nombre as forma_pago_nombre,
        pp.direccion as lugar_entrega_direccion,
        igv.porcentaje as igv_porcentaje,
        u_created.nombre_completo as creado_por_nombre,
        u_updated.nombre_completo as actualizado_por_nombre
      FROM ventas.pedidos_cliente p
      LEFT JOIN public.documentos d ON p.id_documento = d.id_documento
      LEFT JOIN ventas.cotizacion_cliente c ON p.id_cotizacion = c.id_cotizacion
      LEFT JOIN contabilidad.cod_moneda m ON p.moneda_id = m.id_moneda
      LEFT JOIN contabilidad.formas_pago fp ON p.forma_pago = fp.id
      LEFT JOIN ventas.puntos_partida pp ON p.lugar_entrega = pp.id_partida
      LEFT JOIN public.igv igv ON p.igv_id = igv.id
      LEFT JOIN public.usuarios u_created ON p.created_by = u_created.id
      LEFT JOIN public.usuarios u_updated ON p.updated_by = u_updated.id
      WHERE p.id_pedido = $1
    `;

    const cabeceraResult = await pool.query(cabeceraQuery, [id]);

    if (cabeceraResult.rows.length === 0) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    // Obtener detalle del pedido
    const detalleQuery = `
      SELECT 
        dp.*,
        p.codigo as producto_codigo,
        p.descripcion as producto_descripcion,
        um.siglas as unidad_medida,
        dc.fecha_entrega as fecha_entrega_original
      FROM ventas.detalle_pedidos_cliente dp
      LEFT JOIN almacen.productos p ON dp.producto_id = p.id_producto
      LEFT JOIN public.unidades_medida um ON p.id_unidad = um.id_unidades
      LEFT JOIN ventas.detalle_cotizacion dc ON dp.id_detalle_cotizacion = dc.id_detalle_cotizacion
      WHERE dp.pedido_id = $1
      ORDER BY dp.numitem
    `;

    const detalleResult = await pool.query(detalleQuery, [id]);

    const pedidoCompleto = {
      ...cabeceraResult.rows[0],
      detalles: detalleResult.rows,
    };

    res.json(pedidoCompleto);
  } catch (error) {
    console.error("Error al obtener pedido:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      detalle: error.message,
    });
  }
};

// Convertir cotización a pedido
const convertirCotizacionAPedido = async (req, res) => {
  try {
    await pool.query("BEGIN");

    const {
      id_cotizacion,
      fecha_entrega_prevista,
      lugar_entrega,
      observaciones,
    } = req.body;

    const usuario_id = req.userId || 1;

    // Verificar que la cotización existe y está aprobada
    const cotizacionQuery = `
      SELECT * FROM ventas.cotizacion_cliente 
      WHERE id_cotizacion = $1 AND estado = 'APROBADO'
    `;

    const cotizacionResult = await pool.query(cotizacionQuery, [id_cotizacion]);

    if (cotizacionResult.rows.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(400).json({
        error: "La cotización no existe o no está aprobada",
      });
    }

    const cotizacion = cotizacionResult.rows[0];

    // Verificar que no existe ya un pedido para esta cotización
    const pedidoExistenteQuery = `
      SELECT id_pedido FROM ventas.pedidos_cliente 
      WHERE id_cotizacion = $1
    `;

    const pedidoExistenteResult = await pool.query(pedidoExistenteQuery, [
      id_cotizacion,
    ]);

    if (pedidoExistenteResult.rows.length > 0) {
      await pool.query("ROLLBACK");
      return res.status(400).json({
        error: "Ya existe un pedido para esta cotización",
      });
    }

    // Obtener el documento para pedidos
    const documentoQuery = `
      SELECT id_documento FROM public.documentos WHERE codigo = 'PED'
    `;

    const documentoResult = await pool.query(documentoQuery);

    if (documentoResult.rows.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(400).json({
        error: "No se encontró el documento tipo PED (Pedidos)",
      });
    }

    const id_documento = documentoResult.rows[0].id_documento;

    // Insertar cabecera del pedido
    const insertPedidoQuery = `
      INSERT INTO ventas.pedidos_cliente (
        id_documento,
        id_cotizacion,
        fecha, -- CAMPO AÑADIDO
        id_cliente,
        codigo_cliente,
        nro_documento_cliente,
        razon_social_cliente,
        direccion_cliente,
        telefono_cliente,
        vendedor,
        moneda_id,
        forma_pago,
        fecha_entrega_prevista,
        lugar_entrega,
        prioridad,
        importe_bruto,
        monto_descuento,
        valor_venta,
        igv_id,
        igv,
        total,
        observaciones,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      RETURNING id_pedido, numero
    `;

    const pedidoValues = [
      id_documento,
      cotizacion.id_cotizacion,
      new Date(), // FECHA ACTUAL AÑADIDA
      cotizacion.id_cliente,
      cotizacion.codigo_cliente,
      cotizacion.nro_documento_cliente,
      cotizacion.razon_social_cliente,
      cotizacion.direccion_cliente,
      cotizacion.telefono_cliente,
      cotizacion.vendedor,
      cotizacion.moneda_id,
      cotizacion.forma_pago,
      fecha_entrega_prevista || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      lugar_entrega,
      cotizacion.prioridad,
      cotizacion.importe_bruto,
      cotizacion.monto_descuento,
      cotizacion.valor_venta,
      cotizacion.igv_id,
      cotizacion.igv,
      cotizacion.total,
      observaciones || `Pedido generado desde cotización: ${cotizacion.numero}`,
      usuario_id,
    ];

    const pedidoResult = await pool.query(insertPedidoQuery, pedidoValues);
    const nuevoPedido = pedidoResult.rows[0];

    // Obtener detalles de la cotización
    const detallesCotizacionQuery = `
      SELECT * FROM ventas.detalle_cotizacion 
      WHERE cotizacion_id = $1
      ORDER BY numitem
    `;

    const detallesCotizacionResult = await pool.query(detallesCotizacionQuery, [
      id_cotizacion,
    ]);

    // Insertar detalles del pedido
    for (const detalle of detallesCotizacionResult.rows) {
      const insertDetalleQuery = `
        INSERT INTO ventas.detalle_pedidos_cliente (
    pedido_id,
    id_detalle_cotizacion,
    numitem,
    producto_id,
    descripcion_producto,
    cantidad_solicitada,
    precio_unitario,
    descuento_1,           -- COLUMNA CORRECTA
    descuento_2,           -- COLUMNA CORRECTA
    descuento_monto,
    valor_venta,
    igv,
    precio_total,
    fecha_entrega_item
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
`;

      const detalleValues = [
        nuevoPedido.id_pedido,
        detalle.id_detalle_cotizacion,
        detalle.numitem,
        detalle.producto_id,
        detalle.descripcion_producto,
        detalle.cantidad,
        detalle.precio_unitario,
        detalle.descuento_1 || 0,     // ✅ VALOR CORRECTO
        detalle.descuento_2 || 0,     // ✅ VALOR CORRECTO
        detalle.descuento_monto || 0,
        detalle.valor_venta || 0,
        detalle.igv || 0,
        detalle.precio_total || 0,
        detalle.fecha_entrega,
      ];

      await pool.query(insertDetalleQuery, detalleValues);
    }

    // Actualizar estado de la cotización
    const updateCotizacionQuery = `
  UPDATE ventas.cotizacion_cliente 
  SET estado = 'APROBADO',
      updated_at = CURRENT_TIMESTAMP,
      updated_by = $1
  WHERE id_cotizacion = $2
`;

    await pool.query(updateCotizacionQuery, [usuario_id, id_cotizacion]);

    await pool.query("COMMIT");

    // Obtener el pedido completo recién creado
    const pedidoCompleto = await obtenerPedidoCompletoPorId(
      nuevoPedido.id_pedido
    );

    res.status(201).json({
      message: "Pedido creado exitosamente",
      pedido: pedidoCompleto,
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error al convertir cotización a pedido:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      detalle: error.message,
    });
  }
};

// Función auxiliar para obtener pedido completo por ID - CORREGIDA
const obtenerPedidoCompletoPorId = async (id_pedido) => {
  const cabeceraQuery = `
    SELECT 
      p.*,
      d.codigo as documento_codigo,
      d.nombre as documento_nombre,
      c.numero as cotizacion_numero,
      m.codigo as moneda_codigo,
      m.nombre as moneda_nombre,
      fp.nombre as forma_pago_nombre,
      pp.direccion as lugar_entrega_direccion,
      igv.porcentaje as igv_porcentaje,
      u_created.nombre_completo as creado_por_nombre,
      u_updated.nombre_completo as actualizado_por_nombre
    FROM ventas.pedidos_cliente p
    LEFT JOIN public.documentos d ON p.id_documento = d.id_documento
    LEFT JOIN ventas.cotizacion_cliente c ON p.id_cotizacion = c.id_cotizacion
    LEFT JOIN contabilidad.cod_moneda m ON p.moneda_id = m.id_moneda
    LEFT JOIN contabilidad.formas_pago fp ON p.forma_pago = fp.id
    LEFT JOIN ventas.puntos_partida pp ON p.lugar_entrega = pp.id_partida
    LEFT JOIN public.igv igv ON p.igv_id = igv.id
    LEFT JOIN public.usuarios u_created ON p.created_by = u_created.id
    LEFT JOIN public.usuarios u_updated ON p.updated_by = u_updated.id
    WHERE p.id_pedido = $1
  `;

  const detalleQuery = `
    SELECT 
      dp.*,
      p.codigo as producto_codigo,
      p.descripcion as producto_descripcion,
      um.siglas as unidad_medida,
      dc.fecha_entrega as fecha_entrega_original
    FROM ventas.detalle_pedidos_cliente dp
    LEFT JOIN almacen.productos p ON dp.producto_id = p.id_producto
    LEFT JOIN public.unidades_medida um ON p.id_unidad = um.id_unidades
    LEFT JOIN ventas.detalle_cotizacion dc ON dp.id_detalle_cotizacion = dc.id_detalle_cotizacion
    WHERE dp.pedido_id = $1
    ORDER BY dp.numitem
  `;

  try {
    // CORRECCIÓN: Usar await secuencial en lugar de Promise.all
    const cabeceraResult = await pool.query(cabeceraQuery, [id_pedido]);
    const detalleResult = await pool.query(detalleQuery, [id_pedido]);

    if (cabeceraResult.rows.length === 0) {
      return null;
    }

    return {
      ...cabeceraResult.rows[0],
      detalles: detalleResult.rows,
    };
  } catch (error) {
    console.error("Error en obtenerPedidoCompletoPorId:", error);
    throw error;
  }
};

// Actualizar estado del pedido
const actualizarEstadoPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const usuario_id = req.userId || 1;

    const estadosPermitidos = [
      "PENDIENTE",
      "EN PREPARACIÓN",
      "DESPACHADO",
      "ENTREGADO",
      "FACTURADO",
      "ANULADO",
    ];

    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        error: "Estado no válido",
        estados_permitidos: estadosPermitidos,
      });
    }

    const query = `
      UPDATE ventas.pedidos_cliente 
      SET 
        estado = $1,
        updated_by = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id_pedido = $3
      RETURNING *
    `;

    const result = await pool.query(query, [estado, usuario_id, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    const pedidoActualizado = await obtenerPedidoCompletoPorId(id);

    res.json({
      message: `Estado del pedido actualizado a: ${estado}`,
      pedido: pedidoActualizado,
    });
  } catch (error) {
    console.error("Error al actualizar estado del pedido:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      detalle: error.message,
    });
  }
};

// Actualizar cantidades despachadas
const actualizarCantidadesDespachadas = async (req, res) => {
  try {
    await pool.query("BEGIN");

    const { id } = req.params;
    const { detalles } = req.body;
    const usuario_id = req.userId || 1;

    // Verificar que el pedido existe
    const pedidoQuery = `
      SELECT estado FROM ventas.pedidos_cliente WHERE id_pedido = $1
    `;

    const pedidoResult = await pool.query(pedidoQuery, [id]);

    if (pedidoResult.rows.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    const pedido = pedidoResult.rows[0];

    // Verificar que el pedido está en un estado que permite actualizaciones
    if (["FACTURADO", "ANULADO"].includes(pedido.estado)) {
      await pool.query("ROLLBACK");
      return res.status(400).json({
        error: `No se pueden actualizar cantidades en estado: ${pedido.estado}`,
      });
    }

    // Actualizar cada detalle
    for (const detalle of detalles) {
      const { detalle_pedido_id, cantidad_despachada } = detalle;

      const updateDetalleQuery = `
        UPDATE ventas.detalle_pedidos_cliente 
        SET 
          cantidad_despachada = $1, -- NOMBRE CORREGIDO
          updated_at = CURRENT_TIMESTAMP
        WHERE id_detalle_pedido = $2 AND pedido_id = $3
      `;

      await pool.query(updateDetalleQuery, [
        cantidad_despachada,
        detalle_pedido_id,
        id,
      ]);
    }

    // Verificar si el pedido debe cambiar de estado
    const detallesQuery = `
      SELECT 
        SUM(cantidad_solicitada) as total_solicitado,
        SUM(cantidad_despachada) as total_despachado
      FROM ventas.detalle_pedidos_cliente 
      WHERE pedido_id = $1
    `;

    const detallesResult = await pool.query(detallesQuery, [id]);
    const { total_solicitado, total_despachado } = detallesResult.rows[0];

    let nuevoEstado = pedido.estado;

    if (total_despachado > 0 && total_despachado < total_solicitado) {
      nuevoEstado = "EN PREPARACIÓN";
    } else if (total_despachado >= total_solicitado) {
      nuevoEstado = "DESPACHADO";
    }

    if (nuevoEstado !== pedido.estado) {
      const updateEstadoQuery = `
        UPDATE ventas.pedidos_cliente 
        SET 
          estado = $1,
          updated_by = $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE id_pedido = $3
      `;

      await pool.query(updateEstadoQuery, [nuevoEstado, usuario_id, id]);
    }

    await pool.query("COMMIT");

    const pedidoActualizado = await obtenerPedidoCompletoPorId(id);

    res.json({
      message: "Cantidades despachadas actualizadas correctamente",
      pedido: pedidoActualizado,
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error al actualizar cantidades despachadas:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      detalle: error.message,
    });
  }
};

// Obtener pedidos por cliente
const obtenerPedidosPorCliente = async (req, res) => {
  try {
    const { cliente_id } = req.params;
    const { estado, fecha_desde, fecha_hasta } = req.query;

    let query = `
      SELECT 
        p.id_pedido,
        p.numero,
        p.fecha,
        p.estado,
        p.total,
        p.fecha_entrega_prevista,
        c.numero as cotizacion_numero,
        COUNT(dp.id_detalle_pedido) as total_items,
        SUM(dp.cantidad_solicitada) as total_cantidad
      FROM ventas.pedidos_cliente p
      LEFT JOIN ventas.cotizacion_cliente c ON p.id_cotizacion = c.id_cotizacion
      LEFT JOIN ventas.detalle_pedidos_cliente dp ON p.id_pedido = dp.pedido_id
      WHERE p.id_cliente = $1
    `;

    const params = [cliente_id];
    let paramCount = 2;

    // Filtro por estado
    if (estado) {
      query += ` AND p.estado = $${paramCount}`;
      params.push(estado);
      paramCount++;
    }

    // Filtro por fecha desde
    if (fecha_desde) {
      query += ` AND p.fecha >= $${paramCount}`;
      params.push(fecha_desde);
      paramCount++;
    }

    // Filtro por fecha hasta
    if (fecha_hasta) {
      query += ` AND p.fecha <= $${paramCount}`;
      params.push(fecha_hasta);
      paramCount++;
    }

    query += ` 
      GROUP BY p.id_pedido, p.numero, p.fecha, p.estado, p.total, p.fecha_entrega_prevista, c.numero
      ORDER BY p.fecha DESC, p.created_at DESC
    `;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener pedidos por cliente:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      detalle: error.message,
    });
  }
};

// Obtener estadísticas de pedidos
const obtenerEstadisticasPedidos = async (req, res) => {
  try {
    const { periodo = "mes" } = req.query; // 'dia', 'semana', 'mes', 'anio'

    let groupByClause;
    let dateFormat;

    switch (periodo) {
      case "dia":
        groupByClause = "DATE_TRUNC('day', fecha)";
        dateFormat = "DD/MM/YYYY";
        break;
      case "semana":
        groupByClause = "DATE_TRUNC('week', fecha)";
        dateFormat =
          "'Semana ' || TO_CHAR(DATE_TRUNC('week', fecha), 'DD/MM/YYYY')";
        break;
      case "anio":
        groupByClause = "DATE_TRUNC('year', fecha)";
        dateFormat = "YYYY";
        break;
      default: // mes
        groupByClause = "DATE_TRUNC('month', fecha)";
        dateFormat = "MM/YYYY";
    }

    const query = `
      SELECT 
        ${groupByClause} as periodo,
        TO_CHAR(${groupByClause}, ${dateFormat}) as periodo_formateado,
        COUNT(*) as total_pedidos,
        SUM(total) as monto_total,
        AVG(total) as monto_promedio,
        COUNT(CASE WHEN estado = 'PENDIENTE' THEN 1 END) as pendientes,
        COUNT(CASE WHEN estado = 'EN PREPARACIÓN' THEN 1 END) as en_preparacion,
        COUNT(CASE WHEN estado = 'DESPACHADO' THEN 1 END) as despachados,
        COUNT(CASE WHEN estado = 'ENTREGADO' THEN 1 END) as entregados,
        COUNT(CASE WHEN estado = 'FACTURADO' THEN 1 END) as facturados,
        COUNT(CASE WHEN estado = 'ANULADO' THEN 1 END) as anulados
      FROM ventas.pedidos_cliente
      WHERE fecha >= CURRENT_DATE - INTERVAL '1 year'
      GROUP BY ${groupByClause}
      ORDER BY periodo DESC
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener estadísticas de pedidos:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      detalle: error.message,
    });
  }
};

// Generar reporte de pedidos pendientes
const generarReportePedidosPendientes = async (req, res) => {
  try {
    const query = `
      SELECT 
        p.numero as pedido_numero,
        p.fecha,
        p.razon_social_cliente,
        p.vendedor,
        p.fecha_entrega_prevista,
        p.total,
        COUNT(dp.id_detalle_pedido) as total_items,
        SUM(dp.cantidad_solicitada - dp.cantidad_despachada) as cantidad_pendiente
      FROM ventas.pedidos_cliente p
      LEFT JOIN ventas.detalle_pedidos_cliente dp ON p.id_pedido = dp.pedido_id
      WHERE p.estado IN ('PENDIENTE', 'EN PREPARACIÓN')
        AND (dp.cantidad_solicitada - dp.cantidad_despachada) > 0
      GROUP BY p.id_pedido, p.numero, p.fecha, p.razon_social_cliente, p.vendedor, p.fecha_entrega_prevista, p.total
      ORDER BY p.fecha_entrega_prevista ASC, p.fecha ASC
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al generar reporte de pedidos pendientes:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      detalle: error.message,
    });
  }
};

module.exports = {
  obtenerPedidos,
  obtenerPedidoPorId,
  convertirCotizacionAPedido,
  actualizarEstadoPedido,
  actualizarCantidadesDespachadas,
  obtenerPedidosPorCliente,
  obtenerEstadisticasPedidos,
  generarReportePedidosPendientes,
};
