import { Router, Request, Response } from 'express';
import { asyncHandler } from '@middleware/asyncHandler';
import pentestToolsService from '@services/pentesttools.service';
import { logger } from '@utils/logger';

const router = Router();

// Check API status
router.get('/api-status', asyncHandler(async (req: Request, res: Response) => {
  const apiKey = process.env.PENTEST_TOOLS_API_KEY;
  const apiUrl = process.env.PENTEST_TOOLS_API_URL || 'https://app.pentest-tools.com/api/v2';
  
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
    const result = await pentestToolsService.getTargets();
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