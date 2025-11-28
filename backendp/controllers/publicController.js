const db = require('../config/db');

const publicController = {

    // Obtener documentos 
    getDocumentos: async (req, res) => {
        try {
            const { codigo } = req.query;
            let query = `
                SELECT 
                    dc.id_documento as id,
                    dc.codigo,
                    dc.nombre,
                    dc.siglas,
                    dc.nro_serie,
                    dc.nro_max_aviso,
                    dc.correlativo,
                    dc.documento as doc_sunat_id,
                    dc.tipo_movimiento as tipo_mov,
                    dc.id_sucursal as sucursal_id,
                    dc.id_documento_sal_ing as doc_relacionado_id,
                    alm.codigo as almacen_codigo,
                    cat.codigo as categoria_codigo,
                    dc.estado,
                    CURRENT_TIMESTAMP as fecha_creacion
                FROM public.documentos dc
                LEFT JOIN almacen.almacenes alm ON dc.id_almacen = alm.id_alm
                LEFT JOIN public.categoria cat ON dc.id_categoria = cat.id_categoria
            `;
            const params = [];

            if (codigo) {
                let codigosArray;
                
                // Verificar si codigo es un array (cuando se usa ?codigo=REQ&codigo=REX)
                if (Array.isArray(codigo)) {
                    codigosArray = codigo;
                } else {
                    // Si es string, separar por comas (cuando se usa ?codigo=REQ,REX)
                    codigosArray = codigo.split(',');
                }
                
                // Crear placeholders para la consulta ($1, $2, etc.)
                const placeholders = codigosArray.map((_, index) => `$${index + 1}`).join(',');
                
                query += ` WHERE dc.codigo IN (${placeholders})`;
                params.push(...codigosArray);
            }

            query += ' ORDER BY dc.codigo ASC';

            const { rows } = await db.query(query, params);
            
            res.status(200).json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Error al obtener documentos:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al obtener documentos',
                error: error.message
            });
        }
    },

    // Obtener tipos de documento SUNAT
    getTiposDocumento: async (req, res) => {
        try {
            const query = `
                SELECT 
                    id_doc as id,
                    codigo,
                    nombre,
                    siglas,
                    doc,
                    incluye_igv,
                    estado
                FROM public.tipo_documento
                WHERE estado = TRUE
                ORDER BY codigo ASC
            `;

            const { rows } = await db.query(query);
            
            res.status(200).json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Error al obtener tipos de documento:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al obtener tipos de documento',
                error: error.message
            });
        }
    },

    // Obtener categorías
    getCategorias: async (req, res) => {
        try {
            const query = `
                SELECT 
                    id_categoria as id,
                    codigo,
                    nombre,
                    siglas,
                    id_exist,
                    ind_venta,
                    ind_critico,
                    ind_importacion,
                    ind_almac_x_compra
                FROM public.categoria
                ORDER BY codigo ASC
            `;

            const { rows } = await db.query(query);
            
            res.status(200).json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Error al obtener categorías:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al obtener categorías',
                error: error.message
            });
        }
    },

    // Obtener almacenes
    getAlmacenes: async (req, res) => {
        try {
            const query = `
                SELECT 
                    id_alm as id,
                    codigo,
                    nombre,
                    siglas,
                    id_categoria,
                    tipo_alm
                FROM almacen.almacenes
                ORDER BY codigo ASC
            `;

            const { rows } = await db.query(query);
            
            res.status(200).json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Error al obtener almacenes:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al obtener almacenes',
                error: error.message
            });
        }
    },

    // Obtener sucursales
    getSucursales: async (req, res) => {
        try {
            const query = `
                SELECT 
                    id_sucursal as id,
                    nombre,
                    direccion,
                    estado
                FROM public.sucursal
                WHERE estado = TRUE
                ORDER BY nombre ASC
            `;

            const { rows } = await db.query(query);
            
            res.status(200).json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Error al obtener sucursales:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al obtener sucursales',
                error: error.message
            });
        }
    },
    // Obtener tipos de documento de identidad
    getTiposDocumentoId: async (req, res) => {
        try {
            const { estado } = req.query;
            let query = `
                SELECT 
                    id,
                    codigo,
                    nombre,
                    siglas,
                    estado
                FROM public.tipo_documento_id
            `;
            
            const params = [];
            
            if (estado !== undefined) {
                query += ' WHERE estado = $1';
                params.push(estado === 'true');
            }
            
            query += ' ORDER BY codigo ASC';

            const { rows } = await db.query(query, params);
            
            res.status(200).json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Error al obtener tipos de documento de identidad:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al obtener tipos de documento de identidad',
                error: error.message
            });
        }
    },

    // Obtener países
    getPaises: async (req, res) => {
        try {
            const { estado } = req.query;
            let query = `
                SELECT 
                    id,
                    codigo,
                    nombre,
                    estado
                FROM public.paises
            `;
            
            const params = [];
            
            if (estado !== undefined) {
                query += ' WHERE estado = $1';
                params.push(estado === 'true');
            }
            
            query += ' ORDER BY nombre ASC';

            const { rows } = await db.query(query, params);
            
            res.status(200).json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Error al obtener países:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al obtener países',
                error: error.message
            });
        }
    },
    // Obtener bancos
    getBancos: async (req, res) => {
        try {
            const { estado } = req.query;
            let query = `
                SELECT 
                    id_bancos as id,
                    codigo,
                    nombre,
                    siglas,
                    direccion,
                    estado
                FROM public.bancos
            `;
            
            const params = [];
            
            if (estado !== undefined) {
                query += ' WHERE estado = $1';
                params.push(estado === 'true');
            }
            
            query += ' ORDER BY nombre ASC';

            const { rows } = await db.query(query, params);
            
            res.status(200).json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Error al obtener bancos:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al obtener bancos',
                error: error.message
            });
        }
    },

    // Obtener monedas
    getMonedas: async (req, res) => {
        try {
            const { estado } = req.query;
            let query = `
                SELECT 
                    id_moneda as id,
                    codigo,
                    nombre,
                    simbolo,
                    pais,
                    estado
                FROM contabilidad.cod_moneda
            `;
            
            const params = [];
            
            if (estado !== undefined) {
                query += ' WHERE estado = $1';
                params.push(estado === 'true');
            }
            
            query += ' ORDER BY nombre ASC';

            const { rows } = await db.query(query, params);
            
            res.status(200).json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Error al obtener monedas:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al obtener monedas',
                error: error.message
            });
        }
    }
};

module.exports = publicController;