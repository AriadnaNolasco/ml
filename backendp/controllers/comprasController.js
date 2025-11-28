const db = require('../config/db'); 
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const logoPath = path.join(__dirname, '../assets/RF.png');

const comprasController = {
    // Obtener códigos de compras - CORREGIDO
    getCodigosCompras: async (req, res) => {
        try {
            const query = `
                SELECT 
                    cc.id_cod_compras as id,
                    cc.codigo, 
                    cc.nombre, 
                    cc.siglas, 
                    cc.referencia, 
                    cc.id_categoria,
                    c.nombre as categoria_nombre,
                    c.siglas as categoria_siglas,
                    cc.tipo_comp as tipo_compra,
                    cc.id_documento_ingreso_alm as doc_ingreso_alm,
                    d.codigo as documento_codigo,
                    d.nombre as documento_nombre,
                    cc.id_cod_operacion,
                    co.codigo as codigo_operacion,
                    co.nombre as nombre_operacion
                FROM public.cod_compras cc
                LEFT JOIN public.categoria c ON cc.id_categoria = c.id_categoria
                LEFT JOIN public.documentos d ON cc.id_documento_ingreso_alm = d.id_documento
                LEFT JOIN public.cod_operacion co ON cc.id_cod_operacion = co.id_cod_operacion
                ORDER BY cc.nombre ASC
            `;
            
            const { rows } = await db.query(query);
            
            res.status(200).json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Error al obtener códigos de compras:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al obtener códigos de compras',
                error: error.message
            });
        }
    },

    // PROVEEDORES
createProveedor: async (req, res) => {
    try {
        const {
            codigo,
            id_documento,
            nro_documento,
            razon_social,
            nomb_comercial,
            id_pais,
            direccion,
            email,
            telefono1,
            telefono2,
            celular1,
            celular2,
            contacto,
            fecha_registro,
            estado,
            cuentas_bancarias = []
        } = req.body;

        // Validación básica
        if (!codigo || !id_documento || !nro_documento || !razon_social) {
            return res.status(400).json({ error: 'Faltan campos obligatorios: código, tipo documento, número documento y razón social' });
        }

        // Insertar proveedor
        const proveedorQuery = `
            INSERT INTO compras.proveedores (
                codigo, id_documento, nro_documento, razon_social, 
                nomb_comercial, id_pais, direccion, email,
                telefono1, telefono2, celular1, celular2, 
                contacto, fecha_registro, estado, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING *
        `;

        const proveedorValues = [
            codigo,
            id_documento,
            nro_documento,
            razon_social,
            nomb_comercial || razon_social,
            id_pais || null,
            direccion || null,
            email || null,
            telefono1 || null,
            telefono2 || null,
            celular1 || null,
            celular2 || null,
            contacto || '',
            fecha_registro || new Date().toISOString().split('T')[0],
            estado !== undefined ? estado : true,
            req.user?.id || req.userId
        ];

        const { rows: proveedorRows } = await db.query(proveedorQuery, proveedorValues);
        const proveedorId = proveedorRows[0].id_prov;

        // Insertar cuentas bancarias si existen
        if (cuentas_bancarias.length > 0) {
            const cuentaQuery = `
                INSERT INTO contabilidad.cuentas_bancarias_prov (
                    id_prov, id_bancos, direccion, id_moneda, numero_cuenta,
                    cta_interbancaria, codigo_swift, codigo_aba, id_pais,
                    estado, created_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `;

            for (const cuenta of cuentas_bancarias) {
                if (cuenta.numero_cuenta && cuenta.id_bancos && cuenta.id_moneda) {
                    await db.query(cuentaQuery, [
                        proveedorId,
                        cuenta.id_bancos,
                        cuenta.direccion || null,
                        cuenta.id_moneda,
                        cuenta.numero_cuenta,
                        cuenta.cta_interbancaria || null,
                        cuenta.codigo_swift || null,
                        cuenta.codigo_aba || null,
                        cuenta.id_pais || null,
                        true,
                        req.user?.id || req.userId
                    ]);
                }
            }
        }

        res.status(201).json({
            message: 'Proveedor creado exitosamente',
            proveedor: proveedorRows[0]
        });
    } catch (error) {
        console.error('Error al crear proveedor:', error);
        
        if (error.code === '23505') {
            if (error.constraint.includes('proveedores_codigo_key')) {
                return res.status(400).json({ error: 'El código de proveedor ya existe' });
            }
            if (error.constraint.includes('proveedores_nro_documento_key')) {
                return res.status(400).json({ error: 'El número de documento ya existe' });
            }
        }
        
        res.status(500).json({ 
            error: 'Error interno del servidor al crear proveedor',
            details: error.message 
        });
    }
},

    // Obtener todos los proveedores con sus cuentas bancarias
    getAllProveedores: async (req, res) => {
        try {
            const { estado, buscar } = req.query;
            let query = `
                SELECT 
                    p.id_prov as id,
                    p.codigo,
                    p.id_documento,
                    p.nro_documento,
                    p.razon_social,
                    p.nomb_comercial,
                    p.id_pais,
                    p.direccion,
                    p.email,
                    p.estado,
                    p.fecha_registro,
                    p.telefono1,
                    p.telefono2,
                    p.celular1,
                    p.celular2,
                    p.contacto,
                    p.created_by,
                    p.updated_by,
                    p.created_at,
                    p.updated_at,
                    pa.nombre as pais_nombre,
                    pa.codigo as pais_codigo,
                    td.nombre as tipo_documento_nombre,
                    td.siglas as tipo_documento_siglas,
                    td.codigo as tipo_documento_codigo,
                    uc.nombre_completo as creado_por_nombre,
                    ua.nombre_completo as actualizado_por_nombre,
                    -- Cuentas bancarias como array JSON
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'id_cuenta', cb.id_cuenta,
                                'id_bancos', cb.id_bancos,
                                'banco_nombre', b.nombre,
                                'banco_siglas', b.siglas,
                                'direccion', cb.direccion,
                                'id_moneda', cb.id_moneda,
                                'moneda_nombre', cm.nombre,
                                'moneda_simbolo', cm.simbolo,
                                'numero_cuenta', cb.numero_cuenta,
                                'cta_interbancaria', cb.cta_interbancaria,
                                'codigo_swift', cb.codigo_swift,
                                'codigo_aba', cb.codigo_aba,
                                'id_pais_banco', cb.id_pais,
                                'pais_banco_nombre', pb.nombre,
                                'estado_cuenta', cb.estado,
                                'created_by_cuenta', cb.created_by,
                                'updated_by_cuenta', cb.updated_by,
                                'created_at_cuenta', cb.created_at,
                                'updated_at_cuenta', cb.updated_at
                            ) 
                        ) FILTER (WHERE cb.id_cuenta IS NOT NULL), '[]'
                    ) as cuentas_bancarias
                FROM compras.proveedores p 
                LEFT JOIN public.paises pa ON p.id_pais = pa.id
                LEFT JOIN public.tipo_documento_id td ON p.id_documento = td.id
                LEFT JOIN public.usuarios uc ON p.created_by = uc.id
                LEFT JOIN public.usuarios ua ON p.updated_by = ua.id
                LEFT JOIN contabilidad.cuentas_bancarias_prov cb ON p.id_prov = cb.id_prov AND cb.estado = true
                LEFT JOIN public.bancos b ON cb.id_bancos = b.id_bancos
                LEFT JOIN contabilidad.cod_moneda cm ON cb.id_moneda = cm.id_moneda
                LEFT JOIN public.paises pb ON cb.id_pais = pb.id
            `;
            
            const params = [];
            let whereConditions = [];
            let paramCount = 0;

            if (estado !== undefined) {
                paramCount++;
                whereConditions.push(`p.estado = $${paramCount}`);
                params.push(estado === 'true');
            }

            if (buscar) {
                paramCount++;
                whereConditions.push(`(
                    p.razon_social ILIKE $${paramCount} OR 
                    p.nomb_comercial ILIKE $${paramCount} OR 
                    p.nro_documento ILIKE $${paramCount} OR
                    p.codigo::TEXT ILIKE $${paramCount} OR
                    p.email ILIKE $${paramCount} OR
                    p.contacto ILIKE $${paramCount} OR
                    td.nombre ILIKE $${paramCount} OR
                    pa.nombre ILIKE $${paramCount}
                )`);
                params.push(`%${buscar}%`);
            }

            if (whereConditions.length > 0) {
                query += ' WHERE ' + whereConditions.join(' AND ');
            }

            query += ' GROUP BY p.id_prov, pa.nombre, pa.codigo, td.nombre, td.siglas, td.codigo, uc.nombre_completo, ua.nombre_completo';
            query += ' ORDER BY p.razon_social ASC';

            const { rows } = await db.query(query, params);
            
            res.status(200).json(rows);
        } catch (error) {
            console.error('Error al obtener proveedores:', error);
            res.status(500).json({ 
                error: 'Error interno del servidor al obtener proveedores',
                details: error.message 
            });
        }
    },

    // Obtener un proveedor por ID con todas sus cuentas bancarias
    getProveedorById: async (req, res) => {
        try {
            const { id } = req.params;
            const query = `
                SELECT 
                    p.id_prov as id,
                    p.codigo,
                    p.id_documento,
                    p.nro_documento,
                    p.razon_social,
                    p.nomb_comercial,
                    p.id_pais,
                    p.direccion,
                    p.email,
                    p.estado,
                    p.fecha_registro,
                    p.telefono1,
                    p.telefono2,
                    p.celular1,
                    p.celular2,
                    p.contacto,
                    p.created_by,
                    p.updated_by,
                    p.created_at,
                    p.updated_at,
                    pa.nombre as pais_nombre,
                    pa.codigo as pais_codigo,
                    td.nombre as tipo_documento_nombre,
                    td.siglas as tipo_documento_siglas,
                    td.codigo as tipo_documento_codigo,
                    uc.nombre_completo as creado_por_nombre,
                    ua.nombre_completo as actualizado_por_nombre,
                    -- Cuentas bancarias como array JSON
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'id_cuenta', cb.id_cuenta,
                                'id_bancos', cb.id_bancos,
                                'banco_nombre', b.nombre,
                                'banco_siglas', b.siglas,
                                'banco_direccion_base', b.direccion,  -- CORREGIDO: quitar el "as"
                                'direccion', cb.direccion,
                                'id_moneda', cb.id_moneda,
                                'moneda_nombre', cm.nombre,
                                'moneda_codigo', cm.codigo,
                                'moneda_simbolo', cm.simbolo,
                                'numero_cuenta', cb.numero_cuenta,
                                'cta_interbancaria', cb.cta_interbancaria,
                                'codigo_swift', cb.codigo_swift,
                                'codigo_aba', cb.codigo_aba,
                                'id_pais_banco', cb.id_pais,
                                'pais_banco_nombre', pb.nombre,
                                'estado_cuenta', cb.estado,
                                'created_by_cuenta', cb.created_by,
                                'updated_by_cuenta', cb.updated_by,
                                'created_at_cuenta', cb.created_at,
                                'updated_at_cuenta', cb.updated_at
                            ) 
                        ) FILTER (WHERE cb.id_cuenta IS NOT NULL), '[]'
                    ) as cuentas_bancarias
                FROM compras.proveedores p 
                LEFT JOIN public.paises pa ON p.id_pais = pa.id 
                LEFT JOIN public.tipo_documento_id td ON p.id_documento = td.id
                LEFT JOIN public.usuarios uc ON p.created_by = uc.id
                LEFT JOIN public.usuarios ua ON p.updated_by = ua.id
                LEFT JOIN contabilidad.cuentas_bancarias_prov cb ON p.id_prov = cb.id_prov AND cb.estado = true
                LEFT JOIN public.bancos b ON cb.id_bancos = b.id_bancos
                LEFT JOIN contabilidad.cod_moneda cm ON cb.id_moneda = cm.id_moneda
                LEFT JOIN public.paises pb ON cb.id_pais = pb.id
                WHERE p.id_prov = $1
                GROUP BY p.id_prov, pa.nombre, pa.codigo, td.nombre, td.siglas, td.codigo, uc.nombre_completo, ua.nombre_completo
            `;
            
            const { rows } = await db.query(query, [id]);
            
            if (rows.length === 0) {
                return res.status(404).json({ error: 'Proveedor no encontrado' });
            }
            
            res.status(200).json(rows[0]);
        } catch (error) {
            console.error('Error al obtener proveedor:', error);
            res.status(500).json({ 
                error: 'Error interno del servidor al obtener proveedor',
                details: error.message 
            });
        }
    },

    // Actualizar un proveedor
    updateProveedor: async (req, res) => {
    try {
        const { id } = req.params;
        const {
            codigo,
            id_documento,
            nro_documento,
            razon_social,
            nomb_comercial,
            id_pais,
            direccion,
            email,
            telefono1,
            telefono2,
            celular1,
            celular2,
            contacto,
            fecha_registro,
            estado,
            cuentas_bancarias = []
        } = req.body;

        // Verificar si el proveedor existe
        const checkQuery = 'SELECT id_prov FROM compras.proveedores WHERE id_prov = $1';
        const checkResult = await db.query(checkQuery, [id]);
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }

        // Actualizar proveedor
        const updateQuery = `
            UPDATE compras.proveedores SET
                codigo = $1,
                id_documento = $2,
                nro_documento = $3,
                razon_social = $4,
                nomb_comercial = $5,
                id_pais = $6,
                direccion = $7,
                email = $8,
                telefono1 = $9,
                telefono2 = $10,
                celular1 = $11,
                celular2 = $12,
                contacto = $13,
                fecha_registro = $14,
                estado = $15,
                updated_by = $16,
                updated_at = CURRENT_TIMESTAMP
            WHERE id_prov = $17
            RETURNING *
        `;

        const values = [
            codigo,
            id_documento,
            nro_documento,
            razon_social,
            nomb_comercial || razon_social,
            id_pais || null,
            direccion || null,
            email || null,
            telefono1 || null,
            telefono2 || null,
            celular1 || null,
            celular2 || null,
            contacto || '',
            fecha_registro || new Date().toISOString().split('T')[0],
            estado !== undefined ? estado : true,
            req.user?.id || req.userId,
            id
        ];

        const { rows } = await db.query(updateQuery, values);

        // Manejar cuentas bancarias - eliminar existentes y crear nuevas
        if (cuentas_bancarias.length > 0) {
            // Primero eliminar cuentas existentes
            const deleteQuery = 'DELETE FROM contabilidad.cuentas_bancarias_prov WHERE id_prov = $1';
            await db.query(deleteQuery, [id]);

            // Luego insertar las nuevas cuentas
            const cuentaQuery = `
                INSERT INTO contabilidad.cuentas_bancarias_prov (
                    id_prov, id_bancos, direccion, id_moneda, numero_cuenta,
                    cta_interbancaria, codigo_swift, codigo_aba, id_pais,
                    estado, created_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `;

            for (const cuenta of cuentas_bancarias) {
                if (cuenta.numero_cuenta && cuenta.id_bancos && cuenta.id_moneda) {
                    await db.query(cuentaQuery, [
                        id,
                        cuenta.id_bancos,
                        cuenta.direccion || null,
                        cuenta.id_moneda,
                        cuenta.numero_cuenta,
                        cuenta.cta_interbancaria || null,
                        cuenta.codigo_swift || null,
                        cuenta.codigo_aba || null,
                        cuenta.id_pais || null,
                        true,
                        req.user?.id || req.userId
                    ]);
                }
            }
        }
        
        res.status(200).json({
            message: 'Proveedor actualizado exitosamente',
            proveedor: rows[0]
        });
    } catch (error) {
        console.error('Error al actualizar proveedor:', error);
        
        if (error.code === '23505') {
            if (error.constraint.includes('proveedores_codigo_key')) {
                return res.status(400).json({ error: 'El código de proveedor ya existe' });
            }
            if (error.constraint.includes('proveedores_nro_documento_key')) {
                return res.status(400).json({ error: 'El número de documento ya existe' });
            }
        }
        
        res.status(500).json({ 
            error: 'Error interno del servidor al actualizar proveedor',
            details: error.message 
        });
    }
},

