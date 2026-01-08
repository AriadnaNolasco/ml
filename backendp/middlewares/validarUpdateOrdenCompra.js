const db = require('../config/db'); // ajusta según tu estructura real

const validarUpdateOrdenCompra = async (req, res, next) => {
  try {
    const id = req.params.id;
    const nuevosItems = req.body.items || [];

    // 1️⃣ Obtener estado actual
    const estadoResult = await db.query(
      `SELECT estado FROM compras.orden_compra WHERE id=$1`,
      [id]
    );

    if (estadoResult.rowCount === 0) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }

    const estado = estadoResult.rows[0].estado;

    // 2️⃣ Obtener ítems actuales
    const detalleBD = await db.query(
      `SELECT producto_codigo, cantidad_solicitada
       FROM compras.orden_compra_detalle
       WHERE orden_compra_id=$1`,
      [id]
    );

    const itemsBD = detalleBD.rows;
    const productosBD = itemsBD.map(i => i.producto_codigo);
    const productosCliente = nuevosItems.map(i => i.producto_codigo);

    // =======================================================
    //  VALIDACIONES PARA ESTADO PARCIAL
    // =======================================================
    if (estado === "PARCIAL") {

      // A. ❌ No permitir agregar productos
      const nuevos = productosCliente.filter(p => !productosBD.includes(p));
      if (nuevos.length > 0) {
        return res.status(400).json({
          error: "No se pueden agregar productos en estado PARCIAL"
        });
      }

      // B. ❌ No permitir eliminar productos
      const eliminados = productosBD.filter(p => !productosCliente.includes(p));
      if (eliminados.length > 0) {
        return res.status(400).json({
          error: "No se pueden eliminar productos en estado PARCIAL"
        });
      }

      // C. ❌ No permitir modificar cantidad solicitada
      for (const item of nuevosItems) {
        const original = itemsBD.find(o => o.producto_codigo === item.producto_codigo);
        if (!original) continue;

        if (Number(original.cantidad_solicitada) !== Number(item.cantidad_solicitada)) {
          return res.status(400).json({
            error: `No puede modificar la cantidad solicitada del producto ${item.producto_codigo} en estado PARCIAL`
          });
        }
      }
    }

    // Si todo pasó → continuar con el controlador
    next();

  } catch (error) {
    console.error("Middleware error:", error);
    return res.status(500).json({ error: "Error en validación de la orden" });
  }
};

module.exports = validarUpdateOrdenCompra;