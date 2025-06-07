import { Request, Response } from 'express';
import analyticsService from '../services/analytics.service';
import { logger } from '../utils/logger';

export class AnalyticsController {
  async getScanStatistics(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { dateFrom, dateTo } = req.query;

      const stats = await analyticsService.getScanStatistics(
        userId,
        dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo ? new Date(dateTo as string) : undefined
      );

      res.json({ data: stats });
    } catch (error: any) {
      logger.error('Failed to get scan statistics', { error });
      res.status(500).json({
        error: 'Failed to get scan statistics',
        message: error.message
      });
    }
  }

  async getVulnerabilityStatistics(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { dateFrom, dateTo } = req.query;

      const stats = await analyticsService.getVulnerabilityStatistics(
        userId,
        dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo ? new Date(dateTo as string) : undefined
      );

      res.json({ data: stats });
    } catch (error: any) {
      logger.error('Failed to get vulnerability statistics', { error });
      res.status(500).json({
        error: 'Failed to get vulnerability statistics',
        message: error.message
      });
    }
  }

  async getTimeSeriesData(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const days = parseInt(req.query.days as string) || 30;

      const data = await analyticsService.getTimeSeriesData(userId, days);

      res.json({ data });
    } catch (error: any) {
      logger.error('Failed to get time series data', { error });
      res.status(500).json({
        error: 'Failed to get time series data',
        message: error.message
      });
    }
  }

  async getTargetAnalytics(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const limit = parseInt(req.query.limit as string) || 10;

      const analytics = await analyticsService.getTargetAnalytics(userId, limit);

      res.json({ data: analytics });
    } catch (error: any) {
      logger.error('Failed to get target analytics', { error });
      res.status(500).json({
        error: 'Failed to get target analytics',
        message: error.message
      });
    }
  }

  async compareScans(req: Request, res: Response) {
    try {
      const { scanId1, scanId2 } = req.params;

      const comparison = await analyticsService.getComparisonData(
        parseInt(scanId1),
        parseInt(scanId2)
      );

      res.json({ data: comparison });
    } catch (error: any) {
      logger.error('Failed to compare scans', { error });
      res.status(500).json({
        error: 'Failed to compare scans',
        message: error.message
      });
    }
  }
}

export default new AnalyticsController();