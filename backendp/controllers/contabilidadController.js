const db = require('../config/db');

const contabilidadController = {
    // Función para obtener todos los bancos - CORREGIDO
    getAllBancos: async (req, res) => {
        try {
            // Consulta SQL para obtener todos los bancos ordenados por nombre
            const query = `
                SELECT id_bancos as id, nombre, codigo, siglas, estado 
                FROM public.bancos 
                WHERE estado = TRUE
                ORDER BY nombre ASC
            `;
            
            // Ejecutar la consulta
            const { rows } = await db.query(query);
            
            // Enviar respuesta con los bancos
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

    // Función para obtener un banco por ID - CORREGIDO
    getBancoById: async (req, res) => {
        try {
            const { id } = req.params;
            
            // Consulta SQL para obtener un banco específico
            const query = `
                SELECT id_bancos as id, nombre, codigo, siglas, estado 
                FROM public.bancos 
                WHERE id_bancos = $1
            `;
            
            // Ejecutar la consulta
            const { rows } = await db.query(query, [id]);
            
            // Verificar si se encontró el banco
            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Banco no encontrado'
                });
            }
            
            // Enviar respuesta con el banco encontrado
            res.status(200).json({
                success: true,
                data: rows[0]
            });
        } catch (error) {
            console.error('Error al obtener banco:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al obtener banco',
                error: error.message
            });
        }
    },

    // Función para obtener centros de costo - CORREGIDO
    getCentrosCosto: async (req, res) => {
        try {
            const { estado } = req.query;
            let query = `
                SELECT 
                    id_c_costo,
                    codigo, 
                    nombre, 
                    siglas, 
                    orden_fab, 
                    estado 
                FROM contabilidad.c_costo
            `;
            const params = [];

            if (estado === 'true') {
                query += ' WHERE estado = $1';
                params.push(true);
            }

            query += ' ORDER BY nombre ASC';

            const { rows } = await db.query(query, params);
            
            res.status(200).json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Error al obtener centros de costo:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al obtener centros de costo',
                error: error.message
            });
        }
    },

    // Función para crear un centro de costo - NUEVO
    createCentroCosto: async (req, res) => {
        try {
            const { codigo, nombre, orden_fab } = req.body;

            // Validaciones básicas
            if (!codigo || !nombre || !orden_fab) {
                return res.status(400).json({
                    success: false,
                    message: 'Código, nombre y orden de fabricación son requeridos'
                });
            }

            const query = `
                INSERT INTO contabilidad.c_costo (codigo, nombre, orden_fab, estado)
                VALUES ($1, $2, $3, TRUE)
                RETURNING *
            `;

            const { rows } = await db.query(query, [codigo, nombre, orden_fab]);
            
            res.status(201).json({
                success: true,
                message: 'Centro de costo creado exitosamente',
                data: rows[0]
            });
        } catch (error) {
            console.error('Error al crear centro de costo:', error);
            
            if (error.code === '23505') {
                return res.status(400).json({
                    success: false,
                    message: 'El código o nombre del centro de costo ya existe'
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al crear centro de costo',
                error: error.message
            });
        }
    },

    // Función para obtener todas las formas de pago - NUEVO
    getFormasPago: async (req, res) => {
        try {
            const { estado } = req.query;
            let query = `
                SELECT 
                    id, codigo, nombre, forma_pago, dias_gracia, nro_letra,
                    periodo, inv_compr_venta, porc_import, dias_vencimiento, estado
                FROM contabilidad.formas_pago
            `;
            const params = [];

            if (estado === 'true') {
                query += ' WHERE estado = $1';
                params.push(true);
            }

            query += ' ORDER BY nombre ASC';

            const { rows } = await db.query(query, params);
            
            res.status(200).json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Error al obtener formas de pago:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al obtener formas de pago',
                error: error.message
            });
        }
    },

    // Función para obtener todas las monedas - NUEVO
    getMonedas: async (req, res) => {
        try {
            const { estado } = req.query;
            let query = `
                SELECT 
                    id_moneda as id, codigo, nombre, simbolo, pais, estado
                FROM contabilidad.cod_moneda
            `;
            const params = [];

            if (estado === 'true') {
                query += ' WHERE estado = $1';
                params.push(true);
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

    //Función para obtener las cuentas bancarias de los proveedores
    getCuentasBancariasByProveedor: async (req, res) => {
            try {
                const { proveedorId } = req.params;
                
                const query = `
                    SELECT 
                        cb.*,
                        b.nombre as banco_nombre,
                        cm.codigo as moneda_codigo,
                        cm.nombre as moneda_nombre,
                        p.nombre as pais_nombre
                    FROM contabilidad.cuentas_bancarias_prov cb
                    LEFT JOIN public.bancos b ON cb.id_bancos = b.id_bancos
                    LEFT JOIN contabilidad.cod_moneda cm ON cb.id_moneda = cm.id_moneda
                    LEFT JOIN public.paises p ON cb.id_pais = p.id
                    WHERE cb.id_prov = $1 AND cb.estado = true
                    ORDER BY cb.id_cuenta
                `;
    
                const { rows } = await db.query(query, [proveedorId]);
                
                res.json(rows);
            } catch (error) {
                console.error('Error al obtener cuentas bancarias:', error);
                res.status(500).json({ 
                    error: 'Error interno del servidor al obtener cuentas bancarias',
                    details: error.message 
                });
            }
        },

    // Función para obtener todos los planes contables - CORREGIDO
    getAllPlanCuentas: async (req, res) => {
        try {
            const { estado } = req.query;
            let query = `
                SELECT 
                    pc.id_plan,
                    pc.codigo,
                    pc.nombre,
                    pc.moneda,
                    pc.cuenta_corriente,
                    pc.balance_comprobacion,
                    pc.diferencia_cambio,
                    pc.bg_egp,
                    pc.cuenta_restringida_caja,
                    pc.tipo,
                    pc.transferencias,
                    pc.centro_costo,
                    pc.tabla_egp_balances,
                    pc.id_banco,
                    pc.importaciones,
                    pc.imprime_inven_balance,
                    pc.estado,
                    pc.created_at,
                    pc.updated_at,
                    b.nombre as nombre_banco
                FROM contabilidad.plan_cuentas pc
                LEFT JOIN public.bancos b ON pc.id_banco = b.id_bancos
            `;
            const params = [];

            if (estado === 'true' || estado === 'false') {
                query += ' WHERE pc.estado = $1';
                params.push(estado === 'true');
            }

            query += ' ORDER BY pc.codigo ASC';

            const { rows } = await db.query(query, params);
            
            res.status(200).json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Error al obtener plan de cuentas:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al obtener plan de cuentas',
                error: error.message
            });
        }
    },

    // Función para obtener un plan contable por ID
    getPlanCuentaById: async (req, res) => {
        try {
            const { id } = req.params;
            
            const query = `
                SELECT 
                    pc.*,
                    b.nombre as nombre_banco
                FROM contabilidad.plan_cuentas pc
                LEFT JOIN public.bancos b ON pc.id_banco = b.id_bancos
                WHERE pc.id_plan = $1
            `;
            
            const { rows } = await db.query(query, [id]);
            
            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Plan de cuenta no encontrado'
                });
            }
            
            res.status(200).json({
                success: true,
                data: rows[0]
            });
        } catch (error) {
            console.error('Error al obtener plan de cuenta:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al obtener plan de cuenta',
                error: error.message
            });
        }
    },

    // Función para crear un nuevo plan contable
    createPlanCuenta: async (req, res) => {
        try {
            const {
                codigo, nombre, moneda, cuenta_corriente, balance_comprobacion,
                diferencia_cambio, bg_egp, cuenta_restringida_caja, tipo,
                transferencias, centro_costo, tabla_egp_balances, id_banco,
                importaciones, imprime_inven_balance, estado
            } = req.body;

            const query = `
                INSERT INTO contabilidad.plan_cuentas (
                    codigo, nombre, moneda, cuenta_corriente, balance_comprobacion,
                    diferencia_cambio, bg_egp, cuenta_restringida_caja, tipo,
                    transferencias, centro_costo, tabla_egp_balances, id_banco,
                    importaciones, imprime_inven_balance, estado
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                RETURNING *
            `;

            const values = [
                codigo, nombre, moneda, cuenta_corriente, balance_comprobacion,
                diferencia_cambio, bg_egp, cuenta_restringida_caja, tipo,
                transferencias, centro_costo, tabla_egp_balances, id_banco,
                importaciones, imprime_inven_balance, estado
            ];

            const { rows } = await db.query(query, values);
            
            res.status(201).json({
                success: true,
                message: 'Plan de cuenta creado exitosamente',
                data: rows[0]
            });
        } catch (error) {
            console.error('Error al crear plan de cuenta:', error);
            
            if (error.code === '23505') {
                return res.status(400).json({
                    success: false,
                    message: 'El código o nombre del plan de cuenta ya existe'
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al crear plan de cuenta',
                error: error.message
            });
        }
    },

    // Función para actualizar un plan contable
    updatePlanCuenta: async (req, res) => {
        try {
            const { id } = req.params;
            const {
                codigo, nombre, moneda, cuenta_corriente, balance_comprobacion,
                diferencia_cambio, bg_egp, cuenta_restringida_caja, tipo,
                transferencias, centro_costo, tabla_egp_balances, id_banco,
                importaciones, imprime_inven_balance, estado
            } = req.body;

            const query = `
                UPDATE contabilidad.plan_cuentas SET
                    codigo = $1, nombre = $2, moneda = $3, cuenta_corriente = $4,
                    balance_comprobacion = $5, diferencia_cambio = $6, bg_egp = $7,
                    cuenta_restringida_caja = $8, tipo = $9, transferencias = $10,
                    centro_costo = $11, tabla_egp_balances = $12, id_banco = $13,
                    importaciones = $14, imprime_inven_balance = $15, estado = $16,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id_plan = $17
                RETURNING *
            `;

            const values = [
                codigo, nombre, moneda, cuenta_corriente, balance_comprobacion,
                diferencia_cambio, bg_egp, cuenta_restringida_caja, tipo,
                transferencias, centro_costo, tabla_egp_balances, id_banco,
                importaciones, imprime_inven_balance, estado, id
            ];

            const { rows } = await db.query(query, values);
            
            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Plan de cuenta no encontrado'
                });
            }
            
            res.status(200).json({
                success: true,
                message: 'Plan de cuenta actualizado exitosamente',
                data: rows[0]
            });
        } catch (error) {
            console.error('Error al actualizar plan de cuenta:', error);
            
            if (error.code === '23505') {
                return res.status(400).json({
                    success: false,
                    message: 'El código o nombre del plan de cuenta ya existe'
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al actualizar plan de cuenta',
                error: error.message
            });
        }
    },

    // Función para cambiar estado de un plan contable
    togglePlanCuentaEstado: async (req, res) => {
        try {
            const { id } = req.params;
            
            const query = `
                UPDATE contabilidad.plan_cuentas 
                SET estado = NOT estado, updated_at = CURRENT_TIMESTAMP
                WHERE id_plan = $1
                RETURNING *
            `;

            const { rows } = await db.query(query, [id]);
            
            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Plan de cuenta no encontrado'
                });
            }
            
            const estado = rows[0].estado ? 'activado' : 'desactivado';
            
            res.status(200).json({
                success: true,
                message: `Plan de cuenta ${estado} exitosamente`,
                data: rows[0]
            });
        } catch (error) {
            console.error('Error al cambiar estado del plan de cuenta:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al cambiar estado del plan de cuenta',
                error: error.message
            });
        }
    },

    // Función para obtener datos para formularios - NUEVO
    getDatosFormulario: async (req, res) => {
        try {
            const [bancosRes, centrosCostoRes, formasPagoRes, monedasRes] = await Promise.all([
                db.query('SELECT id_bancos as id, codigo, nombre, siglas FROM public.bancos WHERE estado = TRUE ORDER BY nombre'),
                db.query('SELECT id_c_costo as id, codigo, nombre FROM contabilidad.c_costo WHERE estado = TRUE ORDER BY nombre'),
                db.query('SELECT id, codigo, nombre FROM contabilidad.formas_pago WHERE estado = TRUE ORDER BY nombre'),
                db.query('SELECT id_moneda as id, codigo, nombre, simbolo FROM contabilidad.cod_moneda WHERE estado = TRUE ORDER BY nombre')
            ]);

            res.status(200).json({
                success: true,
                data: {
                    bancos: bancosRes.rows,
                    centros_costo: centrosCostoRes.rows,
                    formas_pago: formasPagoRes.rows,
                    monedas: monedasRes.rows,
                    tipos_moneda: [
                        { value: 'AMBAS', label: 'Ambas' },
                        { value: 'NUEVO SOL', label: 'Nuevo Sol' },
                        { value: 'DOLAR', label: 'Dólar' }
                    ],
                    tipos_balance: [
                        { value: 'RESULTADO', label: 'Resultado' },
                        { value: 'SALDO', label: 'Saldo' },
                        { value: 'INVENTARIO', label: 'Inventario' }
                    ],
                    tipos_cuenta: [
                        { value: 'TITULO', label: 'Título' },
                        { value: 'DIGITABLE', label: 'Digitable' }
                    ],
                    tipos_bg_egp: [
                        { value: 'AMBOS', label: 'Ambos' },
                        { value: 'SOLO BALANCE x FUNCION', label: 'Solo Balance x Función' },
                        { value: 'SOLO NATURALEZA', label: 'Solo Naturaleza' }
                    ],
                    tipos_transferencia: [
                        { value: 'SIN TRANSFERENCIA', label: 'Sin Transferencia' },
                        { value: 'CON TRANSFERENCIA', label: 'Con Transferencia' }
                    ],
                    tablas_egp: [
                        { value: 'ACTIVO CORRIENTE', label: 'Activo Corriente' },
                        { value: 'ACTIVO NO CORRIENTE', label: 'Activo No Corriente' },
                        { value: 'CTAS. ORDEN DEUDORAS', label: 'Ctas. Orden Deudoras' },
                        { value: 'PASIVO CORRIENTE', label: 'Pasivo Corriente' },
                        { value: 'PASIVO NO CORRIENTE', label: 'Pasivo No Corriente' },
                        { value: 'PATRIMONIO', label: 'Patrimonio' },
                        { value: 'CTAS. ORDEN ACREEDOR', label: 'Ctas. Orden Acreedor' },
                        { value: 'GASTOS POR NATURALEZA', label: 'Gastos por Naturaleza' },
                        { value: 'UTILIDAD BRUTA', label: 'Utilidad Bruta' },
                        { value: 'GASTOS DE OPERACION', label: 'Gastos de Operación' },
                        { value: 'RESULTADOS', label: 'Resultados' },
                        { value: 'R.E.I DEL EJERCICIO', label: 'R.E.I del Ejercicio' }
                    ]
                }
            });
        } catch (error) {
            console.error('Error al obtener datos de formulario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al obtener datos de formulario',
                error: error.message
            });
        }
    },

    // Función para obtener incoterms - NUEVO
    getIncoterms: async (req, res) => {
        try {
            const query = `
                SELECT 
                    id, codigo, nombre, siglas, 
                    flete_interno, handling_local, almacenaje, manipuleo, descarga,
                    control_doc, comision, conduccion, devol_contenedor, 
                    tramite_documentario, thc, ad_valorem, otros, extormar
                FROM public.incoterms
                ORDER BY codigo ASC
            `;

            const { rows } = await db.query(query);
            
            res.status(200).json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Error al obtener incoterms:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al obtener incoterms',
                error: error.message
            });
        }
    },

    // Función para obtener tipos de operación - NUEVO
    getTiposOperacion: async (req, res) => {
        try {
            const query = `
                SELECT 
                    id_operacion as id, codigo, nombre, siglas, estado
                FROM public.tipo_operaciones
                WHERE estado = TRUE
                ORDER BY codigo ASC
            `;

            const { rows } = await db.query(query);
            
            res.status(200).json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Error al obtener tipos de operación:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al obtener tipos de operación',
                error: error.message
            });
        }
    },

    getTiposCambio: async (req, res) => {
        try {
            const query = `
                SELECT 
                    tc.id,
                    TO_CHAR(tc.fecha, 'DD/MM/YY') as fecha,
                    tc.moneda_origen_id,
                    mo.codigo AS moneda_origen_codigo,
                    tc.moneda_destino_id,
                    md.codigo AS moneda_destino_codigo,
                    tc.compra,
                    tc.venta,
                    tc.estado
                FROM contabilidad.tipo_cambio tc
                JOIN contabilidad.cod_moneda mo ON mo.id_moneda = tc.moneda_origen_id
                JOIN contabilidad.cod_moneda md ON md.id_moneda = tc.moneda_destino_id
                ORDER BY tc.fecha DESC
            `;

            const { rows } = await db.query(query);

            res.status(200).json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Error obteniendo tipos de cambio:', error);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    },

    crearTipoCambio: async (req, res) => {
        const {
            fecha,
            moneda_origen_id,
            moneda_destino_id,
            compra,
            venta,
            estado = true,
        } = req.body;

        // Si no hay usuario autenticado, usar null o un valor por defecto
        const registrado_por = req.user?.id || null;

        try {
            const existe = await db.query(
                `SELECT id FROM contabilidad.tipo_cambio WHERE fecha = $1 AND moneda_origen_id = $2 AND moneda_destino_id = $3`,
                [fecha, moneda_origen_id, moneda_destino_id]
            );

            if (existe.rows.length > 0) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Ya existe un tipo de cambio para esta fecha y monedas' 
                });
            }

            const query = `
                INSERT INTO contabilidad.tipo_cambio (
                    fecha, moneda_origen_id, moneda_destino_id, compra, venta,
                    estado, registrado_por
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;

            const values = [
                fecha,
                moneda_origen_id,
                moneda_destino_id,
                compra,
                venta,
                estado,
                registrado_por,
            ];

            const { rows } = await db.query(query, values);

            res.status(201).json({
                success: true,
                message: 'Tipo de cambio creado exitosamente',
                data: rows[0]
            });
        } catch (err) {
            console.error('Error al crear tipo de cambio:', err);
            res.status(500).json({ 
                success: false,
                message: 'Error interno del servidor',
                error: err.message 
            });
        }
    },


    editarTipoCambio: async (req, res) => {
        const { id } = req.params;

        const {
            fecha,
            moneda_origen_id,
            moneda_destino_id,
            compra,
            venta,
            estado,
        } = req.body;

        const actualizado_por = req.user?.id || null;

        try {
            const existe = await db.query(
                `SELECT id FROM contabilidad.tipo_cambio WHERE id = $1`,
                [id]
            );

            if (existe.rows.length === 0) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Tipo de cambio no encontrado' 
                });
            }

            const query = `
                UPDATE contabilidad.tipo_cambio
                SET
                    fecha = $1,
                    moneda_origen_id = $2,
                    moneda_destino_id = $3,
                    compra = $4,
                    venta = $5,
                    estado = $6,
                    actualizado_por = $7,
                    fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id = $8
                RETURNING *
            `;

            const values = [
                fecha,
                moneda_origen_id,
                moneda_destino_id,
                compra,
                venta,
                estado,
                actualizado_por,
                id,
            ];

            const { rows } = await db.query(query, values);

            res.status(200).json({
                success: true,
                message: 'Tipo de cambio actualizado exitosamente',
                data: rows[0]
            });
        } catch (err) {
            console.error('Error al actualizar tipo de cambio:', err);
            res.status(500).json({ 
                success: false,
                message: 'Error interno del servidor',
                error: err.message 
            });
        }
    },

    // Función para obtener todos los datos del formulario de facturas
    getDatosFormularioFacturas: async (req, res) => {
        try {
            // Realizar todas las consultas en paralelo
            const [
                documentosRes,
                proveedoresRes,
                monedasRes,
                formasPagoRes,
                incotermsRes,
                mediosTransporteRes,
                aduanasRes,
                bancosRes,
                ordenesCompraRes
            ] = await Promise.all([
                // Documentos (FAP para LOCAL, FPE para EXTERNO)
                db.query(`
                    SELECT id_documento, codigo, nombre
                    FROM public.documentos 
                    WHERE codigo IN ('FAP', 'FPE')
                    ORDER BY nombre
                `),
                
                // Proveedores activos con datos bancarios
                db.query(`
                    SELECT 
                        p.id_prov, 
                        p.codigo, 
                        p.nro_documento, 
                        p.razon_social, 
                        p.nomb_comercial, 
                        p.direccion, 
                        p.estado
                    FROM compras.proveedores p
                    WHERE p.estado = TRUE
                    ORDER BY p.razon_social
                `),
                
                // Monedas activas
                db.query(`
                    SELECT id_moneda, codigo, nombre, simbolo, pais, estado
                    FROM contabilidad.cod_moneda 
                    WHERE estado = TRUE
                    ORDER BY nombre
                `),
                
                // Formas de pago activas
                db.query(`
                    SELECT id, codigo, nombre, forma_pago, estado
                    FROM contabilidad.formas_pago 
                    WHERE estado = TRUE
                    ORDER BY nombre
                `),
                
                // Incoterms
                db.query(`
                    SELECT id, codigo, nombre, siglas
                    FROM public.incoterms 
                    ORDER BY codigo
                `),
                
                // Medios de transporte activos
                db.query(`
                    SELECT id, nombre
                    FROM public.medios_transporte 
                    ORDER BY nombre
                `),
                
                // Aduanas activas
                db.query(`
                    SELECT id_aduana, codigo, nombre, estado
                    FROM public.cod_aduana 
                    WHERE estado = TRUE
                    ORDER BY nombre
                `),
                
                // Bancos activos
                db.query(`
                    SELECT id_bancos, codigo, nombre, siglas, estado
                    FROM public.bancos 
                    WHERE estado = TRUE
                    ORDER BY nombre
                `),
                
                // Órdenes de compra en estado ENTREGADA o EN FACTURACIÓN con montos
                db.query(`
                    SELECT 
                        oc.id,
                        oc.numero,
                        oc.fecha,
                        oc.tipo,
                        oc.estado,
                        oc.proveedor_id,
                        p.razon_social as proveedor_nombre,
                        oc.moneda_id,
                        oc.forma_pago,
                        oc.tipo_cambio,
                        oc.incoterm_id,
                        oc.medio_transporte_id,
                        oc.aduana_id,
                        oc.sub_total,
                        oc.igv,
                        oc.total
                    FROM compras.orden_compra oc
                    INNER JOIN compras.proveedores p ON oc.proveedor_id = p.id_prov
                    WHERE oc.estado IN ('ENTREGADA', 'EN FACTURACIÓN')
                    ORDER BY oc.fecha DESC, oc.numero DESC
                `)
            ]);

            // Enviar respuesta consolidada
            res.status(200).json({
                success: true,
                data: {
                    documentos: documentosRes.rows,
                    proveedores: proveedoresRes.rows,
                    monedas: monedasRes.rows,
                    formas_pago: formasPagoRes.rows,
                    incoterms: incotermsRes.rows,
                    medios_transporte: mediosTransporteRes.rows,
                    aduanas: aduanasRes.rows,
                    bancos: bancosRes.rows,
                    ordenes_compra: ordenesCompraRes.rows
                },
                message: 'Datos del formulario cargados exitosamente'
            });

        } catch (error) {
            console.error('Error al obtener datos del formulario de facturas:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al cargar datos del formulario',
                error: error.message
            });
        }
    },

    getCuentasBancariasByProveedor: async (req, res) => {
        try {
            const { proveedorId } = req.params;
            
            const query = `
                SELECT 
                    cb.id_cuenta,
                    cb.numero_cuenta as cuenta_bancaria,
                    cb.cta_interbancaria as cuenta_interbancaria,
                    cb.codigo_swift as swift,
                    cb.direccion as direccion_banco,
                    cb.id_bancos,
                    b.nombre as banco_nombre,
                    cm.codigo as moneda_codigo,
                    cm.nombre as moneda_nombre
                FROM contabilidad.cuentas_bancarias_prov cb
                LEFT JOIN public.bancos b ON cb.id_bancos = b.id_bancos
                LEFT JOIN contabilidad.cod_moneda cm ON cb.id_moneda = cm.id_moneda
                WHERE cb.id_prov = $1 AND cb.estado = true
                ORDER BY cb.id_cuenta
            `;

            const { rows } = await db.query(query, [proveedorId]);
            
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

    // Función para obtener tipo de cambio por fecha y moneda
    getTipoCambioByFecha: async (req, res) => {
        try {
            const { fecha } = req.query;
            
            if (!fecha) {
                return res.status(400).json({
                    success: false,
                    message: 'Fecha es requerida'
                });
            }
            
            // Considerando que normalmente se usa USD -> PEN
            const query = `
                SELECT 
                    tc.id,
                    tc.compra,
                    tc.venta,
                    mo.codigo as moneda_origen,
                    mo.nombre as moneda_origen_nombre,
                    md.codigo as moneda_destino,
                    md.nombre as moneda_destino_nombre,
                    tc.fecha
                FROM contabilidad.tipo_cambio tc
                INNER JOIN contabilidad.cod_moneda mo ON tc.moneda_origen_id = mo.id_moneda
                INNER JOIN contabilidad.cod_moneda md ON tc.moneda_destino_id = md.id_moneda
                WHERE tc.fecha = $1 
                    AND mo.codigo = 'USD'  -- Moneda origen: Dólares
                    AND md.codigo = 'PEN'  -- Moneda destino: Soles
                    AND tc.estado = TRUE
                ORDER BY tc.fecha DESC
                LIMIT 1
            `;

            const { rows } = await db.query(query, [fecha]);
            
            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró tipo de cambio para la fecha especificada'
                });
            }

            res.status(200).json({
                success: true,
                data: rows[0]
            });

        } catch (error) {
            console.error('Error al obtener tipo de cambio:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al obtener tipo de cambio',
                error: error.message
            });
        }
    },

    // Función para obtener los productos de una orden de compra
    getProductosOrdenCompra: async (req, res) => {
        try {
            const { ordenCompraId } = req.params;

            const query = `
                SELECT 
                    ocd.id,
                    ocd.numitem,
                    ocd.producto_codigo,
                    p.descripcion as producto_descripcion,
                    um.nombre as unidad_medida,
                    ocd.cantidad_solicitada,
                    ocd.cantidad_recibida,
                    ocd.precio_unitario,
                    ocd.descuento_porcentaje,
                    ocd.descuento_monto,
                    ocd.valor_venta,
                    ocd.igv,
                    ocd.precio_total,
                    cc.nombre as centro_costo,
                    ocd.comentario
                FROM compras.orden_compra_detalle ocd
                INNER JOIN almacen.productos p ON ocd.producto_codigo = p.codigo
                LEFT JOIN public.unidades_medida um ON p.id_unidad = um.id_unidades
                LEFT JOIN contabilidad.c_costo cc ON ocd.centro_costo_id = cc.id_c_costo
                WHERE ocd.orden_compra_id = $1
                ORDER BY ocd.numitem
            `;

            const { rows } = await db.query(query, [ordenCompraId]);

            res.status(200).json({
                success: true,
                data: rows
            });

        } catch (error) {
            console.error('Error al obtener productos de orden de compra:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al obtener productos',
                error: error.message
            });
        }
    },

    // Obtener siguiente número de factura proveedor (9 dígitos para FAP y FPE)
    getNextFacturaProveedorNumber: async (req, res) => {
        try {
            // Obtener el tipo_compra desde query params
            const { tipo_compra } = req.query;

            if (!tipo_compra || (tipo_compra !== 'LOCAL' && tipo_compra !== 'EXTERNO')) {
                return res.status(400).json({
                    error: "El parámetro tipo_compra es requerido y debe ser 'LOCAL' o 'EXTERNO'"
                });
            }

            const query = `
                SELECT numero 
                FROM contabilidad.facturas_proveedor
                WHERE tipo_compra = $1
                ORDER BY id DESC
                LIMIT 1
            `;
            const { rows } = await db.query(query, [tipo_compra]);

            let nextNumber = "000000001"; // valor inicial si no hay registros
            if (rows.length > 0) {
                const lastNumber = rows[0].numero;
                const numericPart = parseInt(lastNumber, 10);
                
                // Validar que el número actual tenga máximo 9 dígitos
                if (numericPart >= 999999999) {
                    return res.status(400).json({
                        error: "Se ha alcanzado el límite máximo de numeración para este tipo de compra"
                    });
                }
                
                const incremented = numericPart + 1;
                nextNumber = incremented.toString().padStart(9, "0"); // 9 dígitos
            }

            res.status(200).json({ 
                nextNumber,
                tipo_compra,
                prefijo: tipo_compra === 'LOCAL' ? 'FAP' : 'FPE'
            });
        } catch (error) {
            console.error("Error al obtener siguiente número de factura proveedor:", error);
            res.status(500).json({
                error: "Error interno al obtener siguiente número",
                details: error.message
            });
        }
    },

    // Función para crear una nueva factura de proveedor
    crearFacturaProveedor: async (req, res) => {
        try {
            const {
                // Campos base
                documento_id,
                orden_compra_id,
                proveedor_id,
                direccion,
                tipo_compra,
                
                // Datos de la factura
                tipo_doc,
                serie,
                numero_fac,
                fecha_emision,
                fecha_vencimiento,
                
                // Datos monetarios
                moneda_id,
                forma_pago_id,
                subtotal,
                igv,
                total,
                
                // Tipo cambio
                tipo_cambio_id,
                tipo_cambio,
                
                // Campos específicos para EXTERNO
                numero_invoice,
                fecha_llegada,
                incoterm_id,
                medio_transporte_id,
                aduana_id,
                importe_fob,
                flete,
                seguro,
                otros_gastos,
                importe_cif,
                importe_moneda_prov,
                importe_soles,
                
                // Datos bancarios
                banco_id,
                cuenta_bancaria,
                cuenta_interbancaria,
                swift,
                direccion_banco,
                
                // Campos específicos para LOCAL
                guia_remision,
                detraccion,
                retencion,
                fecha_guia_remision,
                
                // Campos comunes
                comentario,
                archivo_factura,
                estado = 'REGISTRADA'
            } = req.body;

            // Validaciones básicas
            if (!documento_id || !orden_compra_id || !proveedor_id || !tipo_compra) {
                return res.status(400).json({
                    success: false,
                    message: 'Documento, orden de compra, proveedor y tipo de compra son requeridos'
                });
            }

            // Validar que tipo_compra sea válido
            if (!['LOCAL', 'EXTERNO'].includes(tipo_compra)) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo de compra debe ser LOCAL o EXTERNO'
                });
            }

            // Validaciones específicas por tipo de compra
            if (tipo_compra === 'LOCAL') {
                if (!serie || !numero_fac || !tipo_doc || !igv) {
                    return res.status(400).json({
                        success: false,
                        message: 'Para compras LOCALES: serie, número de factura, tipo de documento e IGV son requeridos'
                    });
                }
            } else if (tipo_compra === 'EXTERNO') {
                if (!numero_invoice || !importe_moneda_prov) {
                    return res.status(400).json({
                        success: false,
                        message: 'Para compras EXTERNAS: número de invoice e importe en moneda del proveedor son requeridos'
                    });
                }
            }

            // Validar montos comunes
            if (!subtotal || !total || !tipo_cambio || !importe_soles) {
                return res.status(400).json({
                    success: false,
                    message: 'Subtotal, total, tipo de cambio e importe en soles son requeridos'
                });
            }

            await db.query('BEGIN');

            // Obtener último número por tipo_compra
            const lastNumberQuery = `
                SELECT numero 
                FROM contabilidad.facturas_proveedor
                WHERE tipo_compra = $1
                ORDER BY id DESC
                LIMIT 1
            `;
            const { rows: lastRows } = await db.query(lastNumberQuery, [tipo_compra]);

            let nextNumber = "000000001"; 
            if (lastRows.length > 0) {
                const lastNumber = lastRows[0].numero;
                const numericPart = parseInt(lastNumber, 10);
                
                if (numericPart >= 999999999) {
                    await db.query('ROLLBACK');
                    return res.status(400).json({
                        success: false,
                        message: 'Se ha alcanzado el límite máximo de numeración para este tipo de compra'
                    });
                }
                
                const incremented = numericPart + 1;
                nextNumber = incremented.toString().padStart(9, "0");
            }

            // Obtener usuario que registra
            const registrado_por = req.user?.id || req.userId || null;

            // QUERY CORREGIDA - Orden correcto de parámetros según tu especificación
            const query = `
                INSERT INTO contabilidad.facturas_proveedor (
                    -- Campos base (6) - PARA AMBOS
                    documento_id, numero, orden_compra_id, proveedor_id, direccion, tipo_compra,
                    
                    -- Datos de la factura (5) - LOCAL (3) + AMBOS (2)
                    tipo_doc, serie, numero_fac, fecha_emision, fecha_vencimiento,
                    
                    -- Datos monetarios (5) - AMBOS
                    moneda_id, forma_pago_id, subtotal, igv, total,
                    
                    -- Tipo cambio (2) - AMBOS
                    tipo_cambio_id, tipo_cambio,
                    
                    -- Campos específicos para EXTERNO (11)
                    numero_invoice, fecha_llegada, incoterm_id, medio_transporte_id, aduana_id,
                    importe_fob, flete, seguro, otros_gastos, importe_cif, importe_moneda_prov,
                    
                    -- Importe en soles (1) - AMBOS
                    importe_soles,
                    
                    -- Datos bancarios (5) - AMBOS
                    banco_id, cuenta_bancaria, cuenta_interbancaria, swift, direccion_banco,
                    
                    -- Campos específicos para LOCAL (4)
                    guia_remision, detraccion, retencion, fecha_guia_remision,
                    
                    -- Campos comunes (3) - AMBOS
                    comentario, archivo_factura, estado,
                    
                    -- Auditoría (1)
                    registrado_por
                ) VALUES (
                    $1, $2, $3, $4, $5, $6,     -- 6 campos base
                    $7, $8, $9, $10, $11,        -- 5 datos factura
                    $12, $13, $14, $15, $16,     -- 5 datos monetarios
                    $17, $18,                    -- 2 tipo cambio
                    $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, -- 11 campos EXTERNO
                    $30,                         -- 1 importe_soles
                    $31, $32, $33, $34, $35,     -- 5 datos bancarios
                    $36, $37, $38, $39,          -- 4 campos LOCAL
                    $40, $41, $42,               -- 3 campos comunes
                    $43                          -- 1 auditoría
                ) RETURNING *
            `;

            const values = [
                // Campos base - AMBOS
                documento_id, nextNumber, orden_compra_id, proveedor_id, direccion, tipo_compra,
                
                // Datos de la factura
                tipo_doc || null, serie || null, numero_fac || null, fecha_emision, fecha_vencimiento,
                
                // Datos monetarios - AMBOS
                moneda_id, forma_pago_id, subtotal, igv, total,
                
                // Tipo cambio - AMBOS
                tipo_cambio_id || null, tipo_cambio,
                
                // Campos específicos para EXTERNO
                numero_invoice || null, fecha_llegada || null, incoterm_id || null, 
                medio_transporte_id || null, aduana_id || null, importe_fob || 0, 
                flete || 0, seguro || 0, otros_gastos || 0, importe_cif || 0, 
                importe_moneda_prov || 0,
                
                // Importe en soles - AMBOS
                importe_soles,
                
                // Datos bancarios - AMBOS
                banco_id || null, cuenta_bancaria || null, cuenta_interbancaria || null, 
                swift || null, direccion_banco || null,
                
                // Campos específicos para LOCAL
                guia_remision || null, detraccion || 0, retencion || 0, fecha_guia_remision || null,
                
                // Campos comunes - AMBOS
                comentario || null, archivo_factura || null, estado,
                
                // Auditoría
                registrado_por
            ];

            const { rows } = await db.query(query, values);

            await db.query('COMMIT');

            res.status(201).json({
                success: true,
                message: 'Factura de proveedor creada exitosamente',
                data: rows[0],
                numeroGenerado: nextNumber,
                prefijo: tipo_compra === 'LOCAL' ? 'FAP' : 'FPE'
            });

        } catch (error) {
            await db.query('ROLLBACK');
            console.error('Error al crear factura de proveedor:', error);
            
            if (error.code === '23505') {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe una factura con los mismos datos'
                });
            }
            
            if (error.code === '23503') {
                return res.status(400).json({
                    success: false,
                    message: 'Error de referencia: Verifique que los IDs relacionados existan'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al crear factura de proveedor',
                error: error.message
            });
        }
    },

    // Función para actualizar una factura de proveedor
    actualizarFacturaProveedor: async (req, res) => {
        try {
            const { id } = req.params;
            const {
                // Campos base
                documento_id,
                numero,
                orden_compra_id,
                proveedor_id,
                direccion,
                tipo_compra,
                
                // Datos de la factura
                tipo_doc,
                serie,
                numero_fac,
                fecha_emision,
                fecha_vencimiento,
                
                // Datos monetarios
                moneda_id,
                forma_pago_id,
                subtotal,
                igv,
                total,
                
                // Tipo cambio
                tipo_cambio_id,
                tipo_cambio,
                
                // Campos específicos para EXTERNO
                numero_invoice,
                fecha_llegada,
                incoterm_id,
                medio_transporte_id,
                aduana_id,
                importe_fob,
                flete,
                seguro,
                otros_gastos,
                importe_cif,
                importe_moneda_prov,
                importe_soles,
                
                // Datos bancarios
                banco_id,
                cuenta_bancaria,
                cuenta_interbancaria,
                swift,
                direccion_banco,
                
                // Campos específicos para LOCAL
                guia_remision,
                detraccion,
                retencion,
                fecha_guia_remision,
                
                // Campos comunes
                comentario,
                archivo_factura,
                estado
            } = req.body;

            // Verificar si la factura existe
            const facturaExistente = await db.query(
                'SELECT id FROM contabilidad.facturas_proveedor WHERE id = $1',
                [id]
            );

            if (facturaExistente.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Factura de proveedor no encontrada'
                });
            }

            // Obtener usuario que actualiza (si está autenticado)
            const updated_by = req.user?.id || null;

            const query = `
                UPDATE contabilidad.facturas_proveedor SET
                    -- Campos base
                    documento_id = $1,
                    numero = $2,
                    orden_compra_id = $3,
                    proveedor_id = $4,
                    direccion = $5,
                    tipo_compra = $6,
                    
                    -- Datos de la factura
                    tipo_doc = $7,
                    serie = $8,
                    numero_fac = $9,
                    fecha_emision = $10,
                    fecha_vencimiento = $11,
                    
                    -- Datos monetarios
                    moneda_id = $12,
                    forma_pago_id = $13,
                    subtotal = $14,
                    igv = $15,
                    total = $16,
                    
                    -- Tipo cambio
                    tipo_cambio_id = $17,
                    tipo_cambio = $18,
                    
                    -- Campos específicos para EXTERNO
                    numero_invoice = $19,
                    fecha_llegada = $20,
                    incoterm_id = $21,
                    medio_transporte_id = $22,
                    aduana_id = $23,
                    importe_fob = $24,
                    flete = $25,
                    seguro = $26,
                    otros_gastos = $27,
                    importe_cif = $28,
                    importe_moneda_prov = $29,
                    importe_soles = $30,
                    
                    -- Datos bancarios
                    banco_id = $31,
                    cuenta_bancaria = $32,
                    cuenta_interbancaria = $33,
                    swift = $34,
                    direccion_banco = $35,
                    
                    -- Campos específicos para LOCAL
                    guia_remision = $36,
                    detraccion = $37,
                    retencion = $38,
                    fecha_guia_remision = $39,
                    
                    -- Campos comunes
                    comentario = $40,
                    archivo_factura = $41,
                    estado = $42,
                    
                    -- Auditoría
                    updated_by = $43,
                    updated_at = CURRENT_TIMESTAMP
                    
                WHERE id = $44
                RETURNING *
            `;

            const values = [
                // Campos base
                documento_id, numero || null, orden_compra_id, proveedor_id, direccion, tipo_compra,
                
                // Datos de la factura
                tipo_doc || null, serie || null, numero_fac || null, fecha_emision, fecha_vencimiento,
                
                // Datos monetarios
                moneda_id, forma_pago_id, subtotal, igv || 0, total,
                
                // Tipo cambio
                tipo_cambio_id || null, tipo_cambio,
                
                // Campos específicos para EXTERNO
                numero_invoice || null, fecha_llegada || null, incoterm_id || null, 
                medio_transporte_id || null, aduana_id || null, importe_fob || 0, 
                flete || 0, seguro || 0, otros_gastos || 0, importe_cif || 0, 
                importe_moneda_prov || 0, importe_soles || 0,
                
                // Datos bancarios
                banco_id || null, cuenta_bancaria || null, cuenta_interbancaria || null, 
                swift || null, direccion_banco || null,
                
                // Campos específicos para LOCAL
                guia_remision || null, detraccion || 0, retencion || 0, fecha_guia_remision || null,
                
                // Campos comunes
                comentario || null, archivo_factura || null, estado || 'REGISTRADA',
                
                // Auditoría
                updated_by,
                
                // WHERE condition
                id
            ];

            const { rows } = await db.query(query, values);

            res.status(200).json({
                success: true,
                message: 'Factura de proveedor actualizada exitosamente',
                data: rows[0]
            });

        } catch (error) {
            console.error('Error al actualizar factura de proveedor:', error);
            
            if (error.code === '23505') {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe una factura con los mismos datos'
                });
            }
            
            if (error.code === '23503') {
                return res.status(400).json({
                    success: false,
                    message: 'Error de referencia: Verifique que los IDs relacionados existan'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al actualizar factura de proveedor',
                error: error.message
            });
        }
    },

    // Función para obtener todas las facturas de proveedor
    getFacturasProveedor: async (req, res) => {
        try {
            const query = `
                SELECT 
                    fp.*,
                    d.codigo as documento_codigo,
                    d.nombre as documento_nombre,
                    p.razon_social as proveedor_nombre,
                    p.nro_documento as proveedor_ruc,
                    oc.numero as orden_compra_numero,
                    m.codigo as moneda_codigo,
                    m.nombre as moneda_nombre,
                    fop.nombre as forma_pago_nombre,  -- Cambiado de fp a fop
                    i.codigo as incoterm_codigo,
                    i.nombre as incoterm_nombre,
                    mt.nombre as medio_transporte_nombre,
                    a.nombre as aduana_nombre,
                    b.nombre as banco_nombre
                FROM contabilidad.facturas_proveedor fp
                LEFT JOIN public.documentos d ON fp.documento_id = d.id_documento
                LEFT JOIN compras.proveedores p ON fp.proveedor_id = p.id_prov
                LEFT JOIN compras.orden_compra oc ON fp.orden_compra_id = oc.id
                LEFT JOIN contabilidad.cod_moneda m ON fp.moneda_id = m.id_moneda
                LEFT JOIN contabilidad.formas_pago fop ON fp.forma_pago_id = fop.id  -- Cambiado alias a fop
                LEFT JOIN public.incoterms i ON fp.incoterm_id = i.id
                LEFT JOIN public.medios_transporte mt ON fp.medio_transporte_id = mt.id
                LEFT JOIN public.cod_aduana a ON fp.aduana_id = a.id_aduana
                LEFT JOIN public.bancos b ON fp.banco_id = b.id_bancos
                ORDER BY fp.fecha_registro DESC
            `;

            const { rows } = await db.query(query);

            res.status(200).json({
                success: true,
                data: rows
            });

        } catch (error) {
            console.error('Error al obtener facturas de proveedor:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al obtener facturas de proveedor',
                error: error.message
            });
        }
    },

    // Función para obtener una factura de proveedor por ID
    getFacturaProveedorById: async (req, res) => {
        try {
            const { id } = req.params;

            const query = `
                SELECT 
                    fp.*,
                    d.codigo as documento_codigo,
                    d.nombre as documento_nombre,
                    p.razon_social as proveedor_nombre,
                    p.nro_documento as proveedor_ruc,
                    oc.numero as orden_compra_numero,
                    m.codigo as moneda_codigo,
                    m.nombre as moneda_nombre,
                    fop.nombre as forma_pago_nombre,  -- Cambiado de fp a fop
                    i.codigo as incoterm_codigo,
                    i.nombre as incoterm_nombre,
                    mt.nombre as medio_transporte_nombre,
                    a.nombre as aduana_nombre,
                    b.nombre as banco_nombre
                FROM contabilidad.facturas_proveedor fp
                LEFT JOIN public.documentos d ON fp.documento_id = d.id_documento
                LEFT JOIN compras.proveedores p ON fp.proveedor_id = p.id_prov
                LEFT JOIN compras.orden_compra oc ON fp.orden_compra_id = oc.id
                LEFT JOIN contabilidad.cod_moneda m ON fp.moneda_id = m.id_moneda
                LEFT JOIN contabilidad.formas_pago fop ON fp.forma_pago_id = fop.id  -- Cambiado alias a fop
                LEFT JOIN public.incoterms i ON fp.incoterm_id = i.id
                LEFT JOIN public.medios_transporte mt ON fp.medio_transporte_id = mt.id
                LEFT JOIN public.cod_aduana a ON fp.aduana_id = a.id_aduana
                LEFT JOIN public.bancos b ON fp.banco_id = b.id_bancos
                WHERE fp.id = $1
            `;

            const { rows } = await db.query(query, [id]);

            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Factura de proveedor no encontrada'
                });
            }

            res.status(200).json({
                success: true,
                data: rows[0]
            });

        } catch (error) {
            console.error('Error al obtener factura de proveedor:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al obtener factura de proveedor',
                error: error.message
            });
        }
    },

    // Función para eliminar una factura de proveedor
    eliminarFacturaProveedor: async (req, res) => {
        try {
            const { id } = req.params;

            // Verificar si la factura existe
            const facturaExistente = await db.query(
                'SELECT id FROM contabilidad.facturas_proveedor WHERE id = $1',
                [id]
            );

            if (facturaExistente.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Factura de proveedor no encontrada'
                });
            }

            const query = 'DELETE FROM contabilidad.facturas_proveedor WHERE id = $1 RETURNING *';

            const { rows } = await db.query(query, [id]);

            res.status(200).json({
                success: true,
                message: 'Factura de proveedor eliminada exitosamente',
                data: rows[0]
            });

        } catch (error) {
            console.error('Error al eliminar factura de proveedor:', error);
            
            if (error.code === '23503') {
                return res.status(400).json({
                    success: false,
                    message: 'No se puede eliminar la factura porque tiene registros relacionados'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al eliminar factura de proveedor',
                error: error.message
            });
        }
    }

};

module.exports = contabilidadController;