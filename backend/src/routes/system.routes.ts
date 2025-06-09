import { Router, Request, Response } from 'express';
import { asyncHandler } from '@middleware/asyncHandler';
import securityScannerService from '@services/security-scanner.service';
import { logger } from '@utils/logger';
import { getConnection } from 'typeorm';

const router = Router();

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'cobytes-security-platform',
    version: '2.0.0'
  });
});

// Database health check
router.get('/database-health', asyncHandler(async (req: Request, res: Response) => {
  try {
    const connection = getConnection();
    await connection.query('SELECT 1');
    res.json({
      database: 'connected',
      name: connection.options.database,
      type: connection.options.type
    });
  } catch (error: any) {
    res.status(503).json({
      database: 'disconnected',
      error: error.message
    });
  }
}));

// Redis health check
router.get('/redis-health', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Since we're using in-memory cache, just check if it's initialized
    const cacheStatus = (global as any).inMemoryCache ? 'connected' : 'disconnected';
    res.json({
      redis: cacheStatus,
      type: 'in-memory'
    });
  } catch (error: any) {
    res.status(503).json({
      redis: 'disconnected',
      error: error.message
    });
  }
}));

// Check API status
router.get('/api-status', asyncHandler(async (req: Request, res: Response) => {
  const apiKey = process.env.SECURITY_API_KEY;
  const apiUrl = process.env.SECURITY_API_URL || 'https://app.pentest-tools.com/api/v2';
  
  res.json({
    apiConfigured: !!apiKey && apiKey.length > 10,
    apiUrl,
    authMethod: 'Bearer Token',
    lastError: !apiKey ? 'No API key configured' : undefined,
  });
}));

// Test API connection
router.post('/test-api', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Try to get targets (simple API call to test authentication)
    const result = await securityScannerService.getTargets();
    res.json({
      success: true,
      message: 'API connection successful',
      data: result
    });
  } catch (error: any) {
    logger.error('API test failed:', error);
    res.status(400).json({
      success: false,
      error: error.response?.data?.message || error.message || 'API test failed'
    });
  }
}));

export default router;