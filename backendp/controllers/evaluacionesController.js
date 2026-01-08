const db = require('../config/db');

// Función auxiliar para obtener el costo unitario de un producto (Materiales)
const getCostoProducto = async (producto_codigo) => {
    const query = `SELECT precio_total FROM almacen.productos WHERE codigo = $1`;
    const result = await db.query(query, [producto_codigo]);
    if (result.rows.length === 0) throw new Error(`Producto ${producto_codigo} no encontrado.`);
    return parseFloat(result.rows[0].precio_total);
};

// Función auxiliar para obtener el costo por hora (Mano de Obra)
const getCostoActividad = async (actividad_id) => {
    const query = `SELECT costo_hh FROM mantenimiento.actividad_mano_obra WHERE id = $1`;
    const result = await db.query(query, [actividad_id]);
    if (result.rows.length === 0) throw new Error(`Actividad ID ${actividad_id} no encontrada.`);
    return parseFloat(result.rows[0].costo_hh);
};

const calcularTotalesEvaluacion = async (evaluacionId) => {
    const query = `
        SELECT 
            COALESCE(SUM(me.costo_total), 0.00) AS total_materiales,
            COALESCE(SUM(aoe.costo_total), 0.00) AS total_mano_obra,
            COALESCE(SUM(ea.costo_total), 0.00) AS total_auxiliares
        FROM mantenimiento.evaluacion_tecnica et
        LEFT JOIN mantenimiento.material_evaluacion me ON et.id = me.evaluacion_id
        LEFT JOIN mantenimiento.actividad_obra_evaluacion aoe ON et.id = aoe.evaluacion_id
        LEFT JOIN mantenimiento.elemento_auxiliar ea ON et.id = ea.evaluacion_id
        WHERE et.id = $1;
    `;
    const { rows } = await db.query(query, [evaluacionId]);
    
    if (rows.length > 0) {
        const totales = rows[0];
        const mat = parseFloat(totales.total_materiales);
        const mo = parseFloat(totales.total_mano_obra);
        const aux = parseFloat(totales.total_auxiliares);
        const total_costo_directo = parseFloat(totales.total_materiales) + parseFloat(totales.total_mano_obra) + parseFloat(totales.total_auxiliares);
        
        await db.query(`
            UPDATE mantenimiento.evaluacion_tecnica SET
                total_materiales = $1,
                total_mano_obra = $2,
                total_auxiliares = $3,
                total_costo_directo = $4,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $5
        `, [
            mat.toFixed(2), // Usamos la variable ya convertida
            mo.toFixed(2),
            aux.toFixed(2),
            total_costo_directo.toFixed(2),
            evaluacionId
        ]);
        return { 
            total_materiales: mat.toFixed(2), 
            total_mano_obra: mo.toFixed(2), 
            total_auxiliares: aux.toFixed(2), 
            total_costo_directo: total_costo_directo.toFixed(2) 
        };
    }
    return { 
        total_materiales: '0.00', 
        total_mano_obra: '0.00', 
        total_auxiliares: '0.00', 
        total_costo_directo: '0.00' 
    };
};

