// backend/services/CotizadorService.js
class CotizadorService {

    // Recibe los datos de la evaluación ya cargados del controlador
    constructor(evaluacionData, actualizacionRecienteId) {

        this.evaluacion = evaluacionData;
        this.actualizacion_precios_id = actualizacionRecienteId;

        this.costosTotales = 0;
        this.CALC_CONFIG = {
            "tasa_conversion": 3.20,
            "tipo": "maritimo",
            "otros_factores": {
                "factoring": { "estado": 0, "factor": 0 },
                "gastos_financieros": { "estado": 0, "factor": 0 },
                "negociacion": { "estado": 0, "factor": 0 }
            }
        };

        this.cotizacion_materiales = { 'items_cotizados': [], 'totales': { 'pen': 0, 'usd': 0 } };
        this.cotizacion_mano_obra = { 'actividades_evaluacion': [], 'totales': { 'pen': 0, 'usd': 0 } };
        this.cotizacion_sumary = { 'costos_directos': 0 };
        this.cotizacion_serv_prod_sin_utilidad = { 'items': [], 'totales': { 'pen': 0, 'usd': 0 } };
        this.cotizacion_serv_prod_con_utilidad = { 'items': [], 'totales': { 'pen': 0, 'usd': 0 } };
    }

    // --- Métodos de Configuración y Helpers (Portados de cotizacion.py) ---

    setDataCalculo(tasa, tipo, otros_factores) {
        this.setTasa(tasa);
        this.setTipo(tipo);
        this.setOtrosFactores(otros_factores);
    }

    setTasa(tasa) {
        let tasa_float = parseFloat(tasa);
        if (tasa_float === null || isNaN(tasa_float) || tasa_float <= 0) {
            tasa_float = 3.20;
        }
        this.CALC_CONFIG['tasa_conversion'] = tasa_float;
    }

    setTipo(tipo) {
        const tipoLower = String(tipo).toLowerCase();
        if (['maritimo', 'aereo'].includes(tipoLower)) {
            this.CALC_CONFIG['tipo'] = tipoLower;
        } else {
            this.CALC_CONFIG['tipo'] = 'maritimo';
        }
    }

    setOtrosFactores(factores) {
        for (const key in factores) {
            if (this.CALC_CONFIG['otros_factores'].hasOwnProperty(key)) {
                const value = factores[key];
                this.CALC_CONFIG['otros_factores'][key]['estado'] = value.checked ? 1 : 0;
                this.CALC_CONFIG['otros_factores'][key]['factor'] = parseFloat(value.num) || 0;
            }
        }
    }

    costo_unitario_usd_moneda_variable(moneda_x, costo_unitario_x) {
        const tasa_conversion = parseFloat(this.CALC_CONFIG['tasa_conversion']);
        const costo_float = parseFloat(costo_unitario_x);

        if (moneda_x === "USD") {
            return costo_float;
        } else if (moneda_x === "PEN") {
            return costo_float / tasa_conversion;
        }
        return 0;
    }

    subtotal_usd_moneda_variante(moneda_x, costo_unitario_x, cantidad_x) {
        const tasa_conversion = parseFloat(this.CALC_CONFIG['tasa_conversion']);
        const costo_float = parseFloat(costo_unitario_x);
        const cantidad_float = parseFloat(cantidad_x);

        if (moneda_x === "USD") {
            return costo_float * cantidad_float;
        } else if (moneda_x === "PEN") {
            const subtotal_pen_x = cantidad_float * costo_float;
            return subtotal_pen_x / tasa_conversion;
        }
        return 0;
    }

    // --- Métodos de Cálculo Principal ---

    async cotizar_material() {
        let total_materiales_usd = 0;
        const tasa_conversion = this.CALC_CONFIG['tasa_conversion'];
        const materiales_cotizados = [];

        // 1. Materiales de la Evaluación (mantenimiento.material_evaluacion)
        for (const detalle of this.evaluacion.detalles_materiales) {
            // Se usa el costo de referencia (asumido en PEN, como en el Django original)
            const costo_unitario = parseFloat(detalle.costo_unitario_ref || 0);
            const cantidad = parseFloat(detalle.cantidad || 0);

            const subtotal_pen = costo_unitario * cantidad;
            const subtotal_usd = subtotal_pen / tasa_conversion;
            const costo_unitario_usd = costo_unitario / tasa_conversion;

            total_materiales_usd += subtotal_usd;

            materiales_cotizados.push({
                id_elemento: detalle.id,
                codigo: detalle.producto_codigo,
                descripcion: detalle.producto_descripcion,
                und_medida: detalle.unidad_medida,
                cantidad: cantidad,
                subtotal_pen: subtotal_pen,
                subtotal_usd: subtotal_usd,
                costo_unitario_usd: costo_unitario_usd,
                costo_unitario_pen: costo_unitario,
                tipo: 'normal',
                moneda_entrada: 'PEN'
            });
        }

        // 2. Materiales Auxiliares (mantenimiento.elemento_auxiliar tipo 'material')
        for (const mat_aux of this.evaluacion.elementos_auxiliares.filter(e => e.tipo === "material")) {
            const costo_unitario_usd_normalizado = this.costo_unitario_usd_moneda_variable(mat_aux.moneda, mat_aux.precio_unitario);
            const subtotal_usd = this.subtotal_usd_moneda_variante(mat_aux.moneda, mat_aux.precio_unitario, mat_aux.cantidad);
            total_materiales_usd += subtotal_usd;

            materiales_cotizados.push({
                id_elemento: mat_aux.id,
                codigo: "-",
                descripcion: mat_aux.nombre,
                und_medida: mat_aux.unidad,
                cantidad: parseFloat(mat_aux.cantidad),
                subtotal_pen: subtotal_usd * tasa_conversion,
                subtotal_usd: subtotal_usd,
                costo_unitario_usd: costo_unitario_usd_normalizado,
                costo_unitario_pen: costo_unitario_usd_normalizado * tasa_conversion,
                tipo: 'auxiliar',
                moneda_entrada: mat_aux.moneda
            });
        }

        this.cotizacion_materiales.items_cotizados = materiales_cotizados;
        this.cotizacion_materiales.totales.usd = total_materiales_usd;
        this.cotizacion_materiales.totales.pen = total_materiales_usd * tasa_conversion;
    }

