const { pool } = require("../config/db");
const PDFDocument = require('pdfkit');

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
        u_updated.nombre_completo as actualizado_por_nombre
      FROM almacen.productos p
      LEFT JOIN public.categoria c ON p.id_categoria = c.id_categoria
      LEFT JOIN public.unidades_medida um ON p.id_unidad = um.id_unidades
      LEFT JOIN public.division_mercaderia dm ON p.id_div_merca = dm.id_div_merca
      LEFT JOIN contabilidad.cod_moneda mon ON p.moneda_id = mon.id_moneda
      LEFT JOIN contabilidad.c_costo cc ON p.centro_costo_id = cc.id_c_costo
      LEFT JOIN public.usuarios u_created ON p.created_by = u_created.id
      LEFT JOIN public.usuarios u_updated ON p.updated_by = u_updated.id
      WHERE p.codigo = $1
    `;

    const result = await pool.query(query, [codigo]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener producto:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const crearProducto = async (req, res) => {
  try {
    const {
      codigo,
      codigo_barras,
      descripcion,
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
    const existeQuery =
      "SELECT codigo FROM almacen.productos WHERE codigo = $1";
    const existeResult = await pool.query(existeQuery, [codigo]);

    if (existeResult.rows.length > 0) {
      return res.status(400).json({ error: "El código de producto ya existe" });
    }

     // Obtener información de la categoría para validaciones específicas
    const categoriaQuery = "SELECT nombre FROM public.categoria WHERE id_categoria = $1";
    const categoriaResult = await pool.query(categoriaQuery, [id_categoria]);
    
    if (categoriaResult.rows.length === 0) {
      return res.status(400).json({ error: "Categoría no válida" });
    }

    const categoriaNombre = categoriaResult.rows[0].nombre.toUpperCase();

    // Validaciones específicas por tipo de categoría
    if (categoriaNombre.includes('SERVICIO')) {
      // Para servicios, no se requiere unidad de medida ni stock
      if (!precio_venta && precio_venta !== 0) {
        return res.status(400).json({ error: "El precio de venta es requerido para servicios" });
      }
    } else {
      // Para otras categorías, validar unidad de medida
      if (!id_unidad) {
        return res.status(400).json({ error: "La unidad de medida es requerida" });
      }

      // Validar stock
      if (stock_minimo === undefined || stock_maximo === undefined || stock_actual === undefined) {
        return res.status(400).json({ error: "Los campos de stock son requeridos" });
      }

      if (Number(stock_maximo) < Number(stock_minimo)) {
        return res.status(400).json({ error: "El stock máximo no puede ser menor al stock mínimo" });
      }
    }

    // Validaciones específicas para Producto Terminado
    if (categoriaNombre.includes('PRODUCTO TERMINADO')) {
      if ((!precio_fabricacion && precio_fabricacion !== 0) || (!precio_venta && precio_venta !== 0)) {
        return res.status(400).json({ 
          error: "Precio de fabricación y precio de venta son requeridos para productos terminados" 
        });
      }
    }

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
      descripcion,
      id_unidad,
      id_categoria,
      id_div_merca || null,
      moneda_id || 1, // Default PEN
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
      true, // estado
      req.userId || 1,
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear producto:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const actualizarProducto = async (req, res) => {
  try {
    const { codigo } = req.params;
    const {
      codigo_barras,
      descripcion,
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
      estado,
    } = req.body;

    const query = `
      UPDATE almacen.productos 
      SET 
        codigo_barras = $1,
        descripcion = $2,
        id_unidad = $3,
        id_categoria = $4,
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
      RETURNING *
    `;

    const values = [
      codigo_barras,
      descripcion,
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
      estado !== undefined ? estado : true,
      req.userId || 1,
      codigo,
    ];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    res.status(500).json({ error: "Error interno del servidor" });
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
// NOTAS DE INGRESO DE ALMACÉN
// =====================================================

// Función auxiliar: Validar nota de ingreso según tipo
const validarNotaIngreso = (data, detalle = []) => {
  const errores = [];

  // Validaciones comunes
  if (!data.fecha_ingreso) {
    errores.push('Fecha de ingreso es obligatoria');
  }

  if (data.fecha_ingreso && new Date(data.fecha_ingreso) > new Date()) {
    errores.push('Fecha de ingreso no puede ser futura');
  }

  if (!data.orden_compra_id) {
    errores.push('Orden de compra es obligatoria');
  }

  if (!data.tipo || !['LOCAL', 'EXTERNO'].includes(data.tipo)) {
    errores.push('Tipo de documento inválido (debe ser LOCAL o EXTERNO)');
  }

  // Validaciones de detalle
  if (detalle.length === 0) {
    errores.push('Debe agregar al menos un producto');
  }

  detalle.forEach((item, index) => {
    const itemNum = item.numitem || index + 1;

    if (!item.producto_codigo) {
      errores.push(`Item ${itemNum}: código de producto es obligatorio`);
    }

    if (!item.almacen_id) {
      errores.push(`Item ${itemNum}: debe seleccionar un almacén destino`);
    }

    if (!item.cantidad_ingresada || item.cantidad_ingresada <= 0) {
      errores.push(`Item ${itemNum}: cantidad debe ser mayor a 0`);
    }

    // Validar control de calidad
    const conforme = parseFloat(item.cantidad_conforme || 0);
    const noConforme = parseFloat(item.cantidad_no_conforme || 0);
    const ingresada = parseFloat(item.cantidad_ingresada || 0);

    if (Math.abs(conforme + noConforme - ingresada) > 0.001) {
      errores.push(
        `Item ${itemNum}: la suma de cantidad conforme (${conforme}) y no conforme (${noConforme}) debe ser igual a cantidad ingresada (${ingresada})`
      );
    }

    // Si hay productos no conformes, validar campos adicionales
    if (noConforme > 0) {
      if (!item.almacen_no_conforme_id) {
        errores.push(`Item ${itemNum}: debe seleccionar almacén para productos no conformes`);
      }
      if (!item.motivo_rechazo || item.motivo_rechazo.trim() === '') {
        errores.push(`Item ${itemNum}: debe indicar motivo de rechazo para productos no conformes`);
      }
    }
  });

  return errores;
};

// Función auxiliar: Validar cantidades contra OC
const validarCantidadesContraOC = async (detalleItems) => {
  const errores = [];

  for (const item of detalleItems) {
    const itemNum = item.numitem || 1;

    // Obtener cantidad pendiente de la OC
    const query = `
      SELECT 
        ocd.cantidad_solicitada,
        ocd.cantidad_recibida,
        (ocd.cantidad_solicitada - ocd.cantidad_recibida) as cantidad_pendiente
      FROM compras.orden_compra_detalle ocd
      WHERE ocd.id = $1
    `;

    const result = await pool.query(query, [item.orden_compra_detalle_id]);

    if (result.rows.length === 0) {
      errores.push(`Item ${itemNum}: detalle de orden de compra no encontrado`);
      continue;
    }

    const { cantidad_pendiente } = result.rows[0];
    const cantidadIngresada = parseFloat(item.cantidad_ingresada);

    if (cantidadIngresada > parseFloat(cantidad_pendiente)) {
      errores.push(
        `Item ${itemNum}: cantidad a ingresar (${cantidadIngresada}) excede la cantidad pendiente (${cantidad_pendiente})`
      );
    }
  }

  return errores;
};

// Obtener órdenes de compra disponibles para crear notas de ingreso
const obtenerOrdenesCompraDisponibles = async (req, res) => {
  try {
    const { tipo } = req.query;

    let query = `
      SELECT 
        oc.id,
        oc.numero,
        oc.fecha,
        oc.tipo,
        oc.estado,
        oc.total,
        oc.moneda_id,
        p.id_prov as proveedor_id,
        p.razon_social as proveedor_razon_social,
        p.nro_documento as proveedor_documento,
        mon.codigo as moneda_codigo,
        mon.simbolo as moneda_simbolo
      FROM compras.orden_compra oc
      LEFT JOIN compras.proveedores p ON oc.proveedor_id = p.id_prov
      LEFT JOIN contabilidad.cod_moneda mon ON oc.moneda_id = mon.id_moneda
      WHERE oc.estado IN ('PENDIENTE', 'PARCIAL')
    `;

    const params = [];
    let paramCount = 0;

    // Filtrar por tipo (LOCAL/EXTERNO)
    if (tipo) {
      paramCount++;
      query += ` AND oc.tipo = $${paramCount}`;
      params.push(tipo);
    }

    query += ` ORDER BY oc.fecha DESC, oc.numero DESC`;

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener órdenes de compra disponibles:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener detalle completo de una nota de ingreso
const obtenerNotaIngresoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener datos de la nota de ingreso
    const notaQuery = `
      SELECT 
        ni.*,
        oc.numero as orden_compra_numero,
        oc.fecha as orden_compra_fecha,
        oc.estado as orden_compra_estado,
        oc.total as orden_compra_total,
        oc.moneda_id as orden_compra_moneda_id,
        p.id_prov as proveedor_id,
        p.codigo as proveedor_codigo,
        p.nro_documento as proveedor_documento,
        p.razon_social as proveedor_razon_social,
        p.nomb_comercial as proveedor_nombre_comercial,
        p.direccion as proveedor_direccion,
        p.telefono1 as proveedor_telefono,
        p.email as proveedor_email,
        pa.nombre as proveedor_pais,
        mon.codigo as moneda_codigo,
        mon.simbolo as moneda_simbolo,
        u_created.nombre_completo as creado_por_nombre
      FROM almacen.notas_ingreso ni
      LEFT JOIN compras.orden_compra oc ON ni.orden_compra_id = oc.id
      LEFT JOIN compras.proveedores p ON ni.proveedor_id = p.id_prov
      LEFT JOIN public.paises pa ON p.id_pais = pa.id
      LEFT JOIN contabilidad.cod_moneda mon ON oc.moneda_id = mon.id_moneda
      LEFT JOIN public.usuarios u_created ON ni.created_by = u_created.id
      WHERE ni.id = $1
    `;

    const notaResult = await pool.query(notaQuery, [id]);

    if (notaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Nota de ingreso no encontrada' });
    }

    const nota = notaResult.rows[0];

    // Obtener detalle de productos
    const detalleQuery = `
      SELECT 
        nid.*,
        p.descripcion as producto_descripcion,
        p.codigo_barras as producto_codigo_barras,
        um.nombre as unidad_medida_nombre,
        um.siglas as unidad_medida_siglas,
        a.nombre as almacen_nombre,
        a.codigo as almacen_codigo,
        anc.nombre as almacen_no_conforme_nombre,
        anc.codigo as almacen_no_conforme_codigo,
        ocd.cantidad_solicitada,
        ocd.cantidad_recibida,
        ocd.precio_unitario
      FROM almacen.notas_ingreso_detalle nid
      LEFT JOIN almacen.productos p ON nid.producto_codigo = p.codigo
      LEFT JOIN public.unidades_medida um ON p.id_unidad = um.id_unidades
      LEFT JOIN almacen.almacenes a ON nid.almacen_id = a.id_alm
      LEFT JOIN almacen.almacenes anc ON nid.almacen_no_conforme_id = anc.id_alm
      LEFT JOIN compras.orden_compra_detalle ocd ON nid.orden_compra_detalle_id = ocd.id
      WHERE nid.nota_ingreso_id = $1
      ORDER BY nid.numitem
    `;

    const detalleResult = await pool.query(detalleQuery, [id]);

    // Combinar datos
    const notaCompleta = {
      ...nota,
      detalle: detalleResult.rows
    };

    res.json(notaCompleta);
  } catch (error) {
    console.error('Error al obtener nota de ingreso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener listado de notas de ingreso con filtros
const obtenerNotasIngreso = async (req, res) => {
  try {
    const { tipo, estado, fecha_desde, fecha_hasta, buscar, page = 1, pageSize = 10 } = req.query;

    let query = `
      SELECT 
        ni.id,
        ni.numero,
        ni.fecha_ingreso,
        ni.tipo,
        ni.estado,
        ni.observaciones,
        ni.created_at,
        ni.updated_at,
        oc.numero as orden_compra_numero,
        oc.id as orden_compra_id,
        oc.fecha as orden_compra_fecha,
        p.razon_social as proveedor_razon_social,
        p.nro_documento as proveedor_documento,
        p.id_prov as proveedor_id,
        u_created.nombre_completo as creado_por_nombre
      FROM almacen.notas_ingreso ni
      LEFT JOIN compras.orden_compra oc ON ni.orden_compra_id = oc.id
      LEFT JOIN compras.proveedores p ON ni.proveedor_id = p.id_prov
      LEFT JOIN public.usuarios u_created ON ni.created_by = u_created.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    // Filtro por tipo (LOCAL/EXTERNO)
    if (tipo) {
      paramCount++;
      query += ` AND ni.tipo = $${paramCount}`;
      params.push(tipo);
    }

    // Filtro por estado
    if (estado) {
      paramCount++;
      query += ` AND ni.estado = $${paramCount}`;
      params.push(estado);
    }

    // Filtro por rango de fechas
    if (fecha_desde) {
      paramCount++;
      query += ` AND ni.fecha_ingreso >= $${paramCount}`;
      params.push(fecha_desde);
    }

    if (fecha_hasta) {
      paramCount++;
      query += ` AND ni.fecha_ingreso <= $${paramCount}`;
      params.push(fecha_hasta);
    }

    // Búsqueda por número, OC o proveedor
    if (buscar) {
      paramCount++;
      query += ` AND (
        ni.numero ILIKE $${paramCount} OR 
        oc.numero ILIKE $${paramCount} OR 
        p.razon_social ILIKE $${paramCount}
      )`;
      params.push(`%${buscar}%`);
    }

    // Ordenar por fecha descendente
    query += ` ORDER BY ni.fecha_ingreso DESC, ni.numero DESC`;

    // Paginación
    const offset = (page - 1) * pageSize;
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(pageSize);
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await pool.query(query, params);

    // Obtener total de registros para paginación
    let countQuery = `
      SELECT COUNT(*) as total
      FROM almacen.notas_ingreso ni
      LEFT JOIN compras.orden_compra oc ON ni.orden_compra_id = oc.id
      LEFT JOIN compras.proveedores p ON ni.proveedor_id = p.id_prov
      WHERE 1=1
    `;

    const countParams = [];
    let countParamCount = 0;

    if (tipo) {
      countParamCount++;
      countQuery += ` AND ni.tipo = $${countParamCount}`;
      countParams.push(tipo);
    }

    if (estado) {
      countParamCount++;
      countQuery += ` AND ni.estado = $${countParamCount}`;
      countParams.push(estado);
    }

    if (fecha_desde) {
      countParamCount++;
      countQuery += ` AND ni.fecha_ingreso >= $${countParamCount}`;
      countParams.push(fecha_desde);
    }

    if (fecha_hasta) {
      countParamCount++;
      countQuery += ` AND ni.fecha_ingreso <= $${countParamCount}`;
      countParams.push(fecha_hasta);
    }

    if (buscar) {
      countParamCount++;
      countQuery += ` AND (
        ni.numero ILIKE $${countParamCount} OR 
        oc.numero ILIKE $${countParamCount} OR 
        p.razon_social ILIKE $${countParamCount}
      )`;
      countParams.push(`%${buscar}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      data: result.rows,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error('Error al obtener notas de ingreso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Crear nota de ingreso en estado BORRADOR
const crearNotaIngreso = async (req, res) => {
  const client = await pool.connect();
  
  try {
    console.log('=== CREAR NOTA DE INGRESO ===');
    console.log('Body recibido:', JSON.stringify(req.body, null, 2));
    
    // Extraer solo los campos necesarios (estructura simplificada)
    const {
      fecha_ingreso,
      tipo,
      orden_compra_id,
      proveedor_id,
      observaciones,
      detalle
    } = req.body;
    
    console.log('Detalle extraído:', detalle);

    // Validar campos obligatorios y detalle
    const erroresValidacion = validarNotaIngreso(req.body, detalle || []);
    if (erroresValidacion.length > 0) {
      return res.status(400).json({ 
        error: 'Errores de validación', 
        errores: erroresValidacion 
      });
    }

    // Validar cantidades contra OC
    const erroresCantidades = await validarCantidadesContraOC(detalle);
    if (erroresCantidades.length > 0) {
      return res.status(400).json({ 
        error: 'Errores de validación de cantidades', 
        errores: erroresCantidades 
      });
    }

    // Iniciar transacción
    await client.query('BEGIN');

    // Insertar nota de ingreso (el número se genera automáticamente por el trigger)
    const insertNotaQuery = `
      INSERT INTO almacen.notas_ingreso (
        fecha_ingreso,
        tipo,
        orden_compra_id,
        proveedor_id,
        observaciones,
        estado,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const notaValues = [
      fecha_ingreso,
      tipo,
      orden_compra_id,
      proveedor_id,
      observaciones || null,
      'BORRADOR',
      req.userId || 1
    ];

    console.log('Ejecutando INSERT nota con valores:', notaValues);
    const notaResult = await client.query(insertNotaQuery, notaValues);
    console.log('Nota creada:', notaResult.rows[0]);
    const notaIngreso = notaResult.rows[0];

    // Insertar detalle de productos
    console.log('Insertando detalle, cantidad de items:', detalle.length);
    for (const item of detalle) {
      const insertDetalleQuery = `
        INSERT INTO almacen.notas_ingreso_detalle (
          nota_ingreso_id,
          numitem,
          orden_compra_detalle_id,
          producto_codigo,
          almacen_id,
          cantidad_ingresada,
          cantidad_conforme,
          cantidad_no_conforme,
          estado_calidad,
          motivo_rechazo,
          almacen_no_conforme_id,
          observaciones
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `;

      const detalleValues = [
        notaIngreso.id,
        item.numitem,
        item.orden_compra_detalle_id,
        item.producto_codigo,
        item.almacen_id,
        item.cantidad_ingresada,
        item.cantidad_conforme,
        item.cantidad_no_conforme || 0,
        item.cantidad_no_conforme > 0 ? 'OBSERVADO' : 'CONFORME',
        item.motivo_rechazo || null,
        item.almacen_no_conforme_id || null,
        item.observaciones || null
      ];

      console.log('Insertando item:', detalleValues);
      await client.query(insertDetalleQuery, detalleValues);
      console.log('Item insertado correctamente');
    }

    // Confirmar transacción
    await client.query('COMMIT');

    // Obtener nota completa con detalle
    const notaCompleta = await obtenerNotaCompletaPorId(notaIngreso.id);

    res.status(201).json({
      message: 'Nota de ingreso creada exitosamente',
      nota: notaCompleta
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear nota de ingreso:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    client.release();
  }
};

// Actualizar nota de ingreso (solo si está en BORRADOR)
const actualizarNotaIngreso = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    
    // Extraer solo los campos necesarios (estructura simplificada)
    const {
      fecha_ingreso,
      tipo,
      orden_compra_id,
      proveedor_id,
      observaciones,
      detalle
    } = req.body;

    // Verificar que la nota existe y está en estado BORRADOR
    const verificarQuery = 'SELECT estado FROM almacen.notas_ingreso WHERE id = $1';
    const verificarResult = await client.query(verificarQuery, [id]);

    if (verificarResult.rows.length === 0) {
      return res.status(404).json({ error: 'Nota de ingreso no encontrada' });
    }

    if (verificarResult.rows[0].estado !== 'BORRADOR') {
      return res.status(400).json({ 
        error: 'Solo se pueden editar notas en estado BORRADOR' 
      });
    }

    // Validar campos obligatorios y detalle
    const erroresValidacion = validarNotaIngreso(req.body, detalle || []);
    if (erroresValidacion.length > 0) {
      return res.status(400).json({ 
        error: 'Errores de validación', 
        errores: erroresValidacion 
      });
    }

    // Validar cantidades contra OC
    const erroresCantidades = await validarCantidadesContraOC(detalle);
    if (erroresCantidades.length > 0) {
      return res.status(400).json({ 
        error: 'Errores de validación de cantidades', 
        errores: erroresCantidades 
      });
    }

    // Iniciar transacción
    await client.query('BEGIN');

    // Actualizar nota de ingreso (solo campos necesarios)
    const updateNotaQuery = `
      UPDATE almacen.notas_ingreso 
      SET 
        fecha_ingreso = $1,
        tipo = $2,
        orden_compra_id = $3,
        proveedor_id = $4,
        observaciones = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `;

    const notaValues = [
      fecha_ingreso,
      tipo,
      orden_compra_id,
      proveedor_id,
      observaciones || null,
      id
    ];

    await client.query(updateNotaQuery, notaValues);

    // Eliminar detalle anterior
    const deleteDetalleQuery = 'DELETE FROM almacen.notas_ingreso_detalle WHERE nota_ingreso_id = $1';
    await client.query(deleteDetalleQuery, [id]);

    // Insertar nuevo detalle (solo campos necesarios)
    for (const item of detalle) {
      const insertDetalleQuery = `
        INSERT INTO almacen.notas_ingreso_detalle (
          nota_ingreso_id,
          numitem,
          orden_compra_detalle_id,
          producto_codigo,
          almacen_id,
          cantidad_ingresada,
          cantidad_conforme,
          cantidad_no_conforme,
          estado_calidad,
          motivo_rechazo,
          almacen_no_conforme_id,
          observaciones
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `;

      const detalleValues = [
        id,
        item.numitem,
        item.orden_compra_detalle_id,
        item.producto_codigo,
        item.almacen_id,
        item.cantidad_ingresada,
        item.cantidad_conforme,
        item.cantidad_no_conforme || 0,
        item.cantidad_no_conforme > 0 ? 'OBSERVADO' : 'CONFORME',
        item.motivo_rechazo || null,
        item.almacen_no_conforme_id || null,
        item.observaciones || null
      ];

      await client.query(insertDetalleQuery, detalleValues);
    }

    // Confirmar transacción
    await client.query('COMMIT');

    // Obtener nota completa con detalle
    const notaCompleta = await obtenerNotaCompletaPorId(id);

    res.json({
      message: 'Nota de ingreso actualizada exitosamente',
      nota: notaCompleta
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al actualizar nota de ingreso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    client.release();
  }
};

// Función auxiliar: Obtener nota completa por ID (para uso interno)
const obtenerNotaCompletaPorId = async (id) => {
  const notaQuery = `
    SELECT 
      ni.*,
      oc.numero as orden_compra_numero,
      p.razon_social as proveedor_razon_social
    FROM almacen.notas_ingreso ni
    LEFT JOIN compras.orden_compra oc ON ni.orden_compra_id = oc.id
    LEFT JOIN compras.proveedores p ON ni.proveedor_id = p.id_prov
    WHERE ni.id = $1
  `;

  const notaResult = await pool.query(notaQuery, [id]);
  const nota = notaResult.rows[0];

  const detalleQuery = `
    SELECT 
      nid.*,
      p.descripcion as producto_descripcion
    FROM almacen.notas_ingreso_detalle nid
    LEFT JOIN almacen.productos p ON nid.producto_codigo = p.codigo
    WHERE nid.nota_ingreso_id = $1
    ORDER BY nid.numitem
  `;

  const detalleResult = await pool.query(detalleQuery, [id]);

  return {
    ...nota,
    detalle: detalleResult.rows
  };
};

// Función auxiliar: Actualizar estado de orden de compra según cantidades pendientes
const actualizarEstadoOrdenCompra = async (client, ordenCompraId) => {
  // Query para verificar si todos los items tienen cantidad_pendiente = 0
  const query = `
    SELECT 
      COUNT(*) as total_items,
      SUM(CASE WHEN (cantidad_solicitada - cantidad_recibida) = 0 THEN 1 ELSE 0 END) as items_completos
    FROM compras.orden_compra_detalle
    WHERE orden_compra_id = $1
  `;

  const result = await client.query(query, [ordenCompraId]);
  const { total_items, items_completos } = result.rows[0];

  let nuevoEstado;

  // Si todos los items están completos, marcar como ENTREGADA
  if (parseInt(total_items) === parseInt(items_completos)) {
    nuevoEstado = 'ENTREGADA';
  } else {
    // Si al menos uno está pendiente, marcar como PARCIAL
    nuevoEstado = 'PARCIAL';
  }

  // Actualizar estado de la orden de compra
  const updateQuery = `
    UPDATE compras.orden_compra
    SET 
      estado = $1,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
  `;

  await client.query(updateQuery, [nuevoEstado, ordenCompraId]);

  return nuevoEstado;
};

const confirmarNotaIngreso = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const userId = req.userId || 1;

    // BEGIN TRANSACTION
    await client.query('BEGIN');

    // 1. Obtener la nota de ingreso y validar estado
    const notaQuery = `
      SELECT ni.*, oc.tipo as orden_tipo
      FROM almacen.notas_ingreso ni
      LEFT JOIN compras.orden_compra oc ON ni.orden_compra_id = oc.id
      WHERE ni.id = $1
    `;
    const notaResult = await client.query(notaQuery, [id]);

    if (notaResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Nota de ingreso no encontrada' });
    }

    const nota = notaResult.rows[0];

    // Validar que esté en estado BORRADOR
    if (nota.estado !== 'BORRADOR') {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: `No se puede confirmar una nota en estado ${nota.estado}. Solo se pueden confirmar notas en estado BORRADOR.` 
      });
    }

    // 2. Obtener detalle de la nota
    const detalleQuery = `
      SELECT * FROM almacen.notas_ingreso_detalle
      WHERE nota_ingreso_id = $1
      ORDER BY numitem
    `;
    const detalleResult = await client.query(detalleQuery, [id]);
    const detalle = detalleResult.rows;

    // 3. Ejecutar validaciones de negocio
    const erroresValidacion = validarNotaIngreso(nota, detalle);
    if (erroresValidacion.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Errores de validación',
        errores: erroresValidacion 
      });
    }

    // 4. Validar cantidades contra OC
    const erroresCantidades = await validarCantidadesContraOC(detalle);
    if (erroresCantidades.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Errores de validación de cantidades',
        errores: erroresCantidades 
      });
    }

    // 5. Actualizar estado de la nota a CONFIRMADA
    const updateNotaQuery = `
      UPDATE almacen.notas_ingreso
      SET 
        estado = 'CONFIRMADA',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await client.query(updateNotaQuery, [id]);

    // 6. Procesar cada item del detalle
    for (const item of detalle) {
      const cantidadConforme = parseFloat(item.cantidad_conforme || 0);
      const cantidadNoConforme = parseFloat(item.cantidad_no_conforme || 0);
      const cantidadIngresada = parseFloat(item.cantidad_ingresada || 0);

      // 6.1 Actualizar stock del producto (solo cantidad conforme)
      if (cantidadConforme > 0) {
        const updateStockQuery = `
          UPDATE almacen.productos
          SET 
            stock_actual = stock_actual + $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE codigo = $2
        `;
        await client.query(updateStockQuery, [cantidadConforme, item.producto_codigo]);
      }

      // 6.2 Si hay productos no conformes, actualizar stock del almacén de no conformes
      if (cantidadNoConforme > 0 && item.almacen_no_conforme_id) {
        // Actualizar stock en almacén de no conformes
        const updateStockNoConformeQuery = `
          UPDATE almacen.productos
          SET 
            stock_actual = stock_actual + $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE codigo = $2
        `;
        await client.query(updateStockNoConformeQuery, [cantidadNoConforme, item.producto_codigo]);
      }

      // 6.3 Actualizar cantidad_recibida en orden_compra_detalle
      const updateOCDetalleQuery = `
        UPDATE compras.orden_compra_detalle
        SET 
          cantidad_recibida = cantidad_recibida + $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `;
      await client.query(updateOCDetalleQuery, [cantidadIngresada, item.orden_compra_detalle_id]);
    }

    // 7. Actualizar estado de la orden de compra
    await actualizarEstadoOrdenCompra(client, nota.orden_compra_id);

    // COMMIT TRANSACTION
    await client.query('COMMIT');

    // 8. Obtener la nota actualizada con todos los datos
    const notaActualizada = await obtenerNotaCompletaPorId(id);

    res.json({
      message: 'Nota de ingreso confirmada exitosamente',
      nota: notaActualizada
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al confirmar nota de ingreso:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor al confirmar nota de ingreso',
      detalle: error.message 
    });
  } finally {
    client.release();
  }
};

const anularNotaIngreso = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const userId = req.userId || 1;

    // BEGIN TRANSACTION
    await client.query('BEGIN');

    // 1. Obtener la nota de ingreso y validar estado
    const notaQuery = `
      SELECT ni.*, oc.tipo as orden_tipo
      FROM almacen.notas_ingreso ni
      LEFT JOIN compras.orden_compra oc ON ni.orden_compra_id = oc.id
      WHERE ni.id = $1
    `;
    const notaResult = await client.query(notaQuery, [id]);

    if (notaResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Nota de ingreso no encontrada' });
    }

    const nota = notaResult.rows[0];

    // Validar que esté en estado CONFIRMADA
    if (nota.estado !== 'CONFIRMADA') {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: `No se puede anular una nota en estado ${nota.estado}. Solo se pueden anular notas en estado CONFIRMADA.` 
      });
    }

    // 2. Obtener detalle de la nota
    const detalleQuery = `
      SELECT * FROM almacen.notas_ingreso_detalle
      WHERE nota_ingreso_id = $1
      ORDER BY numitem
    `;
    const detalleResult = await client.query(detalleQuery, [id]);
    const detalle = detalleResult.rows;

    // 3. Actualizar estado de la nota a ANULADA
    const updateNotaQuery = `
      UPDATE almacen.notas_ingreso
      SET 
        estado = 'ANULADA',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await client.query(updateNotaQuery, [id]);

    // 4. Revertir movimientos para cada item del detalle
    for (const item of detalle) {
      const cantidadConforme = parseFloat(item.cantidad_conforme || 0);
      const cantidadNoConforme = parseFloat(item.cantidad_no_conforme || 0);
      const cantidadIngresada = parseFloat(item.cantidad_ingresada || 0);

      // 4.1 Revertir stock del producto (restar cantidad conforme)
      if (cantidadConforme > 0) {
        const revertStockQuery = `
          UPDATE almacen.productos
          SET 
            stock_actual = stock_actual - $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE codigo = $2
        `;
        await client.query(revertStockQuery, [cantidadConforme, item.producto_codigo]);

        // Validar que el stock no quede negativo
        const validarStockQuery = `
          SELECT stock_actual FROM almacen.productos WHERE codigo = $1
        `;
        const stockResult = await client.query(validarStockQuery, [item.producto_codigo]);
        
        if (stockResult.rows.length > 0 && parseFloat(stockResult.rows[0].stock_actual) < 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ 
            error: `No se puede anular la nota: el producto ${item.producto_codigo} quedaría con stock negativo` 
          });
        }
      }

      // 4.2 Si hay productos no conformes, revertir stock del almacén de no conformes
      if (cantidadNoConforme > 0 && item.almacen_no_conforme_id) {
        const revertStockNoConformeQuery = `
          UPDATE almacen.productos
          SET 
            stock_actual = stock_actual - $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE codigo = $2
        `;
        await client.query(revertStockNoConformeQuery, [cantidadNoConforme, item.producto_codigo]);

        // Validar que el stock no quede negativo
        const validarStockQuery = `
          SELECT stock_actual FROM almacen.productos WHERE codigo = $1
        `;
        const stockResult = await client.query(validarStockQuery, [item.producto_codigo]);
        
        if (stockResult.rows.length > 0 && parseFloat(stockResult.rows[0].stock_actual) < 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ 
            error: `No se puede anular la nota: el producto ${item.producto_codigo} quedaría con stock negativo en almacén de no conformes` 
          });
        }
      }

      // 4.3 Revertir cantidad_recibida en orden_compra_detalle
      const revertOCDetalleQuery = `
        UPDATE compras.orden_compra_detalle
        SET 
          cantidad_recibida = cantidad_recibida - $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `;
      await client.query(revertOCDetalleQuery, [cantidadIngresada, item.orden_compra_detalle_id]);
    }

    // 5. Recalcular estado de la orden de compra
    await actualizarEstadoOrdenCompra(client, nota.orden_compra_id);

    // COMMIT TRANSACTION
    await client.query('COMMIT');

    // 6. Obtener la nota actualizada con todos los datos
    const notaActualizada = await obtenerNotaCompletaPorId(id);

    res.json({
      message: 'Nota de ingreso anulada exitosamente',
      nota: notaActualizada
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al anular nota de ingreso:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor al anular nota de ingreso',
      detalle: error.message 
    });
  } finally {
    client.release();
  }
};

