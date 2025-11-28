import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/css/usuarios.css';

const Usuarios = ({ user }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [filtro, setFiltro] = useState('');
  const [modulos, setModulos] = useState([]);
  const [permisosUsuario, setPermisosUsuario] = useState([]);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre_completo: '',
    username: '',
    password: '',
    rol_id: 2
  });

  // Obtener lista de usuarios
  useEffect(() => {
    if (user?.rol_id !== 1) {
      navigate('/dashboard');
      return;
    }

    const obtenerDatos = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Obtener usuarios
        const usersResponse = await fetch('http://localhost:3000/api/auth/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!usersResponse.ok) throw new Error('No se pudieron obtener los usuarios');
        const usersData = await usersResponse.json();
        setUsuarios(usersData);
        
        // Obtener módulos y páginas
        const modulosResponse = await fetch('http://localhost:3000/api/auth/modulos-paginas', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!modulosResponse.ok) throw new Error('No se pudieron obtener los módulos');
        const modulosData = await modulosResponse.json();
        setModulos(modulosData);
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    obtenerDatos();
  }, [user, navigate]);

  // Obtener permisos cuando se edita un usuario
  useEffect(() => {
    if (usuarioEditando) {
      const obtenerPermisos = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(
            `http://localhost:3000/api/auth/users/${usuarioEditando.id}/permisos`, 
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          
          if (!response.ok) throw new Error('No se pudieron obtener los permisos');
          const data = await response.json();
          setPermisosUsuario(data.map(p => p.id));
        } catch (err) {
          console.error('Error al obtener permisos:', err);
        }
      };
      
      obtenerPermisos();
    }
  }, [usuarioEditando]);

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePaginaChange = (paginaId) => {
    setPermisosUsuario(prev => 
      prev.includes(paginaId) 
        ? prev.filter(id => id !== paginaId) 
        : [...prev, paginaId]
    );
  };

  // Manejar selección de módulo completo
  const handleModuloChange = (moduloId, isSelected) => {
    const modulo = modulos.find(m => m.id === moduloId);
    if (!modulo) return;

    const paginasModulo = modulo.paginas.map(p => p.id);
    
    setPermisosUsuario(prev => {
      if (isSelected) {
        // Agregar todas las páginas del módulo (eliminando duplicados)
        return [...new Set([...prev, ...paginasModulo])];
      } else {
        // Eliminar todas las páginas del módulo
        return prev.filter(id => !paginasModulo.includes(id));
      }
    });
  };


  // Abrir modal para crear/editar usuario
  const abrirModal = (usuario = null) => {
    if (usuario) {
      setUsuarioEditando(usuario);
      setFormData({
        nombre_completo: usuario.nombre_completo,
        username: usuario.username,
        password: '',
        rol_id: usuario.rol_id
      });
    } else {
      setUsuarioEditando(null);
      setFormData({
        nombre_completo: '',
        username: '',
        password: '',
        rol_id: 2
      });
      setPermisosUsuario([]);
    }
    setModalAbierto(true);
  };

  // Enviar formulario (crear/editar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const token = localStorage.getItem('token');
      const url = usuarioEditando 
        ? `http://localhost:3000/api/auth/users/${usuarioEditando.id}`
        : 'http://localhost:3000/api/auth/users';

      const method = usuarioEditando ? 'PUT' : 'POST';

      // 1. Crear/actualizar el usuario
      const userResponse = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        throw new Error(errorData.error || 'Error al procesar la solicitud');
      }

      const userData = await userResponse.json();
      const userId = userData.id || usuarioEditando.id;

      // 2. Actualizar permisos (solo si no es Superadmin)
      if (formData.rol_id !== 1) {
        const permisosResponse = await fetch(
          `http://localhost:3000/api/auth/users/${userId}/permisos`, 
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ paginas: permisosUsuario })
          }
        );

        if (!permisosResponse.ok) {
          throw new Error('Error al actualizar permisos');
        }
      }

      // 3. Actualizar lista de usuarios
      if (usuarioEditando) {
        setUsuarios(usuarios.map(u => 
          u.id === usuarioEditando.id ? { ...u, ...userData } : u
        ));
      } else {
        setUsuarios([...usuarios, userData]);
      }

      setModalAbierto(false);
    } catch (err) {
      setError(err.message);
    }
  };

  // Eliminar usuario
  const eliminarUsuario = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/auth/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el usuario');
      }

      setUsuarios(usuarios.filter(u => u.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  // Verificar si un módulo está completamente seleccionado
  const isModuloCompleto = (moduloId) => {
    const modulo = modulos.find(m => m.id === moduloId);
    if (!modulo || modulo.paginas.length === 0) return false;
    
    return modulo.paginas.every(p => permisosUsuario.includes(p.id));
  };


  // Renderizar módulos y páginas en el modal
  const renderModulosPaginas = () => {
    if (formData.rol_id === 1) {
      return (
        <div className="permisos-info">
          <p>El Superadmin tiene acceso a todas las páginas automáticamente.</p>
        </div>
      );
    }

    return (
      <div className="modulos-paginas-container">
        <h3>Permisos de Acceso</h3>
        <div className="modulos-list">
          {modulos.map(modulo => (
            <div key={modulo.id} className="modulo-item">
              <label className="modulo-checkbox">
                <input
                  type="checkbox"
                  checked={isModuloCompleto(modulo.id)}
                  onChange={(e) => handleModuloChange(modulo.id, e.target.checked)}
                />
                <span className="modulo-nombre">{modulo.nombre}</span>
              </label>
              
              {modulo.paginas.length > 0 && (
                <div className="paginas-list">
                  {modulo.paginas.map(pagina => (
                    <label key={pagina.id} className="pagina-checkbox">
                      <input
                        type="checkbox"
                        checked={permisosUsuario.includes(pagina.id)}
                        onChange={() => handlePaginaChange(pagina.id)}
                      />
                      <span>{pagina.nombre}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };


  // Filtrar usuarios
  const usuariosFiltrados = usuarios.filter(usuario =>
    usuario.nombre_completo.toLowerCase().includes(filtro.toLowerCase()) ||
    usuario.username.toLowerCase().includes(filtro.toLowerCase())
  );

  if (loading) return <div className="loading">Cargando...</div>;
  if (user?.rol_id !== 1) return null;

  return (
    <div className="usuarios-container">
      <h1>Administración de Usuarios</h1>
      
      {error && <div className="error-message">{error}</div>}

      <div className="usuarios-actions">
        <button 
          onClick={() => abrirModal()} 
          className="btn-agregar"
        >
          + Agregar Usuario
        </button>
        
        <input
          type="text"
          placeholder="Buscar usuarios..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="buscar-input"
        />
      </div>

      <div className="usuarios-listado">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.length > 0 ? (
              usuariosFiltrados.map(usuario => (
                <tr key={usuario.id}>
                  <td>{usuario.nombre_completo}</td>
                  <td>{usuario.username}</td>
                  <td>{usuario.rol_id === 1 ? 'Superadmin' : 'Usuario'}</td>
                  <td className="acciones">
                    <button 
                      onClick={() => abrirModal(usuario)}
                      className="btn-editar"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => eliminarUsuario(usuario.id)}
                      className="btn-eliminar"
                      disabled={usuario.id === user.id}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">No se encontraron usuarios</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para crear/editar */}
      {modalAbierto && (
        <div className="modal-overlay">
          <div className="modal modal-grande">
            <h2>{usuarioEditando ? 'Editar Usuario' : 'Crear Usuario'}</h2>
            <button 
              onClick={() => setModalAbierto(false)}
              className="modal-cerrar"
            >
              &times;
            </button>

            <form onSubmit={handleSubmit}>
              <div className="form-columns">
                <div className="form-column">
                  <div className="form-group">
                    <label>Nombre Completo</label>
                    <input
                      type="text"
                      name="nombre_completo"
                      value={formData.nombre_completo}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Nombre de Usuario</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      disabled={!!usuarioEditando}
                    />
                  </div>

                  <div className="form-group">
                    <label>Contraseña</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required={!usuarioEditando}
                      placeholder={usuarioEditando ? "Dejar vacío para no cambiar" : ""}
                    />
                  </div>

                  <div className="form-group">
                    <label>Rol</label>
                    <select
                      name="rol_id"
                      value={formData.rol_id}
                      onChange={handleChange}
                    >
                      <option value={1}>Superadmin</option>
                      <option value={2}>Usuario</option>
                    </select>
                  </div>
                </div>

                <div className="form-column">
                  {renderModulosPaginas()}
                </div>
              </div>

              <div className="form-footer">
                <button type="submit" className="btn-guardar">
                  {usuarioEditando ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;