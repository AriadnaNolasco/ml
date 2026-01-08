-- =====================================================
-- FIX: Desactivar triggers que se ejecutan al crear guía
-- Estos triggers deben ejecutarse al CONFIRMAR la nota de salida
-- NO al crear la guía de remisión
-- =====================================================
-- Fecha: 2025-12-29
-- Problema: Al crear guía de remisión se ejecutaban triggers que:
--   1. Actualizaban cantidad_despachada en el pedido
--   2. Cambiaban estado del pedido a DESPACHADO
--   3. Marcaban reservas como DESPACHADAS
--
-- Solución: Desactivar estos triggers y mover la lógica
--   al controlador confirmarNota() para que se ejecute
--   solo cuando se CONFIRMA la nota de salida (BORRADOR → CONFIRMADO)
-- =====================================================

-- 1️⃣ DESACTIVAR: Trigger que actualiza cantidad_despachada al crear guía
DROP TRIGGER IF EXISTS trigger_actualizar_despachado_insert ON ventas.detalle_guia_remision;
DROP TRIGGER IF EXISTS trigger_actualizar_despachado_update ON ventas.detalle_guia_remision;
DROP TRIGGER IF EXISTS trigger_actualizar_despachado_delete ON ventas.detalle_guia_remision;

-- 2️⃣ DESACTIVAR: Trigger que actualiza estado del pedido
DROP TRIGGER IF EXISTS trigger_actualizar_estado_pedido ON ventas.detalle_pedidos_cliente;

-- 3️⃣ DESACTIVAR: Trigger que marca reservas como DESPACHADAS al crear guía
DROP TRIGGER IF EXISTS trigger_actualizar_reserva_insert ON ventas.detalle_guia_remision;
DROP TRIGGER IF EXISTS trigger_actualizar_reserva_delete ON ventas.detalle_guia_remision;

-- =====================================================
-- NOTA: Las funciones se mantienen porque serán llamadas
-- desde el controlador notasController.js al confirmar la nota
-- =====================================================

SELECT '✅ Triggers desactivados correctamente' AS status;
SELECT '⚠️  Ahora la lógica se ejecutará al CONFIRMAR la nota de salida' AS info;
