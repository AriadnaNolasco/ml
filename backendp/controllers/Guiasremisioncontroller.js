// =====================================================
// guiasRemisionController.js
// Controlador para gestión de Guías de Remisión
// Radiadores Fortaleza S.A.
// =====================================================

const db = require("../config/db");
const pool = db.pool; // Pool de conexiones de PostgreSQL

// =====================================================
// FUNCIÓN AUXILIAR: Generar Nota de Salida Borrador
// =====================================================
const generarNotaSalidaBorrador = async (guia_id, usuario_id, client) => {
    try {
        console.log(`📝 Generando nota de salida borrador para guía ${guia_id}`);

        // 1. Obtener datos de la guía
        const guiaQuery = `
            SELECT
                g.*,
                d.codigo as documento_codigo,
                p.numero as pedido_numero
            FROM ventas.guias_remision g
            LEFT JOIN public.documentos d ON g.id_documento = d.id_documento
            LEFT JOIN ventas.pedidos_cliente p ON g.pedido_id = p.id_pedido
            WHERE g.id_guia = $1
        `;
        const guiaResult = await client.query(guiaQuery, [guia_id]);

        if (guiaResult.rows.length === 0) {
            throw new Error(`Guía ${guia_id} no encontrada`);
        }

        const guia = guiaResult.rows[0];

        // 2. Obtener id del documento 'NS' (Nota de Salida)
        const docNSQuery = `
            SELECT id_documento
            FROM public.documentos
            WHERE codigo = 'NS'
        `;
        const docNSResult = await client.query(docNSQuery);

        if (docNSResult.rows.length === 0) {
            throw new Error('Documento NS (Nota de Salida) no encontrado en la base de datos');
        }

        const documento_interno_id = docNSResult.rows[0].id_documento;

        // 3. Obtener código de operación para "Despacho por venta a cliente" (151)
        const codOpQuery = `
            SELECT id_cod_operacion
            FROM public.cod_operacion
            WHERE codigo::INTEGER = 151
        `;
        const codOpResult = await client.query(codOpQuery);

        if (codOpResult.rows.length === 0) {
            throw new Error('Código de operación 151 (Despacho por venta) no encontrado');
        }

        const cod_operacion = codOpResult.rows[0].id_cod_operacion;

        // 4. Obtener siguiente número correlativo para la Nota de Salida
        const numeroQuery = `
            SELECT numero
            FROM almacen.notas
            WHERE documento_interno_id = $1
            ORDER BY id_nota DESC
            LIMIT 1
        `;
        const numeroResult = await client.query(numeroQuery, [documento_interno_id]);

        let numero_nota = '000000001';
        if (numeroResult.rows.length > 0) {
            const lastNumber = numeroResult.rows[0].numero;
            const numericPart = parseInt(lastNumber, 10);
            if (!isNaN(numericPart)) {
                const incremented = numericPart + 1;
                numero_nota = incremented.toString().padStart(9, '0');
            }
        }

        // 5. Insertar cabecera de la Nota de Salida en BORRADOR
        const insertNotaQuery = `
            INSERT INTO almacen.notas (
                documento_interno_id,
                numero,
                cod_operacion,
                origen,
                almacen_salida,
                cliente_id,
                numero_guia,
                estado,
                observaciones,
                usuario_registro
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
            )
            RETURNING id_nota
        `;

        const notaResult = await client.query(insertNotaQuery, [
            documento_interno_id,
            numero_nota,
            cod_operacion,
            'CLIENTE', // origen
            guia.almacen_id,
            guia.cliente_id,
            guia.numero, // número de guía de remisión
            'BORRADOR', // estado - NO afecta stock hasta confirmar
            `Nota de salida generada automáticamente para guía ${guia.numero}`,
            usuario_id
        ]);

        const id_nota = notaResult.rows[0].id_nota;
        console.log(`✅ Nota de salida ${numero_nota} creada con ID: ${id_nota} (BORRADOR)`);

        // 6. Obtener detalles de la guía
        const detallesGuiaQuery = `
            SELECT
                dg.*,
                pr.id_producto,
                um.siglas as unidad_medida
            FROM ventas.detalle_guia_remision dg
            LEFT JOIN almacen.productos pr ON dg.producto_id = pr.id_producto
            LEFT JOIN public.unidades_medida um ON pr.id_unidad = um.id_unidades
            WHERE dg.guia_id = $1
            ORDER BY dg.numitem
        `;
        const detallesGuia = await client.query(detallesGuiaQuery, [guia_id]);

        // 7. Insertar detalles de la Nota de Salida
        for (const detalle of detallesGuia.rows) {
            await client.query(`
                INSERT INTO almacen.notas_detalle (
                    numitem,
                    id_nota,
                    almacen_id,
                    id_producto,
                    unidad_medida,
                    cantidad,
                    comentario
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                detalle.numitem,
                id_nota,
                guia.almacen_id,
                detalle.producto_id,
                detalle.unidad_medida || 'UND',
                detalle.cantidad_despachada,
                `Producto: ${detalle.descripcion}`
            ]);
        }

        console.log(`✅ Nota de salida generada con ${detallesGuia.rows.length} items`);
        console.log(`⚠️  IMPORTANTE: La nota está en BORRADOR. El stock NO se afectará hasta que se confirme la nota.`);

        return {
            id_nota,
            numero: numero_nota,
            total_items: detallesGuia.rows.length
        };

    } catch (error) {
        console.error('❌ Error al generar nota de salida borrador:', error);
        throw error;
    }
};

// =====================================================
// OBTENER DATOS PARA FORMULARIO DE NUEVA GUÍA
// =====================================================
const obtenerDatosFormularioGuia = async (req, res) => {
    try {
        // Ejecutar consultas en paralelo para mejor rendimiento
        const [
            puntosPartidaResult,
            almacenesResult,
            vehiculosResult,
            choferesResult,
            transportistasResult
        ] = await Promise.all([
            pool.query(`
        SELECT id_partida, codigo, direccion
        FROM ventas.puntos_partida
        WHERE estado = true
        ORDER BY codigo
      `),
            pool.query(`
        SELECT id_alm, codigo, nombre
        FROM almacen.almacenes
        ORDER BY codigo
      `),
            pool.query(`
        SELECT id_vehiculo, placa, marca, modelo, carroceria
        FROM ventas.vehiculos
        WHERE estado = true
        ORDER BY placa
      `),
            pool.query(`
        SELECT
          id_chofer,
          codigo,
          nombre_completo,
          nro_documento,
          nro_licencia,
          tipo_pertenencia
        FROM ventas.choferes
        WHERE estado = true
        ORDER BY nombre_completo
      `),
            pool.query(`
        SELECT
          id_transportista,
          codigo,
          razon_social,
          nro_documento
        FROM ventas.transportistas
        WHERE estado = true
        ORDER BY razon_social
      `)
        ]);

        res.json({
            success: true,
            data: {
                puntos_partida: puntosPartidaResult.rows,
                almacenes: almacenesResult.rows,
                vehiculos: vehiculosResult.rows,
                choferes: choferesResult.rows,
                transportistas: transportistasResult.rows,
                motivos_traslado: [
                    { value: 'VENTA', label: 'Venta', codigo: '01' },
                    { value: 'COMPRA', label: 'Compra', codigo: '02' },
                    { value: 'CONSIGNACION', label: 'Consignación', codigo: '04' },
                    { value: 'DEVOLUCION', label: 'Devolución', codigo: '05' },
                    { value: 'TRASLADO_EMISOR', label: 'Traslado entre locales del emisor', codigo: '13' },
                    { value: 'OTROS', label: 'Otros', codigo: '18' }
                ]
            }
        });
    } catch (error) {
        console.error('❌ Error al obtener datos del formulario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener datos del formulario',
            error: error.message
        });
    }
};

// =====================================================
// ANALIZAR PEDIDO PARA GUÍA
// Obtiene productos pendientes agrupados por almacén
// =====================================================
const analizarPedidoParaGuia = async (req, res) => {
    try {
        const { pedido_id } = req.params;

        console.log(`📊 Analizando pedido ${pedido_id} para generación de guía`);

        // 1. Obtener información del pedido
        const pedidoQuery = `
      SELECT 
        p.id_pedido,
        p.numero,
        p.fecha,
        p.estado,
        p.id_cliente,
        p.codigo_cliente,
        p.razon_social_cliente,
        p.nro_documento_cliente,
        p.direccion_cliente,
        p.total,
        pp.direccion as lugar_entrega
      FROM ventas.pedidos_cliente p
      LEFT JOIN ventas.puntos_partida pp ON p.lugar_entrega = pp.id_partida
      WHERE p.id_pedido = $1
    `;
        const pedidoResult = await pool.query(pedidoQuery, [pedido_id]);

        if (pedidoResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }

        const pedido = pedidoResult.rows[0];

        // 2. Verificar estado del pedido
        if (pedido.estado !== 'PENDIENTE' && pedido.estado !== 'PARCIAL' && pedido.estado !== 'EN PREPARACIÓN') {
            return res.status(400).json({
                success: false,
                message: `No se pueden generar guías para pedidos en estado ${pedido.estado}`
            });
        }

        // 3. Obtener resumen por almacén directamente sin función
        const resumenQuery = `
            SELECT
                dp.almacen_id,
                CAST(a.codigo as VARCHAR) as almacen_codigo,
                a.nombre as almacen_nombre,
                COUNT(dp.id_detalle_pedido) as cantidad_productos,
                SUM(dp.cantidad_pendiente) as cantidad_total,
                SUM(dp.cantidad_pendiente * dp.precio_unitario) as valor_total,
                (SUM(dp.cantidad_pendiente) > 0) as tiene_pendientes
            FROM ventas.detalle_pedidos_cliente dp
            LEFT JOIN almacen.almacenes a ON dp.almacen_id = a.id_alm
            WHERE dp.pedido_id = $1
            GROUP BY dp.almacen_id, a.codigo, a.nombre
            ORDER BY cantidad_productos DESC
        `;
        const resumenResult = await pool.query(resumenQuery, [pedido_id]);

        // 4. Obtener productos pendientes con detalle
        const productosQuery = `
      SELECT 
        dp.id_detalle_pedido,
        dp.numitem,
        dp.producto_id,
        pr.codigo as codigo_producto,
        dp.descripcion_producto,
        um.siglas as unidad_medida,
        dp.almacen_id,
        a.codigo as almacen_codigo,
        a.nombre as almacen_nombre,
        dp.cantidad_solicitada,
        dp.cantidad_despachada,
        dp.cantidad_pendiente,
        dp.precio_unitario,
        (dp.cantidad_pendiente * dp.precio_unitario) as valor_pendiente,
        
        -- Stock disponible
        COALESCE(pr.stock_actual, 0) as stock_actual,
        almacen.calcular_stock_disponible(pr.id_producto) as stock_disponible,

        -- Reserva para este pedido
        COALESCE(r.cantidad_reservada, 0) as cantidad_reservada,
        r.estado as estado_reserva,

        -- Stock efectivo (considera reservas de ESTE pedido)
        -- Si hay reserva ACTIVA para este pedido, usarla. Si no, usar stock disponible general.
        CASE
          WHEN r.estado = 'ACTIVA' THEN COALESCE(r.cantidad_reservada, 0)
          ELSE almacen.calcular_stock_disponible(pr.id_producto)
        END as stock_efectivo,

        -- Estado de disponibilidad (considera RESERVAS de este pedido)
        CASE
          WHEN dp.cantidad_pendiente <= 0 THEN 'COMPLETADO'
          -- Si hay reserva ACTIVA para este pedido, verificar contra la reserva
          WHEN r.estado = 'ACTIVA' AND COALESCE(r.cantidad_reservada, 0) >= dp.cantidad_pendiente THEN 'DISPONIBLE'
          WHEN r.estado = 'ACTIVA' AND COALESCE(r.cantidad_reservada, 0) > 0 THEN 'PARCIAL'
          -- Si NO hay reserva, verificar contra stock disponible general
          WHEN r.estado IS NULL AND almacen.calcular_stock_disponible(pr.id_producto) >= dp.cantidad_pendiente THEN 'DISPONIBLE'
          WHEN r.estado IS NULL AND almacen.calcular_stock_disponible(pr.id_producto) > 0 THEN 'PARCIAL'
          ELSE 'SIN_STOCK'
        END as estado_disponibilidad,

        -- Cantidad máxima despachable (considera RESERVAS de este pedido)
        LEAST(
          dp.cantidad_pendiente,
          CASE
            WHEN r.estado = 'ACTIVA' THEN GREATEST(0, COALESCE(r.cantidad_reservada, 0))
            ELSE GREATEST(0, almacen.calcular_stock_disponible(pr.id_producto))
          END
        ) as cantidad_despachable
        
      FROM ventas.detalle_pedidos_cliente dp
      LEFT JOIN almacen.productos pr ON dp.producto_id = pr.id_producto
      LEFT JOIN public.unidades_medida um ON pr.id_unidad = um.id_unidades
      LEFT JOIN almacen.almacenes a ON dp.almacen_id = a.id_alm
      LEFT JOIN almacen.reservas_stock r ON dp.id_detalle_pedido = r.id_detalle_pedido 
        AND r.estado = 'ACTIVA'
      WHERE dp.pedido_id = $1
        AND dp.cantidad_pendiente > 0
      ORDER BY a.codigo, dp.numitem
    `;
        const productosResult = await pool.query(productosQuery, [pedido_id]);

        // 5. Obtener guías ya generadas para este pedido
        const guiasQuery = `
            SELECT
                g.id_guia,
                g.numero,
                g.fecha_emision,
                g.fecha_traslado,
                g.estado,
                a.nombre as almacen_nombre,
                g.chofer_nombre,
                g.vehiculo_placa,
                COUNT(dg.id_detalle_guia) as total_items,
                g.valor_total,
                g.peso_bruto_total as peso_bruto
            FROM ventas.guias_remision g
            LEFT JOIN almacen.almacenes a ON g.almacen_id = a.id_alm
            LEFT JOIN ventas.detalle_guia_remision dg ON g.id_guia = dg.guia_id
            WHERE g.pedido_id = $1
            GROUP BY g.id_guia, a.nombre
            ORDER BY g.fecha_emision DESC
        `;
        const guiasResult = await pool.query(guiasQuery, [pedido_id]);

        // 5.1 Verificar si existen guías activas con notas de salida en BORRADOR
        const guiasConNotaBorradorQuery = `
            SELECT
                g.id_guia,
                g.numero as numero_guia,
                n.numero as numero_nota,
                n.estado as estado_nota
            FROM ventas.guias_remision g
            JOIN almacen.notas n ON n.numero_guia = g.numero
            WHERE g.pedido_id = $1
              AND g.estado != 'ANULADO'
              AND n.estado = 'BORRADOR'
        `;
        const guiasConNotaBorradorResult = await pool.query(guiasConNotaBorradorQuery, [pedido_id]);
        const tiene_guia_pendiente_confirmacion = guiasConNotaBorradorResult.rows.length > 0;

        // 6. Calcular resumen general
        const productos = productosResult.rows;
        const resumen = {
            total_productos_pendientes: productos.length,
            productos_disponibles: productos.filter(p => p.estado_disponibilidad === 'DISPONIBLE').length,
            productos_parciales: productos.filter(p => p.estado_disponibilidad === 'PARCIAL').length,
            productos_sin_stock: productos.filter(p => p.estado_disponibilidad === 'SIN_STOCK').length,
            valor_total_pendiente: productos.reduce((sum, p) => sum + parseFloat(p.valor_pendiente || 0), 0),
            cantidad_almacenes: resumenResult.rows.length,
            requiere_multiples_guias: resumenResult.rows.length > 1,
            guias_generadas: guiasResult.rows.length,
            tiene_guia_pendiente_confirmacion: tiene_guia_pendiente_confirmacion,
            puede_crear_nueva_guia: !tiene_guia_pendiente_confirmacion && productos.length > 0
        };

        res.json({
            success: true,
            data: {
                pedido,
                resumen_almacenes: resumenResult.rows,
                productos: productos,
                guias_existentes: guiasResult.rows,
                guias_pendientes_confirmacion: guiasConNotaBorradorResult.rows,
                resumen
            }
        });

    } catch (error) {
        console.error('❌ Error al analizar pedido para guía:', error);
        res.status(500).json({
            success: false,
            message: 'Error al analizar pedido para guía',
            error: error.message
        });
    }
};

// =====================================================
// VALIDAR PRODUCTOS PARA GUÍA
// =====================================================
const validarProductosGuia = async (req, res) => {
    try {
        const { pedido_id, detalles } = req.body;

        if (!pedido_id || !detalles || !Array.isArray(detalles) || detalles.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar pedido_id y al menos un detalle'
            });
        }

        console.log(`🔍 Validando ${detalles.length} productos para guía`);

        // Lógica de validación migrada desde SQL a JavaScript
        const errores = [];

        // Verificar que el pedido existe
        const pedidoQuery = await pool.query(
            'SELECT 1 FROM ventas.pedidos_cliente WHERE id_pedido = $1',
            [pedido_id]
        );

        if (pedidoQuery.rows.length === 0) {
            return res.status(400).json({
                success: false,
                esValido: false,
                message: 'El pedido no existe',
                errores: [{ error: 'Pedido no encontrado' }]
            });
        }

        // Validar cada producto
        for (const detalle of detalles) {
            const { detalle_pedido_id, cantidad } = detalle;

            // Obtener información del detalle del pedido
            const detalleQuery = await pool.query(`
                SELECT
                    dp.cantidad_pendiente,
                    dp.producto_id
                FROM ventas.detalle_pedidos_cliente dp
                WHERE dp.id_detalle_pedido = $1
                    AND dp.pedido_id = $2
            `, [detalle_pedido_id, pedido_id]);

            if (detalleQuery.rows.length === 0) {
                errores.push({
                    detalle_pedido_id,
                    error: 'El detalle no existe en el pedido'
                });
                continue;
            }

            const producto = detalleQuery.rows[0];

            if (cantidad <= 0) {
                errores.push({
                    detalle_pedido_id,
                    error: 'La cantidad debe ser mayor a 0'
                });
            }

            if (cantidad > producto.cantidad_pendiente) {
                errores.push({
                    detalle_pedido_id,
                    error: 'La cantidad excede lo pendiente',
                    cantidad_solicitada: cantidad,
                    cantidad_disponible: producto.cantidad_pendiente
                });
            }
        }

        // Retornar resultado
        if (errores.length > 0) {
            return res.status(400).json({
                success: false,
                esValido: false,
                message: 'Errores de validación',
                errores
            });
        }

        res.json({
            success: true,
            esValido: true,
            message: 'Validación exitosa - Productos listos para generar guía'
        });

    } catch (error) {
        console.error('❌ Error al validar productos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al validar productos',
            error: error.message
        });
    }
};

// =====================================================
// CREAR GUÍA DE REMISIÓN
// Lógica migrada desde PostgreSQL a JavaScript
// =====================================================
const crearGuiaRemision = async (req, res) => {
    const {
        pedido_id,
        fecha_traslado,
        punto_partida_id,
        direccion_llegada,
        motivo_traslado,
        almacen_id,
        transportista_id,
        vehiculo_id,
        chofer_id,
        peso_bruto,
        numero_bultos,
        observaciones,
        detalles  // Array de {detalle_pedido_id, cantidad}
    } = req.body;

    const usuario_id = req.userId || 1;
    let guia_id = null;
    let numero_guia = null;
    let nota_salida = null;

    // Obtener cliente de pool para manejar la transacción
    const client = await pool.connect();

    try {
        // Validaciones básicas
        if (!pedido_id) {
            return res.status(400).json({
                success: false,
                message: 'El ID del pedido es requerido'
            });
        }

        if (!detalles || !Array.isArray(detalles) || detalles.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Debe incluir al menos un producto en la guía'
            });
        }

        if (!fecha_traslado) {
            return res.status(400).json({
                success: false,
                message: 'La fecha de traslado es requerida'
            });
        }

        console.log(`📦 Creando guía de remisión para pedido ${pedido_id}`);
        console.log(`📋 Detalles recibidos:`, detalles);

        await client.query('BEGIN');

        // 0. VALIDAR QUE NO EXISTA UNA GUÍA ACTIVA CON NOTA EN BORRADOR
        console.log('🔍 Verificando si existen guías pendientes...');
        const guiasConNotaBorradorCheck = await client.query(`
            SELECT
                g.numero as numero_guia,
                n.numero as numero_nota
            FROM ventas.guias_remision g
            JOIN almacen.notas n ON n.numero_guia = g.numero
            WHERE g.pedido_id = $1
              AND g.estado != 'ANULADO'
              AND n.estado = 'BORRADOR'
            LIMIT 1
        `, [pedido_id]);

        console.log(`✅ Guías pendientes encontradas: ${guiasConNotaBorradorCheck.rows.length}`);

        if (guiasConNotaBorradorCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            const guiaPendiente = guiasConNotaBorradorCheck.rows[0];
            console.log(`❌ BLOQUEADO: Guía ${guiaPendiente.numero_guia} con nota ${guiaPendiente.numero_nota} en BORRADOR`);
            return res.status(400).json({
                success: false,
                message: `No se puede crear una nueva guía porque ya existe la guía ${guiaPendiente.numero_guia} con nota de salida ${guiaPendiente.numero_nota} en estado BORRADOR. Debe confirmar o anular la nota de salida antes de crear una nueva guía.`,
                guia_pendiente: guiaPendiente
            });
        }

        // 1. VALIDAR PRODUCTOS (lógica en JavaScript)
        console.log('🔍 Validando productos...');
        const errores = [];

        // Verificar que el pedido existe
        const pedidoExiste = await client.query(
            'SELECT 1 FROM ventas.pedidos_cliente WHERE id_pedido = $1',
            [pedido_id]
        );

        if (pedidoExiste.rows.length === 0) {
            await client.query('ROLLBACK');
            console.log('❌ ERROR: El pedido no existe');
            return res.status(400).json({
                success: false,
                message: 'El pedido no existe'
            });
        }

        console.log('✅ Pedido existe');

        // Validar cada producto
        for (const detalle of detalles) {
            const { detalle_pedido_id, cantidad } = detalle;

            console.log(`🔍 Validando detalle ${detalle_pedido_id}, cantidad: ${cantidad} (tipo: ${typeof cantidad})`);

            const detalleQuery = await client.query(`
                SELECT
                    dp.cantidad_pendiente,
                    dp.producto_id
                FROM ventas.detalle_pedidos_cliente dp
                WHERE dp.id_detalle_pedido = $1
                    AND dp.pedido_id = $2
            `, [detalle_pedido_id, pedido_id]);

            if (detalleQuery.rows.length === 0) {
                console.log(`❌ ERROR: Detalle ${detalle_pedido_id} no existe en el pedido`);
                errores.push({
                    detalle_pedido_id,
                    error: 'El detalle no existe en el pedido'
                });
                continue;
            }

            const producto = detalleQuery.rows[0];
            console.log(`✅ Detalle encontrado - Cantidad pendiente: ${producto.cantidad_pendiente}`);

            // Convertir cantidad a número para asegurar comparación correcta
            const cantidadNum = parseFloat(cantidad);

            if (cantidadNum <= 0) {
                console.log(`❌ ERROR: Cantidad ${cantidadNum} es menor o igual a 0`);
                errores.push({
                    detalle_pedido_id,
                    error: 'La cantidad debe ser mayor a 0'
                });
            }

            if (cantidadNum > producto.cantidad_pendiente) {
                console.log(`❌ ERROR: Cantidad ${cantidadNum} excede lo pendiente ${producto.cantidad_pendiente}`);
                errores.push({
                    detalle_pedido_id,
                    error: 'La cantidad excede lo pendiente',
                    cantidad_solicitada: cantidadNum,
                    cantidad_disponible: producto.cantidad_pendiente
                });
            }
        }

        if (errores.length > 0) {
            await client.query('ROLLBACK');
            console.log('❌ ERRORES DE VALIDACIÓN:', errores);
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errores
            });
        }

        console.log('✅ Todos los productos validados correctamente');

        // 2. OBTENER DATOS DEL PEDIDO Y CLIENTE
        const clienteQuery = await client.query(`
            SELECT
                p.id_cliente,
                c.nro_documento,
                c.razon_social,
                c.direccion
            FROM ventas.pedidos_cliente p
            JOIN ventas.clientes c ON p.id_cliente = c.id_cliente
            WHERE p.id_pedido = $1
        `, [pedido_id]);

        const cliente = clienteQuery.rows[0];

        // 3. OBTENER PUNTO DE PARTIDA
        let direccion_partida = '';
        if (punto_partida_id) {
            const puntoPartidaQuery = await client.query(
                'SELECT direccion FROM ventas.puntos_partida WHERE id_partida = $1',
                [punto_partida_id]
            );
            if (puntoPartidaQuery.rows.length > 0) {
                direccion_partida = puntoPartidaQuery.rows[0].direccion;
            }
        }

        // 4. OBTENER DATOS DE TRANSPORTISTA (si aplica)
        let transportista = { nro_documento: null, razon_social: null };
        if (transportista_id) {
            const transportistaQuery = await client.query(
                'SELECT nro_documento, razon_social FROM ventas.transportistas WHERE id_transportista = $1',
                [transportista_id]
            );
            if (transportistaQuery.rows.length > 0) {
                transportista = transportistaQuery.rows[0];
            }
        }

        // 5. OBTENER DATOS DEL VEHÍCULO (si aplica)
        let vehiculo_placa = null;
        if (vehiculo_id) {
            const vehiculoQuery = await client.query(
                'SELECT placa FROM ventas.vehiculos WHERE id_vehiculo = $1',
                [vehiculo_id]
            );
            if (vehiculoQuery.rows.length > 0) {
                vehiculo_placa = vehiculoQuery.rows[0].placa;
            }
        }

        // 6. OBTENER DATOS DEL CHOFER (si aplica)
        let chofer = { nro_documento: null, nombre_completo: null, nro_licencia: null };
        if (chofer_id) {
            const choferQuery = await client.query(
                'SELECT nro_documento, nombre_completo, nro_licencia FROM ventas.choferes WHERE id_chofer = $1',
                [chofer_id]
            );
            if (choferQuery.rows.length > 0) {
                chofer = choferQuery.rows[0];
            }
        }

        // 7. INSERTAR CABECERA DE LA GUÍA
        const insertGuiaQuery = `
            INSERT INTO ventas.guias_remision (
                id_documento,
                fecha_traslado,
                pedido_id,
                cliente_id,
                cliente_documento,
                cliente_razon_social,
                cliente_direccion,
                punto_partida_id,
                direccion_partida,
                direccion_llegada,
                almacen_id,
                motivo_traslado,
                transportista_id,
                transportista_documento,
                transportista_razon_social,
                vehiculo_id,
                vehiculo_placa,
                chofer_id,
                chofer_documento,
                chofer_nombre,
                chofer_licencia,
                peso_bruto_total,
                numero_bultos,
                observaciones,
                created_by
            ) VALUES (
                (SELECT id_documento FROM public.documentos WHERE codigo = 'GR1'),
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
                $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
            )
            RETURNING id_guia, numero
        `;

        const guiaResult = await client.query(insertGuiaQuery, [
            fecha_traslado,
            pedido_id,
            cliente.id_cliente,
            cliente.nro_documento,
            cliente.razon_social,
            cliente.direccion,
            punto_partida_id,
            direccion_partida,
            direccion_llegada || '',
            almacen_id,
            motivo_traslado || 'VENTA',
            transportista_id,
            transportista.nro_documento,
            transportista.razon_social,
            vehiculo_id,
            vehiculo_placa,
            chofer_id,
            chofer.nro_documento,
            chofer.nombre_completo,
            chofer.nro_licencia,
            peso_bruto || 0,
            numero_bultos || 0,
            observaciones || '',
            usuario_id
        ]);

        guia_id = guiaResult.rows[0].id_guia;
        numero_guia = guiaResult.rows[0].numero;

        console.log(`✅ Guía creada con ID: ${guia_id}, Número: ${numero_guia}`);

        // 8. INSERTAR DETALLES DE LA GUÍA
        let numitem = 1;
        let valor_total = 0;

        for (const detalle of detalles) {
            // Obtener datos del producto Y precio_total (con IGV)
            const productoQuery = await client.query(`
                SELECT
                    dp.producto_id,
                    pr.codigo,
                    dp.descripcion_producto,
                    um.siglas,
                    dp.precio_unitario,
                    dp.cantidad_solicitada,
                    dp.precio_total
                FROM ventas.detalle_pedidos_cliente dp
                JOIN almacen.productos pr ON dp.producto_id = pr.id_producto
                LEFT JOIN public.unidades_medida um ON pr.id_unidad = um.id_unidades
                WHERE dp.id_detalle_pedido = $1
            `, [detalle.detalle_pedido_id]);

            if (productoQuery.rows.length === 0) {
                continue;
            }

            const producto = productoQuery.rows[0];
            const cantidad = parseFloat(detalle.cantidad);
            const precio_unitario = parseFloat(producto.precio_unitario || 0);

            // Calcular valor_linea CON IGV (basado en precio_total del pedido)
            const precio_total_unitario = parseFloat(producto.precio_total || 0) / parseFloat(producto.cantidad_solicitada || 1);
            const valor_linea = cantidad * precio_total_unitario;

            // Insertar detalle
            await client.query(`
                INSERT INTO ventas.detalle_guia_remision (
                    guia_id,
                    detalle_pedido_id,
                    numitem,
                    producto_id,
                    codigo_producto,
                    descripcion,
                    unidad_medida,
                    cantidad_despachada,
                    precio_unitario,
                    valor_total
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [
                guia_id,
                detalle.detalle_pedido_id,
                numitem,
                producto.producto_id,
                producto.codigo,
                producto.descripcion_producto,
                producto.siglas || 'UND',
                cantidad,
                precio_unitario,
                valor_linea
            ]);

            valor_total += valor_linea;
            numitem++;
        }

        // 9. ACTUALIZAR VALOR TOTAL EN CABECERA
        await client.query(
            'UPDATE ventas.guias_remision SET valor_total = $1 WHERE id_guia = $2',
            [valor_total, guia_id]
        );

        console.log(`✅ Guía ${numero_guia} creada exitosamente con ${detalles.length} productos`);

        // 10. GENERAR NOTA DE SALIDA BORRADOR AUTOMÁTICAMENTE
        console.log('📝 Generando nota de salida borrador automáticamente...');
        nota_salida = await generarNotaSalidaBorrador(guia_id, usuario_id, client);

        await client.query('COMMIT');

        // 11. OBTENER LA GUÍA CREADA CON TODOS SUS DATOS
        const guiaQuery = `
            SELECT * FROM ventas.vista_guias_remision WHERE id_guia = $1
        `;
        const guia = await pool.query(guiaQuery, [guia_id]);

        // 12. OBTENER DETALLES DE LA GUÍA
        const detallesQuery = `
            SELECT
                dg.*,
                pr.codigo as producto_codigo
            FROM ventas.detalle_guia_remision dg
            LEFT JOIN almacen.productos pr ON dg.producto_id = pr.id_producto
            WHERE dg.guia_id = $1
            ORDER BY dg.numitem
        `;
        const detallesGuia = await pool.query(detallesQuery, [guia_id]);

        res.status(201).json({
            success: true,
            message: `Guía de remisión ${numero_guia} creada exitosamente. Nota de salida ${nota_salida.numero} generada en BORRADOR.`,
            data: {
                guia: guia.rows[0],
                detalles: detallesGuia.rows,
                nota_salida: {
                    id_nota: nota_salida.id_nota,
                    numero: nota_salida.numero,
                    total_items: nota_salida.total_items,
                    estado: 'BORRADOR',
                    mensaje: 'La nota de salida está en BORRADOR. El stock NO se afectará hasta que se confirme la nota.'
                }
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error al crear guía de remisión:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear guía de remisión',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// =====================================================
// OBTENER TODAS LAS GUÍAS DE REMISIÓN (con filtros)
// =====================================================
const obtenerGuiasRemision = async (req, res) => {
    try {
        const {
            estado,
            fecha_desde,
            fecha_hasta,
            cliente,
            pedido_id,
            almacen_id
        } = req.query;

        let query = `
      SELECT * FROM ventas.vista_guias_remision
      WHERE 1=1
    `;

        const params = [];
        let paramCount = 1;

        if (estado) {
            query += ` AND estado = $${paramCount}`;
            params.push(estado);
            paramCount++;
        }

        if (fecha_desde) {
            query += ` AND fecha_emision >= $${paramCount}`;
            params.push(fecha_desde);
            paramCount++;
        }

        if (fecha_hasta) {
            query += ` AND fecha_emision <= $${paramCount}`;
            params.push(fecha_hasta);
            paramCount++;
        }

        if (cliente) {
            query += ` AND (cliente_documento ILIKE $${paramCount} OR cliente_razon_social ILIKE $${paramCount})`;
            params.push(`%${cliente}%`);
            paramCount++;
        }

        if (pedido_id) {
            query += ` AND pedido_id = $${paramCount}`;
            params.push(pedido_id);
            paramCount++;
        }

        if (almacen_id) {
            query += ` AND almacen_id = $${paramCount}`;
            params.push(almacen_id);
            paramCount++;
        }

        query += ` ORDER BY created_at DESC`;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            total: result.rows.length
        });

    } catch (error) {
        console.error('❌ Error al obtener guías:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener guías de remisión',
            error: error.message
        });
    }
};

// =====================================================
// OBTENER GUÍA POR ID
// =====================================================
const obtenerGuiaPorId = async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener cabecera
        const cabeceraQuery = `
      SELECT 
        g.*,
        p.numero as numero_pedido,
        p.fecha as fecha_pedido,
        a.codigo as almacen_codigo,
        a.nombre as almacen_nombre,
        pp.codigo as punto_partida_codigo,
        t.codigo as transportista_codigo,
        v.marca as vehiculo_marca,
        v.modelo as vehiculo_modelo,
        ch.codigo as chofer_codigo,
        u_created.nombre_completo as creado_por_nombre,
        u_updated.nombre_completo as actualizado_por_nombre
      FROM ventas.guias_remision g
      LEFT JOIN ventas.pedidos_cliente p ON g.pedido_id = p.id_pedido
      LEFT JOIN almacen.almacenes a ON g.almacen_id = a.id_alm
      LEFT JOIN ventas.puntos_partida pp ON g.punto_partida_id = pp.id_partida
      LEFT JOIN ventas.transportistas t ON g.transportista_id = t.id_transportista
      LEFT JOIN ventas.vehiculos v ON g.vehiculo_id = v.id_vehiculo
      LEFT JOIN ventas.choferes ch ON g.chofer_id = ch.id_chofer
      LEFT JOIN public.usuarios u_created ON g.created_by = u_created.id
      LEFT JOIN public.usuarios u_updated ON g.updated_by = u_updated.id
      WHERE g.id_guia = $1
    `;

        const cabeceraResult = await pool.query(cabeceraQuery, [id]);

        if (cabeceraResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Guía de remisión no encontrada'
            });
        }

        // Obtener detalles
        const detallesQuery = `
      SELECT 
        dg.*,
        dp.cantidad_solicitada,
        dp.cantidad_pendiente as cantidad_pendiente_pedido
      FROM ventas.detalle_guia_remision dg
      LEFT JOIN ventas.detalle_pedidos_cliente dp ON dg.detalle_pedido_id = dp.id_detalle_pedido
      WHERE dg.guia_id = $1
      ORDER BY dg.numitem
    `;

        const detallesResult = await pool.query(detallesQuery, [id]);

        res.json({
            success: true,
            data: {
                ...cabeceraResult.rows[0],
                detalles: detallesResult.rows
            }
        });

    } catch (error) {
        console.error('❌ Error al obtener guía:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener guía de remisión',
            error: error.message
        });
    }
};

