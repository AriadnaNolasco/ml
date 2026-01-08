const pool = require("../config/db");

/**
 * ============================================================================
 * CONTROLADOR DE ÓRDENES DE FABRICACIÓN
 * ============================================================================
 * Adaptado a la estructura de base de datos del usuario
 * Tablas: ventas.pedidos_cliente, ventas.detalle_pedidos_cliente
 * ============================================================================
 */

// ============================================================================
// ANÁLISIS DE DISPONIBILIDAD: Verificar qué productos tienen stock
// ============================================================================
const analizarDisponibilidadPedido = async (req, res) => {
  const { id } = req.params; // id del pedido

  try {
    // Verificar que el pedido existe
    const pedidoResult = await pool.query(
      `SELECT 
        p.id_pedido,
        p.numero,
        p.estado,
        p.id_cliente,
        p.razon_social_cliente,
        p.total
      FROM ventas.pedidos_cliente p
      WHERE p.id_pedido = $1`,
      [id]
    );

    if (pedidoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado",
      });
    }

    const pedido = pedidoResult.rows[0];

    // Obtener detalle del pedido con análisis de stock
    // ✅ ACTUALIZADO: Considera reservas de stock
    const detalleResult = await pool.query(
      `SELECT
        dp.id_detalle_pedido as id,
        dp.numitem as num_item,
        dp.producto_id,
        pr.codigo as codigo_producto,
        pr.descripcion,
        um.codigo as unidad_medida,
        dp.cantidad_solicitada as cantidad,
        dp.cantidad_despachada,
        dp.precio_unitario,
        dp.precio_total as subtotal,

        -- Stock actual del producto
        COALESCE(pr.stock_actual, 0) as stock_actual,

        -- ✅ NUEVO: Stock reservado para este pedido
        COALESCE(r.cantidad_reservada, 0) as stock_reservado,

        -- ✅ NUEVO: Stock disponible real (sin contar otras reservas)
        almacen.calcular_stock_disponible(pr.id_producto) as stock_disponible,

        -- ✅ ACTUALIZADO: Análisis de disponibilidad considerando reservas
        CASE
          -- Si ya hay reserva para este pedido, usar esa cantidad
          WHEN r.cantidad_reservada IS NOT NULL AND r.cantidad_reservada > 0 THEN
            CASE
              WHEN r.cantidad_reservada >= (dp.cantidad_solicitada - dp.cantidad_despachada)
              THEN 'DISPONIBLE'
              ELSE 'PARCIAL'
            END
          -- Si no hay reserva, verificar stock disponible
          WHEN almacen.calcular_stock_disponible(pr.id_producto) >= (dp.cantidad_solicitada - dp.cantidad_despachada)
          THEN 'DISPONIBLE'
          WHEN almacen.calcular_stock_disponible(pr.id_producto) > 0
          THEN 'PARCIAL'
          ELSE 'NO_DISPONIBLE'
        END as estado_disponibilidad,

        -- ✅ ACTUALIZADO: Cantidad que se puede despachar (considerando reservas)
        CASE
          WHEN r.cantidad_reservada IS NOT NULL THEN
            LEAST(
              r.cantidad_reservada,
              dp.cantidad_solicitada - dp.cantidad_despachada
            )
          ELSE
            LEAST(
              almacen.calcular_stock_disponible(pr.id_producto),
              dp.cantidad_solicitada - dp.cantidad_despachada
            )
        END as cantidad_disponible_despacho,

        -- ✅ ACTUALIZADO: Cantidad que requiere fabricación (considerando reservas)
        CASE
          WHEN r.cantidad_reservada IS NOT NULL THEN
            GREATEST(
              0,
              (dp.cantidad_solicitada - dp.cantidad_despachada) - r.cantidad_reservada
            )
          ELSE
            GREATEST(
              0,
              (dp.cantidad_solicitada - dp.cantidad_despachada) - almacen.calcular_stock_disponible(pr.id_producto)
            )
        END as cantidad_requiere_fabricacion

      FROM ventas.detalle_pedidos_cliente dp
      LEFT JOIN almacen.productos pr ON dp.producto_id = pr.id_producto
      LEFT JOIN public.unidades_medida um ON pr.id_unidad = um.id_unidades
      LEFT JOIN almacen.reservas_stock r ON dp.id_detalle_pedido = r.id_detalle_pedido
        AND r.estado = 'ACTIVA'
      WHERE dp.pedido_id = $1
      ORDER BY dp.numitem`,
      [id]
    );

    const items = detalleResult.rows;

    // Calcular resumen de disponibilidad
    const resumen = {
      total_items: items.length,
      items_disponibles: items.filter(
        (i) => i.estado_disponibilidad === "DISPONIBLE"
      ).length,
      items_parciales: items.filter(
        (i) => i.estado_disponibilidad === "PARCIAL"
      ).length,
      items_no_disponibles: items.filter(
        (i) => i.estado_disponibilidad === "NO_DISPONIBLE"
      ).length,
      requiere_fabricacion: items.some(
        (i) => parseFloat(i.cantidad_requiere_fabricacion) > 0
      ),
      puede_despachar_parcial: items.some(
        (i) => parseFloat(i.cantidad_disponible_despacho) > 0
      ),
      puede_despachar_completo: items.every(
        (i) => i.estado_disponibilidad === "DISPONIBLE"
      ),
    };

    res.json({
      success: true,
      data: {
        pedido,
        items,
        resumen,
      },
    });
  } catch (error) {
    console.error("Error al analizar disponibilidad:", error);
    res.status(500).json({
      success: false,
      message: "Error al analizar disponibilidad del pedido",
      error: error.message,
    });
  }
};

