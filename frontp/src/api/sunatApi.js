import api from './api';

const SUNAT_API_BASE = 'https://api.decolecta.com/v1';

export const sunatApi = {
  async consultarRuc(numeroRuc) {
    try {
      const response = await api.post('/sunat/consultar-ruc', {
        numero_ruc: numeroRuc
      });

      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error al consultar RUC');
    }
  },

  async consultarDni(numeroDni) {
    try {
      const response = await api.post('/sunat/consultar-dni', {
        numero_dni: numeroDni
      });

      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error al consultar DNI');
    }
  },

  // Alternativas directas (si necesitas)
  async consultarRucDirecto(numeroRuc, token) {
    try {
      const response = await fetch(`${SUNAT_API_BASE}/sunat/ruc/full?numero=${numeroRuc}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Error al consultar RUC: ${error.message}`);
    }
  },

  async consultarDniDirecto(numeroDni, token) {
    try {
      const response = await fetch(`${SUNAT_API_BASE}/reniec/dni?numero=${numeroDni}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Error al consultar DNI: ${error.message}`);
    }
  }
};