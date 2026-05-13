const express = require('express');
const { body } = require('express-validator');
const { login, getProfile, changePassword } = require('../controllers/auth.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { validateRequest } = require('../middlewares/validation.middleware');

const router = express.Router();

router.post(
  '/login',
  [
    body('username').notEmpty().withMessage('El usuario es requerido'),
    body('password').notEmpty().withMessage('La contraseña es requerida')
  ],
  validateRequest,
  login
);

router.get('/profile', authMiddleware, getProfile);

router.put(
  '/change-password',
  authMiddleware,
  [
    body('currentPassword').notEmpty().withMessage('La contraseña actual es requerida'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('La nueva contraseña debe tener al menos 6 caracteres')
  ],
  validateRequest,
  changePassword
);

module.exports = router;
