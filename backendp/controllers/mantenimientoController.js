const db = require('../config/db');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Ruta absoluta del logo
const logoPath = path.join(__dirname, '../assets/RF.png');

const mantenimientoController = {
  /**
   * Obtener la lista de códigos de compras registrados en la base de datos.
   * Devuelve: código y descripción.
   */
  getCodigosCompras: async (req, res) => {
    try {
      const query = `
        SELECT
          codigo,
          descripcion
        FROM compras.codigo_compras
        ORDER BY codigo;
      `;

      const { rows } = await db.query(query);

      // Si no hay resultados, devuelve un mensaje informativo
      if (!rows || rows.length === 0) {
        return res.status(404).json({ mensaje: 'No se encontraron códigos de compras.' });
      }

      res.status(200).json(rows);
    } catch (error) {
      console.error('❌ Error en getCodigosCompras:', error.message);
      res.status(500).json({
        error: 'Error obteniendo los códigos de compras.',
        detalle: error.message,
      });
    }
  },

  // 📄 Ejemplo futuro:
  // Generar un reporte PDF de mantenimientos con PDFKit
  generarReportePDF: async (req, res) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const outputPath = path.join(__dirname, '../reports/reporte_mantenimientos.pdf');

      // Crear carpeta "reports" si no existe
      if (!fs.existsSync(path.dirname(outputPath))) {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      }

      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Agregar logo (si existe)
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 45, { width: 100 });
      }

      doc.fontSize(20).text('Reporte de Mantenimientos', { align: 'center' });
      doc.moveDown();

      // Aquí podrías agregar contenido dinámico
      doc.fontSize(12).text('Este es un ejemplo de reporte generado con PDFKit.');

      doc.end();

      stream.on('finish', () => {
        res.download(outputPath, 'reporte_mantenimientos.pdf');
      });
    } catch (error) {
      console.error('❌ Error generando el PDF:', error.message);
      res.status(500).json({
        error: 'Error generando el reporte PDF.',
        detalle: error.message,
      });
    }
  },

  // =======================================================
  // --- MÉTODOS AÑADIDOS PARA RECEPCIÓN DE EQUIPOS ---
  // =======================================================

  // Buscar Cliente por RUC para el Frontend
  searchClienteByRuc: async (req, res) => {
    const { ruc } = req.query;
    if (!ruc) {
      return res.status(400).json({ error: 'RUC no proporcionado.' });
    }
    try {
      const query = `
                SELECT 
                    id_cliente, 
                    nro_documento,
                    nro_documento AS ruc, 
                    razon_social,
                    razon_social AS nombre_cliente,
                    codigo,
                    telefono1
                FROM ventas.clientes 
                WHERE nro_documento = $1
                LIMIT 1;
            `;
      const { rows } = await db.query(query, [ruc]);

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Cliente no encontrado con ese RUC.' });
      }

      res.json({
        id: rows[0].id_cliente,
        ruc: rows[0].ruc,
        nombre_cliente: rows[0].nombre_cliente,
        codigo: rows[0].codigo,
        telefono1: rows[0].telefono1 || 'N/A'
      });
    } catch (error) {
      console.error('Error en searchClienteByRuc:', error);
      res.status(500).json({ error: 'Error al buscar el cliente' });
    }
  },

  // Obtener todos las recepciones de equipos
  getAllEquipos: async (req, res) => {
    try {
      const query = `
                SELECT
                    id,
                    codigo_bpc,
                    codigo_solped,
                    fecha_recepcion,
                    marca,
                    modelo,
                    estado_proceso,
                    cliente_nombre,
                    cliente_ruc,
                    motivo_recepcion
                FROM mantenimiento.vw_recepciones_equipo
                ORDER BY fecha_recepcion DESC;
            `;
      const { rows } = await db.query(query);
      res.json(rows);
    } catch (error) {
      console.error('Error en getAllEquipos (Recepciones):', error);
      res.status(500).json({ error: 'Error al obtener la lista de recepciones de equipos' });
    }
  },

  // Obtener una recepción de equipo por ID
  getEquipoById: async (req, res) => {
    const { id } = req.params;
    try {
      const query = `
                SELECT re.*, vc.nro_documento as cliente_ruc_guardado
                FROM mantenimiento.recepcion_equipo re
                JOIN ventas.clientes vc ON re.cliente_id = vc.id_cliente
                WHERE re.id = $1
            `;
      const { rows } = await db.query(query, [id]);

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Recepción de Equipo no encontrada' });
      }

      res.json(rows[0]);
    } catch (error) {
      console.error('Error en getEquipoById:', error);
      res.status(500).json({ error: 'Error al obtener la recepción de equipo' });
    }
  },

  // Obtener datos para los combos (selects) del formulario
  getFormOptions: async (req, res) => {
    try {
      const motivos = await db.query('SELECT id, nombre FROM mantenimiento.motivo_recepcion WHERE estado = TRUE ORDER BY id');

      res.json({
        motivos_recepcion: motivos.rows,
      });

    } catch (error) {
      console.error('Error en getFormOptions:', error);
      res.status(500).json({ error: 'Error al obtener opciones de formulario' });
    }
  },

  // Crear una nueva recepción de equipo (Envío)
  createEquipo: async (req, res) => {
    const created_by = req.user.id;
    const {
      cliente_id,
      fecha_recepcion,
      codigo_bpc,
      codigo_solped,
      descripcion_problema,
      observaciones,
      marca,
      modelo,
      motivo_id,
    } = req.body;

    try {
      const query = `
                INSERT INTO mantenimiento.recepcion_equipo (
                    cliente_id, fecha_recepcion, codigo_bpc, codigo_solped, 
                    descripcion_problema, observaciones, marca, modelo, motivo_id, created_by, estado_proceso
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'RECEPCIONADO')
                RETURNING *;
            `;
      const values = [
        cliente_id,
        fecha_recepcion,
        codigo_bpc,
        codigo_solped || null,
        descripcion_problema,
        observaciones || null,
        marca || null,
        modelo || null,
        motivo_id,
        created_by
      ];

      const { rows } = await db.query(query, values);
      res.status(201).json({
        message: 'Recepción de Equipo creada con éxito',
        recepcion: rows[0]
      });

    } catch (error) {
      console.error('Error en createEquipo (Recepción):', error);
      if (error.code === '23505') { // Violación de unicidad (BPC/SOLPED)
        return res.status(400).json({
          error: `La combinación de BPC (${codigo_bpc}) y SOLPED (${codigo_solped || 'N/A'}) ya existe.`,
          detail: error.message
        });
      }
      if (error.code === '23503') { // Violación de FK (cliente_id no existe en ventas.clientes)
        return res.status(400).json({
          error: `El ID de cliente (${cliente_id}) no es válido o no existe en la tabla de ventas.`,
          detail: error.message
        });
      }
      res.status(500).json({ error: 'Error al crear la recepción de equipo', detail: error.message });
    }
  },

  // Actualizar una recepción de equipo existente
  updateEquipo: async (req, res) => {
    const updated_by = req.userId;
    const { id } = req.params;
    const {
      cliente_id,
      fecha_recepcion,
      codigo_bpc,
      codigo_solped,
      descripcion_problema,
      observaciones,
      marca,
      modelo,
      motivo_id,
      estado_proceso,
    } = req.body;

    try {
      const query = `
                UPDATE mantenimiento.recepcion_equipo SET
                    cliente_id = $1,
                    fecha_recepcion = $2,
                    codigo_bpc = $3,
                    codigo_solped = $4,
                    descripcion_problema = $5,
                    observaciones = $6,
                    marca = $7,
                    modelo = $8,
                    motivo_id = $9,
                    estado_proceso = $10,
                    updated_by = $11,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $12
                RETURNING *;
            `;
      const values = [
        cliente_id,
        fecha_recepcion,
        codigo_bpc,
        codigo_solped || null,
        descripcion_problema,
        observaciones || null,
        marca || null,
        modelo || null,
        motivo_id,
        estado_proceso,
        userId,
        id
      ];

      const { rows } = await db.query(query, values);

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Recepción de Equipo no encontrada para actualizar' });
      }

      res.json({
        message: 'Recepción de Equipo actualizada con éxito',
        recepcion: rows[0]
      });

    } catch (error) {
      console.error('Error en updateEquipo (Recepción):', error);
      if (error.code === '23505') { // Violación de unicidad (BPC/SOLPED)
        return res.status(400).json({
          error: `La combinación de BPC (${codigo_bpc}) y SOLPED (${codigo_solped || 'N/A'}) ya existe en otro registro.`,
          detail: error.message
        });
      }
      if (error.code === '23503') { // Violación de FK (cliente_id no existe en ventas.clientes)
        return res.status(400).json({
          error: `El ID de cliente (${cliente_id}) no es válido o no existe en la tabla de ventas.`,
          detail: error.message
        });
      }
      res.status(500).json({ error: 'Error al actualizar la recepción de equipo', detail: error.message });
    }
  },

  // Eliminar una recepción de equipo
  deleteEquipo: async (req, res) => {
    const { id } = req.params;
    try {
      const deleteQuery = 'DELETE FROM mantenimiento.recepcion_equipo WHERE id = $1 RETURNING *';
      const { rows } = await db.query(deleteQuery, [id]);

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Recepción de Equipo no encontrada para eliminar' });
      }

      res.json({ message: 'Recepción de Equipo eliminada con éxito', recepcion: rows[0] });

    } catch (error) {
      if (error.code === '23503') {
        return res.status(400).json({ error: 'No se puede eliminar la recepción porque ya tiene un proceso de seguimiento asociado.' });
      }
      console.error('Error en deleteEquipo:', error);
      res.status(500).json({ error: 'Error al eliminar la recepción de equipo' });
    }
  },

  // 👉 EQUIPOS PARA SELECT (PLAN PREVENTIVO)
  getEquiposForPlanificacion: async (req, res) => {
    try {
      const query = `
        SELECT
          id,
          codigo_bpc,
          marca,
          modelo
        FROM mantenimiento.recepcion_equipo
        ORDER BY id DESC;
      `;
      const { rows } = await db.query(query);
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error obteniendo equipos para planificación' });
    }
  }, // ✅ COMA CORRECTA


  // 👉 TÉCNICOS PARA SELECT (CORRECTO)
  getTecnicosForPlanificacion: async (req, res) => {
    try {
      const query = `
        SELECT id, nombre_completo
        FROM mantenimiento.vw_tecnicos
        ORDER BY nombre_completo;
      `;
      const { rows } = await db.query(query);
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error obteniendo técnicos' });
    }
  }

};

module.exports = mantenimientoController;

