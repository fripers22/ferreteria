const express = require('express');
const { body, param, query } = require('express-validator');
const {
  sendMessage,
  submitFeedback,
  getSessionHistory,
  getInsights
} = require('../controllers/chatbot.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { validateRequest } = require('../middlewares/validation.middleware');

const router = express.Router();

router.use(authMiddleware);

router.post(
  '/',
  [
    body('message')
      .notEmpty()
      .withMessage('El mensaje es requerido')
      .isString()
      .withMessage('El mensaje debe ser texto'),
    body('history')
      .optional()
      .isArray()
      .withMessage('El historial debe ser un arreglo'),
    body('allowWrite')
      .optional()
      .isBoolean()
      .withMessage('allowWrite debe ser booleano'),
    body('sessionId')
      .optional()
      .isString()
      .withMessage('sessionId debe ser texto')
  ],
  validateRequest,
  sendMessage
);

router.post(
  '/feedback',
  [
    body('sessionId')
      .notEmpty()
      .withMessage('sessionId es requerido')
      .isString()
      .withMessage('sessionId debe ser texto'),
    body('messageId')
      .optional()
      .isInt()
      .withMessage('messageId debe ser numerico'),
    body('rating')
      .notEmpty()
      .withMessage('rating es requerido')
      .isInt({ min: 1, max: 5 })
      .withMessage('rating debe estar entre 1 y 5'),
    body('note')
      .optional()
      .isString()
      .withMessage('note debe ser texto')
  ],
  validateRequest,
  submitFeedback
);

router.get(
  '/session/:id',
  [
    param('id')
      .notEmpty()
      .withMessage('id es requerido')
      .isString()
      .withMessage('id debe ser texto'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 200 })
      .withMessage('limit debe estar entre 1 y 200')
  ],
  validateRequest,
  getSessionHistory
);

router.get(
  '/insights',
  [
    query('date')
      .optional()
      .isISO8601()
      .withMessage('date debe ser YYYY-MM-DD'),
    query('lowStockLimit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('lowStockLimit debe estar entre 1 y 50')
  ],
  validateRequest,
  getInsights
);

module.exports = router;
