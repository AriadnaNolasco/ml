const db = require('../config/db');
const PDFDocument = require("pdfkit");

const notasController = {

    /* ============================================================
    OBTENER TODAS LAS NOTAS
    ============================================================ */
    getNotas : async (req, res) => {
        try {
            const { tipo } = req.query; // INGRESO / SALIDA (opcional)

            let filter = "";
            if (tipo === "INGRESO") {
            filter = " AND d.tipo_movimiento = 'INGRESO' ";
            }
            if (tipo === "SALIDA") {
            filter = " AND d.tipo_movimiento = 'SALIDA' ";
            }
            if (tipo === "TRANSFERENCIA") filter = " AND TRIM(d.codigo) = 'NT' ";

            const sql = `
            SELECT 
                n.id_nota,
                n.numero,
                n.origen,
                n.estado,
                n.fecha_nota,

                -- Documento interno
                d.codigo AS documento_codigo,
                d.nombre AS documento_nombre,

                -- Operación
                op.nombre AS operacion_nombre,

                -- Almacenes
                a1.nombre AS almacen_salida_nombre,
                a2.nombre AS almacen_destino_nombre

            FROM almacen.notas n
            INNER JOIN public.documentos d ON d.id_documento = n.documento_interno_id
            INNER JOIN public.cod_operacion op ON op.id_cod_operacion = n.cod_operacion
            LEFT JOIN almacen.almacenes a1 ON a1.id_alm = n.almacen_salida
            LEFT JOIN almacen.almacenes a2 ON a2.id_alm = n.almacen_destino
            WHERE 1=1
            ${filter}
            ORDER BY n.id_nota DESC
            `;

            const result = await db.query(sql);
            res.json(result.rows);

        } catch (error) {
            console.error("❌ Error al obtener notas:", error);
            res.status(500).json({ error: "Error al obtener notas" });
        }
    },



    /* ============================================================
    OBTENER NOTA POR ID (CABECERA + DETALLE)
    ============================================================ */
    getNotaById : async (req, res) => {
        try {
            const { id } = req.params;

            /* CABECERA */
            const sqlCab = `
            SELECT 
                n.*,
                d.codigo AS documento_codigo,
                d.nombre AS documento_nombre,
                op.nombre AS operacion_nombre,
                a1.nombre AS almacen_salida_nombre,
                a2.nombre AS almacen_destino_nombre,
                cli.razon_social AS cliente_nombre,
                prov.razon_social AS proveedor_nombre
            FROM almacen.notas n
            INNER JOIN public.documentos d ON d.id_documento = n.documento_interno_id
            INNER JOIN public.cod_operacion op ON op.id_cod_operacion = n.cod_operacion
            LEFT JOIN almacen.almacenes a1 ON a1.id_alm = n.almacen_salida
            LEFT JOIN almacen.almacenes a2 ON a2.id_alm = n.almacen_destino
            LEFT JOIN ventas.clientes cli ON cli.id_cliente = n.cliente_id
            LEFT JOIN compras.proveedores prov ON prov.id_prov = n.proveedor_id
            WHERE n.id_nota = $1
            `;

            const cabecera = await db.query(sqlCab, [id]);

            if (cabecera.rows.length === 0) {
            return res.status(404).json({ error: "Nota no encontrada" });
            }

            /* DETALLE */
            const sqlDet = `
            SELECT 
                det.id,
                det.numitem,
                det.id_producto,
                p.codigo,
                p.descripcion,
                det.unidad_medida,
                det.cantidad,
                det.lote,
                det.serie_producto,
                det.fecha_vencimiento,
                det.comentario,
                det.orden_compra_detalle_id,
                a.nombre AS almacen_nombre
            FROM almacen.notas_detalle det
            INNER JOIN almacen.productos p ON p.id_producto = det.id_producto
            LEFT JOIN almacen.almacenes a ON a.id_alm = det.almacen_id
            WHERE det.id_nota = $1
            ORDER BY det.numitem
            `;

            const detalle = await db.query(sqlDet, [id]);

            res.json({
            cabecera: cabecera.rows[0],
            detalle: detalle.rows
            });

        } catch (error) {
            console.error("❌ Error al obtener nota por ID:", error);
            res.status(500).json({ error: "Error al obtener nota por ID" });
        }
    },

    // Obtener el siguiente número correlativo para una Nota según su documento
    getNextNotaNumero: async (req, res) => {
        try {
            const { documento_id } = req.query;

            if (!documento_id) {
                return res.status(400).json({ error: "El ID del documento es requerido" });
            }

            const sql = `
                SELECT numero
                FROM almacen.notas
                WHERE documento_interno_id = $1
                ORDER BY id_nota DESC
                LIMIT 1
            `;

            const { rows } = await db.query(sql, [documento_id]);

            let nextNumber = "000000001"; // valor inicial

            if (rows.length > 0) {
                const lastNumber = rows[0].numero;
                const numericPart = parseInt(lastNumber, 10);

                if (!isNaN(numericPart)) {
                    const incremented = numericPart + 1;
                    nextNumber = incremented.toString().padStart(9, "0");
                }
            }

            res.status(200).json({ next: nextNumber });
        } catch (error) {
            console.error("Error obteniendo correlativo de nota:", error);
            res.status(500).json({
                error: "Error interno al obtener número correlativo",
                details: error.message,
            });
        }
    },

    getOrdenesPorDocumento: async (req, res) => {
        try {
            const { codigo } = req.params;

            let tipo_oc = null;

            if (codigo === "NIC") tipo_oc = "LOCAL";
            if (codigo === "NIE") tipo_oc = "EXTERNO";

            if (!tipo_oc) {
                return res.status(400).json({ error: "Código de documento no válido" });
            }

            const sql = `
                SELECT 
                    oc.id,
                    oc.tipo,
                    oc.estado,
                    p.nomb_comercial AS proveedor_nombre
                FROM compras.orden_compra oc
                JOIN compras.proveedores p ON p.id_prov = oc.proveedor_id
                WHERE oc.tipo = $1
                AND oc.estado IN ('PENDIENTE', 'PARCIAL')
                ORDER BY oc.id DESC
            `;

            const { rows } = await db.query(sql, [tipo_oc]);

            res.json(rows);

        } catch (error) {
            console.error("Error en consulta SQL:", error);
            res.status(500).json({ error: "Error interno", details: error.message });
        }
    },

    getOrdenesCompraDisponibles : async (req, res) => {
        try {
            const { tipo } = req.query;

            if (!tipo || !["LOCAL", "EXTERNO"].includes(tipo.toUpperCase())) {
                return res.status(400).json({ message: "Tipo inválido. Debe ser LOCAL o EXTERNO." });
            }

            const sql = `
                SELECT 
                    oc.id,
                    oc.numero,
                    oc.fecha,
                    oc.tipo,
                    oc.estado,
                    d.codigo AS documento_codigo,
                    d.nombre AS documento_nombre,
                    oc.proveedor_id,
                    p.razon_social AS proveedor_nombre,
                    p.nro_documento AS proveedor_documento
                FROM compras.orden_compra oc
                JOIN compras.proveedores p ON p.id_prov = oc.proveedor_id
                JOIN public.documentos d ON d.id_documento = oc.id_documento
                WHERE oc.tipo = $1
                    AND oc.estado IN ('PENDIENTE', 'PARCIAL')
                ORDER BY oc.id DESC
            `;

            const result = await db.query(sql, [tipo.toUpperCase()]);

            return res.json(result.rows);

        } catch (error) {
            console.error("Error obteniendo órdenes disponibles:", error);
            res.status(500).json({ message: "Error en el servidor." });
        }
    },

    getOrdenesFabricacionDisponibles: async (req, res) => {
        try {
            const query = `
            SELECT
                ofa.id_ord,
                ofa.numero_ord,
                ofa.estado_orden,
                ofa.fecha_emision,
                ofa.prioridad,
                ofa.cliente_id,
                cli.razon_social AS cliente_nombre,

                -- Total pendiente (suma de pendientes de los ítems)
                COALESCE(SUM(ofd.cantidad_pendiente), 0) AS pendiente_total,

                -- Detalle: solo ítems con pendiente > 0
                COALESCE(
                json_agg(
                    json_build_object(
                    'id', ofd.id,
                    'num_item', ofd.num_item,
                    'producto_id', ofd.producto_id,
                    'producto_codigo', p.codigo,
                    'producto_nombre', p.descripcion,
                    'unidad_medida', ofd.unidad_medida,
                    'cantidad', ofd.cantidad,
                    'cantidad_producida', ofd.cantidad_producida,
                    'cantidad_pendiente', ofd.cantidad_pendiente,
                    'cantidad_defectuosa', ofd.cantidad_defectuosa,
                    'centro_costo', ofd.centro_costo,
                    'estado_item', ofd.estado,
                    'fecha_inicio_item', ofd.fecha_inicio_item,
                    'fecha_fin_item', ofd.fecha_fin_item
                    )
                    ORDER BY ofd.num_item
                ) FILTER (WHERE ofd.cantidad_pendiente > 0),
                '[]'::json
                ) AS detalles

            FROM ventas.orden_fabricacion ofa
            JOIN ventas.orden_fab_detalle ofd
                ON ofd.id_ord = ofa.id_ord
            LEFT JOIN ventas.clientes cli
                ON cli.id_cliente = ofa.cliente_id
            LEFT JOIN almacen.productos p
                ON p.id_producto = ofd.producto_id

            WHERE ofa.estado_orden IN ('PROGRAMADA','EN_PROCESO','PAUSADA')
                AND ofd.cantidad_pendiente > 0

            GROUP BY
                ofa.id_ord, ofa.numero_ord, ofa.estado_orden, ofa.fecha_emision,
                ofa.prioridad, ofa.cliente_id, cli.razon_social

            ORDER BY ofa.fecha_registro DESC;
            `;

            const { rows } = await db.query(query);

            return res.status(200).json({
            success: true,
            data: rows,
            });
        } catch (error) {
            console.error("getOrdenesFabricacionDisponibles error:", error);
            return res.status(500).json({
            success: false,
            message: "Error al listar órdenes de fabricación disponibles",
            error: error.message,
            });
        }
        },


    createNota: async (req, res) => {
        const client = await db.pool.connect();

        try {
            await client.query("BEGIN");

            const {
            documento_interno_id,
            numero,
            cod_operacion,
            orden_compra_id,
            cliente_id,
            proveedor_id,
            tipo_documento_id,
            serie,
            numero_documento,
            numero_guia,
            almacen_salida,
            almacen_destino,
            observaciones,
            items,
            estado, // <- se ignora (solo se valida)
            } = req.body;

            // ✅ createNota SIEMPRE crea en BORRADOR
            if (estado && estado.toUpperCase() !== "BORRADOR") {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message:
                "createNota solo crea en BORRADOR. Para confirmar use /almacen/notas/:id/confirmar.",
            });
            }
            const estadoInput = "BORRADOR";

            // 1️⃣ ORIGEN DESDE LA OPERACIÓN
            const opSql = `
            SELECT origen_default
            FROM public.cod_operacion
            WHERE id_cod_operacion = $1
            `;
            const opRes = await client.query(opSql, [cod_operacion]);
            if (opRes.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({ success: false, message: "Operación no válida" });
            }
            const origen = opRes.rows[0].origen_default || "INTERNO";

            // 2️⃣ INSERT CABECERA
            const cabSql = `
            INSERT INTO almacen.notas (
                documento_interno_id,
                numero,
                cod_operacion,
                origen,
                almacen_salida,
                almacen_destino,
                orden_compra_id,
                cliente_id,
                proveedor_id,
                tipo_documento_id,
                serie,
                numero_documento,
                numero_guia,
                estado,
                observaciones,
                usuario_registro
            )
            VALUES (
                $1,$2,$3,$4,
                $5,$6,
                $7,$8,$9,
                $10,$11,$12,$13,
                $14,$15,$16
            )
            RETURNING id_nota
            `;

            const userId = req.user?.id || null;

            const cabRes = await client.query(cabSql, [
            documento_interno_id,
            numero,
            cod_operacion,
            origen,
            almacen_salida || null,
            almacen_destino || null,
            orden_compra_id || null,
            cliente_id || null,
            proveedor_id || null,
            tipo_documento_id || null,
            serie || null,
            numero_documento || null,
            numero_guia || null,
            estadoInput,
            observaciones || null,
            userId,
            ]);

            const idNota = cabRes.rows[0].id_nota;

            // 3️⃣ INSERT DETALLE
            if (Array.isArray(items) && items.length > 0) {
            const detSql = `
                INSERT INTO almacen.notas_detalle (
                numitem,
                id_nota,
                orden_compra_detalle_id,
                almacen_id,
                id_producto,
                unidad_medida,
                cantidad,
                lote,
                serie_producto,
                fecha_vencimiento,
                comentario
                )
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            `;

            for (let i = 0; i < items.length; i++) {
                const it = items[i];
                await client.query(detSql, [
                i + 1,
                idNota,
                it.orden_compra_detalle_id || null,
                it.almacen_id || null,
                it.id_producto,
                it.unidad_medida,
                it.cantidad,
                it.lote || null,
                it.serie_producto || null,
                it.fecha_vencimiento || null,
                it.comentario || null,
                ]);
            }
            }

            await client.query("COMMIT");

            return res.status(201).json({
            success: true,
            message: "Nota creada correctamente (BORRADOR)",
            id_nota: idNota,
            });
        } catch (error) {
            await client.query("ROLLBACK");
            console.error("❌ Error al crear nota:", error);
            return res.status(500).json({
            success: false,
            message: "Error al crear nota",
            error: error.message,
            });
        } finally {
            client.release();
        }
    },

    confirmarNota: async (req, res) => {
        const client = await db.pool.connect();

        try {
            await client.query("BEGIN");

            const { id } = req.params;
            const userId = req.user?.id || null;

            // 1) Validar nota y estado BORRADOR + traer cabecera completa + tipo_movimiento del documento
            const cabSql = `
            SELECT
                n.*,
                TRIM(d.tipo_movimiento) AS tipo_movimiento,
                TRIM(d.codigo) AS documento_codigo
            FROM almacen.notas n
            JOIN public.documentos d ON d.id_documento = n.documento_interno_id
            WHERE n.id_nota = $1
            FOR UPDATE
            `;
            const cabRes = await client.query(cabSql, [id]);

            if (cabRes.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ success: false, message: "Nota no encontrada" });
            }

            const cab = cabRes.rows[0];

            if (cab.estado !== "BORRADOR") {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: "Solo se puede confirmar una nota en BORRADOR",
            });
            }

            // 2) Evitar duplicar movimiento para la misma nota
            const movExist = await client.query(
            `SELECT id_movimiento FROM almacen.movimientos WHERE id_nota = $1`,
            [id]
            );
            if (movExist.rows.length > 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: "Esta nota ya fue confirmada (ya tiene movimiento).",
            });
            }

            // 3) Traer detalle
            const detSql = `
            SELECT *
            FROM almacen.notas_detalle
            WHERE id_nota = $1
            ORDER BY numitem
            `;
            const detRes = await client.query(detSql, [id]);
            const items = detRes.rows;

            if (!items.length) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: "No se puede confirmar una nota sin detalle.",
            });
            }

            // 4) Determinar tipo_movimiento real (INGRESO / SALIDA / AJUSTE)
            const tipoMov = (cab.tipo_movimiento || "").trim().toUpperCase();

            if (!["INGRESO", "SALIDA", "AJUSTE"].includes(tipoMov)) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: `Tipo de movimiento inválido en documentos: ${tipoMov}`,
            });
            }

            // 5) Insert MOVIMIENTO cabecera
            const movSql = `
            INSERT INTO almacen.movimientos (
                id_nota,
                tipo_movimiento,
                cod_operacion,
                origen,
                almacen_salida,
                almacen_destino,
                cliente_id,
                proveedor_id,
                tipo_documento_id,
                serie,
                numero_documento,
                numero_guia,
                documento_interno_id,
                observaciones,
                usuario_registro
            )
            VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15
            )
            RETURNING id_movimiento
            `;

            const movRes = await client.query(movSql, [
            cab.id_nota,
            tipoMov,
            cab.cod_operacion,
            cab.origen,
            cab.almacen_salida,
            cab.almacen_destino,
            cab.cliente_id,
            cab.proveedor_id,
            cab.tipo_documento_id,
            cab.serie,
            cab.numero_documento,
            cab.numero_guia,
            cab.documento_interno_id,
            cab.observaciones,
            userId,
            ]);

            const idMovimiento = movRes.rows[0].id_movimiento;

            // helpers stock
            const upsertStockSql = `
            INSERT INTO almacen.stock_almacen (almacen_id, id_producto, stock)
            VALUES ($1,$2,$3)
            ON CONFLICT (almacen_id, id_producto)
            DO UPDATE SET stock = almacen.stock_almacen.stock + EXCLUDED.stock,
                            actualizado_en = NOW()
            RETURNING stock
            `;

            const getStockSql = `
            SELECT stock
            FROM almacen.stock_almacen
            WHERE almacen_id = $1 AND id_producto = $2
            FOR UPDATE
            `;

            // Guardar productos afectados para recalcular stock global al final
            const productosAfectados = new Set();

            // detectar si esta nota impacta orden de compra
            const docCode = (cab.documento_codigo || "").trim(); // NIC / NIE / etc
            const afectaOC =
            tipoMov === "INGRESO" &&
            !!cab.orden_compra_id &&
            (docCode === "NIC" || docCode === "NIE" || cab.origen === "O/C");

            // 6) Por cada item: insertar mov_det + actualizar stock_almacen (+ actualizar OC si aplica)
            for (const it of items) {
            const almacenAfectado =
                it.almacen_id || (tipoMov === "INGRESO" ? cab.almacen_destino : cab.almacen_salida);

            if (!almacenAfectado) {
                await client.query("ROLLBACK");
                return res.status(400).json({
                success: false,
                message: "Falta almacén afectado para uno o más ítems.",
                });
            }

            const cant = Number(it.cantidad);
            if (!cant || cant <= 0) {
                await client.query("ROLLBACK");
                return res.status(400).json({
                success: false,
                message: `Cantidad inválida en item (producto ${it.id_producto}).`,
                });
            }

            // stock actual (por almacen + producto)
            const sRes = await client.query(getStockSql, [almacenAfectado, it.id_producto]);
            const stockActual = sRes.rows.length ? Number(sRes.rows[0].stock) : 0;

            // calcular resultante según tipo
            let stockResultante = stockActual;
            if (tipoMov === "INGRESO") stockResultante = stockActual + cant;
            else if (tipoMov === "SALIDA") stockResultante = stockActual - cant;
            else if (tipoMov === "AJUSTE") stockResultante = stockActual + cant;

            // no stock negativo para SALIDA
            if (tipoMov === "SALIDA" && stockResultante < 0) {
                await client.query("ROLLBACK");
                return res.status(400).json({
                success: false,
                message: `Stock insuficiente para producto ${it.id_producto} en almacén ${almacenAfectado}. Stock: ${stockActual}, salida: ${cant}`,
                });
            }

            // Insert detalle movimiento
            const movDetSql = `
                INSERT INTO almacen.movimientos_detalle (
                id_movimiento,
                almacen_id,
                id_producto,
                unidad_medida,
                cantidad,
                stock_actual,
                stock_resultante,
                orden_fab_id,
                lote,
                serie_producto,
                fecha_vencimiento,
                comentario
                )
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
            `;

            await client.query(movDetSql, [
                idMovimiento,
                almacenAfectado,
                it.id_producto,
                it.unidad_medida,
                cant,
                stockActual,
                stockResultante,
                it.orden_fab_id || null,
                it.lote || null,
                it.serie_producto || null,
                it.fecha_vencimiento || null,
                it.comentario || null,
            ]);

            // update stock_almacen según tipo
            const delta = tipoMov === "SALIDA" ? -cant : cant;
            await client.query(upsertStockSql, [almacenAfectado, it.id_producto, delta]);

            // actualizar cantidad_recibida en OC detalle (si aplica)
            if (afectaOC && it.orden_compra_detalle_id) {
                await client.query(
                `
                UPDATE compras.orden_compra_detalle
                SET
                    cantidad_recibida = COALESCE(cantidad_recibida,0) + $1,
                    updated_at = NOW()
                WHERE id = $2
                    AND orden_compra_id = $3
                    AND linea_cerrada = FALSE
                `,
                [cant, it.orden_compra_detalle_id, cab.orden_compra_id]
                );
            }

            // marcar producto afectado
            productosAfectados.add(it.id_producto);
            }

            // 7) Cambiar nota a CONFIRMADO
            await client.query(
            `
                UPDATE almacen.notas
                SET estado = 'CONFIRMADO',
                    fecha_modificacion = NOW(),
                    usuario_modificacion = $1
                WHERE id_nota = $2
            `,
            [userId, id]
            );

            // 8) Recalcular stock_actual global en productos (SUMA de todos los almacenes)
            if (productosAfectados.size > 0) {
            const ids = Array.from(productosAfectados);

            const updProdSql = `
                UPDATE almacen.productos p
                SET stock_actual = COALESCE(s.total, 0),
                    updated_at = NOW()
                FROM (
                SELECT id_producto, SUM(stock) AS total
                FROM almacen.stock_almacen
                WHERE id_producto = ANY($1::int[])
                GROUP BY id_producto
                ) s
                WHERE p.id_producto = s.id_producto
            `;
            await client.query(updProdSql, [ids]);

            const updZeroSql = `
                UPDATE almacen.productos p
                SET stock_actual = 0,
                    updated_at = NOW()
                WHERE p.id_producto = ANY($1::int[])
                AND NOT EXISTS (
                    SELECT 1
                    FROM almacen.stock_almacen sa
                    WHERE sa.id_producto = p.id_producto
                )
            `;
            await client.query(updZeroSql, [ids]);
            }

            // 9) Recalcular estado de la ORDEN DE COMPRA (si aplica)
            if (afectaOC) {
            const ocId = cab.orden_compra_id;

            // bloquear OC para evitar condiciones de carrera
            await client.query(`SELECT id FROM compras.orden_compra WHERE id = $1 FOR UPDATE`, [ocId]);

            const st = await client.query(
                `
                SELECT
                COUNT(*)::int AS total_lineas,
                SUM(
                    CASE
                    WHEN linea_cerrada = TRUE THEN 1
                    WHEN COALESCE(cantidad_recibida,0) >= cantidad_solicitada THEN 1
                    ELSE 0
                    END
                )::int AS lineas_completas,
                COALESCE(SUM(COALESCE(cantidad_recibida,0)),0) AS total_recibido
                FROM compras.orden_compra_detalle
                WHERE orden_compra_id = $1
                `,
                [ocId]
            );

            const totalLineas = st.rows[0]?.total_lineas ?? 0;
            const lineasCompletas = st.rows[0]?.lineas_completas ?? 0;
            const totalRecibido = Number(st.rows[0]?.total_recibido ?? 0);

            let nuevoEstado = "PENDIENTE";
            if (totalRecibido > 0) nuevoEstado = "PARCIAL";
            if (totalLineas > 0 && lineasCompletas === totalLineas) nuevoEstado = "ENTREGADA";

            await client.query(
                `UPDATE compras.orden_compra SET estado = $1, updated_at = NOW() WHERE id = $2`,
                [nuevoEstado, ocId]
            );
            }

            // 10) NUEVO: Actualizar cantidad_despachada, estado del pedido y reservas
            // (Lógica que antes hacían los triggers, ahora se ejecuta al confirmar la nota)
            if (tipoMov === "SALIDA" && cab.numero_guia) {
            console.log(`📦 Procesando despacho para guía: ${cab.numero_guia}`);

            // 10.1) Buscar la guía de remisión relacionada con esta nota
            const guiaQuery = `
                SELECT id_guia, pedido_id
                FROM ventas.guias_remision
                WHERE numero = $1
                LIMIT 1
            `;
            const guiaResult = await client.query(guiaQuery, [cab.numero_guia]);

            if (guiaResult.rows.length > 0) {
                const guia = guiaResult.rows[0];
                const pedidoId = guia.pedido_id;

                console.log(`📦 Guía encontrada: ID ${guia.id_guia}, Pedido: ${pedidoId}`);

                // 10.2) Obtener detalles de la guía para actualizar cantidad_despachada
                const detallesGuiaQuery = `
                SELECT detalle_pedido_id, cantidad_despachada
                FROM ventas.detalle_guia_remision
                WHERE guia_id = $1
                `;
                const detallesGuia = await client.query(detallesGuiaQuery, [guia.id_guia]);

                // 10.3) Actualizar cantidad_despachada en cada detalle del pedido
                for (const detalle of detallesGuia.rows) {
                if (detalle.detalle_pedido_id) {
                    // Calcular total despachado para este detalle de pedido
                    const totalDespachado = await client.query(
                    `
                        SELECT COALESCE(SUM(cantidad_despachada), 0) as total
                        FROM ventas.detalle_guia_remision
                        WHERE detalle_pedido_id = $1
                    `,
                    [detalle.detalle_pedido_id]
                    );

                    const cantidadTotalDespachada = Number(totalDespachado.rows[0]?.total || 0);

                    // Actualizar cantidad_despachada en detalle_pedidos_cliente
                    await client.query(
                    `
                        UPDATE ventas.detalle_pedidos_cliente
                        SET cantidad_despachada = $1
                        WHERE id_detalle_pedido = $2
                    `,
                    [cantidadTotalDespachada, detalle.detalle_pedido_id]
                    );

                    console.log(`  ✓ Detalle ${detalle.detalle_pedido_id}: cantidad_despachada = ${cantidadTotalDespachada}`);
                }
                }

                // 10.4) Actualizar estado del pedido
                const estadoPedidoQuery = `
                SELECT
                    COUNT(*) as total_productos,
                    SUM(CASE WHEN cantidad_pendiente = 0 THEN 1 ELSE 0 END) as productos_completados,
                    SUM(CASE WHEN cantidad_despachada > 0 AND cantidad_pendiente > 0 THEN 1 ELSE 0 END) as productos_parciales
                FROM ventas.detalle_pedidos_cliente
                WHERE pedido_id = $1
                `;
                const estadoResult = await client.query(estadoPedidoQuery, [pedidoId]);

                const totalProductos = Number(estadoResult.rows[0]?.total_productos || 0);
                const productosCompletados = Number(estadoResult.rows[0]?.productos_completados || 0);
                const productosParciales = Number(estadoResult.rows[0]?.productos_parciales || 0);

                let nuevoEstadoPedido = 'PENDIENTE';
                if (productosCompletados === totalProductos) {
                nuevoEstadoPedido = 'DESPACHADO';
                } else if (productosCompletados > 0 || productosParciales > 0) {
                nuevoEstadoPedido = 'PARCIAL';
                }

                await client.query(
                `
                    UPDATE ventas.pedidos_cliente
                    SET estado = $1, updated_at = CURRENT_TIMESTAMP
                    WHERE id_pedido = $2
                    AND estado NOT IN ('ENTREGADO', 'FACTURADO', 'ANULADO')
                `,
                [nuevoEstadoPedido, pedidoId]
                );

                console.log(`  ✓ Estado del pedido ${pedidoId} actualizado a: ${nuevoEstadoPedido}`);

                // 10.5) Marcar reservas como DESPACHADAS
                for (const detalle of detallesGuia.rows) {
                if (detalle.detalle_pedido_id) {
                    await client.query(
                    `
                        UPDATE almacen.reservas_stock
                        SET estado = 'DESPACHADA',
                            fecha_liberacion = CURRENT_TIMESTAMP
                        WHERE id_detalle_pedido = $1
                        AND estado = 'ACTIVA'
                    `,
                    [detalle.detalle_pedido_id]
                    );

                    console.log(`  ✓ Reserva marcada como DESPACHADA para detalle ${detalle.detalle_pedido_id}`);
                }
                }

                // 10.6) Actualizar estado de la guía a EN_TRANSITO
                await client.query(
                `
                    UPDATE ventas.guias_remision
                    SET estado = 'EN_TRANSITO', updated_at = CURRENT_TIMESTAMP
                    WHERE id_guia = $1
                    AND estado = 'PENDIENTE'
                `,
                [guia.id_guia]
                );

                // 10.7) Actualizar estado de detalles de guía a DESPACHADO
                await client.query(
                `
                    UPDATE ventas.detalle_guia_remision
                    SET estado = 'DESPACHADO'
                    WHERE guia_id = $1
                    AND estado = 'PENDIENTE'
                `,
                [guia.id_guia]
                );

                console.log(`  ✓ Estado de guía ${guia.id_guia} actualizado a: EN_TRANSITO`);
                console.log(`  ✓ Detalles de guía actualizados a: DESPACHADO`);
                console.log(`✅ Pedido ${pedidoId} actualizado completamente`);
            } else {
                console.log(`⚠️  No se encontró guía con número: ${cab.numero_guia}`);
            }
            }

            await client.query("COMMIT");

            return res.json({
            success: true,
            message:
                "Nota confirmada. Movimiento generado, stock por almacén y stock total actualizados." +
                (afectaOC ? " Orden de compra actualizada." : ""),
            id_nota: id,
            id_movimiento: idMovimiento,
            });
        } catch (error) {
            await client.query("ROLLBACK");
            console.error("confirmarNota error:", error);
            return res.status(500).json({
            success: false,
            message: "Error al confirmar nota",
            error: error.message,
            });
        } finally {
            client.release();
        }
    },

    confirmarNotaT: async (req, res) => {
        const client = await db.pool.connect();

        try {
            await client.query("BEGIN");

            const { id } = req.params;
            const userId = req.user?.id || null;

            // 1) Traer cabecera nota + documento
            const cabSql = `
            SELECT
                n.*,
                TRIM(d.codigo) AS documento_codigo
            FROM almacen.notas n
            JOIN public.documentos d ON d.id_documento = n.documento_interno_id
            WHERE n.id_nota = $1
            FOR UPDATE
            `;
            const cabRes = await client.query(cabSql, [id]);

            if (!cabRes.rows.length) {
            await client.query("ROLLBACK");
            return res.status(404).json({ success: false, message: "Nota no encontrada" });
            }

            const cab = cabRes.rows[0];

            if (cab.estado !== "BORRADOR") {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: "Solo se puede confirmar una nota en BORRADOR",
            });
            }

            const docCode = (cab.documento_codigo || "").trim().toUpperCase();
            const esTransferencia = docCode.startsWith("NT"); // ajusta si tu código es otro

            if (!esTransferencia) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: `Esta ruta es solo para TRANSFERENCIAS (NT). Documento: ${docCode}`,
            });
            }

            if (!cab.almacen_salida || !cab.almacen_destino) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: "Para transferencia se requiere almacén_salida y almacén_destino.",
            });
            }

            if (Number(cab.almacen_salida) === Number(cab.almacen_destino)) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: "Almacén salida y destino no pueden ser iguales en transferencia.",
            });
            }

            // 2) Traer detalle
            const detSql = `
            SELECT *
            FROM almacen.notas_detalle
            WHERE id_nota = $1
            ORDER BY numitem
            `;
            const detRes = await client.query(detSql, [id]);
            const items = detRes.rows;

            if (!items.length) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: "No se puede confirmar una nota sin detalle.",
            });
            }

            // 3) Evitar duplicar (si ya existe SALIDA o INGRESO para esta nota)
            const dup = await client.query(
            `
                SELECT tipo_movimiento
                FROM almacen.movimientos
                WHERE id_nota = $1
                AND tipo_movimiento IN ('SALIDA','INGRESO')
            `,
            [id]
            );
            if (dup.rows.length) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: "Esta transferencia ya fue confirmada (ya tiene movimientos).",
            });
            }

            // 4) Generar transferencia_id (secuencia)
            const trRes = await client.query(
            `SELECT nextval('almacen.transferencia_seq') AS transferencia_id`
            );
            const transferenciaId = trRes.rows[0].transferencia_id;

            // helpers stock
            const upsertStockSql = `
            INSERT INTO almacen.stock_almacen (almacen_id, id_producto, stock)
            VALUES ($1,$2,$3)
            ON CONFLICT (almacen_id, id_producto)
            DO UPDATE SET stock = almacen.stock_almacen.stock + EXCLUDED.stock,
                            actualizado_en = NOW()
            RETURNING stock
            `;

            const getStockSql = `
            SELECT stock
            FROM almacen.stock_almacen
            WHERE almacen_id = $1 AND id_producto = $2
            FOR UPDATE
            `;

            const movDetSql = `
            INSERT INTO almacen.movimientos_detalle (
                id_movimiento,
                almacen_id,
                id_producto,
                unidad_medida,
                cantidad,
                stock_actual,
                stock_resultante,
                orden_fab_id,
                lote,
                serie_producto,
                fecha_vencimiento,
                comentario
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
            `;

            // 5) Insertar movimientos (cabecera)
            const movCabSql = `
            INSERT INTO almacen.movimientos (
                id_nota,
                tipo_movimiento,
                cod_operacion,
                origen,
                transferencia_id,
                almacen_salida,
                almacen_destino,
                cliente_id,
                proveedor_id,
                tipo_documento_id,
                serie,
                numero_documento,
                numero_guia,
                documento_interno_id,
                observaciones,
                usuario_registro
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
            RETURNING id_movimiento
            `;

            // ✅ SALIDA: destino debe ser NULL para pasar el CHECK
            const salidaRes = await client.query(movCabSql, [
            cab.id_nota,
            "SALIDA",
            cab.cod_operacion,
            cab.origen,
            transferenciaId,
            cab.almacen_salida, // salida
            null,               // ✅ destino NULL
            cab.cliente_id,
            cab.proveedor_id,
            cab.tipo_documento_id,
            cab.serie,
            cab.numero_documento,
            cab.numero_guia,
            cab.documento_interno_id,
            cab.observaciones,
            userId,
            ]);
            const idMovSalida = salidaRes.rows[0].id_movimiento;

            // ✅ INGRESO: salida debe ser NULL para pasar el CHECK
            const ingresoRes = await client.query(movCabSql, [
            cab.id_nota,
            "INGRESO",
            cab.cod_operacion,
            cab.origen,
            transferenciaId,
            null,                 // ✅ salida NULL
            cab.almacen_destino,  // destino
            cab.cliente_id,
            cab.proveedor_id,
            cab.tipo_documento_id,
            cab.serie,
            cab.numero_documento,
            cab.numero_guia,
            cab.documento_interno_id,
            cab.observaciones,
            userId,
            ]);
            const idMovIngreso = ingresoRes.rows[0].id_movimiento;

            // 6) Procesar items: SALIDA (resta) e INGRESO (suma)
            const productosAfectados = new Set();
            const almOrigen = cab.almacen_salida;
            const almDestino = cab.almacen_destino;

            for (const it of items) {
            const cant = Number(it.cantidad);

            if (!cant || cant <= 0) {
                await client.query("ROLLBACK");
                return res.status(400).json({
                success: false,
                message: `Cantidad inválida en item (producto ${it.id_producto}).`,
                });
            }

            // --- SALIDA: validar stock y restar ---
            const sOriRes = await client.query(getStockSql, [almOrigen, it.id_producto]);
            const stockOri = sOriRes.rows.length ? Number(sOriRes.rows[0].stock) : 0;
            const stockOriRes = stockOri - cant;

            if (stockOriRes < 0) {
                await client.query("ROLLBACK");
                return res.status(400).json({
                success: false,
                message: `Stock insuficiente para producto ${it.id_producto} en almacén ORIGEN ${almOrigen}. Stock: ${stockOri}, salida: ${cant}`,
                });
            }

            await client.query(movDetSql, [
                idMovSalida,
                almOrigen,
                it.id_producto,
                it.unidad_medida,
                cant,
                stockOri,
                stockOriRes,
                it.orden_fab_id || null,
                it.lote || null,
                it.serie_producto || null,
                it.fecha_vencimiento || null,
                it.comentario || null,
            ]);

            await client.query(upsertStockSql, [almOrigen, it.id_producto, -cant]);

            // --- INGRESO: sumar ---
            const sDesRes = await client.query(getStockSql, [almDestino, it.id_producto]);
            const stockDes = sDesRes.rows.length ? Number(sDesRes.rows[0].stock) : 0;
            const stockDesRes = stockDes + cant;

            await client.query(movDetSql, [
                idMovIngreso,
                almDestino,
                it.id_producto,
                it.unidad_medida,
                cant,
                stockDes,
                stockDesRes,
                it.orden_fab_id || null,
                it.lote || null,
                it.serie_producto || null,
                it.fecha_vencimiento || null,
                it.comentario || null,
            ]);

            await client.query(upsertStockSql, [almDestino, it.id_producto, cant]);

            productosAfectados.add(it.id_producto);
            }

            // 7) Confirmar nota
            await client.query(
            `
                UPDATE almacen.notas
                SET estado = 'CONFIRMADO',
                    fecha_modificacion = NOW(),
                    usuario_modificacion = $1
                WHERE id_nota = $2
            `,
            [userId, id]
            );

            // 8) Recalcular stock total por producto
            if (productosAfectados.size > 0) {
            const ids = Array.from(productosAfectados);

            await client.query(
                `
                UPDATE almacen.productos p
                SET stock_actual = COALESCE(s.total, 0),
                    updated_at = NOW()
                FROM (
                    SELECT id_producto, SUM(stock) AS total
                    FROM almacen.stock_almacen
                    WHERE id_producto = ANY($1::int[])
                    GROUP BY id_producto
                ) s
                WHERE p.id_producto = s.id_producto
                `,
                [ids]
            );

            await client.query(
                `
                UPDATE almacen.productos p
                SET stock_actual = 0,
                    updated_at = NOW()
                WHERE p.id_producto = ANY($1::int[])
                    AND NOT EXISTS (
                    SELECT 1
                    FROM almacen.stock_almacen sa
                    WHERE sa.id_producto = p.id_producto
                    )
                `,
                [ids]
            );
            }

            await client.query("COMMIT");

            return res.json({
            success: true,
            message:
                "Transferencia confirmada. Movimientos SALIDA e INGRESO generados y stock actualizado.",
            id_nota: id,
            transferencia_id: transferenciaId,
            id_mov_salida: idMovSalida,
            id_mov_ingreso: idMovIngreso,
            });
        } catch (error) {
            await client.query("ROLLBACK");
            console.error("confirmarNotaT error:", error);
            return res.status(500).json({
            success: false,
            message: "Error al confirmar transferencia",
            error: error.message,
            });
        } finally {
            client.release();
        }
    },

    updateNota: async (req, res) => {
        const client = await db.pool.connect();

        try {
            await client.query("BEGIN");

            const { id } = req.params;
            const {
            documento_interno_id,
            numero,
            cod_operacion,
            orden_compra_id,
            cliente_id,
            proveedor_id,
            tipo_documento_id,
            serie,
            numero_documento,
            numero_guia,
            almacen_salida,
            almacen_destino,
            observaciones,
            items,
            estado, // <- se ignora (solo se valida)
            } = req.body;

            const notaRes = await client.query(
            `SELECT estado FROM almacen.notas WHERE id_nota = $1`,
            [id]
            );

            if (notaRes.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ success: false, message: "Nota no encontrada" });
            }

            if (notaRes.rows[0].estado !== "BORRADOR") {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: "Solo se pueden editar notas en estado BORRADOR",
            });
            }

            // ✅ updateNota SOLO edita BORRADOR (no confirma ni anula)
            if (estado && estado.toUpperCase() !== "BORRADOR") {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message:
                "updateNota solo edita BORRADOR. Para confirmar use /almacen/notas/:id/confirmar.",
            });
            }
            const estadoNuevo = "BORRADOR";

            // origen_default
            const opRes = await client.query(
            `
                SELECT origen_default
                FROM public.cod_operacion
                WHERE id_cod_operacion = $1
            `,
            [cod_operacion]
            );

            if (opRes.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({ success: false, message: "Operación no válida" });
            }

            const origen = opRes.rows[0].origen_default || "INTERNO";
            const userId = req.user?.id || null;

            const updateCabSql = `
            UPDATE almacen.notas
            SET
                documento_interno_id = $1,
                numero = $2,
                cod_operacion = $3,
                origen = $4,
                almacen_salida = $5,
                almacen_destino = $6,
                orden_compra_id = $7,
                cliente_id = $8,
                proveedor_id = $9,
                tipo_documento_id = $10,
                serie = $11,
                numero_documento = $12,
                numero_guia = $13,
                estado = $14,
                observaciones = $15,
                fecha_modificacion = NOW(),
                usuario_modificacion = $16
            WHERE id_nota = $17
            `;

            const updRes = await client.query(updateCabSql, [
            documento_interno_id,
            numero,
            cod_operacion,
            origen,
            almacen_salida || null,
            almacen_destino || null,
            orden_compra_id || null,
            cliente_id || null,
            proveedor_id || null,
            tipo_documento_id || null,
            serie || null,
            numero_documento || null,
            numero_guia || null,
            estadoNuevo,
            observaciones || null,
            userId,
            id,
            ]);

            if (updRes.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({
                success: false,
                message: "No se actualizó ninguna fila (id_nota no encontrado).",
            });
            }

            // rehacer detalle
            await client.query(`DELETE FROM almacen.notas_detalle WHERE id_nota = $1`, [id]);

            if (Array.isArray(items) && items.length > 0) {
            const detSql = `
                INSERT INTO almacen.notas_detalle (
                numitem,
                id_nota,
                orden_compra_detalle_id,
                almacen_id,
                id_producto,
                unidad_medida,
                cantidad,
                lote,
                serie_producto,
                fecha_vencimiento,
                comentario
                )
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            `;

            for (let i = 0; i < items.length; i++) {
                const it = items[i];
                await client.query(detSql, [
                i + 1,
                id,
                it.orden_compra_detalle_id || null,
                it.almacen_id || null,
                it.id_producto,
                it.unidad_medida,
                it.cantidad,
                it.lote || null,
                it.serie_producto || null,
                it.fecha_vencimiento || null,
                it.comentario || null,
                ]);
            }
            }

            await client.query("COMMIT");

            const ver = await db.query(`SELECT * FROM almacen.notas WHERE id_nota = $1`, [id]);

            return res.json({
            success: true,
            message: "Nota actualizada correctamente (BORRADOR)",
            id_nota: id,
            cabecera: ver.rows[0],
            });
        } catch (error) {
            await client.query("ROLLBACK");
            console.error("Error al actualizar nota:", error);
            return res.status(500).json({
            success: false,
            message: "Error al actualizar nota",
            error: error.message,
            });
        } finally {
            client.release();
        }
    },

    anularNota: async (req, res) => {
        const client = await db.pool.connect();

        try {
            await client.query("BEGIN");

            const { id } = req.params;
            const userId = req.user?.id || null;

            // 1) Traer nota + doc (solo para info / validación de estado) y bloquear
            const notaRes = await client.query(
            `
            SELECT
                n.*,
                TRIM(d.tipo_movimiento) AS doc_tipo_movimiento,
                TRIM(d.codigo)         AS doc_codigo
            FROM almacen.notas n
            JOIN public.documentos d ON d.id_documento = n.documento_interno_id
            WHERE n.id_nota = $1
            FOR UPDATE
            `,
            [id]
            );

            if (notaRes.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ success: false, message: "Nota no encontrada" });
            }

            const nota = notaRes.rows[0];

            if (nota.estado !== "CONFIRMADO") {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: "Solo se puede anular una nota en estado CONFIRMADO",
            });
            }

            // 2) Buscar TODOS los movimientos asociados a esta nota (para NT serán 2: SALIDA + INGRESO)
            const movOriRes = await client.query(
            `
            SELECT *
            FROM almacen.movimientos
            WHERE id_nota = $1
            ORDER BY id_movimiento
            FOR UPDATE
            `,
            [id]
            );

            if (movOriRes.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: "No se encontró movimiento asociado a esta nota. No se puede anular.",
            });
            }

            const movimientosOriginales = movOriRes.rows;

            // 2.1) Determinar si es transferencia:
            // - Por tipo de nota (si lo tienes)
            // - O por documento (NT tiene doc_tipo_movimiento = 'NO APLICA')
            // - O por tener 2 movimientos (INGRESO+SALIDA) para la misma nota
            const docTipo = (nota.doc_tipo_movimiento || "").toUpperCase();
            const docCod = (nota.doc_codigo || "").toUpperCase();

            const tieneIng = movimientosOriginales.some((m) => (m.tipo_movimiento || "").toUpperCase() === "INGRESO");
            const tieneSal = movimientosOriginales.some((m) => (m.tipo_movimiento || "").toUpperCase() === "SALIDA");

            const esTransferencia =
            (nota.tipo && String(nota.tipo).toUpperCase() === "TRANSFERENCIA") ||
            docTipo === "NO APLICA" ||
            docCod.startsWith("NT") ||
            (tieneIng && tieneSal && movimientosOriginales.length >= 2);

            // 3) Helpers stock
            const getStockSql = `
            SELECT stock
            FROM almacen.stock_almacen
            WHERE almacen_id = $1 AND id_producto = $2
            FOR UPDATE
            `;

            const upsertStockDeltaSql = `
            INSERT INTO almacen.stock_almacen (almacen_id, id_producto, stock)
            VALUES ($1,$2,$3)
            ON CONFLICT (almacen_id, id_producto)
            DO UPDATE SET stock = almacen.stock_almacen.stock + EXCLUDED.stock,
                            actualizado_en = NOW()
            RETURNING stock
            `;

            const productosAfectados = new Set();

            // 4) Función para crear un movimiento reverso + revertir su detalle
            const revertirMovimiento = async (movOri) => {
            const tipoMovOri = (movOri.tipo_movimiento || "").toUpperCase();

            if (!["INGRESO", "SALIDA", "AJUSTE", "TRANSFERENCIA"].includes(tipoMovOri)) {
                throw new Error(`Tipo de movimiento inválido en movimientos: ${tipoMovOri}`);
            }

            // 4.1) Traer detalle del movimiento original
            const movDetRes = await client.query(
                `
                SELECT *
                FROM almacen.movimientos_detalle
                WHERE id_movimiento = $1
                ORDER BY id_detalle
                `,
                [movOri.id_movimiento]
            );

            const dets = movDetRes.rows;
            if (!dets.length) {
                throw new Error(`El movimiento original ${movOri.id_movimiento} no tiene detalle. No se puede anular.`);
            }

            // 4.2) Definir tipo reverso
            // - INGRESO -> reverso SALIDA (resta stock)
            // - SALIDA  -> reverso INGRESO (suma stock)
            // - AJUSTE  -> reverso AJUSTE (delta negativo)
            // - TRANSFERENCIA (si existiera) -> lo tratamos como SALIDA+INGRESO (pero normalmente NO deberías tenerlo)
            let tipoMovReverso = tipoMovOri;
            if (tipoMovOri === "INGRESO") tipoMovReverso = "SALIDA";
            else if (tipoMovOri === "SALIDA") tipoMovReverso = "INGRESO";
            else if (tipoMovOri === "AJUSTE") tipoMovReverso = "AJUSTE";
            else if (tipoMovOri === "TRANSFERENCIA") {
                // si algún día guardas TRANSFERENCIA directo, lo anulamos como AJUSTE negativo por seguridad
                tipoMovReverso = "AJUSTE";
            }

            // 4.3) Almacenes reversos (solo a nivel cabecera, el detalle manda por almacen_id)
            // Para mantener coherencia de tu CHECK en movimientos:
            // - INGRESO requiere almacen_destino y almacen_salida NULL
            // - SALIDA requiere almacen_salida
            let almacen_salida_rev = null;
            let almacen_destino_rev = null;

            if (tipoMovReverso === "INGRESO") {
                // reverso de SALIDA: vuelve a ingresar al almacén de donde salió
                almacen_destino_rev = movOri.almacen_salida || null;
            } else if (tipoMovReverso === "SALIDA") {
                // reverso de INGRESO: vuelve a salir del almacén donde ingresó
                almacen_salida_rev = movOri.almacen_destino || null;
            } else if (tipoMovReverso === "AJUSTE") {
                // no exige almacenes a nivel cabecera según tu CHECK
                almacen_salida_rev = null;
                almacen_destino_rev = null;
            }

            // 4.4) Insertar movimiento reverso
            const movRevSql = `
                INSERT INTO almacen.movimientos (
                id_nota,
                tipo_movimiento,
                cod_operacion,
                origen,
                transferencia_id,
                almacen_salida,
                almacen_destino,
                cliente_id,
                proveedor_id,
                tipo_documento_id,
                serie,
                numero_documento,
                numero_guia,
                documento_interno_id,
                observaciones,
                usuario_registro
                )
                VALUES (
                NULL, $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15
                )
                RETURNING id_movimiento
            `;

            const obsRev = `REVERSA/ANULACIÓN Nota ${nota.id_nota} - MovOri ${movOri.id_movimiento}`;

            const movRevRes = await client.query(movRevSql, [
                tipoMovReverso,
                movOri.cod_operacion,
                movOri.origen,
                movOri.transferencia_id || null,
                almacen_salida_rev,
                almacen_destino_rev,
                movOri.cliente_id,
                movOri.proveedor_id,
                movOri.tipo_documento_id,
                movOri.serie,
                movOri.numero_documento,
                movOri.numero_guia,
                movOri.documento_interno_id,
                obsRev,
                userId,
            ]);

            const idMovReverso = movRevRes.rows[0].id_movimiento;

            // 4.5) Revertir cada línea (detalle) con delta inverso
            for (const det of dets) {
                const almacenAfectado = det.almacen_id;
                if (!almacenAfectado) {
                throw new Error(`Detalle sin almacen_id en mov ${movOri.id_movimiento}. No se puede anular.`);
                }

                const cant = Number(det.cantidad);

                const sRes = await client.query(getStockSql, [almacenAfectado, det.id_producto]);
                const stockActual = sRes.rows.length ? Number(sRes.rows[0].stock) : 0;

                let delta = 0;
                if (tipoMovOri === "INGRESO") delta = -cant;     // reversa: restar
                else if (tipoMovOri === "SALIDA") delta = +cant; // reversa: sumar
                else if (tipoMovOri === "AJUSTE") delta = -cant; // reversa ajuste: opuesto
                else if (tipoMovOri === "TRANSFERENCIA") delta = 0;

                const stockResultante = stockActual + delta;

                if (stockResultante < 0) {
                throw new Error(
                    `Anulación no permitida: dejaría stock negativo. Producto ${det.id_producto} en almacén ${almacenAfectado}. Stock: ${stockActual}, delta: ${delta}`
                );
                }

                // Insertar detalle del movimiento reverso
                await client.query(
                `
                INSERT INTO almacen.movimientos_detalle (
                    id_movimiento,
                    almacen_id,
                    id_producto,
                    unidad_medida,
                    cantidad,
                    stock_actual,
                    stock_resultante,
                    orden_fab_id,
                    centro_costo_id,
                    lote,
                    serie_producto,
                    fecha_vencimiento,
                    comentario
                )
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
                `,
                [
                    idMovReverso,
                    almacenAfectado,
                    det.id_producto,
                    det.unidad_medida,
                    cant,
                    stockActual,
                    stockResultante,
                    det.orden_fab_id || null,
                    det.centro_costo_id || null,
                    det.lote || null,
                    det.serie_producto || null,
                    det.fecha_vencimiento || null,
                    `REVERSA: ${det.comentario || ""}`.trim(),
                ]
                );

                // Aplicar delta al stock del almacén
                await client.query(upsertStockDeltaSql, [almacenAfectado, det.id_producto, delta]);

                productosAfectados.add(det.id_producto);
            }

            return { movOriId: movOri.id_movimiento, movRevId: idMovReverso, tipoMovOri };
            };

            // 5) Revertir movimientos:
            // - Ingreso/Salida normal: suele ser 1 movimiento
            // - Transferencia: serán 2 (SALIDA+INGRESO), se revierten ambos
            const resultados = [];
            for (const movOri of movimientosOriginales) {
            const tipoMovOri = (movOri.tipo_movimiento || "").toUpperCase();

            // Si es transferencia, solo esperamos reversar INGRESO/SALIDA (los 2)
            if (esTransferencia && !["INGRESO", "SALIDA"].includes(tipoMovOri)) {
                continue;
            }

            // Si NO es transferencia, reversamos el único movimiento (INGRESO/SALIDA/AJUSTE)
            resultados.push(await revertirMovimiento(movOri));
            }

            if (esTransferencia && resultados.length < 2) {
            // No abortamos por completo, pero sí avisamos claro:
            // (si quieres, cámbialo a throw Error para obligar exactitud)
            // throw new Error("Transferencia inválida: se esperaban 2 movimientos (SALIDA+INGRESO).");
            }

            // 6) Recalcular stock_actual global en productos (SUMA stock_almacen) solo para afectados
            if (productosAfectados.size > 0) {
            const ids = Array.from(productosAfectados);

            await client.query(
                `
                UPDATE almacen.productos p
                SET stock_actual = COALESCE(s.total, 0),
                    updated_at = NOW()
                FROM (
                SELECT id_producto, SUM(stock) AS total
                FROM almacen.stock_almacen
                WHERE id_producto = ANY($1::int[])
                GROUP BY id_producto
                ) s
                WHERE p.id_producto = s.id_producto
                `,
                [ids]
            );

            await client.query(
                `
                UPDATE almacen.productos p
                SET stock_actual = 0,
                    updated_at = NOW()
                WHERE p.id_producto = ANY($1::int[])
                AND NOT EXISTS (
                    SELECT 1
                    FROM almacen.stock_almacen sa
                    WHERE sa.id_producto = p.id_producto
                )
                `,
                [ids]
            );
            }

            // 7) Cambiar nota a ANULADO
            await client.query(
            `
            UPDATE almacen.notas
            SET estado = 'ANULADO',
                fecha_modificacion = NOW(),
                usuario_modificacion = $1
            WHERE id_nota = $2
            `,
            [userId, id]
            );

            // 8) Revertir lógica extra SOLO para SALIDAS por guía (tu bloque actual)
            //    Nota: en transferencia normalmente NO hay guía. Esto queda igual.
            if (!esTransferencia) {
            const haySalida = movimientosOriginales.some((m) => (m.tipo_movimiento || "").toUpperCase() === "SALIDA");
            if (haySalida && nota.numero_guia) {
                // (Aquí pega tu bloque 9) tal como lo tienes)
                // --- INICIO BLOQUE GUÍAS (igual que tu código) ---
                const guiaQuery = `
                SELECT id_guia, pedido_id
                FROM ventas.guias_remision
                WHERE numero = $1
                LIMIT 1
                `;
                const guiaResult = await client.query(guiaQuery, [nota.numero_guia]);

                if (guiaResult.rows.length > 0) {
                const guia = guiaResult.rows[0];
                const pedidoId = guia.pedido_id;

                const detallesGuiaQuery = `
                    SELECT detalle_pedido_id, cantidad_despachada
                    FROM ventas.detalle_guia_remision
                    WHERE guia_id = $1
                `;
                const detallesGuia = await client.query(detallesGuiaQuery, [guia.id_guia]);

                for (const detalle of detallesGuia.rows) {
                    if (detalle.detalle_pedido_id) {
                    await client.query(
                        `
                        UPDATE almacen.reservas_stock
                        SET estado = 'ACTIVA',
                            fecha_liberacion = NULL
                        WHERE id_detalle_pedido = $1
                        AND estado = 'DESPACHADA'
                        `,
                        [detalle.detalle_pedido_id]
                    );
                    }
                }

                for (const detalle of detallesGuia.rows) {
                    if (detalle.detalle_pedido_id) {
                    const totalDespachado = await client.query(
                        `
                        SELECT COALESCE(SUM(cantidad_despachada), 0) as total
                        FROM ventas.detalle_guia_remision
                        WHERE detalle_pedido_id = $1
                        AND guia_id != $2
                        `,
                        [detalle.detalle_pedido_id, guia.id_guia]
                    );

                    const cantidadTotalDespachada = Number(totalDespachado.rows[0]?.total || 0);

                    await client.query(
                        `
                        UPDATE ventas.detalle_pedidos_cliente
                        SET cantidad_despachada = $1
                        WHERE id_detalle_pedido = $2
                        `,
                        [cantidadTotalDespachada, detalle.detalle_pedido_id]
                    );
                    }
                }

                const estadoResult = await client.query(
                    `
                    SELECT
                    COUNT(*) as total_productos,
                    SUM(CASE WHEN cantidad_pendiente = 0 THEN 1 ELSE 0 END) as productos_completados,
                    SUM(CASE WHEN cantidad_despachada > 0 AND cantidad_pendiente > 0 THEN 1 ELSE 0 END) as productos_parciales
                    FROM ventas.detalle_pedidos_cliente
                    WHERE pedido_id = $1
                    `,
                    [pedidoId]
                );

                const totalProductos = Number(estadoResult.rows[0]?.total_productos || 0);
                const productosCompletados = Number(estadoResult.rows[0]?.productos_completados || 0);
                const productosParciales = Number(estadoResult.rows[0]?.productos_parciales || 0);

                let nuevoEstadoPedido = "PENDIENTE";
                if (productosCompletados === totalProductos && totalProductos > 0) nuevoEstadoPedido = "DESPACHADO";
                else if (productosCompletados > 0 || productosParciales > 0) nuevoEstadoPedido = "PARCIAL";

                await client.query(
                    `
                    UPDATE ventas.pedidos_cliente
                    SET estado = $1, updated_at = CURRENT_TIMESTAMP
                    WHERE id_pedido = $2
                    AND estado NOT IN ('ENTREGADO', 'FACTURADO', 'ANULADO')
                    `,
                    [nuevoEstadoPedido, pedidoId]
                );

                await client.query(
                    `
                    UPDATE ventas.guias_remision
                    SET estado = 'PENDIENTE', updated_at = CURRENT_TIMESTAMP
                    WHERE id_guia = $1
                    AND estado = 'EN_TRANSITO'
                    `,
                    [guia.id_guia]
                );

                await client.query(
                    `
                    UPDATE ventas.detalle_guia_remision
                    SET estado = 'PENDIENTE'
                    WHERE guia_id = $1
                    AND estado = 'DESPACHADO'
                    `,
                    [guia.id_guia]
                );
                }
                // --- FIN BLOQUE GUÍAS ---
            }
            }

            await client.query("COMMIT");

            return res.json({
            success: true,
            message: esTransferencia
                ? "Transferencia anulada. Se generaron movimientos reversos (INGRESO y SALIDA) y se revirtió el stock."
                : "Nota anulada. Se generó movimiento reverso y se revirtieron stocks.",
            id_nota: id,
            es_transferencia: esTransferencia,
            movimientos_revertidos: resultados, // [{movOriId, movRevId, tipoMovOri}, ...]
            });
        } catch (error) {
            await client.query("ROLLBACK");
            console.error("anularNota error:", error);

            const msg = error?.message || "Error al anular nota";
            if (msg.includes("stock negativo") || msg.includes("Anulación no permitida")) {
            return res.status(400).json({ success: false, message: msg });
            }

            return res.status(500).json({
            success: false,
            message: "Error al anular nota",
            error: msg,
            });
        } finally {
            client.release();
        }
    },

    exportNotaPdf: async (req, res) => {
        try {
            const { id } = req.params;
            const idNota = Number(id);

            if (!idNota) {
            return res.status(400).json({ success: false, message: "ID de nota inválido" });
            }

            // =========================
            // 1) CABECERA
            // (Basado en tu getNotaById)
            // =========================
            const sqlCab = `
            SELECT 
                n.*,
                TRIM(d.codigo) AS documento_codigo,
                d.nombre AS documento_nombre,
                TRIM(d.tipo_movimiento) AS tipo_movimiento,
                op.nombre AS operacion_nombre,
                a1.nombre AS almacen_salida_nombre,
                a2.nombre AS almacen_destino_nombre,
                cli.razon_social AS cliente_nombre,
                prov.razon_social AS proveedor_nombre,
                td.nombre AS tipo_documento_nombre
            FROM almacen.notas n
            INNER JOIN public.documentos d ON d.id_documento = n.documento_interno_id
            INNER JOIN public.cod_operacion op ON op.id_cod_operacion = n.cod_operacion
            LEFT JOIN almacen.almacenes a1 ON a1.id_alm = n.almacen_salida
            LEFT JOIN almacen.almacenes a2 ON a2.id_alm = n.almacen_destino
            LEFT JOIN ventas.clientes cli ON cli.id_cliente = n.cliente_id
            LEFT JOIN compras.proveedores prov ON prov.id_prov = n.proveedor_id
            LEFT JOIN public.tipo_documento td ON td.id_doc = n.tipo_documento_id
            WHERE n.id_nota = $1
            `;
            const cabRes = await db.query(sqlCab, [idNota]);

            if (cabRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Nota no encontrada" });
            }

            const cab = cabRes.rows[0];

            // =========================
            // 2) DETALLE
            // =========================
            const sqlDet = `
            SELECT 
                det.numitem,
                det.id_producto,
                p.codigo AS producto_codigo,
                p.descripcion AS producto_descripcion,
                det.unidad_medida,
                det.cantidad,
                a.nombre AS almacen_nombre,
                det.lote,
                det.serie_producto,
                det.fecha_vencimiento,
                det.comentario
            FROM almacen.notas_detalle det
            INNER JOIN almacen.productos p ON p.id_producto = det.id_producto
            LEFT JOIN almacen.almacenes a ON a.id_alm = det.almacen_id
            WHERE det.id_nota = $1
            ORDER BY det.numitem
            `;
            const detRes = await db.query(sqlDet, [idNota]);
            const items = detRes.rows || [];

            // =========================
            // 3) PDF (PDFKit)
            // =========================
            const doc = new PDFDocument({
            size: "A4",
            layout: "portrait",
            margin: 36,
            bufferPages: true,
            });

            const filename = `nota_${cab.documento_codigo || "DOC"}_${cab.numero || idNota}_${Date.now()}.pdf`;

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

            doc.pipe(res);

            // Helpers
            const pageW = doc.page.width;
            const pageH = doc.page.height;
            const margin = doc.page.margins.left;

            const pad = (n) => String(n).padStart(2, "0");

            const formatDateTime = (d) => {
            if (!d) return "";
            const dt = new Date(d);
            return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
            };

            const formatDate = (d) => {
            if (!d) return "";
            const dt = new Date(d);
            return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()}`;
            };

            const drawHR = (y) => {
            doc.save().moveTo(margin, y).lineTo(pageW - margin, y).lineWidth(1).strokeColor("#e5e7eb").stroke().restore();
            };

            const drawBox = (x, y, w, h, fill = "#f8fafc", stroke = "#e5e7eb") => {
            doc.save().roundedRect(x, y, w, h, 8).fillColor(fill).fill().strokeColor(stroke).lineWidth(1).stroke().restore();
            };

            const safe = (v) => (v === null || v === undefined ? "" : String(v));

            // =========================
            // HEADER (todas las páginas)
            // =========================
            const empresa = "Radiadores Fortaleza S.A.";
            const ruc = "20101636411";
            const generado = formatDateTime(new Date());

            const titulo =
            (cab.tipo_movimiento || "").toUpperCase() === "SALIDA"
                ? "NOTA DE SALIDA"
                : "NOTA DE INGRESO";

            const drawHeader = () => {
            const topY = 20;

            doc.font("Helvetica-Bold").fontSize(14).fillColor("#0b1f3a").text(empresa, margin, topY, { align: "left" });

            doc.font("Helvetica").fontSize(9).fillColor("#4b5563").text(`RUC: ${ruc}`, margin, topY + 20);

            doc
                .font("Helvetica")
                .fontSize(9)
                .fillColor("#4b5563")
                .text(`Generado: ${generado}`, pageW - margin - 220, topY + 20, { width: 220, align: "right" });

            doc
                .font("Helvetica-Bold")
                .fontSize(13)
                .fillColor("#111827")
                .text(`${titulo}`, margin, topY + 42, { width: pageW - margin * 2, align: "center" });

            doc
                .font("Helvetica")
                .fontSize(10)
                .fillColor("#111827")
                .text(
                `${safe(cab.documento_codigo)}-${safe(cab.numero)}`,
                margin,
                topY + 62,
                { width: pageW - margin * 2, align: "center" }
                );

            drawHR(topY + 80);
            doc.y = topY + 90;
            };

            // =========================
            // CABECERA - Bloque datos
            // =========================
            const drawCabecera = () => {
            const y0 = doc.y;

            drawBox(margin, y0, pageW - margin * 2, 92, "#f8fafc", "#e5e7eb");

            const leftX = margin + 12;
            const midX = margin + 290; // columna derecha
            const baseY = y0 + 12;

            doc.font("Helvetica").fontSize(9).fillColor("#111827");

            // Columna izquierda
            doc.text(`Fecha: ${formatDateTime(cab.fecha_nota)}`, leftX, baseY);
            doc.text(`Estado: ${safe(cab.estado)}`, leftX, baseY + 16);
            doc.text(`Operación: ${safe(cab.operacion_nombre)}`, leftX, baseY + 32);
            doc.text(`Origen: ${safe(cab.origen)}`, leftX, baseY + 48);

            // Columna derecha (según tipo)
            const almAfectado =
                (cab.tipo_movimiento || "").toUpperCase() === "SALIDA"
                ? `Almacén salida: ${safe(cab.almacen_salida_nombre)}`
                : `Almacén destino: ${safe(cab.almacen_destino_nombre)}`;

            doc.text(almAfectado, midX, baseY);

            const tercero =
                cab.proveedor_nombre
                ? `Proveedor: ${safe(cab.proveedor_nombre)}`
                : cab.cliente_nombre
                ? `Cliente: ${safe(cab.cliente_nombre)}`
                : null;

            if (tercero) doc.text(tercero, midX, baseY + 16);

            const docComercial = cab.tipo_documento_id
                ? `${safe(cab.tipo_documento_nombre)} ${safe(cab.serie)}-${safe(cab.numero_documento)}`
                : "";

            if (docComercial) doc.text(`Doc. comercial: ${docComercial}`, midX, baseY + 32);
            if (cab.numero_guia) doc.text(`Guía: ${safe(cab.numero_guia)}`, midX, baseY + 48);

            if (cab.observaciones) {
                doc.fontSize(9).fillColor("#374151");
                doc.text(`Obs.: ${safe(cab.observaciones)}`, leftX, baseY + 68, {
                width: pageW - margin * 2 - 24,
                ellipsis: true,
                });
            }

            doc.y = y0 + 102;
            };

            // =========================
            // TABLA - detalle
            // =========================
            // Ajustado para que entre bien en A4 portrait.
            const col = {
            item: 30,
            codigo: 62,
            producto: 220,
            um: 44,
            cant: 60,
            alm: 92,
            lote: 58,
            serie: 70,
            venc: 54,
            };
            const tableW = Object.values(col).reduce((a, b) => a + b, 0);
            const rowH = 16;
            const tableX = margin;

            const drawTableHeader = (y) => {
            // fondo header
            doc.save().rect(tableX, y, tableW, rowH).fillColor("#eef2ff").fill().restore();

            doc.font("Helvetica-Bold").fontSize(8).fillColor("#111827");

            let x = tableX;
            doc.text("#", x + 4, y + 4, { width: col.item - 6 }); x += col.item;
            doc.text("Código", x + 4, y + 4, { width: col.codigo - 6 }); x += col.codigo;
            doc.text("Producto", x + 4, y + 4, { width: col.producto - 6 }); x += col.producto;
            doc.text("UM", x + 4, y + 4, { width: col.um - 6 }); x += col.um;
            doc.text("Cantidad", x, y + 4, { width: col.cant - 6, align: "right" }); x += col.cant;
            doc.text("Almacén", x + 4, y + 4, { width: col.alm - 6 }); x += col.alm;
            doc.text("Lote", x + 4, y + 4, { width: col.lote - 6 }); x += col.lote;
            doc.text("Serie", x + 4, y + 4, { width: col.serie - 6 }); x += col.serie;
            doc.text("Venc.", x + 4, y + 4, { width: col.venc - 6 });

            doc.save().moveTo(tableX, y + rowH).lineTo(tableX + tableW, y + rowH).strokeColor("#dbeafe").stroke().restore();
            };

            const drawRow = (r, y, zebra) => {
            if (zebra) {
                doc.save().rect(tableX, y, tableW, rowH).fillColor("#fafafa").fill().restore();
            }

            doc.font("Helvetica").fontSize(8).fillColor("#111827");

            let x = tableX;
            doc.text(safe(r.numitem), x + 4, y + 4, { width: col.item - 6 }); x += col.item;

            doc.text(safe(r.producto_codigo), x + 4, y + 4, { width: col.codigo - 6, ellipsis: true }); x += col.codigo;

            const prod = safe(r.producto_descripcion);
            doc.text(prod, x + 4, y + 4, { width: col.producto - 6, ellipsis: true }); x += col.producto;

            doc.text(safe(r.unidad_medida), x + 4, y + 4, { width: col.um - 6, ellipsis: true }); x += col.um;

            doc.text(Number(r.cantidad || 0).toFixed(3), x, y + 4, { width: col.cant - 6, align: "right" }); x += col.cant;

            doc.text(safe(r.almacen_nombre), x + 4, y + 4, { width: col.alm - 6, ellipsis: true }); x += col.alm;

            doc.text(safe(r.lote), x + 4, y + 4, { width: col.lote - 6, ellipsis: true }); x += col.lote;

            doc.text(safe(r.serie_producto), x + 4, y + 4, { width: col.serie - 6, ellipsis: true }); x += col.serie;

            doc.text(formatDate(r.fecha_vencimiento), x + 4, y + 4, { width: col.venc - 6, ellipsis: true });

            doc.save().moveTo(tableX, y + rowH).lineTo(tableX + tableW, y + rowH).strokeColor("#f0f0f0").stroke().restore();
            };

            // =========================
            // PIE DE PÁGINA (paginado)
            // =========================
            const drawFooterAllPages = () => {
            const range = doc.bufferedPageRange();
            for (let i = range.start; i < range.start + range.count; i++) {
                doc.switchToPage(i);
                const footerY = doc.page.height - 28;
                drawHR(footerY - 8);

                doc.font("Helvetica").fontSize(8).fillColor("#6b7280")
                .text(`${empresa}`, margin, footerY, { align: "left" });

                doc.font("Helvetica").fontSize(8).fillColor("#6b7280")
                .text(`Página ${i + 1} de ${range.count}`, pageW - margin - 140, footerY, { width: 140, align: "right" });
            }
            };

            // =========================
            // RENDER
            // =========================
            drawHeader();
            drawCabecera();

            // tabla
            let y = doc.y;
            drawTableHeader(y);
            y += rowH;

            let totalCantidad = 0;

            for (let i = 0; i < items.length; i++) {
            const r = items[i];
            totalCantidad += Number(r.cantidad || 0);

            // salto página
            if (y + rowH > pageH - 60) {
                doc.addPage();
                drawHeader();
                drawCabecera();
                y = doc.y;
                drawTableHeader(y);
                y += rowH;
            }

            drawRow(r, y, i % 2 === 1);
            y += rowH;
            }

            // Totales
            const boxY = Math.min(y + 10, pageH - 70);
            drawBox(tableX, boxY, tableW, 30, "#f8fafc", "#e5e7eb");

            doc.font("Helvetica-Bold").fontSize(9).fillColor("#111827")
            .text(`Items: ${items.length}`, tableX + 12, boxY + 9);

            doc.font("Helvetica-Bold").fontSize(9).fillColor("#111827")
            .text(`Total cantidad: ${totalCantidad.toFixed(3)}`, tableX + 160, boxY + 9);

            // Footer paginado
            drawFooterAllPages();

            doc.end();
        } catch (error) {
            console.error("exportNotaPdf error:", error);
            return res.status(500).json({
            success: false,
            message: "Error exportando PDF de la nota",
            error: error.message,
            });
        }
    },

    listarNotas: async (req, res) => {
        const client = await db.pool.connect();

        try {
            const {
                tipo,         // INGRESO | SALIDA | TRANSFERENCIA (o vacío)
                estado,       // BORRADOR | CONFIRMADO | ANULADO
                q,            // búsqueda
                desde,        // YYYY-MM-DD
                hasta,        // YYYY-MM-DD

                // ✅ nuevos filtros separados
                almacen_salida,   // id_alm
                almacen_destino,  // id_alm

                // (opcional) mantener el anterior
                almacen,      // id_alm (OR salida/destino)

                operacion,    // id_cod_operacion
                origen,
                documento,
                page = 1,
                pageSize = 10,
                orderBy = "fecha_nota",
                orderDir = "DESC",
            } = req.query;


            // Seguridad básica en orderBy/orderDir
            const allowedOrderBy = new Set(["fecha_nota", "numero", "estado", "id_nota"]);
            const safeOrderBy = allowedOrderBy.has(orderBy) ? orderBy : "fecha_nota";
            const safeOrderDir = String(orderDir).toUpperCase() === "ASC" ? "ASC" : "DESC";

            const limit = Math.min(Math.max(parseInt(pageSize, 10) || 10, 1), 100);
            const offset = (Math.max(parseInt(page, 10) || 1, 1) - 1) * limit;

            const where = [];
            const params = [];
            let p = 1;

            // --- joins base ---
            // n: notas
            // d: documentos (codigo, nombre)
            // co: cod_operacion (codigo/nombre/siglas/tipo_movimiento)
            // aS/aD: almacenes salida/destino
            const baseFrom = `
            FROM almacen.notas n
            JOIN public.documentos d ON d.id_documento = n.documento_interno_id
            JOIN public.cod_operacion co ON co.id_cod_operacion = n.cod_operacion
            LEFT JOIN almacen.almacenes alm_sal ON alm_sal.id_alm = n.almacen_salida
            LEFT JOIN almacen.almacenes alm_des ON alm_des.id_alm = n.almacen_destino
            `;

            // --- filtros ---
            if (estado) {
            params.push(String(estado).toUpperCase());
            where.push(`n.estado = $${p++}`);
            }

            if (origen) {
            params.push(String(origen).toUpperCase());
            where.push(`n.origen = $${p++}`);
            }

            if (documento) {
            params.push(Number(documento));
            where.push(`n.documento_interno_id = $${p++}`);
            }

            if (operacion) {
            params.push(Number(operacion));
            where.push(`n.cod_operacion = $${p++}`);
            }

            if (desde) {
            params.push(desde);
            where.push(`n.fecha_nota >= $${p++}::date`);
            }

            if (hasta) {
            // incluye todo el día "hasta"
            params.push(hasta);
            where.push(`n.fecha_nota < ($${p++}::date + interval '1 day')`);
            }

            // filtros separados
            if (almacen_salida) {
            params.push(Number(almacen_salida));
            where.push(`n.almacen_salida = $${p++}`);
            }

            if (almacen_destino) {
            params.push(Number(almacen_destino));
            where.push(`n.almacen_destino = $${p++}`);
            }

            // (opcional) mantener el filtro viejo como comodín OR
            if (almacen) {
            params.push(Number(almacen));
            where.push(`($${p++} = n.almacen_salida OR $${p - 1} = n.almacen_destino)`);
            }

            if (q && String(q).trim()) {
            const like = `%${String(q).trim()}%`;
            params.push(like);
            where.push(`
                (
                n.numero ILIKE $${p}
                OR COALESCE(n.serie,'') ILIKE $${p}
                OR COALESCE(n.numero_documento,'') ILIKE $${p}
                OR COALESCE(n.numero_guia,'') ILIKE $${p}
                OR d.codigo ILIKE $${p}
                OR d.nombre ILIKE $${p}
                OR co.nombre ILIKE $${p}
                OR co.siglas ILIKE $${p}
                )
            `.replace(/\s+/g, " ").trim());
            p++;
            }

            // ✅ filtro por "tipo" (lo más estable es por código de documento)
            // - Ingresos suelen ser NI*, salidas NS*, transferencias NT*
            if (tipo) {
            const t = String(tipo).toUpperCase();
            if (t === "TRANSFERENCIA") {
                where.push(`d.codigo ILIKE 'NT%'`);
            } else if (t === "INGRESO") {
                where.push(`d.codigo ILIKE 'NI%'`);
            } else if (t === "SALIDA") {
                where.push(`d.codigo ILIKE 'NS%'`);
            }
            // Si quieres además soportar tipo_movimiento del documento:
            // where.push(`TRIM(d.tipo_movimiento) = 'INGRESO'`) etc.
            }

            const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

            // --- total ---
            const countSql = `SELECT COUNT(*)::int AS total ${baseFrom} ${whereSql}`;
            const countRes = await client.query(countSql, params);
            const total = countRes.rows[0]?.total ?? 0;

            // --- data ---
            // Aquí devuelvo campos listos para tu tabla: operación, almacenes, estado, etc.
            const dataSql = `
                SELECT
                n.id_nota,
                n.numero,
                n.estado,
                n.fecha_nota,
                n.cod_operacion,
                co.codigo AS cod_operacion_codigo,
                co.nombre AS cod_operacion_nombre,
                n.origen,

                n.almacen_salida,
                alm_sal.nombre AS almacen_salida_nombre,

                n.almacen_destino,
                alm_des.nombre AS almacen_destino_nombre,

                n.documento_interno_id,
                d.codigo AS documento_codigo,
                d.nombre AS documento_nombre,

                n.serie,
                n.numero_documento,
                n.numero_guia,

                n.cliente_id,
                n.proveedor_id,
                n.orden_compra_id,

                n.observaciones
                ${baseFrom}
                ${whereSql}
                ORDER BY n.${safeOrderBy} ${safeOrderDir}
                LIMIT $${p} OFFSET $${p + 1}
            `;

            const dataParams = params.concat([limit, offset]);
            const dataRes = await client.query(dataSql, dataParams);

            return res.json({
            success: true,
            data: dataRes.rows,
            pagination: {
                total,
                page: Math.max(parseInt(page, 10) || 1, 1),
                pageSize: limit,
                pages: Math.ceil(total / limit),
            },
            filters_applied: {
                tipo, estado, q, desde, hasta,
                almacen_salida, almacen_destino, almacen,
                operacion, origen, documento,
                orderBy: safeOrderBy, orderDir: safeOrderDir,
            },
            });
        } catch (error) {
            console.error("listarNotas error:", error);
            return res.status(500).json({
            success: false,
            message: "Error al listar notas",
            error: error.message,
            });
        } finally {
            client.release();
        }
    },



};

module.exports = notasController;