// ============================================================================
// GENERAR ORDEN DE FABRICACIÓN: Solo para productos sin stock
// ============================================================================
const generarOrdenFabricacion = async (req, res) => {
  const { pedido_id } = req.body;
  const usuario_id = req.userId || 1;

  try {
    await pool.query("BEGIN");

    // 1. Verificar que NO exista ya una orden de fabricación para este pedido
    const ordenExistenteResult = await pool.query(
      `SELECT
        id_ord,
        numero_ord,
        estado_orden
      FROM ventas.orden_fabricacion
      WHERE pedido_id = $1
      LIMIT 1`,
      [pedido_id]
    );

    if (ordenExistenteResult.rows.length > 0) {
      await pool.query("ROLLBACK");
      const ordenExistente = ordenExistenteResult.rows[0];
      return res.status(400).json({
        success: false,
        message: `Ya existe una orden de fabricación para este pedido`,
        data: {
          numero_orden: ordenExistente.numero_ord,
          estado: ordenExistente.estado_orden,
          id_orden: ordenExistente.id_ord
        }
      });
    }

    // 2. Verificar que el pedido existe y está pendiente
    const pedidoResult = await pool.query(
      `SELECT
        p.id_pedido,
        p.numero as numero_pedido,
        p.estado,
        p.id_cliente,
        p.fecha
      FROM ventas.pedidos_cliente p
      WHERE p.id_pedido = $1`,
      [pedido_id]
    );

    if (pedidoResult.rows.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado",
      });
    }

    const pedido = pedidoResult.rows[0];

    if (pedido.estado !== "PENDIENTE") {
      await pool.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: `El pedido está en estado ${pedido.estado}. Solo se pueden generar órdenes de fabricación para pedidos PENDIENTES`,
      });
    }

    // 3. Obtener items que requieren fabricación (sin stock suficiente)
    // ✅ ACTUALIZADO: Considera reservas de stock
    const itemsResult = await pool.query(
      `SELECT
        dp.id_detalle_pedido as id,
        dp.numitem as num_item,
        dp.producto_id,
        pr.codigo as codigo_producto,
        pr.descripcion,
        um.codigo as unidad_medida,
        dp.cantidad_solicitada as cantidad,
        dp.cantidad_despachada,

        -- Stock actual del producto
        COALESCE(pr.stock_actual, 0) as stock_actual,

        -- ✅ NUEVO: Stock reservado para este pedido
        COALESCE(r.cantidad_reservada, 0) as stock_reservado,

        -- ✅ NUEVO: Stock disponible real (sin otras reservas)
        almacen.calcular_stock_disponible(pr.id_producto) as stock_disponible,

        -- ✅ ACTUALIZADO: Cantidad que requiere fabricación (considerando reservas)
        CASE
          -- Si hay reserva para este pedido, restar la reserva de la cantidad pendiente
          WHEN r.cantidad_reservada IS NOT NULL THEN
            GREATEST(
              0,
              (dp.cantidad_solicitada - dp.cantidad_despachada) - r.cantidad_reservada
            )
          -- Si no hay reserva, calcular con stock disponible
          ELSE
            GREATEST(
              0,
              (dp.cantidad_solicitada - dp.cantidad_despachada) - almacen.calcular_stock_disponible(pr.id_producto)
            )
        END as cantidad_fabricar

      FROM ventas.detalle_pedidos_cliente dp
      LEFT JOIN almacen.productos pr ON dp.producto_id = pr.id_producto
      LEFT JOIN public.unidades_medida um ON pr.id_unidad = um.id_unidades
      LEFT JOIN almacen.reservas_stock r ON dp.id_detalle_pedido = r.id_detalle_pedido
        AND r.estado = 'ACTIVA'
      WHERE dp.pedido_id = $1
        AND (
          -- Hay reserva pero no cubre todo
          (r.cantidad_reservada IS NOT NULL AND (dp.cantidad_solicitada - dp.cantidad_despachada) > r.cantidad_reservada)
          OR
          -- No hay reserva y el stock disponible no cubre todo
          (r.cantidad_reservada IS NULL AND (dp.cantidad_solicitada - dp.cantidad_despachada) > almacen.calcular_stock_disponible(pr.id_producto))
        )
      ORDER BY dp.numitem`,
      [pedido_id]
    );

    if (itemsResult.rows.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message:
          "No hay productos que requieran fabricación. Todos los items tienen stock disponible.",
      });
    }

    // 4. Obtener ID del documento OF (Orden de Fabricación)
    const documentoResult = await pool.query(
      `SELECT id_documento
       FROM public.documentos
       WHERE codigo = 'O/F'
       LIMIT 1`
    );

    if (documentoResult.rows.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(500).json({
        success: false,
        message: "No se encontró el tipo de documento OF (Orden de Fabricación)",
      });
    }

    const documento_id = documentoResult.rows[0].id_documento;

    // 4. Generar número de orden de fabricación
    const ultimaOrdenResult = await pool.query(
      `SELECT numero_ord 
       FROM ventas.orden_fabricacion 
       WHERE numero_ord LIKE 'OF-%'
       ORDER BY id_ord DESC 
       LIMIT 1`
    );

    let numero_ord;
    if (ultimaOrdenResult.rows.length === 0) {
      numero_ord = "OF-0001";
    } else {
      const ultimoNumero = parseInt(
        ultimaOrdenResult.rows[0].numero_ord.split("-")[1]
      );
      numero_ord = `OF-${String(ultimoNumero + 1).padStart(4, "0")}`;
    }

    // 5. Crear la orden de fabricación
    const ordenResult = await pool.query(
      `INSERT INTO ventas.orden_fabricacion (
        documento_id,
        numero_ord,
        pedido_id,
        cliente_id,
        fecha_emision,
        prioridad,
        estado_orden,
        observaciones,
        usuario_registro,
        fecha_registro
      ) VALUES ($1, $2, $3, $4, CURRENT_DATE, 'NORMAL', 'PROGRAMADA',
                'Orden generada automáticamente desde pedido ' || $5,
                (SELECT username FROM public.usuarios WHERE id = $6),
                NOW())
      RETURNING id_ord, numero_ord`,
      [
        documento_id,
        numero_ord,
        pedido_id,
        pedido.id_cliente,
        pedido.numero_pedido,
        usuario_id,
      ]
    );

    const ordenFabricacion = ordenResult.rows[0];

    // 6. Insertar detalle de la orden (solo productos que requieren fabricación)
    for (let i = 0; i < itemsResult.rows.length; i++) {
      const item = itemsResult.rows[i];

      await pool.query(
        `INSERT INTO ventas.orden_fab_detalle (
          id_ord,
          num_item,
          producto_id,
          descripcion,
          unidad_medida,
          cantidad,
          cantidad_producida,
          estado,
          usuario_registro,
          fecha_registro
        ) VALUES ($1, $2, $3, $4, $5, $6, 0, 'PENDIENTE',
                  (SELECT username FROM public.usuarios WHERE id = $7),
                  NOW())`,
        [
          ordenFabricacion.id_ord,
          i + 1,
          item.producto_id,
          item.descripcion,
          item.unidad_medida,
          item.cantidad_fabricar,
          usuario_id,
        ]
      );
    }

    // 7. Actualizar estado del pedido a 'EN PREPARACIÓN' (fabricación en curso)
    await pool.query(
      `UPDATE ventas.pedidos_cliente
       SET estado = 'EN PREPARACIÓN',
           updated_at = NOW(),
           updated_by = $2
       WHERE id_pedido = $1`,
      [pedido_id, usuario_id]
    );

    await pool.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Orden de fabricación generada exitosamente",
      data: {
        orden_fabricacion: ordenFabricacion,
        items_fabricacion: itemsResult.rows.length,
        pedido_actualizado: {
          id_pedido: pedido.id_pedido,
          numero_pedido: pedido.numero_pedido,
          estado_anterior: "PENDIENTE",
          estado_nuevo: "EN PREPARACIÓN",
        },
      },
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error al generar orden de fabricación:", error);
    res.status(500).json({
      success: false,
      message: "Error al generar orden de fabricación",
      error: error.message,
    });
  }
};

