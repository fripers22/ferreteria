const express = require('express');
const { body } = require('express-validator');
const {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
} = require('../controllers/customers.controller');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth.middleware');
const { validateRequest } = require('../middlewares/validation.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getAllCustomers);
router.get('/:id', getCustomerById);

router.post(
  '/',
  [body('name').notEmpty().withMessage('El nombre es requerido')],
  validateRequest,
  createCustomer
);

router.put('/:id', updateCustomer);

router.delete('/:id', roleMiddleware('ADMIN'), deleteCustomer);

module.exports = router;
