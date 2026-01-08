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
        p.tipo_cambio_id,
        p.tipo_cambio,
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
        p.importe_dolares,
        p.estado,
        p.observaciones,
        p.created_at,
        p.updated_at,
        u_created.nombre_completo as creado_por_nombre,
        u_updated.nombre_completo as actualizado_por_nombre,

        -- ✅ INDICADORES DE FABRICACIÓN
        (SELECT COUNT(*) FROM ventas.orden_fabricacion of WHERE of.pedido_id = p.id_pedido) > 0 as tiene_orden_fabricacion,
        (SELECT of.numero_ord FROM ventas.orden_fabricacion of WHERE of.pedido_id = p.id_pedido LIMIT 1) as numero_orden_fabricacion,
        (SELECT of.estado_orden FROM ventas.orden_fabricacion of WHERE of.pedido_id = p.id_pedido LIMIT 1) as estado_orden_fabricacion,

        -- ✅ VERIFICAR SI REQUIERE FABRICACIÓN (considerando reservas)
        (
          SELECT COUNT(*) > 0
          FROM ventas.detalle_pedidos_cliente dp
          LEFT JOIN almacen.productos pr ON dp.producto_id = pr.id_producto
          LEFT JOIN almacen.reservas_stock r ON dp.id_detalle_pedido = r.id_detalle_pedido
            AND r.estado = 'ACTIVA'
          WHERE dp.pedido_id = p.id_pedido
            AND (
              -- Si hay reserva, verificar si cubre todo
              (r.cantidad_reservada IS NOT NULL AND (dp.cantidad_solicitada - dp.cantidad_despachada) > r.cantidad_reservada)
              OR
              -- Si no hay reserva, verificar stock disponible
              (r.cantidad_reservada IS NULL AND almacen.calcular_stock_disponible(pr.id_producto) < (dp.cantidad_solicitada - dp.cantidad_despachada))
            )
        ) as requiere_fabricacion,

        -- ✅ TOTAL DE PRODUCTOS SIN STOCK (considerando reservas)
        (
          SELECT COUNT(*)
          FROM ventas.detalle_pedidos_cliente dp
          LEFT JOIN almacen.productos pr ON dp.producto_id = pr.id_producto
          LEFT JOIN almacen.reservas_stock r ON dp.id_detalle_pedido = r.id_detalle_pedido
            AND r.estado = 'ACTIVA'
          WHERE dp.pedido_id = p.id_pedido
            AND (
              -- Si hay reserva, verificar si cubre todo
              (r.cantidad_reservada IS NOT NULL AND (dp.cantidad_solicitada - dp.cantidad_despachada) > r.cantidad_reservada)
              OR
              -- Si no hay reserva, verificar stock disponible
              (r.cantidad_reservada IS NULL AND almacen.calcular_stock_disponible(pr.id_producto) < (dp.cantidad_solicitada - dp.cantidad_despachada))
            )
        ) as productos_sin_stock

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
        dc.fecha_entrega as fecha_entrega_original,

        -- ✅ Stock real del producto
        COALESCE(p.stock_actual, 0) as stock_actual_producto,

        -- ✅ Stock disponible considerando todas las reservas
        almacen.calcular_stock_disponible(p.id_producto) as stock_disponible_real,

        -- ✅ Información de reserva para este pedido
        r.id_reserva,
        r.cantidad_reservada,
        r.estado as estado_reserva,
        r.fecha_reserva,

        -- ✅ Indicador si requiere fabricación
        CASE
          WHEN r.cantidad_reservada IS NOT NULL THEN
            (dp.cantidad_solicitada - dp.cantidad_despachada) > r.cantidad_reservada
          ELSE
            (dp.cantidad_solicitada - dp.cantidad_despachada) > almacen.calcular_stock_disponible(p.id_producto)
        END as requiere_fabricacion

      FROM ventas.detalle_pedidos_cliente dp
      LEFT JOIN almacen.productos p ON dp.producto_id = p.id_producto
      LEFT JOIN public.unidades_medida um ON p.id_unidad = um.id_unidades
      LEFT JOIN ventas.detalle_cotizacion dc ON dp.id_detalle_cotizacion = dc.id_detalle_cotizacion
      LEFT JOIN almacen.reservas_stock r ON dp.id_detalle_pedido = r.id_detalle_pedido
        AND r.estado = 'ACTIVA'
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

    // Usar la función auxiliar reutilizable para crear el pedido
    const pedidoCompleto = await crearPedidoDesdeCotizacion(
      id_cotizacion,
      usuario_id,
      {
        fecha_entrega_prevista,
        lugar_entrega,
        observaciones,
      }
    );

    await pool.query("COMMIT");

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

