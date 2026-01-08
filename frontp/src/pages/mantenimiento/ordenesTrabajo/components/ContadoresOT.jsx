import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import {
    FileTextOutlined,
    ToolOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';

const ContadoresOT = ({ contadores }) => {
    const cards = [
        {
            title: 'Órdenes Activas',
            value: contadores?.activas || 0,
            color: '#1890ff',
            icon: <FileTextOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
        },
        {
            title: 'En Ejecución',
            value: contadores?.en_ejecucion || 0,
            color: '#faad14',
            icon: <ToolOutlined style={{ fontSize: '32px', color: '#faad14' }} />
        },
        {
            title: 'Pendientes',
            value: contadores?.pendientes || 0,
            color: '#ff7a45',
            icon: <ClockCircleOutlined style={{ fontSize: '32px', color: '#ff7a45' }} />
        },
        {
            title: 'Finalizadas',
            value: contadores?.finalizadas || 0,
            color: '#52c41a',
            icon: <CheckCircleOutlined style={{ fontSize: '32px', color: '#52c41a' }} />
        }
    ];

    return (
        <Row gutter={16} style={{ marginBottom: 24 }}>
            {cards.map((card, index) => (
                <Col xs={24} sm={12} md={6} key={index}>
                    <Card 
                        bordered={false}
                        style={{ 
                            borderLeft: `4px solid ${card.color}`,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                    >
                        <Statistic
                            title={card.title}
                            value={card.value}
                            valueStyle={{ color: card.color, fontWeight: 'bold' }}
                            prefix={card.icon}
                        />
                    </Card>
                </Col>
            ))}
        </Row>
    );
};

export default ContadoresOT;