const eliminarNotaIngreso = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;

    // BEGIN TRANSACTION
    await client.query('BEGIN');

    // 1. Obtener la nota de ingreso y validar estado
    const notaQuery = `
      SELECT * FROM almacen.notas_ingreso
      WHERE id = $1
    `;
    const notaResult = await client.query(notaQuery, [id]);

    if (notaResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Nota de ingreso no encontrada' });
    }

    const nota = notaResult.rows[0];

    // Validar que esté en estado BORRADOR
    if (nota.estado !== 'BORRADOR') {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: `Solo se pueden eliminar notas en estado BORRADOR. Estado actual: ${nota.estado}` 
      });
    }

    // 2. Eliminar detalle de la nota
    const deleteDetalleQuery = `
      DELETE FROM almacen.notas_ingreso_detalle
      WHERE nota_ingreso_id = $1
    `;
    await client.query(deleteDetalleQuery, [id]);

    // 3. Eliminar la nota de ingreso
    const deleteNotaQuery = `
      DELETE FROM almacen.notas_ingreso
      WHERE id = $1
    `;
    await client.query(deleteNotaQuery, [id]);

    // COMMIT TRANSACTION
    await client.query('COMMIT');

    res.json({
      message: 'Nota de ingreso eliminada exitosamente'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al eliminar nota de ingreso:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor al eliminar nota de ingreso',
      detalle: error.message 
    });
  } finally {
    client.release();
  }
};

