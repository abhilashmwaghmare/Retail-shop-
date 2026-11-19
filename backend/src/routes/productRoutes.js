/**
 * Product Routes
 */

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authMiddleware, adminOnlyMiddleware } = require('../middleware/auth');

router.get('/', productController.listProducts);
router.get('/:id', productController.getProduct);
router.post('/', authMiddleware, adminOnlyMiddleware, productController.createProduct);
router.put('/:id', authMiddleware, adminOnlyMiddleware, productController.updateProduct);
router.delete('/:id', authMiddleware, adminOnlyMiddleware, productController.deleteProduct);

module.exports = router;
