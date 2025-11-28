const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userController = {
  // Iniciar sesión
  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Buscar usuario en la base de datos
      const userQuery = await pool.query(
        'SELECT * FROM usuarios WHERE username = $1',
        [username]
      );
      
      if (userQuery.rows.length === 0) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
      
      const user = userQuery.rows[0];
      
      // Verificar contraseña
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
      
      // Obtener permisos del usuario con la misma estructura
      const permisosQuery = await pool.query(`
        SELECT 
          p.id as pagina_id, 
          p.ruta, 
          p.nombre as nombre_pagina,
          p.modulo_id,
          m.nombre as modulo_nombre
        FROM permisos perm
        JOIN paginas p ON perm.pagina_id = p.id
        JOIN modulo m ON p.modulo_id = m.id
        WHERE perm.usuario_id = $1
      `, [user.id]);
      
      // Generar token JWT
      const token = jwt.sign(
        { id: user.id, username: user.username, rol_id: user.rol_id },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );
      
      res.json({
        id: user.id,
        nombre_completo: user.nombre_completo,
        username: user.username,
        rol_id: user.rol_id,
        permisos: permisosQuery.rows, // ← Misma estructura que en getUsers
        token
      });
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  },

  // Crear nuevo usuario (solo para Superadmin)
  createUser: async (req, res) => {
    try {
      // Verificar si el usuario que hace la petición es Superadmin
      if (req.user.rol_id !== 1) {
        return res.status(403).json({ error: 'No tienes permiso para realizar esta acción' });
      }
      
      const { nombre_completo, username, password, rol_id } = req.body;
      
      // Validar que el rol exista
      const roleQuery = await pool.query('SELECT * FROM roles WHERE id = $1', [rol_id]);
      if (roleQuery.rows.length === 0) {
        return res.status(400).json({ error: 'Rol no válido' });
      }
      
      // Hash de la contraseña
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      
      // Insertar nuevo usuario
      const newUser = await pool.query(
        'INSERT INTO usuarios (nombre_completo, username, password_hash, rol_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [nombre_completo, username, passwordHash, rol_id]
      );
      
      res.status(201).json(newUser.rows[0]);
      
    } catch (error) {
      if (error.code === '23505') { // Violación de unique constraint
        return res.status(400).json({ error: 'El nombre de usuario ya existe' });
      }
      console.error(error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  },

  // Obtener información del usuario actual
  getMe: async (req, res) => {
    try {
      const user = await pool.query(
        `SELECT 
          u.id, 
          u.nombre_completo, 
          u.username, 
          u.rol_id,
          u.area_id,
          a.nombre as area_nombre
        FROM usuarios u
        LEFT JOIN area a ON u.area_id = a.id
        WHERE u.id = $1`,
        [req.user.id]
      );
      
      if (user.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      // Obtener permisos del usuario actual
      const permisosQuery = await pool.query(`
        SELECT 
          p.id as pagina_id, 
          p.ruta, 
          p.nombre as nombre_pagina,
          p.modulo_id,
          m.nombre as modulo_nombre
        FROM permisos perm
        JOIN paginas p ON perm.pagina_id = p.id
        JOIN modulo m ON p.modulo_id = m.id
        WHERE perm.usuario_id = $1
      `, [req.user.id]);
      
      // Estructurar la respuesta con información del área
      const userData = {
        ...user.rows[0],
        permisos: permisosQuery.rows,
        area: user.rows[0].area_id ? {
          id: user.rows[0].area_id,
          nombre: user.rows[0].area_nombre
        } : null
      };
      
      // Eliminar campos temporales si es necesario
      delete userData.area_nombre;
      
      res.json(userData);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  },

  // Obtener todos los usuarios (solo Superadmin)
  getUsers: async (req, res) => {
      try {
          const users = await pool.query(`
              SELECT 
                  u.id, 
                  u.nombre_completo, 
                  u.username, 
                  u.rol_id,
                  r.nombre as rol_nombre,
                  u.activo,
                  u.creado_en,
                  (
                      SELECT json_agg(json_build_object(
                          'pagina_id', p.pagina_id,
                          'ruta', pg.ruta,
                          'nombre_pagina', pg.nombre,
                          'modulo_id', pg.modulo_id,
                          'modulo_nombre', m.nombre
                      ))
                      FROM permisos p
                      JOIN paginas pg ON p.pagina_id = pg.id
                      JOIN modulo m ON pg.modulo_id = m.id
                      WHERE p.usuario_id = u.id
                  ) as permisos
              FROM usuarios u
              JOIN roles r ON u.rol_id = r.id
          `);
          res.json(users.rows);
      } catch (error) {
          console.error(error);
          res.status(500).json({ error: 'Error en el servidor' });
      }
  },

  // Actualizar usuario (solo Superadmin)
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre_completo, password, rol_id } = req.body;

      let query;
      let params;

      if (password) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        query = 'UPDATE usuarios SET nombre_completo = $1, password_hash = $2, rol_id = $3 WHERE id = $4 RETURNING *';
        params = [nombre_completo, passwordHash, rol_id, id];
      } else {
        query = 'UPDATE usuarios SET nombre_completo = $1, rol_id = $2 WHERE id = $3 RETURNING *';
        params = [nombre_completo, rol_id, id];
      }

      const updatedUser = await pool.query(query, params);

      if (updatedUser.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json({
        id: updatedUser.rows[0].id,
        nombre_completo: updatedUser.rows[0].nombre_completo,
        username: updatedUser.rows[0].username,
        rol_id: updatedUser.rows[0].rol_id
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  },

  // Eliminar usuario (solo Superadmin)
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar que no sea el mismo usuario
      if (id === req.user.id) {
        return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
      }

      const result = await pool.query(
        'DELETE FROM usuarios WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  },

  // Obtener módulos y páginas disponibles
  getModulosPaginas: async (req, res) => {
    try {
      const modulos = await pool.query(`
        SELECT m.id as modulo_id, m.nombre as modulo_nombre, 
               p.id as pagina_id, p.nombre as pagina_nombre, p.ruta
        FROM modulo m
        LEFT JOIN paginas p ON m.id = p.modulo_id
        ORDER BY m.id, p.id
      `);
      
      // Organizar los datos por módulo
      const result = modulos.rows.reduce((acc, row) => {
        const moduloExistente = acc.find(m => m.id === row.modulo_id);
        
        if (moduloExistente) {
          if (row.pagina_id) {
            moduloExistente.paginas.push({
              id: row.pagina_id,
              nombre: row.pagina_nombre,
              ruta: row.ruta
            });
          }
        } else {
          acc.push({
            id: row.modulo_id,
            nombre: row.modulo_nombre,
            paginas: row.pagina_id ? [{
              id: row.pagina_id,
              nombre: row.pagina_nombre,
              ruta: row.ruta
            }] : []
          });
        }
        
        return acc;
      }, []);
      
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener módulos y páginas' });
    }
  },

  // Obtener permisos de un usuario
  getUserPermissions: async (req, res) => {
    try {
      const { id } = req.params;
      
      const permisos = await pool.query(`
        SELECT p.id, p.nombre, p.ruta, p.modulo_id
        FROM permisos perm
        JOIN paginas p ON perm.pagina_id = p.id
        WHERE perm.usuario_id = $1
      `, [id]);
      
      res.json(permisos.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener permisos del usuario' });
    }
  },

  // Actualizar permisos de un usuario
  updateUserPermissions: async (req, res) => {
    try {
      const { id } = req.params;
      const { paginas } = req.body;
      
      // Verificar que el usuario que hace la petición es Superadmin
      if (req.user.rol_id !== 1) {
        return res.status(403).json({ error: 'No tienes permiso para realizar esta acción' });
      }
      
      // Verificar que no se está modificando a sí mismo (opcional)
      if (id === req.user.id.toString()) {
        return res.status(400).json({ error: 'No puedes modificar tus propios permisos' });
      }
      
      // Comenzar transacción
      await pool.query('BEGIN');
      
      // Eliminar todos los permisos existentes
      await pool.query('DELETE FROM permisos WHERE usuario_id = $1', [id]);
      
      // Insertar los nuevos permisos
      if (paginas && paginas.length > 0) {
        for (const paginaId of paginas) {
          await pool.query(
            'INSERT INTO permisos (usuario_id, pagina_id) VALUES ($1, $2)',
            [id, paginaId]
          );
        }
      }
      
      await pool.query('COMMIT');
      
      res.json({ message: 'Permisos actualizados correctamente' });
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error(error);
      res.status(500).json({ error: 'Error al actualizar permisos' });
    }
  }
}

module.exports = userController;