// Obtener cuentas bancarias de un proveedor
getCuentasBancariasProveedor: async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `
            SELECT 
                cb.*,
                b.nombre as banco_nombre,
                b.codigo as banco_codigo,
                m.codigo as moneda_codigo,
                m.nombre as moneda_nombre,
                m.simbolo as moneda_simbolo,
                p.nombre as pais_nombre
            FROM contabilidad.cuentas_bancarias_prov cb
            LEFT JOIN public.bancos b ON cb.id_bancos = b.id_bancos
            LEFT JOIN contabilidad.cod_moneda m ON cb.id_moneda = m.id_moneda
            LEFT JOIN public.paises p ON cb.id_pais = p.id
            WHERE cb.id_prov = $1 AND cb.estado = true
            ORDER BY cb.id_cuenta
        `;
        
        const { rows } = await db.query(query, [id]);
        
        res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error al obtener cuentas bancarias:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al obtener cuentas bancarias',
            error: error.message
        });
    }
},

// Obtener datos para formulario de cuentas bancarias
getDatosCuentasBancarias: async (req, res) => {
    try {
        const [bancosRes, monedasRes, paisesRes] = await Promise.all([
            db.query('SELECT id_bancos as id, codigo, nombre, direccion FROM public.bancos WHERE estado = true ORDER BY nombre'),
            db.query('SELECT id_moneda as id, codigo, nombre, simbolo FROM contabilidad.cod_moneda WHERE estado = true ORDER BY nombre'),
            db.query('SELECT id, nombre, codigo FROM public.paises WHERE estado = true ORDER BY nombre')
        ]);

        res.status(200).json({
            bancos: bancosRes.rows,
            monedas: monedasRes.rows,
            paises: paisesRes.rows
        });
    } catch (error) {
        console.error('Error al obtener datos para cuentas bancarias:', error);
        res.status(500).json({
            error: 'Error interno del servidor al obtener datos bancarios',
            details: error.message
        });
    }
},

    // Actualizar estado del proveedor
    updateEstadoProveedor: async (req, res) => {
        try {
            const { id } = req.params;
            const { estado } = req.body;

            if (typeof estado !== 'boolean') {
                return res.status(400).json({ error: 'El campo estado es requerido y debe ser booleano' });
            }

            const query = `
                UPDATE compras.proveedores 
                SET estado = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP 
                WHERE id_prov = $3 
                RETURNING *
            `;
            
            const { rows } = await db.query(query, [estado, req.userId, id]);
            
            if (rows.length === 0) {
                return res.status(404).json({ error: 'Proveedor no encontrado' });
            }
            
            res.status(200).json({
                message: 'Estado del proveedor actualizado exitosamente',
                proveedor: rows[0]
            });
        } catch (error) {
            console.error('Error al actualizar estado del proveedor:', error);
            res.status(500).json({ 
                error: 'Error interno del servidor al actualizar estado del proveedor',
                details: error.message 
            });
        }
    },

    // Buscar proveedores por término
    searchProveedores: async (req, res) => {
        try {
            const { termino } = req.query;
            
            if (!termino || termino.length < 2) {
                return res.status(400).json({ error: 'Término de búsqueda debe tener al menos 2 caracteres' });
            }

            const query = `
                SELECT 
                    p.id_prov as id,
                    p.codigo,
                    p.nro_documento,
                    p.razon_social,
                    p.nomb_comercial,
                    td.siglas as documento_siglas
                FROM compras.proveedores p
                LEFT JOIN public.tipo_documento_id td ON p.id_documento = td.id
                WHERE (
                    p.razon_social ILIKE $1 OR 
                    p.nomb_comercial ILIKE $1 OR 
                    p.nro_documento ILIKE $1 OR
                    p.codigo::TEXT = $2
                )
                AND p.estado = true
                ORDER BY p.razon_social
                LIMIT 20
            `;

            const { rows } = await db.query(query, [`%${termino}%`, termino]);
            
            res.status(200).json(rows);
        } catch (error) {
            console.error('Error al buscar proveedores:', error);
            res.status(500).json({ 
                error: 'Error interno del servidor al buscar proveedores',
                details: error.message 
            });
        }
    },

    // Obtener todos los requerimientos con sus productos - ACTUALIZADO
    getAllRequerimientos: async (req, res) => {
        try {
            const { estado, numero, fecha_inicio, fecha_fin } = req.query;

            let query = `
            SELECT 
                r.*, 
                u.nombre_completo as solicitante_nombre, 
                u.username as solicitante_username,
                a.nombre as solicitante_area,
                cc.nombre as codigo_compras_nombre,
                d.codigo as documento_codigo,
                cco.nombre as centro_costo_nombre,   
                COALESCE(
                json_agg(
                    json_build_object(
                    'id', rd.id,
                    'num_item', rd.numitem,
                    'producto_codigo', rd.producto_codigo,
                    'producto_descripcion', p.descripcion,
                    'cantidad_solicitada', rd.cantidad_solicitada,
                    'stock_actual', rd.stock_actual,
                    'comentario', rd.comentario
                    ) ORDER BY rd.numitem
                ) FILTER (WHERE rd.id IS NOT NULL), '[]'
                ) as productos
            FROM compras.requerimientos_compra r
            LEFT JOIN public.usuarios u ON r.solicitante_id = u.id
            LEFT JOIN public.area a ON u.area_id = a.id 
            LEFT JOIN public.cod_compras cc ON r.id_cod_compras = cc.id_cod_compras
            LEFT JOIN contabilidad.c_costo cco ON r.centro_costo_id = cco.id_c_costo 
            LEFT JOIN compras.requerimientos_compra_detalle rd ON r.id = rd.requerimiento_id
            LEFT JOIN almacen.productos p ON rd.producto_codigo = p.codigo
            LEFT JOIN public.documentos d ON r.id_documento = d.id_documento
            WHERE 1=1
            `;

            const params = [];
            let paramCount = 0;

            if (estado) {
            paramCount++;
            query += ` AND r.estado = $${paramCount}`;
            params.push(estado);
            }

            if (numero) {
            paramCount++;
            query += ` AND r.numero ILIKE $${paramCount}`;
            params.push(`%${numero}%`);
            }

            if (fecha_inicio) {
            paramCount++;
            query += ` AND r.fecha >= $${paramCount}`;
            params.push(fecha_inicio);
            }

            if (fecha_fin) {
            paramCount++;
            query += ` AND r.fecha <= $${paramCount}`;
            params.push(fecha_fin);
            }

            query += `
            GROUP BY r.id, u.nombre_completo, u.username, a.nombre, cc.nombre, d.codigo, cco.nombre
            ORDER BY r.fecha DESC, r.numero DESC
            `;

            const { rows } = await db.query(query, params);

            const requerimientos = rows.map((row) => ({
            ...row,
            productos:
                typeof row.productos === 'string'
                ? JSON.parse(row.productos)
                : row.productos,
            }));

            res.status(200).json(requerimientos);
        } catch (error) {
            console.error('Error al obtener requerimientos:', error);
            res.status(500).json({
            error: 'Error interno del servidor al obtener requerimientos',
            details: error.message,
            });
        }
    },

    // Obtener detalles de un requerimiento - ACTUALIZADO
    getRequerimientoDetalles: async (req, res) => {
        try {
            const { id } = req.params;

            const requerimientoQuery = `
            SELECT 
                rc.*,
                u.nombre_completo as solicitante_nombre,
                a.nombre as solicitante_area,
                d.codigo as documento_codigo,
                cc.nombre as codigo_compras_nombre,
                cco.nombre as centro_costo_nombre  
            FROM compras.requerimientos_compra rc
            LEFT JOIN public.usuarios u ON rc.solicitante_id = u.id
            LEFT JOIN public.area a ON u.area_id = a.id
            LEFT JOIN public.documentos d ON rc.id_documento = d.id_documento
            LEFT JOIN public.cod_compras cc ON rc.id_cod_compras = cc.id_cod_compras
            LEFT JOIN contabilidad.c_costo cco ON rc.centro_costo_id = cco.id_c_costo   
            WHERE rc.id = $1
            `;

            const detallesQuery = `
            SELECT 
                rd.*, 
                p.descripcion as producto_descripcion,
                p.codigo_barras,
                p.stock_actual as stock_actual_producto,
                um.nombre as unidad_medida,
                um.siglas as unidad_medida_abrev,
                d.codigo as requerimiento_codigo,
                rc.numero as requerimiento_numero
            FROM compras.requerimientos_compra_detalle rd
            LEFT JOIN almacen.productos p ON rd.producto_codigo = p.codigo
            LEFT JOIN public.unidades_medida um ON p.id_unidad = um.id_unidades
            LEFT JOIN compras.requerimientos_compra rc ON rd.requerimiento_id = rc.id
            LEFT JOIN public.documentos d ON rc.id_documento = d.id_documento
            WHERE rd.requerimiento_id = $1
            ORDER BY rd.numitem
            `;

            const [requerimientoResult, detallesResult] = await Promise.all([
            db.query(requerimientoQuery, [id]),
            db.query(detallesQuery, [id]),
            ]);

            if (requerimientoResult.rows.length === 0) {
            return res
                .status(404)
                .json({ error: 'Requerimiento no encontrado' });
            }

            const requerimiento = requerimientoResult.rows[0];
            const detalles = detallesResult.rows;

            res.status(200).json({
            ...requerimiento,
            detalles,
            });
        } catch (error) {
            console.error('Error al obtener requerimiento completo:', error);
            res
            .status(500)
            .json({ error: 'Error interno del servidor al obtener requerimiento' });
        }
    },

    // Obtener siguiente número de requerimiento (SE PUEDE INCREMENTAR LA LONGITUD DEL NÚMEOR PARA EL REQUERIMIENTO)
    getNextRequerimientoNumber: async (req, res) => {
    try {
        // Obtener el tipo desde query params
        const { tipo } = req.query;

        const query = `
            SELECT numero 
            FROM compras.requerimientos_compra
            WHERE tipo = $1
            ORDER BY id DESC
            LIMIT 1
        `;
        const { rows } = await db.query(query, [tipo]);

        let nextNumber = "000000001"; // valor inicial si no hay registros
        if (rows.length > 0) {
        const lastNumber = rows[0].numero;
        const numericPart = parseInt(lastNumber, 10);
        const incremented = numericPart + 1;
        nextNumber = incremented.toString().padStart(9, "0"); // 🔹 ahora 9 dígitos
        }

        res.status(200).json({ nextNumber });
    } catch (error) {
        console.error("Error al obtener siguiente número:", error);
        res.status(500).json({
        error: "Error interno al obtener siguiente número",
        details: error.message
        });
    }
    },

    // Crear requerimiento - ACTUALIZADO
    createRequerimiento: async (req, res) => {
        try {
            const {
            id_documento,
            fecha,
            tipo,
            id_cod_compras,
            fecha_entrega,
            estado,
            prioridad,
            proposito,
            centro_costo_id,
            items
            } = req.body;

            if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Debe agregar al menos un item' });
            }

            await db.query('BEGIN');

            // 🔹 Obtener último número por tipo (INTERNO o EXTERNO)
            const lastNumberQuery = `
            SELECT numero 
            FROM compras.requerimientos_compra
            WHERE tipo = $1
            ORDER BY id DESC
            LIMIT 1
            `;
            const { rows: lastRows } = await db.query(lastNumberQuery, [tipo]);

            let nextNumber = "000000001"; 
            if (lastRows.length > 0) {
            const lastNumber = lastRows[0].numero;
            const numericPart = parseInt(lastNumber, 10);
            const incremented = numericPart + 1;
            nextNumber = incremented.toString().padStart(9, "0"); // 🔹 ahora 9 dígitos
            }

            // Calcular total solicitado
            const totalSolicitado = items.reduce(
            (sum, item) => sum + (Number(item.cantidad_solicitada) || 0),
            0
            );

            const requerimientoQuery = `
            INSERT INTO compras.requerimientos_compra (
                id_documento, numero, fecha, tipo, solicitante_id, id_cod_compras,
                fecha_entrega, proposito, estado, prioridad, total_cantidad_solicitada, 
                centro_costo_id, 
                created_by
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
            RETURNING *
            `;

            const requerimientoValues = [
            id_documento,
            nextNumber,
            fecha,
            tipo,
            req.userId,
            id_cod_compras,
            fecha_entrega,
            proposito || "COMPRA",
            estado || "PENDIENTE",
            (prioridad || "NORMAL").toUpperCase(),
            totalSolicitado,
            centro_costo_id,
            req.userId
            ];

            const { rows: requerimientoRows } = await db.query(requerimientoQuery, requerimientoValues);
            const requerimientoId = requerimientoRows[0].id;

            // Insertar items...
            for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const stockQuery = `SELECT stock_actual FROM almacen.productos WHERE codigo = $1`;
            const stockResult = await db.query(stockQuery, [item.producto_codigo]);
            const stockActual = stockResult.rows[0]?.stock_actual || 0;

            const itemQuery = `
                INSERT INTO compras.requerimientos_compra_detalle (
                requerimiento_id, numitem, producto_codigo, cantidad_solicitada,
                stock_actual, comentario
                ) VALUES ($1,$2,$3,$4,$5,$6)
            `;

            const itemValues = [
                requerimientoId,
                i + 1,
                item.producto_codigo,
                item.cantidad_solicitada,
                stockActual,
                item.comentario || ""
            ];

            await db.query(itemQuery, itemValues);
            }

            await db.query("COMMIT");

            res.status(201).json({
            message: "Requerimiento creado exitosamente",
            requerimiento: requerimientoRows[0]
            });
        } catch (error) {
            await db.query("ROLLBACK");
            console.error("Error al crear requerimiento:", error);

            if (error.code === "23505") {
            return res.status(400).json({ error: "El número de requerimiento ya existe" });
            }

            res.status(500).json({
            error: "Error interno del servidor al crear requerimiento",
            details: error.message
            });
        }
        },


    // Actualizar un requerimiento - ACTUALIZADO
    updateRequerimiento: async (req, res) => {
        try {
            const { id } = req.params;
            const {
            id_documento,
            numero,
            fecha,
            tipo,
            id_cod_compras,
            fecha_entrega,
            estado,
            prioridad,
            proposito, 
            centro_costo_id,
            items
            } = req.body;

            // Verificar si el requerimiento existe
            const checkQuery = 'SELECT id FROM compras.requerimientos_compra WHERE id = $1';
            const { rows } = await db.query(checkQuery, [id]);

            if (rows.length === 0) {
            return res.status(404).json({ error: 'Requerimiento no encontrado' });
            }

            // Iniciar transacción
            await db.query('BEGIN');

            // Calcular total solicitado
            const totalSolicitado = items.reduce(
            (sum, item) => sum + (Number(item.cantidad_solicitada) || 0),
            0
            );

            // Actualizar requerimiento
            const updateQuery = `
                UPDATE compras.requerimientos_compra SET
                    id_documento = $1,
                    numero = $2,
                    fecha = $3,
                    tipo = $4,
                    id_cod_compras = $5,
                    fecha_entrega = $6,
                    proposito = $7,
                    estado = $8,
                    prioridad = $9,
                    total_cantidad_solicitada = $10,
                    centro_costo_id = $11,  
                    updated_by = $12,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $13
                RETURNING *
            `;

            const updateValues = [
                id_documento,
                numero,
                fecha,
                tipo,
                id_cod_compras,
                fecha_entrega,
                proposito || "COMPRA",
                estado,
                prioridad?.toUpperCase() || "NORMAL",
                totalSolicitado,
                centro_costo_id,
                req.userId,
                id
            ];

            const { rows: updatedRows } = await db.query(updateQuery, updateValues);

            // Eliminar items existentes
            await db.query(
            'DELETE FROM compras.requerimientos_compra_detalle WHERE requerimiento_id = $1',
            [id]
            );

            
            for (let i = 0; i < items.length; i++) {
            const item = items[i];

            // Obtener stock actual del producto
            const stockQuery = `SELECT stock_actual FROM almacen.productos WHERE codigo = $1`;
            const stockResult = await db.query(stockQuery, [item.producto_codigo]);
            const stockActual = stockResult.rows[0]?.stock_actual || 0;

            const itemQuery = `
                INSERT INTO compras.requerimientos_compra_detalle (
                requerimiento_id, numitem, producto_codigo, cantidad_solicitada,
                stock_actual, comentario
                ) VALUES ($1, $2, $3, $4, $5, $6)
            `;

            const itemValues = [
                id,
                i + 1,
                item.producto_codigo,
                item.cantidad_solicitada,
                stockActual,
                item.comentario || ''
            ];

            await db.query(itemQuery, itemValues);
            }

            await db.query('COMMIT');

            res.status(200).json({
            message: 'Requerimiento actualizado exitosamente',
            requerimiento: updatedRows[0]
            });
        } catch (error) {
            await db.query('ROLLBACK');
            console.error('Error al actualizar requerimiento:', error);

            if (error.code === '23505') {
            return res.status(400).json({ error: 'El número de requerimiento ya existe' });
            }

            res.status(500).json({
            error: 'Error interno del servidor al actualizar requerimiento',
            details: error.message
            });
        }
    },

    // Aprobar un requerimiento
    aprobarRequerimiento: async (req, res) => {
        try {
            const { id } = req.params;
            
            // Verificar si el requerimiento existe
            const checkQuery = 'SELECT id, estado FROM compras.requerimientos_compra WHERE id = $1';
            const { rows } = await db.query(checkQuery, [id]);
            
            if (rows.length === 0) {
                return res.status(404).json({ error: 'Requerimiento no encontrado' });
            }

            const requerimiento = rows[0];
            
            // Solo se puede aprobar requerimientos pendientes
            if (requerimiento.estado !== 'PENDIENTE') {
                return res.status(400).json({ 
                    error: 'Solo se pueden aprobar requerimientos en estado PENDIENTE' 
                });
            }

            const updateQuery = `
                UPDATE compras.requerimientos_compra 
                SET estado = 'APROBADO', 
                    updated_by = $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                RETURNING *
            `;

            const { rows: updatedRows } = await db.query(updateQuery, [req.userId, id]);
            
            res.status(200).json({
                message: 'Requerimiento aprobado exitosamente',
                requerimiento: updatedRows[0]
            });
        } catch (error) {
            console.error('Error al aprobar requerimiento:', error);
            res.status(500).json({ 
                error: 'Error interno del servidor al aprobar requerimiento',
                details: error.message 
            });
        }
    },

    // Rechazar un requerimiento
    rechazarRequerimiento: async (req, res) => {
        try {
            const { id } = req.params;
            
            // Verificar si el requerimiento existe
            const checkQuery = 'SELECT id, estado FROM compras.requerimientos_compra WHERE id = $1';
            const { rows } = await db.query(checkQuery, [id]);
            
            if (rows.length === 0) {
                return res.status(404).json({ error: 'Requerimiento no encontrado' });
            }

            const requerimiento = rows[0];
            
            // Solo se puede rechazar requerimientos pendientes
            if (requerimiento.estado !== 'PENDIENTE') {
                return res.status(400).json({ 
                    error: 'Solo se pueden rechazar requerimientos en estado PENDIENTE' 
                });
            }

            const updateQuery = `
                UPDATE compras.requerimientos_compra 
                SET estado = 'RECHAZADO', 
                    updated_by = $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                RETURNING *
            `;

            const { rows: updatedRows } = await db.query(updateQuery, [req.userId, id]);
            
            res.status(200).json({
                message: 'Requerimiento rechazado exitosamente',
                requerimiento: updatedRows[0]
            });
        } catch (error) {
            console.error('Error al rechazar requerimiento:', error);
            res.status(500).json({ 
                error: 'Error interno del servidor al rechazar requerimiento',
                details: error.message 
            });
        }
    },