// =====================================================
// FUNCIÓN AUXILIAR REUTILIZABLE PARA CREAR PEDIDO DESDE COTIZACIÓN
// =====================================================
/**
 * Crea un pedido desde una cotización aprobada
 * @param {number} id_cotizacion - ID de la cotización
 * @param {number} usuario_id - ID del usuario que crea el pedido
 * @param {object} opciones - Opciones adicionales (fecha_entrega_prevista, lugar_entrega, observaciones)
 * @returns {object} - Pedido completo recién creado
 */
const crearPedidoDesdeCotizacion = async (
  id_cotizacion,
  usuario_id,
  opciones = {}
) => {
  const {
    fecha_entrega_prevista = null,
    lugar_entrega = null,
    observaciones = null,
  } = opciones;

  // Verificar que la cotización existe y está aprobada
  const cotizacionQuery = `
    SELECT * FROM ventas.cotizacion_cliente 
    WHERE id_cotizacion = $1 AND estado = 'APROBADO'
  `;

  const cotizacionResult = await pool.query(cotizacionQuery, [id_cotizacion]);

  if (cotizacionResult.rows.length === 0) {
    throw new Error("La cotización no existe o no está aprobada");
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
    throw new Error("Ya existe un pedido para esta cotización");
  }

  // Obtener el documento para pedidos
  const documentoQuery = `
    SELECT id_documento FROM public.documentos WHERE codigo = 'PED'
  `;

  const documentoResult = await pool.query(documentoQuery);

  if (documentoResult.rows.length === 0) {
    throw new Error("No se encontró el documento tipo PED (Pedidos)");
  }

  const id_documento = documentoResult.rows[0].id_documento;

  // ✅ Calcular importe_dolares si no está presente en la cotización
  let importe_dolares_calculado = cotizacion.importe_dolares || 0.00;

  // Si la cotización no tiene importe_dolares pero tiene tipo_cambio, calcularlo ahora
  if ((!cotizacion.importe_dolares || cotizacion.importe_dolares === 0) && cotizacion.tipo_cambio && cotizacion.tipo_cambio > 0) {
    importe_dolares_calculado = parseFloat((cotizacion.total / cotizacion.tipo_cambio).toFixed(2));
  }


  // ✅ ACTUALIZADO: Insertar cabecera del pedido con tipo_cambio_id, tipo_cambio e importe_dolares
  const insertPedidoQuery = `
    INSERT INTO ventas.pedidos_cliente (
      id_documento,
      id_cotizacion,
      fecha,
      id_cliente,
      codigo_cliente,
      nro_documento_cliente,
      razon_social_cliente,
      direccion_cliente,
      telefono_cliente,
      vendedor,
      moneda_id,
      tipo_cambio_id,
      tipo_cambio,
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
      importe_dolares,
      observaciones,
      created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
    RETURNING id_pedido, numero
  `;

  const pedidoValues = [
    id_documento,
    cotizacion.id_cotizacion,
    new Date(),
    cotizacion.id_cliente,
    cotizacion.codigo_cliente,
    cotizacion.nro_documento_cliente,
    cotizacion.razon_social_cliente,
    cotizacion.direccion_cliente,
    cotizacion.telefono_cliente,
    cotizacion.vendedor,
    cotizacion.moneda_id,
    cotizacion.tipo_cambio_id || null, // ✅ Manejo explícito de NULL
    parseFloat(cotizacion.tipo_cambio || 0.0000), // ✅ Convertir a número
    cotizacion.forma_pago,
    fecha_entrega_prevista || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    lugar_entrega,
    cotizacion.prioridad,
    parseFloat(cotizacion.importe_bruto || 0),
    parseFloat(cotizacion.monto_descuento || 0),
    parseFloat(cotizacion.valor_venta || 0),
    cotizacion.igv_id,
    parseFloat(cotizacion.igv || 0),
    parseFloat(cotizacion.total || 0),
    importe_dolares_calculado, // ✅ Usar valor calculado
    observaciones ||
    `Pedido generado automáticamente desde cotización: ${cotizacion.numero}`,
    usuario_id,
  ];

  const pedidoResult = await pool.query(insertPedidoQuery, pedidoValues);
  const nuevoPedido = pedidoResult.rows[0];

  // Obtener detalles de la cotización
  const detallesCotizacionQuery = `
    SELECT 
      dc.*,
      p.stock_actual as stock_disponible,
      dc.precio_unitario as precio_original,
      (dc.cantidad * dc.precio_unitario) as precio_bruto
    FROM ventas.detalle_cotizacion dc
    LEFT JOIN almacen.productos p ON dc.producto_id = p.id_producto
    WHERE dc.cotizacion_id = $1
    ORDER BY dc.numitem
  `;

  const detallesCotizacionResult = await pool.query(detallesCotizacionQuery, [
    id_cotizacion,
  ]);

  // ✅ ACTUALIZADO: Insertar detalles del pedido con importe_dolares
  const detallesInsertados = [];

  for (const detalle of detallesCotizacionResult.rows) {
    // ✅ Calcular importe_dolares del detalle si no está presente
    let importe_dolares_detalle = detalle.importe_dolares || 0.00;

    // Si el detalle no tiene importe_dolares pero tenemos tipo_cambio, calcularlo
    if ((!detalle.importe_dolares || detalle.importe_dolares === 0) &&
      cotizacion.tipo_cambio && cotizacion.tipo_cambio > 0) {
      importe_dolares_detalle = parseFloat(((detalle.precio_total || 0) / cotizacion.tipo_cambio).toFixed(2));
    }

    const insertDetalleQuery = `
      INSERT INTO ventas.detalle_pedidos_cliente (
        pedido_id,
        id_detalle_cotizacion,
        numitem,
        producto_id,
        descripcion_producto,
        cantidad_solicitada,
        precio_unitario,
        descuento_1,
        descuento_2,
        descuento_monto,
        valor_venta,
        igv,
        precio_total,
        importe_dolares,
        fecha_entrega_item,
        precio_original,
        precio_bruto,
        stock_disponible
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING id_detalle_pedido
    `;

    const detalleValues = [
      nuevoPedido.id_pedido,
      detalle.id_detalle_cotizacion,
      detalle.numitem,
      detalle.producto_id,
      detalle.descripcion_producto,
      detalle.cantidad,
      parseFloat(detalle.precio_unitario || 0),
      parseFloat(detalle.descuento_1 || 0),
      parseFloat(detalle.descuento_2 || 0),
      parseFloat(detalle.descuento_monto || 0),
      parseFloat(detalle.valor_venta || 0),
      parseFloat(detalle.igv || 0),
      parseFloat(detalle.precio_total || 0),
      importe_dolares_detalle, // ✅ Usar valor calculado
      detalle.fecha_entrega,
      parseFloat(detalle.precio_original || detalle.precio_unitario || 0),
      parseFloat(detalle.precio_bruto || 0),
      parseFloat(detalle.stock_disponible || 0),
    ];

    const detalleResult = await pool.query(insertDetalleQuery, detalleValues);
    const id_detalle_pedido = detalleResult.rows[0].id_detalle_pedido;

    // ✅ NUEVA FUNCIONALIDAD: Reservar stock disponible
    if (detalle.producto_id) {
      try {
        const reservaQuery = `
          SELECT * FROM almacen.reservar_stock(
            $1::INTEGER,     -- id_detalle_pedido
            $2::INTEGER,     -- pedido_id
            $3::INTEGER,     -- producto_id
            $4::DECIMAL,     -- cantidad_a_reservar
            $5::INTEGER      -- usuario_id
          )
        `;

        const reservaResult = await pool.query(reservaQuery, [
          id_detalle_pedido,
          nuevoPedido.id_pedido,
          detalle.producto_id,
          detalle.cantidad,
          usuario_id
        ]);

        const reservaInfo = reservaResult.rows[0];

        detallesInsertados.push({
          id_detalle_pedido,
          producto_id: detalle.producto_id,
          cantidad_solicitada: detalle.cantidad,
          cantidad_reservada: reservaInfo.cantidad_reservada,
          cantidad_faltante: reservaInfo.cantidad_faltante,
          requiere_fabricacion: parseFloat(reservaInfo.cantidad_faltante) > 0,
          mensaje_reserva: reservaInfo.mensaje
        });
      } catch (error) {
        console.error(`Error al reservar stock para producto ${detalle.producto_id}:`, error);
        // Continuar con el siguiente detalle aunque falle la reserva
        detallesInsertados.push({
          id_detalle_pedido,
          producto_id: detalle.producto_id,
          cantidad_solicitada: detalle.cantidad,
          cantidad_reservada: 0,
          cantidad_faltante: detalle.cantidad,
          requiere_fabricacion: true,
          mensaje_reserva: 'Error al reservar stock'
        });
      }
    }
  }

  // Obtener el pedido completo recién creado
  const pedidoCompleto = await obtenerPedidoCompletoPorId(
    nuevoPedido.id_pedido
  );

  // ✅ Agregar información de reservas al pedido
  return {
    ...pedidoCompleto,
    reservas_info: detallesInsertados,
    requiere_orden_fabricacion: detallesInsertados.some(d => d.requiere_fabricacion)
  };
};

