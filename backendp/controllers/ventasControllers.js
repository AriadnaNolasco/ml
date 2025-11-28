// controllers/ventasController.js
const pool = require("../config/db");
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");
const logoPath = path.join(__dirname, "../assets/RF.png");

// Obtener todos los vendedores
const obtenerVendedores = async (req, res) => {
  try {
    const query = `
      SELECT 
        id_vendedor,
        codigo,
        nombre,
        siglas,
        con_contado,
        con_credito,
        con_cobranza,
        estado,
        created_at,
        updated_at
      FROM ventas.vendedores
      ORDER BY nombre
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener vendedores:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener un vendedor por código
const obtenerVendedorPorCodigo = async (req, res) => {
  try {
    const { codigo } = req.params;

    const query = `
      SELECT 
        id_vendedor,
        codigo,
        nombre,
        siglas,
        con_contado,
        con_credito,
        con_cobranza,
        estado,
        created_at,
        updated_at
      FROM ventas.vendedores
      WHERE codigo = $1
    `;

    const result = await pool.query(query, [codigo]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Vendedor no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener vendedor:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Crear un nuevo vendedor
const crearVendedor = async (req, res) => {
  try {
    const { codigo, nombre, siglas, con_contado, con_credito, con_cobranza } =
      req.body;

    // Verificar si el vendedor ya existe
    const existeQuery =
      "SELECT codigo FROM ventas.vendedores WHERE codigo = $1";
    const existeResult = await pool.query(existeQuery, [codigo]);

    if (existeResult.rows.length > 0) {
      return res.status(400).json({ error: "El código de vendedor ya existe" });
    }

    const query = `
      INSERT INTO ventas.vendedores (
        codigo, nombre, siglas, con_contado, con_credito, con_cobranza, estado, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      codigo,
      nombre,
      siglas || null,
      con_contado || 0,
      con_credito || 0,
      con_cobranza || 0,
      true,
      req.userId || 1,
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear vendedor:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Actualizar un vendedor
const actualizarVendedor = async (req, res) => {
  try {
    const { codigo } = req.params;
    const { nombre, siglas, con_contado, con_credito, con_cobranza, estado } =
      req.body;

    const query = `
      UPDATE ventas.vendedores 
      SET 
        nombre = $1,
        siglas = $2,
        con_contado = $3,
        con_credito = $4,
        con_cobranza = $5,
        estado = $6,
        updated_by = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE codigo = $8
      RETURNING *
    `;

    const values = [
      nombre,
      siglas,
      con_contado,
      con_credito,
      con_cobranza,
      estado !== undefined ? estado : true,
      req.userId || 1,
      codigo,
    ];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Vendedor no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar vendedor:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Eliminar un vendedor
const eliminarVendedor = async (req, res) => {
  try {
    const { codigo } = req.params;

    // Verificar si hay clientes asignados a este vendedor
    const clientesQuery =
      "SELECT codigo FROM ventas.clientes WHERE vendedor_id = (SELECT id_vendedor FROM ventas.vendedores WHERE codigo = $1) LIMIT 1";
    const clientesResult = await pool.query(clientesQuery, [codigo]);

    if (clientesResult.rows.length > 0) {
      return res.status(400).json({
        error:
          "No se puede eliminar el vendedor porque tiene clientes asignados",
      });
    }

    // Cambiar estado a inactivo
    const query = `
      UPDATE ventas.vendedores 
      SET estado = FALSE, updated_by = $1, updated_at = CURRENT_TIMESTAMP
      WHERE codigo = $2
      RETURNING *
    `;

    const result = await pool.query(query, [req.userId || 1, codigo]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Vendedor no encontrado" });
    }

    res.json({ message: "Vendedor eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar vendedor:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener todos los clientes con información financiera básica - CORREGIDO
const obtenerClientes = async (req, res) => {
  try {
    const query = `
      SELECT 
        c.id_cliente,
        c.codigo,
        c.id_documento,
        td.nombre as tipo_documento_nombre,
        td.codigo as tipo_documento_codigo,
        c.nro_documento,
        c.vendedor_id,
        v.codigo as vendedor_codigo,
        v.nombre as vendedor_nombre,
        c.razon_social,
        c.nomb_comercial,
        c.id_pais,
        p.nombre as pais_nombre,
        c.id_departamento,
        dpt.nombre as departamento_nombre,
        c.id_distrito,
        dist.nombre as distrito_nombre,
        c.direccion,
        c.email,
        c.estado,
        c.fecha_registro,
        c.telefono1,
        c.telefono2,
        c.celular1,
        c.celular2,
        c.created_at,
        c.updated_at,
        c.created_by,
        c.updated_by,
        u_created.nombre_completo as creado_por_nombre,
        u_updated.nombre_completo as actualizado_por_nombre,
        -- Información financiera
        COALESCE(ifc.linea_credito, 0) as linea_credito,
        COALESCE(ifc.tasa_interes, 0) as tasa_interes,
        ifc.forma_pago_id,
        fp.codigo as forma_pago_codigo,
        fp.nombre as forma_pago_nombre,
        COALESCE(ifc.descuento_1, 0) as descuento_1,
        COALESCE(ifc.descuento_2, 0) as descuento_2,
        ifc.cuenta_detraccion,
        COALESCE(ifc.estado, true) as financiera_estado
      FROM ventas.clientes c
      LEFT JOIN public.tipo_documento_id td ON c.id_documento = td.id
      LEFT JOIN ventas.vendedores v ON c.vendedor_id = v.id_vendedor
      LEFT JOIN public.paises p ON c.id_pais = p.id
      LEFT JOIN public.departamentos dpt ON c.id_departamento = dpt.id
      LEFT JOIN public.distritos dist ON c.id_distrito = dist.id
      LEFT JOIN public.usuarios u_created ON c.created_by = u_created.id
      LEFT JOIN public.usuarios u_updated ON c.updated_by = u_updated.id
      LEFT JOIN ventas.info_financiera_clientes ifc ON c.id_cliente = ifc.id_cliente
      LEFT JOIN contabilidad.formas_pago fp ON ifc.forma_pago_id = fp.id
      ORDER BY c.razon_social
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener clientes completos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const obtenerClientesActivos = async (req, res) => {
  try {
    // Obtener el parámetro de estado (por defecto true para activos)
    const { estado = "true" } = req.query;

    // Convertir el parámetro a booleano
    const estadoBoolean = estado === "true";

    console.log(`Filtrando clientes con estado: ${estadoBoolean}`);

    const query = `
      SELECT 
        c.id_cliente,
        c.codigo,
        c.id_documento,
        td.nombre as tipo_documento_nombre,
        td.codigo as tipo_documento_codigo,
        c.nro_documento,
        c.vendedor_id,
        v.codigo as vendedor_codigo,
        v.nombre as vendedor_nombre,
        c.razon_social,
        c.nomb_comercial,
        c.id_pais,
        p.nombre as pais_nombre,
        c.id_departamento,
        dpt.nombre as departamento_nombre,
        c.id_distrito,
        dist.nombre as distrito_nombre,
        c.direccion,
        c.email,
        c.estado,
        c.fecha_registro,
        c.telefono1,
        c.telefono2,
        c.celular1,
        c.celular2,
        c.created_at,
        c.updated_at,
        c.created_by,
        c.updated_by,
        u_created.nombre_completo as creado_por_nombre,
        u_updated.nombre_completo as actualizado_por_nombre,
        -- Información financiera
        COALESCE(ifc.linea_credito, 0) as linea_credito,
        COALESCE(ifc.tasa_interes, 0) as tasa_interes,
        ifc.forma_pago_id,
        fp.codigo as forma_pago_codigo,
        fp.nombre as forma_pago_nombre,
        COALESCE(ifc.descuento_1, 0) as descuento_1,
        COALESCE(ifc.descuento_2, 0) as descuento_2,
        ifc.cuenta_detraccion,
        COALESCE(ifc.estado, true) as financiera_estado
      FROM ventas.clientes c
      LEFT JOIN public.tipo_documento_id td ON c.id_documento = td.id
      LEFT JOIN ventas.vendedores v ON c.vendedor_id = v.id_vendedor
      LEFT JOIN public.paises p ON c.id_pais = p.id
      LEFT JOIN public.departamentos dpt ON c.id_departamento = dpt.id
      LEFT JOIN public.distritos dist ON c.id_distrito = dist.id
      LEFT JOIN public.usuarios u_created ON c.created_by = u_created.id
      LEFT JOIN public.usuarios u_updated ON c.updated_by = u_updated.id
      LEFT JOIN ventas.info_financiera_clientes ifc ON c.id_cliente = ifc.id_cliente
      LEFT JOIN contabilidad.formas_pago fp ON ifc.forma_pago_id = fp.id
      WHERE c.estado = $1  -- ¡FILTRO AÑADIDO AQUÍ!
      ORDER BY c.razon_social
    `;

    const result = await pool.query(query, [estadoBoolean]);

    console.log(
      `Encontrados ${result.rowCount} clientes con estado: ${estadoBoolean}`
    );

    res.json({
      success: true,
      data: result.rows,
      total: result.rowCount,
      filtro_estado: estadoBoolean,
    });
  } catch (error) {
    console.error("Error al obtener clientes completos:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      detalle: error.message,
    });
  }
};

// Función corregida para obtenerClientePorCodigo con información financiera
const obtenerClientePorCodigo = async (req, res) => {
  try {
    const { codigo } = req.params;

    const query = `
      SELECT 
        c.id_cliente,
        c.codigo,
        c.id_documento,
        td.nombre as tipo_documento_nombre,
        td.codigo as tipo_documento_codigo,
        c.nro_documento,
        c.vendedor_id,
        v.codigo as vendedor_codigo,
        v.nombre as vendedor_nombre,
        c.razon_social,
        c.nomb_comercial,
        c.id_pais,
        p.nombre as pais_nombre,
        c.id_departamento,
        dpt.nombre as departamento_nombre,
        c.id_distrito,
        dist.nombre as distrito_nombre,
        c.direccion,
        c.email,
        c.estado,
        c.telefono1,
        c.telefono2,
        c.celular1,
        c.celular2,
        c.fecha_registro,
        c.created_at,
        c.updated_at,
        c.created_by,
        c.updated_by,
        u_created.nombre_completo as creado_por_nombre,
        u_updated.nombre_completo as actualizado_por_nombre,
        -- Información financiera
        COALESCE(ifc.linea_credito, 0) as linea_credito,
        COALESCE(ifc.tasa_interes, 0) as tasa_interes,
        ifc.forma_pago_id,
        fp.codigo as forma_pago_codigo,
        fp.nombre as forma_pago_nombre,
        COALESCE(ifc.descuento_1, 0) as descuento_1,
        COALESCE(ifc.descuento_2, 0) as descuento_2,
        ifc.cuenta_detraccion,
        COALESCE(ifc.estado, true) as financiera_estado
      FROM ventas.clientes c
      LEFT JOIN public.tipo_documento_id td ON c.id_documento = td.id
      LEFT JOIN ventas.vendedores v ON c.vendedor_id = v.id_vendedor
      LEFT JOIN public.paises p ON c.id_pais = p.id
      LEFT JOIN public.departamentos dpt ON c.id_departamento = dpt.id
      LEFT JOIN public.distritos dist ON c.id_distrito = dist.id
      LEFT JOIN public.usuarios u_created ON c.created_by = u_created.id
      LEFT JOIN public.usuarios u_updated ON c.updated_by = u_updated.id
      LEFT JOIN ventas.info_financiera_clientes ifc ON c.id_cliente = ifc.id_cliente
      LEFT JOIN contabilidad.formas_pago fp ON ifc.forma_pago_id = fp.id
      WHERE c.codigo = $1
    `;

    const result = await pool.query(query, [codigo]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener cliente:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Crear un nuevo cliente con información financiera - CORREGIDO CON DEPARTAMENTO Y DISTRITO
const crearCliente = async (req, res) => {
  try {
    const {
      codigo,
      id_documento,
      nro_documento,
      vendedor_id,
      razon_social,
      nomb_comercial,
      id_pais,
      id_departamento,
      id_distrito,
      direccion,
      email,
      telefono1,
      telefono2,
      celular1,
      celular2,
      // Campos financieros (opcionales)
      linea_credito = 0,
      tasa_interes = 0,
      forma_pago_id = null,
      descuento_1 = 0,
      descuento_2 = 0,
      cuenta_detraccion = null,
    } = req.body;

    // Verificar si el cliente ya existe
    const existeQuery =
      "SELECT codigo FROM ventas.clientes WHERE codigo = $1 OR nro_documento = $2";
    const existeResult = await pool.query(existeQuery, [codigo, nro_documento]);

    if (existeResult.rows.length > 0) {
      return res.status(400).json({
        error: "El código de cliente o número de documento ya existe",
      });
    }

    // Verificar que el vendedor existe
    if (vendedor_id) {
      const vendedorQuery =
        "SELECT id_vendedor FROM ventas.vendedores WHERE id_vendedor = $1 AND estado = TRUE";
      const vendedorResult = await pool.query(vendedorQuery, [vendedor_id]);

      if (vendedorResult.rows.length === 0) {
        return res.status(400).json({
          error: "El vendedor especificado no existe o no está activo",
        });
      }
    }

    // Validar que departamento y distrito pertenecen al país si se proporcionan
    if (id_departamento) {
      const departamentoQuery = `
        SELECT id FROM public.departamentos 
        WHERE id = $1 AND pais_id = $2
      `;
      const departamentoResult = await pool.query(departamentoQuery, [
        id_departamento,
        id_pais || 1,
      ]);

      if (departamentoResult.rows.length === 0) {
        return res.status(400).json({
          error: "El departamento no pertenece al país seleccionado",
        });
      }
    }

    if (id_distrito) {
      const distritoQuery = `
        SELECT id FROM public.distritos 
        WHERE id = $1 AND departamento_id = $2
      `;
      const distritoResult = await pool.query(distritoQuery, [
        id_distrito,
        id_departamento,
      ]);

      if (distritoResult.rows.length === 0) {
        return res.status(400).json({
          error: "El distrito no pertenece al departamento seleccionado",
        });
      }
    }

    // Insertar el cliente
    const insertClienteQuery = `
      INSERT INTO ventas.clientes (
        codigo, id_documento, nro_documento, vendedor_id, razon_social, 
        nomb_comercial, id_pais, id_departamento, id_distrito, direccion, 
        email, telefono1, telefono2, celular1, celular2, estado, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING id_cliente, codigo
    `;

    const clienteValues = [
      codigo,
      id_documento,
      nro_documento,
      vendedor_id,
      razon_social,
      nomb_comercial,
      id_pais || 1,
      id_departamento || null,
      id_distrito || null,
      direccion,
      email,
      telefono1,
      telefono2,
      celular1,
      celular2,
      true,
      req.userId || 1,
    ];

    const clienteResult = await pool.query(insertClienteQuery, clienteValues);
    const nuevoCliente = clienteResult.rows[0];

    // Crear automáticamente el registro en info_financiera_clientes
    const insertFinancieraQuery = `
      INSERT INTO ventas.info_financiera_clientes (
        id_cliente,
        linea_credito,
        tasa_interes,
        forma_pago_id,
        descuento_1,
        descuento_2,
        cuenta_detraccion,
        estado,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;

    const financieraValues = [
      nuevoCliente.id_cliente,
      linea_credito,
      tasa_interes,
      forma_pago_id,
      descuento_1,
      descuento_2,
      cuenta_detraccion,
      true,
      req.userId || 1,
    ];

    await pool.query(insertFinancieraQuery, financieraValues);

    // Obtener el cliente completo con su información financiera
    const clienteCompletoQuery = `
      SELECT 
        c.*,
        dpt.nombre as departamento_nombre,
        dist.nombre as distrito_nombre,
        ifc.linea_credito,
        ifc.tasa_interes,
        ifc.forma_pago_id,
        ifc.descuento_1,
        ifc.descuento_2,
        ifc.cuenta_detraccion,
        fp.nombre as forma_pago_nombre,
        td.nombre as tipo_documento_nombre,
        v.nombre as vendedor_nombre,
        p.nombre as pais_nombre
      FROM ventas.clientes c
      LEFT JOIN ventas.info_financiera_clientes ifc ON c.id_cliente = ifc.id_cliente
      LEFT JOIN contabilidad.formas_pago fp ON ifc.forma_pago_id = fp.id
      LEFT JOIN public.tipo_documento_id td ON c.id_documento = td.id
      LEFT JOIN ventas.vendedores v ON c.vendedor_id = v.id_vendedor
      LEFT JOIN public.paises p ON c.id_pais = p.id
      LEFT JOIN public.departamentos dpt ON c.id_departamento = dpt.id
      LEFT JOIN public.distritos dist ON c.id_distrito = dist.id
      WHERE c.id_cliente = $1
    `;

    const clienteCompletoResult = await pool.query(clienteCompletoQuery, [
      nuevoCliente.id_cliente,
    ]);

    res.status(201).json(clienteCompletoResult.rows[0]);
  } catch (error) {
    console.error("Error al crear cliente:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Actualizar un cliente y su información financiera - CORREGIDO CON DEPARTAMENTO Y DISTRITO
const actualizarCliente = async (req, res) => {
  try {
    const { codigo } = req.params;
    const {
      id_documento,
      nro_documento,
      vendedor_id,
      razon_social,
      nomb_comercial,
      id_pais,
      id_departamento,
      id_distrito,
      direccion,
      email,
      telefono1,
      telefono2,
      celular1,
      celular2,
      estado,
      linea_credito,
      tasa_interes,
      forma_pago_id,
      descuento_1,
      descuento_2,
      cuenta_detraccion,
      financiera_estado,
    } = req.body;

    // Verificar que el vendedor existe si se está actualizando
    if (vendedor_id) {
      const vendedorQuery =
        "SELECT id_vendedor FROM ventas.vendedores WHERE id_vendedor = $1 AND estado = TRUE";
      const vendedorResult = await pool.query(vendedorQuery, [vendedor_id]);

      if (vendedorResult.rows.length === 0) {
        return res.status(400).json({
          error: "El vendedor especificado no existe o no está activo",
        });
      }
    }

    // Validar que departamento y distrito pertenecen al país si se proporcionan
    const paisId = id_pais;
    if (id_departamento && paisId) {
      const departamentoQuery = `
        SELECT id FROM public.departamentos 
        WHERE id = $1 AND pais_id = $2
      `;
      const departamentoResult = await pool.query(departamentoQuery, [
        id_departamento,
        paisId,
      ]);

      if (departamentoResult.rows.length === 0) {
        return res.status(400).json({
          error: "El departamento no pertenece al país seleccionado",
        });
      }
    }

    if (id_distrito && id_departamento) {
      const distritoQuery = `
        SELECT id FROM public.distritos 
        WHERE id = $1 AND departamento_id = $2
      `;
      const distritoResult = await pool.query(distritoQuery, [
        id_distrito,
        id_departamento,
      ]);

      if (distritoResult.rows.length === 0) {
        return res.status(400).json({
          error: "El distrito no pertenece al departamento seleccionado",
        });
      }
    }

    // Obtener el ID del cliente
    const clienteIdQuery =
      "SELECT id_cliente FROM ventas.clientes WHERE codigo = $1";
    const clienteIdResult = await pool.query(clienteIdQuery, [codigo]);

    if (clienteIdResult.rows.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    const id_cliente = clienteIdResult.rows[0].id_cliente;

    // Actualizar datos del cliente
    const updateClienteQuery = `
      UPDATE ventas.clientes 
      SET 
        id_documento = COALESCE($1, id_documento),
        nro_documento = COALESCE($2, nro_documento),
        vendedor_id = COALESCE($3, vendedor_id),
        razon_social = COALESCE($4, razon_social),
        nomb_comercial = COALESCE($5, nomb_comercial),
        id_pais = COALESCE($6, id_pais),
        id_departamento = COALESCE($7, id_departamento),
        id_distrito = COALESCE($8, id_distrito),
        direccion = COALESCE($9, direccion),
        email = COALESCE($10, email),
        telefono1 = COALESCE($11, telefono1),
        telefono2 = COALESCE($12, telefono2),
        celular1 = COALESCE($13, celular1),
        celular2 = COALESCE($14, celular2),
        estado = COALESCE($15, estado),
        updated_by = $16,
        updated_at = CURRENT_TIMESTAMP
      WHERE codigo = $17
      RETURNING *
    `;

    const clienteValues = [
      id_documento,
      nro_documento,
      vendedor_id,
      razon_social,
      nomb_comercial,
      id_pais,
      id_departamento,
      id_distrito,
      direccion,
      email,
      telefono1,
      telefono2,
      celular1,
      celular2,
      estado,
      req.userId || 1,
      codigo,
    ];

    await pool.query(updateClienteQuery, clienteValues);

    // Verificar si existe información financiera
    const existeInfoFinancieraQuery = `
      SELECT id_info_financiera FROM ventas.info_financiera_clientes 
      WHERE id_cliente = $1
    `;
    const existeInfoFinancieraResult = await pool.query(
      existeInfoFinancieraQuery,
      [id_cliente]
    );

    if (existeInfoFinancieraResult.rows.length === 0) {
      // Crear registro de información financiera si no existe
      const crearInfoFinancieraQuery = `
        INSERT INTO ventas.info_financiera_clientes (
          id_cliente, linea_credito, tasa_interes, forma_pago_id, 
          descuento_1, descuento_2, cuenta_detraccion, estado, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;

      await pool.query(crearInfoFinancieraQuery, [
        id_cliente,
        linea_credito || 0,
        tasa_interes || 0,
        forma_pago_id,
        descuento_1 || 0,
        descuento_2 || 0,
        cuenta_detraccion,
        financiera_estado !== undefined ? financiera_estado : true,
        req.userId || 1,
      ]);
    } else {
      // Actualizar información financiera existente
      const updateFinancieraQuery = `
        UPDATE ventas.info_financiera_clientes 
        SET 
          linea_credito = COALESCE($1, linea_credito),
          tasa_interes = COALESCE($2, tasa_interes),
          forma_pago_id = COALESCE($3, forma_pago_id),
          descuento_1 = COALESCE($4, descuento_1),
          descuento_2 = COALESCE($5, descuento_2),
          cuenta_detraccion = COALESCE($6, cuenta_detraccion),
          estado = COALESCE($7, estado),
          updated_by = $8,
          updated_at = CURRENT_TIMESTAMP
        WHERE id_cliente = $9
      `;

      const financieraValues = [
        linea_credito,
        tasa_interes,
        forma_pago_id,
        descuento_1,
        descuento_2,
        cuenta_detraccion,
        financiera_estado !== undefined ? financiera_estado : true,
        req.userId || 1,
        id_cliente,
      ];

      await pool.query(updateFinancieraQuery, financieraValues);
    }

    // Obtener el cliente actualizado con información financiera
    const clienteActualizadoQuery = `
      SELECT 
        c.*,
        dpt.nombre as departamento_nombre,
        dist.nombre as distrito_nombre,
        ifc.linea_credito,
        ifc.tasa_interes,
        ifc.forma_pago_id,
        ifc.descuento_1,
        ifc.descuento_2,
        ifc.cuenta_detraccion,
        ifc.estado as financiera_estado,
        fp.nombre as forma_pago_nombre,
        td.nombre as tipo_documento_nombre,
        v.nombre as vendedor_nombre,
        p.nombre as pais_nombre
      FROM ventas.clientes c
      LEFT JOIN ventas.info_financiera_clientes ifc ON c.id_cliente = ifc.id_cliente
      LEFT JOIN contabilidad.formas_pago fp ON ifc.forma_pago_id = fp.id
      LEFT JOIN public.tipo_documento_id td ON c.id_documento = td.id
      LEFT JOIN ventas.vendedores v ON c.vendedor_id = v.id_vendedor
      LEFT JOIN public.paises p ON c.id_pais = p.id
      LEFT JOIN public.departamentos dpt ON c.id_departamento = dpt.id
      LEFT JOIN public.distritos dist ON c.id_distrito = dist.id
      WHERE c.codigo = $1
    `;

    const result = await pool.query(clienteActualizadoQuery, [codigo]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar cliente:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Actualizar solo la información financiera de un cliente
const actualizarInfoFinancieraCliente = async (req, res) => {
  try {
    const { codigo } = req.params;
    const {
      linea_credito,
      tasa_interes,
      forma_pago_id,
      descuento_1,
      descuento_2,
      cuenta_detraccion,
      estado,
    } = req.body;

    // Obtener el ID del cliente
    const clienteIdQuery =
      "SELECT id_cliente FROM ventas.clientes WHERE codigo = $1";
    const clienteIdResult = await pool.query(clienteIdQuery, [codigo]);

    if (clienteIdResult.rows.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    const id_cliente = clienteIdResult.rows[0].id_cliente;

    const query = `
      UPDATE ventas.info_financiera_clientes 
      SET 
        linea_credito = COALESCE($1, linea_credito),
        tasa_interes = COALESCE($2, tasa_interes),
        forma_pago_id = COALESCE($3, forma_pago_id),
        descuento_1 = COALESCE($4, descuento_1),
        descuento_2 = COALESCE($5, descuento_2),
        cuenta_detraccion = COALESCE($6, cuenta_detraccion),
        estado = COALESCE($7, estado),
        updated_by = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id_cliente = $9
      RETURNING *
    `;

    const values = [
      linea_credito,
      tasa_interes,
      forma_pago_id,
      descuento_1,
      descuento_2,
      cuenta_detraccion,
      estado,
      req.userId || 1,
      id_cliente,
    ];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Información financiera no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar información financiera:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Eliminar un cliente
const eliminarCliente = async (req, res) => {
  try {
    const { codigo } = req.params;

    // Cambiar estado a inactivo
    const query = `
      UPDATE ventas.clientes 
      SET estado = FALSE, updated_by = $1, updated_at = CURRENT_TIMESTAMP
      WHERE codigo = $2
      RETURNING *
    `;

    const result = await pool.query(query, [req.userId || 1, codigo]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json({ message: "Cliente eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar cliente:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener todos los transportistas
const obtenerTransportistas = async (req, res) => {
  try {
    const query = `
      SELECT 
        t.id_transportista,
        t.codigo,
        td.nombre as tipo_documento,
        t.nro_documento,
        t.razon_social,
        t.nomb_comercial,
        p.nombre as pais,
        t.direccion,
        t.email,
        t.estado,
        t.telefono1,
        t.telefono2,
        t.celular1,
        t.celular2,
        t.fecha_registro,
        t.created_at,
        t.updated_at
      FROM ventas.transportistas t
      LEFT JOIN public.tipo_documento_id td ON t.id_documento = td.id
      LEFT JOIN public.paises p ON t.id_pais = p.id
      ORDER BY t.razon_social
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener transportistas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener un transportista por código
const obtenerTransportistaPorCodigo = async (req, res) => {
  try {
    const { codigo } = req.params;

    const query = `
      SELECT 
        t.id_transportista,
        t.codigo,
        t.id_documento,
        td.nombre as tipo_documento_nombre,
        td.codigo as tipo_documento_codigo,
        t.nro_documento,
        t.razon_social,
        t.nomb_comercial,
        t.id_pais,
        p.nombre as pais_nombre,
        t.direccion,
        t.email,
        t.estado,
        t.telefono1,
        t.telefono2,
        t.celular1,
        t.celular2,
        t.fecha_registro,
        t.created_at,
        t.updated_at
      FROM ventas.transportistas t
      LEFT JOIN public.tipo_documento_id td ON t.id_documento = td.id
      LEFT JOIN public.paises p ON t.id_pais = p.id
      WHERE t.codigo = $1
    `;

    const result = await pool.query(query, [codigo]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Transportista no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener transportista:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Crear un nuevo transportista
const crearTransportista = async (req, res) => {
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
    } = req.body;

    // Verificar si el transportista ya existe
    const existeQuery =
      "SELECT codigo FROM ventas.transportistas WHERE codigo = $1 OR nro_documento = $2";
    const existeResult = await pool.query(existeQuery, [codigo, nro_documento]);

    if (existeResult.rows.length > 0) {
      return res.status(400).json({
        error: "El código de transportista o número de documento ya existe",
      });
    }

    const query = `
      INSERT INTO ventas.transportistas (
        codigo, id_documento, nro_documento, razon_social, nomb_comercial, 
        id_pais, direccion, email, telefono1, telefono2, celular1, celular2, 
        estado, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const values = [
      codigo,
      id_documento,
      nro_documento,
      razon_social,
      nomb_comercial,
      id_pais || 1,
      direccion,
      email,
      telefono1,
      telefono2,
      celular1,
      celular2,
      true,
      req.userId || 1,
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear transportista:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Actualizar un transportista
const actualizarTransportista = async (req, res) => {
  try {
    const { codigo } = req.params;
    const {
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
      estado,
    } = req.body;

    const query = `
      UPDATE ventas.transportistas 
      SET 
        id_documento = COALESCE($1, id_documento),
        nro_documento = COALESCE($2, nro_documento),
        razon_social = COALESCE($3, razon_social),
        nomb_comercial = COALESCE($4, nomb_comercial),
        id_pais = COALESCE($5, id_pais),
        direccion = COALESCE($6, direccion),
        email = COALESCE($7, email),
        telefono1 = COALESCE($8, telefono1),
        telefono2 = COALESCE($9, telefono2),
        celular1 = COALESCE($10, celular1),
        celular2 = COALESCE($11, celular2),
        estado = COALESCE($12, estado),
        updated_by = $13,
        updated_at = CURRENT_TIMESTAMP
      WHERE codigo = $14
      RETURNING *
    `;

    const values = [
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
      estado,
      req.userId || 1,
      codigo,
    ];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Transportista no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar transportista:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Eliminar un transportista
const eliminarTransportista = async (req, res) => {
  try {
    const { codigo } = req.params;

    // Cambiar estado a inactivo
    const query = `
      UPDATE ventas.transportistas 
      SET estado = FALSE, updated_by = $1, updated_at = CURRENT_TIMESTAMP
      WHERE codigo = $2
      RETURNING *
    `;

    const result = await pool.query(query, [req.userId || 1, codigo]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Transportista no encontrado" });
    }

    res.json({ message: "Transportista eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar transportista:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener todos los puntos de partida
const obtenerPuntosPartida = async (req, res) => {
  try {
    const query = `
      SELECT 
        id_partida,
        codigo,
        direccion,
        estado
      FROM ventas.puntos_partida
      ORDER BY codigo
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener puntos de partida:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener un punto de partida por código
const obtenerPuntoPartidaPorCodigo = async (req, res) => {
  try {
    const { codigo } = req.params;

    const query = `
      SELECT 
        id_partida,
        codigo,
        direccion,
        estado
      FROM ventas.puntos_partida
      WHERE codigo = $1
    `;

    const result = await pool.query(query, [codigo]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Punto de partida no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener punto de partida:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Crear un nuevo punto de partida
const crearPuntoPartida = async (req, res) => {
  try {
    const { codigo, direccion } = req.body;

    // Verificar si el punto de partida ya existe
    const existeQuery =
      "SELECT codigo FROM ventas.puntos_partida WHERE codigo = $1";
    const existeResult = await pool.query(existeQuery, [codigo]);

    if (existeResult.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "El código de punto de partida ya existe" });
    }

    const query = `
      INSERT INTO ventas.puntos_partida (
        codigo, direccion, estado
      ) VALUES ($1, $2, $3)
      RETURNING *
    `;

    const values = [codigo, direccion, true];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear punto de partida:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Actualizar un punto de partida
const actualizarPuntoPartida = async (req, res) => {
  try {
    const { codigo } = req.params;
    const { direccion, estado } = req.body;

    const query = `
      UPDATE ventas.puntos_partida 
      SET 
        direccion = COALESCE($1, direccion),
        estado = COALESCE($2, estado)
      WHERE codigo = $3
      RETURNING *
    `;

    const values = [direccion, estado, codigo];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Punto de partida no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar punto de partida:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Eliminar un punto de partida
const eliminarPuntoPartida = async (req, res) => {
  try {
    const { codigo } = req.params;

    // Cambiar estado a inactivo
    const query = `
      UPDATE ventas.puntos_partida 
      SET estado = FALSE
      WHERE codigo = $1
      RETURNING *
    `;

    const result = await pool.query(query, [codigo]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Punto de partida no encontrado" });
    }

    res.json({ message: "Punto de partida eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar punto de partida:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener todos los vehículos
const obtenerVehiculos = async (req, res) => {
  try {
    const query = `
      SELECT 
        id_vehiculo,
        placa,
        marca,
        modelo,
        anio_fabricacion,
        combustible,
        carroceria,
        tipo_transmision,
        estado,
        fecha_registro
      FROM ventas.vehiculos
      ORDER BY marca, modelo
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener vehículos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener un vehículo por placa
const obtenerVehiculoPorPlaca = async (req, res) => {
  try {
    const { placa } = req.params;

    const query = `
      SELECT 
        id_vehiculo,
        placa,
        marca,
        modelo,
        anio_fabricacion,
        combustible,
        carroceria,
        tipo_transmision,
        estado,
        fecha_registro
      FROM ventas.vehiculos
      WHERE placa = $1
    `;

    const result = await pool.query(query, [placa]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Vehículo no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener vehículo:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Crear un nuevo vehículo
const crearVehiculo = async (req, res) => {
  try {
    const {
      placa,
      marca,
      modelo,
      anio_fabricacion,
      combustible,
      carroceria,
      tipo_transmision,
    } = req.body;

    // Verificar si el vehículo ya existe
    const existeQuery = "SELECT placa FROM ventas.vehiculos WHERE placa = $1";
    const existeResult = await pool.query(existeQuery, [placa]);

    if (existeResult.rows.length > 0) {
      return res.status(400).json({ error: "La placa del vehículo ya existe" });
    }

    const query = `
      INSERT INTO ventas.vehiculos (
        placa, marca, modelo, anio_fabricacion, combustible, 
        carroceria, tipo_transmision, estado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      placa,
      marca,
      modelo,
      anio_fabricacion,
      combustible,
      carroceria,
      tipo_transmision,
      true,
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear vehículo:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Actualizar un vehículo
const actualizarVehiculo = async (req, res) => {
  try {
    const { placa } = req.params;
    const {
      marca,
      modelo,
      anio_fabricacion,
      combustible,
      carroceria,
      tipo_transmision,
      estado,
    } = req.body;

    const query = `
      UPDATE ventas.vehiculos 
      SET 
        marca = COALESCE($1, marca),
        modelo = COALESCE($2, modelo),
        anio_fabricacion = COALESCE($3, anio_fabricacion),
        combustible = COALESCE($4, combustible),
        carroceria = COALESCE($5, carroceria),
        tipo_transmision = COALESCE($6, tipo_transmision),
        estado = COALESCE($7, estado)
      WHERE placa = $8
      RETURNING *
    `;

    const values = [
      marca,
      modelo,
      anio_fabricacion,
      combustible,
      carroceria,
      tipo_transmision,
      estado,
      placa,
    ];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Vehículo no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar vehículo:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Eliminar un vehículo
const eliminarVehiculo = async (req, res) => {
  try {
    const { placa } = req.params;

    // Cambiar estado a inactivo
    const query = `
      UPDATE ventas.vehiculos 
      SET estado = FALSE
      WHERE placa = $1
      RETURNING *
    `;

    const result = await pool.query(query, [placa]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Vehículo no encontrado" });
    }

    res.json({ message: "Vehículo eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar vehículo:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ============================================
// FUNCIONES PARA CHOFERES
// ============================================

// Obtener todos los choferes
const obtenerChoferes = async (req, res) => {
  try {
    const query = `
      SELECT 
        ch.id_chofer,
        ch.codigo,
        ch.cod_chofer,
        td.nombre as tipo_documento,
        td.codigo as tipo_documento_codigo,
        ch.nro_documento,
        ch.nombre_completo,
        ch.tipo_pertenencia,
        ch.id_personal,
        CASE 
          WHEN ch.tipo_pertenencia = 'PERSONAL' THEN p.nombre_completo
          ELSE NULL
        END as personal_nombre,
        ch.id_transportista,
        CASE 
          WHEN ch.tipo_pertenencia = 'TRANSPORTISTA' THEN t.razon_social
          ELSE NULL
        END as transportista_nombre,
        ch.id_cliente,
        CASE 
          WHEN ch.tipo_pertenencia = 'CLIENTE' THEN c.razon_social
          ELSE NULL
        END as cliente_nombre,
        ch.empresa_documento,
        ch.empresa_razon_social,
        ch.direccion,
        pa.nombre as pais,
        ch.nro_licencia,
        ch.estado,
        ch.created_at,
        ch.updated_at
      FROM ventas.choferes ch
      LEFT JOIN public.tipo_documento_id td ON ch.id_documento = td.id
      LEFT JOIN public.personal p ON ch.id_personal = p.id_personal
      LEFT JOIN ventas.transportistas t ON ch.id_transportista = t.id_transportista
      LEFT JOIN ventas.clientes c ON ch.id_cliente = c.id_cliente
      LEFT JOIN public.paises pa ON ch.id_pais = pa.id
      ORDER BY ch.nombre_completo
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener choferes:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener un chofer por código
const obtenerChoferPorCodigo = async (req, res) => {
  try {
    const { codigo } = req.params;

    const query = `
      SELECT 
        ch.id_chofer,
        ch.codigo,
        ch.cod_chofer,
        ch.id_documento,
        td.nombre as tipo_documento_nombre,
        td.codigo as tipo_documento_codigo,
        ch.nro_documento,
        ch.nombre_completo,
        ch.tipo_pertenencia,
        ch.id_personal,
        p.nombre_completo as personal_nombre,
        p.nro_documento as personal_documento,
        ch.id_transportista,
        t.razon_social as transportista_nombre,
        t.nro_documento as transportista_documento,
        ch.id_cliente,
        c.razon_social as cliente_nombre,
        c.nro_documento as cliente_documento,
        ch.empresa_documento,
        ch.empresa_razon_social,
        ch.direccion,
        ch.id_pais,
        pa.nombre as pais_nombre,
        ch.nro_licencia,
        ch.estado,
        ch.created_at,
        ch.updated_at,
        ch.created_by,
        ch.updated_by,
        u_created.nombre_completo as creado_por_nombre,
        u_updated.nombre_completo as actualizado_por_nombre
      FROM ventas.choferes ch
      LEFT JOIN public.tipo_documento_id td ON ch.id_documento = td.id
      LEFT JOIN public.personal p ON ch.id_personal = p.id_personal
      LEFT JOIN ventas.transportistas t ON ch.id_transportista = t.id_transportista
      LEFT JOIN ventas.clientes c ON ch.id_cliente = c.id_cliente
      LEFT JOIN public.paises pa ON ch.id_pais = pa.id
      LEFT JOIN public.usuarios u_created ON ch.created_by = u_created.id
      LEFT JOIN public.usuarios u_updated ON ch.updated_by = u_updated.id
      WHERE ch.codigo = $1
    `;

    const result = await pool.query(query, [codigo]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Chofer no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener chofer:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Crear un nuevo chofer
const crearChofer = async (req, res) => {
  try {
    await pool.query("BEGIN");

    const {
      codigo,
      id_documento,
      nro_documento,
      nombre_completo,
      tipo_pertenencia,
      id_personal,
      id_transportista,
      id_cliente,
      direccion,
      id_pais,
      nro_licencia,
    } = req.body;

    // Validar que el código no exista
    const existeQuery =
      "SELECT codigo FROM ventas.choferes WHERE codigo = $1 OR nro_documento = $2";
    const existeResult = await pool.query(existeQuery, [codigo, nro_documento]);

    if (existeResult.rows.length > 0) {
      await pool.query("ROLLBACK");
      return res
        .status(400)
        .json({ error: "El código de chofer o número de documento ya existe" });
    }

    // Validar según tipo de pertenencia
    let empresa_documento = null;
    let empresa_razon_social = null;

    if (tipo_pertenencia === "PERSONAL") {
      if (!id_personal) {
        await pool.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "Debe especificar el personal para tipo PERSONAL" });
      }

      // Obtener datos del personal y empresa
      const personalQuery = `
        SELECT 
          p.nro_documento,
          p.nombre_completo,
          e.nro_documento as empresa_doc,
          e.razon_social
        FROM public.personal p
        LEFT JOIN public.empresa e ON p.id_empresa = e.id_empresa
        WHERE p.id_personal = $1
      `;
      const personalResult = await pool.query(personalQuery, [id_personal]);

      if (personalResult.rows.length === 0) {
        await pool.query("ROLLBACK");
        return res.status(400).json({ error: "Personal no encontrado" });
      }

      empresa_documento = personalResult.rows[0].empresa_doc;
      empresa_razon_social = personalResult.rows[0].razon_social;
    } else if (tipo_pertenencia === "TRANSPORTISTA") {
      if (!id_transportista) {
        await pool.query("ROLLBACK");
        return res.status(400).json({
          error: "Debe especificar el transportista para tipo TRANSPORTISTA",
        });
      }

      // Obtener datos del transportista
      const transportistaQuery = `
        SELECT nro_documento, razon_social
        FROM ventas.transportistas
        WHERE id_transportista = $1 AND estado = TRUE
      `;
      const transportistaResult = await pool.query(transportistaQuery, [
        id_transportista,
      ]);

      if (transportistaResult.rows.length === 0) {
        await pool.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "Transportista no encontrado o inactivo" });
      }

      empresa_documento = transportistaResult.rows[0].nro_documento;
      empresa_razon_social = transportistaResult.rows[0].razon_social;
    } else if (tipo_pertenencia === "CLIENTE") {
      if (!id_cliente) {
        await pool.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "Debe especificar el cliente para tipo CLIENTE" });
      }

      // Obtener datos del cliente
      const clienteQuery = `
        SELECT nro_documento, razon_social
        FROM ventas.clientes
        WHERE id_cliente = $1 AND estado = TRUE
      `;
      const clienteResult = await pool.query(clienteQuery, [id_cliente]);

      if (clienteResult.rows.length === 0) {
        await pool.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "Cliente no encontrado o inactivo" });
      }

      empresa_documento = clienteResult.rows[0].nro_documento;
      empresa_razon_social = clienteResult.rows[0].razon_social;
    }

    // Insertar el chofer
    const insertQuery = `
      INSERT INTO ventas.choferes (
        codigo, id_documento, nro_documento, nombre_completo, 
        tipo_pertenencia, id_personal, id_transportista, id_cliente,
        empresa_documento, empresa_razon_social, direccion, id_pais,
        nro_licencia, estado, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const values = [
      codigo,
      id_documento,
      nro_documento,
      nombre_completo,
      tipo_pertenencia,
      tipo_pertenencia === "PERSONAL" ? id_personal : null,
      tipo_pertenencia === "TRANSPORTISTA" ? id_transportista : null,
      tipo_pertenencia === "CLIENTE" ? id_cliente : null,
      empresa_documento,
      empresa_razon_social,
      direccion,
      id_pais || 1,
      nro_licencia,
      true,
      req.userId || 1,
    ];

    const result = await pool.query(insertQuery, values);

    await pool.query("COMMIT");
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error al crear chofer:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    pool.release();
  }
};

// Actualizar un chofer
const actualizarChofer = async (req, res) => {
  try {
    await pool.query("BEGIN");

    const { codigo } = req.params;
    const {
      id_documento,
      nro_documento,
      nombre_completo,
      tipo_pertenencia,
      id_personal,
      id_transportista,
      id_cliente,
      direccion,
      id_pais,
      nro_licencia,
      estado,
    } = req.body;

    // Verificar que el chofer existe
    const existeQuery = "SELECT * FROM ventas.choferes WHERE codigo = $1";
    const existeResult = await pool.query(existeQuery, [codigo]);

    if (existeResult.rows.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({ error: "Chofer no encontrado" });
    }

    const choferActual = existeResult.rows[0];

    // Si se está cambiando el tipo de pertenencia, validar y obtener datos de la empresa
    let empresa_documento = choferActual.empresa_documento;
    let empresa_razon_social = choferActual.empresa_razon_social;
    let nuevo_id_personal = choferActual.id_personal;
    let nuevo_id_transportista = choferActual.id_transportista;
    let nuevo_id_cliente = choferActual.id_cliente;

    const nuevo_tipo = tipo_pertenencia || choferActual.tipo_pertenencia;

    if (nuevo_tipo === "PERSONAL") {
      const personal_id = id_personal || choferActual.id_personal;
      if (!personal_id) {
        await pool.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "Debe especificar el personal para tipo PERSONAL" });
      }

      const personalQuery = `
        SELECT 
          p.nro_documento,
          p.nombre_completo,
          e.nro_documento as empresa_doc,
          e.razon_social
        FROM public.personal p
        LEFT JOIN public.empresa e ON p.id_empresa = e.id_empresa
        WHERE p.id_personal = $1
      `;
      const personalResult = await pool.query(personalQuery, [personal_id]);

      if (personalResult.rows.length === 0) {
        await pool.query("ROLLBACK");
        return res.status(400).json({ error: "Personal no encontrado" });
      }

      empresa_documento = personalResult.rows[0].empresa_doc;
      empresa_razon_social = personalResult.rows[0].razon_social;
      nuevo_id_personal = personal_id;
      nuevo_id_transportista = null;
      nuevo_id_cliente = null;
    } else if (nuevo_tipo === "TRANSPORTISTA") {
      const transportista_id =
        id_transportista || choferActual.id_transportista;
      if (!transportista_id) {
        await pool.query("ROLLBACK");
        return res.status(400).json({
          error: "Debe especificar el transportista para tipo TRANSPORTISTA",
        });
      }

      const transportistaQuery = `
        SELECT nro_documento, razon_social
        FROM ventas.transportistas
        WHERE id_transportista = $1 AND estado = TRUE
      `;
      const transportistaResult = await pool.query(transportistaQuery, [
        transportista_id,
      ]);

      if (transportistaResult.rows.length === 0) {
        await pool.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "Transportista no encontrado o inactivo" });
      }

      empresa_documento = transportistaResult.rows[0].nro_documento;
      empresa_razon_social = transportistaResult.rows[0].razon_social;
      nuevo_id_personal = null;
      nuevo_id_transportista = transportista_id;
      nuevo_id_cliente = null;
    } else if (nuevo_tipo === "CLIENTE") {
      const cliente_id = id_cliente || choferActual.id_cliente;
      if (!cliente_id) {
        await pool.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "Debe especificar el cliente para tipo CLIENTE" });
      }

      const clienteQuery = `
        SELECT nro_documento, razon_social
        FROM ventas.clientes
        WHERE id_cliente = $1 AND estado = TRUE
      `;
      const clienteResult = await pool.query(clienteQuery, [cliente_id]);

      if (clienteResult.rows.length === 0) {
        await pool.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "Cliente no encontrado o inactivo" });
      }

      empresa_documento = clienteResult.rows[0].nro_documento;
      empresa_razon_social = clienteResult.rows[0].razon_social;
      nuevo_id_personal = null;
      nuevo_id_transportista = null;
      nuevo_id_cliente = cliente_id;
    }

    // Actualizar el chofer
    const updateQuery = `
      UPDATE ventas.choferes 
      SET 
        id_documento = COALESCE($1, id_documento),
        nro_documento = COALESCE($2, nro_documento),
        nombre_completo = COALESCE($3, nombre_completo),
        tipo_pertenencia = COALESCE($4, tipo_pertenencia),
        id_personal = $5,
        id_transportista = $6,
        id_cliente = $7,
        empresa_documento = $8,
        empresa_razon_social = $9,
        direccion = COALESCE($10, direccion),
        id_pais = COALESCE($11, id_pais),
        nro_licencia = COALESCE($12, nro_licencia),
        estado = COALESCE($13, estado),
        updated_by = $14,
        updated_at = CURRENT_TIMESTAMP
      WHERE codigo = $15
      RETURNING *
    `;

    const values = [
      id_documento,
      nro_documento,
      nombre_completo,
      tipo_pertenencia,
      nuevo_id_personal,
      nuevo_id_transportista,
      nuevo_id_cliente,
      empresa_documento,
      empresa_razon_social,
      direccion,
      id_pais,
      nro_licencia,
      estado,
      req.userId || 1,
      codigo,
    ];

    const result = await pool.query(updateQuery, values);

    await pool.query("COMMIT");
    res.json(result.rows[0]);
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error al actualizar chofer:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    pool.release();
  }
};

// Eliminar un chofer (cambiar estado a inactivo)
const eliminarChofer = async (req, res) => {
  try {
    const { codigo } = req.params;

    const query = `
      UPDATE ventas.choferes 
      SET estado = FALSE, updated_by = $1, updated_at = CURRENT_TIMESTAMP
      WHERE codigo = $2
      RETURNING *
    `;

    const result = await pool.query(query, [req.userId || 1, codigo]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Chofer no encontrado" });
    }

    res.json({ message: "Chofer eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar chofer:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener opciones para el formulario de choferes
const obtenerOpcionesChoferes = async (req, res) => {
  try {
    // Obtener personal activo con TODOS los datos necesarios
    const personalQuery = `
      SELECT 
        p.id_personal,
        p.codigo,
        p.nombre_completo,
        p.nro_documento,
        p.id_documento,
        p.direccion,
        td.nombre as tipo_documento_nombre,
        td.codigo as tipo_documento_codigo,
        e.nro_documento as empresa_documento,
        e.razon_social as empresa_razon_social,
        e.codigo as empresa_codigo,
        e.id_empresa,
        1 as id_pais
      FROM public.personal p
      LEFT JOIN public.tipo_documento_id td ON p.id_documento = td.id
      LEFT JOIN public.empresa e ON p.id_empresa = e.id_empresa
      ORDER BY p.nombre_completo
    `;
    const personalResult = await pool.query(personalQuery);

    // Obtener transportistas activos con TODOS los datos
    const transportistasQuery = `
      SELECT 
        t.id_transportista,
        t.codigo,
        t.razon_social as nombre,
        t.nro_documento,
        t.id_documento,
        t.direccion,
        t.id_pais,
        t.email,
        t.telefono1,
        t.celular1
      FROM ventas.transportistas t
      WHERE t.estado = TRUE
      ORDER BY t.razon_social
    `;
    const transportistasResult = await pool.query(transportistasQuery);

    // Obtener clientes activos con TODOS los datos
    const clientesQuery = `
      SELECT 
        c.id_cliente,
        c.codigo,
        c.razon_social as nombre,
        c.nro_documento,
        c.id_documento,
        c.direccion,
        c.id_pais,
        c.email,
        c.telefono1,
        c.celular1
      FROM ventas.clientes c
      WHERE c.estado = TRUE
      ORDER BY c.razon_social
    `;
    const clientesResult = await pool.query(clientesQuery);

    // Tipos de pertenencia
    const tiposPertenencia = ["PERSONAL", "TRANSPORTISTA", "CLIENTE"];

    res.json({
      personal: personalResult.rows,
      transportistas: transportistasResult.rows,
      clientes: clientesResult.rows,
      tiposPertenencia,
    });
  } catch (error) {
    console.error("Error al obtener opciones de choferes:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const obtenerDatosFormulario = async (req, res) => {
  try {
    console.log("\n╔═══════════════════════════════════════╗");
    console.log("║  🔄 CARGANDO DATOS DE FORMULARIO      ║");
    console.log("╚═══════════════════════════════════════╝\n");

    // Obtener tipos de documento para identificación
    const tiposDocumentoQuery =
      "SELECT id, codigo, nombre FROM public.tipo_documento_id WHERE estado = TRUE ORDER BY nombre";
    const tiposDocumentoResult = await pool.query(tiposDocumentoQuery);
    console.log(`✅ Tipos de documento: ${tiposDocumentoResult.rows.length}`);

    // Obtener países
    const paisesQuery =
      "SELECT id, codigo, nombre FROM public.paises ORDER BY nombre";
    const paisesResult = await pool.query(paisesQuery);
    console.log(`✅ Países: ${paisesResult.rows.length}`);

    // Obtener departamentos
    const departamentosQuery =
      "SELECT id, nombre, pais_id FROM public.departamentos ORDER BY nombre";
    const departamentosResult = await pool.query(departamentosQuery);
    console.log(`✅ Departamentos: ${departamentosResult.rows.length}`);

    // Obtener distritos
    const distritosQuery =
      "SELECT id, nombre, departamento_id FROM public.distritos ORDER BY nombre";
    const distritosResult = await pool.query(distritosQuery);
    console.log(`✅ Distritos: ${distritosResult.rows.length}`);

    // Obtener vendedores activos
    const vendedoresQuery =
      "SELECT id_vendedor, codigo, nombre FROM ventas.vendedores WHERE estado = TRUE ORDER BY nombre";
    const vendedoresResult = await pool.query(vendedoresQuery);
    console.log(`✅ Vendedores: ${vendedoresResult.rows.length}`);

    // Obtener formas de pago
    const formasPagoQuery =
      "SELECT id, codigo, nombre, forma_pago FROM contabilidad.formas_pago WHERE estado = TRUE ORDER BY nombre";
    const formasPagoResult = await pool.query(formasPagoQuery);
    console.log(`✅ Formas de pago: ${formasPagoResult.rows.length}`);

    // Obtener monedas
    const monedasQuery = `
      SELECT 
        id_moneda as id, 
        codigo, 
        nombre, 
        simbolo, 
        pais, 
        estado 
      FROM contabilidad.cod_moneda 
      WHERE estado = TRUE 
      ORDER BY codigo
    `;
    const monedasResult = await pool.query(monedasQuery);
    console.log(`✅ Monedas: ${monedasResult.rows.length}`);

    // CONSULTA DE CATEGORÍAS
    console.log("\n📋 Ejecutando consulta de categorías...");

    const categoriasQuery = `
      SELECT 
        id_categoria as id, 
        codigo, 
        nombre, 
        siglas,
        ind_venta
      FROM public.categoria 
      WHERE codigo IN ('P', 'T', 'S', 'M')
      ORDER BY 
        CASE codigo
          WHEN 'T' THEN 1
          WHEN 'P' THEN 2
          WHEN 'M' THEN 3
          WHEN 'S' THEN 4
        END
    `;

    console.log("Query SQL:", categoriasQuery);

    const categoriasResult = await pool.query(categoriasQuery);

    console.log(`\n🔍 Resultado de categorías:`);
    console.log(`   - Filas retornadas: ${categoriasResult.rows.length}`);

    if (categoriasResult.rows.length === 0) {
      console.error("\n❌ ERROR CRÍTICO: No se encontraron categorías");
    } else {
      console.log("\n✅ Categorías encontradas:");
      categoriasResult.rows.forEach((cat, index) => {
        console.log(
          `   ${index + 1}. [${cat.codigo}] ${cat.nombre} - ID: ${cat.id}`
        );
      });
    }

    // Obtener documento CTZ para cotizaciones
    const documentoCTZQuery = `
      SELECT 
        id_documento, 
        codigo, 
        nombre,
        siglas
      FROM public.documentos 
      WHERE codigo = 'CTZ' 
      LIMIT 1
    `;
    const documentoCTZResult = await pool.query(documentoCTZQuery);
    const documentoCTZ = documentoCTZResult.rows[0] || null;

    if (!documentoCTZ) {
      console.warn("⚠️ ADVERTENCIA: No se encontró el documento CTZ");
    } else {
      console.log(`✅ Documento CTZ: ${documentoCTZ.nombre}`);
    }

    // Obtener valores de IGV disponibles
    const igvQuery = `
      SELECT 
        id, 
        porcentaje, 
        descripcion 
      FROM public.igv 
      ORDER BY porcentaje DESC
    `;
    const igvResult = await pool.query(igvQuery);
    console.log(`✅ Valores de IGV: ${igvResult.rows.length}`);

    // Obtener opciones de combustible
    const combustibles = [
      "Gasolina",
      "Diesel",
      "Gas Natural",
      "Gas Lic Petroleo",
      "Otros",
    ];

    // Obtener opciones de carrocería
    const carrocerias = [
      "Camión",
      "Bus",
      "Furgoneta",
      "Sedán",
      "Pickup",
      "SUV",
      "Van",
      "Otro",
    ];

    // Obtener opciones de transmisión
    const transmisiones = ["Mecanico", "Automatico"];

    // Preparar respuesta
    const response = {
      tiposDocumento: tiposDocumentoResult.rows,
      paises: paisesResult.rows,
      vendedores: vendedoresResult.rows,
      formasPago: formasPagoResult.rows,
      monedas: monedasResult.rows,
      categorias: categoriasResult.rows,
      documentoCTZ: documentoCTZ,
      igv: igvResult.rows,
      departamentos: departamentosResult.rows,
      distritos: distritosResult.rows,
      combustibles,
      carrocerias,
      transmisiones,
    };

    // VERIFICACIÓN FINAL
    console.log("\n╔═══════════════════════════════════════╗");
    console.log("║  📤 ENVIANDO RESPUESTA AL FRONTEND    ║");
    console.log("╚═══════════════════════════════════════╝\n");

    console.log("Estructura de respuesta:");
    console.log({
      tiposDocumento: response.tiposDocumento.length,
      paises: response.paises.length,
      vendedores: response.vendedores.length,
      formasPago: response.formasPago.length,
      monedas: response.monedas.length,
      categorias: response.categorias.length,
      documentoCTZ: response.documentoCTZ ? "OK" : "NULL",
      igv: response.igv.length,
      departamentos: response.departamentos.length,
      distritos: response.distritos.length,
    });

    if (!response.categorias || response.categorias.length === 0) {
      console.error("\n❌ ALERTA: response.categorias está vacío!");
    } else {
      console.log("\n✅ Categorías que se enviarán:");
      response.categorias.forEach((c) => {
        console.log(`   ✓ [${c.codigo}] ${c.nombre}`);
      });
    }

    console.log("\n🚀 Enviando respuesta JSON...\n");
    res.json(response);
  } catch (error) {
    console.error("\n❌ ERROR AL OBTENER DATOS DE FORMULARIO:");
    console.error("Tipo:", error.name);
    console.error("Mensaje:", error.message);
    console.error("Stack:", error.stack);

    res.status(500).json({
      error: "Error interno del servidor",
      details: error.message,
    });
  }
};

// Obtener departamentos por país
const obtenerDepartamentosPorPais = async (req, res) => {
  try {
    const { paisId } = req.params;

    const query = `
      SELECT d.id, d.nombre, d.pais_id, p.codigo as pais_codigo, p.nombre as pais_nombre
      FROM public.departamentos d
      JOIN public.paises p ON d.pais_id = p.id
      WHERE d.pais_id = $1
      ORDER BY d.nombre
    `;

    const result = await pool.query(query, [paisId]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener departamentos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener distritos por departamento
const obtenerDistritosPorDepartamento = async (req, res) => {
  try {
    const { departamentoId } = req.params;

    const query = `
      SELECT dis.id, dis.nombre, dis.departamento_id, d.nombre as departamento_nombre
      FROM public.distritos dis
      JOIN public.departamentos d ON dis.departamento_id = d.id
      WHERE dis.departamento_id = $1
      ORDER BY dis.nombre
    `;

    const result = await pool.query(query, [departamentoId]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener distritos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ====================================================================
// FUNCIONES PARA COTIZACIONES - ACTUALIZADAS (SIN descuento_porcentaje)
// ====================================================================

// Obtener cliente para cotización (con descuentos incluidos)
const obtenerCotizacionCliente = async (req, res) => {
  try {
    const { busqueda } = req.query;

    if (!busqueda) {
      return res
        .status(400)
        .json({ error: "Debe proporcionar un criterio de búsqueda" });
    }

    const query = `
      SELECT 
        c.id_cliente,
        c.codigo as codigo_cliente,
        c.nro_documento as nro_documento_cliente,
        c.razon_social as razon_social_cliente,
        c.direccion as direccion_cliente,
        c.vendedor_id,
        v.codigo as vendedor_codigo,
        v.nombre as vendedor_nombre,
        c.nomb_comercial,
        c.email,
        c.telefono1,
        c.celular1,
        td.nombre as tipo_documento,
        p.nombre as pais,
        
        -- Información financiera CON descuentos
        COALESCE(ifc.descuento_1, 0) as descuento_1,
        COALESCE(ifc.descuento_2, 0) as descuento_2,
        COALESCE(ifc.linea_credito, 0) as linea_disponible,
        COALESCE(ifc.tasa_interes, 0) as tasa_interes,
        ifc.forma_pago_id
      FROM ventas.clientes c
      LEFT JOIN ventas.vendedores v ON c.vendedor_id = v.id_vendedor
      LEFT JOIN public.tipo_documento_id td ON c.id_documento = td.id
      LEFT JOIN public.paises p ON c.id_pais = p.id
      LEFT JOIN ventas.info_financiera_clientes ifc ON c.id_cliente = ifc.id_cliente
      WHERE c.estado = TRUE
        AND (
          c.codigo ILIKE $1 
          OR c.nro_documento ILIKE $1 
          OR c.razon_social ILIKE $1
        )
      ORDER BY c.razon_social
      LIMIT 20
    `;

    const busquedaParam = `%${busqueda}%`;
    const result = await pool.query(query, [busquedaParam]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "No se encontraron clientes con ese criterio de búsqueda",
      });
    }

    res.json(result.rows);
  } catch (error) {
    console.error("Error al buscar cliente para cotización:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener productos filtrados por categoría
const obtenerProductosCotizacion = async (req, res) => {
  try {
    const { busqueda, categoria } = req.query;

    let query = `
      SELECT 
        p.id_producto,
        p.codigo,
        p.descripcion,
        p.stock_actual,
        p.precio_venta,
        p.precio_unitario,
        p.precio_total,
        c.codigo as categoria_codigo,
        c.nombre as categoria_nombre,
        um.siglas as unidad_medida,
        m.codigo as moneda_codigo,
        m.nombre as moneda_nombre,
        p.afecto_igv
      FROM almacen.productos p
      INNER JOIN public.categoria c ON p.id_categoria = c.id_categoria
      LEFT JOIN public.unidades_medida um ON p.id_unidad = um.id_unidades
      LEFT JOIN contabilidad.cod_moneda m ON p.moneda_id = m.id_moneda
      WHERE p.estado = TRUE
        AND c.codigo IN ('P', 'T', 'S', 'M')
    `;

    const params = [];
    let paramCount = 1;

    // Filtrar por categoría si se proporciona
    if (categoria) {
      query += ` AND c.codigo = $${paramCount}`;
      params.push(categoria);
      paramCount++;
    }

    // Filtrar por búsqueda si se proporciona
    if (busqueda) {
      query += ` AND (p.codigo ILIKE $${paramCount} OR p.descripcion ILIKE $${paramCount})`;
      params.push(`%${busqueda}%`);
    }

    query += ` ORDER BY p.descripcion LIMIT 50`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener productos para cotización:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Función unificada para crear cotización y detalle en una sola transacción - CORREGIDA
const crearCotizacionCompleta = async (req, res) => {
  try {
    await pool.query("BEGIN");

    const {
      // Datos de la cabecera
      id_cliente,
      moneda_id,
      forma_pago_id,
      comentario,
      prioridad,
      reparacion,
      igv_id = 1,
      // Datos del detalle
      detalles = [],
    } = req.body;

    // Validar datos requeridos
    if (!id_cliente || !moneda_id || !forma_pago_id) {
      await pool.query("ROLLBACK");
      return res.status(400).json({
        error: "Faltan datos requeridos: id_cliente, moneda_id, forma_pago_id",
      });
    }

    // Validar que hay detalles
    if (!detalles || detalles.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(400).json({
        error: "La cotización debe tener al menos un producto en el detalle",
      });
    }

    // Obtener datos del cliente
    const clienteQuery = `
      SELECT 
        c.id_cliente,
        c.codigo,
        c.nro_documento,
        c.razon_social,
        c.direccion,
        c.telefono1,
        c.vendedor_id,
        v.nombre as vendedor_nombre,
        COALESCE(ifc.descuento_1, 0) as descuento_1,
        COALESCE(ifc.descuento_2, 0) as descuento_2,
        COALESCE(ifc.linea_credito, 0) as linea_credito
      FROM ventas.clientes c
      LEFT JOIN ventas.vendedores v ON c.vendedor_id = v.id_vendedor
      LEFT JOIN ventas.info_financiera_clientes ifc ON c.id_cliente = ifc.id_cliente
      WHERE c.id_cliente = $1 AND c.estado = TRUE
    `;

    const clienteResult = await pool.query(clienteQuery, [id_cliente]);

    if (clienteResult.rows.length === 0) {
      await pool.query("ROLLBACK");
      return res
        .status(404)
        .json({ error: "Cliente no encontrado o inactivo" });
    }

    const cliente = clienteResult.rows[0];

    // Obtener el id_documento del tipo CTZ (Cotizaciones)
    const docQuery = `
      SELECT id_documento FROM public.documentos WHERE codigo = 'CTZ' LIMIT 1
    `;
    const docResult = await pool.query(docQuery);

    if (docResult.rows.length === 0) {
      await pool.query("ROLLBACK");
      return res
        .status(400)
        .json({ error: "No se encontró el documento tipo CTZ (Cotizaciones)" });
    }

    const id_documento = docResult.rows[0].id_documento;

    // Obtener el porcentaje de IGV
    const igvQuery = `SELECT porcentaje FROM public.igv WHERE id = $1`;
    const igvResult = await pool.query(igvQuery, [igv_id]);
    const igvPorcentaje =
      igvResult.rows.length > 0 ? igvResult.rows[0].porcentaje : 18;

    // Calcular totales desde los detalles
    let importe_bruto = 0;
    let monto_descuento = 0;
    let valor_venta = 0;

    // Validar y calcular totales de los detalles
    for (const detalle of detalles) {
      const {
        cantidad,
        precio_unitario,
        precio_original,
        descuento_1 = 0,
        descuento_2 = 0,
        descuento_monto = 0,
      } = detalle;

      if (!cantidad || !precio_unitario) {
        await pool.query("ROLLBACK");
        return res.status(400).json({
          error: "Cada detalle debe tener cantidad y precio_unitario",
        });
      }

      // ✅ CORREGIDO: Usar precio_original si está disponible, sino usar precio_unitario
      const precioBase = precio_original || precio_unitario;
      const precioBrutoItem = cantidad * precioBase;

      // Calcular descuentos
      let totalDescuento = 0;

      if (descuento_monto > 0) {
        // Usar descuento por monto fijo
        totalDescuento = Math.min(descuento_monto, precioBrutoItem);
      } else {
        // Usar descuentos por porcentaje
        const descuento1Monto = precioBrutoItem * (descuento_1 / 100);
        const precioDespuesDesc1 = precioBrutoItem - descuento1Monto;
        const descuento2Monto = precioDespuesDesc1 * (descuento_2 / 100);

        totalDescuento = descuento1Monto + descuento2Monto;
      }

      const valorVentaItem = precioBrutoItem - totalDescuento;

      importe_bruto += precioBrutoItem;
      monto_descuento += totalDescuento;
      valor_venta += valorVentaItem;
    }

    // Calcular IGV y total
    const igvMonto = valor_venta * (igvPorcentaje / 100);
    const total = valor_venta + igvMonto;

    // Insertar cabecera de cotización
    const insertCotizacionQuery = `
      INSERT INTO ventas.cotizacion_cliente (
        id_documento,
        id_cliente,
        codigo_cliente,
        nro_documento_cliente,
        razon_social_cliente,
        direccion_cliente,
        telefono_cliente,
        vendedor,
        moneda_id,
        forma_pago,
        reparacion,
        prioridad,
        comentario,
        linea_credito,
        importe_bruto,
        monto_descuento,
        valor_venta,
        igv_id,
        igv,
        total,
        created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
      ) RETURNING id_cotizacion, numero
    `;

    const cotizacionValues = [
      id_documento,
      cliente.id_cliente,
      cliente.codigo,
      cliente.nro_documento,
      cliente.razon_social,
      cliente.direccion || "",
      cliente.telefono1 || "",
      cliente.vendedor_nombre || "",
      moneda_id,
      forma_pago_id,
      reparacion || false,
      prioridad || "NORMAL",
      comentario || "",
      cliente.linea_credito || 0,
      importe_bruto,
      monto_descuento,
      valor_venta,
      igv_id,
      igvMonto,
      total,
      req.userId || 1,
    ];

    const cotizacionResult = await pool.query(
      insertCotizacionQuery,
      cotizacionValues
    );
    const nuevaCotizacion = cotizacionResult.rows[0];

    // Insertar los detalles de la cotización - CORREGIDO
    for (let i = 0; i < detalles.length; i++) {
      const detalle = detalles[i];
      const {
        producto_id,
        descripcion_producto,
        cantidad,
        precio_original,
        precio_unitario,
        descuento_1 = 0,
        descuento_2 = 0,
        descuento_monto = 0,
        stock_disponible,
        fecha_entrega,
        prioridad: prioridadItem,
      } = detalle;

      // ✅ CORREGIDO: Usar precio_original como base para cálculos
      const precioBase = precio_original || precio_unitario;
      const precioBrutoItem = cantidad * precioBase;

      let descuento_monto_calculado = 0;

      if (descuento_monto > 0) {
        // Usar descuento por monto fijo
        descuento_monto_calculado = Math.min(descuento_monto, precioBrutoItem);
      } else {
        // Usar descuentos por porcentaje
        const descuento1Monto = precioBrutoItem * (descuento_1 / 100);
        const precioDespuesDesc1 = precioBrutoItem - descuento1Monto;
        const descuento2Monto = precioDespuesDesc1 * (descuento_2 / 100);

        descuento_monto_calculado = descuento1Monto + descuento2Monto;
      }

      const valor_venta_item = precioBrutoItem - descuento_monto_calculado;
      const igv_item = valor_venta_item * (igvPorcentaje / 100);
      const precio_total_item = valor_venta_item + igv_item;

      // ✅ CORREGIDO: Mantener precio_unitario igual al precio_original
      const precio_unitario_final = precio_original || precio_unitario;

      const insertDetalleQuery = `
        INSERT INTO ventas.detalle_cotizacion (
          cotizacion_id,
          fecha_entrega,
          numitem,
          producto_id,
          descripcion_producto,
          descuento_1,
          descuento_2,
          descuento_monto,
          stock_disponible,
          cantidad,
          precio_original,
          precio_unitario,
          precio_bruto,
          valor_venta,
          igv,
          precio_total,
          prioridad
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
        )
      `;

      const detalleValues = [
        nuevaCotizacion.id_cotizacion,
        fecha_entrega || new Date(),
        i + 1, // numitem
        producto_id,
        descripcion_producto,
        descuento_1,
        descuento_2,
        descuento_monto_calculado,
        stock_disponible || 0,
        cantidad,
        precioBase, // precio_original
        precio_unitario_final, // ✅ precio_unitario igual al precio_original
        precioBrutoItem,
        valor_venta_item,
        igv_item,
        precio_total_item,
        prioridadItem || null,
      ];

      await pool.query(insertDetalleQuery, detalleValues);
    }

    await pool.query("COMMIT");

    // Obtener la cotización completa recién creada
    const cotizacionCompleta = await obtenerCotizacionCompletaPorId(
      nuevaCotizacion.id_cotizacion
    );

    res.status(201).json({
      message: "Cotización creada exitosamente",
      cotizacion: cotizacionCompleta,
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error al crear cotización completa:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      details: error.message,
    });
  }
};

// Función auxiliar para obtener cotización completa por ID - CORREGIDA
const obtenerCotizacionCompletaPorId = async (id_cotizacion) => {
  const queryCabecera = `
    SELECT 
      c.*,
      m.codigo as moneda_codigo,
      m.nombre as moneda_nombre,
      m.simbolo as moneda_simbolo,
      fp.codigo as forma_pago_codigo,
      fp.nombre as forma_pago_nombre,
      igv.porcentaje as igv_porcentaje,
      u_created.nombre_completo as creado_por_nombre,
      u_updated.nombre_completo as actualizado_por_nombre,
      COALESCE(ifc.descuento_1, 0) as descuento_1,
      COALESCE(ifc.descuento_2, 0) as descuento_2
    FROM ventas.cotizacion_cliente c
    LEFT JOIN contabilidad.cod_moneda m ON c.moneda_id = m.id_moneda
    LEFT JOIN contabilidad.formas_pago fp ON c.forma_pago = fp.id
    LEFT JOIN public.igv igv ON c.igv_id = igv.id
    LEFT JOIN public.usuarios u_created ON c.created_by = u_created.id
    LEFT JOIN public.usuarios u_updated ON c.updated_by = u_updated.id
    LEFT JOIN ventas.info_financiera_clientes ifc ON c.id_cliente = ifc.id_cliente
    WHERE c.id_cotizacion = $1
  `;

  const queryDetalle = `
    SELECT 
      dc.*,
      p.codigo as producto_codigo,
      p.descripcion as producto_descripcion,
      p.codigo_barras,
      um.siglas as unidad_medida,
      um.nombre as unidad_medida_nombre,
      CASE 
        WHEN dc.precio_original IS NOT NULL AND dc.precio_original > 0 
        THEN dc.precio_original
        ELSE dc.precio_unitario
      END as precio_unitario_corregido
    FROM ventas.detalle_cotizacion dc
    LEFT JOIN almacen.productos p ON dc.producto_id = p.id_producto
    LEFT JOIN public.unidades_medida um ON p.id_unidad = um.id_unidades
    WHERE dc.cotizacion_id = $1
    ORDER BY dc.numitem
  `;

  try {
    const [resultCabecera, resultDetalle] = await Promise.all([
      pool.query(queryCabecera, [id_cotizacion]),
      pool.query(queryDetalle, [id_cotizacion]),
    ]);

    if (resultCabecera.rows.length === 0) {
      return null;
    }

    const detallesCorregidos = resultDetalle.rows.map((detalle) => ({
      ...detalle,
      precio_unitario:
        detalle.precio_unitario_corregido || detalle.precio_unitario,
    }));

    return {
      ...resultCabecera.rows[0],
      detalles: detallesCorregidos,
    };
  } catch (error) {
    console.error("❌ Error en obtenerCotizacionCompletaPorId:", error);
    throw error;
  }
};

// Actualizar cotización completa (cabecera y detalle) - CORREGIDA
const actualizarCotizacionCompleta = async (req, res) => {
  try {
    await pool.query("BEGIN");

    const { id } = req.params;
    const {
      // Datos de la cabecera
      moneda_id,
      forma_pago_id,
      comentario,
      prioridad,
      reparacion,
      igv_id,
      // Datos del detalle
      detalles = [],
    } = req.body;

    // Verificar que la cotización existe y está en estado pendiente
    const cotizacionExistente = await pool.query(
      "SELECT id_cotizacion, estado FROM ventas.cotizacion_cliente WHERE id_cotizacion = $1",
      [id]
    );

    if (cotizacionExistente.rows.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({ error: "Cotización no encontrada" });
    }

    if (cotizacionExistente.rows[0].estado !== "PENDIENTE") {
      await pool.query("ROLLBACK");
      return res.status(400).json({
        error: "Solo se pueden modificar cotizaciones en estado PENDIENTE",
      });
    }

    // Obtener porcentaje de IGV
    const igvQuery = `SELECT porcentaje FROM public.igv WHERE id = $1`;
    const igvResult = await pool.query(igvQuery, [igv_id || 1]);
    const igvPorcentaje =
      igvResult.rows.length > 0 ? igvResult.rows[0].porcentaje : 18;

    // Calcular nuevos totales desde los detalles
    let importe_bruto = 0;
    let monto_descuento = 0;
    let valor_venta = 0;

    for (const detalle of detalles) {
      const {
        cantidad,
        precio_unitario,
        precio_original,
        descuento_1 = 0,
        descuento_2 = 0,
        descuento_monto = 0,
      } = detalle;

      if (!cantidad || !precio_unitario) {
        await pool.query("ROLLBACK");
        return res.status(400).json({
          error: "Cada detalle debe tener cantidad y precio_unitario",
        });
      }

      // ✅ CORREGIDO: Usar precio_original si está disponible, sino usar precio_unitario
      const precioBase = precio_original || precio_unitario;
      const precioBrutoItem = cantidad * precioBase;

      let totalDescuento = 0;

      if (descuento_monto > 0) {
        // Usar descuento por monto fijo
        totalDescuento = Math.min(descuento_monto, precioBrutoItem);
      } else {
        // Usar descuentos por porcentaje
        const descuento1Monto = precioBrutoItem * (descuento_1 / 100);
        const precioDespuesDesc1 = precioBrutoItem - descuento1Monto;
        const descuento2Monto = precioDespuesDesc1 * (descuento_2 / 100);

        totalDescuento = descuento1Monto + descuento2Monto;
      }

      const valorVentaItem = precioBrutoItem - totalDescuento;

      importe_bruto += precioBrutoItem;
      monto_descuento += totalDescuento;
      valor_venta += valorVentaItem;
    }

    // Calcular IGV y total
    const igvMonto = valor_venta * (igvPorcentaje / 100);
    const total = valor_venta + igvMonto;

    // Actualizar cabecera
    const updateCotizacionQuery = `
      UPDATE ventas.cotizacion_cliente 
      SET 
        moneda_id = COALESCE($1, moneda_id),
        forma_pago = COALESCE($2, forma_pago),
        reparacion = COALESCE($3, reparacion),
        prioridad = COALESCE($4, prioridad),
        comentario = COALESCE($5, comentario),
        igv_id = COALESCE($6, igv_id),
        importe_bruto = $7,
        monto_descuento = $8,
        valor_venta = $9,
        igv = $10,
        total = $11,
        updated_by = $12,
        updated_at = CURRENT_TIMESTAMP
      WHERE id_cotizacion = $13
      RETURNING id_cotizacion
    `;

    const cotizacionValues = [
      moneda_id,
      forma_pago_id,
      reparacion,
      prioridad,
      comentario,
      igv_id,
      importe_bruto,
      monto_descuento,
      valor_venta,
      igvMonto,
      total,
      req.userId || 1,
      id,
    ];

    await pool.query(updateCotizacionQuery, cotizacionValues);

    // Eliminar los detalles existentes
    await pool.query(
      "DELETE FROM ventas.detalle_cotizacion WHERE cotizacion_id = $1",
      [id]
    );

    // Insertar los nuevos detalles - CORREGIDO
    for (let i = 0; i < detalles.length; i++) {
      const detalle = detalles[i];
      const {
        producto_id,
        descripcion_producto,
        cantidad,
        precio_original,
        precio_unitario,
        descuento_1 = 0,
        descuento_2 = 0,
        descuento_monto = 0,
        stock_disponible,
        fecha_entrega,
        prioridad: prioridadItem,
      } = detalle;

      // ✅ CORREGIDO: Usar precio_original como base para cálculos
      const precioBase = precio_original || precio_unitario;
      const precioBrutoItem = cantidad * precioBase;

      let descuento_monto_calculado = 0;

      if (descuento_monto > 0) {
        // Usar descuento por monto fijo
        descuento_monto_calculado = Math.min(descuento_monto, precioBrutoItem);
      } else {
        // Usar descuentos por porcentaje
        const descuento1Monto = precioBrutoItem * (descuento_1 / 100);
        const precioDespuesDesc1 = precioBrutoItem - descuento1Monto;
        const descuento2Monto = precioDespuesDesc1 * (descuento_2 / 100);

        descuento_monto_calculado = descuento1Monto + descuento2Monto;
      }

      const valor_venta_item = precioBrutoItem - descuento_monto_calculado;
      const igv_item = valor_venta_item * (igvPorcentaje / 100);
      const precio_total_item = valor_venta_item + igv_item;

      // ✅ CORREGIDO: Mantener precio_unitario igual al precio_original
      const precio_unitario_final = precio_original || precio_unitario;

      const insertDetalleQuery = `
        INSERT INTO ventas.detalle_cotizacion (
          cotizacion_id,
          fecha_entrega,
          numitem,
          producto_id,
          descripcion_producto,
          descuento_1,
          descuento_2,
          descuento_monto,
          stock_disponible,
          cantidad,
          precio_original,
          precio_unitario,
          precio_bruto,
          valor_venta,
          igv,
          precio_total,
          prioridad
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
        )
      `;

      const detalleValues = [
        id,
        fecha_entrega || new Date(),
        i + 1, // numitem
        producto_id,
        descripcion_producto,
        descuento_1,
        descuento_2,
        descuento_monto_calculado,
        stock_disponible || 0,
        cantidad,
        precioBase, // precio_original
        precio_unitario_final, // ✅ precio_unitario igual al precio_original
        precioBrutoItem,
        valor_venta_item,
        igv_item,
        precio_total_item,
        prioridadItem || null,
      ];

      await pool.query(insertDetalleQuery, detalleValues);
    }

    await pool.query("COMMIT");

    // Obtener la cotización actualizada
    const cotizacionActualizada = await obtenerCotizacionCompletaPorId(id);

    res.json({
      message: "Cotización actualizada exitosamente",
      cotizacion: cotizacionActualizada,
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error al actualizar cotización:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      details: error.message,
    });
  }
};

// Obtener cotización por ID (mejorada con todos los campos)
const obtenerCotizacionPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const cotizacionCompleta = await obtenerCotizacionCompletaPorId(id);

    if (!cotizacionCompleta) {
      return res.status(404).json({ error: "Cotización no encontrada" });
    }

    res.json(cotizacionCompleta);
  } catch (error) {
    console.error("Error al obtener cotización completa:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Función corregida para obtener cotizaciones (incluye forma_pago_id)
const obtenerCotizaciones = async (req, res) => {
  try {
    const { estado, fecha_desde, fecha_hasta, cliente } = req.query;

    let query = `
      SELECT 
        c.id_cotizacion,
        c.id_documento,
        c.numero,
        c.fecha,
        c.codigo_cliente,
        c.razon_social_cliente,
        c.nro_documento_cliente,
        c.direccion_cliente,
        c.telefono_cliente,
        c.vendedor as vendedor_nombre,
        c.moneda_id,
        m.codigo as moneda_codigo,
        m.nombre as moneda_nombre,
        c.forma_pago,
        fp.nombre as forma_pago_nombre,
        c.reparacion,
        c.prioridad,
        c.comentario,
        c.importe_bruto,
        c.monto_descuento,
        c.valor_venta,
        c.linea_credito,
        c.igv_id,
        c.igv,
        c.total,
        c.estado,
        c.created_at,
        c.updated_at,
        u_created.nombre_completo as creado_por_nombre
      FROM ventas.cotizacion_cliente c
      LEFT JOIN contabilidad.cod_moneda m ON c.moneda_id = m.id_moneda
      LEFT JOIN contabilidad.formas_pago fp ON c.forma_pago = fp.id
      LEFT JOIN public.usuarios u_created ON c.created_by = u_created.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    // Filtro por estado
    if (estado) {
      query += ` AND c.estado = $${paramCount}`;
      params.push(estado);
      paramCount++;
    }

    // Filtro por fecha desde
    if (fecha_desde) {
      query += ` AND c.fecha >= $${paramCount}`;
      params.push(fecha_desde);
      paramCount++;
    }

    // Filtro por fecha hasta
    if (fecha_hasta) {
      query += ` AND c.fecha <= $${paramCount}`;
      params.push(fecha_hasta);
      paramCount++;
    }

    // Filtro por cliente
    if (cliente) {
      query += ` AND (c.codigo_cliente ILIKE $${paramCount} OR c.razon_social_cliente ILIKE $${paramCount})`;
      params.push(`%${cliente}%`);
      paramCount++;
    }

    query += ` ORDER BY c.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener cotizaciones:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener detalle de cotización
const obtenerDetalleCotizacion = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        dc.*,
        p.codigo as producto_codigo,
        p.codigo_barras,
        um.siglas as unidad_medida
      FROM ventas.detalle_cotizacion dc
      LEFT JOIN almacen.productos p ON dc.producto_id = p.id_producto
      LEFT JOIN public.unidades_medida um ON p.id_unidad = um.id_unidades
      WHERE dc.cotizacion_id = $1
      ORDER BY dc.numitem
    `;

    const result = await pool.query(query, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener detalle de cotización:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Aprobar cotización
const aprobarCotizacion = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      UPDATE ventas.cotizacion_cliente 
      SET 
        estado = 'APROBADO',
        updated_by = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id_cotizacion = $2 AND estado = 'PENDIENTE'
      RETURNING *
    `;

    const result = await pool.query(query, [req.userId || 1, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Cotización no encontrada o no se puede aprobar",
      });
    }

    // Obtener la cotización completa actualizada
    const cotizacionCompleta = await obtenerCotizacionCompletaPorId(id);

    res.json({
      message: "Cotización aprobada exitosamente",
      cotizacion: cotizacionCompleta,
    });
  } catch (error) {
    console.error("Error al aprobar cotización:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      detalle: error.message,
    });
  }
};

// Rechazar cotización
const rechazarCotizacion = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      UPDATE ventas.cotizacion_cliente 
      SET 
        estado = 'RECHAZADO',
        updated_by = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id_cotizacion = $2 AND estado = 'PENDIENTE'
      RETURNING *
    `;

    const result = await pool.query(query, [req.userId || 1, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Cotización no encontrada o no se puede rechazar",
      });
    }

    // Obtener la cotización completa actualizada
    const cotizacionCompleta = await obtenerCotizacionCompletaPorId(id);

    res.json({
      message: "Cotización rechazada exitosamente",
      cotizacion: cotizacionCompleta,
    });
  } catch (error) {
    console.error("Error al rechazar cotización:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      detalle: error.message,
    });
  }
};

// En ventasController.js - FUNCIÓN CORREGIDA
const obtenerCotizacionesPorCliente = async (req, res) => {
  try {
    const { cliente_id } = req.params;
    const { estado } = req.query;

    console.log(
      `🔍 Buscando cotizaciones para cliente ID: ${cliente_id}, estado: ${estado}`
    );

    let query = `
      SELECT 
        c.id_cotizacion,
        c.numero,
        c.fecha,
        c.razon_social_cliente,
        c.total,
        c.estado,
        c.moneda_id,
        m.codigo as moneda_codigo,
        CASE 
          WHEN EXISTS (SELECT 1 FROM ventas.pedidos_cliente p WHERE p.id_cotizacion = c.id_cotizacion) 
          THEN TRUE 
          ELSE FALSE 
        END as convertida_a_pedido
      FROM ventas.cotizacion_cliente c
      LEFT JOIN contabilidad.cod_moneda m ON c.moneda_id = m.id_moneda
      WHERE c.id_cliente = $1
    `;

    const params = [cliente_id];
    let paramCount = 2;

    // Filtrar por estado si se proporciona
    if (estado) {
      query += ` AND c.estado = $${paramCount}`;
      params.push(estado);
      paramCount++;
    }

    query += ` ORDER BY c.fecha DESC, c.created_at DESC`;

    console.log(`📋 Query ejecutada:`, query);
    console.log(`📊 Parámetros:`, params);

    const result = await pool.query(query, params);

    console.log(`✅ Cotizaciones encontradas: ${result.rows.length}`);

    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener cotizaciones por cliente:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      detalle: error.message,
    });
  }
};

// Función para generar PDF de cotización con diseño corporativo mejorado
const generarPDFCotizacion = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener cotización completa
    const cotizacionCompleta = await obtenerCotizacionCompletaPorId(id);

    if (!cotizacionCompleta) {
      return res.status(404).json({ error: "Cotización no encontrada" });
    }

    // Crear documento PDF en orientación HORIZONTAL
    const doc = new PDFDocument({
      margin: 30,
      layout: "landscape",
      size: "A4",
    });

    // Configurar headers para descarga
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Cotizacion-${cotizacionCompleta.numero}.pdf`
    );

    // Pipe el PDF a la respuesta
    doc.pipe(res);

    // ===== VARIABLES DE DISEÑO =====
    const pageWidth = doc.page.width;
    const margin = 30;
    const contentWidth = pageWidth - margin * 2;
    const primaryColor = "#f5f5f5"; // Azul corporativo
    const secondaryColor = "#2d3748"; // Gris oscuro
    const accentColor = "#e53e3e"; // Rojo/acento

    let yPosition = margin;

    // ===== ENCABEZADO CORPORATIVO =====

    // Fondo de encabezado
    doc.fillColor(primaryColor).rect(0, 0, pageWidth, 100).fill();

    const espacioLogoTexto = 20;

    try {
      if (fs.existsSync(logoPath)) {
        // Logo más ancho en el encabezado
        doc.image(logoPath, margin, 15, { width: 150, height: 60 });

        const textoInicioX = margin + 170 + espacioLogoTexto;

        // Información de la empresa sobre fondo blanco
        doc
          .fillColor("#000000")
          .fontSize(16)
          .font("Helvetica-Bold")
          .text("RADIADORES FORTALEZA S.A", textoInicioX, 20)
          .fontSize(9)
          .font("Helvetica")
          .text("AV. SEPARADORA INDUSTRIAL No 1555", textoInicioX, 40)
          .text("Alte Vitarte - Lima, Perú", textoInicioX, 52)
          .text("R.U.C: 20101636411", textoInicioX, 64)
          .text(
            "Tel: (01) 123-4567 | Email: ventas@radiadoresfortaleza.com",
            textoInicioX,
            76
          );
      } else {
        // Si no hay logo, mostrar solo texto en blanco
        doc
          .fillColor("#ffffff")
          .fontSize(16)
          .font("Helvetica-Bold")
          .text("RADIADORES FORTALEZA S.A", margin, 25)
          .fontSize(9)
          .font("Helvetica")
          .text("AV. SEPARADORA INDUSTRIAL No 1555", margin, 45)
          .text("Alte Vitarte - Lima, Perú", margin, 57)
          .text("R.U.C: 20101636411", margin, 69)
          .text(
            "Tel: (01) 123-4567 | Email: ventas@radiadoresfortaleza.com",
            margin,
            81
          );
      }
    } catch (logoError) {
      console.error("Error al cargar el logo:", logoError);
      // Continuar sin logo si hay error
      doc
        .fillColor("#ffffff")
        .fontSize(16)
        .font("Helvetica-Bold")
        .text("RADIADORES FORTALEZA S.A", margin, 25)
        .fontSize(9)
        .font("Helvetica")
        .text("AV. SEPARADORA INDUSTRIAL No 1555", margin, 45)
        .text("Alte Vitarte - Lima, Perú", margin, 57)
        .text("R.U.C: 20101636411", margin, 69)
        .text(
          "Tel: (01) 123-4567 | Email: ventas@radiadoresfortaleza.com",
          margin,
          81
        );
    }

    // Número de cotización a la derecha
    doc
      .fillColor("#000000")
      .fontSize(20)
      .font("Helvetica-Bold")
      .text(`COTIZACIÓN`, pageWidth - 200, 25, { align: "right" })
      .fontSize(14)
      .text(
        `N° ${cotizacionCompleta.numero || "00000011"}`,
        pageWidth - 200,
        50,
        { align: "right" }
      )
      .fontSize(9)
      .text(
        `Fecha: ${new Date().toLocaleDateString("es-PE")}`,
        pageWidth - 200,
        70,
        { align: "right" }
      );

    yPosition = 110;

    // ===== INFORMACIÓN DEL CLIENTE Y COMERCIAL =====

    // Panel de información del cliente
    doc
      .fillColor("#f8f9fa")
      .rect(margin, yPosition, contentWidth / 2 - 10, 70)
      .fill()
      .strokeColor("#e2e8f0")
      .stroke();

    doc
      .fillColor(secondaryColor)
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("INFORMACIÓN DEL CLIENTE", margin + 10, yPosition + 10)
      .fontSize(8)
      .font("Helvetica")
      .text(
        `Razón Social: ${cotizacionCompleta.razon_social_cliente || "N/A"}`,
        margin + 10,
        yPosition + 25
      )
      .text(
        `RUC/DNI: ${cotizacionCompleta.nro_documento_cliente || "N/A"}`,
        margin + 10,
        yPosition + 37
      )
      .text(
        `Dirección: ${cotizacionCompleta.direccion_cliente || "N/A"}`,
        margin + 10,
        yPosition + 49
      )
      .text(
        `Teléfono: ${cotizacionCompleta.telefono_cliente || "N/A"}`,
        margin + 10,
        yPosition + 61
      );

    // Panel de información comercial
    doc
      .fillColor("#f8f9fa")
      .rect(pageWidth / 2 + 10, yPosition, contentWidth / 2 - 10, 70)
      .fill()
      .strokeColor("#e2e8f0")
      .stroke();

    doc
      .fillColor(secondaryColor)
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("INFORMACIÓN COMERCIAL", pageWidth / 2 + 20, yPosition + 10)
      .fontSize(8)
      .font("Helvetica")
      .text(
        `Vendedor: ${
          cotizacionCompleta.vendedor_nombre ||
          cotizacionCompleta.vendedor ||
          "N/A"
        }`,
        pageWidth / 2 + 20,
        yPosition + 25
      )
      .text(
        `Moneda: ${cotizacionCompleta.moneda_nombre || "NUEVO SOL"}`,
        pageWidth / 2 + 20,
        yPosition + 37
      )
      .text(
        `Forma Pago: ${cotizacionCompleta.forma_pago_nombre || "N/A"}`,
        pageWidth / 2 + 20,
        yPosition + 49
      )
      .text(
        `Prioridad: ${cotizacionCompleta.prioridad || "NORMAL"}`,
        pageWidth / 2 + 20,
        yPosition + 61
      );

    yPosition += 85;

    // ===== DETALLE DE PRODUCTOS =====

    // Encabezado de la tabla con estilo corporativo
    const tableTop = yPosition;

    // Fondo del encabezado de la tabla
    doc.fillColor(primaryColor).rect(margin, tableTop, contentWidth, 20).fill();

    // Encabezados de columna
    doc
      .fillColor("#000000")
      .fontSize(8)
      .font("Helvetica-Bold")
      .text("ITEM", margin + 5, tableTop + 7)
      .text("CÓDIGO", margin + 35, tableTop + 7)
      .text("DESCRIPCIÓN", margin + 85, tableTop + 7, {
        width: 180,
        align: "left",
      })
      .text("CANT.", margin + 275, tableTop + 7, { width: 40, align: "center" })
      .text("P. UNIT.", margin + 325, tableTop + 7, {
        width: 65,
        align: "right",
      })
      .text("DSC1 %", margin + 400, tableTop + 7, { width: 40, align: "right" })
      .text("DSC2 %", margin + 450, tableTop + 7, { width: 40, align: "right" })
      .text("DESC. S/", margin + 500, tableTop + 7, {
        width: 55,
        align: "right",
      })
      .text("VALOR VTA.", margin + 565, tableTop + 7, {
        width: 65,
        align: "right",
      })
      .text("IGV S/", margin + 640, tableTop + 7, { width: 55, align: "right" })
      .text("TOTAL S/", margin + 705, tableTop + 7, {
        width: 65,
        align: "right",
      });

    yPosition = tableTop + 25;

    // Detalles de productos
    doc.font("Helvetica").fontSize(7).fillColor(secondaryColor);

    cotizacionCompleta.detalles.forEach((detalle, index) => {
      // Verificar si necesitamos nueva página
      if (yPosition > 450) {
        doc.addPage({ layout: "landscape", margin: 30 });
        yPosition = margin;

        // Recrear encabezado de tabla en nueva página
        doc
          .fillColor(primaryColor)
          .rect(margin, yPosition, contentWidth, 20)
          .fill();

        doc
          .fillColor("#ffffff")
          .fontSize(8)
          .font("Helvetica-Bold")
          .text("ITEM", margin + 5, yPosition + 7)
          .text("CÓDIGO", margin + 35, yPosition + 7)
          .text("DESCRIPCIÓN", margin + 85, yPosition + 7, {
            width: 180,
            align: "left",
          })
          .text("CANT.", margin + 275, yPosition + 7, {
            width: 40,
            align: "center",
          })
          .text("P. UNIT.", margin + 325, yPosition + 7, {
            width: 65,
            align: "right",
          })
          .text("DSC1 %", margin + 400, yPosition + 7, {
            width: 40,
            align: "right",
          })
          .text("DSC2 %", margin + 450, yPosition + 7, {
            width: 40,
            align: "right",
          })
          .text("DESC. S/", margin + 500, yPosition + 7, {
            width: 55,
            align: "right",
          })
          .text("VALOR VTA.", margin + 565, yPosition + 7, {
            width: 65,
            align: "right",
          })
          .text("IGV S/", margin + 640, yPosition + 7, {
            width: 55,
            align: "right",
          })
          .text("TOTAL S/", margin + 705, yPosition + 7, {
            width: 65,
            align: "right",
          });

        yPosition += 25;
      }

      // Fondo alternado para filas
      if (index % 2 === 0) {
        doc
          .fillColor("#f8f9fa")
          .rect(margin, yPosition, contentWidth, 14)
          .fill();
      } else {
        doc
          .fillColor("#ffffff")
          .rect(margin, yPosition, contentWidth, 14)
          .fill();
      }

      doc.fillColor(secondaryColor);

      // Datos del producto
      const precioUnitario = parseFloat(detalle.precio_unitario || 0);
      const cantidad = parseFloat(detalle.cantidad || 0);
      const descuento1 = parseFloat(detalle.descuento_1 || 0);
      const descuento2 = parseFloat(detalle.descuento_2 || 0);
      const descuentoMonto = parseFloat(detalle.descuento_monto || 0);
      const valorVenta = parseFloat(detalle.valor_venta || 0);
      const igv = parseFloat(detalle.igv || 0);
      const total = parseFloat(detalle.precio_total || 0);

      // Descripción truncada si es muy larga
      const descripcion =
        detalle.descripcion_producto || detalle.producto_descripcion || "N/A";
      const descripcionTruncada =
        descripcion.length > 40
          ? descripcion.substring(0, 40) + "..."
          : descripcion;

      doc
        .text((index + 1).toString(), margin + 5, yPosition + 4)
        .text(detalle.producto_codigo || "N/A", margin + 35, yPosition + 4)
        .text(descripcionTruncada, margin + 85, yPosition + 4, {
          width: 180,
          align: "left",
        })
        .text(cantidad.toFixed(2), margin + 275, yPosition + 4, {
          width: 40,
          align: "center",
        })
        .text(`S/ ${precioUnitario.toFixed(2)}`, margin + 325, yPosition + 4, {
          width: 65,
          align: "right",
        })
        .text(`${descuento1.toFixed(1)}%`, margin + 400, yPosition + 4, {
          width: 40,
          align: "right",
        })
        .text(`${descuento2.toFixed(1)}%`, margin + 450, yPosition + 4, {
          width: 40,
          align: "right",
        })
        .text(`S/ ${descuentoMonto.toFixed(2)}`, margin + 500, yPosition + 4, {
          width: 55,
          align: "right",
        })
        .text(`S/ ${valorVenta.toFixed(2)}`, margin + 565, yPosition + 4, {
          width: 65,
          align: "right",
        })
        .text(`S/ ${igv.toFixed(2)}`, margin + 640, yPosition + 4, {
          width: 55,
          align: "right",
        })
        .text(`S/ ${total.toFixed(2)}`, margin + 705, yPosition + 4, {
          width: 65,
          align: "right",
        });

      // Línea separadora entre filas
      doc
        .strokeColor("#e2e8f0")
        .moveTo(margin, yPosition + 14)
        .lineTo(margin + contentWidth, yPosition + 14)
        .stroke();

      yPosition += 14;
    });

    // Línea final de la tabla
    doc
      .strokeColor(primaryColor)
      .lineWidth(2)
      .moveTo(margin, yPosition)
      .lineTo(margin + contentWidth, yPosition)
      .stroke();

    yPosition += 15;

    // ===== TOTALES GENERALES CORREGIDOS =====

    // Panel de totales con diseño mejorado y alineación horizontal
    const totalesWidth = 280;
    const totalesX = pageWidth - margin - totalesWidth;

    doc
      .fillColor("#f8f9fa")
      .rect(totalesX, yPosition, totalesWidth, 120)
      .fill()
      .strokeColor(primaryColor)
      .lineWidth(1)
      .stroke();

    // Encabezado de totales
    doc
      .fillColor("#000000")
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("RESUMEN DE TOTALES", totalesX + 15, yPosition + 15, {
        align: "center",
      });

    // Línea separadora
    doc
      .strokeColor(primaryColor)
      .moveTo(totalesX + 15, yPosition + 35)
      .lineTo(totalesX + totalesWidth - 15, yPosition + 35)
      .stroke();

    // Totales - MEJOR ALINEACIÓN HORIZONTAL
    const totalYStart = yPosition + 45;
    const lineHeight = 18;

    // Configurar columnas para mejor alineación
    const labelWidth = 120;
    const valueWidth = 100;
    const valueX = totalesX + totalesWidth - valueWidth - 15;

    doc.fillColor(secondaryColor).fontSize(9).font("Helvetica-Bold");

    // Fila 1: IMPORTE BRUTO
    doc
      .text("IMPORTE BRUTO:", totalesX + 15, totalYStart, {
        width: labelWidth,
        align: "left",
      })
      .text(
        `S/ ${parseFloat(cotizacionCompleta.importe_bruto || 0).toFixed(2)}`,
        valueX,
        totalYStart,
        { width: valueWidth, align: "right" }
      );

    // Fila 2: DESCUENTO
    doc
      .text("DESCUENTO:", totalesX + 15, totalYStart + lineHeight, {
        width: labelWidth,
        align: "left",
      })
      .text(
        `S/ ${parseFloat(cotizacionCompleta.monto_descuento || 0).toFixed(2)}`,
        valueX,
        totalYStart + lineHeight,
        { width: valueWidth, align: "right" }
      );

    // Fila 3: VALOR VENTA
    doc
      .text("VALOR VENTA:", totalesX + 15, totalYStart + lineHeight * 2, {
        width: labelWidth,
        align: "left",
      })
      .text(
        `S/ ${parseFloat(cotizacionCompleta.valor_venta || 0).toFixed(2)}`,
        valueX,
        totalYStart + lineHeight * 2,
        { width: valueWidth, align: "right" }
      );

    // Fila 4: IMPUESTO (IGV)
    doc
      .text("IMPUESTO (IGV):", totalesX + 15, totalYStart + lineHeight * 3, {
        width: labelWidth,
        align: "left",
      })
      .text(
        `S/ ${parseFloat(cotizacionCompleta.igv || 0).toFixed(2)}`,
        valueX,
        totalYStart + lineHeight * 3,
        { width: valueWidth, align: "right" }
      );

    // Línea separadora antes del total neto
    doc
      .strokeColor(accentColor)
      .lineWidth(1.5)
      .moveTo(totalesX + 15, totalYStart + lineHeight * 4)
      .lineTo(totalesX + totalesWidth - 15, totalYStart + lineHeight * 4)
      .stroke();

    // Total neto destacado
    doc
      .fillColor(accentColor)
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("TOTAL NETO:", totalesX + 15, totalYStart + lineHeight * 4 + 8, {
        width: labelWidth,
        align: "left",
      })
      .text(
        `S/ ${parseFloat(cotizacionCompleta.total || 0).toFixed(2)}`,
        valueX,
        totalYStart + lineHeight * 4 + 8,
        { width: valueWidth, align: "right" }
      );

    // ===== TOTAL EN LETRAS CON MEJOR ESPACIADO =====
    doc
      .fillColor(secondaryColor)
      .fontSize(8)
      .font("Helvetica-Bold")
      .text("SON:", margin, yPosition + 50, { width: 40, align: "left" })
      .font("Helvetica")
      .text(
        convertirNumeroALetras(cotizacionCompleta.total || 0),
        margin + 45,
        yPosition + 50,
        {
          width: totalesX - margin - 60,
          align: "left",
        }
      );

    // ===== INFORMACIÓN ADICIONAL CON MEJOR ESPACIADO =====
    const infoY = yPosition + 140;

    doc
      .fillColor("#718096")
      .fontSize(7)
      .text(
        `Cotización generada el: ${new Date().toLocaleString("es-PE")}`,
        margin,
        infoY
      )
      .text(
        `Válida por 30 días | Estado: ${
          cotizacionCompleta.estado || "PENDIENTE"
        }`,
        margin,
        infoY + 12
      )
      .text(
        `Creado por: ${
          cotizacionCompleta.creado_por_nombre || "Sistema"
        } | Código: VE-R-0101`,
        margin,
        infoY + 24
      );

    yPosition = infoY + 40;

    // ===== PIE DE PÁGINA CORPORATIVO =====
    const pageHeight = doc.page.height;

    // Fondo del pie de página
    doc
      .fillColor(primaryColor)
      .rect(0, pageHeight - 30, pageWidth, 30)
      .fill();

    doc
      .fillColor("#ffffff")
      .fontSize(7)
      .text(
        "RADIADORES FORTALEZA S.A - Especialistas en sistemas de refrigeración vehicular e industrial",
        margin,
        pageHeight - 20
      )
      .text(
        "www.radiadoresfortaleza.com | ventas@radiadoresfortaleza.com | Tel: (01) 123-4567",
        margin,
        pageHeight - 10
      );

    // Finalizar el PDF
    doc.end();
  } catch (error) {
    console.error("Error al generar PDF:", error);
    res.status(500).json({
      error: "Error interno del servidor al generar PDF",
      details: error.message,
    });
  }
};

// Función mejorada para convertir número a letras
const convertirNumeroALetras = (numero) => {
  // Asegurarse de que el número sea un valor numérico
  const num = parseFloat(numero) || 0;

  const unidades = [
    "",
    "UN",
    "DOS",
    "TRES",
    "CUATRO",
    "CINCO",
    "SEIS",
    "SIETE",
    "OCHO",
    "NUEVE",
  ];
  const decenas = [
    "",
    "DIEZ",
    "VEINTE",
    "TREINTA",
    "CUARENTA",
    "CINCUENTA",
    "SESENTA",
    "SETENTA",
    "OCHENTA",
    "NOVENTA",
  ];
  const especiales = {
    11: "ONCE",
    12: "DOCE",
    13: "TRECE",
    14: "CATORCE",
    15: "QUINCE",
    16: "DIECISÉIS",
    17: "DIECISIETE",
    18: "DIECIOCHO",
    19: "DIECINUEVE",
  };

  const entero = Math.floor(num);
  const decimal = Math.round((num - entero) * 100);

  if (entero === 0) {
    return `CERO CON ${decimal.toString().padStart(2, "0")}/100 NUEVOS SOLES`;
  }

  let letras = "";

  // Miles
  if (entero >= 1000) {
    const miles = Math.floor(entero / 1000);
    if (miles === 1) {
      letras += "MIL ";
    } else {
      letras += convertirNumeroSimple(miles) + " MIL ";
    }
  }

  // Centenas
  const restoMil = entero % 1000;
  const centenas = Math.floor(restoMil / 100);

  if (centenas > 0) {
    if (centenas === 1) {
      if (restoMil === 100) {
        letras += "CIEN ";
      } else {
        letras += "CIENTO ";
      }
    } else if (centenas === 5) {
      letras += "QUINIENTOS ";
    } else if (centenas === 7) {
      letras += "SETECIENTOS ";
    } else if (centenas === 9) {
      letras += "NOVECIENTOS ";
    } else {
      letras += unidades[centenas] + "CIENTOS ";
    }
  }

  // Decenas y unidades
  const resto = restoMil % 100;
  if (resto > 0) {
    if (resto in especiales) {
      letras += especiales[resto] + " ";
    } else {
      const decena = Math.floor(resto / 10);
      const unidad = resto % 10;

      if (decena > 0) {
        letras += decenas[decena];
        if (unidad > 0) {
          if (decena === 2 && unidad > 0) {
            letras = letras.replace("VEINTE", "VEINTI") + unidades[unidad];
          } else {
            letras += " Y " + unidades[unidad];
          }
        }
        letras += " ";
      } else if (unidad > 0) {
        letras += unidades[unidad] + " ";
      }
    }
  }

  // Función auxiliar para números simples (sin recursión infinita)
  function convertirNumeroSimple(n) {
    if (n < 10) return unidades[n];
    if (n < 100) {
      if (n in especiales) return especiales[n];
      const d = Math.floor(n / 10);
      const u = n % 10;
      if (d === 2 && u > 0) return "VEINTI" + unidades[u];
      return decenas[d] + (u > 0 ? " Y " + unidades[u] : "");
    }
    return convertirNumeroALetras(n); // Para números más grandes, usar la función principal
  }

  return `${letras.trim()} CON ${decimal
    .toString()
    .padStart(2, "0")}/100 NUEVOS SOLES`.toUpperCase();
};

// Función alternativa más simple (si prefieres HTML to PDF)
const generarPDFCotizacionSimple = async (req, res) => {
  try {
    const { id } = req.params;

    const cotizacionCompleta = await obtenerCotizacionCompletaPorId(id);

    if (!cotizacionCompleta) {
      return res.status(404).json({ error: "Cotización no encontrada" });
    }

    // Crear PDF simple
    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Cotizacion-${cotizacionCompleta.numero}.pdf`
    );

    doc.pipe(res);

    // Contenido simple
    doc.fontSize(20).text("COTIZACIÓN", 100, 100);
    doc.fontSize(12).text(`Número: ${cotizacionCompleta.numero}`, 100, 130);
    doc.text(`Cliente: ${cotizacionCompleta.razon_social_cliente}`, 100, 150);
    doc.text(
      `Fecha: ${new Date(cotizacionCompleta.fecha).toLocaleDateString()}`,
      100,
      170
    );
    doc.text(
      `Total: S/ ${parseFloat(cotizacionCompleta.total).toFixed(2)}`,
      100,
      190
    );

    // Tabla simple de productos
    let y = 230;
    doc.text("Productos:", 100, y);
    y += 20;

    cotizacionCompleta.detalles.forEach((detalle, index) => {
      doc.text(
        `${index + 1}. ${detalle.descripcion_producto} - S/ ${
          detalle.precio_total
        }`,
        120,
        y
      );
      y += 15;
    });

    doc.end();
  } catch (error) {
    console.error("Error al generar PDF simple:", error);
    res.status(500).json({ error: "Error al generar PDF" });
  }
};

module.exports = {
  obtenerVendedores,
  obtenerVendedorPorCodigo,
  crearVendedor,
  actualizarVendedor,
  eliminarVendedor,

  obtenerClientes,
  obtenerClientesActivos,
  obtenerClientePorCodigo,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
  actualizarInfoFinancieraCliente,
  obtenerDepartamentosPorPais,
  obtenerDistritosPorDepartamento,

  obtenerTransportistas,
  obtenerTransportistaPorCodigo,
  crearTransportista,
  actualizarTransportista,
  eliminarTransportista,

  obtenerPuntosPartida,
  obtenerPuntoPartidaPorCodigo,
  crearPuntoPartida,
  actualizarPuntoPartida,
  eliminarPuntoPartida,

  obtenerVehiculos,
  obtenerVehiculoPorPlaca,
  crearVehiculo,
  actualizarVehiculo,
  eliminarVehiculo,

  obtenerChoferes,
  obtenerChoferPorCodigo,
  crearChofer,
  actualizarChofer,
  eliminarChofer,
  obtenerOpcionesChoferes,

  obtenerDatosFormulario,

  obtenerCotizacionCliente,
  obtenerProductosCotizacion,

  crearCotizacionCompleta,
  actualizarCotizacionCompleta,

  obtenerCotizaciones,
  obtenerCotizacionPorId,
  obtenerDetalleCotizacion,
  rechazarCotizacion,
  aprobarCotizacion,
  obtenerCotizacionesPorCliente,

  // Agregar estas nuevas funciones para PDF
  generarPDFCotizacion,
  generarPDFCotizacionSimple,
};
