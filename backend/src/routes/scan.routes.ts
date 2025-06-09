import { Router } from 'express';
import scanController from '../controllers/scan.controller';
import { auth } from '../middleware/auth';
import { optionalAuth } from '../middleware/optionalAuth';

const router = Router();

// Public endpoints - no auth required
router.get('/scan-types', scanController.getScanTypes);

// Free scan endpoints - no auth required
router.post('/free', scanController.createFreeScan);
router.get('/free/:id', scanController.getFreeScan);

// Mixed auth endpoints - auth optional but provides user context
router.post('/', optionalAuth, scanController.createScan);
router.get('/:id', optionalAuth, scanController.getScan);

// Protected endpoints - auth required
router.get('/', auth, scanController.getAllScans);
router.post('/:id/cancel', optionalAuth, scanController.cancelScan);
router.delete('/:id', optionalAuth, scanController.deleteScan);
router.post('/:id/report', optionalAuth, scanController.generateReport);
router.put('/:id/results', optionalAuth, scanController.updateScanResults);

export const scanRoutes = router;