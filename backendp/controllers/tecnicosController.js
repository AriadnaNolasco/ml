const db = require('../config/db');

/**
 * Obtener todos los técnicos activos
 */
const getTecnicos = async (req, res) => {
    try {
        const query = `
            SELECT 
                id,
                nombre_completo,
                especialidad,
                telefono,
                email,
                estado
            FROM mantenimiento.tecnicos
            WHERE estado = true
            ORDER BY nombre_completo ASC
        `;
        
        const result = await db.query(query);
        
        res.json({
            success: true,
            data: result.rows,
            total: result.rows.length
        });
        
    } catch (error) {
        console.error('Error obteniendo técnicos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener técnicos',
            error: error.message
        });
    }
};

/**
 * Crear nuevo técnico
 */
const createTecnico = async (req, res) => {
    try {
        const { nombre_completo, especialidad, telefono, email } = req.body;
        
        // Validaciones
        if (!nombre_completo || nombre_completo.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El nombre completo es requerido'
            });
        }
        
        const query = `
            INSERT INTO mantenimiento.tecnicos 
            (nombre_completo, especialidad, telefono, email)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        
        const values = [
            nombre_completo.trim(),
            especialidad?.trim() || null,
            telefono?.trim() || null,
            email?.trim() || null
        ];
        
        const result = await db.query(query, values);
        
        res.status(201).json({
            success: true,
            message: 'Técnico creado exitosamente',
            data: result.rows[0]
        });
        
    } catch (error) {
        console.error('Error creando técnico:', error);
        
        // Error de email duplicado
        if (error.code === '23505') {
            return res.status(400).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error al crear técnico',
            error: error.message
        });
    }
};

/**
 * Actualizar técnico
 */
const updateTecnico = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_completo, especialidad, telefono, email, estado } = req.body;
        
        const query = `
            UPDATE mantenimiento.tecnicos
            SET 
                nombre_completo = COALESCE($1, nombre_completo),
                especialidad = COALESCE($2, especialidad),
                telefono = COALESCE($3, telefono),
                email = COALESCE($4, email),
                estado = COALESCE($5, estado),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $6
            RETURNING *
        `;
        
        const values = [nombre_completo, especialidad, telefono, email, estado, id];
        const result = await db.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Técnico no encontrado'
            });
        }
        
        res.json({
            success: true,
            message: 'Técnico actualizado exitosamente',
            data: result.rows[0]
        });
        
    } catch (error) {
        console.error('Error actualizando técnico:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar técnico',
            error: error.message
        });
    }
};

/**
 * Eliminar técnico (soft delete)
 */
const deleteTecnico = async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `
            UPDATE mantenimiento.tecnicos
            SET estado = false, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;
        
        const result = await db.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Técnico no encontrado'
            });
        }
        
        res.json({
            success: true,
            message: 'Técnico desactivado exitosamente'
        });
        
    } catch (error) {
        console.error('Error eliminando técnico:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar técnico',
            error: error.message
        });
    }
};

module.exports = {
    getTecnicos,
    createTecnico,
    updateTecnico,
    deleteTecnico
};