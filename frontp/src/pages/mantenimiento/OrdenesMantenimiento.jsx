import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Table, Card, Button, Space, Tag, Typography,
  Row, Col, Input, Select, DatePicker, message,
  Modal, Statistic, Popconfirm
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EyeOutlined, EditOutlined,
  FileTextOutlined, ReloadOutlined, CloseCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import OrdenesForm from './OrdenesForm';
import OrdenDetalles from './OrdenDetalles';
import api from '../../api/api';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const OrdenesMantenimiento = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detallesVisible, setDetallesVisible] = useState(false);
  const [selectedOrden, setSelectedOrden] = useState(null);
  const [filtros, setFiltros] = useState({
    codigo: '',
    estado: '',
    tipo: '',
    fecha: null
  });
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    pendientes: 0,
    enProceso: 0,
    completadas: 0
  });

  const estados = {
    PENDIENTE: { color: 'orange', text: 'Pendiente' },
    'EN PROCESO': { color: 'blue', text: 'En Proceso' },
    COMPLETADA: { color: 'green', text: 'Completada' },
    CANCELADA: { color: 'red', text: 'Cancelada' }
  };

  useEffect(() => {
    cargarOrdenes();
  }, []);

  const cargarOrdenes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtros.codigo) params.append('codigo', filtros.codigo);
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.tipo) params.append('tipo', filtros.tipo);
      if (filtros.fecha && filtros.fecha.length === 2) {
        params.append('fecha_inicio', filtros.fecha[0].format('YYYY-MM-DD'));
        params.append('fecha_fin', filtros.fecha[1].format('YYYY-MM-DD'));
      }

      const response = await api.get(`/mantenimiento/ordenes-trabajo?${params.toString()}`);
      const data = response.data;
      setOrdenes(data);

      setEstadisticas({
        total: data.length,
        pendientes: data.filter(o => o.estado === 'PENDIENTE').length,
        enProceso: data.filter(o => o.estado === 'EN PROCESO').length,
        completadas: data.filter(o => o.estado === 'COMPLETADA').length
      });
    } catch (error) {
      console.error('Error:', error);
      message.error('Error al cargar las órdenes');
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltros({ codigo: '', estado: '', tipo: '', fecha: null });
    cargarOrdenes(); // 🔁
  };

  // ... resto del código sin cambios (tabla, modales, etc.)
};

export default OrdenesMantenimiento;
