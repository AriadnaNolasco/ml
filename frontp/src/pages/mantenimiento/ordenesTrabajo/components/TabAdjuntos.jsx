import React, { useState } from 'react';
import { Upload, Button, List, Card, Alert, message, Typography, Space, Spin } from 'antd';
import {
    UploadOutlined,
    DownloadOutlined,
    InboxOutlined,
    FilePdfOutlined,
    FileZipOutlined,
    FileImageOutlined,
    FileWordOutlined,
    FileExcelOutlined,
    FileTextOutlined,
    PaperClipOutlined
} from '@ant-design/icons';
import { addAdjunto } from '../../../../api/apiOrdenesMantenimiento';

const { Dragger } = Upload;
const { Text, Title } = Typography;

const TabAdjuntos = ({ ordenId, adjuntos, onReload }) => {
    const [uploading, setUploading] = useState(false);

    const handleFileSelect = async (file) => {
        // Validar tamaño (máximo 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            message.error('El archivo es demasiado grande. Máximo 10MB');
            return false;
        }

        try {
            setUploading(true);

            const formData = new FormData();
            formData.append('archivo', file);
            formData.append('nombre_archivo', file.name);

            await addAdjunto(ordenId, formData);
            
            message.success('Archivo subido correctamente');
            onReload();
        } catch (error) {
            console.error('Error subiendo archivo:', error);
            message.error('Error al subir el archivo');
        } finally {
            setUploading(false);
        }

        // Retornar false para evitar el comportamiento por defecto de Upload
        return false;
    };

    const handleDownload = (adjunto) => {
        window.open(adjunto.ruta_archivo, '_blank');
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 KB';
        const kb = bytes / 1024;
        if (kb < 1024) {
            return `${kb.toFixed(1)} KB`;
        }
        return `${(kb / 1024).toFixed(1)} MB`;
    };

    const getFileIcon = (tipoArchivo) => {
        const extension = tipoArchivo?.toLowerCase().replace('.', '');
        
        const iconMap = {
            'pdf': <FilePdfOutlined style={{ fontSize: '32px', color: '#f5222d' }} />,
            'zip': <FileZipOutlined style={{ fontSize: '32px', color: '#faad14' }} />,
            'rar': <FileZipOutlined style={{ fontSize: '32px', color: '#faad14' }} />,
            'jpg': <FileImageOutlined style={{ fontSize: '32px', color: '#52c41a' }} />,
            'jpeg': <FileImageOutlined style={{ fontSize: '32px', color: '#52c41a' }} />,
            'png': <FileImageOutlined style={{ fontSize: '32px', color: '#52c41a' }} />,
            'gif': <FileImageOutlined style={{ fontSize: '32px', color: '#52c41a' }} />,
            'doc': <FileWordOutlined style={{ fontSize: '32px', color: '#1890ff' }} />,
            'docx': <FileWordOutlined style={{ fontSize: '32px', color: '#1890ff' }} />,
            'xls': <FileExcelOutlined style={{ fontSize: '32px', color: '#52c41a' }} />,
            'xlsx': <FileExcelOutlined style={{ fontSize: '32px', color: '#52c41a' }} />,
            'txt': <FileTextOutlined style={{ fontSize: '32px', color: '#8c8c8c' }} />,
        };
        
        return iconMap[extension] || <PaperClipOutlined style={{ fontSize: '32px', color: '#8c8c8c' }} />;
    };

    const uploadProps = {
        name: 'archivo',
        multiple: false,
        showUploadList: false,
        beforeUpload: handleFileSelect,
        disabled: uploading,
        accept: '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip,.rar,.txt'
    };

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Área de Carga de Archivos */}
            <Card 
                title={
                    <Space>
                        <UploadOutlined />
                        <span>Subir Archivos</span>
                    </Space>
                }
                size="small"
            >
                <Dragger {...uploadProps}>
                    {uploading ? (
                        <div style={{ padding: '40px 0' }}>
                            <Spin size="large" />
                            <p style={{ marginTop: 16, color: '#1890ff' }}>Subiendo archivo...</p>
                        </div>
                    ) : (
                        <div style={{ padding: '40px 0' }}>
                            <p className="ant-upload-drag-icon">
                                <InboxOutlined style={{ fontSize: '64px', color: '#1890ff' }} />
                            </p>
                            <p className="ant-upload-text" style={{ fontSize: '16px', fontWeight: 500 }}>
                                Haz clic o arrastra archivos aquí para subirlos
                            </p>
                            <p className="ant-upload-hint" style={{ fontSize: '14px', color: '#8c8c8c' }}>
                                Tamaño máximo: 10MB por archivo
                            </p>
                            <Button 
                                type="primary" 
                                icon={<UploadOutlined />}
                                size="large"
                                style={{ marginTop: 16 }}
                            >
                                Seleccionar Archivo
                            </Button>
                        </div>
                    )}
                </Dragger>
            </Card>

            {/* Lista de Archivos Adjuntos */}
            <Card
                title={
                    <Space>
                        <PaperClipOutlined />
                        <span>Archivos Subidos ({adjuntos?.length || 0})</span>
                    </Space>
                }
                size="small"
            >
                {!adjuntos || adjuntos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <InboxOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                        <p style={{ marginTop: 16, color: '#8c8c8c' }}>No hay archivos adjuntos</p>
                    </div>
                ) : (
                    <List
                        itemLayout="horizontal"
                        dataSource={adjuntos}
                        renderItem={(adjunto, index) => (
                            <List.Item
                                key={index}
                                actions={[
                                    <Button
                                        type="primary"
                                        icon={<DownloadOutlined />}
                                        onClick={() => handleDownload(adjunto)}
                                    >
                                        Descargar
                                    </Button>
                                ]}
                                style={{
                                    padding: '16px',
                                    backgroundColor: '#fafafa',
                                    marginBottom: '8px',
                                    borderRadius: '8px',
                                    border: '1px solid #d9d9d9'
                                }}
                            >
                                <List.Item.Meta
                                    avatar={getFileIcon(adjunto.tipo_archivo)}
                                    title={
                                        <Text strong style={{ fontSize: '14px' }}>
                                            {adjunto.nombre_archivo}
                                        </Text>
                                    }
                                    description={
                                        <Space direction="vertical" size={0}>
                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                Subido el {new Date(adjunto.fecha_subida).toLocaleDateString('es-ES')} • {' '}
                                                {formatFileSize(adjunto.tamano_kb * 1024)}
                                            </Text>
                                            {adjunto.subido_por_nombre && (
                                                <Text type="secondary" style={{ fontSize: '11px' }}>
                                                    Por: {adjunto.subido_por_nombre}
                                                </Text>
                                            )}
                                        </Space>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                )}
            </Card>

            {/* Información adicional */}
            <Alert
                message="ℹ️ Información sobre archivos adjuntos"
                description={
                    <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
                        <li>Los archivos pueden ser: PDF, imágenes (JPG, PNG), documentos Word/Excel, archivos comprimidos (ZIP, RAR)</li>
                        <li>Tamaño máximo por archivo: 10MB</li>
                        <li>Los archivos se almacenan de forma segura en el servidor</li>
                        <li>Puedes subir múltiples archivos uno a la vez</li>
                    </ul>
                }
                type="info"
                showIcon
                style={{ backgroundColor: '#e6f7ff', border: '1px solid #91d5ff' }}
            />
        </Space>
    );
};

export default TabAdjuntos;