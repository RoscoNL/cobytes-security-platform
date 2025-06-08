import { Router } from 'express';
import { cartController } from '@controllers/cart.controller';
import { asyncHandler } from '@middleware/asyncHandler';
import { optionalAuth } from '@middleware/optionalAuth';

const router = Router();

// All cart routes use optional authentication
// If user is logged in, cart is associated with user
// If not logged in, cart is associated with session
router.use(optionalAuth);

router.get('/', asyncHandler(cartController.getCart));
router.post('/add', asyncHandler(cartController.addToCart));
router.put('/:cartId/items/:itemId', asyncHandler(cartController.updateCartItem));
router.delete('/:cartId/items/:itemId', asyncHandler(cartController.removeFromCart));
router.delete('/:cartId/clear', asyncHandler(cartController.clearCart));
router.post('/:cartId/coupon', asyncHandler(cartController.applyCoupon));
router.delete('/:cartId/coupon', asyncHandler(cartController.removeCoupon));
router.post('/merge', asyncHandler(cartController.mergeCart));

export default router;