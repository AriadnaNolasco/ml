const db = require('../config/db'); 
const path = require('path');

const DashMantenimientoController = {

    getEquiposPorEstado: async (req, res) => {  

        try {
            const query = `
            SELECT  
                estado,
                COUNT(*) AS total
            FROM mantenimiento.equipo
            GROUP BY estado
            ORDER BY estado;
            `;
            const { rows } = await db.query(query);
            res.json(rows);
        } catch (error) {
            console.error('Error en getEquiposPorEstado:', error);
            res.status(500).json({ error: 'Error obteniendo equipos por estado' });
        }       
    },

    getMantenimientosPorTipo: async (req, res) => {     
        try {
            const query = `
            SELECT      
                tipo,
                COUNT(*) AS total
            FROM mantenimiento.mantenimiento    
            WHERE EXTRACT(YEAR FROM fecha_programada) = EXTRACT(YEAR FROM CURRENT_DATE)
            GROUP BY tipo
            ORDER BY tipo;
            `;
            const { rows } = await db.query(query);
            res.json(rows);
        } catch (error) {
            console.error('Error en getMantenimientosPorTipo:', error);
            res.status(500).json({ error: 'Error obteniendo mantenimientos por tipo' });
        }                   
    },

    getMantenimientosPorMes: async (req, res) => {      
        try {
            const query = `
            SELECT
                TO_CHAR(fecha_programada, 'YYYY-MM') AS mes,
                COUNT(*) AS total
            FROM mantenimiento.mantenimiento
            WHERE EXTRACT(YEAR FROM fecha_programada) = EXTRACT(YEAR FROM CURRENT_DATE)     
            GROUP BY mes
            ORDER BY mes;
            `;
            const { rows } = await db.query(query);
            res.json(rows);
        } catch (error) {
            console.error('Error en getMantenimientosPorMes:', error);
            res.status(500).json({ error: 'Error obteniendo mantenimientos por mes' });
        }       
    },

    getMantenimientosCompletadosVsPendientes: async (req, res) => { 
        try {
            const query = `
            SELECT
                SUM(CASE 
                    WHEN estado = 'Completado' THEN 1 
                    ELSE 0  
                    END) AS completados,
                SUM(CASE 
                    WHEN estado != 'Completado' THEN 1  
                    END) AS pendientes
            FROM mantenimiento.mantenimiento;
            `;
            const { rows } = await db.query(query);
            res.json(rows[0]);
        } catch (error) {       
            console.error('Error en getMantenimientosCompletadosVsPendientes:', error);
            res.status(500).json({ error: 'Error obteniendo mantenimientos completados vs pendientes' });
        }       
    }       
};
module.exports = DashMantenimientoController;