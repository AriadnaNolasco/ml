// src/api/apiPlanificacion.js
import api from "./api"; // Usa tu instancia axios ya configurada

// Obtener listado de planes
export const getPlanes = () => api.get("/mantenimiento/planificacion");

// Obtener resumen
export const getResumen = () => api.get("/mantenimiento/planificacion/resumen");

// Obtener calendario por mes
export const getCalendario = (year, month) =>
  api.get(`/mantenimiento/planificacion/calendario/${year}/${month}`);

// Crear plan
export const crearPlan = (data) =>
  api.post("/mantenimiento/planificacion", data);

// Eliminar plan
export const eliminarPlan = (id) =>
  api.delete(`/mantenimiento/planificacion/${id}`);
