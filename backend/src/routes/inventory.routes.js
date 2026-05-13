const express = require('express');
const { body } = require('express-validator');
const {
  getMovements,
  createMovement,
  getLowStockProducts,
  getInventoryValue
} = require('../controllers/inventory.controller');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth.middleware');
const { validateRequest } = require('../middlewares/validation.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/movements', getMovements);
router.get('/low-stock', getLowStockProducts);
router.get('/value', getInventoryValue);

router.post(
  '/movements',
  roleMiddleware('ADMIN'),
  [
    body('productId').isInt().withMessage('El producto es requerido'),
    body('type')
      .isIn(['ENTRADA', 'SALIDA', 'AJUSTE'])
      .withMessage('Tipo de movimiento inválido'),
    body('quantity').isInt({ min: 1 }).withMessage('La cantidad debe ser mayor a 0')
  ],
  validateRequest,
  createMovement
);

module.exports = router;
