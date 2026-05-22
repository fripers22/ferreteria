const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth.middleware');

// Registro público
router.post('/register', usersController.register);

// Rutas admin
router.post('/', authMiddleware, roleMiddleware('ADMIN'), usersController.createUserByAdmin);
router.get('/', authMiddleware, roleMiddleware('ADMIN'), usersController.listUsers);
router.patch('/:id/role', authMiddleware, roleMiddleware('ADMIN'), usersController.updateUserRole);

module.exports = router;