// =====================================================
// ACTUALIZAR ESTADO DE GUÍA
// =====================================================
const actualizarEstadoGuia = async (req, res) => {
    const { id } = req.params;
    const { estado, observaciones } = req.body;
    const usuario_id = req.userId || 1;

    try {
        const estadosValidos = ['PENDIENTE', 'EN_TRANSITO', 'ENTREGADO', 'ENTREGADO_PARCIAL', 'ANULADO'];

        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({
                success: false,
                message: `Estado inválido. Estados permitidos: ${estadosValidos.join(', ')}`
            });
        }

        await pool.query('BEGIN');

        // Verificar estado actual
        const guiaActual = await pool.query(
            'SELECT estado FROM ventas.guias_remision WHERE id_guia = $1',
            [id]
        );

        if (guiaActual.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Guía de remisión no encontrada'
            });
        }

        const estadoActual = guiaActual.rows[0].estado;

        // Validar transiciones de estado permitidas
        const transicionesValidas = {
            'PENDIENTE': ['EN_TRANSITO', 'ANULADO'],
            'EN_TRANSITO': ['ENTREGADO', 'ENTREGADO_PARCIAL', 'ANULADO'],
            'ENTREGADO': [],
            'ENTREGADO_PARCIAL': ['ENTREGADO'],
            'ANULADO': []
        };

        if (!transicionesValidas[estadoActual].includes(estado)) {
            await pool.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: `No se puede cambiar de ${estadoActual} a ${estado}`
            });
        }

        // Actualizar estado
        const updateQuery = `
      UPDATE ventas.guias_remision
      SET estado = $1,
          observaciones = COALESCE($2, observaciones),
          updated_by = $3,
          updated_at = NOW()
      WHERE id_guia = $4
      RETURNING *
    `;

        const result = await pool.query(updateQuery, [estado, observaciones, usuario_id, id]);

        await pool.query('COMMIT');

        console.log(`✅ Guía ${id} actualizada a estado ${estado}`);

        res.json({
            success: true,
            message: `Estado actualizado a ${estado}`,
            data: result.rows[0]
        });

    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('❌ Error al actualizar estado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar estado de la guía',
            error: error.message
        });
    }
};

