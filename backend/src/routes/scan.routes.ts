import { Router } from 'express';
import scanController from '../controllers/scan.controller';
import { auth } from '../middleware/auth';
import { optionalAuth } from '../middleware/optionalAuth';

const router = Router();

// Public endpoints - no auth required
router.get('/scan-types', scanController.getScanTypes);

// Mixed auth endpoints - auth optional but provides user context
router.post('/', optionalAuth, scanController.createScan);
router.get('/:id', optionalAuth, scanController.getScan);

// Protected endpoints - auth required
router.get('/', auth, scanController.getAllScans);
router.post('/:id/cancel', optionalAuth, scanController.cancelScan);
router.delete('/:id', optionalAuth, scanController.deleteScan);

export const scanRoutes = router;