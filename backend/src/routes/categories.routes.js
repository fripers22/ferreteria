const express = require('express');
const { body } = require('express-validator');
const {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categories.controller');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth.middleware');
const { validateRequest } = require('../middlewares/validation.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getAllCategories);

router.post(
  '/',
  roleMiddleware('ADMIN'),
  [body('name').notEmpty().withMessage('El nombre es requerido')],
  validateRequest,
  createCategory
);

router.put(
  '/:id',
  roleMiddleware('ADMIN'),
  [body('name').notEmpty().withMessage('El nombre es requerido')],
  validateRequest,
  updateCategory
);

router.delete('/:id', roleMiddleware('ADMIN'), deleteCategory);

module.exports = router;
