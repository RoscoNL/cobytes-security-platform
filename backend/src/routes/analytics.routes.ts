import { Router } from 'express';
import analyticsController from '../controllers/analytics.controller';
import { auth } from '../middleware/auth';

const router = Router();

// All analytics endpoints require authentication
router.get('/statistics/scans', auth, analyticsController.getScanStatistics);
router.get('/statistics/vulnerabilities', auth, analyticsController.getVulnerabilityStatistics);
router.get('/timeseries', auth, analyticsController.getTimeSeriesData);
router.get('/targets', auth, analyticsController.getTargetAnalytics);
router.get('/compare/:scanId1/:scanId2', auth, analyticsController.compareScans);

export const analyticsRoutes = router;