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

    getDocumentosPorTipoMovimiento: async (req, res) => {
        const { tipo } = req.params;

        try {
            const tipoUpper = (tipo || "").toUpperCase();

            // Códigos permitidos según el tipo de movimiento
            // 👇 Para INGRESO ahora solo usamos: NIC, NIE y NI genérica
            const codigosIngreso = ["NIC", "NIE", "NI"];

            // Por ahora dejamos las salidas igual (las ajustarás cuando diseñes las NS*)
            const codigosSalida = ["NS"];

            const codigosNoAplica = ["NT"];

            let codigosPermitidos = [];

            if (tipoUpper === "INGRESO") {
                codigosPermitidos = codigosIngreso;
                } else if (tipoUpper === "SALIDA") {
                codigosPermitidos = codigosSalida;
                } else if (tipoUpper === "NO APLICA") {
                codigosPermitidos = codigosNoAplica;
                } else {
                return res.status(400).json({
                    success: false,
                    message: "Tipo de movimiento inválido. Debe ser INGRESO, SALIDA o NO APLICA.",
                });
            }

            // Si no hay códigos configurados, devolvemos vacío explícitamente
            if (codigosPermitidos.length === 0) {
                return res.status(200).json({
                    success: true,
                    data: [],
                });
            }

            // Crear placeholders dinámicamente ($1, $2, $3...)
            const placeholders = codigosPermitidos
                .map((_, i) => `$${i + 1}`)
                .join(",");

            const query = `
                SELECT 
                    dc.id_documento AS id,
                    dc.codigo,
                    dc.nombre,
                    dc.siglas,
                    dc.nro_serie,
                    dc.nro_max_aviso,
                    dc.correlativo,
                    dc.documento AS doc_sunat_id,
                    dc.tipo_movimiento AS tipo_mov,
                    dc.id_sucursal AS sucursal_id,
                    dc.id_documento_sal_ing AS doc_relacionado_id,
                    alm.codigo AS almacen_codigo,
                    cat.codigo AS categoria_codigo,
                    dc.estado,
                    CURRENT_TIMESTAMP AS fecha_creacion
                FROM public.documentos dc
                LEFT JOIN almacen.almacenes alm ON dc.id_almacen = alm.id_alm
                LEFT JOIN public.categoria cat ON dc.id_categoria = cat.id_categoria
                WHERE dc.codigo IN (${placeholders})
                ORDER BY dc.codigo ASC
            `;

            const { rows } = await db.query(query, codigosPermitidos);

            res.status(200).json({
                success: true,
                data: rows,
            });

        } catch (error) {
            console.error("Error:", error);
            res.status(500).json({
                success: false,
                message: "Error al filtrar documentos",
                error: error.message,
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
    },

    // Obtener códigos de operación
    getCodOperacion: async (req, res) => {
        try {
            const { tipo_movimiento, estado } = req.query;
            
            let query = `
                SELECT 
                    id_cod_operacion as id,
                    codigo,
                    nombre,
                    siglas,
                    cnt_cargo,
                    cnt_abono,
                    tp_anexo,
                    tipo_movimiento,
                    cl_costos,
                    centro_costo,
                    codigo_sunat,
                    almc_destino,
                    id_categoria,
                    fila_guia,
                    columna_guia,
                    cod_opr_ing,
                    orden_fabricacion
                FROM public.cod_operacion
                WHERE 1=1
            `;
            
            const params = [];
            let paramCount = 0;

            // Filtro por tipo de movimiento
            if (tipo_movimiento) {
                paramCount++;
                query += ` AND tipo_movimiento = $${paramCount}`;
                params.push(tipo_movimiento);
            }

            // Si se necesita filtrar por estado (aunque la tabla no tiene campo estado)
            if (estado !== undefined) {
                // Si la tabla no tiene campo estado, se puede omitir o agregar si es necesario
                // query += ` AND estado = $${paramCount}`;
                // params.push(estado === 'true');
            }

            query += ' ORDER BY codigo ASC';

            const { rows } = await db.query(query, params);
            
            res.status(200).json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Error al obtener códigos de operación:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al obtener códigos de operación',
                error: error.message
            });
        }
    },

    getCodOperacionPorTipoMovimiento: async (req, res) => {
        const { tipo } = req.params;
        const { documento } = req.query; // 👈 NIC, NIE, NI
        const docCodigo = (documento || "").toUpperCase();

        try {
            if (!["INGRESO", "SALIDA"].includes(tipo)) {
                return res.status(400).json({
                    success: false,
                    message: "Tipo de movimiento inválido. Debe ser INGRESO o SALIDA",
                });
            }

            // ===========================
            // MAPEO POR DOCUMENTO (INGRESO)
            // ===========================
            let codigosOperacion = [];

            if (tipo === "INGRESO") {
                // Para NIC / NIE (compras)
                const opsCompra = [201, 202, 106, 501, 502];

                // Para NI (ingresos generales)
                const opsGenerales = [101, 105, 110, 140, 209];

                if (docCodigo === "NIC" || docCodigo === "NIE") {
                    codigosOperacion = opsCompra;
                } else if (docCodigo === "NI") {
                    codigosOperacion = opsGenerales;
                } else {
                    // Por si acaso llega otro documento de ingreso, usamos las generales
                    codigosOperacion = opsGenerales;
                }
            }

            let query = `
                SELECT 
                    id_cod_operacion as id,
                    codigo,
                    nombre,
                    origen_default,
                    siglas,
                    cnt_cargo,
                    cnt_abono,
                    tp_anexo,
                    tipo_movimiento,
                    cl_costos,
                    centro_costo,
                    codigo_sunat,
                    almc_destino,
                    id_categoria,
                    fila_guia,
                    columna_guia,
                    cod_opr_ing,
                    orden_fabricacion
                FROM public.cod_operacion
                WHERE tipo_movimiento = $1
            `;
            const params = [tipo];
            let paramCount = 1;

            // Si es INGRESO, aplicamos filtro por códigos específicos
            if (tipo === "INGRESO" && codigosOperacion.length > 0) {
                const placeholders = codigosOperacion
                    .map((_, i) => `$${++paramCount}`)
                    .join(",");

                // codigo es CHAR(3), conviene comparar con CAST(codigo AS INTEGER)
                query += ` AND CAST(codigo AS INTEGER) IN (${placeholders})`;
                params.push(...codigosOperacion);
            }

            query += " ORDER BY CAST(codigo AS INTEGER) ASC";

            const { rows } = await db.query(query, params);

            return res.json({ success: true, data: rows });
        } catch (error) {
            console.error("Error filtrando cod operación:", error);
            return res.status(500).json({
                success: false,
                message: "Error al obtener operaciones",
            });
        }
    },

    // Obtener tipos de documento COMERCIALES (para facturas, boletas, NC, etc.)
    getTiposDocumentoComercial: async (req, res) => {
        try {
            // Códigos numéricos (sin ceros a la izquierda)
            // Básicos
            const codigosBasicos = [1, 3, 7, 8];        // Factura, Boleta, N/C, N/D
            // Frecuentes
            const codigosFrecuentes = [2, 4];           // Recibo x Honorarios, Liquidación de compra
            // Opcionales
            const codigosOpcionales = [12, 20, 40];     // Ticket, Retención, Percepción
            // Importación
            const codigosImportacion = [50, 51, 52, 53];

            const codigosPermitidos = [
                ...codigosBasicos,
                ...codigosFrecuentes,
                ...codigosOpcionales,
                ...codigosImportacion,
            ];

            const placeholders = codigosPermitidos
                .map((_, i) => `$${i + 1}`)
                .join(",");

            const query = `
                SELECT
                    id_doc AS id,
                    codigo,
                    nombre,
                    siglas,
                    doc,
                    incluye_igv,
                    estado
                FROM public.tipo_documento
                WHERE estado = TRUE
                AND CAST(codigo AS INTEGER) IN (${placeholders})
                ORDER BY CAST(codigo AS INTEGER)
            `;

            const { rows } = await db.query(query, codigosPermitidos);

            res.status(200).json({
                success: true,
                data: rows,
            });
        } catch (error) {
            console.error("Error al obtener tipos de documento comerciales:", error);
            res.status(500).json({
                success: false,
                message:
                    "Error interno del servidor al obtener tipos de documento comerciales",
                error: error.message,
            });
        }
    },

};

module.exports = publicController;