// Función auxiliar para obtener pedido completo (para reutilizar)
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

  const cabeceraResult = await pool.query(cabeceraQuery, [id_pedido]);

  const detalleQuery = `
    SELECT
      dp.*,
      p.codigo as producto_codigo,
      p.descripcion as producto_descripcion,
      um.siglas as unidad_medida,

      -- ✅ NUEVO: Stock real del producto
      COALESCE(p.stock_actual, 0) as stock_actual_producto,

      -- ✅ NUEVO: Stock disponible considerando todas las reservas
      almacen.calcular_stock_disponible(p.id_producto) as stock_disponible_real,

      -- ✅ NUEVO: Información de reserva para este pedido
      r.id_reserva,
      r.cantidad_reservada,
      r.estado as estado_reserva,
      r.fecha_reserva,

      -- ✅ NUEVO: Indicador si requiere fabricación
      CASE
        WHEN r.cantidad_reservada IS NOT NULL THEN
          (dp.cantidad_solicitada - dp.cantidad_despachada) > r.cantidad_reservada
        ELSE
          (dp.cantidad_solicitada - dp.cantidad_despachada) > almacen.calcular_stock_disponible(p.id_producto)
      END as requiere_fabricacion

    FROM ventas.detalle_pedidos_cliente dp
    LEFT JOIN almacen.productos p ON dp.producto_id = p.id_producto
    LEFT JOIN public.unidades_medida um ON p.id_unidad = um.id_unidades
    LEFT JOIN almacen.reservas_stock r ON dp.id_detalle_pedido = r.id_detalle_pedido
      AND r.estado = 'ACTIVA'
    WHERE dp.pedido_id = $1
    ORDER BY dp.numitem
  `;

  const detalleResult = await pool.query(detalleQuery, [id_pedido]);

  return {
    ...cabeceraResult.rows[0],
    detalles: detalleResult.rows,
  };
};

