// backend/controllers/cotizacionManController.js

const pool = require("../config/db"); // Asumimos que la configuración de la DB está aquí
const CotizadorService = require('../services/CotizadorService'); // Importar el servicio
const { getUserId } = require('../middlewares/auth'); // Función utilitaria para obtener el ID del usuario

// --- Funciones Auxiliares para el Controlador ---

/**
 * Obtiene todos los detalles de la Evaluación Técnica de las tablas de Mantenimiento.
 */
const getFullEvaluacionData = async (evaluacionId) => {
    // 1. Obtener cabecera de la Evaluación
    const evaluacionQuery = `
        SELECT 
            et.id, et.recepcion_equipo_id, et.tecnico_id, et.fecha_evaluacion, et.comentarios,
            re.cliente_id, re.codigo_bpc, re.descripcion_problema,
            c.razon_social AS cliente_nombre, c.nro_documento AS cliente_ruc,
            v.nombre AS vendedor_nombre
        FROM mantenimiento.evaluacion_tecnica et
        JOIN mantenimiento.recepcion_equipo re ON et.recepcion_equipo_id = re.id
        JOIN ventas.clientes c ON re.cliente_id = c.id_cliente
        LEFT JOIN ventas.vendedores v ON c.vendedor_id = v.id_vendedor
        WHERE et.id = $1;
    `;
    const evaluacionResult = await pool.query(evaluacionQuery, [evaluacionId]);
    if (evaluacionResult.rows.length === 0) {
        throw new Error("Evaluación Técnica no encontrada");
    }
    const evaluacionCabecera = evaluacionResult.rows[0];

    // 2. Obtener Detalles (Materiales, Mano de Obra, Auxiliares)
    const detallesMaterialesQuery = `
        SELECT 
            me.id, me.evaluacion_id, me.producto_codigo, me.cantidad, me.costo_unitario_ref,
            p.descripcion AS producto_descripcion,
            (SELECT siglas FROM public.unidades_medida WHERE id_unidades = p.id_unidad) AS unidad_medida
        FROM mantenimiento.material_evaluacion me
        JOIN almacen.productos p ON me.producto_codigo = p.codigo
        WHERE me.evaluacion_id = $1;
    `;
    const detallesActividadesQuery = `
        SELECT 
            aoe.id, aoe.evaluacion_id, aoe.actividad_id, aoe.cantidad_horas, aoe.costo_hh_ref,
            amo.actividad AS actividad_nombre
        FROM mantenimiento.actividad_obra_evaluacion aoe
        JOIN mantenimiento.actividad_mano_obra amo ON aoe.actividad_id = amo.id
        WHERE aoe.evaluacion_id = $1;
    `;
    const detallesAuxiliaresQuery = `
        SELECT * FROM mantenimiento.elemento_auxiliar WHERE evaluacion_id = $1;
    `;

    const [materialesResult, actividadesResult, auxiliaresResult] = await Promise.all([
        pool.query(detallesMaterialesQuery, [evaluacionId]),
        pool.query(detallesActividadesQuery, [evaluacionId]),
        pool.query(detallesAuxiliaresQuery, [evaluacionId])
    ]);

    return {
        ...evaluacionCabecera,
        detalles_materiales: materialesResult.rows,
        actividades: actividadesResult.rows,
        elementos_auxiliares: auxiliaresResult.rows,
    };
};

// --- Controladores Principales ---

/**
 * Calcula la cotización de mantenimiento (Endpoint GET/POST)
 */
const calcularCotizacionMantenimiento = async (req, res) => {
    try {
        const { evaluacionId } = req.params;

        // Configuración inicial del cálculo (tasa y factores de recargo)
        const {
            tasa_cambio,
            tipo,
            factores
        } = req.body;

        const fullEvaluacionData = await getFullEvaluacionData(evaluacionId);

        // Por el momento, el ID de actualización es un mock ya que no existe la tabla en el nuevo ERP
        const actualizacionRecienteId = 1;

        // 1. Instanciar y Configurar el Cotizador
        const cotizador = new CotizadorService(fullEvaluacionData, actualizacionRecienteId);

        // Aplicar configuración de recálculo (si existe)
        if (tasa_cambio || tipo || factores) {
            cotizador.setDataCalculo(tasa_cambio, tipo, factores);
        }

        // 2. Ejecutar Cálculo
        const resultadoCotizacion = await cotizador.cotizar();

        res.json({
            success: true,
            evaluacion: fullEvaluacionData, // Devuelve los datos de la evaluación para el frontend
            cotizacion_calculada: resultadoCotizacion
        });

    } catch (error) {
        console.error("Error al calcular cotización de mantenimiento:", error);
        res.status(500).json({
            error: "Error interno del servidor al calcular cotización.",
            details: error.message
        });
    }
};

/**
 * Guarda la cotización final de mantenimiento en la tabla ventas.cotizacion_cliente.
 */
