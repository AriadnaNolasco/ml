// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import reactLogo from '../assets/react.svg';
import '../assets/css/login.css';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Credenciales inválidas');
      }

      console.log("=== DATOS COMPLETOS DEL BACKEND ===");
      console.log("Respuesta completa:", data);
      console.log("Permisos recibidos:", data.permisos);

      // SOLUCIÓN: Incluir TODOS los datos que vienen del backend, incluyendo permisos
      const userData = {
        id: data.id,
        username: data.username,
        nombre_completo: data.nombre_completo,
        rol_id: data.rol_id,
        permisos: data.permisos || [] // ✅ Incluir los permisos del backend
      };

      console.log("=== DATOS A GUARDAR EN FRONTEND ===");
      console.log("userData creado:", userData);
      console.log("Permisos incluidos:", userData.permisos);

      // Guardar token en localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Actualizar el estado en App.jsx
      onLogin(userData, data.token);
      
      // Redirigir al dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src={reactLogo} alt="Logo" className="logo" />
          <h1>Bienvenido</h1>
          <p>Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="username">Usuario</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingresa tu usuario"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Cargando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="login-footer">
          <p>¿No tienes una cuenta? <a href="#">Contacta al administrador</a></p>
          <p><a href="#">¿Olvidaste tu contraseña?</a></p>
        </div>
      </div>
    </div>
  );
};

export default Login;