// Actualizar estado del pedido
const actualizarEstadoPedido = async (req, res) => {
  try {
    await pool.query("BEGIN");

    const { id } = req.params;
    const { estado } = req.body;

    const usuario_id = req.userId || 1;

    // Validar estado
    const estadosValidos = [
      "PENDIENTE",
      "EN PREPARACIÓN",
      "DESPACHADO",
      "ENTREGADO",
      "FACTURADO",
      "ANULADO",
    ];

    if (!estadosValidos.includes(estado)) {
      await pool.query("ROLLBACK");
      return res.status(400).json({
        error: "Estado inválido",
        estados_validos: estadosValidos,
      });
    }

    // Verificar que el pedido existe
    const pedidoExiste = await pool.query(
      "SELECT id_pedido FROM ventas.pedidos_cliente WHERE id_pedido = $1",
      [id]
    );

    if (pedidoExiste.rows.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    // Actualizar estado
    const updateQuery = `
      UPDATE ventas.pedidos_cliente 
      SET 
        estado = $1,
        updated_by = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id_pedido = $3
      RETURNING *
    `;

    await pool.query(updateQuery, [estado, usuario_id, id]);

    // ✅ NUEVA FUNCIONALIDAD: Liberar reservas si el pedido se anula
    let reservasLiberadas = 0;
    if (estado === 'ANULADO') {
      const liberarReservasQuery = `
        SELECT almacen.liberar_reservas_pedido($1, $2) as reservas_liberadas
      `;

      const liberarResult = await pool.query(liberarReservasQuery, [
        id,
        `Pedido anulado por usuario ${usuario_id}`
      ]);

      reservasLiberadas = liberarResult.rows[0].reservas_liberadas;
    }

    // ✅ NUEVA FUNCIONALIDAD: Marcar reservas como despachadas si el pedido se entrega
    if (estado === 'DESPACHADO' || estado === 'ENTREGADO') {
      // Marcar todas las reservas del pedido como despachadas
      await pool.query(`
        UPDATE almacen.reservas_stock
        SET estado = 'DESPACHADA',
            fecha_liberacion = CURRENT_TIMESTAMP
        WHERE pedido_id = $1
          AND estado = 'ACTIVA'
      `, [id]);
    }

    await pool.query("COMMIT");

    const pedidoActualizado = await obtenerPedidoCompletoPorId(id);

    res.json({
      message: "Estado del pedido actualizado correctamente",
      pedido: pedidoActualizado,
      ...(reservasLiberadas > 0 && {
        reservas_liberadas: reservasLiberadas,
        mensaje_adicional: `Se liberaron ${reservasLiberadas} reserva(s) de stock`
      })
    });
  } catch (error) {
    await pool.query("ROLLBACK");
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
    const { detalles } = req.body; // Array de {detalle_pedido_id, cantidad_despachada}

    const usuario_id = req.userId || 1;

    // Verificar que el pedido existe y su estado actual
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
          cantidad_despachada = $1,
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
        p.moneda_id,
        p.tipo_cambio_id,
        p.tipo_cambio,
        p.total,
        p.importe_dolares,
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
      GROUP BY p.id_pedido, p.numero, p.fecha, p.estado, p.moneda_id, p.tipo_cambio_id, p.tipo_cambio, p.total, p.importe_dolares, p.fecha_entrega_prevista, c.numero
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
        SUM(importe_dolares) as monto_total_dolares,
        AVG(total) as monto_promedio,
        AVG(tipo_cambio) as tipo_cambio_promedio,
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
        p.moneda_id,
        p.tipo_cambio,
        p.total,
        p.importe_dolares,
        COUNT(dp.id_detalle_pedido) as total_items,
        SUM(dp.cantidad_solicitada - dp.cantidad_despachada) as cantidad_pendiente
      FROM ventas.pedidos_cliente p
      LEFT JOIN ventas.detalle_pedidos_cliente dp ON p.id_pedido = dp.pedido_id
      WHERE p.estado IN ('PENDIENTE', 'EN PREPARACIÓN')
        AND (dp.cantidad_solicitada - dp.cantidad_despachada) > 0
      GROUP BY p.id_pedido, p.numero, p.fecha, p.razon_social_cliente, p.vendedor, p.fecha_entrega_prevista, p.moneda_id, p.tipo_cambio, p.total, p.importe_dolares
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

// ============================================================================
// NUEVAS FUNCIONES: GESTIÓN DE RESERVAS DE STOCK
// ============================================================================

// Obtener reservas de un pedido
const obtenerReservasPedido = async (req, res) => {
  const { id } = req.params; // id del pedido

  try {
    const reservasQuery = `
      SELECT
        r.id_reserva,
        r.pedido_id,
        r.producto_id,
        r.id_detalle_pedido,
        r.cantidad_reservada,
        r.fecha_reserva,
        r.fecha_liberacion,
        r.estado,
        r.observacion,
        p.codigo as codigo_producto,
        p.descripcion as descripcion_producto,
        p.stock_actual,
        dp.cantidad_solicitada,
        dp.cantidad_despachada,
        dp.numitem
      FROM almacen.reservas_stock r
      LEFT JOIN almacen.productos p ON r.producto_id = p.id_producto
      LEFT JOIN ventas.detalle_pedidos_cliente dp ON r.id_detalle_pedido = dp.id_detalle_pedido
      WHERE r.pedido_id = $1
      ORDER BY dp.numitem
    `;

    const result = await pool.query(reservasQuery, [id]);

    // Calcular resumen
    const resumen = {
      total_reservas: result.rows.length,
      reservas_activas: result.rows.filter(r => r.estado === 'ACTIVA').length,
      reservas_despachadas: result.rows.filter(r => r.estado === 'DESPACHADA').length,
      reservas_liberadas: result.rows.filter(r => r.estado === 'LIBERADA').length,
      cantidad_total_reservada: result.rows
        .filter(r => r.estado === 'ACTIVA')
        .reduce((sum, r) => sum + parseFloat(r.cantidad_reservada || 0), 0)
    };

    res.json({
      success: true,
      data: {
        pedido_id: id,
        reservas: result.rows,
        resumen
      }
    });
  } catch (error) {
    console.error('Error al obtener reservas del pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reservas del pedido',
      error: error.message
    });
  }
};

// Liberar manualmente reservas de un pedido
const liberarReservasPedido = async (req, res) => {
  const { id } = req.params; // id del pedido
  const { motivo } = req.body;
  const usuario_id = req.userId || 1;

  try {
    const motivoCompleto = motivo || `Liberación manual por usuario ${usuario_id}`;

    const liberarQuery = `
      SELECT almacen.liberar_reservas_pedido($1, $2) as reservas_liberadas
    `;

    const result = await pool.query(liberarQuery, [id, motivoCompleto]);
    const reservasLiberadas = result.rows[0].reservas_liberadas;

    if (reservasLiberadas === 0) {
      return res.json({
        success: true,
        message: 'No hay reservas activas para liberar',
        reservas_liberadas: 0
      });
    }

    res.json({
      success: true,
      message: `Se liberaron ${reservasLiberadas} reserva(s) de stock correctamente`,
      reservas_liberadas: reservasLiberadas
    });
  } catch (error) {
    console.error('Error al liberar reservas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al liberar reservas',
      error: error.message
    });
  }
};

// Obtener vista de stock con reservas
const obtenerStockConReservas = async (req, res) => {
  try {
    const query = `
      SELECT
        id_producto,
        codigo,
        descripcion,
        stock_actual,
        stock_reservado,
        stock_disponible,
        stock_minimo,
        stock_maximo,
        CASE
          WHEN stock_disponible <= stock_minimo THEN 'CRITICO'
          WHEN stock_disponible <= (stock_minimo * 1.5) THEN 'BAJO'
          ELSE 'OK'
        END as estado_stock
      FROM almacen.vista_stock_con_reservas
      ORDER BY codigo
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error al obtener stock con reservas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener stock con reservas',
      error: error.message
    });
  }
};

// =====================================================
// ✅ FUNCIONES PROFESIONALES PARA GUÍAS DE REMISIÓN
// =====================================================

/**
 * Obtener productos pendientes de un pedido filtrados por almacén
 * Para generar guías de remisión profesionales
 */
const obtenerProductosParaGuia = async (req, res) => {
  try {
    const { pedido_id } = req.params;
    const { almacen_id } = req.query;

    console.log(`📦 Obteniendo productos para guía - Pedido: ${pedido_id}, Almacén: ${almacen_id || 'Todos'}`);

    const query = `
      SELECT * FROM ventas.obtener_productos_para_guia($1, $2)
    `;

    const result = await pool.query(query, [pedido_id, almacen_id || null]);

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length,
      pedido_id: parseInt(pedido_id),
      almacen_id: almacen_id ? parseInt(almacen_id) : null
    });
  } catch (error) {
    console.error('❌ Error al obtener productos para guía:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos para guía de remisión',
      error: error.message
    });
  }
};

/**
 * Validar que una guía no mezcle productos de diferentes almacenes
 */
const validarAlmacenesGuia = async (req, res) => {
  try {
    const { detalles_pedido } = req.body;

    if (!detalles_pedido || !Array.isArray(detalles_pedido) || detalles_pedido.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar al menos un detalle de pedido'
      });
    }

    console.log(`🔍 Validando ${detalles_pedido.length} productos para guía`);

    const query = `
      SELECT * FROM ventas.validar_almacenes_guia($1::INTEGER[])
    `;

    const result = await pool.query(query, [detalles_pedido]);
    const validacion = result.rows[0];

    if (!validacion.es_valido) {
      return res.status(400).json({
        success: false,
        esValido: false,
        mensaje: validacion.mensaje,
        almacenesEncontrados: validacion.almacenes_encontrados
      });
    }

    res.json({
      success: true,
      esValido: true,
      mensaje: validacion.mensaje,
      almacenesEncontrados: validacion.almacenes_encontrados
    });
  } catch (error) {
    console.error('❌ Error al validar almacenes de guía:', error);
    res.status(500).json({
      success: false,
      message: 'Error al validar almacenes',
      error: error.message
    });
  }
};

/**
 * Obtener resumen de almacenes de un pedido
 * Muestra cuántos productos hay en cada almacén
 */
const obtenerResumenAlmacenesPedido = async (req, res) => {
  try {
    const { pedido_id } = req.params;

    console.log(`📊 Obteniendo resumen de almacenes para pedido: ${pedido_id}`);

    const query = `
      SELECT * FROM ventas.resumen_almacenes_pedido($1)
    `;

    const result = await pool.query(query, [pedido_id]);

    // Calcular totales
    const totales = {
      totalProductos: result.rows.reduce((sum, row) => sum + parseInt(row.cantidad_productos), 0),
      totalCantidad: result.rows.reduce((sum, row) => sum + parseFloat(row.cantidad_total || 0), 0),
      totalValor: result.rows.reduce((sum, row) => sum + parseFloat(row.valor_total || 0), 0),
      cantidadAlmacenes: result.rows.length
    };

    res.json({
      success: true,
      data: result.rows,
      totales,
      pedido_id: parseInt(pedido_id),
      requiereMultiplesGuias: result.rows.length > 1
    });
  } catch (error) {
    console.error('❌ Error al obtener resumen de almacenes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen de almacenes del pedido',
      error: error.message
    });
  }
};

module.exports = {
  obtenerPedidos,
  obtenerPedidoPorId,
  convertirCotizacionAPedido,
  crearPedidoDesdeCotizacion, // FUNCIÓN EXPORTADA
  actualizarEstadoPedido,
  actualizarCantidadesDespachadas,
  obtenerPedidosPorCliente,
  obtenerEstadisticasPedidos,
  generarReportePedidosPendientes,
  // ✅ NUEVAS FUNCIONES DE RESERVAS
  obtenerReservasPedido,
  liberarReservasPedido,
  obtenerStockConReservas,
  // ✅ NUEVAS FUNCIONES PROFESIONALES PARA GUÍAS
  obtenerProductosParaGuia,
  validarAlmacenesGuia,
  obtenerResumenAlmacenesPedido,
};