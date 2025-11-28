// src/pages/Dashboard.jsx
import React from 'react';
import '../assets/css/dashboard.css';

const Dashboard = ({ user, onLogout }) => {
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Bienvenido, {user.nombre_completo}</h1>
        <button onClick={onLogout} className="logout-button">
          Cerrar Sesión
        </button>
      </header>
      
      <div className="dashboard-content">
        <div className="user-card">
          <h2>Información del Usuario</h2>
          <p><strong>Usuario:</strong> {user.username}</p>
          <p><strong>Rol:</strong> {user.rol_id === 1 ? 'Superadmin' : 'Usuario normal'}</p>
        </div>
        
        <div className="dashboard-actions">
          <h2>Acciones disponibles</h2>
          {/* Aquí puedes agregar más funcionalidades según el rol */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;