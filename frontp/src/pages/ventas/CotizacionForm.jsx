import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Row,
  Col,
  Select,
  DatePicker,
  InputNumber,
  Table,
  message,
  Space,
  Card,
  AutoComplete,
  Divider,
  Tag,
  Modal,
  Alert,
} from "antd";
import {
  SaveOutlined,
  CloseOutlined,
  PlusOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  CheckOutlined, // Agregar este ícono
  WarningOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";

const { TextArea } = Input;

const CotizacionForm = ({ cotizacion, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [clienteOptions, setClienteOptions] = useState([]);
  const [todosLosClientes, setTodosLosClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [productoOptions, setProductoOptions] = useState([]);
  const [productos, setProductos] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [formasPago, setFormasPago] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [documentoCTZ, setDocumentoCTZ] = useState(null);
  const [igvOpciones, setIgvOpciones] = useState([]);
  const [igvSeleccionado, setIgvSeleccionado] = useState(1);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [totales, setTotales] = useState({
    importe_bruto: 0,
    descuentos: 0,
    valor_venta: 0,
    igv: 0,
    total: 0,
  });

  // Estado para la nueva fila de producto - ACTUALIZADO
  const [nuevoProducto, setNuevoProducto] = useState({
    producto_id: null,
    producto_codigo: "",
    descripcion: "",
    cantidad: 1,
    precio_original: 0,
    precio_unitario: 0,
    descuento_1: 0,
    descuento_2: 0,
    descuento_monto: 0,
    stock_disponible: 0,
    afecto_igv: true,
    fecha_entrega: dayjs().add(7, "days").format("YYYY-MM-DD"),
  });

  useEffect(() => {
    fetchDatosFormulario();
    fetchTodosLosClientes();
    if (cotizacion && cotizacion.id_cotizacion) {
      cargarCotizacionCompleta(cotizacion.id_cotizacion);
    }
  }, [cotizacion]);

  useEffect(() => {
    calcularTotales();
  }, [productos, igvSeleccionado]);

  // ====================================================================
  // FUNCIONES DE CÁLCULO DE DESCUENTOS - ACTUALIZADAS
  // ====================================================================

  const recalcularDescuentoMonto = (producto) => {
    const cantidad = parseFloat(producto.cantidad) || 0;
    const precioOriginal = parseFloat(producto.precio_original) || 0;
    const desc1 = parseFloat(producto.descuento_1) || 0;
    const desc2 = parseFloat(producto.descuento_2) || 0;

    const precioBruto = cantidad * precioOriginal;
    const descuento1Monto = precioBruto * (desc1 / 100);
    const precioDespuesDesc1 = precioBruto - descuento1Monto;
    const descuento2Monto = precioDespuesDesc1 * (desc2 / 100);

    return parseFloat((descuento1Monto + descuento2Monto).toFixed(2));
  };

  const obtenerPorcentajeIgv = () => {
    const igv = igvOpciones.find((i) => i.id === igvSeleccionado);
    return igv ? igv.porcentaje : 18;
  };

  const calcularPreciosProducto = (producto) => {
    const cantidad = parseFloat(producto.cantidad) || 0;
    const precioOriginal = parseFloat(producto.precio_original) || 0;
    const desc1 = parseFloat(producto.descuento_1) || 0;
    const desc2 = parseFloat(producto.descuento_2) || 0;
    const descMonto = parseFloat(producto.descuento_monto) || 0;

    const precio_bruto = cantidad * precioOriginal;

    let descuento_total = 0;

    // Lógica de cálculo - El descuento_monto ES la suma total
    if (descMonto > 0) {
      // Usar descuento por monto fijo (que ya es la suma de ambos descuentos)
      descuento_total = Math.min(descMonto, precio_bruto);
    } else {
      // Calcular descuentos por porcentaje
      const descuento1Monto = precio_bruto * (desc1 / 100);
      const precioDespuesDesc1 = precio_bruto - descuento1Monto;
      const descuento2Monto = precioDespuesDesc1 * (desc2 / 100);

      descuento_total = descuento1Monto + descuento2Monto;
    }

    const valor_venta = precio_bruto - descuento_total;
    const precio_unitario = cantidad > 0 ? valor_venta / cantidad : 0;

    const porcentajeIgv = obtenerPorcentajeIgv();
    const igv = producto.afecto_igv ? valor_venta * (porcentajeIgv / 100) : 0;
    const precio_total = valor_venta + igv;

    return {
      precio_bruto: parseFloat(precio_bruto.toFixed(2)),
      descuento_monto: parseFloat(descuento_total.toFixed(2)),
      descuento_total: parseFloat(descuento_total.toFixed(2)),
      valor_venta: parseFloat(valor_venta.toFixed(2)),
      precio_unitario: parseFloat(precio_unitario.toFixed(4)),
      igv: parseFloat(igv.toFixed(2)),
      precio_total: parseFloat(precio_total.toFixed(2)),
    };
  };

  // ====================================================================
  // FUNCIONES DE CARGA DE DATOS
  // ====================================================================

  const fetchDatosFormulario = async () => {
    try {
      const token = localStorage.getItem("token");

      console.log("🔄 Cargando datos del formulario...");

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/ventas/formularios/datos`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("📥 Respuesta recibida del servidor:", response.data);

      // Extraer todos los datos de la respuesta
      const {
        formasPago: formasPagoData = [],
        monedas: monedasData = [],
        vendedores: vendedoresData = [],
        tiposDocumento: tiposDocumentoData = [],
        categorias: categoriasData = [],
        documentoCTZ: documentoCTZData = null,
        igv: igvData = [],
      } = response.data;

      // Filtrar categorías para cotización
      const categoriasFiltradas = Array.isArray(categoriasData)
        ? categoriasData.filter(
            (c) => c?.codigo && ["P", "T", "S", "M"].includes(c.codigo.trim())
          )
        : [];

      console.log("📋 Categorías procesadas:", {
        recibidas: categoriasData.length,
        filtradas: categoriasFiltradas.length,
      });

      if (categoriasFiltradas.length === 0) {
        message.warning({
          content: "No se encontraron categorías disponibles para cotización",
          duration: 6,
        });
      }

      setCategorias(categoriasFiltradas);
      setFormasPago(formasPagoData);
      setMonedas(monedasData);
      setVendedores(vendedoresData);
      setTiposDocumento(tiposDocumentoData);
      setDocumentoCTZ(documentoCTZData);
      setIgvOpciones(igvData);

      // Establecer valores por defecto
      if (!cotizacion) {
        if (monedasData.length > 0) {
          const monedaPEN = monedasData.find((m) => m.codigo === "PEN");
          if (monedaPEN) {
            form.setFieldValue("moneda_id", monedaPEN.id);
          }
        }

        // Establecer IGV por defecto (18%)
        if (igvData.length > 0) {
          const igv18 = igvData.find((i) => i.porcentaje === 18);
          if (igv18) {
            setIgvSeleccionado(igv18.id);
          }
        }
      }
    } catch (error) {
      console.error("❌ Error al cargar datos del formulario:", error);
      message.error("Error al cargar datos del formulario");
    }
  };

  const fetchTodosLosClientes = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/ventas/clientes-activos`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      let clientesData = [];
      if (Array.isArray(response.data)) {
        clientesData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        clientesData = response.data.data;
      }

      console.log(`✅ Clientes cargados: ${clientesData.length}`);

      // ✅ LIMPIAR los datos del cliente para NO incluir forma_pago_id
      const clientesLimpios = clientesData.map((cliente) => ({
        ...cliente,
        forma_pago_id: undefined, // ❌ NO incluir forma_pago_id del cliente
      }));

      setTodosLosClientes(clientesLimpios);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
      message.error("Error al cargar lista de clientes");
      setTodosLosClientes([]);
    }
  };

  // ====================================================================
  // FUNCIÓN PARA CARGAR COTIZACIÓN COMPLETA DESDE LA API
  // ====================================================================
  const cargarCotizacionCompleta = async (idCotizacion) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      console.log("🔄 Cargando cotización completa ID:", idCotizacion);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/ventas/cotizaciones/${idCotizacion}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("📥 Datos completos de cotización recibidos:", response.data);

      if (response.data) {
        cargarDatosCotizacion(response.data);
      }
    } catch (error) {
      console.error("❌ Error al cargar cotización completa:", error);
      message.error("Error al cargar los datos de la cotización");
    } finally {
      setLoading(false);
    }
  };

  const cargarDatosCotizacion = (datoCotizacion = null) => {
    const cotizacionData = datoCotizacion || cotizacion;
    if (cotizacionData) {
      console.log("📝 Cargando datos en formulario:", cotizacionData);

      // ✅ ESTABLECER CLIENTE SELECCIONADO
      if (cotizacionData.id_cliente) {
        const clienteDelaCotizacion = {
          id_cliente: cotizacionData.id_cliente,
          codigo: cotizacionData.codigo_cliente,
          razon_social:
            cotizacionData.razon_social_cliente || cotizacionData.razon_social,
          nro_documento:
            cotizacionData.nro_documento_cliente ||
            cotizacionData.nro_documento,
          tipo_documento:
            cotizacionData.tipo_documento || cotizacionData.id_documento,
          direccion:
            cotizacionData.direccion_cliente || cotizacionData.direccion,
          telefono: cotizacionData.telefono_cliente || cotizacionData.telefono,
          descuento_1: cotizacionData.descuento_1 || 0,
          descuento_2: cotizacionData.descuento_2 || 0,
        };
        setClienteSeleccionado(clienteDelaCotizacion);
        console.log(
          "✅ Cliente establecido para edición:",
          clienteDelaCotizacion
        );
      }
      // Mapear correctamente los campos de la BD al formulario
      form.setFieldsValue({
        // Información del cliente
        buscar_cliente: `${cotizacionData.codigo_cliente} - ${
          cotizacionData.razon_social_cliente || cotizacionData.razon_social
        }`,
        id_cliente: cotizacionData.id_cliente,
        codigo_cliente: cotizacionData.codigo_cliente,
        razon_social:
          cotizacionData.razon_social_cliente || cotizacionData.razon_social,
        tipo_documento:
          cotizacionData.tipo_documento || cotizacionData.id_documento,
        nro_documento:
          cotizacionData.nro_documento_cliente || cotizacionData.nro_documento,
        direccion: cotizacionData.direccion_cliente || cotizacionData.direccion,
        telefono_cliente:
          cotizacionData.telefono_cliente || cotizacionData.telefono,
        vendedor: cotizacionData.vendedor || cotizacionData.vendedor_nombre,

        // Datos de la cotización
        fecha: cotizacionData.fecha ? dayjs(cotizacionData.fecha) : dayjs(),
        moneda_id: cotizacionData.moneda_id,
        forma_pago: cotizacionData.forma_pago || cotizacionData.forma_pago_id,
        prioridad: cotizacionData.prioridad,
        reparacion: cotizacionData.reparacion,
        comentario: cotizacionData.comentario,
      });
      // Establecer IGV seleccionado
      if (cotizacionData.igv_id) {
        setIgvSeleccionado(cotizacionData.igv_id);
      }

      // Cargar productos si es una edición
      if (cotizacionData.detalles && Array.isArray(cotizacionData.detalles)) {
        console.log("📦 Cargando productos:", cotizacionData.detalles.length);
        setProductos(
          cotizacionData.detalles.map((detalle, index) => ({
            ...detalle,
            numitem: index + 1,
            producto_codigo: detalle.producto_codigo || "",
            descripcion:
              detalle.descripcion_producto ||
              detalle.producto_descripcion ||
              "",
            precio_original:
              detalle.precio_original || detalle.precio_unitario || 0,
            stock_actual: detalle.stock_disponible || 0,
            descuento_monto: detalle.descuento_monto || 0,
            afecto_igv:
              detalle.afecto_igv !== undefined ? detalle.afecto_igv : true,
          }))
        );
      }
    }
  };

  // ====================================================================
  // FUNCIONES DE BÚSQUEDA - CORREGIDAS
  // ====================================================================

  const buscarCliente = (busqueda) => {
    if (!busqueda || busqueda.length < 2) {
      setClienteOptions([]);
      return;
    }

    const clientesFiltrados = todosLosClientes.filter((cliente) => {
      if (!cliente) return false;

      const codigo = cliente.codigo || "";
      const nroDocumento = cliente.nro_documento || "";
      const razonSocial = cliente.razon_social || "";
      const nombComercial = cliente.nomb_comercial || "";

      const busquedaLower = busqueda.toLowerCase();

      return (
        codigo.toLowerCase().includes(busquedaLower) ||
        nroDocumento.toLowerCase().includes(busquedaLower) ||
        razonSocial.toLowerCase().includes(busquedaLower) ||
        nombComercial.toLowerCase().includes(busquedaLower)
      );
    });

    const options = clientesFiltrados.map((cliente) => ({
      value: cliente.id_cliente ? cliente.id_cliente.toString() : "",
      label: `${cliente.codigo} - ${cliente.razon_social} (${cliente.nro_documento})`,
      cliente: cliente,
    }));

    setClienteOptions(options);
  };

  const seleccionarCliente = (value, option) => {
    const cliente = option.cliente;
    setClienteSeleccionado(cliente);

    console.log("Cliente seleccionado:", {
      codigo: cliente.codigo,
      razon_social: cliente.razon_social,
      descuento_1: cliente.descuento_1,
      descuento_2: cliente.descuento_2,
    });

    // Actualizar descuentos en el estado del nuevo producto
    const nuevoProductoActualizado = {
      ...nuevoProducto,
      descuento_1: cliente.descuento_1 || 0,
      descuento_2: cliente.descuento_2 || 0,
    };

    // Recalcular el monto fijo
    nuevoProductoActualizado.descuento_monto = recalcularDescuentoMonto(
      nuevoProductoActualizado
    );

    setNuevoProducto(nuevoProductoActualizado);

    // ✅ CORREGIDO: NO llenar automáticamente el campo forma_pago
    form.setFieldsValue({
      id_cliente: cliente.id_cliente,
      codigo_cliente: cliente.codigo,
      razon_social: cliente.razon_social,
      tipo_documento: cliente.id_documento,
      nro_documento: cliente.nro_documento,
      direccion: cliente.direccion,
      telefono_cliente: cliente.telefono1 || cliente.celular1 || "",
      vendedor: cliente.vendedor_nombre || "",
      // ❌ NO establecer forma_pago automáticamente
      // forma_pago: undefined // Se deja vacío para que el usuario seleccione
    });

    // Aplicar descuentos del cliente a productos existentes
    if (productos.length > 0) {
      aplicarDescuentosCliente(cliente);
    }
  };

  const buscarProductos = async (busqueda) => {
    if (!busqueda || busqueda.length < 2) {
      setProductoOptions([]);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const params = { busqueda };

      if (categoriaSeleccionada) {
        params.categoria = categoriaSeleccionada;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/ventas/cotizaciones/productos`,
        {
          params,
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setProductoOptions(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error al buscar productos:", error);
      message.error("Error al buscar productos");
      setProductoOptions([]);
    }
  };

  const seleccionarProducto = (value, option) => {
    const producto = option.producto;
    console.log("Producto seleccionado:", producto);

    const nuevoProductoBase = {
      producto_id: producto.id_producto,
      producto_codigo: producto.codigo,
      descripcion: producto.descripcion,
      cantidad: 1,
      precio_original: producto.precio_venta || producto.precio_unitario || 0,
      precio_unitario: producto.precio_venta || producto.precio_unitario || 0,
      descuento_1: clienteSeleccionado?.descuento_1 || 0,
      descuento_2: clienteSeleccionado?.descuento_2 || 0,
      stock_disponible: producto.stock_actual || 0,
      afecto_igv: producto.afecto_igv !== false,
      fecha_entrega: dayjs().add(7, "days").format("YYYY-MM-DD"),
    };

    // Calcular el monto fijo inicial
    nuevoProductoBase.descuento_monto =
      recalcularDescuentoMonto(nuevoProductoBase);

    setNuevoProducto(nuevoProductoBase);
  };

  // ====================================================================
  // FUNCIONES DE PRODUCTOS - ACTUALIZADAS
  // ====================================================================

  const aplicarDescuentosCliente = (cliente) => {
    const productosActualizados = productos.map((producto) => {
      const productoCopy = {
        ...producto,
        descuento_1: cliente.descuento_1 || 0,
        descuento_2: cliente.descuento_2 || 0,
      };

      // Recalcular el monto fijo basado en los nuevos porcentajes
      productoCopy.descuento_monto = recalcularDescuentoMonto(productoCopy);

      const precios = calcularPreciosProducto(productoCopy);

      return {
        ...productoCopy,
        ...precios,
      };
    });

    setProductos(productosActualizados);
  };

  const calcularTotales = () => {
    if (!Array.isArray(productos) || productos.length === 0) {
      setTotales({
        importe_bruto: 0,
        descuentos: 0,
        valor_venta: 0,
        igv: 0,
        total: 0,
      });
      return;
    }

    const importe_bruto = productos.reduce(
      (sum, p) => sum + (parseFloat(p.precio_bruto) || 0),
      0
    );

    const descuentos = productos.reduce(
      (sum, p) => sum + (parseFloat(p.descuento_monto) || 0),
      0
    );

    const valor_venta = productos.reduce(
      (sum, p) => sum + (parseFloat(p.valor_venta) || 0),
      0
    );

    const igv = productos.reduce((sum, p) => sum + (parseFloat(p.igv) || 0), 0);
    const total = productos.reduce(
      (sum, p) => sum + (parseFloat(p.precio_total) || 0),
      0
    );

    setTotales({
      importe_bruto: parseFloat(importe_bruto.toFixed(2)),
      descuentos: parseFloat(descuentos.toFixed(2)),
      valor_venta: parseFloat(valor_venta.toFixed(2)),
      igv: parseFloat(igv.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
    });
  };

  const agregarProducto = () => {
    if (!nuevoProducto.producto_id) {
      message.warning("Debe seleccionar un producto");
      return;
    }

    if (!clienteSeleccionado) {
      message.warning("Debe seleccionar un cliente primero");
      return;
    }

    const existe = productos.find(
      (p) => p.producto_id === nuevoProducto.producto_id
    );
    if (existe) {
      message.warning("Este producto ya está agregado");
      return;
    }

    const precios = calcularPreciosProducto(nuevoProducto);

    const productoCompleto = {
      ...nuevoProducto,
      ...precios,
      numitem: productos.length + 1,
    };

    setProductos([...productos, productoCompleto]);
    setModalVisible(false);

    // Limpiar formulario
    resetearModalProducto();
    message.success("Producto agregado correctamente");
  };

  const resetearModalProducto = () => {
    setCategoriaSeleccionada(null);
    setNuevoProducto({
      producto_id: null,
      producto_codigo: "",
      descripcion: "",
      cantidad: 1,
      precio_original: 0,
      precio_unitario: 0,
      descuento_1: clienteSeleccionado?.descuento_1 || 0,
      descuento_2: clienteSeleccionado?.descuento_2 || 0,
      descuento_monto: 0,
      stock_disponible: 0,
      afecto_igv: true,
      fecha_entrega: dayjs().add(7, "days").format("YYYY-MM-DD"),
    });
    setProductoOptions([]);
  };

  const eliminarProducto = (index) => {
    const nuevosProductos = productos.filter((_, i) => i !== index);
    const productosReordenados = nuevosProductos.map((p, idx) => ({
      ...p,
      numitem: idx + 1,
    }));

    setProductos(productosReordenados);
    message.success("Producto eliminado");
  };

  const actualizarCantidad = (index, nuevaCantidad) => {
    const nuevosProductos = [...productos];
    nuevosProductos[index].cantidad = nuevaCantidad;

    // Recalcular descuento monto
    nuevosProductos[index].descuento_monto = recalcularDescuentoMonto(
      nuevosProductos[index]
    );

    const precios = calcularPreciosProducto(nuevosProductos[index]);
    nuevosProductos[index] = {
      ...nuevosProductos[index],
      ...precios,
    };

    setProductos(nuevosProductos);
  };

  const actualizarPrecioOriginal = (index, nuevoPrecio) => {
    const nuevosProductos = [...productos];
    nuevosProductos[index].precio_original = nuevoPrecio;

    // Recalcular descuento monto
    nuevosProductos[index].descuento_monto = recalcularDescuentoMonto(
      nuevosProductos[index]
    );

    const precios = calcularPreciosProducto(nuevosProductos[index]);
    nuevosProductos[index] = {
      ...nuevosProductos[index],
      ...precios,
    };

    setProductos(nuevosProductos);
  };

  const actualizarFechaEntrega = (index, nuevaFecha) => {
    const nuevosProductos = [...productos];
    nuevosProductos[index].fecha_entrega = nuevaFecha;
    setProductos(nuevosProductos);
  };

  // ====================================================================
  // GUARDAR COTIZACIÓN - ACTUALIZADO
  // ====================================================================

  const guardarCotizacion = async (values) => {
    if (productos.length === 0) {
      message.warning("Debe agregar al menos un producto");
      return;
    }

    if (!clienteSeleccionado) {
      message.warning("Debe seleccionar un cliente");
      return;
    }

    if (!values.forma_pago) {
      message.warning("Debe seleccionar una forma de pago");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const cotizacionCompleta = {
        id_cliente: clienteSeleccionado.id_cliente,
        moneda_id: values.moneda_id,
        forma_pago_id: values.forma_pago,
        igv_id: igvSeleccionado,
        prioridad: values.prioridad || "NORMAL",
        reparacion: values.reparacion || false,
        comentario: values.comentario || "",
        detalles: productos.map((p) => ({
          producto_id: p.producto_id,
          descripcion_producto: p.descripcion,
          cantidad: p.cantidad,
          precio_original: p.precio_original,
          precio_unitario: p.precio_unitario,
          descuento_1: p.descuento_1 || 0,
          descuento_2: p.descuento_2 || 0,
          descuento_monto: p.descuento_monto || 0,
          stock_disponible: p.stock_disponible || 0,
          fecha_entrega: p.fecha_entrega,
          prioridad: p.prioridad || values.prioridad || "NORMAL",
        })),
      };

      console.log("📤 Enviando cotización completa:", cotizacionCompleta);

      let response;

      if (cotizacion) {
        response = await axios.put(
          `${import.meta.env.VITE_API_URL}/ventas/cotizaciones/${
            cotizacion.id_cotizacion
          }/completa`,
          cotizacionCompleta,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        response = await axios.post(
          `${import.meta.env.VITE_API_URL}/ventas/cotizaciones/completa`,
          cotizacionCompleta,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      console.log("✅ Cotización guardada:", response.data);

      const action = cotizacion ? "actualizada" : "creada";
      message.success({
        content: `Cotización ${
          response.data.cotizacion?.numero || ""
        } ${action} exitosamente`,
        duration: 3,
      });

      // Limpiar formulario
      form.resetFields();
      setProductos([]);
      setClienteSeleccionado(null);

      if (onSuccess) {
        onSuccess(response.data.cotizacion);
      }
    } catch (error) {
      console.error("❌ Error al guardar cotización:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detalle ||
        "Error al guardar la cotización";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Agrega estas funciones dentro del componente CotizacionForm

const aprobarCotizacion = async (idCotizacion) => {
  try {
    setLoading(true);
    const token = localStorage.getItem("token");

    const response = await axios.put(
      `${import.meta.env.VITE_API_URL}/ventas/cotizaciones/${idCotizacion}/aprobar`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    message.success("Cotización aprobada exitosamente");
    
    // Recargar los datos de la cotización
    if (onSuccess) {
      onSuccess(response.data.cotizacion);
    }
    
    // Recargar la cotización completa
    cargarCotizacionCompleta(idCotizacion);
    
  } catch (error) {
    console.error("❌ Error al aprobar cotización:", error);
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.detalle ||
      "Error al aprobar la cotización";
    message.error(errorMessage);
  } finally {
    setLoading(false);
  }
};

const rechazarCotizacion = async (idCotizacion) => {
  try {
    setLoading(true);
    const token = localStorage.getItem("token");

    const response = await axios.put(
      `${import.meta.env.VITE_API_URL}/ventas/cotizaciones/${idCotizacion}/rechazar`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    message.success("Cotización rechazada exitosamente");
    
    // Recargar los datos de la cotización
    if (onSuccess) {
      onSuccess(response.data.cotizacion);
    }
    
    // Recargar la cotización completa
    cargarCotizacionCompleta(idCotizacion);
    
  } catch (error) {
    console.error("❌ Error al rechazar cotización:", error);
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.detalle ||
      "Error al rechazar la cotización";
    message.error(errorMessage);
  } finally {
    setLoading(false);
  }
};

  // ====================================================================
  // COLUMNAS DE LA TABLA - ACTUALIZADAS
  // ====================================================================

  const columns = [
    {
      title: "#",
      dataIndex: "numitem",
      key: "numitem",
      width: 50,
      align: "center",
    },
    {
      title: "Código",
      dataIndex: "producto_codigo",
      key: "producto_codigo",
      width: 100,
    },
    {
      title: "Descripción",
      dataIndex: "descripcion",
      key: "descripcion",
      width: 200,
    },
    {
      title: "F. Entrega",
      dataIndex: "fecha_entrega",
      key: "fecha_entrega",
      width: 120,
      render: (fecha, record, index) => (
        <DatePicker
          value={fecha ? dayjs(fecha) : null}
          onChange={(date) =>
            actualizarFechaEntrega(
              index,
              date ? date.format("YYYY-MM-DD") : null
            )
          }
          format='DD/MM/YYYY'
          size='small'
        />
      ),
    },
    {
      title: "Stock",
      dataIndex: "stock_disponible",
      key: "stock_disponible",
      width: 80,
      align: "right",
      render: (stock) => parseFloat(stock || 0).toFixed(2),
    },
    {
      title: "Cantidad",
      dataIndex: "cantidad",
      key: "cantidad",
      width: 90,
      render: (cantidad, record, index) => (
        <InputNumber
          min={0.01}
          value={cantidad}
          onChange={(value) => actualizarCantidad(index, value)}
          precision={3}
          size='small'
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "P. Original",
      dataIndex: "precio_original",
      key: "precio_original",
      width: 110,
      align: "right",
      render: (precio, record, index) => (
        <InputNumber
          min={0}
          value={precio}
          onChange={(value) => actualizarPrecioOriginal(index, value)}
          precision={2}
          size='small'
          style={{ width: "100%" }}
          prefix='S/'
        />
      ),
    },
    {
      title: "Desc.1 (%)",
      dataIndex: "descuento_1",
      key: "descuento_1",
      width: 80,
      align: "right",
      render: (desc) => (
        <span style={{ color: "#888" }}>
          {parseFloat(desc || 0).toFixed(2)}%
        </span>
      ),
    },
    {
      title: "Desc.2 (%)",
      dataIndex: "descuento_2",
      key: "descuento_2",
      width: 80,
      align: "right",
      render: (desc) => (
        <span style={{ color: "#888" }}>
          {parseFloat(desc || 0).toFixed(2)}%
        </span>
      ),
    },
    {
      title: "Desc. Monto Fijo (Total)",
      dataIndex: "descuento_monto",
      key: "descuento_monto",
      width: 140,
      align: "right",
      render: (monto) => (
        <span style={{ fontWeight: "bold", color: "#ff4d4f" }}>
          S/ {parseFloat(monto || 0).toFixed(2)}
        </span>
      ),
    },
    {
      title: "P. Bruto",
      dataIndex: "precio_bruto",
      key: "precio_bruto",
      width: 100,
      align: "right",
      render: (precio) => `S/ ${parseFloat(precio || 0).toFixed(2)}`,
    },
    {
      title: "Descuento",
      dataIndex: "descuento_monto",
      key: "descuento_monto_display",
      width: 100,
      align: "right",
      render: (monto) => (
        <span style={{ color: "#ff4d4f" }}>
          - S/ {parseFloat(monto || 0).toFixed(2)}
        </span>
      ),
    },
    {
      title: "Valor Venta",
      dataIndex: "valor_venta",
      key: "valor_venta",
      width: 110,
      align: "right",
      render: (valor) => `S/ ${parseFloat(valor || 0).toFixed(2)}`,
    },
    {
      title: "IGV",
      dataIndex: "igv",
      key: "igv",
      width: 90,
      align: "right",
      render: (igv) => `S/ ${parseFloat(igv || 0).toFixed(2)}`,
    },
    {
      title: "Total",
      dataIndex: "precio_total",
      key: "precio_total",
      width: 110,
      align: "right",
      render: (total) => (
        <strong>S/ {parseFloat(total || 0).toFixed(2)}</strong>
      ),
    },
    {
      title: "Acciones",
      key: "acciones",
      width: 80,
      fixed: "right",
      render: (_, record, index) => (
        <Button
          type='text'
          danger
          icon={<DeleteOutlined />}
          onClick={() => eliminarProducto(index)}
          size='small'
        />
      ),
    },
  ];

  // ====================================================================
  // RENDER
  // ====================================================================

  return (
    <Form
      form={form}
      layout='vertical'
      onFinish={guardarCotizacion}
      initialValues={{
        fecha: dayjs(),
        prioridad: "NORMAL",
        reparacion: false,
      }}
    >
      {/* Información del Cliente */}
      <Card
        title={
          <Space>
            <UserOutlined />
            Información del Cliente
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label='Buscar Cliente'
              name='buscar_cliente'
              rules={[
                { required: true, message: "Debe seleccionar un cliente" },
              ]}
            >
              <AutoComplete
                options={clienteOptions}
                onSearch={buscarCliente}
                onSelect={seleccionarCliente}
                placeholder='Buscar por código, documento o razón social'
                allowClear
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label='Código Cliente' name='codigo_cliente'>
              <Input readOnly />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label='Razón Social' name='razon_social'>
              <Input readOnly />
            </Form.Item>
          </Col>

          <Col xs={24} md={6}>
            <Form.Item label='RUC/DNI' name='nro_documento'>
              <Input readOnly />
            </Form.Item>
          </Col>

          <Col xs={24} md={6}>
            <Form.Item label='Teléfono' name='telefono_cliente'>
              <Input readOnly />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item label='Dirección' name='direccion'>
              <Input readOnly />
            </Form.Item>
          </Col>

          {clienteSeleccionado && (
            <Col xs={24}>
              <Card size='small' style={{ backgroundColor: "#f5f5f5" }}>
                <Row gutter={16}>
                  <Col span={8}>
                    <strong>Descuento 1:</strong>{" "}
                    {clienteSeleccionado.descuento_1 || 0}%
                  </Col>
                  <Col span={8}>
                    <strong>Descuento 2:</strong>{" "}
                    {clienteSeleccionado.descuento_2 || 0}%
                  </Col>
                  <Col span={8}>
                    <strong>Línea de Crédito:</strong> S/{" "}
                    {parseFloat(clienteSeleccionado.linea_credito || 0).toFixed(
                      2
                    )}
                  </Col>
                </Row>
              </Card>
            </Col>
          )}
        </Row>
      </Card>

      {/* Datos de la Cotización */}
      <Card title='Datos de la Cotización' style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} md={6}>
            <Form.Item label='Fecha' name='fecha'>
              <DatePicker style={{ width: "100%" }} format='DD/MM/YYYY' />
            </Form.Item>
          </Col>

          <Col xs={24} md={6}>
            <Form.Item
              label='Moneda'
              name='moneda_id'
              rules={[{ required: true, message: "Seleccione la moneda" }]}
            >
              <Select placeholder='Seleccione moneda'>
                {monedas.map((moneda) => (
                  <Select.Option key={moneda.id} value={moneda.id}>
                    {moneda.codigo} - {moneda.nombre}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={6}>
            <Form.Item label='IGV' required>
              <Select
                value={igvSeleccionado}
                onChange={(value) => {
                  setIgvSeleccionado(value);
                  if (productos.length > 0) {
                    const productosActualizados = productos.map((p) => {
                      const precios = calcularPreciosProducto(p);
                      return { ...p, ...precios };
                    });
                    setProductos(productosActualizados);
                  }
                }}
                placeholder='Seleccione IGV'
              >
                {igvOpciones.map((opcion) => (
                  <Select.Option key={opcion.id} value={opcion.id}>
                    {opcion.descripcion} ({opcion.porcentaje}%)
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={6}>
            <Form.Item
              label='Forma de Pago'
              name='forma_pago'
              rules={[{ required: true, message: "Seleccione forma de pago" }]}
            >
              <Select placeholder='Seleccione forma de pago' allowClear>
                {formasPago.map((fp) => (
                  <Select.Option key={fp.id} value={fp.id}>
                    {fp.nombre}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={6}>
            <Form.Item label='Prioridad' name='prioridad'>
              <Select>
                <Select.Option value='NORMAL'>Normal</Select.Option>
                <Select.Option value='URGENTE'>Urgente</Select.Option>
                <Select.Option value='STOCK NORMAL'>Stock Normal</Select.Option>
                <Select.Option value='STOCK URGENTE'>
                  Stock Urgente
                </Select.Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={6}>
            <Form.Item
              label='¿Es Reparación?'
              name='reparacion'
              valuePropName='checked'
            >
              <Select>
                <Select.Option value={false}>No</Select.Option>
                <Select.Option value={true}>Sí</Select.Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={6}>
            <Form.Item label='Estado'>
              <Tag
                color={
                  cotizacion?.estado === "APROBADO"
                    ? "green"
                    : cotizacion?.estado === "RECHAZADO"
                    ? "red"
                    : cotizacion?.estado === "PENDIENTE"
                    ? "orange"
                    : "default"
                }
                style={{ fontSize: "14px", padding: "4px 8px" }}
              >
                {cotizacion?.estado || "PENDIENTE"}
              </Tag>
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item label='Comentarios' name='comentario'>
              <TextArea rows={2} placeholder='Comentarios adicionales' />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* Productos */}
      <Card
        title='Productos'
        extra={
          <Button
            type='primary'
            icon={<PlusOutlined />}
            onClick={() => {
              if (!clienteSeleccionado) {
                message.warning("Primero debe seleccionar un cliente");
                return;
              }
              resetearModalProducto();
              setModalVisible(true);
            }}
          >
            Agregar Producto
          </Button>
        }
        style={{ marginBottom: 16 }}
      >
        <Table
          columns={columns}
          dataSource={productos}
          rowKey={(record) => record.numitem}
          pagination={false}
          scroll={{ x: 1900 }}
          size='small'
          locale={{
            emptyText: "No hay productos agregados",
          }}
        />
      </Card>

      {/* Totales */}
      <Card title='Resumen' style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Space direction='vertical' style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Importe Bruto:</span>
                <strong>S/ {totales.importe_bruto.toFixed(2)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Descuentos:</span>
                <strong style={{ color: "#ff4d4f" }}>
                  - S/ {totales.descuentos.toFixed(2)}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Valor de Venta:</span>
                <strong>S/ {totales.valor_venta.toFixed(2)}</strong>
              </div>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction='vertical' style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>IGV ({obtenerPorcentajeIgv()}%):</span>
                <strong>S/ {totales.igv.toFixed(2)}</strong>
              </div>
              <Divider style={{ margin: "8px 0" }} />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "18px",
                }}
              >
                <span>TOTAL:</span>
                <strong style={{ color: "#1890ff" }}>
                  S/ {totales.total.toFixed(2)}
                </strong>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>

      <div style={{ marginTop: 24, textAlign: "right" }}>
        <Space>
          <Button icon={<CloseOutlined />} onClick={onCancel}>
            Cancelar
          </Button>

          {/* Botones de aprobación/rechazo solo para cotizaciones pendientes */}
          {cotizacion && cotizacion.estado === "PENDIENTE" && (
            <>
              <Button
                type='primary'
                danger
                icon={<CloseOutlined />}
                onClick={() => rechazarCotizacion(cotizacion.id_cotizacion)}
                loading={loading}
              >
                Rechazar
              </Button>
              <Button
                type='primary'
                icon={<CheckOutlined />}
                onClick={() => aprobarCotizacion(cotizacion.id_cotizacion)}
                loading={loading}
                style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
              >
                Aprobar
              </Button>
            </>
          )}

          <Button
            type='primary'
            icon={<SaveOutlined />}
            htmlType='submit'
            loading={loading}
          >
            {cotizacion ? "Actualizar Cotización" : "Guardar Cotización"}
          </Button>
        </Space>
      </div>

      {/* Modal para Agregar Productos - ACTUALIZADO */}
      <Modal
        title='Agregar Producto'
        open={modalVisible}
        onOk={agregarProducto}
        onCancel={() => {
          setModalVisible(false);
          resetearModalProducto();
        }}
        okText='Agregar'
        cancelText='Cancelar'
        okButtonProps={{ disabled: !nuevoProducto.producto_codigo }}
        width={700}
      >
        <Space direction='vertical' style={{ width: "100%" }} size='middle'>
          <div>
            <label
              style={{
                fontWeight: "bold",
                marginBottom: "4px",
                display: "block",
              }}
            >
              Categoría de Producto: *
            </label>
            <Select
              style={{ width: "100%" }}
              placeholder='Seleccione una categoría'
              allowClear
              value={categoriaSeleccionada}
              onChange={(value) => {
                setCategoriaSeleccionada(value);
                setProductoOptions([]);
                setNuevoProducto({
                  ...nuevoProducto,
                  producto_id: null,
                  producto_codigo: "",
                  descripcion: "",
                });
              }}
            >
              {categorias.map((cat) => (
                <Select.Option key={cat.codigo} value={cat.codigo}>
                  {cat.nombre} ({cat.siglas})
                </Select.Option>
              ))}
            </Select>
          </div>

          <div>
            <label>Buscar Producto:</label>
            <AutoComplete
              style={{ width: "100%" }}
              options={productoOptions.map((p) => ({
                value: p.codigo,
                label: `${p.codigo} - ${p.descripcion}`,
                producto: p,
              }))}
              onSearch={buscarProductos}
              onSelect={seleccionarProducto}
              placeholder='Buscar por código o descripción'
              value={nuevoProducto.producto_codigo}
              onChange={(value) =>
                setNuevoProducto({ ...nuevoProducto, producto_codigo: value })
              }
              disabled={!categoriaSeleccionada}
            />
          </div>

          {nuevoProducto.producto_codigo && (
            <>
              <Divider style={{ margin: "8px 0" }} />

              <Row gutter={16}>
                <Col span={12}>
                  <label>Stock Disponible:</label>
                  <Input value={nuevoProducto.stock_disponible || 0} readOnly />
                </Col>
                <Col span={12}>
                  <label>Cantidad:</label>
                  <InputNumber
                    min={0.01}
                    value={nuevoProducto.cantidad}
                    onChange={(value) => {
                      const nuevoValor = value || 1;
                      const productoActualizado = {
                        ...nuevoProducto,
                        cantidad: nuevoValor,
                      };

                      // Recalcular descuento monto
                      productoActualizado.descuento_monto =
                        recalcularDescuentoMonto(productoActualizado);

                      setNuevoProducto(productoActualizado);
                    }}
                    style={{ width: "100%" }}
                  />
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <label>Precio Original:</label>
                  <InputNumber
                    min={0}
                    precision={2}
                    value={nuevoProducto.precio_original}
                    onChange={(value) => {
                      const nuevoValor = value || 0;
                      const productoActualizado = {
                        ...nuevoProducto,
                        precio_original: nuevoValor,
                        precio_unitario: nuevoValor,
                      };

                      // Recalcular descuento monto
                      productoActualizado.descuento_monto =
                        recalcularDescuentoMonto(productoActualizado);

                      setNuevoProducto(productoActualizado);
                    }}
                    style={{ width: "100%" }}
                    prefix='S/'
                  />
                </Col>
                <Col span={12}>
                  <label>Fecha Entrega:</label>
                  <DatePicker
                    value={dayjs(nuevoProducto.fecha_entrega)}
                    onChange={(date) =>
                      setNuevoProducto({
                        ...nuevoProducto,
                        fecha_entrega: date.format("YYYY-MM-DD"),
                      })
                    }
                    style={{ width: "100%" }}
                    format='DD/MM/YYYY'
                  />
                </Col>
              </Row>

              {/* SECCIÓN DE DESCUENTOS ACTUALIZADA */}
              <Row gutter={16}>
                <Col span={8}>
                  <label>Descuento 1 (%):</label>
                  <InputNumber
                    min={0}
                    max={100}
                    value={nuevoProducto.descuento_1}
                    onChange={(value) => {
                      const desc1 = value || 0;
                      const desc2 = nuevoProducto.descuento_2 || 0;
                      const cantidad = nuevoProducto.cantidad || 1;
                      const precioOriginal = nuevoProducto.precio_original || 0;

                      // Calcular monto fijo automáticamente
                      const precioBruto = cantidad * precioOriginal;
                      const descuento1Monto = precioBruto * (desc1 / 100);
                      const precioDespuesDesc1 = precioBruto - descuento1Monto;
                      const descuento2Monto =
                        precioDespuesDesc1 * (desc2 / 100);
                      const descuentoTotal = descuento1Monto + descuento2Monto;

                      setNuevoProducto({
                        ...nuevoProducto,
                        descuento_1: desc1,
                        descuento_monto: parseFloat(descuentoTotal.toFixed(2)),
                      });
                    }}
                    style={{ width: "100%" }}
                    formatter={(value) => `${value}%`}
                    parser={(value) => value.replace("%", "")}
                  />
                </Col>
                <Col span={8}>
                  <label>Descuento 2 (%):</label>
                  <InputNumber
                    min={0}
                    max={100}
                    value={nuevoProducto.descuento_2}
                    onChange={(value) => {
                      const desc1 = nuevoProducto.descuento_1 || 0;
                      const desc2 = value || 0;
                      const cantidad = nuevoProducto.cantidad || 1;
                      const precioOriginal = nuevoProducto.precio_original || 0;

                      // Calcular monto fijo automáticamente
                      const precioBruto = cantidad * precioOriginal;
                      const descuento1Monto = precioBruto * (desc1 / 100);
                      const precioDespuesDesc1 = precioBruto - descuento1Monto;
                      const descuento2Monto =
                        precioDespuesDesc1 * (desc2 / 100);
                      const descuentoTotal = descuento1Monto + descuento2Monto;

                      setNuevoProducto({
                        ...nuevoProducto,
                        descuento_2: desc2,
                        descuento_monto: parseFloat(descuentoTotal.toFixed(2)),
                      });
                    }}
                    style={{ width: "100%" }}
                    formatter={(value) => `${value}%`}
                    parser={(value) => value.replace("%", "")}
                  />
                </Col>
                <Col span={8}>
                  <label>Descuento Monto Fijo (Total):</label>
                  <InputNumber
                    min={0}
                    value={nuevoProducto.descuento_monto}
                    onChange={(value) => {
                      setNuevoProducto({
                        ...nuevoProducto,
                        descuento_monto: value || 0,
                      });
                    }}
                    style={{ width: "100%" }}
                    precision={2}
                    prefix='S/'
                  />
                </Col>
              </Row>

              {/* Mostrar el cálculo automático */}
              {(nuevoProducto.descuento_1 > 0 ||
                nuevoProducto.descuento_2 > 0) && (
                <Alert
                  message={`Descuento calculado: ${nuevoProducto.descuento_1}% + ${nuevoProducto.descuento_2}% = S/ ${nuevoProducto.descuento_monto}`}
                  type='info'
                  showIcon
                  size='small'
                />
              )}

              <div>
                <label>Subtotal (con descuentos):</label>
                <Input
                  value={(() => {
                    const precios = calcularPreciosProducto(nuevoProducto);
                    return `S/ ${precios.valor_venta.toFixed(
                      2
                    )} + IGV S/ ${precios.igv.toFixed(
                      2
                    )} = S/ ${precios.precio_total.toFixed(2)}`;
                  })()}
                  readOnly
                  style={{ fontWeight: "bold", backgroundColor: "#e6f7ff" }}
                />
              </div>
            </>
          )}
        </Space>
      </Modal>
    </Form>
  );
};

export default CotizacionForm;