// ============================================================================
// LISTAR ÓRDENES DE FABRICACIÓN
// ============================================================================
const obtenerOrdenesFabricacion = async (req, res) => {
  try {
    const { estado, cliente_id, fecha_desde, fecha_hasta, prioridad } =
      req.query;

    let query = `
      SELECT
        of.id_ord as id_ord_fab,
        of.numero_ord,
        of.pedido_id,
        p.numero as numero_pedido,
        of.cliente_id,
        c.razon_social as razon_social_cliente,
        of.fecha_emision as fecha_creacion,
        of.prioridad,
        of.estado_orden as estado,
        of.observaciones,
        of.usuario_registro,
        of.fecha_registro,
        NULL as fecha_inicio_real,
        NULL as fecha_fin_real,

        -- Resumen de items
        COUNT(ofd.id) as total_items,
        COUNT(CASE WHEN ofd.estado = 'TERMINADO' THEN 1 END) as items_terminados,
        SUM(ofd.cantidad) as cantidad_total,
        SUM(ofd.cantidad_producida) as cantidad_producida_total

      FROM ventas.orden_fabricacion of
      LEFT JOIN ventas.pedidos_cliente p ON of.pedido_id = p.id_pedido
      LEFT JOIN ventas.clientes c ON of.cliente_id = c.id_cliente
      LEFT JOIN ventas.orden_fab_detalle ofd ON of.id_ord = ofd.id_ord
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (estado) {
      query += ` AND of.estado_orden = $${paramIndex}`;
      params.push(estado);
      paramIndex++;
    }

    if (cliente_id) {
      query += ` AND of.cliente_id = $${paramIndex}`;
      params.push(cliente_id);
      paramIndex++;
    }

    if (prioridad) {
      query += ` AND of.prioridad = $${paramIndex}`;
      params.push(prioridad);
      paramIndex++;
    }

    if (fecha_desde) {
      query += ` AND of.fecha_emision >= $${paramIndex}`;
      params.push(fecha_desde);
      paramIndex++;
    }

    if (fecha_hasta) {
      query += ` AND of.fecha_emision <= $${paramIndex}`;
      params.push(fecha_hasta);
      paramIndex++;
    }

    query += `
      GROUP BY
        of.id_ord,
        of.numero_ord,
        of.pedido_id,
        p.numero,
        of.cliente_id,
        c.razon_social,
        of.fecha_emision,
        of.prioridad,
        of.estado_orden,
        of.observaciones,
        of.usuario_registro,
        of.fecha_registro
      ORDER BY of.fecha_emision DESC, of.id_ord DESC
    `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error("Error al obtener órdenes de fabricación:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener órdenes de fabricación",
      error: error.message,
    });
  }
};

// ============================================================================
// OBTENER DETALLE DE ORDEN DE FABRICACIÓN
// ============================================================================
const obtenerOrdenFabricacionPorId = async (req, res) => {
  const { id } = req.params;

  try {
    // Obtener cabecera
    const ordenResult = await pool.query(
      `SELECT
        of.id_ord as id_ord_fab,
        of.numero_ord,
        of.pedido_id,
        p.numero as numero_pedido,
        of.cliente_id,
        c.razon_social as razon_social_cliente,
        of.fecha_emision as fecha_creacion,
        of.prioridad,
        of.estado_orden as estado,
        of.observaciones,
        of.usuario_registro,
        of.usuario_modifica,
        of.fecha_registro,
        of.fecha_modifica,
        NULL as fecha_inicio_real,
        NULL as fecha_fin_real
      FROM ventas.orden_fabricacion of
      LEFT JOIN ventas.pedidos_cliente p ON of.pedido_id = p.id_pedido
      LEFT JOIN ventas.clientes c ON of.cliente_id = c.id_cliente
      WHERE of.id_ord = $1`,
      [id]
    );

    if (ordenResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Orden de fabricación no encontrada",
      });
    }

    // Obtener detalle
    const detalleResult = await pool.query(
      `SELECT
        ofd.id as id_detalle_ord_fab,
        ofd.num_item,
        ofd.producto_id,
        pr.codigo as codigo_producto,
        ofd.descripcion,
        ofd.unidad_medida,
        ofd.prioridad,
        ofd.cantidad as cantidad_requerida,
        ofd.cantidad_producida,
        ofd.cantidad_pendiente,
        ofd.cantidad_defectuosa,
        ofd.centro_costo,
        cc.nombre as nombre_centro_costo,
        ofd.estado as estado_item,
        ofd.fecha_inicio_item,
        ofd.fecha_fin_item,
        ofd.usuario_registro,
        ofd.fecha_registro,

        -- Progreso
        CASE
          WHEN ofd.cantidad > 0
          THEN ROUND((ofd.cantidad_producida / ofd.cantidad * 100)::numeric, 2)
          ELSE 0
        END as porcentaje_avance

      FROM ventas.orden_fab_detalle ofd
      LEFT JOIN almacen.productos pr ON ofd.producto_id = pr.id_producto
      LEFT JOIN contabilidad.c_costo cc ON ofd.centro_costo = cc.id_c_costo
      WHERE ofd.id_ord = $1
      ORDER BY ofd.num_item`,
      [id]
    );

    const orden = ordenResult.rows[0];
    const items = detalleResult.rows;

    res.json({
      success: true,
      data: {
        ...orden,
        items: items,
      },
    });
  } catch (error) {
    console.error("Error al obtener orden de fabricación:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener orden de fabricación",
      error: error.message,
    });
  }
};

// ============================================================================
// ACTUALIZAR ESTADO DE ORDEN DE FABRICACIÓN
// ============================================================================
const actualizarEstadoOrdenFabricacion = async (req, res) => {
  const { id } = req.params;
  const { estado, estado_orden, observaciones } = req.body;
  const nuevoEstado = estado || estado_orden; // Aceptar ambos nombres
  const usuario_id = req.userId || 1;

  try {
    await pool.query("BEGIN");

    // Validar estados permitidos
    const estadosValidos = [
      "PROGRAMADA",
      "EN_PROCESO",
      "PAUSADA",
      "TERMINADA",
      "ANULADA",
    ];

    if (!estadosValidos.includes(nuevoEstado)) {
      await pool.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: `Estado inválido. Estados permitidos: ${estadosValidos.join(", ")}`,
      });
    }

    const result = await pool.query(
      `UPDATE ventas.orden_fabricacion
       SET estado_orden = $1,
           observaciones = COALESCE($2, observaciones),
           usuario_modifica = (SELECT username FROM public.usuarios WHERE id = $3),
           fecha_modifica = NOW()
       WHERE id_ord = $4
       RETURNING *`,
      [nuevoEstado, observaciones, usuario_id, id]
    );

    if (result.rows.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Orden de fabricación no encontrada",
      });
    }

    await pool.query("COMMIT");

    res.json({
      success: true,
      message: "Estado actualizado correctamente",
      data: result.rows[0],
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error al actualizar estado:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar estado de orden de fabricación",
      error: error.message,
    });
  }
};

// ============================================================================
// ACTUALIZAR CANTIDAD PRODUCIDA
// ============================================================================
const actualizarCantidadProducida = async (req, res) => {
  const { id } = req.params; // id del detalle
  const { cantidad_producida, cantidad_defectuosa } = req.body;
  const usuario_id = req.userId || 1;

  try {
    await pool.query("BEGIN");

    // Validar que la cantidad no exceda lo solicitado
    const detalleResult = await pool.query(
      `SELECT cantidad, cantidad_producida as cant_actual
       FROM ventas.orden_fab_detalle
       WHERE id = $1`,
      [id]
    );

    if (detalleResult.rows.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Detalle de orden no encontrado",
      });
    }

    const detalle = detalleResult.rows[0];
    const nueva_cantidad_producida =
      parseFloat(cantidad_producida) || parseFloat(detalle.cant_actual);
    const nueva_cantidad_defectuosa = parseFloat(cantidad_defectuosa) || 0;

    if (nueva_cantidad_producida > parseFloat(detalle.cantidad)) {
      await pool.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: `La cantidad producida (${nueva_cantidad_producida}) no puede exceder la cantidad solicitada (${detalle.cantidad})`,
      });
    }

    // Actualizar detalle
    const updateResult = await pool.query(
      `UPDATE ventas.orden_fab_detalle 
       SET cantidad_producida = $1,
           cantidad_defectuosa = $2,
           estado = CASE 
             WHEN $1 >= cantidad THEN 'TERMINADO'
             WHEN $1 > 0 THEN 'EN_PROCESO'
             ELSE estado
           END,
           fecha_fin_item = CASE 
             WHEN $1 >= cantidad THEN NOW()
             ELSE fecha_fin_item
           END,
           usuario_modifica = (SELECT username FROM public.usuarios WHERE id = $3),
           fecha_modifica = NOW()
       WHERE id = $4
       RETURNING *`,
      [nueva_cantidad_producida, nueva_cantidad_defectuosa, usuario_id, id]
    );

    await pool.query("COMMIT");

    res.json({
      success: true,
      message: "Cantidad producida actualizada correctamente",
      data: updateResult.rows[0],
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error al actualizar cantidad producida:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar cantidad producida",
      error: error.message,
    });
  }
};

module.exports = {
  analizarDisponibilidadPedido,
  generarOrdenFabricacion,
  obtenerOrdenesFabricacion,
  obtenerOrdenFabricacionPorId,
  actualizarEstadoOrdenFabricacion,
  actualizarCantidadProducida,
};