import { Router } from 'express';
import { hostfactController } from '@controllers/hostfact.controller';
import { asyncHandler } from '@middleware/asyncHandler';

const router = Router();

// Webhook endpoint - no authentication required
// HostFact will call this endpoint when payment status changes
router.post('/webhook', asyncHandler(hostfactController.handleWebhook));

export default router;