const EvaluacionesController = {
    
    getAllEvaluaciones: async (req, res) => {
        try {
            const query = `
                SELECT 
                    et.id,
                    et.fecha_evaluacion,
                    et.total_costo_directo,
                    re.codigo_bpc,
                    re.codigo_solped,
                    c.razon_social AS cliente_nombre,
                    u.nombre_completo AS tecnico_nombre
                FROM mantenimiento.evaluacion_tecnica et
                JOIN mantenimiento.recepcion_equipo re ON et.recepcion_equipo_id = re.id
                JOIN ventas.clientes c ON re.cliente_id = c.id_cliente
                JOIN public.usuarios u ON et.tecnico_id = u.id
                ORDER BY et.fecha_evaluacion DESC;
            `;
            const { rows } = await db.query(query);
            res.json(rows);
        } catch (error) {
            console.error('Error en getAllEvaluaciones:', error);
            res.status(500).json({ error: 'Error al obtener la lista de evaluaciones' });
        }
    },
    
    getEvaluacionById: async (req, res) => {
        const { id } = req.params;
        try {
            const queryCabecera = `
                SELECT 
                    et.*,
                    re.codigo_bpc,
                    re.codigo_solped,
                    re.descripcion_problema AS problema_reportado,
                    re.marca,
                    re.modelo,
                    c.razon_social AS cliente_nombre,
                    c.nro_documento AS cliente_ruc,
                    u.nombre_completo AS tecnico_nombre
                FROM mantenimiento.evaluacion_tecnica et
                JOIN mantenimiento.recepcion_equipo re ON et.recepcion_equipo_id = re.id
                JOIN ventas.clientes c ON re.cliente_id = c.id_cliente
                JOIN public.usuarios u ON et.tecnico_id = u.id
                WHERE et.id = $1;
            `;
            const cabecera = await db.query(queryCabecera, [id]);

            if (cabecera.rows.length === 0) {
                return res.status(404).json({ error: 'Evaluación no encontrada' });
            }

            const materiales = await db.query(`
                SELECT 
                    me.id,
                    me.producto_codigo,
                    me.cantidad,
                    me.observaciones,
                    me.costo_unitario_ref,
                    me.costo_total,
                    p.descripcion AS producto_descripcion,
                    um.siglas AS unidad_medida
                FROM mantenimiento.material_evaluacion me
                JOIN almacen.productos p ON me.producto_codigo = p.codigo
                LEFT JOIN public.unidades_medida um ON p.id_unidad = um.id_unidades
                WHERE me.evaluacion_id = $1;
            `, [id]);

            const manoObra = await db.query(`
                SELECT 
                    aoe.id,
                    aoe.actividad_id,
                    aoe.cantidad_horas,
                    aoe.observaciones,
                    aoe.costo_hh_ref,
                    aoe.costo_total,
                    amo.actividad AS actividad_nombre
                FROM mantenimiento.actividad_obra_evaluacion aoe
                JOIN mantenimiento.actividad_mano_obra amo ON aoe.actividad_id = amo.id
                WHERE aoe.evaluacion_id = $1;
            `, [id]);
            
            const auxiliares = await db.query(`
                SELECT *
                FROM mantenimiento.elemento_auxiliar
                WHERE evaluacion_id = $1;
            `, [id]);


            res.json({
                cabecera: cabecera.rows[0],
                materiales: materiales.rows,
                manoObra: manoObra.rows,
                auxiliares: auxiliares.rows
            });

        } catch (error) {
            console.error('Error en getEvaluacionById:', error);
            res.status(500).json({ error: 'Error al obtener el detalle de la evaluación' });
        }
    },
    
    /**
     * Creación de la evaluación tecnica
     */
    createEvaluacion: async (req, res) => {
        const tecnico_id = req.userId || 1; 
        const { 
            recepcion_equipo_id, 
            fecha_evaluacion, 
            comentarios, 
            materiales, 
            manoObra, 
            auxiliares 
        } = req.body;

        try {
            await db.query('BEGIN');

            // --- 1. INSERTAR CABECERA (EVALUACION_TECNICA) ---
            const cabeceraQuery = `
                INSERT INTO mantenimiento.evaluacion_tecnica (
                    recepcion_equipo_id, tecnico_id, comentarios, fecha_evaluacion
                ) VALUES ($1, $2, $3, $4) RETURNING id;
            `;
            const result = await db.query(cabeceraQuery, [
                recepcion_equipo_id, 
                tecnico_id, 
                comentarios, 
                fecha_evaluacion || new Date().toISOString().split('T')[0]
            ]);
            const evaluacionId = result.rows[0].id;
            
            // --- 2. PROCESAR MATERIALES ---
            for (const item of materiales) {
                const costo_ref = await getCostoProducto(item.producto_codigo);
                const upsertQuery = `
                    INSERT INTO mantenimiento.material_evaluacion (evaluacion_id, producto_codigo, cantidad, observaciones, costo_unitario_ref)
                    VALUES ($1, $2, $3, $4, $5);
                `;
                await db.query(upsertQuery, [
                    evaluacionId, 
                    item.producto_codigo, 
                    item.cantidad, 
                    item.observaciones || null,
                    costo_ref
                ]);
            }
            
            // --- 3. PROCESAR MANO DE OBRA ---
            for (const item of manoObra) {
                const costo_hh_ref = await getCostoActividad(item.actividad_id);
                const upsertQuery = `
                    INSERT INTO mantenimiento.actividad_obra_evaluacion (evaluacion_id, actividad_id, cantidad_horas, observaciones, costo_hh_ref)
                    VALUES ($1, $2, $3, $4, $5);
                `;
                await db.query(upsertQuery, [
                    evaluacionId, 
                    item.actividad_id, 
                    item.cantidad_horas, 
                    item.observaciones || null,
                    costo_hh_ref
                ]);
            }

            // --- 4. PROCESAR AUXILIARES ---
            // (Asumimos que los auxiliares todavía se pueden manejar por separado o se integran aquí, si se envían)
            for (const item of auxiliares) {
                 const insertQuery = `
                    INSERT INTO mantenimiento.elemento_auxiliar (evaluacion_id, tipo, nombre, unidad, cantidad, moneda, precio_unitario)
                    VALUES ($1, $2, $3, $4, $5, $6, $7);
                `;
                await db.query(insertQuery, [
                    evaluacionId, 
                    item.tipo, 
                    item.nombre, 
                    item.unidad || 'UND',
                    item.cantidad, 
                    item.moneda || 'USD',
                    item.precio_unitario || 0
                ]);
            }
            
            // --- 5. ACTUALIZAR TOTALES Y ESTADO DEL EQUIPO ---
            await calcularTotalesEvaluacion(evaluacionId);

            await db.query(`
                UPDATE mantenimiento.recepcion_equipo SET
                    estado_proceso = 'COTIZACION PENDIENTE',
                    updated_by = $2,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1;
            `, [recepcion_equipo_id, tecnico_id]);

            // ** Confirmar Transacción **
            await db.query('COMMIT');
            
            res.status(201).json({ 
                message: 'Evaluación y detalles creados con éxito', 
                evaluacionId: evaluacionId 
            });

        } catch (error) {
            await db.query('ROLLBACK');
            
            console.error('Error en createEvaluacion (Unificado):', error);
            if (error.message.includes('no encontrado')) {
                return res.status(400).json({ error: error.message });
            }
            if (error.code === '23505') { 
                return res.status(400).json({ 
                    error: 'Ya existe una evaluación técnica registrada para esta recepción de equipo.',
                    detail: error.message
                });
            }
            res.status(500).json({ error: 'Error al crear la evaluación técnica', detail: error.message });
        }
    },
    
    updateEvaluacion: async (req, res) => {
        const { id } = req.params;
        const { comentarios, fecha_evaluacion } = req.body;
        const updated_by = req.userId || 1; 

        try {
            const query = `
                UPDATE mantenimiento.evaluacion_tecnica SET
                    comentarios = $1,
                    fecha_evaluacion = $2,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $3
                RETURNING *;
            `;
            const { rows } = await db.query(query, [comentarios, fecha_evaluacion, id]);

            if (rows.length === 0) {
                return res.status(404).json({ error: 'Evaluación no encontrada para actualizar' });
            }
            
            const totales = await calcularTotalesEvaluacion(id);

            res.json({ message: 'Evaluación actualizada con éxito', evaluacion: rows[0], totales });

        } catch (error) {
            console.error('Error en updateEvaluacion:', error);
            res.status(500).json({ error: 'Error al actualizar la evaluación', detail: error.message });
        }
    },

    // ----------------------------------------------------
    // Operaciones de Detalle (Materiales)
    // ----------------------------------------------------

    /**
     * Añade o actualiza un material en el detalle de la evaluación.
     */
    addMaterial: async (req, res) => {
        const { evaluacionId } = req.params;
        const { producto_codigo, cantidad, observaciones } = req.body;

        try {
            // ** Iniciar Transacción **
            await db.query('BEGIN');

            // 1. Obtener el costo unitario actual del producto (usando precio_total)
            const productoResult = await db.query(`
                SELECT precio_total 
                FROM almacen.productos 
                WHERE codigo = $1
            `, [producto_codigo]);

            if (productoResult.rows.length === 0) {
                await db.query('ROLLBACK');
                return res.status(404).json({ error: 'Producto no encontrado' });
            }
            
            const costo_unitario_ref = productoResult.rows[0].precio_total;

            // 2. Insertar o actualizar el material
            const upsertQuery = `
                INSERT INTO mantenimiento.material_evaluacion (evaluacion_id, producto_codigo, cantidad, observaciones, costo_unitario_ref)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (evaluacion_id, producto_codigo) 
                DO UPDATE SET 
                    cantidad = EXCLUDED.cantidad,
                    observaciones = EXCLUDED.observaciones,
                    costo_unitario_ref = EXCLUDED.costo_unitario_ref,
                    created_at = CURRENT_TIMESTAMP
                RETURNING *;
            `;
            await db.query(upsertQuery, [
                evaluacionId, 
                producto_codigo, 
                cantidad, 
                observaciones || null,
                costo_unitario_ref
            ]);
            
            // 3. Recalcular y actualizar totales de la cabecera
            const totales = await calcularTotalesEvaluacion(evaluacionId);

            // ** Confirmar Transacción **
            await db.query('COMMIT');

            res.status(200).json({ 
                message: 'Material añadido/actualizado con éxito', 
                totales 
            });
            
        } catch (error) {
            await db.query('ROLLBACK');
            console.error('Error en addMaterial:', error);
            res.status(500).json({ error: 'Error al añadir o actualizar material', detail: error.message });
        }
    },
    
    /**
     * Elimina un material del detalle de la evaluación.
     */
    deleteMaterial: async (req, res) => {
        const { evaluacionId, materialId } = req.params;

        try {
            // ** Iniciar Transacción **
            await db.query('BEGIN');

            const result = await db.query(`
                DELETE FROM mantenimiento.material_evaluacion
                WHERE id = $1 AND evaluacion_id = $2
                RETURNING id;
            `, [materialId, evaluacionId]);

            if (result.rows.length === 0) {
                await db.query('ROLLBACK');
                return res.status(404).json({ error: 'Detalle de material no encontrado' });
            }
            
            // Recalcular y actualizar totales de la cabecera
            const totales = await calcularTotalesEvaluacion(evaluacionId);

            // ** Confirmar Transacción **
            await db.query('COMMIT');

            res.status(200).json({ 
                message: 'Material eliminado con éxito', 
                totales 
            });
            
        } catch (error) {
            await db.query('ROLLBACK');
            console.error('Error en deleteMaterial:', error);
            res.status(500).json({ error: 'Error al eliminar material', detail: error.message });
        }
    },

    // ----------------------------------------------------
    // Operaciones de Detalle (Mano de Obra)
    // ----------------------------------------------------

    /**
     * Obtiene la lista de actividades disponibles (para el select).
     */
    getAllActividadesManoObra: async (req, res) => {
        try {
            const query = `
                SELECT id, actividad AS nombre, costo_hh 
                FROM mantenimiento.actividad_mano_obra 
                WHERE estado = TRUE 
                ORDER BY actividad;
            `;
            const { rows } = await db.query(query);
            res.json(rows);
        } catch (error) {
            console.error('Error en getAllActividadesManoObra:', error);
            res.status(500).json({ error: 'Error al obtener actividades de mano de obra' });
        }
    },

    /**
     * Añade o actualiza la mano de obra en el detalle de la evaluación.
     */
    addManoObra: async (req, res) => {
        const { evaluacionId } = req.params;
        const { actividad_id, cantidad_horas, observaciones } = req.body;

        try {
            // ** Iniciar Transacción **
            await db.query('BEGIN');

            // 1. Obtener el costo HH de la actividad
            const actividadResult = await db.query(`
                SELECT costo_hh 
                FROM mantenimiento.actividad_mano_obra 
                WHERE id = $1
            `, [actividad_id]);

            if (actividadResult.rows.length === 0) {
                await db.query('ROLLBACK');
                return res.status(404).json({ error: 'Actividad de mano de obra no encontrada' });
            }
            const costo_hh_ref = actividadResult.rows[0].costo_hh;

            // 2. Insertar o actualizar la mano de obra
            const upsertQuery = `
                INSERT INTO mantenimiento.actividad_obra_evaluacion (evaluacion_id, actividad_id, cantidad_horas, observaciones, costo_hh_ref)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (evaluacion_id, actividad_id) 
                DO UPDATE SET 
                    cantidad_horas = EXCLUDED.cantidad_horas,
                    observaciones = EXCLUDED.observaciones,
                    costo_hh_ref = EXCLUDED.costo_hh_ref,
                    created_at = CURRENT_TIMESTAMP
                RETURNING *;
            `;
            await db.query(upsertQuery, [
                evaluacionId, 
                actividad_id, 
                cantidad_horas, 
                observaciones || null,
                costo_hh_ref
            ]);
            
            // 3. Recalcular y actualizar totales de la cabecera
            const totales = await calcularTotalesEvaluacion(evaluacionId);

            // ** Confirmar Transacción **
            await db.query('COMMIT');

            res.status(200).json({ 
                message: 'Mano de obra añadida/actualizada con éxito', 
                totales 
            });
            
        } catch (error) {
            await db.query('ROLLBACK');
            console.error('Error en addManoObra:', error);
            res.status(500).json({ error: 'Error al añadir o actualizar mano de obra', detail: error.message });
        }
    },
    
    /**
     * Elimina una actividad de mano de obra del detalle.
     */
    deleteManoObra: async (req, res) => {
        const { evaluacionId, manoObraId } = req.params;

        try {
            // ** Iniciar Transacción **
            await db.query('BEGIN');

            const result = await db.query(`
                DELETE FROM mantenimiento.actividad_obra_evaluacion
                WHERE id = $1 AND evaluacion_id = $2
                RETURNING id;
            `, [manoObraId, evaluacionId]);

            if (result.rows.length === 0) {
                await db.query('ROLLBACK');
                return res.status(404).json({ error: 'Detalle de mano de obra no encontrado' });
            }
            
            // Recalcular y actualizar totales de la cabecera
            const totales = await calcularTotalesEvaluacion(evaluacionId);

            // ** Confirmar Transacción **
            await db.query('COMMIT');

            res.status(200).json({ 
                message: 'Mano de obra eliminada con éxito', 
                totales 
            });
            
        } catch (error) {
            await db.query('ROLLBACK');
            console.error('Error en deleteManoObra:', error);
            res.status(500).json({ error: 'Error al eliminar mano de obra', detail: error.message });
        }
    },
    
    // ----------------------------------------------------
    // Operaciones de Detalle (Elementos Auxiliares)
    // ----------------------------------------------------

    /**
     * Añade un nuevo elemento auxiliar (no hay UPDATE, solo INSERT y DELETE).
     */
    addAuxiliar: async (req, res) => {
        const { evaluacionId } = req.params;
        const { tipo, nombre, unidad, cantidad, moneda, precio_unitario } = req.body;

        try {
            // ** Iniciar Transacción **
            await db.query('BEGIN');

            // Insertar el elemento auxiliar 
            const insertQuery = `
                INSERT INTO mantenimiento.elemento_auxiliar (evaluacion_id, tipo, nombre, unidad, cantidad, moneda, precio_unitario)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *;
            `;
            await db.query(insertQuery, [
                evaluacionId, 
                tipo, 
                nombre, 
                unidad,
                cantidad, 
                moneda,
                precio_unitario
            ]);
            
            // Recalcular y actualizar totales de la cabecera
            const totales = await calcularTotalesEvaluacion(evaluacionId);

            // ** Confirmar Transacción **
            await db.query('COMMIT');

            res.status(200).json({ 
                message: 'Elemento auxiliar añadido con éxito', 
                totales 
            });
            
        } catch (error) {
            await db.query('ROLLBACK');
            console.error('Error en addAuxiliar:', error);
            res.status(500).json({ error: 'Error al añadir elemento auxiliar', detail: error.message });
        }
    },
    
    /**
     * Elimina un elemento auxiliar del detalle.
     */
    deleteAuxiliar: async (req, res) => {
        const { evaluacionId, auxiliarId } = req.params;

        try {
            // ** Iniciar Transacción **
            await db.query('BEGIN');

            const result = await db.query(`
                DELETE FROM mantenimiento.elemento_auxiliar
                WHERE id = $1 AND evaluacion_id = $2
                RETURNING id;
            `, [auxiliarId, evaluacionId]);

            if (result.rows.length === 0) {
                await db.query('ROLLBACK');
                return res.status(404).json({ error: 'Detalle auxiliar no encontrado' });
            }
            
            // Recalcular y actualizar totales de la cabecera
            const totales = await calcularTotalesEvaluacion(evaluacionId);

            // ** Confirmar Transacción **
            await db.query('COMMIT');

            res.status(200).json({ 
                message: 'Elemento auxiliar eliminado con éxito', 
                totales 
            });
            
        } catch (error) {
            await db.query('ROLLBACK');
            console.error('Error en deleteAuxiliar:', error);
            res.status(500).json({ error: 'Error al eliminar auxiliar', detail: error.message });
        }
    },
    
    // ----------------------------------------------------
    // Obtener datos para formularios
    // ----------------------------------------------------

    /**
     * Obtiene productos disponibles para el select de materiales.
     */
    getProductsForSelect: async (req, res) => {
        try {
            const query = `
                SELECT 
                    p.codigo, 
                    p.descripcion || ' (' || COALESCE(um.siglas, 'UND') || ')' AS nombre_completo,
                    p.precio_total as costo_referencia,
                    COALESCE(um.siglas, 'UND') as unidad_medida
                FROM almacen.productos p
                LEFT JOIN public.unidades_medida um ON p.id_unidad = um.id_unidades
                WHERE p.estado = TRUE
                ORDER BY p.descripcion;
            `;
            const { rows } = await db.query(query);
            res.json(rows);
        } catch (error) {
            console.error('Error en getProductsForSelect:', error);
            res.status(500).json({ error: 'Error al obtener productos' });
        }
    }
};

module.exports = EvaluacionesController;