    async cotizar_mano_obra() {
        let total_mano_obra_usd = 0;
        const tasa_conversion = this.CALC_CONFIG['tasa_conversion'];
        const actividades_cotizadas = [];

        // 1. Actividades de la Evaluación (mantenimiento.actividad_obra_evaluacion)
        for (const actividad_eval of this.evaluacion.actividades) {
            // Asumido costo_hh_ref ya en USD (o se convierte, si no, se usa el costo_hh de la tabla maestra)
            const costo_hh = parseFloat(actividad_eval.costo_hh_ref || 0);
            const cantidad = parseFloat(actividad_eval.cantidad_horas || 0);

            const subtotal_usd = costo_hh * cantidad;
            const subtotal_pen = subtotal_usd * tasa_conversion;

            total_mano_obra_usd += subtotal_usd;

            actividades_cotizadas.push({
                id_elemento: actividad_eval.id,
                actividad_nombre: actividad_eval.actividad_nombre,
                cantidad_hh: cantidad,
                costo_unitario_usd: costo_hh,
                subtotal_usd: subtotal_usd,
                subtotal_pen: subtotal_pen,
                tipo: "normal"
            });
        }

        // 2. Actividades Auxiliares (mantenimiento.elemento_auxiliar tipo 'actividad')
        for (const actividad_aux of this.evaluacion.elementos_auxiliares.filter(e => e.tipo === "actividad")) {
            const costo_unitario_usd_normalizado = this.costo_unitario_usd_moneda_variable(actividad_aux.moneda, actividad_aux.precio_unitario);
            const subtotal_usd = this.subtotal_usd_moneda_variante(actividad_aux.moneda, actividad_aux.precio_unitario, actividad_aux.cantidad);
            total_mano_obra_usd += subtotal_usd;

            actividades_cotizadas.push({
                id_elemento: actividad_aux.id,
                actividad_nombre: actividad_aux.nombre,
                cantidad_hh: parseFloat(actividad_aux.cantidad),
                costo_unitario_usd: costo_unitario_usd_normalizado,
                subtotal_usd: subtotal_usd,
                subtotal_pen: subtotal_usd * tasa_conversion,
                tipo: 'auxiliar'
            });
        }

        this.cotizacion_mano_obra.actividades_evaluacion = actividades_cotizadas;
        this.cotizacion_mano_obra.totales.usd = total_mano_obra_usd;
        this.cotizacion_mano_obra.totales.pen = total_mano_obra_usd * tasa_conversion;
    }

    async cotizar_serv_prod_sin_utilidad() {
        let total_sp_sin_utilidad_usd = 0;
        const serv_prod_sin_utilidad_cotizados = [];
        const tasa_conversion = this.CALC_CONFIG['tasa_conversion'];

        for (const elem of this.evaluacion.elementos_auxiliares.filter(e => e.tipo === "sin_utilidad")) {
            const costo_unitario_usd_normalizado = this.costo_unitario_usd_moneda_variable(elem.moneda, elem.precio_unitario);
            const subtotal_usd = this.subtotal_usd_moneda_variante(elem.moneda, elem.precio_unitario, elem.cantidad);
            total_sp_sin_utilidad_usd += subtotal_usd;

            serv_prod_sin_utilidad_cotizados.push({
                moneda: elem.moneda,
                serv_prod: elem.nombre,
                cantidad: parseFloat(elem.cantidad),
                unidad: elem.unidad,
                costo_unitario: parseFloat(elem.precio_unitario),
                costo_unitario_normalizado_usd: costo_unitario_usd_normalizado,
                subtotal_usd: subtotal_usd,
                tipo: 'auxiliar',
            });
        }

        this.cotizacion_serv_prod_sin_utilidad.items = serv_prod_sin_utilidad_cotizados;
        this.cotizacion_serv_prod_sin_utilidad.totales.usd = total_sp_sin_utilidad_usd;
        this.cotizacion_serv_prod_sin_utilidad.totales.pen = total_sp_sin_utilidad_usd * tasa_conversion;
    }

