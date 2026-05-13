const express = require('express');
const { body } = require('express-validator');
const {
  getAllAccounts,
  getAccountById,
  getAccountByCustomerId,
  createPayment,
  updateCreditLimit,
  getAccountsSummary
} = require('../controllers/accounts.controller');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth.middleware');
const { validateRequest } = require('../middlewares/validation.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getAllAccounts);
router.get('/summary', getAccountsSummary);
router.get('/:id', getAccountById);
router.get('/customer/:customerId', getAccountByCustomerId);

router.post(
  '/payment',
  [
    body('accountId').isInt().withMessage('La cuenta es requerida'),
    body('amount').isFloat({ min: 0.01 }).withMessage('El monto debe ser mayor a 0')
  ],
  validateRequest,
  createPayment
);

router.put(
  '/:id/credit-limit',
  roleMiddleware('ADMIN'),
  [body('creditLimit').isFloat({ min: 0 }).withMessage('El límite debe ser mayor o igual a 0')],
  validateRequest,
  updateCreditLimit
);

module.exports = router;