const guardarCotizacionMantenimiento = async (req, res) => {
    const client = await pool.connect(); // Usar un cliente para la transacción
    try {
        await client.query("BEGIN");

        const {
            evaluacionId,
            totalEstimado,
            comentarios,
            monedaId,
            formaPagoId
        } = req.body;
        const userId = getUserId(req); // Asumimos que tienes una función para obtener el ID del usuario

        const evalData = await getFullEvaluacionData(evaluacionId);

        // --- VALIDACIONES FINALES Y CÁLCULOS ---
        const totalFloat = parseFloat(totalEstimado || 0);
        if (totalFloat <= 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({ error: "El total estimado debe ser mayor a cero." });
        }

        // Obtener IDs y porcentajes para Ventas
        const docQuery = await client.query("SELECT id_documento FROM public.documentos WHERE codigo = 'CTZ' LIMIT 1");
        const igvResult = await client.query("SELECT id, porcentaje FROM public.igv WHERE id = 1"); // Asumimos IGV 18% (ID 1)

        const docId = docQuery.rows[0].id_documento;
        const igvId = igvResult.rows[0].id;
        const igvPorcentaje = parseFloat(igvResult.rows[0].porcentaje);

        // Asumimos que el totalEstimado (totalFloat) ya incluye IGV.
        const igvMonto = totalFloat / (1 + (igvPorcentaje / 100)) * (igvPorcentaje / 100);
        const valorVenta = totalFloat - igvMonto;

        // Asumir Producto Genérico para el registro de la venta (SRV-001)
        const servicioReparacionResult = await client.query("SELECT id_producto FROM almacen.productos WHERE codigo = 'SRV-001'");
        if (servicioReparacionResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({ error: "Producto 'SRV-001' (Servicio de Reparación) no encontrado." });
        }
        const servicioReparacionId = servicioReparacionResult.rows[0].id_producto;


        // 1. INSERCIÓN CRUZADA: Insertar Cotización (Cabecera) en Ventas
        const insertCotizacionQuery = `
            INSERT INTO ventas.cotizacion_cliente (
                id_documento, id_cliente, codigo_cliente, nro_documento_cliente, razon_social_cliente, 
                vendedor, moneda_id, forma_pago, reparacion, prioridad, comentario,
                importe_bruto, monto_descuento, valor_venta, igv_id, igv, total, created_by
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
            ) RETURNING id_cotizacion, numero
        `;
        const cotizacionValues = [
            docId,
            evalData.cliente_id,
            evalData.codigo_bpc,
            evalData.cliente_ruc,
            evalData.cliente_nombre + ' (Reparación BPC: ' + evalData.codigo_bpc + ')',
            evalData.vendedor_nombre || 'N/A',
            monedaId,
            formaPagoId,
            true, // Es una reparación
            'NORMAL',
            comentarios + ' / Detalles: ' + evalData.eval_comentarios,
            totalFloat, // Importe Bruto (Simplificado)
            0,
            valorVenta,
            igvId,
            igvMonto,
            totalFloat,
            userId
        ];

        const cotizacionResult = await client.query(insertCotizacionQuery, cotizacionValues);
        const nuevaCotizacion = cotizacionResult.rows[0];

        // 2. Insertar Detalle resumido en ventas.detalle_cotizacion
        const insertDetalleQuery = `
            INSERT INTO ventas.detalle_cotizacion (
                cotizacion_id, numitem, producto_id, descripcion_producto, 
                cantidad, precio_unitario, precio_bruto, valor_venta, igv, precio_total, 
                fecha_entrega, stock_disponible, precio_original
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `;
        await client.query(insertDetalleQuery, [
            nuevaCotizacion.id_cotizacion,
            1, // numitem
            servicioReparacionId,
            'Servicio de Reparación: ' + evalData.descripcion_problema,
            1, // Cantidad
            totalFloat, // Precio Unitario (Es el total)
            totalFloat,
            valorVenta,
            igvMonto,
            totalFloat,
            new Date(),
            0,
            totalFloat
        ]);

        // 3. Actualizar estado del equipo en Mantenimiento a 'COTIZACION PENDIENTE'
        const updateRecepcionQuery = `
            UPDATE mantenimiento.recepcion_equipo 
            SET estado_proceso = 'COTIZACION PENDIENTE', updated_by = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2;
        `;
        await client.query(updateRecepcionQuery, [userId, evalData.recepcion_equipo_id]);

        await client.query("COMMIT");

        res.status(201).json({
            message: "Cotización de Mantenimiento creada y en flujo de Ventas.",
            cotizacion: nuevaCotizacion,
            evaluacion_id: evaluacionId,
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error al guardar cotización de mantenimiento:", error);
        res.status(500).json({
            error: "Error interno del servidor al guardar cotización.",
            details: error.message
        });
    } finally {
        client.release();
    }
};

module.exports = {
    calcularCotizacionMantenimiento,
    guardarCotizacionMantenimiento,
    getFullEvaluacionData
};