const db = require('../config/db');

/**
 * Controlador para Planificación de Mantenimientos Preventivos
 * Endpoints base: /api/mantenimiento/planificacion
 */
const planificacionController = {
  // ==========================================
  // GET /planificacion
  // Lista todos los planes
  // ==========================================
  getAllPlanes: async (req, res) => {
    try {
      const query = `
        SELECT
          id,
          equipo_id,
          equipo_nombre,
          equipo_codigo,
          tecnico_id,
          tecnico_nombre,
          frecuencia_valor,
          frecuencia_tipo,
          descripcion,
          proxima_fecha,
          estado,
          creado_por,
          actualizado_por,
          created_at,
          updated_at
        FROM mantenimiento.plan_mantenimiento_preventivo
        ORDER BY proxima_fecha ASC, id ASC;
      `;

      const { rows } = await db.query(query);
      res.status(200).json(rows);
    } catch (error) {
      console.error('❌ Error en getAllPlanes:', error);
      res.status(500).json({ error: 'Error al obtener los planes de mantenimiento.', detalle: error.message });
    }
  },

  // ==========================================
  // GET /planificacion/resumen
  // Resumen general (activos, próximos 7 días, vencidos, inactivos)
  // ==========================================
  getResumenPlanes: async (req, res) => {
    try {
      const query = `
        WITH datos AS (
          SELECT
            estado,
            proxima_fecha,
            CASE 
              WHEN proxima_fecha BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' THEN 1
              ELSE 0
            END AS es_proximo_7_dias
          FROM mantenimiento.plan_mantenimiento_preventivo
        )
        SELECT
          (SELECT COUNT(*) FROM datos WHERE estado = 'ACTIVO')       AS planes_activos,
          (SELECT COUNT(*) FROM datos WHERE es_proximo_7_dias = 1)   AS proximos_7_dias,
          (SELECT COUNT(*) FROM datos WHERE estado = 'VENCIDO')      AS vencidos,
          (SELECT COUNT(*) FROM datos WHERE estado = 'INACTIVO')     AS inactivos;
      `;

      const { rows } = await db.query(query);
      res.status(200).json(rows[0] || {
        planes_activos: 0,
        proximos_7_dias: 0,
        vencidos: 0,
        inactivos: 0
      });
    } catch (error) {
      console.error('❌ Error en getResumenPlanes:', error);
      res.status(500).json({ error: 'Error al obtener el resumen de planes.', detalle: error.message });
    }
  },

  // ==========================================
  // GET /planificacion/calendario?anio=2025&mes=10
  // Devuelve cantidad de planes por día para el calendario
  // ==========================================
  getCalendarioPlanes: async (req, res) => {
    try {
      const { anio, mes } = req.query;

      if (!anio || !mes) {
        return res.status(400).json({ error: 'Debe enviar anio y mes en la consulta.' });
      }

      const query = `
        SELECT
          proxima_fecha::date AS fecha,
          COUNT(*) AS total,
          SUM(CASE WHEN estado = 'ACTIVO' OR estado = 'PROGRAMADO' THEN 1 ELSE 0 END) AS activos,
          SUM(CASE WHEN estado = 'VENCIDO' THEN 1 ELSE 0 END) AS vencidos
        FROM mantenimiento.plan_mantenimiento_preventivo
        WHERE EXTRACT(YEAR FROM proxima_fecha) = $1
          AND EXTRACT(MONTH FROM proxima_fecha) = $2
        GROUP BY proxima_fecha::date
        ORDER BY proxima_fecha::date;
      `;

      const { rows } = await db.query(query, [anio, mes]);
      res.status(200).json(rows);
    } catch (error) {
      console.error('❌ Error en getCalendarioPlanes:', error);
      res.status(500).json({ error: 'Error al obtener datos de calendario.', detalle: error.message });
    }
  },

  // ==========================================
  // POST /planificacion
  // Crear nuevo plan preventivo
  // ==========================================
  createPlan: async (req, res) => {
    try {
      const userId = req.user?.id || null; // viene del middleware auth.verifyToken

      const {
        equipo_id,
        equipo_nombre,
        equipo_codigo,
        tecnico_id,
        tecnico_nombre,
        frecuencia_valor,
        frecuencia_tipo,
        descripcion,
        proxima_fecha,
        estado = 'ACTIVO'
      } = req.body;

      if (!equipo_nombre || !frecuencia_valor || !frecuencia_tipo || !descripcion || !proxima_fecha) {
        return res.status(400).json({ error: 'Campos obligatorios faltantes.' });
      }

      const query = `
        INSERT INTO mantenimiento.plan_mantenimiento_preventivo (
          equipo_id,
          equipo_nombre,
          equipo_codigo,
          tecnico_id,
          tecnico_nombre,
          frecuencia_valor,
          frecuencia_tipo,
          descripcion,
          proxima_fecha,
          estado,
          creado_por,
          actualizado_por
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11
        )
        RETURNING *;
      `;

      const values = [
        equipo_id || null,
        equipo_nombre,
        equipo_codigo || null,
        tecnico_id || null,
        tecnico_nombre || null,
        frecuencia_valor,
        frecuencia_tipo,
        descripcion,
        proxima_fecha,
        estado,
        userId
      ];

      const { rows } = await db.query(query, values);

      res.status(201).json({
        message: 'Plan de mantenimiento creado correctamente.',
        plan: rows[0]
      });
    } catch (error) {
      console.error('❌ Error en createPlan:', error);
      res.status(500).json({ error: 'Error al crear el plan de mantenimiento.', detalle: error.message });
    }
  },

  // ==========================================
  // PUT /planificacion/:id
  // Actualizar un plan (datos generales)
  // ==========================================
  updatePlan: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || null;

      const {
        equipo_id,
        equipo_nombre,
        equipo_codigo,
        tecnico_id,
        tecnico_nombre,
        frecuencia_valor,
        frecuencia_tipo,
        descripcion,
        proxima_fecha,
        estado
      } = req.body;

      const query = `
        UPDATE mantenimiento.plan_mantenimiento_preventivo
        SET
          equipo_id        = $1,
          equipo_nombre    = $2,
          equipo_codigo    = $3,
          tecnico_id       = $4,
          tecnico_nombre   = $5,
          frecuencia_valor = $6,
          frecuencia_tipo  = $7,
          descripcion      = $8,
          proxima_fecha    = $9,
          estado           = COALESCE($10, estado),
          actualizado_por  = $11,
          updated_at       = CURRENT_TIMESTAMP
        WHERE id = $12
        RETURNING *;
      `;

      const values = [
        equipo_id || null,
        equipo_nombre,
        equipo_codigo || null,
        tecnico_id || null,
        tecnico_nombre || null,
        frecuencia_valor,
        frecuencia_tipo,
        descripcion,
        proxima_fecha,
        estado || null,
        userId,
        id
      ];

      const { rows } = await db.query(query, values);

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Plan no encontrado para actualizar.' });
      }

      res.status(200).json({
        message: 'Plan de mantenimiento actualizado correctamente.',
        plan: rows[0]
      });
    } catch (error) {
      console.error('❌ Error en updatePlan:', error);
      res.status(500).json({ error: 'Error al actualizar el plan.', detalle: error.message });
    }
  },

  // ==========================================
  // PUT /planificacion/:id/estado
  // Actualizar solo el estado de un plan
  // ==========================================
  updateEstadoPlan: async (req, res) => {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      const userId = req.user?.id || null;

      if (!estado) {
        return res.status(400).json({ error: 'Debe enviar el nuevo estado.' });
      }

      const query = `
        UPDATE mantenimiento.plan_mantenimiento_preventivo
        SET
          estado          = $1,
          actualizado_por = $2,
          updated_at      = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *;
      `;

      const { rows } = await db.query(query, [estado, userId, id]);

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Plan no encontrado para actualizar estado.' });
      }

      res.status(200).json({
        message: 'Estado del plan actualizado correctamente.',
        plan: rows[0]
      });
    } catch (error) {
      console.error('❌ Error en updateEstadoPlan:', error);
      res.status(500).json({ error: 'Error al actualizar el estado del plan.', detalle: error.message });
    }
  },

  // ==========================================
  // DELETE /planificacion/:id
  // Borrar un plan
  // ==========================================
  deletePlan: async (req, res) => {
    try {
      const { id } = req.params;

      const query = `
        DELETE FROM mantenimiento.plan_mantenimiento_preventivo
        WHERE id = $1
        RETURNING *;
      `;

      const { rows } = await db.query(query, [id]);

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Plan no encontrado para eliminar.' });
      }

      res.status(200).json({
        message: 'Plan de mantenimiento eliminado correctamente.',
        plan: rows[0]
      });
    } catch (error) {
      console.error('❌ Error en deletePlan:', error);
      res.status(500).json({ error: 'Error al eliminar el plan.', detalle: error.message });
    }
  }
};

module.exports = planificacionController;
