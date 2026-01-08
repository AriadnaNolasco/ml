// backend/controllers/OrdenMantenimientoController.js
const db = require('../config/db');

/**
 * Obtener contadores para el Dashboard (Req 1.1)
 */
const getDashboardCounters = async (req, res) => {
    try {
        const query = `
            SELECT
                COUNT(*) FILTER (WHERE estado != 'CERRADA') as activas,
                COUNT(*) FILTER (WHERE estado = 'EJECUCION') as en_ejecucion,
                COUNT(*) FILTER (WHERE estado = 'SOLICITUD') as pendientes,
                COUNT(*) FILTER (WHERE estado = 'CERRADA') as finalizadas
            FROM mantenimiento.ordenes_trabajo;
        `;
        const { rows } = await db.query(query);
        res.json(rows[0]);
    } catch (error) {
        console.error('Error al obtener contadores:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

/**
 * Listar Órdenes de Trabajo con Filtros (Req 1.1 y 1.2)
 * Soporta: Buscador de texto, Filtro por Motivo, Filtro por Estado
 */
const getAllOrdenes = async (req, res) => {
    try {
        const { search = '', motivo = '', estado = '', page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = [];
        let queryParams = [];
        let paramIndex = 1;

        // Búsqueda general
        if (search) {
            whereConditions.push(`(
                ot.codigo_ot ILIKE $${paramIndex} OR 
                re.codigo_bpc ILIKE $${paramIndex} OR 
                c.razon_social ILIKE $${paramIndex}
            )`);
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        // Filtro por motivo
        if (motivo) {
            whereConditions.push(`mr.id = $${paramIndex}`);
            queryParams.push(motivo);
            paramIndex++;
        }

        // Filtro por estado
        if (estado) {
            whereConditions.push(`ot.estado = $${paramIndex}`);
            queryParams.push(estado);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0 
            ? 'WHERE ' + whereConditions.join(' AND ')
            : '';

        const query = `
            SELECT 
                ot.id,
                ot.codigo_ot,
                ot.numero_ot,
                ot.estado,
                ot.prioridad,
                ot.fecha_creacion,
                ot.fecha_inicio,
                ot.fecha_finalizacion,
                ot.descripcion_trabajo,
                re.codigo_bpc,
                re.marca AS equipo_marca,
                re.modelo AS equipo_modelo,
                REPLACE(mr.nombre, '_', ' ') AS motivo,
                c.razon_social AS cliente_nombre,
                COALESCE(
                    (SELECT COUNT(*) FROM mantenimiento.ot_tecnicos WHERE ot_id = ot.id),
                    0
                ) as tecnicos_count
            FROM mantenimiento.ordenes_trabajo ot
            JOIN mantenimiento.recepcion_equipo re ON ot.recepcion_equipo_id = re.id
            JOIN mantenimiento.motivo_recepcion mr ON ot.motivo_id = mr.id
            LEFT JOIN ventas.clientes c ON re.cliente_id = c.id_cliente
            ${whereClause}
            ORDER BY ot.fecha_creacion DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        queryParams.push(limit, offset);

        const countQuery = `
            SELECT COUNT(*) as total
            FROM mantenimiento.ordenes_trabajo ot
            JOIN mantenimiento.recepcion_equipo re ON ot.recepcion_equipo_id = re.id
            JOIN mantenimiento.motivo_recepcion mr ON ot.motivo_id = mr.id
            LEFT JOIN ventas.clientes c ON re.cliente_id = c.id_cliente
            ${whereClause}
        `;

        const [ordenes, countResult] = await Promise.all([
            db.query(query, queryParams),
            db.query(countQuery, queryParams.slice(0, -2))
        ]);

        res.json({
            success: true,
            data: ordenes.rows,
            pagination: {
                total: parseInt(countResult.rows[0].total),
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(countResult.rows[0].total / limit)
            }
        });

    } catch (error) {
        console.error('❌ Error listando órdenes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las órdenes de trabajo',
            error: error.message
        });
    }
};

/**
 * Obtener equipos disponibles para crear OT (Req 2.1)
 * Solo equipos "RECEPCIONADO" (o equivalente según tu flujo)
 */
const getEquiposDisponibles = async (req, res) => {
    try {
        const query = `
            SELECT 
                re.id,
                re.codigo_bpc,
                re.codigo_solped,
                re.marca,
                re.modelo,
                re.descripcion_problema,
                re.estado_proceso,
                re.fecha_recepcion,
                re.motivo_id,
                c.razon_social as cliente_nombre,
                c.nro_documento as cliente_documento,
                -- ✅ Reemplazar guiones bajos por espacios para mostrar correctamente
                REPLACE(mr.nombre, '_', ' ') as motivo
            FROM mantenimiento.recepcion_equipo re
            LEFT JOIN ventas.clientes c ON re.cliente_id = c.id_cliente
            LEFT JOIN mantenimiento.motivo_recepcion mr ON re.motivo_id = mr.id
            LEFT JOIN mantenimiento.ordenes_trabajo ot ON re.id = ot.recepcion_equipo_id
            WHERE re.estado_proceso = 'RECEPCIONADO'
            AND ot.id IS NULL
            ORDER BY re.fecha_recepcion DESC
        `;

        const result = await db.query(query);

        console.log('📦 Equipos disponibles encontrados:', result.rows.length);

        res.json({
            success: true,
            data: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        console.error('❌ Error obteniendo equipos disponibles:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener equipos disponibles',
            error: error.message
        });
    }
};

/**
 * Crear Nueva Orden de Trabajo (Req 2.1 y 4.1)
 */
const createOrden = async (req, res) => {
    try {
        const { 
            recepcion_equipo_id, 
            motivo_id, 
            prioridad, 
            descripcion_trabajo, 
            tecnicos_ids = [], 
            created_by 
        } = req.body;

        // Validaciones
        if (!recepcion_equipo_id) {
            return res.status(400).json({
                success: false,
                message: 'El equipo es requerido'
            });
        }

        if (!prioridad || !['BAJA', 'MEDIA', 'ALTA'].includes(prioridad)) {
            return res.status(400).json({
                success: false,
                message: 'Prioridad inválida'
            });
        }

        if (!descripcion_trabajo || descripcion_trabajo.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'La descripción del trabajo es requerida'
            });
        }

        // 1. Obtener el siguiente número de OT disponible
        const nextNumQuery = `
            SELECT COALESCE(MAX(numero_ot), 0) + 1 as numero
            FROM mantenimiento.ordenes_trabajo
        `;
        const nextNumResult = await db.query(nextNumQuery);
        const numero_ot = nextNumResult.rows[0].numero;

        console.log('📝 Número OT asignado:', numero_ot);

        // 2. Insertar la Orden de Trabajo
        const insertOTQuery = `
            INSERT INTO mantenimiento.ordenes_trabajo 
            (numero_ot, recepcion_equipo_id, motivo_id, prioridad, descripcion_trabajo, created_by, estado)
            VALUES ($1, $2, $3, $4, $5, $6, 'SOLICITUD')
            RETURNING *
        `;
        
        const insertOTValues = [
            numero_ot,
            recepcion_equipo_id,
            motivo_id,
            prioridad,
            descripcion_trabajo.trim(),
            created_by || 1
        ];

        const otResult = await db.query(insertOTQuery, insertOTValues);
        const nuevaOT = otResult.rows[0];

        console.log('✅ Orden de Trabajo creada:', nuevaOT.codigo_ot);

        // 3. Asignar técnicos (si hay)
        if (tecnicos_ids && tecnicos_ids.length > 0) {
            const insertTecnicosQuery = `
                INSERT INTO mantenimiento.ot_tecnicos (ot_id, tecnico_id)
                VALUES ($1, $2)
            `;

            for (const tecnico_id of tecnicos_ids) {
                await db.query(insertTecnicosQuery, [nuevaOT.id, tecnico_id]);
            }

            console.log(`✅ ${tecnicos_ids.length} técnico(s) asignado(s)`);
        }

        // 4. ✅ CORRECCIÓN: Cambiar a 'EN EVALUACION' (con espacio)
        const updateEquipoQuery = `
            UPDATE mantenimiento.recepcion_equipo
            SET estado_proceso = 'EN EVALUACION'
            WHERE id = $1
        `;
        await db.query(updateEquipoQuery, [recepcion_equipo_id]);
        console.log('✅ Estado del equipo actualizado a EN EVALUACION');

        console.log('🎉 Orden de Trabajo creada exitosamente');

        res.status(201).json({
            success: true,
            message: 'Orden de trabajo creada exitosamente',
            data: {
                id: nuevaOT.id,
                codigo_ot: nuevaOT.codigo_ot,
                numero_ot: nuevaOT.numero_ot,
                estado: nuevaOT.estado,
                prioridad: nuevaOT.prioridad,
                fecha_creacion: nuevaOT.fecha_creacion,
                tecnicos_asignados: tecnicos_ids.length
            }
        });

    } catch (error) {
        console.error('❌ Error completo creando orden de trabajo:');
        console.error('Mensaje:', error.message);
        console.error('Stack:', error.stack);
        console.error('Constraint:', error.constraint);
        console.error('Detail:', error.detail);
        
        res.status(500).json({
            success: false,
            message: 'Error al crear la orden de trabajo',
            error: error.message
        });
    }
};

/**
 * Obtener Detalle Completo de una OT (Req 3)
 */
const getOrdenById = async (req, res) => {
    try {
        const { id } = req.params;

        // Consulta principal de la OT
        const otQuery = `
            SELECT 
                ot.*,
                re.codigo_bpc,
                re.codigo_solped,
                re.marca AS equipo_marca,
                re.modelo AS equipo_modelo,
                re.descripcion_problema,
                -- ✅ Reemplazar guiones bajos por espacios
                REPLACE(mr.nombre, '_', ' ') AS motivo,
                c.razon_social AS cliente_nombre,
                c.nro_documento AS cliente_documento
            FROM mantenimiento.ordenes_trabajo ot
            JOIN mantenimiento.recepcion_equipo re ON ot.recepcion_equipo_id = re.id
            JOIN mantenimiento.motivo_recepcion mr ON ot.motivo_id = mr.id
            JOIN ventas.clientes c ON re.cliente_id = c.id_cliente
            WHERE ot.id = $1
        `;

        // Técnicos asignados
        const tecnicosQuery = `
            SELECT t.id, t.nombre_completo, t.especialidad
            FROM mantenimiento.ot_tecnicos ott
            JOIN mantenimiento.tecnicos t ON ott.tecnico_id = t.id
            WHERE ott.ot_id = $1
            ORDER BY t.nombre_completo
        `;

        // Historial de estados
        const historialQuery = `
            SELECT 
                he.*,
                u.nombre_completo as usuario_nombre
            FROM mantenimiento.ot_historial_estados he
            LEFT JOIN public.usuarios u ON he.usuario_id = u.id
            WHERE he.ot_id = $1
            ORDER BY he.fecha_cambio DESC
        `;

        // Actividades
        const actividadesQuery = `
            SELECT a.*, t.nombre_completo as tecnico_nombre
            FROM mantenimiento.ot_actividades a
            LEFT JOIN mantenimiento.tecnicos t ON a.tecnico_id = t.id
            WHERE a.ot_id = $1
            ORDER BY a.fecha_actividad DESC
        `;

        // Materiales
        const materialesQuery = `
            SELECT 
                m.*,
                p.descripcion as producto_nombre  -- ✅ Nombre correcto de la columna
            FROM mantenimiento.ot_materiales m
            LEFT JOIN almacen.productos p ON m.producto_codigo = p.codigo
            WHERE m.ot_id = $1
            ORDER BY m.fecha_registro DESC
        `;

        // Adjuntos
        const adjuntosQuery = `
            SELECT 
                adj.*,
                u.nombre_completo as subido_por_nombre
            FROM mantenimiento.ot_adjuntos adj
            LEFT JOIN public.usuarios u ON adj.subido_por = u.id
            WHERE adj.ot_id = $1
            ORDER BY adj.fecha_subida DESC
        `;

        const [otResult, tecnicosResult, historialResult, actividadesResult, materialesResult, adjuntosResult] = await Promise.all([
            db.query(otQuery, [id]),
            db.query(tecnicosQuery, [id]),
            db.query(historialQuery, [id]),
            db.query(actividadesQuery, [id]),
            db.query(materialesQuery, [id]),
            db.query(adjuntosQuery, [id])
        ]);

        if (otResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Orden de trabajo no encontrada'
            });
        }

        const ordenCompleta = {
            ...otResult.rows[0],
            tecnicos: tecnicosResult.rows,
            historial_estados: historialResult.rows,
            actividades: actividadesResult.rows,
            materiales: materialesResult.rows,
            adjuntos: adjuntosResult.rows
        };

        res.json({
            success: true,
            data: ordenCompleta
        });

    } catch (error) {
        console.error('Error obteniendo detalle de OT:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el detalle de la orden',
            error: error.message
        });
    }
};

/**
 * Actualizar OT (General y Estados)
 */
const updateOrden = async (req, res) => {
    const { id } = req.params;
    const { 
        prioridad, 
        estado, 
        descripcion_trabajo, 
        tecnicos_ids,
        updated_by 
    } = req.body;

    try {
        // Actualizar tabla principal
        const updateQuery = `
            UPDATE mantenimiento.ordenes_trabajo
            SET prioridad = COALESCE($1, prioridad),
                estado = COALESCE($2, estado),
                descripcion_trabajo = COALESCE($3, descripcion_trabajo),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
            RETURNING *
        `;
        const result = await db.query(updateQuery, [prioridad, estado, descripcion_trabajo, id]);

        // Actualizar Técnicos
        if (tecnicos_ids) {
            await db.query('DELETE FROM mantenimiento.ot_tecnicos WHERE ot_id = $1', [id]);
            
            if (tecnicos_ids.length > 0) {
                const insertTecnicosQuery = `
                    INSERT INTO mantenimiento.ot_tecnicos (ot_id, tecnico_id)
                    VALUES ($1, $2)
                `;
                for (const tecnico_id of tecnicos_ids) {
                    await db.query(insertTecnicosQuery, [id, tecnico_id]);
                }
            }
        }

        res.json({ 
            success: true,
            message: 'OT Actualizada', 
            data: result.rows[0] 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            success: false,
            message: 'Error actualizando OT',
            error: error.message
        });
    }
};

/**
 * Registrar Actividad (Pestaña 2)
 */
const addActividad = async (req, res) => {
    try {
        const { ot_id, tecnico_id, fecha_actividad, tarea_realizada, duracion_horas, observaciones } = req.body;
        
        const query = `
            INSERT INTO mantenimiento.ot_actividades 
            (ot_id, tecnico_id, fecha_actividad, tarea_realizada, duracion_horas, observaciones)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        
        const { rows } = await db.query(query, [ot_id, tecnico_id, fecha_actividad, tarea_realizada, duracion_horas, observaciones]);
        res.status(201).json(rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al registrar actividad' });
    }
};

/**
 * Registrar Material (Pestaña 2)
 * Busca el costo actual del producto para guardarlo como referencia histórica
 */
const addMaterial = async (req, res) => {
    try {
        const { ot_id, producto_codigo, cantidad, unidad } = req.body;

        // 1. Obtener costo actual del almacén (Importante para costos históricos)
        // Asumiendo tabla almacen.productos con columna costo_promedio o precio
        const prodQuery = 'SELECT costo_promedio FROM almacen.productos WHERE codigo = $1'; 
        const prodRes = await db.query(prodQuery, [producto_codigo]);

        if (prodRes.rows.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado en almacén' });
        }

        const costoUnitario = prodRes.rows[0].costo_promedio || 0;

        // 2. Insertar Material
        const insertQuery = `
            INSERT INTO mantenimiento.ot_materiales 
            (ot_id, producto_codigo, cantidad, unidad, costo_unitario)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;

        const { rows } = await db.query(insertQuery, [ot_id, producto_codigo, cantidad, unidad, costoUnitario]);
        res.status(201).json(rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al agregar material' });
    }
};

/**
 * Subir Adjunto (Pestaña 4)
 * Nota: El manejo físico del archivo (Multer) debe ocurrir en las rutas antes de llamar a este controlador.
 * Aquí solo guardamos la referencia en DB.
 */
const addAdjunto = async (req, res) => {
    try {
        // Asumiendo que usas middleware como 'multer' que deja el archivo en req.file
        if (!req.file) {
            return res.status(400).json({ message: 'No se ha subido ningún archivo' });
        }

        const { ot_id, subido_por } = req.body;
        const { originalname, path, size, mimetype } = req.file;

        const query = `
            INSERT INTO mantenimiento.ot_adjuntos 
            (ot_id, nombre_archivo, ruta_archivo, tipo_archivo, tamano_kb, subido_por)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;

        // Convertir size a KB
        const sizeKb = Math.round(size / 1024);

        const { rows } = await db.query(query, [ot_id, originalname, path, mimetype, sizeKb, subido_por]);
        res.status(201).json(rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al guardar adjunto' });
    }
};

/**
 * Eliminar OT (Acción Crítica)
 * Los ON DELETE CASCADE de la BD eliminarán automáticamente detalles, materiales y actividades.
 */
const deleteOrden = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM mantenimiento.ordenes_trabajo WHERE id = $1', [id]);
        res.json({ message: 'Orden eliminada correctamente y el número ha sido liberado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar OT' });
    }
};

module.exports = {
    getDashboardCounters,
    getAllOrdenes,
    getEquiposDisponibles,
    createOrden,
    getOrdenById,
    updateOrden,
    deleteOrden,
    addActividad,
    addMaterial,
    addAdjunto
};