const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middlewares/auth');

// Ruta pública
router.post('/login', userController.login);

// Rutas protegidas
router.get('/me', auth.verifyToken, userController.getMe);
router.post('/users', auth.verifyToken, auth.isSuperAdmin, userController.createUser);

// Nuevas rutas para gestión de usuarios
router.get('/users', auth.verifyToken, auth.isSuperAdmin, userController.getUsers);
router.put('/users/:id', auth.verifyToken, auth.isSuperAdmin, userController.updateUser);
router.delete('/users/:id', auth.verifyToken, auth.isSuperAdmin, userController.deleteUser);


// Agregar estas rutas al router
router.get('/modulos-paginas', auth.verifyToken, auth.isSuperAdmin, userController.getModulosPaginas);
router.get('/users/:id/permisos', auth.verifyToken, auth.isSuperAdmin, userController.getUserPermissions);
router.put('/users/:id/permisos', auth.verifyToken, auth.isSuperAdmin, userController.updateUserPermissions);

module.exports = router;