const generarPDFNotaIngreso = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Validar que la nota esté CONFIRMADA
    const notaQuery = `
      SELECT 
        ni.*,
        oc.numero as orden_compra_numero,
        oc.fecha as orden_compra_fecha,
        p.nro_documento as proveedor_ruc,
        p.razon_social as proveedor_razon_social,
        p.direccion as proveedor_direccion,
        p.telefono1 as proveedor_telefono,
        pa.nombre as proveedor_pais
      FROM almacen.notas_ingreso ni
      LEFT JOIN compras.orden_compra oc ON ni.orden_compra_id = oc.id
      LEFT JOIN compras.proveedores p ON ni.proveedor_id = p.id_prov
      LEFT JOIN public.paises pa ON p.id_pais = pa.id
      WHERE ni.id = $1
    `;

    const notaResult = await pool.query(notaQuery, [id]);

    if (notaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Nota de ingreso no encontrada' });
    }

    const nota = notaResult.rows[0];

    // Validar que esté CONFIRMADA
    if (nota.estado !== 'CONFIRMADA') {
      return res.status(400).json({ 
        error: 'Solo se puede generar PDF de notas confirmadas',
        estado_actual: nota.estado
      });
    }

    // 2. Obtener detalle de productos
    const detalleQuery = `
      SELECT 
        nid.*,
        p.descripcion as producto_descripcion,
        um.siglas as unidad_medida_abrev,
        alm.nombre as almacen_nombre,
        alm_nc.nombre as almacen_no_conforme_nombre
      FROM almacen.notas_ingreso_detalle nid
      LEFT JOIN almacen.productos p ON nid.producto_codigo = p.codigo
      LEFT JOIN public.unidades_medida um ON p.id_unidad = um.id_unidades
      LEFT JOIN almacen.almacenes alm ON nid.almacen_id = alm.id_alm
      LEFT JOIN almacen.almacenes alm_nc ON nid.almacen_no_conforme_id = alm_nc.id_alm
      WHERE nid.nota_ingreso_id = $1
      ORDER BY nid.numitem
    `;

    const detalleResult = await pool.query(detalleQuery, [id]);
    const detalles = detalleResult.rows;

    // 3. Configurar cabeceras HTTP
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=${nota.numero}.pdf`);

    // 4. Crear documento PDF
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

    // --- Recuadro de documento ---
    doc.rect(390, yPosition - 5, 155, 70)
      .lineWidth(1)
      .stroke('#000000');

    const tipoDocumento = nota.tipo === 'LOCAL' ? 'NOTA INGRESO COMPRA LOCAL' : 'NOTA INGRESO COMPRA EXTERIOR';
    doc.fontSize(11)
      .font('Helvetica-Bold')
      .text(tipoDocumento, 395, yPosition + 2, { width: 145, align: 'center' });

    doc.fontSize(10)
      .font('Helvetica')
      .text(`${nota.numero}`, 395, yPosition + 25, { width: 145, align: 'center' });

    doc.fontSize(9)
      .text(`Fecha: ${new Date(nota.fecha_ingreso).toLocaleDateString('es-PE')}`, 395, yPosition + 40, { width: 145, align: 'center' })
      .text(`OC: ${nota.orden_compra_numero}`, 395, yPosition + 53, { width: 145, align: 'center' });

    // Línea separadora
    yPosition = 135;
    doc.moveTo(50, yPosition)
      .lineTo(545, yPosition)
      .strokeColor('#000000')
      .lineWidth(0.5)
      .stroke();

    // --- DATOS DEL PROVEEDOR ---
    yPosition += 15;
    doc.fontSize(10)
      .font('Helvetica-Bold')
      .text('DATOS DEL PROVEEDOR', 50, yPosition);

    yPosition += 15;

    const proveedorDatos = nota.tipo === 'LOCAL' 
      ? [
          { label: 'RUC', value: nota.proveedor_ruc || 'N/A' },
          { label: 'Razón Social', value: nota.proveedor_razon_social || 'N/A' },
          { label: 'Dirección', value: nota.proveedor_direccion || 'N/A' },
          { label: 'Teléfono', value: nota.proveedor_telefono || 'N/A' }
        ]
      : [
          { label: 'Tax ID', value: nota.proveedor_tax_id || 'N/A' },
          { label: 'Razón Social', value: nota.proveedor_razon_social || 'N/A' },
          { label: 'País', value: nota.proveedor_pais || 'N/A' },
          { label: 'Dirección', value: nota.proveedor_direccion || 'N/A' }
        ];

    const colLeftX = 55;
    const colRightX = 300;
    let colY = yPosition + 15;

    for (let i = 0; i < proveedorDatos.length; i += 2) {
      const left = proveedorDatos[i];
      const right = proveedorDatos[i + 1];

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

    // --- DOCUMENTOS DE RECEPCIÓN ---
    yPosition = colY + 10;
    doc.moveTo(50, yPosition)
      .lineTo(545, yPosition)
      .strokeColor('#cccccc')
      .lineWidth(0.5)
      .stroke();

    // --- DETALLE DE PRODUCTOS ---
    // (Sección de documentos eliminada - estructura simplificada)
    yPosition += 15;
    doc.moveTo(50, yPosition)
      .lineTo(545, yPosition)
      .strokeColor('#cccccc')
      .lineWidth(0.5)
      .stroke();

    yPosition += 15;

    doc.fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('DETALLE DE PRODUCTOS INGRESADOS', 50, yPosition);

    yPosition += 20;

    // Encabezado de tabla
    doc.rect(50, yPosition, 495, 22)
      .fillAndStroke('#f0f0f0', '#000000')
      .lineWidth(0.5);

    const colX = [52, 75, 140, 320, 365, 405, 445, 485];
    const headers = ['Item', 'Código', 'Descripción', 'U.M.', 'Almacén', 'Ingresada', 'Conforme', 'No Conf.'];

    doc.fontSize(8)
      .font('Helvetica-Bold')
      .fillColor('#000000');

    doc.text(headers[0], colX[0], yPosition + 7, { width: 20, align: 'center' });
    doc.text(headers[1], colX[1], yPosition + 7, { width: 60, align: 'center' });
    doc.text(headers[2], colX[2], yPosition + 7, { width: 175, align: 'left' });
    doc.text(headers[3], colX[3], yPosition + 7, { width: 40, align: 'center' });
    doc.text(headers[4], colX[4], yPosition + 7, { width: 35, align: 'center' });
    doc.text(headers[5], colX[5], yPosition + 7, { width: 35, align: 'center' });
    doc.text(headers[6], colX[6], yPosition + 7, { width: 35, align: 'center' });
    doc.text(headers[7], colX[7], yPosition + 7, { width: 35, align: 'center' });

    yPosition += 22;

    // Función para dibujar encabezado de tabla
    const dibujarEncabezadoTabla = (y) => {
      doc.rect(50, y, 495, 22)
        .fillAndStroke('#f0f0f0', '#000000')
        .lineWidth(0.5);

      doc.fontSize(8)
        .font('Helvetica-Bold')
        .fillColor('#000000');

      doc.text(headers[0], colX[0], y + 7, { width: 20, align: 'center' });
      doc.text(headers[1], colX[1], y + 7, { width: 60, align: 'center' });
      doc.text(headers[2], colX[2], y + 7, { width: 175, align: 'left' });
      doc.text(headers[3], colX[3], y + 7, { width: 40, align: 'center' });
      doc.text(headers[4], colX[4], y + 7, { width: 35, align: 'center' });
      doc.text(headers[5], colX[5], y + 7, { width: 35, align: 'center' });
      doc.text(headers[6], colX[6], y + 7, { width: 35, align: 'center' });
      doc.text(headers[7], colX[7], y + 7, { width: 35, align: 'center' });
    };

    // Filas de detalle
    doc.fontSize(7)
      .font('Helvetica');

    let totalIngresada = 0;
    let totalConforme = 0;
    let totalNoConforme = 0;

    detalles.forEach((detalle, index) => {
      // Calcular altura de la fila según descripción
      const descripcion = detalle.producto_descripcion || '';
      const almacenNombre = detalle.almacen_nombre || '';
      const descHeight = doc.heightOfString(descripcion, { width: 175 });
      const almHeight = doc.heightOfString(almacenNombre, { width: 35 });
      const rowHeight = Math.max(18, descHeight + 6, almHeight + 6);

      // Verificar si hay espacio para la fila actual + espacio para el total
      if (yPosition + rowHeight + 40 > doc.page.height - 50) {
        doc.addPage();
        yPosition = 50;
        
        // Dibujar encabezado en nueva página
        dibujarEncabezadoTabla(yPosition);
        yPosition += 22;
        
        doc.fontSize(7).font('Helvetica');
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
        .text(detalle.numitem, colX[0], yPosition + 4, { width: 20, align: 'center' })
        .text(detalle.producto_codigo || '', colX[1], yPosition + 4, { width: 60, align: 'left' })
        .text(descripcion, colX[2], yPosition + 4, { width: 175, align: 'left' })
        .text(detalle.unidad_medida_abrev || '', colX[3], yPosition + 4, { width: 40, align: 'center' })
        .text(almacenNombre, colX[4], yPosition + 4, { width: 35, align: 'center' })
        .text(Number(detalle.cantidad_ingresada || 0).toFixed(2), colX[5], yPosition + 4, { width: 35, align: 'right' })
        .text(Number(detalle.cantidad_conforme || 0).toFixed(2), colX[6], yPosition + 4, { width: 35, align: 'right' })
        .text(Number(detalle.cantidad_no_conforme || 0).toFixed(2), colX[7], yPosition + 4, { width: 35, align: 'right' });

      totalIngresada += Number(detalle.cantidad_ingresada || 0);
      totalConforme += Number(detalle.cantidad_conforme || 0);
      totalNoConforme += Number(detalle.cantidad_no_conforme || 0);

      yPosition += rowHeight;
    });

    // --- TOTALES ---
    if (yPosition + 40 > doc.page.height - 50) {
      doc.addPage();
      yPosition = 50;
    }

    yPosition += 5;

    doc.rect(320, yPosition, 225, 20)
      .fillAndStroke('#f0f0f0', '#000000')
      .lineWidth(0.5);

    doc.fontSize(8)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('TOTALES:', 325, yPosition + 6)
      .text(totalIngresada.toFixed(2), 405, yPosition + 6, { width: 35, align: 'right' })
      .text(totalConforme.toFixed(2), 445, yPosition + 6, { width: 35, align: 'right' })
      .text(totalNoConforme.toFixed(2), 485, yPosition + 6, { width: 35, align: 'right' });

    // --- OBSERVACIONES ---
    if (nota.observaciones) {
      yPosition += 35;

      if (yPosition + 50 > doc.page.height - 50) {
        doc.addPage();
        yPosition = 50;
      }

      doc.fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('OBSERVACIONES:', 50, yPosition);

      yPosition += 15;

      doc.fontSize(8)
        .font('Helvetica')
        .text(nota.observaciones, 50, yPosition, { width: 495, align: 'justify' });
    }

    // --- PIE DE PÁGINA ---
    yPosition = doc.page.height - 80;

    // Campo "Recibido por" eliminado (estructura simplificada)

    doc.fontSize(7)
      .font('Helvetica')
      .fillColor('#666666')
      .text(
        `Generado: ${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE')}`,
        50,
        doc.page.height - 30,
        { align: 'center', width: 495 }
      );

    doc.end();
  } catch (error) {
    console.error('Error al generar PDF:', error);
    res.status(500).json({ error: 'Error interno al generar PDF', details: error.message });
  }
};

module.exports = {
  obtenerProductos,
  obtenerProductoPorCodigo,
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
  // Notas de ingreso
  obtenerOrdenesCompraDisponibles,
  obtenerNotasIngreso,
  obtenerNotaIngresoPorId,
  crearNotaIngreso,
  actualizarNotaIngreso,
  confirmarNotaIngreso,
  anularNotaIngreso,
  eliminarNotaIngreso,
  generarPDFNotaIngreso,
};
