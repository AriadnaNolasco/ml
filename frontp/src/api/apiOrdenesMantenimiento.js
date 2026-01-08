import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

// =====================================================
// TÉCNICOS
// =====================================================

// Obtener todos los técnicos activos
export const getTecnicos = async () => {
    const response = await axios.get(`${API_URL}/mantenimiento/tecnicos`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

// Crear nuevo técnico
export const createTecnico = async (data) => {
    const response = await axios.post(`${API_URL}/mantenimiento/tecnicos`, data, {
        headers: getAuthHeaders()
    });
    return response.data;
};

// =====================================================
// ÓRDENES DE TRABAJO
// =====================================================

// Dashboard - Contadores
export const getDashboardCounters = async () => {
    const response = await axios.get(`${API_URL}/mantenimiento/ordenes-trabajo/dashboard/contadores`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

// Listar Órdenes con Filtros
export const getOrdenesTrabajo = async (params = {}) => {
    const response = await axios.get(`${API_URL}/mantenimiento/ordenes-trabajo`, {
        headers: getAuthHeaders(),
        params
    });
    return response.data;
};

// Obtener equipos disponibles
export const getEquiposDisponibles = async () => {
    const response = await axios.get(`${API_URL}/mantenimiento/ordenes-trabajo/equipos-disponibles`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

// Crear nueva OT
export const createOrdenTrabajo = async (data) => {
    const response = await axios.post(`${API_URL}/mantenimiento/ordenes-trabajo`, data, {
        headers: getAuthHeaders()
    });
    return response.data;
};

// Obtener detalle completo de OT
export const getOrdenTrabajoById = async (id) => {
    const response = await axios.get(`${API_URL}/mantenimiento/ordenes-trabajo/${id}`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

// Actualizar OT
export const updateOrdenTrabajo = async (id, data) => {
    const response = await axios.put(`${API_URL}/mantenimiento/ordenes-trabajo/${id}`, data, {
        headers: getAuthHeaders()
    });
    return response.data;
};

// Eliminar OT
export const deleteOrdenTrabajo = async (id) => {
    const response = await axios.delete(`${API_URL}/mantenimiento/ordenes-trabajo/${id}`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

// Registrar actividad
export const addActividad = async (otId, data) => {
    const response = await axios.post(`${API_URL}/mantenimiento/ordenes-trabajo/${otId}/actividades`, data, {
        headers: getAuthHeaders()
    });
    return response.data;
};

// Agregar material
export const addMaterial = async (otId, data) => {
    const response = await axios.post(`${API_URL}/mantenimiento/ordenes-trabajo/${otId}/materiales`, data, {
        headers: getAuthHeaders()
    });
    return response.data;
};

// Subir adjunto
export const addAdjunto = async (otId, formData) => {
    const response = await axios.post(`${API_URL}/mantenimiento/ordenes-trabajo/${otId}/adjuntos`, formData, {
        headers: {
            ...getAuthHeaders(),
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};