exportRequerimientoPDF : async (req, res) => {
    try {
        const { id } = req.params;

        // Consultas SQL (mantener igual)
        const requerimientoQuery = `
        SELECT 
            rc.*, 
            u.nombre_completo as solicitante_nombre,
            a.nombre as solicitante_area,
            d.codigo as documento_codigo,
            cc.nombre as codigo_compras_nombre,
            cco.nombre as centro_costo_nombre
        FROM compras.requerimientos_compra rc
        LEFT JOIN public.usuarios u ON rc.solicitante_id = u.id
        LEFT JOIN public.area a ON u.area_id = a.id
        LEFT JOIN public.documentos d ON rc.id_documento = d.id_documento
        LEFT JOIN public.cod_compras cc ON rc.id_cod_compras = cc.id_cod_compras
        LEFT JOIN contabilidad.c_costo cco ON rc.centro_costo_id = cco.id_c_costo
        WHERE rc.id = $1
        `;

        const detallesQuery = `
        SELECT 
            rd.*, 
            p.descripcion as producto_descripcion,
            um.nombre as unidad_medida,
            um.siglas as unidad_medida_abrev
        FROM compras.requerimientos_compra_detalle rd
        LEFT JOIN almacen.productos p ON rd.producto_codigo = p.codigo
        LEFT JOIN public.unidades_medida um ON p.id_unidad = um.id_unidades
        WHERE rd.requerimiento_id = $1
        ORDER BY rd.numitem
        `;

        const [reqRes, detRes] = await Promise.all([
            db.query(requerimientoQuery, [id]),
            db.query(detallesQuery, [id])
        ]);

        if (reqRes.rows.length === 0) {
            return res.status(404).json({ error: 'Requerimiento no encontrado' });
        }

        const requerimiento = reqRes.rows[0];
        const detalles = detRes.rows;

        // Configurar cabeceras HTTP
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=REQ_${requerimiento.numero}.pdf`);

        // Crear el documento PDF
        const doc = new PDFDocument({ 
            margin: 50,
            size: 'A4',
            bufferPages: true
        });
        doc.pipe(res);

        // --- ENCABEZADO FORMAL ---
        let yPosition = 50;

        doc.fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('RADIADORES FORTALEZA S.A.C.', 50, yPosition);

        doc.fontSize(9)
        .font('Helvetica')
        .text('RUC: 20101636411', 50, yPosition + 12)
        .text('Av. Separadora Industrial Nro. 1555', 50, yPosition + 24)
        .text('Ate - Lima - Perú', 50, yPosition + 36);

        // Ajustar nueva posición de trabajo
        let yPositionAfterHeader = yPosition + 50;

        // --- Recuadro de documento ---
        doc.rect(390, yPosition - 5, 155, 60)
        .lineWidth(1)
        .stroke('#000000');

        doc.fontSize(13)
        .font('Helvetica-Bold')
        .text('REQUERIMIENTO', 395, yPosition + 2, { width: 145, align: 'center' });

        // Código del documento + número
        const codigoDoc = requerimiento.documento_codigo?.trim() || 'REQ';
        doc.fontSize(10)
        .font('Helvetica')
        .text(`${codigoDoc} N° ${requerimiento.numero}`, 395, yPosition + 25, { width: 145, align: 'center' });

        // Fecha
        doc.fontSize(9)
        .text(`Fecha: ${new Date(requerimiento.fecha).toLocaleDateString('es-PE')}`, 395, yPosition + 40, { width: 145, align: 'center' });

        // Línea separadora
        yPosition = 125;
        doc.moveTo(50, yPosition)
        .lineTo(545, yPosition)
        .strokeColor('#000000')
        .lineWidth(0.5)
        .stroke();

        // --- DATOS DEL REQUERIMIENTO ---
        yPosition += 15;
        doc.fontSize(10)
        .font('Helvetica-Bold')
        .text('DATOS DEL REQUERIMIENTO', 50, yPosition);

        yPosition += 15;

        // Datos organizados en dos columnas
        const datos = [
        { label: 'Solicitante', value: requerimiento.solicitante_nombre || 'N/A' },
        { label: 'Área', value: requerimiento.solicitante_area || 'N/A' },
        { label: 'Tipo', value: requerimiento.tipo || 'N/A' },
        { label: 'Prioridad', value: requerimiento.prioridad || 'N/A' },
        { label: 'Fecha de Entrega', value: new Date(requerimiento.fecha_entrega).toLocaleDateString('es-PE') },
        { label: 'Estado', value: requerimiento.estado || 'N/A' },
        { label: 'Propósito', value: requerimiento.proposito || 'N/A' },
        { label: 'Centro de Costo', value: requerimiento.centro_costo_nombre || 'N/A' }
        ];

        // Imprimir en dos columnas
        const colLeftX = 55;
        const colRightX = 300;
        let colY = yPosition + 15;

        for (let i = 0; i < datos.length; i += 2) {
        const left = datos[i];
        const right = datos[i + 1];

        doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000')
            .text(left.label + ':', colLeftX, colY);
        doc.font('Helvetica')
            .text(left.value, colLeftX + 100, colY, { width: 130 });

        if (right) {
            doc.font('Helvetica-Bold')
            .text(right.label + ':', colRightX, colY);
            doc.font('Helvetica')
            .text(right.value, colRightX + 100, colY, { width: 130 });
        }

        colY += 18;
        }

        // Línea inferior
        doc.moveTo(50, colY + 5)
        .lineTo(545, colY + 5)
        .strokeColor('#cccccc')
        .lineWidth(0.5)
        .stroke();

        yPosition = colY + 25;

        // --- DETALLE DE PRODUCTOS ---
        yPosition += 25;

        doc.fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('DETALLE DE PRODUCTOS SOLICITADOS', 50, yPosition);

        yPosition += 20;

        // Encabezado de tabla
        doc.rect(50, yPosition, 495, 22)
        .fillAndStroke('#f0f0f0', '#000000')
        .lineWidth(0.5);

        // Columnas
        const colX = [52, 85, 155, 390, 455, 500];
        const headers = ['Item', 'Código', 'Descripción', 'U.M.', 'Cantidad', 'Stock'];

        doc.fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#000000');

        doc.text(headers[0], colX[0], yPosition + 7, { width: 30, align: 'center' });
        doc.text(headers[1], colX[1], yPosition + 7, { width: 65, align: 'center' });
        doc.text(headers[2], colX[2], yPosition + 7, { width: 230, align: 'left' });
        doc.text(headers[3], colX[3], yPosition + 7, { width: 60, align: 'center' });
        doc.text(headers[4], colX[4], yPosition + 7, { width: 40, align: 'center' });
        doc.text(headers[5], colX[5], yPosition + 7, { width: 40, align: 'center' });

        yPosition += 22;

        // Filas de detalle
        doc.fontSize(8)
        .font('Helvetica');

        // Función para dibujar encabezado de tabla
        const dibujarEncabezadoTabla = (y) => {
            doc.rect(50, y, 495, 22)
            .fillAndStroke('#f0f0f0', '#000000')
            .lineWidth(0.5);

            doc.fontSize(9)
            .font('Helvetica-Bold')
            .fillColor('#000000');

            doc.text(headers[0], colX[0], y + 7, { width: 30, align: 'center' });
            doc.text(headers[1], colX[1], y + 7, { width: 65, align: 'center' });
            doc.text(headers[2], colX[2], y + 7, { width: 230, align: 'left' });
            doc.text(headers[3], colX[3], y + 7, { width: 60, align: 'center' });
            doc.text(headers[4], colX[4], y + 7, { width: 40, align: 'center' });
            doc.text(headers[5], colX[5], y + 7, { width: 40, align: 'center' });
        };

        detalles.forEach((detalle, index) => {
            // Calcular altura de la fila según descripción
            const descripcion = detalle.producto_descripcion || '';
            const descHeight = doc.heightOfString(descripcion, { width: 230 });
            const rowHeight = Math.max(18, descHeight + 6);

            // VERIFICACIÓN CORREGIDA: Solo nueva página si no cabe la fila actual + espacio para el total
            if (yPosition + rowHeight + 30 > doc.page.height - 50) {
                doc.addPage();
                yPosition = 50;
                
                // Dibujar encabezado en nueva página
                dibujarEncabezadoTabla(yPosition);
                yPosition += 22;
                
                doc.fontSize(8).font('Helvetica');
            }

            // Fondo alternado sutil
            if (index % 2 === 0) {
                doc.rect(50, yPosition, 495, rowHeight)
                .fillAndStroke('#fafafa', '#000000')
                .lineWidth(0.5);
            } else {
                doc.rect(50, yPosition, 495, rowHeight)
                .stroke('#000000')
                .lineWidth(0.5);
            }

            doc.fillColor('#000000')
            .text(detalle.numitem, colX[0], yPosition + 4, { width: 30, align: 'center' })
            .text(detalle.producto_codigo || '', colX[1], yPosition + 4, { width: 65, align: 'left' })
            .text(descripcion, colX[2], yPosition + 4, { width: 230, align: 'left' })
            .text(detalle.unidad_medida_abrev || '', colX[3], yPosition + 4, { width: 60, align: 'center' })
            .text(Number(detalle.cantidad_solicitada || 0).toFixed(3), colX[4], yPosition + 4, { width: 40, align: 'right' })
            .text(Number(detalle.stock_actual || 0).toFixed(3), colX[5], yPosition + 4, { width: 40, align: 'right' });

            yPosition += rowHeight;
        });

        // --- TOTAL ---
        // Verificar si hay espacio para el total en la página actual
        if (yPosition + 30 > doc.page.height - 50) {
            doc.addPage();
            yPosition = 50;
        }

        yPosition += 5;

        doc.rect(400, yPosition, 145, 20)
        .fillAndStroke('#f0f0f0', '#000000')
        .lineWidth(0.5);

        doc.fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('TOTAL SOLICITADO:', 405, yPosition + 6)
        .text(Number(requerimiento.total_cantidad_solicitada || 0).toFixed(3), 485, yPosition + 6, { width: 55, align: 'right' });

        // --- PIE DE PÁGINA ---
        /*const totalPages = doc.bufferedPageRange().count;
        
        for (let i = 0; i < totalPages; i++) {
            doc.switchToPage(i);
            
            doc.fontSize(7)
            .font('Helvetica')
            .fillColor('#666666')
            .text(
                `Página ${i + 1} de ${totalPages} | Generado: ${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE')}`,
                50,
                doc.page.height - 30,
                { align: 'center', width: 495 }
            );
        }*/

        doc.end();
    } catch (error) {
        console.error('Error al generar PDF:', error);
        res.status(500).json({ error: 'Error interno al generar PDF', details: error.message });
    }
},

    // Obtener datos para crear orden desde requerimiento ACTUALIZADO
    getDatosOrdenDesdeRequerimiento: async (req, res) => {
        try {
            const { id } = req.params;
            
            // Obtener el requerimiento completo con detalles
            const requerimientoQuery = `
                SELECT 
                    rc.*,
                    u.nombre_completo as solicitante_nombre,
                    a.nombre as solicitante_area,
                    d.codigo as documento_codigo,
                    cc.nombre as codigo_compras_nombre
                FROM compras.requerimientos_compra rc
                LEFT JOIN public.usuarios u ON rc.solicitante_id = u.id
                LEFT JOIN public.area a ON u.area_id = a.id
                LEFT JOIN public.documentos d ON rc.id_documento = d.id_documento
                LEFT JOIN public.cod_compras cc ON rc.id_cod_compras = cc.id_cod_compras
                WHERE rc.id = $1 AND rc.estado = 'APROBADO'
            `;
            
            const detallesQuery = `
                SELECT 
                    rd.*, 
                    p.descripcion as producto_descripcion,
                    p.codigo_barras,
                    um.nombre as unidad_medida,
                    um.siglas as unidad_medida_abrev,
                    cco.nombre as centro_costo_nombre
                FROM compras.requerimientos_compra_detalle rd
                LEFT JOIN almacen.productos p ON rd.producto_codigo = p.codigo
                LEFT JOIN public.unidades_medida um ON p.id_unidad = um.id_unidades
                LEFT JOIN compras.requerimientos_compra r ON rd.requerimiento_id = r.id
                LEFT JOIN contabilidad.c_costo cco ON r.centro_costo_id = cco.id_c_costo
                WHERE rd.requerimiento_id = $1
                ORDER BY rd.numitem
            `;
            
            const [requerimientoResult, detallesResult] = await Promise.all([
                db.query(requerimientoQuery, [id]),
                db.query(detallesQuery, [id])
            ]);
            
            if (requerimientoResult.rows.length === 0) {
                return res.status(404).json({ 
                    error: 'Requerimiento no encontrado o no está aprobado' 
                });
            }
            
            const requerimiento = requerimientoResult.rows[0];
            const detalles = detallesResult.rows;
            
            // Obtener datos adicionales para el formulario de orden
            const [
                proveedoresRes,
                formasPagoRes,
                monedasRes,
                documentosRes,
                aduanasRes,
                incotermsRes,
                transportesRes
            ] = await Promise.all([
                db.query('SELECT id_prov as id, codigo, nro_documento, razon_social FROM compras.proveedores WHERE estado = true ORDER BY razon_social'),
                db.query('SELECT id, codigo, nombre FROM contabilidad.formas_pago WHERE estado = true ORDER BY nombre'),
                db.query('SELECT id_moneda as id, codigo, nombre, simbolo FROM contabilidad.cod_moneda ORDER BY nombre'),
                db.query(`SELECT id_documento as id, codigo, nombre FROM public.documentos 
                        WHERE tipo_movimiento = 'INGRESO' AND estado = true ORDER BY nombre`),
                db.query('SELECT id_aduana as id, codigo, nombre FROM public.cod_aduana WHERE estado = true ORDER BY nombre'),
                db.query('SELECT id, codigo, nombre FROM public.incoterms ORDER BY nombre'),
                db.query('SELECT id, nombre FROM public.medios_transporte ORDER BY nombre')
            ]);
            
            res.status(200).json({
                requerimiento: {
                    ...requerimiento,
                    detalles: detalles
                },
                proveedores: proveedoresRes.rows,
                formasPago: formasPagoRes.rows,
                monedas: monedasRes.rows,
                documentos: documentosRes.rows,
                aduanas: aduanasRes.rows,
                incoterms: incotermsRes.rows,
                mediosTransporte: transportesRes.rows
            });
            
        } catch (error) {
            console.error('Error al obtener datos para orden:', error);
            res.status(500).json({ 
                error: 'Error interno del servidor al obtener datos para orden de compra',
                details: error.message 
            });
        }
    },

    // Obtener todas las órdenes de compra - ACTUALIZADO
    getAllOrdenesCompra: async (req, res) => {
        try {
            const { estado, numero, fecha_inicio, fecha_fin, proveedor } = req.query;
            
            let query = `
            SELECT 
                oc.*,
                p.razon_social as proveedor_nombre,
                p.nro_documento as proveedor_documento,
                fp.nombre as forma_pago_desc,
                m.nombre as moneda_nombre,
                m.simbolo as moneda_simbolo,
                d.codigo as documento_codigo,
                u.nombre_completo as creador_nombre,
                -- Concatenar todos los requerimientos vinculados
                STRING_AGG(r.numero, ', ') as requerimientos_numeros,
                STRING_AGG(r.id::text, ', ') as requerimientos_ids
            FROM compras.orden_compra oc
            LEFT JOIN compras.proveedores p ON oc.proveedor_id = p.id_prov
            LEFT JOIN contabilidad.formas_pago fp ON oc.forma_pago = fp.id
            LEFT JOIN contabilidad.cod_moneda m ON oc.moneda_id = m.id_moneda
            LEFT JOIN public.documentos d ON oc.id_documento = d.id_documento
            LEFT JOIN public.usuarios u ON oc.created_by = u.id
            LEFT JOIN compras.orden_compra_requerimientos ocr ON oc.id = ocr.orden_compra_id
            LEFT JOIN compras.requerimientos_compra r ON ocr.requerimiento_id = r.id
            WHERE 1=1
            `;
            
            const params = [];
            let paramCount = 0;

            if (estado) {
            paramCount++;
            query += ` AND oc.estado = $${paramCount}`;
            params.push(estado);
            }

            if (numero) {
            paramCount++;
            query += ` AND oc.numero ILIKE $${paramCount}`;
            params.push(`%${numero}%`);
            }

            if (fecha_inicio) {
            paramCount++;
            query += ` AND oc.fecha >= $${paramCount}`;
            params.push(fecha_inicio);
            }

            if (fecha_fin) {
            paramCount++;
            query += ` AND oc.fecha <= $${paramCount}`;
            params.push(fecha_fin);
            }

            if (proveedor) {
            paramCount++;
            query += ` AND (p.razon_social ILIKE $${paramCount} OR p.nro_documento ILIKE $${paramCount})`;
            params.push(`%${proveedor}%`);
            }

            query += `
            GROUP BY oc.id, p.razon_social, p.nro_documento, fp.nombre, m.nombre, m.simbolo, d.codigo, u.nombre_completo
            ORDER BY oc.fecha DESC, oc.numero DESC
            `;

            const { rows } = await db.query(query, params);
            
            res.status(200).json(rows);
        } catch (error) {
            console.error('Error al obtener órdenes de compra:', error);
            res.status(500).json({ 
            error: 'Error interno del servidor al obtener órdenes de compra',
            details: error.message 
            });
        }
    },

    // Obtener detalles de una orden de compra - ACTUALIZADO
    getOrdenCompraDetalles: async (req, res) => {
        try {
            const { id } = req.params;
            
            // Query principal para la cabecera
            const ordenQuery = `
            SELECT 
                oc.*,
                p.razon_social AS proveedor_nombre,
                p.nomb_comercial AS proveedor_nombre_comercial,
                p.direccion AS proveedor_direccion,
                p.nro_documento AS proveedor_num_doc,
                fp.nombre AS forma_pago_desc,
                m.nombre AS moneda_nombre,
                m.simbolo AS moneda_simbolo,
                d.codigo AS documento_codigo,
                u.nombre_completo AS creador_nombre,
                adu.nombre AS aduana_nombre,
                inc.nombre AS incoterm_nombre,
                mt.nombre AS medio_transporte_nombre,
                pp.direccion AS lugar_entrega_direccion,
                pp.id_partida AS lugar_entrega_id,
                -- Concatenar todos los requerimientos asociados
                STRING_AGG(r.numero, ', ') FILTER (WHERE r.numero IS NOT NULL) AS requerimientos_numeros,
                STRING_AGG(r.id::text, ', ') FILTER (WHERE r.id IS NOT NULL) AS requerimientos_ids
            FROM compras.orden_compra oc
            LEFT JOIN compras.proveedores p ON oc.proveedor_id = p.id_prov
            LEFT JOIN contabilidad.formas_pago fp ON oc.forma_pago = fp.id
            LEFT JOIN contabilidad.cod_moneda m ON oc.moneda_id = m.id_moneda
            LEFT JOIN public.documentos d ON oc.id_documento = d.id_documento
            LEFT JOIN public.usuarios u ON oc.created_by = u.id
            LEFT JOiN ventas.puntos_partida pp ON oc.lugar_entrega = pp.id_partida
            LEFT JOIN public.cod_aduana adu ON oc.aduana_id = adu.id_aduana
            LEFT JOIN public.incoterms inc ON oc.incoterm_id = inc.id
            LEFT JOIN public.medios_transporte mt ON oc.medio_transporte_id = mt.id
            LEFT JOIN compras.orden_compra_requerimientos ocr ON oc.id = ocr.orden_compra_id
            LEFT JOIN compras.requerimientos_compra r ON ocr.requerimiento_id = r.id
            WHERE oc.id = $1
            GROUP BY 
                oc.id, 
                p.razon_social, 
                p.nomb_comercial, 
                p.direccion, 
                p.nro_documento,
                fp.nombre, 
                m.nombre, 
                m.simbolo, 
                d.codigo, 
                u.nombre_completo,
                adu.nombre, 
                inc.nombre, 
                mt.nombre,
                pp.direccion,
                pp.id_partida
            `;
            
            // Query para los detalles
            const detallesQuery = `
            SELECT 
                ocd.*, 
                r.id as requerimiento_id,
                r.numero as requerimiento_numero,
                d.codigo as requerimiento_codigo,
                p.descripcion as producto_descripcion,
                p.codigo_barras,
                um.nombre as unidad_medida,
                um.siglas as unidad_medida_abrev,
                cc.nombre as centro_costo_nombre
            FROM compras.orden_compra_detalle ocd
            LEFT JOIN almacen.productos p ON ocd.producto_codigo = p.codigo
            LEFT JOIN public.unidades_medida um ON p.id_unidad = um.id_unidades
            LEFT JOIN contabilidad.c_costo cc ON ocd.centro_costo_id = cc.id_c_costo
            LEFT JOIN compras.requerimientos_compra r ON ocd.requerimiento_id = r.id
            LEFT JOIN public.documentos d ON r.id_documento = d.id_documento
            WHERE ocd.orden_compra_id = $1
            ORDER BY ocd.numitem
            `;
            
            const [ordenResult, detallesResult] = await Promise.all([
            db.query(ordenQuery, [id]),
            db.query(detallesQuery, [id])
            ]);
            
            if (ordenResult.rows.length === 0) {
            return res.status(404).json({ error: 'Orden de compra no encontrada' });
            }
            
            const orden = ordenResult.rows[0];
            const detalles = detallesResult.rows;
            
            res.status(200).json({
            ...orden,
            detalles
            });
            
        } catch (error) {
            console.error('Error al obtener orden de compra:', error);
            res.status(500).json({ error: 'Error interno del servidor al obtener orden de compra' });
        }
    },

    // Nueva función para obtener el siguiente número de orden por documento
    getNextOrdenNumber: async (req, res) => {
        try {
            const { documento_id } = req.query;

            if (!documento_id) {
                return res.status(400).json({ error: 'El ID del documento es requerido' });
            }

            // Obtener el último número para este documento
            const lastNumberQuery = `
                SELECT numero 
                FROM compras.orden_compra 
                WHERE id_documento = $1 
                ORDER BY id DESC 
                LIMIT 1
            `;
            const { rows } = await db.query(lastNumberQuery, [documento_id]);

            let nextNumber = "000000001"; // Valor inicial de 9 dígitos
            if (rows.length > 0) {
                const lastNumber = rows[0].numero;
                // Extraer solo la parte numérica
                const numericPart = parseInt(lastNumber, 10);
                if (!isNaN(numericPart)) {
                    const incremented = numericPart + 1;
                    nextNumber = incremented.toString().padStart(9, '0');
                }
            }

            res.status(200).json({ 
                nextNumber
            });
        } catch (error) {
            console.error('Error al obtener siguiente número de orden:', error);
            res.status(500).json({
                error: 'Error interno al obtener siguiente número de orden',
                details: error.message
            });
        }
    },

    // Modificar la función createOrdenCompra para usar el nuevo sistema de numeración
    createOrdenCompra: async (req, res) => {
        try {
            const {
            id_documento,
            fecha,
            fecha_entrega_prevista,
            tipo,
            proveedor_id,
            moneda_id,
            tipo_cambio,
            forma_pago,
            plazo_entrega,
            lugar_entrega,
            direccion,
            aduana_id,
            incoterm_id,
            medio_transporte_id,
            observaciones,
            igv_id,
            items
            } = req.body;

            if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Debe agregar al menos un item' });
            }

            if (!id_documento) {
            return res.status(400).json({ error: 'El documento es requerido' });
            }

            if (!proveedor_id) {
            return res.status(400).json({ error: 'El proveedor es requerido' });
            }

            await db.query('BEGIN');

            // Obtener IGV según el tipo
            let igvPorcentaje = 0;
            if (tipo === 'LOCAL' && igv_id) {
            const igvRes = await db.query(
                'SELECT porcentaje FROM public.igv WHERE id = $1',
                [igv_id]
            );
            igvPorcentaje = igvRes.rows[0]?.porcentaje || 0;
            }

            // Obtener número correlativo
            const nextNumberRes = await db.query(`
            SELECT numero 
            FROM compras.orden_compra 
            WHERE id_documento = $1 
            ORDER BY id DESC 
            LIMIT 1
            `, [id_documento]);

            let nextNumber = "000000001";
            if (nextNumberRes.rows.length > 0) {
            const lastNumber = nextNumberRes.rows[0].numero;
            const numericPart = parseInt(lastNumber, 10);
            if (!isNaN(numericPart)) {
                const incremented = numericPart + 1;
                nextNumber = incremented.toString().padStart(9, '0');
            }
            }

            // Calcular totales
            let sub_total = 0;
            let igv_total = 0;
            items.forEach(item => {
            const precio = parseFloat(item.precio_unitario) || 0;
            const cantidad = parseFloat(item.cantidad_solicitada) || 0;
            const descuento = parseFloat(item.descuento_porcentaje) || 0;

            const valorVenta = (precio * cantidad) * (1 - (descuento / 100));
            const igv = tipo === 'LOCAL'
                ? valorVenta * (igvPorcentaje / 100)
                : 0;

            sub_total += valorVenta;
            igv_total += igv;
            });

            const total = tipo === 'LOCAL'
            ? sub_total + igv_total
            : sub_total;

            // Insertar cabecera
            const ordenQuery = `
            INSERT INTO compras.orden_compra (
                id_documento, numero, fecha, fecha_entrega_prevista, tipo,
                proveedor_id, moneda_id, tipo_cambio,
                forma_pago, plazo_entrega, lugar_entrega, direccion, aduana_id,
                incoterm_id, medio_transporte_id, observaciones,
                igv_id, sub_total, igv, total, created_by
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
            RETURNING *
            `;

            const ordenValues = [
            id_documento,
            nextNumber,
            fecha,
            fecha_entrega_prevista,
            tipo,
            proveedor_id,
            moneda_id,
            tipo_cambio || 1.0,
            forma_pago,
            plazo_entrega || null,
            lugar_entrega || null,
            direccion || null,
            tipo === 'LOCAL' ? null : aduana_id,
            tipo === 'LOCAL' ? null : incoterm_id,
            tipo === 'LOCAL' ? null : medio_transporte_id,
            observaciones || null,
            tipo === 'LOCAL' ? igv_id : null,
            sub_total,
            igv_total,
            total,
            req.userId
            ];

            const { rows: ordenRows } = await db.query(ordenQuery, ordenValues);
            const ordenId = ordenRows[0].id;

            // Insertar detalles
            for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const precio = parseFloat(item.precio_unitario) || 0;
            const cantidad = parseFloat(item.cantidad_solicitada) || 0;
            const descuento = parseFloat(item.descuento_porcentaje) || 0;

            const valorVenta = (precio * cantidad) * (1 - (descuento / 100));
            const igv = (tipo === 'LOCAL')
                ? valorVenta * (igvPorcentaje / 100)
                : 0;
            const precioTotal = valorVenta + igv;
            const descuentoMonto = (precio * cantidad * (descuento || 0) / 100);

            const itemQuery = `
                INSERT INTO compras.orden_compra_detalle (
                orden_compra_id, numitem, producto_codigo, cantidad_solicitada,
                precio_unitario, descuento_porcentaje, descuento_monto, valor_venta,
                igv, precio_total, linea_cerrada, centro_costo_id, comentario,
                requerimiento_id, requerimiento_detalle_id
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
            `;

            const itemValues = [
                ordenId,
                i + 1,
                item.producto_codigo,
                item.cantidad_solicitada,
                item.precio_unitario,
                item.descuento_porcentaje || 0,
                descuentoMonto,
                valorVenta,
                igv,
                precioTotal,
                false,
                item.centro_costo_id,
                item.comentario || null,
                item.requerimiento_id || null,
                item.requerimiento_detalle_id || null
            ];

            await db.query(itemQuery, itemValues);
            }

            // Requerimientos únicos de la orden
            const requerimientosUnicos = [...new Set(items.map(it => it.requerimiento_id).filter(Boolean))];

            // Insertar relación orden <-> requerimientos
            for (const reqId of requerimientosUnicos) {
            await db.query(`
                INSERT INTO compras.orden_compra_requerimientos (orden_compra_id, requerimiento_id)
                VALUES ($1, $2)
                ON CONFLICT DO NOTHING
            `, [ordenId, reqId]);
            }

            // Actualizar estados de requerimientos
            for (const reqId of requerimientosUnicos) {
            const { rows: pendientes } = await db.query(`
                SELECT COUNT(*) AS faltantes
                FROM compras.requerimientos_compra_detalle rd
                WHERE rd.requerimiento_id = $1
                AND rd.id NOT IN (
                    SELECT ocd.requerimiento_detalle_id
                    FROM compras.orden_compra_detalle ocd
                    WHERE ocd.requerimiento_id = $1
                )
            `, [reqId]);

            if (parseInt(pendientes[0].faltantes, 10) === 0) {
                await db.query(`
                UPDATE compras.requerimientos_compra
                SET estado = 'PROCESADO',
                    updated_by = $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                `, [req.userId, reqId]);
            }
            }

            await db.query('COMMIT');

            res.status(201).json({
            message: 'Orden de compra creada exitosamente',
            orden: ordenRows[0]
            });

        } catch (error) {
            await db.query('ROLLBACK');
            console.error('Error al crear orden de compra:', error);

            if (error.code === '23505') {
            return res.status(400).json({ error: 'El número de orden ya existe para este documento' });
            }

            res.status(500).json({
            error: 'Error interno del servidor al crear orden de compra',
            details: error.message
            });
        }
    },


    // Actualizar orden de compra - ACTUALIZADO
    updateOrdenCompra: async (req, res) => {
        try {
            const { id } = req.params;
            const {
            id_documento,
            numero,
            fecha,
            fecha_entrega_prevista,
            tipo,
            proveedor_id,
            moneda_id,
            tipo_cambio,
            forma_pago,
            plazo_entrega,
            lugar_entrega,
            direccion,
            aduana_id,
            incoterm_id,
            medio_transporte_id,
            observaciones,
            estado,
            igv_id,
            items
            } = req.body;

            // Verificar si la orden existe
            const checkQuery = 'SELECT id FROM compras.orden_compra WHERE id = $1';
            const { rows } = await db.query(checkQuery, [id]);

            if (rows.length === 0) {
            return res.status(404).json({ error: 'Orden de compra no encontrada' });
            }

            // Obtener porcentaje IGV si es LOCAL
            let igvPorcentaje = 0;
            if (tipo === 'LOCAL' && igv_id) {
            const igvQuery = 'SELECT porcentaje FROM public.igv WHERE id = $1';
            const igvRes = await db.query(igvQuery, [igv_id]);
            igvPorcentaje = igvRes.rows.length > 0 ? parseFloat(igvRes.rows[0].porcentaje) : 0;
            }

            await db.query('BEGIN');

            let sub_total = 0;
            let igv_total = null; // Por defecto null
            let total = 0;

            items.forEach(item => {
            const valorVenta =
                (item.precio_unitario * item.cantidad_solicitada) *
                (1 - (item.descuento_porcentaje / 100));

            sub_total += valorVenta;
            });

            if (tipo === 'LOCAL') {
            igv_total = sub_total * (igvPorcentaje / 100);
            total = sub_total + igv_total;
            } else {
            igv_total = null; // EXTERNO
            total = sub_total;
            }

            const updateQuery = `
            UPDATE compras.orden_compra SET
                id_documento = $1,
                numero = $2,
                fecha = $3,
                fecha_entrega_prevista = $4,
                tipo = $5,
                proveedor_id = $6,
                moneda_id = $7,
                tipo_cambio = $8,
                forma_pago = $9,
                plazo_entrega = $10,
                lugar_entrega = $11,
                direccion = $12,
                aduana_id = $13,
                incoterm_id = $14,
                medio_transporte_id = $15,
                observaciones = $16,
                estado = $17,
                igv_id = $18,
                sub_total = $19,
                igv = $20,
                total = $21,
                updated_by = $22,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $23
            RETURNING *;
            `;

            const updateValues = [
            id_documento,
            numero,
            fecha,
            fecha_entrega_prevista,
            tipo,
            proveedor_id,
            moneda_id,
            tipo_cambio || 1.0,
            forma_pago,
            plazo_entrega || null,
            lugar_entrega || null,
            direccion || null,
            aduana_id || null,
            incoterm_id || null,
            medio_transporte_id || null,
            observaciones || null,
            estado,
            igv_id || null,
            sub_total,
            igv_total,
            total,
            req.userId,
            id
            ];

            const { rows: updatedRows } = await db.query(updateQuery, updateValues);

            await db.query('DELETE FROM compras.orden_compra_detalle WHERE orden_compra_id = $1', [id]);

            for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const valorVenta =
                (item.precio_unitario * item.cantidad_solicitada) *
                (1 - (item.descuento_porcentaje / 100));
                
            const descuentoMonto =
                (item.precio_unitario * item.cantidad_solicitada *
                (item.descuento_porcentaje || 0) / 100);

            let igvDetalle = null;
            let precioTotal = valorVenta;

            if (tipo === 'LOCAL') {
                const igvMonto = valorVenta * (igvPorcentaje / 100);
                igvDetalle = igvMonto;
                precioTotal = valorVenta + igvMonto;
            } else {
                igvDetalle = null; // EXTERNO
                precioTotal = valorVenta;
            }

            const itemQuery = `
                INSERT INTO compras.orden_compra_detalle (
                orden_compra_id, numitem, producto_codigo, cantidad_solicitada,
                precio_unitario, descuento_porcentaje, descuento_monto, valor_venta,
                igv, precio_total, linea_cerrada, centro_costo_id, comentario,
                requerimiento_id, requerimiento_detalle_id
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
            `;

            const itemValues = [
                id,
                i + 1,
                item.producto_codigo,
                item.cantidad_solicitada,
                item.precio_unitario,
                item.descuento_porcentaje || 0,
                descuentoMonto,
                valorVenta,
                igvDetalle,
                precioTotal,
                item.linea_cerrada === true,
                item.centro_costo_id,
                item.comentario || null,
                item.requerimiento_id || null,
                item.requerimiento_detalle_id || null
            ];

            await db.query(itemQuery, itemValues);
            }

            await db.query('COMMIT');

            res.status(200).json({
            message: 'Orden de compra actualizada exitosamente',
            orden: updatedRows[0]
            });

        } catch (error) {
            await db.query('ROLLBACK');
            console.error('Error al actualizar orden de compra:', error);

            if (error.code === '23505') {
            return res.status(400).json({ error: 'El número de orden ya existe' });
            }

            res.status(500).json({
            error: 'Error interno del servidor al actualizar orden de compra',
            details: error.message
            });
        }
    },

    // Actualizar estado de orden de compra 
    updateEstadoOrdenCompra: async (req, res) => {
        try {
            const { id } = req.params;
            const { estado } = req.body;

            // Si no llega un usuario válido, lo dejamos como NULL
            const userId = req.userId || null;

            const query = `
            UPDATE compras.orden_compra 
            SET estado = $1,
                updated_by = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *`;

            const { rows } = await db.query(query, [estado, userId, id]);

            if (rows.length === 0) {
            return res.status(404).json({ error: 'Orden de compra no encontrada' });
            }

            res.status(200).json({
            message: 'Estado de la orden de compra actualizado exitosamente',
            orden: rows[0]
            });
        } catch (error) {
            console.error('Error al actualizar estado de orden de compra:', error);
            res.status(500).json({ 
            error: 'Error interno del servidor al actualizar estado de orden de compra',
            details: error.message
            });
        }
    },

    // Obtener datos para formulario de orden de compra ACTUALIZADO
    getDatosFormularioOrden: async (req, res) => {
        try {
            const [
                proveedoresRes,
                formasPagoRes,
                monedasRes,
                aduanasRes,
                incotermsRes,
                mediosTransporteRes,
                requerimientosRes,
                documentosRes,
                tiposIgvRes,
                puntosPartidaRes 
            ] = await Promise.all([
                db.query('SELECT id_prov as id, codigo, nro_documento, razon_social, direccion FROM compras.proveedores WHERE estado = true ORDER BY razon_social'),
                db.query('SELECT id, codigo, nombre FROM contabilidad.formas_pago WHERE estado = true ORDER BY nombre'),
                db.query('SELECT id_moneda as id, codigo, nombre, simbolo FROM contabilidad.cod_moneda ORDER BY nombre'),
                db.query('SELECT id_aduana as id, codigo, nombre FROM public.cod_aduana WHERE estado = true ORDER BY nombre'),
                db.query('SELECT id, codigo, nombre FROM public.incoterms ORDER BY codigo'),
                db.query('SELECT id, nombre FROM public.medios_transporte ORDER BY nombre'),
                db.query(`
                    SELECT r.id, r.numero, r.fecha, r.tipo, r.estado, d.codigo AS documento_codigo 
                    FROM compras.requerimientos_compra r
                    JOIN public.documentos d ON r.id_documento = d.id_documento
                    WHERE r.estado = $1
                    ORDER BY r.fecha DESC
                `, ['APROBADO']),
                db.query(`
                    SELECT id_documento as id, codigo, nombre FROM public.documentos 
                    WHERE (codigo = 'OCO' OR codigo IN ('IP1', 'IP2', 'IP3', 'IP4', 'IP5', 'IP6'))
                    AND estado = true 
                    ORDER BY codigo
                `),
                db.query('SELECT id, porcentaje, descripcion FROM public.igv ORDER BY porcentaje DESC'),
                db.query('SELECT id_partida AS id, direccion FROM ventas.puntos_partida ORDER BY direccion')
            ]);

            res.status(200).json({
                proveedores: proveedoresRes.rows,
                formasPago: formasPagoRes.rows,
                monedas: monedasRes.rows,
                aduanas: aduanasRes.rows,
                incoterms: incotermsRes.rows,
                mediosTransporte: mediosTransporteRes.rows,
                requerimientos: requerimientosRes.rows,
                documentos: documentosRes.rows,
                tiposIgv: tiposIgvRes.rows,
                puntosPartida: puntosPartidaRes.rows  
            });
        } catch (error) {
            console.error('Error al obtener datos del formulario:', error);
            res.status(500).json({ 
                error: 'Error interno del servidor al obtener datos del formulario',
                details: error.message 
            });
        }
    },

    generarOrdenCompraPDF: async (req, res) => {
    try {
        const { id } = req.params;

        // 1. CONSULTA ORDEN DE COMPRA
        const ordenQuery = `
            SELECT 
                oc.id, oc.numero, oc.fecha, oc.fecha_entrega_prevista,
                oc.tipo, oc.sub_total, oc.igv, oc.total, oc.estado,
                oc.observaciones,
                p.razon_social AS proveedor_nombre,
                p.nro_documento AS proveedor_doc,
                m.nombre AS moneda_nombre,
                m.simbolo AS moneda_simbolo,
                f.nombre AS forma_pago_desc,
                d.codigo AS documento_codigo,  
                d.siglas AS documento_siglas  
            FROM compras.orden_compra oc
            JOIN compras.proveedores p ON oc.proveedor_id = p.id_prov
            JOIN contabilidad.cod_moneda m ON oc.moneda_id = m.id_moneda
            JOIN contabilidad.formas_pago f ON oc.forma_pago = f.id
            JOIN public.documentos d ON oc.id_documento = d.id_documento 
            WHERE oc.id = $1
        `;
        const { rows: ordenRows } = await db.query(ordenQuery, [id]);
        if (ordenRows.length === 0)
            return res.status(404).json({ error: 'Orden no encontrada' });

        const orden = ordenRows[0];
        const mostrarIGV = orden.tipo.toUpperCase() !== 'EXTERNO';

        // 2. CONSULTA DETALLES
        const detallesQuery = `
            SELECT 
                d.numitem,
                d.producto_codigo,
                pr.descripcion AS producto_descripcion,
                d.cantidad_solicitada,
                d.precio_unitario,
                d.descuento_porcentaje,
                d.valor_venta,
                d.igv,
                d.precio_total
            FROM compras.orden_compra_detalle d
            JOIN almacen.productos pr ON d.producto_codigo = pr.codigo
            WHERE d.orden_compra_id = $1
            ORDER BY d.numitem
        `;
        const { rows: detalles } = await db.query(detallesQuery, [id]);

        // 3. CALCULAR DESCUENTO TOTAL
        const descuentoTotal = detalles.reduce((total, item) => {
            const precioSinDescuento =
                parseFloat(item.precio_unitario || 0) * parseFloat(item.cantidad_solicitada || 0);
            const valorVenta = parseFloat(item.valor_venta || 0);
            return total + (precioSinDescuento - valorVenta);
        }, 0);

        // 4. CREAR PDF
        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        doc.pipe(res);

        // === ENCABEZADO ===
        let yPosition1 = 50;
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000').text('RADIADORES FORTALEZA S.A.C.', 50, yPosition1);
        doc.fontSize(9).font('Helvetica')
            .text('RUC: 20101636411', 50, yPosition1 + 12)
            .text('Av. Separadora Industrial Nro. 1555', 50, yPosition1 + 24)
            .text('Ate - Lima - Perú', 50, yPosition1 + 36);

        doc.rect(390, yPosition1 - 5, 155, 60).lineWidth(1).stroke('#000000');

        doc.fontSize(13).font('Helvetica-Bold').text('ORDEN DE COMPRA', 395, yPosition1 + 2, {
            width: 145,
            align: 'center'
        });

        const codigoDoc = orden.documento_codigo?.trim() || 'DOC';
        doc.fontSize(10).font('Helvetica').text(`${codigoDoc} N° ${orden.numero}`, 395, yPosition1 + 25, {
            width: 145,
            align: 'center'
        });

        doc.fontSize(9).text(`Fecha: ${new Date(orden.fecha).toLocaleDateString('es-PE')}`, 395, yPosition1 + 40, {
            width: 145,
            align: 'center'
        });

        let yPositionAfterHeader = yPosition1 + 80;
        doc.moveTo(50, yPositionAfterHeader).lineTo(545, yPositionAfterHeader).strokeColor('#000000').lineWidth(0.5).stroke();

        doc.y = yPositionAfterHeader + 15;

        // === INFORMACIÓN GENERAL ===
        const yStart = 140;
        doc.fontSize(11).font('Helvetica-Bold').text('Información General', 50, yStart);
        doc.moveDown(0.5);

        const info = [
            { label: 'N° Orden', value: orden.numero },
            { label: 'Fecha', value: new Date(orden.fecha).toLocaleDateString() },
            { label: 'Entrega', value: new Date(orden.fecha_entrega_prevista).toLocaleDateString() },
            { label: 'Tipo', value: orden.tipo },
            { label: 'Moneda', value: `${orden.moneda_nombre} (${orden.moneda_simbolo})` },
            { label: 'Forma de Pago', value: orden.forma_pago_desc },
            { label: 'Estado', value: orden.estado },
        ];

        const boxTop = doc.y;
        doc.rect(45, boxTop - 5, 520, info.length * 18 + 10).strokeColor('#999').stroke();
        info.forEach((item, i) => {
            doc.fontSize(10).font('Helvetica-Bold').text(item.label + ':', 55, boxTop + i * 18);
            doc.font('Helvetica').text(item.value, 150, boxTop + i * 18);
        });

        doc.moveDown(2);

        // === PROVEEDOR ===
        doc.fontSize(11).font('Helvetica-Bold').text('Proveedor', 50, doc.y);
        doc.moveDown(0.5);

        const proveedorBoxTop = doc.y;
        doc.rect(45, proveedorBoxTop - 5, 520, 55).strokeColor('#999').stroke();

        doc.fontSize(10).font('Helvetica-Bold').text('Razón Social:', 55, proveedorBoxTop);
        doc.font('Helvetica').text(orden.proveedor_nombre, 150, proveedorBoxTop);

        doc.font('Helvetica-Bold').text('Documento:', 55, proveedorBoxTop + 18);
        doc.font('Helvetica').text(orden.proveedor_doc, 150, proveedorBoxTop + 18);

        doc.font('Helvetica-Bold').text('Forma de Pago:', 55, proveedorBoxTop + 36);
        doc.font('Helvetica').text(orden.forma_pago_desc, 150, proveedorBoxTop + 36);
        doc.moveDown(2);

        // === DETALLES DE PRODUCTOS ===
        doc.fontSize(11).font('Helvetica-Bold').text('Detalles de Productos', 50);
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const headers = mostrarIGV
            ? ['Ítem', 'Código', 'Descripción', 'Cant.', 'P.Unit', 'Desc.%', 'V.Venta', 'IGV', 'Total']
            : ['Ítem', 'Código', 'Descripción', 'Cant.', 'P.Unit', 'Desc.%', 'V.Venta', 'Total'];

        const colWidths = mostrarIGV
            ? [30, 50, 180, 40, 55, 45, 55, 45, 55]
            : [30, 50, 200, 40, 55, 50, 60, 60];

        doc.rect(45, tableTop - 3, 520, 18).fill('#f0f0f0');
        let x = 50;
        headers.forEach((h, i) => {
            doc.fillColor('#000').font('Helvetica-Bold').fontSize(8)
                .text(h, x, tableTop, { width: colWidths[i], align: 'center' });
            x += colWidths[i];
        });

        let yPosition = tableTop + 20;

        detalles.forEach((item) => {
            const cantidad = parseFloat(item.cantidad_solicitada || 0).toFixed(2);
            const pUnit = parseFloat(item.precio_unitario || 0).toFixed(2);
            const desc = parseFloat(item.descuento_porcentaje || 0).toFixed(2);
            const vVenta = parseFloat(item.valor_venta || 0).toFixed(2);
            const igv = parseFloat(item.igv || 0).toFixed(2);
            const total = parseFloat(item.precio_total || 0).toFixed(2);

            const fila = mostrarIGV
                ? [item.numitem, item.producto_codigo, item.producto_descripcion, cantidad, `S/ ${pUnit}`, `${desc}%`, `S/ ${vVenta}`, `S/ ${igv}`, `S/ ${total}`]
                : [item.numitem, item.producto_codigo, item.producto_descripcion, cantidad, `S/ ${pUnit}`, `${desc}%`, `S/ ${vVenta}`, `S/ ${total}`];

            if (yPosition > 700) {
                doc.addPage();
                yPosition = 50;
            }

            let xPos = 50;
            fila.forEach((val, i) => {
                doc.font('Helvetica').fontSize(8)
                    .text(val, xPos, yPosition, { width: colWidths[i], align: i >= 3 ? 'right' : 'left' });
                xPos += colWidths[i];
            });

            doc.moveTo(45, yPosition + 12).lineTo(565, yPosition + 12).strokeColor('#eee').stroke();
            yPosition += 15;
        });

        doc.y = yPosition + 10;
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

        // === TOTALES ===
        const totalY = doc.y + 15;
        doc.fontSize(10);
        doc.text('Descuento Total:', 350, totalY);
        doc.text(`S/ ${descuentoTotal.toFixed(2)}`, 480, totalY, { align: 'right' });

        doc.text('Subtotal:', 350, totalY + 15);
        doc.text(`S/ ${parseFloat(orden.sub_total || 0).toFixed(2)}`, 480, totalY + 15, { align: 'right' });

        if (mostrarIGV) {
            doc.text('IGV:', 350, totalY + 30);
            doc.text(`S/ ${parseFloat(orden.igv || 0).toFixed(2)}`, 480, totalY + 30, { align: 'right' });

            doc.font('Helvetica-Bold').fontSize(11)
                .text('TOTAL:', 350, totalY + 50)
                .text(`S/ ${parseFloat(orden.total || 0).toFixed(2)}`, 480, totalY + 50, { align: 'right' });
        } else {
            doc.font('Helvetica-Bold').fontSize(11)
                .text('TOTAL:', 350, totalY + 30)
                .text(`S/ ${parseFloat(orden.total || 0).toFixed(2)}`, 480, totalY + 30, { align: 'right' });
        }

        // === OBSERVACIONES ===
        if (orden.observaciones) {
            doc.moveDown(2);
            const obsTop = doc.y;
            doc.fontSize(10).font('Helvetica-Bold').text('Observaciones:', 50);
            doc.rect(45, obsTop + 10, 520, 60).strokeColor('#999').stroke();
            doc.font('Helvetica').text(orden.observaciones, 55, obsTop + 15, { width: 500 });
        }

        doc.end();

    } catch (error) {
        console.error('Error al generar PDF:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Error interno al generar el PDF' });
        }
    }
},

