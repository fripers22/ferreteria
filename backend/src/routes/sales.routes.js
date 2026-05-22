const express = require('express');
const { body } = require('express-validator');
const {
  getAllSales,
  getSaleById,
  getSalePdf,
  createSale,
  cancelSale,
  getDailySales
} = require('../controllers/sales.controller');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth.middleware');
const { validateRequest } = require('../middlewares/validation.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getAllSales);
router.get('/daily', getDailySales);
router.get('/:id/pdf', getSalePdf);
router.get('/:id', getSaleById);

router.post(
  '/',
  [
    body('items').isArray({ min: 1 }).withMessage('Debe incluir al menos un producto'),
    body('paymentMethod')
      .isIn(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'FIADO'])
      .withMessage('Método de pago inválido')
  ],
  validateRequest,
  createSale
);

router.delete('/:id', roleMiddleware('ADMIN'), cancelSale);

module.exports = router;
