const express = require('express');
const { body } = require('express-validator');
const {
  getAllProducts,
  getProductById,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/products.controller');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth.middleware');
const { validateRequest } = require('../middlewares/validation.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.get('/barcode/:barcode', getProductByBarcode);

router.post(
  '/',
  roleMiddleware('ADMIN'),
  [
    body('sku').notEmpty().withMessage('El SKU es requerido'),
    body('name').notEmpty().withMessage('El nombre es requerido'),
    body('categoryId').isInt().withMessage('La categoría es requerida'),
    body('costPrice').isFloat({ min: 0 }).withMessage('El precio de costo debe ser mayor a 0'),
    body('salePrice').isFloat({ min: 0 }).withMessage('El precio de venta debe ser mayor a 0')
  ],
  validateRequest,
  createProduct
);

router.put(
  '/:id',
  roleMiddleware('ADMIN'),
  updateProduct
);

router.delete(
  '/:id',
  roleMiddleware('ADMIN'),
  deleteProduct
);

module.exports = router;
