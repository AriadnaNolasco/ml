import { useState } from 'react';
import { message } from 'antd';
import { sunatApi } from '../api/sunatApi';

export const useDocumentConsulta = (form, options = {}) => {
    const [consultandoDocumento, setConsultandoDocumento] = useState(false);
    const [tipoDocumentoSeleccionado, setTipoDocumentoSeleccionado] = useState(null);

    const {
        enableDni = true,
        enableRuc = true,
        clearFields = ['nro_documento', 'razon_social', 'direccion', 'nomb_comercial']
    } = options;

    const actualizarFormulario = (datosFormulario) => {
        const camposConDatos = Object.fromEntries(
            Object.entries(datosFormulario).filter(([_, value]) => value && value.trim() !== '')
        );

        if (Object.keys(camposConDatos).length > 0) {
            form.setFieldsValue(camposConDatos);
            return true;
        }
        return false;
    };

    const consultarRuc = async (numeroRuc) => {
        if (!numeroRuc || numeroRuc.length !== 11) return;

        setConsultandoDocumento(true);

        try {
            const resultado = await sunatApi.consultarRuc(numeroRuc);

            const datosFormulario = {
                razon_social: resultado.razon_social || resultado.razonSocial || resultado.nombre ||
                    resultado.nombre_o_razon_social || resultado.descripcion || '',
                nomb_comercial: resultado.nombre_comercial || resultado.nombreComercial ||
                    resultado.nom_comercial || '',
                direccion: resultado.direccion || resultado.domicilio_fiscal || resultado.domicilio ||
                    resultado.direccion_completa || resultado.ubigeo_descripcion || ''
            };

            if (!datosFormulario.nomb_comercial && datosFormulario.razon_social) {
                datosFormulario.nomb_comercial = datosFormulario.razon_social;
            }

            if (actualizarFormulario(datosFormulario)) {
                message.success('Datos de RUC cargados desde SUNAT');
            } else {
                message.warning('RUC encontrado pero sin datos adicionales disponibles');
            }

        } catch (error) {
            if (error.message?.includes('no encontrado') || error.message?.includes('404')) {
                message.warning('RUC no encontrado en SUNAT');
            } else if (error.message?.includes('401') || error.message?.includes('token')) {
                message.error('Error de autenticación con SUNAT');
            } else {
                message.error('Error al consultar el RUC. Verifique el número ingresado.');
            }
        } finally {
            setConsultandoDocumento(false);
        }
    };

    const consultarDni = async (numeroDni) => {
        if (!enableDni || !numeroDni || numeroDni.length !== 8) return;

        setConsultandoDocumento(true);

        try {
            const resultado = await sunatApi.consultarDni(numeroDni);

            let nombreCompleto = '';

            if (resultado.full_name) {
                nombreCompleto = resultado.full_name.trim().toUpperCase();
            } else if (resultado.first_name && (resultado.first_last_name || resultado.second_last_name)) {
                const partes = [
                    resultado.first_name?.trim(),
                    resultado.first_last_name?.trim(),
                    resultado.second_last_name?.trim()
                ].filter(Boolean);
                nombreCompleto = partes.join(' ').toUpperCase();
            }

            if (nombreCompleto) {
                const datosFormulario = {
                    razon_social: nombreCompleto,
                    nomb_comercial: nombreCompleto
                };

                actualizarFormulario(datosFormulario);
                message.success('Datos de DNI cargados desde RENIEC');
            } else {
                message.warning('DNI encontrado pero sin datos de nombres disponibles');
            }

        } catch (error) {
            if (error.message?.includes('no encontrado') || error.message?.includes('404')) {
                message.warning('DNI no encontrado en RENIEC');
            } else if (error.message?.includes('401') || error.message?.includes('token')) {
                message.error('Error de autenticación con RENIEC');
            } else {
                message.error('Error al consultar el DNI. Verifique el número ingresado.');
            }
        } finally {
            setConsultandoDocumento(false);
        }
    };

    const handleTipoDocumentoChange = (value, tiposDocumento) => {
        const tipoDoc = tiposDocumento.find(t => t.id === value);
        setTipoDocumentoSeleccionado(tipoDoc);

        // Limpiar campos especificados
        const fieldsToReset = {};
        clearFields.forEach(field => fieldsToReset[field] = '');
        form.setFieldsValue(fieldsToReset);
    };

    const handleDocumentoBlur = async (e) => {
        const value = e.target.value?.trim();

        if (!value || !tipoDocumentoSeleccionado) return;

        const codigo = tipoDocumentoSeleccionado.codigo;
        const nombre = tipoDocumentoSeleccionado.nombre?.toUpperCase().replace(/[\s\.]/g, '') || '';

        const esRuc = enableRuc && (codigo === '6' || nombre.includes('RUC'));
        const esDni = enableDni && (codigo === '1' || nombre.includes('DNI') || nombre.includes('IDENTIDAD'));

        try {
            if (esRuc && value.length === 11 && /^\d{11}$/.test(value)) {
                await consultarRuc(value);
            } else if (esDni && value.length === 8 && /^\d{8}$/.test(value)) {
                await consultarDni(value);
            }
        } catch (error) {
            // Error ya manejado en las funciones individuales
        }
    };

    const getDocumentoConfig = () => {
        if (!tipoDocumentoSeleccionado) {
            return {
                placeholder: "Ingrese número de documento",
                maxLength: 20
            };
        }

        const codigo = tipoDocumentoSeleccionado.codigo;
        const nombre = tipoDocumentoSeleccionado.nombre?.toUpperCase() || '';
        const esRuc = enableRuc && (codigo === '6' || nombre.includes('RUC'));
        const esDni = enableDni && (codigo === '1' || nombre.includes('DNI'));

        if (esRuc) {
            return {
                placeholder: "Ej: 20123456789 (11 dígitos)",
                maxLength: 11,
                showAutoComplete: true,
                documentType: 'RUC'
            };
        } else if (esDni) {
            return {
                placeholder: "Ej: 12345678 (8 dígitos)",
                maxLength: 8,
                showAutoComplete: true,
                documentType: 'DNI'
            };
        }

        return {
            placeholder: "Ingrese número de documento",
            maxLength: 20,
            showAutoComplete: false
        };
    };

    return {
        consultandoDocumento,
        tipoDocumentoSeleccionado,
        handleTipoDocumentoChange,
        handleDocumentoBlur,
        getDocumentoConfig
    };
};