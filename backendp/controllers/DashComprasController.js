const db = require('../config/db'); 
const path = require('path');

const DashComprasController = {

    getOrdenesPorMes: async (req, res) => {
        try {
            const query = `
            SELECT 
                TO_CHAR(fecha, 'YYYY-MM') AS mes,
                COUNT(*) AS total
            FROM compras.orden_compra
            WHERE EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
            GROUP BY mes
            ORDER BY mes;
            `;
            const { rows } = await db.query(query);
            res.json(rows);
        } catch (error) {
            console.error('Error en getOrdenesPorMes:', error);
            res.status(500).json({ error: 'Error obteniendo órdenes por mes' });
        }
    },

    getMontosPorTipoYMoneda: async (req, res) => {
        try {
            const query = `
            SELECT 
                tipo,
                moneda_id,
                SUM(total) AS monto_total
            FROM compras.orden_compra
            GROUP BY tipo, moneda_id
            ORDER BY tipo, moneda_id;
            `;
            const { rows } = await db.query(query);
            res.json(rows);
        } catch (error) {
            console.error('Error en getMontosPorTipoYMoneda:', error);
            res.status(500).json({ error: 'Error obteniendo montos por tipo y moneda' });
        }
    },

    getOrdenesATiempoVsRetrasadas: async (req, res) => {
        try {
            const query = `
            SELECT
                SUM(CASE 
                    WHEN fecha_entrega_prevista >= fecha THEN 1 
                    ELSE 0 
                    END) AS a_tiempo,
                SUM(CASE 
                    WHEN fecha_entrega_prevista < fecha THEN 1 
                    ELSE 0 
                    END) AS retrasadas
            FROM compras.orden_compra;
            `;
            const { rows } = await db.query(query);
            res.json(rows[0]);
        } catch (error) {
            console.error('Error en getOrdenesATiempoVsRetrasadas:', error);
            res.status(500).json({ error: 'Error obteniendo métricas de entrega' });
        }
    },

    getAhorrosPorDescuentos: async (req, res) => {
        try {
            const query = `
            SELECT 
                SUM(descuento_monto) AS total_ahorrado
            FROM compras.orden_compra_detalle;
            `;
            const { rows } = await db.query(query);
            res.json(rows[0]);
        } catch (error) {
            console.error('Error en getAhorrosPorDescuentos:', error);
            res.status(500).json({ error: 'Error obteniendo ahorro por descuentos' });
        }
    },

    getProveedoresActivos: async (req, res) => {
        try {
            const query = `
            SELECT 
                p.id_prov,
                p.razon_social,
                COUNT(oc.id) AS total_ordenes
            FROM compras.proveedores p
            LEFT JOIN compras.orden_compra oc 
                ON oc.proveedor_id = p.id_prov
            GROUP BY p.id_prov, p.razon_social
            HAVING COUNT(oc.id) > 0
            ORDER BY total_ordenes DESC;
            `;
            const { rows } = await db.query(query);
            res.json(rows);
        } catch (error) {
            console.error('Error en getProveedoresActivos:', error);
            res.status(500).json({ error: 'Error obteniendo proveedores activos' });
        }
    },

    getTopProveedores: async (req, res) => {
        try {
            const query = `
            SELECT 
                p.id_prov,
                p.razon_social,
                SUM(oc.total) AS monto_total
            FROM compras.orden_compra oc
            JOIN compras.proveedores p 
                ON p.id_prov = oc.proveedor_id
            GROUP BY p.id_prov, p.razon_social
            ORDER BY monto_total DESC
            LIMIT 5;
            `;
            const { rows } = await db.query(query);
            res.json(rows);
        } catch (error) {
            console.error('Error en getTopProveedores:', error);
            res.status(500).json({ error: 'Error obteniendo top proveedores' });
        }
    },

    getProductosMasComprados: async (req, res) => {
        try {
            const query = `
            SELECT 
                d.producto_codigo,
                p.descripcion,
                SUM(d.cantidad_solicitada) AS total_comprado
            FROM compras.orden_compra_detalle d
            JOIN almacen.productos p 
                ON p.codigo = d.producto_codigo
            GROUP BY d.producto_codigo, p.descripcion
            ORDER BY total_comprado DESC
            LIMIT 10;
            `;
            const { rows } = await db.query(query);
            res.json(rows);
        } catch (error) {
            console.error('Error en getProductosMasComprados:', error);
            res.status(500).json({ error: 'Error obteniendo productos más comprados' });
        }
    },

    getOrdenesVencidas: async (req, res) => {
        try {
            const query = `
            SELECT 
                id,
                numero,
                fecha_entrega_prevista,
                estado
            FROM compras.orden_compra
            WHERE fecha_entrega_prevista < CURRENT_DATE
            AND estado NOT IN ('ENTREGADA', 'CERRADA', 'ANULADA');
            `;
            const { rows } = await db.query(query);
            res.json(rows);
        } catch (error) {
            console.error('Error en getOrdenesVencidas:', error);
            res.status(500).json({ error: 'Error obteniendo órdenes vencidas' });
        }
    },

    getRequerimientosPendientes: async (req, res) => {
        try {
            const query = `
            SELECT 
                id,
                numero,
                estado,
                fecha
            FROM compras.requerimientos_compra
            WHERE estado = 'PENDIENTE';
            `;
            const { rows } = await db.query(query);
            res.json(rows);
        } catch (error) {
            console.error('Error en getRequerimientosPendientes:', error);
            res.status(500).json({ error: 'Error obteniendo requerimientos pendientes' });
        }
    },

};
module.exports = DashComprasController;