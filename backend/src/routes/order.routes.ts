import { Router } from 'express';
import { orderController } from '@controllers/order.controller';
import { asyncHandler } from '@middleware/asyncHandler';
import { auth } from '@middleware/auth';
import { optionalAuth } from '@middleware/optionalAuth';

const router = Router();

// Public routes (with optional auth for guest checkout)
router.post('/', optionalAuth, asyncHandler(orderController.createOrder));

// Protected routes - require authentication
router.use(auth);

router.get('/my-orders', asyncHandler(orderController.getUserOrders));
router.get('/available-scans', asyncHandler(orderController.getAvailableScans));
router.get('/:id', asyncHandler(orderController.getOrder));
router.get('/number/:orderNumber', asyncHandler(orderController.getOrderByNumber));
router.post('/:orderId/payment/initialize', asyncHandler(orderController.initializePayment));

// Webhook routes (no auth, validated by signature)
router.post('/webhook/payment-status', asyncHandler(orderController.updatePaymentStatus));

export default router;