// =====================================================
// CONFIRMAR ENTREGA DE GUÍA
// =====================================================
const confirmarEntregaGuia = async (req, res) => {
    const { id } = req.params;
    const { items_recibidos, observaciones } = req.body;
    const usuario_id = req.userId || 1;

    try {
        await pool.query('BEGIN');

        // Verificar que la guía está en tránsito
        const guiaQuery = await pool.query(
            'SELECT * FROM ventas.guias_remision WHERE id_guia = $1',
            [id]
        );

        if (guiaQuery.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Guía no encontrada'
            });
        }

        const guia = guiaQuery.rows[0];

        if (guia.estado !== 'EN_TRANSITO') {
            await pool.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Solo se pueden confirmar guías en tránsito'
            });
        }

        // Actualizar cantidades recibidas en cada item
        let entregaCompleta = true;

        if (items_recibidos && Array.isArray(items_recibidos)) {
            for (const item of items_recibidos) {
                await pool.query(`
          UPDATE ventas.detalle_guia_remision
          SET cantidad_recibida = $1,
              estado = CASE 
                WHEN $1 >= cantidad_despachada THEN 'ENTREGADO'
                WHEN $1 > 0 THEN 'ENTREGADO'
                ELSE 'DEVUELTO'
              END,
              observacion = $2,
              updated_at = NOW()
          WHERE id_detalle_guia = $3
        `, [item.cantidad_recibida, item.observacion || null, item.id_detalle_guia]);

                if (item.cantidad_recibida < item.cantidad_despachada) {
                    entregaCompleta = false;
                }
            }
        }

        // Actualizar estado de la guía
        const nuevoEstado = entregaCompleta ? 'ENTREGADO' : 'ENTREGADO_PARCIAL';

        await pool.query(`
      UPDATE ventas.guias_remision
      SET estado = $1,
          fecha_entrega = NOW(),
          observaciones = COALESCE($2, observaciones),
          updated_by = $3,
          updated_at = NOW()
      WHERE id_guia = $4
    `, [nuevoEstado, observaciones, usuario_id, id]);

        // Verificar si el pedido está completamente despachado
        const pedidoCheck = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE cantidad_pendiente > 0) as items_pendientes
      FROM ventas.detalle_pedidos_cliente
      WHERE pedido_id = $1
    `, [guia.pedido_id]);

        if (parseInt(pedidoCheck.rows[0].items_pendientes) === 0) {
            await pool.query(`
        UPDATE ventas.pedidos_cliente
        SET estado = 'COMPLETADO',
            updated_at = NOW(),
            updated_by = $1
        WHERE id_pedido = $2
      `, [usuario_id, guia.pedido_id]);
        } else {
            await pool.query(`
        UPDATE ventas.pedidos_cliente
        SET estado = 'PARCIAL',
            updated_at = NOW(),
            updated_by = $1
        WHERE id_pedido = $2 AND estado = 'PENDIENTE'
      `, [usuario_id, guia.pedido_id]);
        }

        await pool.query('COMMIT');

        res.json({
            success: true,
            message: `Entrega ${entregaCompleta ? 'completa' : 'parcial'} confirmada`,
            entrega_completa: entregaCompleta
        });

    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('❌ Error al confirmar entrega:', error);
        res.status(500).json({
            success: false,
            message: 'Error al confirmar entrega',
            error: error.message
        });
    }
};

// =====================================================
// ANULAR GUÍA DE REMISIÓN
// =====================================================
const anularGuiaRemision = async (req, res) => {
    const { id } = req.params;
    const { motivo } = req.body;
    const usuario_id = req.userId || 1;

    try {
        if (!motivo) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar un motivo de anulación'
            });
        }

        await pool.query('BEGIN');

        // Verificar estado actual
        const guiaQuery = await pool.query(
            'SELECT * FROM ventas.guias_remision WHERE id_guia = $1',
            [id]
        );

        if (guiaQuery.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Guía no encontrada'
            });
        }

        const guia = guiaQuery.rows[0];

        if (guia.estado === 'ENTREGADO' || guia.estado === 'ANULADO') {
            await pool.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: `No se puede anular una guía en estado ${guia.estado}`
            });
        }

        // Si estaba en tránsito, revertir las cantidades despachadas
        if (guia.estado === 'EN_TRANSITO') {
            await pool.query(`
        UPDATE ventas.detalle_pedidos_cliente dp
        SET cantidad_despachada = dp.cantidad_despachada - dg.cantidad_despachada,
            updated_at = NOW()
        FROM ventas.detalle_guia_remision dg
        WHERE dg.guia_id = $1
          AND dg.detalle_pedido_id = dp.id_detalle_pedido
      `, [id]);
        }

        // Anular la guía
        await pool.query(`
      UPDATE ventas.guias_remision
      SET estado = 'ANULADO',
          observaciones = CONCAT(observaciones, ' | ANULADO: ', $1),
          updated_by = $2,
          updated_at = NOW()
      WHERE id_guia = $3
    `, [motivo, usuario_id, id]);

        await pool.query('COMMIT');

        console.log(`🚫 Guía ${guia.numero} anulada`);

        res.json({
            success: true,
            message: 'Guía de remisión anulada correctamente'
        });

    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('❌ Error al anular guía:', error);
        res.status(500).json({
            success: false,
            message: 'Error al anular guía',
            error: error.message
        });
    }
};

// =====================================================
// OBTENER GUÍAS DE UN PEDIDO
// =====================================================
const obtenerGuiasPorPedido = async (req, res) => {
    try {
        const { pedido_id } = req.params;

        const result = await pool.query(`
            SELECT
                g.id_guia,
                g.numero,
                g.fecha_emision,
                g.fecha_traslado,
                g.estado,
                a.nombre as almacen_nombre,
                g.chofer_nombre,
                g.vehiculo_placa,
                COUNT(dg.id_detalle_guia) as total_items,
                g.valor_total,
                g.peso_bruto_total as peso_bruto
            FROM ventas.guias_remision g
            LEFT JOIN almacen.almacenes a ON g.almacen_id = a.id_alm
            LEFT JOIN ventas.detalle_guia_remision dg ON g.id_guia = dg.guia_id
            WHERE g.pedido_id = $1
            GROUP BY g.id_guia, a.nombre
            ORDER BY g.fecha_emision DESC
        `, [pedido_id]);

        res.json({
            success: true,
            data: result.rows,
            total: result.rows.length
        });

    } catch (error) {
        console.error('❌ Error al obtener guías del pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener guías del pedido',
            error: error.message
        });
    }
};

// =====================================================
// ESTADÍSTICAS DE GUÍAS
// =====================================================
const obtenerEstadisticasGuias = async (req, res) => {
    try {
        const { fecha_desde, fecha_hasta } = req.query;

        let whereClause = '';
        const params = [];

        if (fecha_desde && fecha_hasta) {
            whereClause = 'WHERE fecha_emision BETWEEN $1 AND $2';
            params.push(fecha_desde, fecha_hasta);
        }

        const query = `
      SELECT 
        COUNT(*) as total_guias,
        COUNT(*) FILTER (WHERE estado = 'PENDIENTE') as pendientes,
        COUNT(*) FILTER (WHERE estado = 'EN_TRANSITO') as en_transito,
        COUNT(*) FILTER (WHERE estado = 'ENTREGADO') as entregadas,
        COUNT(*) FILTER (WHERE estado = 'ENTREGADO_PARCIAL') as entregadas_parcial,
        COUNT(*) FILTER (WHERE estado = 'ANULADO') as anuladas,
        COALESCE(SUM(valor_total), 0) as valor_total_despachado,
        COALESCE(SUM(peso_bruto_total), 0) as peso_total
      FROM ventas.guias_remision
      ${whereClause}
    `;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas',
            error: error.message
        });
    }
};

// =====================================================
// APROBAR/CONFIRMAR NOTA DE SALIDA DE GUÍA
// Esta función confirma la nota de salida y disminuye el stock
// =====================================================
const aprobarNotaSalidaGuia = async (req, res) => {
    const { id_nota } = req.params;
    const usuario_id = req.userId || 1;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Verificar que la nota existe y está en BORRADOR
        const notaQuery = `
            SELECT
                n.*,
                d.codigo as documento_codigo
            FROM almacen.notas n
            JOIN public.documentos d ON d.id_documento = n.documento_interno_id
            WHERE n.id_nota = $1
        `;
        const notaResult = await client.query(notaQuery, [id_nota]);

        if (notaResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Nota de salida no encontrada'
            });
        }

        const nota = notaResult.rows[0];

        if (nota.estado !== 'BORRADOR') {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: `La nota debe estar en estado BORRADOR para ser aprobada. Estado actual: ${nota.estado}`
            });
        }

        if (nota.documento_codigo !== 'NS') {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Solo se pueden aprobar notas de salida (NS)'
            });
        }

        console.log(`✅ Aprobando nota de salida ${nota.numero}...`);

        // Llamar al endpoint de confirmación de notas (reutilizando la lógica existente)
        // Importamos la lógica del controlador de notas
        const notasController = require('./notasController');

        // Crear un objeto de request simulado para el controlador de notas
        const mockReq = {
            params: { id: id_nota },
            user: { id: usuario_id }
        };

        // Crear un objeto de response que capture el resultado
        let confirmacionResult = null;
        const mockRes = {
            json: (data) => { confirmacionResult = data; },
            status: (code) => ({ json: (data) => { confirmacionResult = { ...data, statusCode: code }; } })
        };

        // Rollback de la transacción actual antes de llamar a confirmarNota
        // (confirmarNota maneja su propia transacción)
        await client.query('ROLLBACK');
        client.release();

        // Llamar a la función de confirmación
        await notasController.confirmarNota(mockReq, mockRes);

        // Verificar el resultado
        if (confirmacionResult && confirmacionResult.success) {
            return res.json({
                success: true,
                message: `Nota de salida ${nota.numero} aprobada exitosamente. El stock ha sido actualizado.`,
                data: confirmacionResult
            });
        } else {
            return res.status(confirmacionResult?.statusCode || 500).json({
                success: false,
                message: 'Error al aprobar la nota de salida',
                error: confirmacionResult
            });
        }

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error al aprobar nota de salida:', error);
        res.status(500).json({
            success: false,
            message: 'Error al aprobar nota de salida',
            error: error.message
        });
    } finally {
        if (client) {
            client.release();
        }
    }
};

// =====================================================
// EXPORTAR MÓDULO
// =====================================================
module.exports = {
    // Datos de formulario
    obtenerDatosFormularioGuia,

    // Análisis y validación
    analizarPedidoParaGuia,
    validarProductosGuia,

    // CRUD
    crearGuiaRemision,
    obtenerGuiasRemision,
    obtenerGuiaPorId,
    obtenerGuiasPorPedido,

    // Gestión de estados
    actualizarEstadoGuia,
    confirmarEntregaGuia,
    anularGuiaRemision,

    // Estadísticas
    obtenerEstadisticasGuias,

    // Gestión de notas de salida
    aprobarNotaSalidaGuia
};