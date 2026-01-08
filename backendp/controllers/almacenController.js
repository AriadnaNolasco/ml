const { pool } = require("../config/db");
const PDFDocument = require("pdfkit");

// Obtener todos los productos
const obtenerProductos = async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id_producto,
        p.codigo, 
        p.codigo_barras, 
        p.descripcion, 
        c.nombre as categoria,
        um.nombre as unidad_medida,
        um.siglas as unidad_siglas,
        p.procedencia,
        p.stock_minimo,
        p.stock_maximo,
        p.stock_actual,
        p.ubicacion,
        p.estado,
        dm.nombre as division_mercaderia,
        p.precio_unitario,
        p.precio_total,
        p.precio_fabricacion,
        p.precio_venta,
        mon.simbolo as moneda,
        cc.nombre as centro_costo,
        p.afecto_igv,
        p.fecha
      FROM almacen.productos p
      LEFT JOIN public.categoria c ON p.id_categoria = c.id_categoria
      LEFT JOIN public.unidades_medida um ON p.id_unidad = um.id_unidades
      LEFT JOIN public.division_mercaderia dm ON p.id_div_merca = dm.id_div_merca
      LEFT JOIN contabilidad.cod_moneda mon ON p.moneda_id = mon.id_moneda
      LEFT JOIN contabilidad.c_costo cc ON p.centro_costo_id = cc.id_c_costo
      ORDER BY p.codigo
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener producto por código
const obtenerProductoPorCodigo = async (req, res) => {
  try {
    const { codigo } = req.params;

    const query = `
      SELECT 
        p.*,
        c.nombre as categoria_nombre,
        c.codigo as categoria_codigo,
        um.nombre as unidad_medida_nombre,
        um.siglas as unidad_medida_siglas,
        dm.nombre as division_mercaderia_nombre,
        dm.codigo as division_mercaderia_codigo,
        mon.nombre as moneda_nombre,
        mon.simbolo as moneda_simbolo,
        cc.nombre as centro_costo_nombre,
        u_created.nombre_completo as creado_por_nombre,
        u_updated.nombre_completo as actualizado_por_nombre,
        cp.id as config_parrilla_id,
        cp.ps_largo, cp.ps_ancho, cp.ps_espesor, cp.ps_tipo, 
        cp.ps_posicion, cp.ps_fijacion, cp.ps_perforacion,
        cp.pi_largo, cp.pi_ancho, cp.pi_espesor, cp.pi_tipo,
        cp.pi_posicion, cp.pi_fijacion, cp.pi_perforacion,
        cp.tubos_flotantes, cp.parrilla_intermedia
      FROM almacen.productos p
      LEFT JOIN public.categoria c ON p.id_categoria = c.id_categoria
      LEFT JOIN public.unidades_medida um ON p.id_unidad = um.id_unidades
      LEFT JOIN public.division_mercaderia dm ON p.id_div_merca = dm.id_div_merca
      LEFT JOIN contabilidad.cod_moneda mon ON p.moneda_id = mon.id_moneda
      LEFT JOIN contabilidad.c_costo cc ON p.centro_costo_id = cc.id_c_costo
      LEFT JOIN public.usuarios u_created ON p.created_by = u_created.id
      LEFT JOIN public.usuarios u_updated ON p.updated_by = u_updated.id
      LEFT JOIN almacen.configuracion_parrillas cp ON p.id_producto = cp.producto_id
      WHERE p.codigo = $1
    `;

    const result = await pool.query(query, [codigo]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const producto = result.rows[0];

    // ⭐ Organizar datos de parrillas en un objeto separado si existen
    if (producto.config_parrilla_id) {
      producto.configuracion_parrillas = {
        id: producto.config_parrilla_id,
        ps_largo: producto.ps_largo,
        ps_ancho: producto.ps_ancho,
        ps_espesor: producto.ps_espesor,
        ps_tipo: producto.ps_tipo,
        ps_posicion: producto.ps_posicion,
        ps_fijacion: producto.ps_fijacion,
        ps_perforacion: producto.ps_perforacion,
        pi_largo: producto.pi_largo,
        pi_ancho: producto.pi_ancho,
        pi_espesor: producto.pi_espesor,
        pi_tipo: producto.pi_tipo,
        pi_posicion: producto.pi_posicion,
        pi_fijacion: producto.pi_fijacion,
        pi_perforacion: producto.pi_perforacion,
        tubos_flotantes: producto.tubos_flotantes,
        parrilla_intermedia: producto.parrilla_intermedia,
      };

      // Limpiar campos duplicados del objeto principal
      delete producto.config_parrilla_id;
      delete producto.ps_largo;
      delete producto.ps_ancho;
      delete producto.ps_espesor;
      delete producto.ps_tipo;
      delete producto.ps_posicion;
      delete producto.ps_fijacion;
      delete producto.ps_perforacion;
      delete producto.pi_largo;
      delete producto.pi_ancho;
      delete producto.pi_espesor;
      delete producto.pi_tipo;
      delete producto.pi_posicion;
      delete producto.pi_fijacion;
      delete producto.pi_perforacion;
      delete producto.tubos_flotantes;
      delete producto.parrilla_intermedia;
    }

    res.json(producto);
  } catch (error) {
    console.error("Error al obtener producto:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ============================================
// AGREGAR ESTAS FUNCIONES A almacenController.js
// ============================================

// Función auxiliar para parsear código de radiador (IGNORA PUNTOS)
const parsearCodigoRadiador = (codigo) => {
  if (!codigo) return null;

  // Quitar puntos y espacios, convertir a mayúsculas
  const codigoLimpio = codigo.replace(/[.\s]/g, "").toUpperCase();

  // Mínimo 9 caracteres (parrilla es opcional)
  if (codigoLimpio.length < 9) return null;

  return {
    altura: codigoLimpio.substring(0, 2),
    ancho: codigoLimpio.substring(2, 4),
    letra_altura: codigoLimpio.charAt(4),
    letra_ancho: codigoLimpio.charAt(5),
    hileras: codigoLimpio.charAt(6),
    tipo_tubo: codigoLimpio.charAt(7),
    modelo: codigoLimpio.charAt(8),
    parrillas: codigoLimpio.length >= 10 ? codigoLimpio.charAt(9) : null,
    sufijo: codigoLimpio.length > 10 ? codigoLimpio.substring(10) : null,
    codigoLimpio: codigoLimpio,
  };
};

const formatearMedida = (entero, fraccion) => {
  if (!fraccion || fraccion === '0"' || fraccion === "0") return `${entero}`;
  if (fraccion === '1"' || fraccion === "1") return `${entero + 1}`;
  return `${entero} ${fraccion}`;
};

// ENDPOINT: Decodificar código
const decodificarCodigoProducto = async (req, res) => {
  try {
    const { codigo } = req.query;
    if (!codigo) {
      return res
        .status(400)
        .json({ success: false, error: "Código requerido" });
    }

    const componentes = parsearCodigoRadiador(codigo);
    if (!componentes) {
      return res.status(400).json({
        success: false,
        error: "Código inválido (mínimo 9 caracteres sin contar puntos)",
      });
    }

    // Query con parrillas condicional
    let queryParams = [
      componentes.letra_altura,
      componentes.letra_ancho,
      componentes.tipo_tubo,
      componentes.modelo,
    ];

    let equivalenciasQuery = `
      SELECT tipo_equivalencia, letra, valor_fraccion, descripcion
      FROM public.equivalencia_letras
      WHERE 
        (tipo_equivalencia = 'equivalencia_altura' AND letra = $1)
        OR (tipo_equivalencia = 'equivalencia_ancho' AND letra = $2)
        OR (tipo_equivalencia = 'equivalencia_tubo' AND letra = $3)
        OR (tipo_equivalencia = 'equivalencia_modelo' AND letra = $4)
    `;

    // Solo buscar parrillas si existe
    if (componentes.parrillas) {
      equivalenciasQuery += ` OR (tipo_equivalencia = 'equivalencia_parrillas' AND letra = $5)`;
      queryParams.push(componentes.parrillas);
    }

    const equivalenciasResult = await pool.query(
      equivalenciasQuery,
      queryParams
    );

    const eq = {};
    equivalenciasResult.rows.forEach((r) => {
      eq[r.tipo_equivalencia] = {
        fraccion: r.valor_fraccion,
        descripcion: r.descripcion,
      };
    });

    const alturaBase = parseInt(componentes.altura) || 0;
    const anchoBase = parseInt(componentes.ancho) || 0;
    const fracAltura =
      eq["equivalencia_altura"]?.fraccion?.replace('"', "") || "";
    const fracAncho =
      eq["equivalencia_ancho"]?.fraccion?.replace('"', "") || "";
    const fracTubo = eq["equivalencia_tubo"]?.fraccion || "";
    const modeloDesc = eq["equivalencia_modelo"]?.descripcion || "";
    const parrillasDesc = componentes.parrillas
      ? eq["equivalencia_parrillas"]?.descripcion || ""
      : "";

    // Construir descripción
    let descripcion = `RADIADOR ${modeloDesc} ${formatearMedida(
      alturaBase,
      fracAltura
    )}" X ${formatearMedida(anchoBase, fracAncho)}" - ${
      componentes.hileras
    } HILERAS`;

    if (fracTubo) {
      descripcion += ` - TUBO ${fracTubo}`;
    }

    if (parrillasDesc) {
      descripcion += ` ${parrillasDesc}`;
    }

    // Determinar procedimiento de corte de tubos según letra del modelo
    const letraModelo = componentes.modelo;
    let procedimientoCorte = null;

    const mapeoCorte = {
      T: {
        codigo: "PRO-ET-016",
        nombre: "Corte de Tubos Modelo GT (TANDEM)",
        modelos: ["GT"],
      },
      L: {
        codigo: "PRO-ET-017",
        nombre: "Corte de Tubos Modelo GL-KD (LOUVERS)",
        modelos: ["GL", "KD"],
      },
      D: {
        codigo: "PRO-ET-017",
        nombre: "Corte de Tubos Modelo GL-KD (LOUVERS)",
        modelos: ["GL", "KD"],
      },
      V: {
        codigo: "PRO-ET-018",
        nombre: "Corte de Tubos Modelo GV-KV (VIGIA/KOLLER)",
        modelos: ["GV", "KV"],
      },
      K: {
        codigo: "PRO-ET-018",
        nombre: "Corte de Tubos Modelo GV-KV (VIGIA/KOLLER)",
        modelos: ["GV", "KV"],
      },
      C: {
        codigo: "PRO-ET-019",
        nombre: "Corte de Tubos Modelo HC-HL (HEAVY CORE)",
        modelos: ["HC", "HL"],
      },
      H: {
        codigo: "PRO-ET-019",
        nombre: "Corte de Tubos Modelo HC-HL (HEAVY CORE)",
        modelos: ["HC", "HL"],
      },
      A: {
        codigo: "PRO-ET-020",
        nombre: "Corte de Tubos Modelo AA-AC-AL-PA-PC-PL (AMERICANO)",
        modelos: ["AA", "AC", "AL", "PA", "PC", "PL"],
      },
      P: {
        codigo: "PRO-ET-020",
        nombre: "Corte de Tubos Modelo AA-AC-AL-PA-PC-PL (AMERICANO)",
        modelos: ["AA", "AC", "AL", "PA", "PC", "PL"],
      },
      W: {
        codigo: "PRO-ET-021",
        nombre: "Corte de Tubos Modelo KW (KOLLER WIDE)",
        modelos: ["KW"],
      },
    };

    if (letraModelo && mapeoCorte[letraModelo]) {
      procedimientoCorte = mapeoCorte[letraModelo];
    }

    res.json({
      success: true,
      descripcion: descripcion.replace(/\s+/g, " ").trim(),
      codigo: codigo.toUpperCase(),
      codigo_limpio: componentes.codigoLimpio,
      componentes,
      procedimiento_corte: procedimientoCorte,
      detalles: {
        altura: `${formatearMedida(alturaBase, fracAltura)}"`,
        ancho: `${formatearMedida(anchoBase, fracAncho)}"`,
        hileras: componentes.hileras,
        tubo: fracTubo,
        modelo: modeloDesc,
        parrillas: parrillasDesc || "N/A",
        sufijo: componentes.sufijo,
      },
    });
  } catch (error) {
    console.error("Error decodificar:", error);
    res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
};

// ENDPOINT: Obtener equivalencias
const obtenerEquivalenciasCodigo = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT tipo_equivalencia, letra, valor_fraccion, valor_decimal, descripcion
      FROM public.equivalencia_letras
      ORDER BY tipo_equivalencia, letra
    `);

    const equivalencias = {
      altura: [],
      ancho: [],
      tubo: [],
      modelo: [],
      parrillas: [],
    };

    result.rows.forEach((row) => {
      const item = {
        letra: row.letra,
        fraccion: row.valor_fraccion,
        decimal: row.valor_decimal,
        descripcion: row.descripcion,
      };

      switch (row.tipo_equivalencia) {
        case "equivalencia_altura":
          equivalencias.altura.push(item);
          break;
        case "equivalencia_ancho":
          equivalencias.ancho.push(item);
          break;
        case "equivalencia_tubo":
          equivalencias.tubo.push(item);
          break;
        case "equivalencia_modelo":
          equivalencias.modelo.push(item);
          break;
        case "equivalencia_parrillas":
          equivalencias.parrillas.push(item);
          break;
      }
    });

    res.json({ success: true, equivalencias });
  } catch (error) {
    console.error("Error al obtener equivalencias:", error);
    res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
};

// ⭐ ENDPOINT: Verificar si un código existe
const verificarCodigoExiste = async (req, res) => {
  try {
    const { codigo } = req.query;

    if (!codigo) {
      return res.status(400).json({
        success: false,
        error: "Código requerido",
      });
    }

    const result = await pool.query(
      "SELECT codigo, descripcion FROM almacen.productos WHERE codigo = $1",
      [codigo.toUpperCase()]
    );

    res.json({
      success: true,
      existe: result.rows.length > 0,
      producto: result.rows.length > 0 ? result.rows[0] : null,
    });
  } catch (error) {
    console.error("Error al verificar código:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
    });
  }
};

// ============================================
// MODIFICAR crearProducto para auto-generar descripción
// ============================================
const crearProductoConDescripcionAuto = async (req, res) => {
  try {
    const {
      codigo,
      codigo_barras,
      descripcion,
      auto_descripcion, // Nueva bandera: si es true, genera la descripción automáticamente
      id_unidad,
      id_categoria,
      id_div_merca,
      moneda_id,
      centro_costo_id,
      procedencia,
      caracteristicas,
      precio_unitario,
      precio_total,
      precio_fabricacion,
      precio_venta,
      stock_minimo,
      stock_maximo,
      stock_actual,
      ubicacion,
      afecto_igv,
    } = req.body;

    // Verificar si el producto ya existe
    const existeResult = await pool.query(
      "SELECT codigo FROM almacen.productos WHERE codigo = $1",
      [codigo]
    );

    if (existeResult.rows.length > 0) {
      return res.status(400).json({ error: "El código de producto ya existe" });
    }

    // Obtener categoría
    const categoriaResult = await pool.query(
      "SELECT nombre FROM public.categoria WHERE id_categoria = $1",
      [id_categoria]
    );

    if (categoriaResult.rows.length === 0) {
      return res.status(400).json({ error: "Categoría no válida" });
    }

    const categoriaNombre = categoriaResult.rows[0].nombre.toUpperCase();

    // Determinar descripción final
    let descripcionFinal = descripcion;

    // Si es producto terminado y se solicita auto-descripción
    if (categoriaNombre.includes("PRODUCTO TERMINADO") && auto_descripcion) {
      const componentes = parsearCodigoRadiador(codigo);

      if (componentes) {
        // Obtener equivalencias
        const equivalenciasResult = await pool.query(
          `
          SELECT tipo_equivalencia, letra, valor_fraccion, descripcion
          FROM public.equivalencia_letras
          WHERE 
            (tipo_equivalencia = 'equivalencia_altura' AND letra = $1)
            OR (tipo_equivalencia = 'equivalencia_ancho' AND letra = $2)
            OR (tipo_equivalencia = 'equivalencia_tubo' AND letra = $3)
            OR (tipo_equivalencia = 'equivalencia_modelo' AND letra = $4)
            OR (tipo_equivalencia = 'equivalencia_parrillas' AND letra = $5)
        `,
          [
            componentes.letra_altura,
            componentes.letra_ancho,
            componentes.tipo_tubo,
            componentes.modelo,
            componentes.parrillas,
          ]
        );

        const equivalencias = {};
        equivalenciasResult.rows.forEach((row) => {
          equivalencias[row.tipo_equivalencia] = {
            fraccion: row.valor_fraccion,
            descripcion: row.descripcion,
          };
        });

        const alturaBase = parseInt(componentes.altura) || 0;
        const anchoBase = parseInt(componentes.ancho) || 0;

        const fraccionAltura =
          equivalencias["equivalencia_altura"]?.fraccion?.replace('"', "") ||
          "";
        const fraccionAncho =
          equivalencias["equivalencia_ancho"]?.fraccion?.replace('"', "") || "";
        const fraccionTubo = equivalencias["equivalencia_tubo"]?.fraccion || "";
        const modeloDesc =
          equivalencias["equivalencia_modelo"]?.descripcion || "";
        const parrillasDesc =
          equivalencias["equivalencia_parrillas"]?.descripcion || "";

        const alturaCompleta = formatearMedida(alturaBase, fraccionAltura);
        const anchoCompleto = formatearMedida(anchoBase, fraccionAncho);

        descripcionFinal = `RADIADOR ${modeloDesc} ${alturaCompleta}" X ${anchoCompleto}" - ${componentes.hileras} HILERAS`;

        if (fraccionTubo) {
          descripcionFinal += ` - TUBO ${fraccionTubo}`;
        }

        if (parrillasDesc) {
          descripcionFinal += ` ${parrillasDesc}`;
        }

        descripcionFinal = descripcionFinal.replace(/\s+/g, " ").trim();
      }
    }

    // Resto de validaciones...
    if (categoriaNombre.includes("SERVICIO")) {
      if (!precio_venta && precio_venta !== 0) {
        return res
          .status(400)
          .json({ error: "El precio de venta es requerido para servicios" });
      }
    } else {
      if (!id_unidad) {
        return res
          .status(400)
          .json({ error: "La unidad de medida es requerida" });
      }
      if (
        stock_minimo === undefined ||
        stock_maximo === undefined ||
        stock_actual === undefined
      ) {
        return res
          .status(400)
          .json({ error: "Los campos de stock son requeridos" });
      }
      if (Number(stock_maximo) < Number(stock_minimo)) {
        return res
          .status(400)
          .json({
            error: "El stock máximo no puede ser menor al stock mínimo",
          });
      }
    }

    if (categoriaNombre.includes("PRODUCTO TERMINADO")) {
      if (
        (!precio_fabricacion && precio_fabricacion !== 0) ||
        (!precio_venta && precio_venta !== 0)
      ) {
        return res.status(400).json({
          error:
            "Precio de fabricación y precio de venta son requeridos para productos terminados",
        });
      }
    }

    // Insertar producto
    const query = `
      INSERT INTO almacen.productos (
        codigo, codigo_barras, descripcion, id_unidad, id_categoria, 
        id_div_merca, moneda_id, centro_costo_id, procedencia, caracteristicas,
        fecha, precio_unitario, precio_total, precio_fabricacion, precio_venta,
        stock_minimo, stock_maximo, stock_actual, ubicacion, afecto_igv, estado, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *
    `;

    const values = [
      codigo,
      codigo_barras || null,
      descripcionFinal, // Usar la descripción generada o la proporcionada
      id_unidad,
      id_categoria,
      id_div_merca || null,
      moneda_id || 1,
      centro_costo_id || null,
      procedencia || "NACIONAL",
      caracteristicas || null,
      precio_unitario || 0,
      precio_total || 0,
      precio_fabricacion || 0,
      precio_venta || 0,
      stock_minimo || 0,
      stock_maximo || 0,
      stock_actual || 0,
      ubicacion || null,
      afecto_igv !== undefined ? afecto_igv : true,
      true,
      req.userId || 1,
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      ...result.rows[0],
      descripcion_auto_generada:
        auto_descripcion && descripcionFinal !== descripcion,
    });
  } catch (error) {
    console.error("Error al crear producto:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Guardar configuración de parrillas
const guardarConfiguracionParrillas = async (productoId, configuracion, userId, client = null) => {
  const shouldCommit = !client;
  const dbClient = client || await pool.connect();
  
  try {
    if (shouldCommit) {
      await dbClient.query('BEGIN');
    }

    // Verificar si ya existe una configuración
    const checkQuery = `
      SELECT id FROM almacen.configuracion_parrillas 
      WHERE producto_id = $1
    `;
    const checkResult = await dbClient.query(checkQuery, [productoId]);

    if (checkResult.rows.length > 0) {
      // Actualizar configuración existente
      const updateQuery = `
        UPDATE almacen.configuracion_parrillas SET
          ps_largo = $1,
          ps_ancho = $2,
          ps_espesor = $3,
          ps_tipo = $4,
          ps_posicion = $5,
          ps_fijacion = $6,
          ps_perforacion = $7,
          pi_largo = $8,
          pi_ancho = $9,
          pi_espesor = $10,
          pi_tipo = $11,
          pi_posicion = $12,
          pi_fijacion = $13,
          pi_perforacion = $14,
          tubos_flotantes = $15,
          parrilla_intermedia = $16,
          updated_by = $17,
          updated_at = CURRENT_TIMESTAMP
        WHERE producto_id = $18
        RETURNING id
      `;
      
      await dbClient.query(updateQuery, [
        configuracion.ps_largo || null,
        configuracion.ps_ancho || null,
        configuracion.ps_espesor || null,
        configuracion.ps_tipo || null,
        configuracion.ps_posicion || null,
        configuracion.ps_fijacion || null,
        configuracion.ps_perforacion || null,
        configuracion.pi_largo || null,
        configuracion.pi_ancho || null,
        configuracion.pi_espesor || null,
        configuracion.pi_tipo || null,
        configuracion.pi_posicion || null,
        configuracion.pi_fijacion || null,
        configuracion.pi_perforacion || null,
        configuracion.tubos_flotantes || false,
        configuracion.parrilla_intermedia || false,
        userId,
        productoId
      ]);
    } else {
      // Insertar nueva configuración
      const insertQuery = `
        INSERT INTO almacen.configuracion_parrillas (
          producto_id,
          ps_largo, ps_ancho, ps_espesor, ps_tipo, ps_posicion, ps_fijacion, ps_perforacion,
          pi_largo, pi_ancho, pi_espesor, pi_tipo, pi_posicion, pi_fijacion, pi_perforacion,
          tubos_flotantes, parrilla_intermedia,
          created_by, updated_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $18
        )
        RETURNING id
      `;
      
      await dbClient.query(insertQuery, [
        productoId,
        configuracion.ps_largo || null,
        configuracion.ps_ancho || null,
        configuracion.ps_espesor || null,
        configuracion.ps_tipo || null,
        configuracion.ps_posicion || null,
        configuracion.ps_fijacion || null,
        configuracion.ps_perforacion || null,
        configuracion.pi_largo || null,
        configuracion.pi_ancho || null,
        configuracion.pi_espesor || null,
        configuracion.pi_tipo || null,
        configuracion.pi_posicion || null,
        configuracion.pi_fijacion || null,
        configuracion.pi_perforacion || null,
        configuracion.tubos_flotantes || false,
        configuracion.parrilla_intermedia || false,
        userId
      ]);
    }

    if (shouldCommit) {
      await dbClient.query('COMMIT');
    }
  } catch (error) {
    if (shouldCommit) {
      await dbClient.query('ROLLBACK');
    }
    throw error;
  } finally {
    if (shouldCommit) {
      dbClient.release();
    }
  }
};

// Obtener configuración de parrillas de un producto
const obtenerConfiguracionParrillas = async (req, res) => {
  try {
    const { productoId } = req.params;

    const query = `
      SELECT 
        cp.*,
        u_created.nombre_completo as creado_por_nombre,
        u_updated.nombre_completo as actualizado_por_nombre
      FROM almacen.configuracion_parrillas cp
      LEFT JOIN public.usuarios u_created ON cp.created_by = u_created.id
      LEFT JOIN public.usuarios u_updated ON cp.updated_by = u_updated.id
      WHERE cp.producto_id = $1
    `;

    const result = await pool.query(query, [productoId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: "No se encontró configuración de parrillas para este producto" 
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener configuración de parrillas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Actualizar solo la configuración de parrillas
const actualizarConfiguracionParrillas = async (req, res) => {
  try {
    const { productoId } = req.params;
    const configuracion = req.body;
    const userId = req.userId;

    // Verificar que el producto existe
    const productoCheck = await pool.query(
      "SELECT id_producto FROM almacen.productos WHERE id_producto = $1",
      [productoId]
    );

    if (productoCheck.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    await guardarConfiguracionParrillas(productoId, configuracion, userId);

    res.json({ 
      message: "Configuración de parrillas actualizada correctamente" 
    });
  } catch (error) {
    console.error("Error al actualizar configuración de parrillas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Eliminar configuración de parrillas
const eliminarConfiguracionParrillas = async (req, res) => {
  try {
    const { productoId } = req.params;

    const query = `
      DELETE FROM almacen.configuracion_parrillas
      WHERE producto_id = $1
      RETURNING id
    `;

    const result = await pool.query(query, [productoId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: "No se encontró configuración de parrillas para eliminar" 
      });
    }

    res.json({ 
      message: "Configuración de parrillas eliminada correctamente" 
    });
  } catch (error) {
    console.error("Error al eliminar configuración de parrillas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// MODIFICAR LA FUNCIÓN crearProducto EXISTENTE
// Agregar soporte para configuración de parrillas al crear producto
const crearProducto = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const userId = req.userId;

    const {
      codigo,
      codigo_barras,
      descripcion,
      id_categoria,
      id_unidad,
      id_div_merca,
      moneda_id,
      centro_costo_id,
      procedencia,
      caracteristicas,
      precio_unitario,
      precio_total,
      precio_fabricacion,
      precio_venta,
      stock_minimo,
      stock_maximo,
      stock_actual,
      ubicacion,
      afecto_igv,
      estado,
      configuracion_parrillas, // ⭐ NUEVO: datos de parrillas
    } = req.body;

    // Validación de código duplicado
    const codigoCheck = await client.query(
      "SELECT codigo FROM almacen.productos WHERE codigo = $1",
      [codigo]
    );

    if (codigoCheck.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: `El código '${codigo}' ya existe. Por favor use un código único.`,
      });
    }

    // Validación de stock
    if (
      stock_maximo !== null &&
      stock_maximo !== undefined &&
      stock_minimo !== null &&
      stock_minimo !== undefined
    ) {
      if (Number(stock_maximo) < Number(stock_minimo)) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: "El stock máximo no puede ser menor que el stock mínimo",
        });
      }
    }

    // Insertar producto
    const insertQuery = `
      INSERT INTO almacen.productos (
        codigo, codigo_barras, descripcion, id_categoria, id_unidad, id_div_merca,
        moneda_id, centro_costo_id, procedencia, caracteristicas, fecha,
        precio_unitario, precio_total, precio_fabricacion, precio_venta,
        stock_minimo, stock_maximo, stock_actual, ubicacion, afecto_igv, estado,
        created_by, updated_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $21
      )
      RETURNING id_producto
    `;

    const result = await client.query(insertQuery, [
      codigo,
      codigo_barras || null,
      descripcion,
      id_categoria || null,
      id_unidad || null,
      id_div_merca || null,
      moneda_id,
      centro_costo_id || null,
      procedencia || "NACIONAL",
      caracteristicas || null,
      precio_unitario || null,
      precio_total || null,
      precio_fabricacion || null,
      precio_venta || null,
      stock_minimo || 0,
      stock_maximo || null,
      stock_actual || 0,
      ubicacion || null,
      afecto_igv !== undefined ? afecto_igv : true,
      estado !== undefined ? estado : true,
      userId,
    ]);

    const productoId = result.rows[0].id_producto;

    // ⭐ GUARDAR CONFIGURACIÓN DE PARRILLAS si se proporcionó
    if (configuracion_parrillas && Object.keys(configuracion_parrillas).length > 0) {
      await guardarConfiguracionParrillas(
        productoId, 
        configuracion_parrillas, 
        userId, 
        client
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Producto creado correctamente",
      id_producto: productoId,
      codigo: codigo,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al crear producto:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    client.release();
  }
};

// MODIFICAR LA FUNCIÓN actualizarProducto EXISTENTE
// Agregar soporte para configuración de parrillas al actualizar producto
const actualizarProducto = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { codigo } = req.params;
    const userId = req.userId;

    const {
      codigo_barras,
      descripcion,
      id_categoria,
      id_unidad,
      id_div_merca,
      moneda_id,
      centro_costo_id,
      procedencia,
      caracteristicas,
      precio_unitario,
      precio_total,
      precio_fabricacion,
      precio_venta,
      stock_minimo,
      stock_maximo,
      stock_actual,
      ubicacion,
      afecto_igv,
      estado,
      configuracion_parrillas, // ⭐ NUEVO: datos de parrillas
    } = req.body;

    // Verificar que el producto existe y obtener su ID
    const productoCheck = await client.query(
      "SELECT id_producto FROM almacen.productos WHERE codigo = $1",
      [codigo]
    );

    if (productoCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const productoId = productoCheck.rows[0].id_producto;

    // Validación de stock
    if (
      stock_maximo !== null &&
      stock_maximo !== undefined &&
      stock_minimo !== null &&
      stock_minimo !== undefined
    ) {
      if (Number(stock_maximo) < Number(stock_minimo)) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: "El stock máximo no puede ser menor que el stock mínimo",
        });
      }
    }

    // Actualizar producto
    const updateQuery = `
      UPDATE almacen.productos SET
        codigo_barras = $1,
        descripcion = $2,
        id_categoria = $3,
        id_unidad = $4,
        id_div_merca = $5,
        moneda_id = $6,
        centro_costo_id = $7,
        procedencia = $8,
        caracteristicas = $9,
        precio_unitario = $10,
        precio_total = $11,
        precio_fabricacion = $12,
        precio_venta = $13,
        stock_minimo = $14,
        stock_maximo = $15,
        stock_actual = $16,
        ubicacion = $17,
        afecto_igv = $18,
        estado = $19,
        updated_by = $20,
        updated_at = CURRENT_TIMESTAMP
      WHERE codigo = $21
    `;

    await client.query(updateQuery, [
      codigo_barras || null,
      descripcion,
      id_categoria || null,
      id_unidad || null,
      id_div_merca || null,
      moneda_id,
      centro_costo_id || null,
      procedencia || "NACIONAL",
      caracteristicas || null,
      precio_unitario || null,
      precio_total || null,
      precio_fabricacion || null,
      precio_venta || null,
      stock_minimo || 0,
      stock_maximo || null,
      stock_actual || 0,
      ubicacion || null,
      afecto_igv !== undefined ? afecto_igv : true,
      estado !== undefined ? estado : true,
      userId,
      codigo,
    ]);

    // ⭐ ACTUALIZAR CONFIGURACIÓN DE PARRILLAS si se proporcionó
    if (configuracion_parrillas && Object.keys(configuracion_parrillas).length > 0) {
      await guardarConfiguracionParrillas(
        productoId, 
        configuracion_parrillas, 
        userId, 
        client
      );
    }

    await client.query("COMMIT");

    res.json({ message: "Producto actualizado correctamente" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al actualizar producto:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    client.release();
  }
};

const eliminarProducto = async (req, res) => {
  try {
    const { codigo } = req.params;

    // Verificar si hay movimientos relacionados con este producto
    const movimientosQuery =
      "SELECT id FROM compras.orden_compra_detalle WHERE producto_codigo = $1 LIMIT 1";
    const movimientosResult = await pool.query(movimientosQuery, [codigo]);

    if (movimientosResult.rows.length > 0) {
      return res.status(400).json({
        error:
          "No se puede eliminar el producto porque tiene movimientos relacionados",
      });
    }

    // Cambiar estado a inactivo
    const query = `
      UPDATE almacen.productos 
      SET estado = FALSE, updated_by = $1, updated_at = CURRENT_TIMESTAMP
      WHERE codigo = $2
      RETURNING *
    `;

    const result = await pool.query(query, [req.userId || 1, codigo]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json({ message: "Producto eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener datos para formularios
const obtenerDatosFormulario = async (req, res) => {
  try {
    const categoriasQuery =
      "SELECT id_categoria as id, codigo, nombre FROM public.categoria ORDER BY nombre";
    const unidadesQuery =
      "SELECT id_unidades as id, codigo, nombre, siglas FROM public.unidades_medida WHERE estado = TRUE ORDER BY nombre";
    const monedasQuery =
      "SELECT id_moneda as id, codigo, nombre, simbolo FROM contabilidad.cod_moneda WHERE estado = TRUE ORDER BY codigo";
    const divisionesQuery =
      "SELECT id_div_merca as id, codigo, nombre, siglas FROM public.division_mercaderia ORDER BY nombre";
    const centrosCostoQuery =
      "SELECT id_c_costo as id, codigo, nombre FROM contabilidad.c_costo WHERE estado = TRUE ORDER BY nombre";

    const [categorias, unidades, monedas, divisiones, centrosCosto] =
      await Promise.all([
        pool.query(categoriasQuery),
        pool.query(unidadesQuery),
        pool.query(monedasQuery),
        pool.query(divisionesQuery),
        pool.query(centrosCostoQuery),
      ]);

    res.json({
      categorias: categorias.rows,
      unidades_medida: unidades.rows,
      monedas: monedas.rows,
      divisiones_mercaderia: divisiones.rows,
      centros_costo: centrosCosto.rows,
      prioridades: [
        { value: "CRITICO", label: "Crítico" },
        { value: "NO CRITICO", label: "No Crítico" },
        { value: "OTROS", label: "Otros" },
      ],
      procedencias: [
        { value: "NACIONAL", label: "Nacional" },
        { value: "IMPORTADO", label: "Importado" },
      ],
    });
  } catch (error) {
    console.error("Error al obtener datos de formulario:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener tipos de existencia
const obtenerTiposExistencia = async (req, res) => {
  try {
    const query =
      "SELECT id_exist, codigo, nombre FROM public.tipo_existencia ORDER BY codigo";
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener tipos de existencia:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener todas las categorías
const obtenerCategorias = async (req, res) => {
  try {
    const query = `
      SELECT 
        c.id_categoria,
        c.codigo, 
        c.nombre, 
        c.siglas, 
        c.id_exist,
        c.ind_venta, 
        c.ind_critico, 
        c.ind_importacion, 
        c.ind_almac_x_compra,
        te.nombre as tipo_existencia_nombre
      FROM public.categoria c
      LEFT JOIN public.tipo_existencia te ON c.id_exist = te.id_exist
      ORDER BY c.nombre
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Crear una nueva categoría
const crearCategoria = async (req, res) => {
  try {
    const {
      codigo,
      nombre,
      siglas,
      id_exist,
      ind_venta,
      ind_critico,
      ind_importacion,
      ind_almac_x_compra,
    } = req.body;

    // Verificar si la categoría ya existe
    const existeQuery =
      "SELECT codigo FROM public.categoria WHERE codigo = $1 OR nombre = $2";
    const existeResult = await pool.query(existeQuery, [codigo, nombre]);

    if (existeResult.rows.length > 0) {
      return res.status(400).json({ error: "La categoría ya existe" });
    }

    const query = `
      INSERT INTO public.categoria (
        codigo, nombre, siglas, id_exist, 
        ind_venta, ind_critico, ind_importacion, ind_almac_x_compra
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      codigo,
      nombre,
      siglas,
      id_exist,
      ind_venta || "NO VENDIBLE",
      ind_critico || "NO CRITICO",
      ind_importacion || "NO SE IMPORTA",
      ind_almac_x_compra || "NO ING. ALMACEN",
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear categoría:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Actualizar una categoría
const actualizarCategoria = async (req, res) => {
  try {
    const { codigo } = req.params;
    const {
      nombre,
      siglas,
      id_exist,
      ind_venta,
      ind_critico,
      ind_importacion,
      ind_almac_x_compra,
    } = req.body;

    const query = `
      UPDATE public.categoria 
      SET 
        nombre = $1,
        siglas = $2,
        id_exist = $3,
        ind_venta = $4,
        ind_critico = $5,
        ind_importacion = $6,
        ind_almac_x_compra = $7
      WHERE codigo = $8
      RETURNING *
    `;

    const values = [
      nombre,
      siglas,
      id_exist,
      ind_venta,
      ind_critico,
      ind_importacion,
      ind_almac_x_compra,
      codigo,
    ];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar categoría:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Eliminar una categoría
const eliminarCategoria = async (req, res) => {
  try {
    const { codigo } = req.params;

    // Verificar si hay productos relacionados con esta categoría
    const productosQuery =
      "SELECT codigo FROM almacen.productos WHERE id_categoria = (SELECT id_categoria FROM public.categoria WHERE codigo = $1) LIMIT 1";
    const productosResult = await pool.query(productosQuery, [codigo]);

    if (productosResult.rows.length > 0) {
      return res.status(400).json({
        error:
          "No se puede eliminar la categoría porque tiene productos relacionados",
      });
    }

    const query = "DELETE FROM public.categoria WHERE codigo = $1 RETURNING *";
    const result = await pool.query(query, [codigo]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    res.json({ message: "Categoría eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar categoría:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener todos los almacenes
const obtenerAlmacenes = async (req, res) => {
  try {
    const query = `
      SELECT 
        a.id_alm,
        a.codigo, 
        a.nombre, 
        a.siglas, 
        a.id_categoria,
        c.nombre as categoria_nombre,
        a.tipo_alm
      FROM almacen.almacenes a
      LEFT JOIN public.categoria c ON a.id_categoria = c.id_categoria
      ORDER BY a.codigo
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener almacenes:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener un almacén por código
const obtenerAlmacenPorCodigo = async (req, res) => {
  try {
    const { codigo } = req.params;

    const query = `
      SELECT 
        a.id_alm,
        a.codigo, 
        a.nombre, 
        a.siglas, 
        a.id_categoria,
        c.nombre as categoria_nombre,
        a.tipo_alm
      FROM almacen.almacenes a
      LEFT JOIN public.categoria c ON a.id_categoria = c.id_categoria
      WHERE a.codigo = $1
    `;

    const result = await pool.query(query, [codigo]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Almacén no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener almacén:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Crear un nuevo almacén
const crearAlmacen = async (req, res) => {
  try {
    const { codigo, nombre, siglas, id_categoria, tipo_alm } = req.body;

    // Verificar si el almacén ya existe
    const existeQuery =
      "SELECT codigo FROM almacen.almacenes WHERE codigo = $1";
    const existeResult = await pool.query(existeQuery, [codigo]);

    if (existeResult.rows.length > 0) {
      return res.status(400).json({ error: "El código de almacén ya existe" });
    }

    const query = `
      INSERT INTO almacen.almacenes (
        codigo, nombre, siglas, id_categoria, tipo_alm
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      codigo,
      nombre,
      siglas,
      id_categoria,
      tipo_alm || "INTERNO",
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear almacén:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Actualizar un almacén
const actualizarAlmacen = async (req, res) => {
  try {
    const { codigo } = req.params;
    const { nombre, siglas, id_categoria, tipo_alm } = req.body;

    const query = `
      UPDATE almacen.almacenes 
      SET 
        nombre = $1,
        siglas = $2,
        id_categoria = $3,
        tipo_alm = $4
      WHERE codigo = $5
      RETURNING *
    `;

    const values = [nombre, siglas, id_categoria, tipo_alm, codigo];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Almacén no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar almacén:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Eliminar un almacén
const eliminarAlmacen = async (req, res) => {
  try {
    const { codigo } = req.params;

    // Verificar si hay documentos relacionados con este almacén
    const documentosQuery =
      "SELECT id_documento FROM public.documentos WHERE id_almacen = (SELECT id_alm FROM almacen.almacenes WHERE codigo = $1) LIMIT 1";
    const documentosResult = await pool.query(documentosQuery, [codigo]);

    if (documentosResult.rows.length > 0) {
      return res.status(400).json({
        error:
          "No se puede eliminar el almacén porque tiene documentos relacionados",
      });
    }

    const query = "DELETE FROM almacen.almacenes WHERE codigo = $1 RETURNING *";
    const result = await pool.query(query, [codigo]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Almacén no encontrado" });
    }

    res.json({ message: "Almacén eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar almacén:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Actualizar stock de un producto
const actualizarStock = async (req, res) => {
  try {
    const { codigo } = req.params;
    const { cantidad, tipo_movimiento } = req.body;

    // Verificar que el producto existe
    const productoQuery =
      "SELECT stock_actual FROM almacen.productos WHERE codigo = $1";
    const productoResult = await pool.query(productoQuery, [codigo]);

    if (productoResult.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const stockActual = parseFloat(productoResult.rows[0].stock_actual);
    let nuevoStock;

    if (tipo_movimiento === "INGRESO") {
      nuevoStock = stockActual + parseFloat(cantidad);
    } else if (tipo_movimiento === "SALIDA") {
      if (stockActual < parseFloat(cantidad)) {
        return res
          .status(400)
          .json({ error: "Stock insuficiente para la salida" });
      }
      nuevoStock = stockActual - parseFloat(cantidad);
    } else {
      return res.status(400).json({ error: "Tipo de movimiento inválido" });
    }

    const updateQuery = `
      UPDATE almacen.productos 
      SET stock_actual = $1, updated_at = CURRENT_TIMESTAMP
      WHERE codigo = $2
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [nuevoStock, codigo]);

    res.json({
      message: "Stock actualizado correctamente",
      producto: result.rows[0],
    });
  } catch (error) {
    console.error("Error al actualizar stock:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener productos con stock bajo
const obtenerProductosStockBajo = async (req, res) => {
  try {
    const query = `
      SELECT 
        p.codigo,
        p.descripcion,
        p.stock_actual,
        p.stock_minimo,
        (p.stock_minimo - p.stock_actual) as cantidad_faltante,
        c.nombre as categoria,
        p.prioridad
      FROM almacen.productos p
      LEFT JOIN public.categoria c ON p.id_categoria = c.id_categoria
      WHERE p.stock_actual <= p.stock_minimo 
        AND p.estado = TRUE
      ORDER BY p.prioridad DESC, cantidad_faltante DESC
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener productos con stock bajo:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// =====================================================
// CONSULTA DE STOCK (ALMACÉN) - basado en stock_almacen
// =====================================================

// GET /api/almacen/stock/consulta
// Query params:
// - q: string (busca por código o descripción)
// - almacen_id: int | "TODOS"
// - estado: "TODOS" | "SIN" | "BAJO" | "OK" | "SOBRE"
// - categoria_id: int (opcional)
// - solo_con_stock: "1" | "0" (opcional)
// - page: int (default 1)
// - limit: int (default 20)
const consultarStock = async (req, res) => {
  try {
    const {
      q,
      almacen_id,
      estado = "TODOS",
      categoria_id,
      solo_con_stock,
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 200);
    const offset = (pageNum - 1) * limitNum;

    const params = [];
    const where = [];

    // Búsqueda
    if (q && String(q).trim()) {
      params.push(`%${String(q).trim().toUpperCase()}%`);
      where.push(`(UPPER(p.codigo) LIKE $${params.length} OR UPPER(p.descripcion) LIKE $${params.length})`);
    }

    // Categoria
    if (categoria_id) {
      params.push(Number(categoria_id));
      where.push(`p.id_categoria = $${params.length}`);
    }

    // Estado del producto (activo)
    where.push(`p.estado = TRUE`);

    // Si hay almacén seleccionado: devolvemos stock de ese almacén
    // Si no: devolvemos stock total (sumando almacenes)
    const hasAlm = almacen_id && String(almacen_id).toUpperCase() !== "TODOS";

    if (hasAlm) {
      params.push(Number(almacen_id));
      where.push(`sa.almacen_id = $${params.length}`);
    }

    // Solo con stock
    if (solo_con_stock === "1") {
      where.push(`COALESCE(s.stock, 0) > 0`);
    }

    // Estado (SIN / BAJO / OK / SOBRE)
    // Definición:
    // - SIN: stock = 0
    // - BAJO: stock > 0 y stock <= stock_minimo
    // - OK: stock > stock_minimo y (stock_maximo es null o stock <= stock_maximo)
    // - SOBRE: stock_maximo no null y stock > stock_maximo
    if (estado && estado !== "TODOS") {
      if (estado === "SIN") where.push(`COALESCE(s.stock, 0) = 0`);
      if (estado === "BAJO") where.push(`COALESCE(s.stock, 0) > 0 AND COALESCE(s.stock, 0) <= COALESCE(p.stock_minimo, 0)`);
      if (estado === "OK") where.push(`
        COALESCE(s.stock, 0) > COALESCE(p.stock_minimo, 0)
        AND (p.stock_maximo IS NULL OR COALESCE(s.stock, 0) <= p.stock_maximo)
      `);
      if (estado === "SOBRE") where.push(`p.stock_maximo IS NOT NULL AND COALESCE(s.stock, 0) > p.stock_maximo`);
    }

    const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // Subconsulta s: stock por producto (total o por almacén)
    // - Si hay almacén seleccionado: tomamos ese stock
    // - Si no: sumamos por producto
    const stockSubquery = hasAlm
      ? `
        SELECT sa.id_producto, sa.stock
        FROM almacen.stock_almacen sa
      `
      : `
        SELECT sa.id_producto, SUM(sa.stock) AS stock
        FROM almacen.stock_almacen sa
        GROUP BY sa.id_producto
      `;

    // Query principal (lista)
    const listQuery = `
      WITH s AS (${stockSubquery})
      SELECT
        p.id_producto,
        p.codigo AS producto_codigo,
        p.descripcion AS producto_descripcion,
        um.siglas AS um,
        c.nombre AS categoria,
        p.stock_minimo,
        p.stock_maximo,
        COALESCE(s.stock, 0) AS stock,
        MAX(sa.actualizado_en) AS actualizado_en,
        ${
          hasAlm
            ? `a.nombre AS almacen_nombre, a.id_alm AS almacen_id`
            : `NULL::text AS almacen_nombre, NULL::int AS almacen_id`
        }
      FROM almacen.productos p
      LEFT JOIN s ON s.id_producto = p.id_producto
      LEFT JOIN public.unidades_medida um ON p.id_unidad = um.id_unidades
      LEFT JOIN public.categoria c ON p.id_categoria = c.id_categoria
      LEFT JOIN almacen.stock_almacen sa ON sa.id_producto = p.id_producto
      ${hasAlm ? `LEFT JOIN almacen.almacenes a ON a.id_alm = sa.almacen_id` : ``}
      ${whereSQL}
      GROUP BY
        p.id_producto, p.codigo, p.descripcion, um.siglas, c.nombre, p.stock_minimo, p.stock_maximo, s.stock
        ${hasAlm ? `, a.nombre, a.id_alm` : ``}
      ORDER BY p.codigo
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    // Query total (para paginación)
    const countQuery = `
      WITH s AS (${stockSubquery})
      SELECT COUNT(*)::int AS total
      FROM almacen.productos p
      LEFT JOIN s ON s.id_producto = p.id_producto
      LEFT JOIN almacen.stock_almacen sa ON sa.id_producto = p.id_producto
      ${hasAlm ? `LEFT JOIN almacen.almacenes a ON a.id_alm = sa.almacen_id` : ``}
      ${whereSQL}
    `;

    const [listResult, countResult] = await Promise.all([
      pool.query(listQuery, params),
      pool.query(countQuery, params),
    ]);

    const total = countResult.rows?.[0]?.total ?? 0;

    // KPIs rápidos
    const kpis = {
      total_items: total,
      sin_stock: 0,
      stock_bajo: 0,
      ok: 0,
      sobre_stock: 0,
    };

    // Nota: para KPIs exactos (con filtros) podrías hacer query aparte,
    // pero aquí lo dejamos rápido con el result actual (página actual).
    // Si quieres exacto global, lo hago luego con 1 query adicional.
    for (const r of listResult.rows) {
      const st = Number(r.stock || 0);
      const min = Number(r.stock_minimo || 0);
      const max = r.stock_maximo === null || r.stock_maximo === undefined ? null : Number(r.stock_maximo);

      if (st === 0) kpis.sin_stock++;
      else if (st > 0 && st <= min) kpis.stock_bajo++;
      else if (max !== null && st > max) kpis.sobre_stock++;
      else kpis.ok++;
    }

    return res.json({
      success: true,
      page: pageNum,
      limit: limitNum,
      total,
      kpis,
      rows: listResult.rows,
    });
  } catch (error) {
    console.error("consultarStock error:", error);
    return res.status(500).json({
      success: false,
      message: "Error consultando stock",
      error: error.message,
    });
  }
};

// GET /api/almacen/stock/producto/:id_producto/almacenes
// Devuelve stock del producto en cada almacén
const consultarStockPorProductoAlmacenes = async (req, res) => {
  try {
    const { id_producto } = req.params;
    const idProd = Number(id_producto);

    if (!idProd) {
      return res.status(400).json({ success: false, message: "id_producto inválido" });
    }

    const query = `
      SELECT
        a.id_alm AS almacen_id,
        a.codigo AS almacen_codigo,
        a.nombre AS almacen_nombre,
        a.siglas AS almacen_siglas,
        a.tipo_alm,
        sa.stock,
        sa.actualizado_en
      FROM almacen.stock_almacen sa
      INNER JOIN almacen.almacenes a
        ON a.id_alm = sa.almacen_id
      WHERE sa.id_producto = $1
        AND COALESCE(sa.stock, 0) > 0
      ORDER BY sa.stock DESC, a.codigo
    `;

    const result = await pool.query(query, [idProd]);

    return res.json({
      success: true,
      id_producto: idProd,
      rows: result.rows,
    });
  } catch (error) {
    console.error("consultarStockPorProductoAlmacenes error:", error);
    return res.status(500).json({
      success: false,
      message: "Error consultando stock por almacenes",
      error: error.message,
    });
  }
};



module.exports = {
  obtenerProductos,
  obtenerProductoPorCodigo,
  decodificarCodigoProducto,
  verificarCodigoExiste,
  obtenerEquivalenciasCodigo,
  crearProductoConDescripcionAuto,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  obtenerTiposExistencia,
  obtenerDatosFormulario,
  obtenerCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
  obtenerAlmacenes,
  obtenerAlmacenPorCodigo,
  crearAlmacen,
  actualizarAlmacen,
  eliminarAlmacen,
  actualizarStock,
  obtenerProductosStockBajo,

  consultarStock,
  consultarStockPorProductoAlmacenes,

  obtenerConfiguracionParrillas,
  actualizarConfiguracionParrillas,
  eliminarConfiguracionParrillas,
  guardarConfiguracionParrillas,

};