actualizarLineaCerrada: async (req, res) => {
  try {
    const { id } = req.params; // id del detalle
    const { linea_cerrada } = req.body;

    if (typeof linea_cerrada !== 'boolean') {
      return res.status(400).json({ error: "El valor debe ser booleano" });
    }

    // Actualizar campo
    await db.query(`
      UPDATE compras.orden_compra_detalle
      SET linea_cerrada = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [linea_cerrada, id]);

    // Verificar si todas las líneas están cerradas o totalmente recibidas
    const { rows } = await db.query(`
      SELECT 
        SUM(CASE WHEN cantidad_recibida < cantidad_solicitada AND linea_cerrada = FALSE THEN 1 ELSE 0 END) AS pendientes,
        orden_compra_id
      FROM compras.orden_compra_detalle
      WHERE orden_compra_id = (SELECT orden_compra_id FROM compras.orden_compra_detalle WHERE id = $1)
      GROUP BY orden_compra_id
    `, [id]);

    if (rows.length > 0 && Number(rows[0].pendientes) === 0) {
      // Si ya no hay pendientes, marcar la orden como ENTREGADA
      await db.query(`
        UPDATE compras.orden_compra
        SET estado = 'ENTREGADA', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [rows[0].orden_compra_id]);
    }

    res.json({ message: "Línea actualizada correctamente" });
  } catch (error) {
    console.error("Error al actualizar línea cerrada:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}


};

module.exports = comprasController;