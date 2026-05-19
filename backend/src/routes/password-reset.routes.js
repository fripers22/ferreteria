// Rutas de Recuperación de Contraseña
const express = require('express');
const router = express.Router();
const passwordResetController = require('../controllers/password-reset.controller');

/**
 * Solicitar recuperación de contraseña
 * POST /api/password-reset/request
 */
router.post('/request', passwordResetController.requestPasswordReset);

/**
 * Verificar token de recuperación
 * GET /api/password-reset/verify/:token
 */
router.get('/verify/:token', passwordResetController.verifyResetToken);

/**
 * Resetear contraseña
 * POST /api/password-reset/reset
 */
router.post('/reset', passwordResetController.resetPassword);

module.exports = router;
