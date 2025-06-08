import { Router } from 'express';
import { productController } from '@controllers/product.controller';
import { asyncHandler } from '@middleware/asyncHandler';

const router = Router();

// Public routes - no authentication required
router.get('/', asyncHandler(productController.getProducts));
router.get('/featured', asyncHandler(productController.getFeaturedProducts));
router.get('/category/:category', asyncHandler(productController.getProductsByCategory));
router.get('/:id', asyncHandler(productController.getProduct));

export default router;