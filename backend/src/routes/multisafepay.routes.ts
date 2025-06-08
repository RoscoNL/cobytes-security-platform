import { Router } from 'express';
import { multisafepayController } from '@controllers/multisafepay.controller';
import { asyncHandler } from '@middleware/asyncHandler';

const router = Router();

// Webhook endpoint - no authentication required
// MultiSafepay will call this endpoint when payment status changes
router.post('/webhook', asyncHandler(multisafepayController.handleWebhook));

// Get payment status - public endpoint for checking payment status
router.get('/status/:transactionId', asyncHandler(multisafepayController.getPaymentStatus));

export default router;