    async cotizar_serv_prod_con_utilidad() {
        let total_sp_con_utilidad_usd = 0;
        const serv_prod_con_utilidad_cotizados = [];
        const tasa_conversion = this.CALC_CONFIG['tasa_conversion'];

        for (const elem of this.evaluacion.elementos_auxiliares.filter(e => e.tipo === "con_utilidad")) {
            const costo_unitario_usd_normalizado = this.costo_unitario_usd_moneda_variable(elem.moneda, elem.precio_unitario);
            const subtotal_usd = this.subtotal_usd_moneda_variante(elem.moneda, elem.precio_unitario, elem.cantidad);
            total_sp_con_utilidad_usd += subtotal_usd;

            serv_prod_con_utilidad_cotizados.push({
                moneda: elem.moneda,
                serv_prod: elem.nombre,
                cantidad: parseFloat(elem.cantidad),
                unidad: elem.unidad,
                costo_unitario: parseFloat(elem.precio_unitario),
                costo_unitario_normalizado_usd: costo_unitario_usd_normalizado,
                subtotal_usd: subtotal_usd,
                tipo: 'auxiliar',
            });
        }

        this.cotizacion_serv_prod_con_utilidad.items = serv_prod_con_utilidad_cotizados;
        this.cotizacion_serv_prod_con_utilidad.totales.usd = total_sp_con_utilidad_usd;
        this.cotizacion_serv_prod_con_utilidad.totales.pen = total_sp_con_utilidad_usd * tasa_conversion;
    }

    calcular_costos_directos() {
        const materiales_usd = this.cotizacion_materiales.totales.usd;
        const mano_obra = this.cotizacion_mano_obra.totales.usd;

        const costos_directos = materiales_usd + mano_obra;
        this.cotizacion_sumary.costos_directos = costos_directos;
    }

    // --- Función de Orquestación y Resultado ---

    async cotizar() {
        await Promise.all([
            this.cotizar_material(),
            this.cotizar_mano_obra(),
            this.cotizar_serv_prod_sin_utilidad(),
            this.cotizar_serv_prod_con_utilidad()
        ]);

        this.calcular_costos_directos();

        return this.devolver_cotizacion();
    }

    devolver_cotizacion() {
        const round = (num) => parseFloat(num.toFixed(2));
        const round4 = (num) => parseFloat(num.toFixed(4));

        return {
            metadata: {
                "evaluacion": this.evaluacion.id,
                "actualizacion_precios": this.actualizacion_precios_id,
                "args_config": this.CALC_CONFIG
            },
            materiales_data_procesada: {
                'calculos': {
                    'elementos_materiales': this.cotizacion_materiales.items_cotizados.map(item => ({
                        ...item,
                        subtotal_pen: round(item.subtotal_pen),
                        subtotal_usd: round(item.subtotal_usd),
                        costo_unitario_usd: round4(item.costo_unitario_usd),
                        costo_unitario_pen: round4(item.costo_unitario_pen),
                    })),
                    'totalpen': round(this.cotizacion_materiales.totales.pen),
                    'totalusd': round(this.cotizacion_materiales.totales.usd),
                }
            },
            mano_obra_data_procesada: {
                'calculos': {
                    'elementos_actividades': this.cotizacion_mano_obra.actividades_evaluacion.map(item => ({
                        ...item,
                        subtotal_pen: round(item.subtotal_pen),
                        subtotal_usd: round(item.subtotal_usd),
                        costo_unitario_usd: round4(item.costo_unitario_usd),
                    })),
                    'totalpen': round(this.cotizacion_mano_obra.totales.pen),
                    'totalusd': round(this.cotizacion_mano_obra.totales.usd),
                }
            },
            servicios_data_procesada: {
                'sin_utilidad': {
                    'calculos': {
                        'items': this.cotizacion_serv_prod_sin_utilidad.items.map(item => ({
                            ...item,
                            subtotal_usd: round(item.subtotal_usd),
                            costo_unitario_normalizado_usd: round4(item.costo_unitario_normalizado_usd),
                        })),
                        'totalusd': round(this.cotizacion_serv_prod_sin_utilidad.totales.usd)
                    }
                },
                'con_utilidad': {
                    'calculos': {
                        'items': this.cotizacion_serv_prod_con_utilidad.items.map(item => ({
                            ...item,
                            subtotal_usd: round(item.subtotal_usd),
                            costo_unitario_normalizado_usd: round4(item.costo_unitario_normalizado_usd),
                        })),
                        'totalusd': round(this.cotizacion_serv_prod_con_utilidad.totales.usd)
                    }
                }
            },
            calculos_globales_cotizacion: {
                "costos_directos": round(this.cotizacion_sumary.costos_directos),
            },
        };
    }
}

module.exports = CotizadorService;