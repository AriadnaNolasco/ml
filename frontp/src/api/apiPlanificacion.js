// frontend/src/api/apiPlanificacion.js
import api from './api';

// 🔹 Obtener todos los planes
export const getPlanes = () =>
  api.get('/mantenimiento/planificacion');

// 🔹 Resumen
export const getResumen = () =>
  api.get('/mantenimiento/planificacion/resumen');

// 🔹 Calendario (el backend espera anio y mes)
export const getCalendario = (year, month) =>
  api.get(`/mantenimiento/planificacion/calendario?anio=${year}&mes=${month}`);

// 🔹 Crear nuevo plan
export const crearPlan = (data) =>
  api.post('/mantenimiento/planificacion', data);

// 🔹 Eliminar plan
export const eliminarPlan = (id) =>
  api.delete(`/mantenimiento/planificacion/${id}`);

// 🔽 OPCIONES PARA SELECTS (FORMULARIO)
export const getEquiposForPlanificacion = () =>
  api.get('/mantenimiento/planificacion/equipos');

export const getTecnicosForPlanificacion = () =>
  api.get('/mantenimiento/planificacion/tecnicos');
