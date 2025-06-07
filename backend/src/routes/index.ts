import { Application, Request, Response } from 'express';
import { logger } from '@utils/logger';

// Import route modules
import { authRoutes } from './auth.routes';
import { scanRoutes } from './scan.routes';
import { reportRoutes } from './report.routes';
import { analyticsRoutes } from './analytics.routes';
import systemRoutes from './system.routes';
import proxyRoutes from './proxy.routes';
// import { userRoutes } from './user.routes';
// import { organizationRoutes } from './organization.routes';
// import { adminRoutes } from './admin.routes';

export const configureRoutes = (app: Application): void => {
  logger.info('🔧 Configuring routes...');

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
    });
  });

  // API info endpoint
  app.get('/api', (_req: Request, res: Response) => {
    res.status(200).json({
      message: 'Cobytes Security Platform API',
      version: '1.0.0',
      documentation: '/api/docs',
      endpoints: {
        health: '/health',
        auth: '/api/auth',
        users: '/api/users',
        scans: '/api/scans',
        reports: '/api/reports',
        organizations: '/api/organizations',
        admin: '/api/admin',
      },
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/scans', scanRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/system', systemRoutes);
  app.use('/api/proxy', proxyRoutes);
  // app.use('/api/users', userRoutes);
  // app.use('/api/organizations', organizationRoutes);
  // app.use('/api/admin', adminRoutes);

  // Temporary test routes
  app.get('/api/test', (req: Request, res: Response) => {
    res.json({
      message: 'API is working!',
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
  });

  app.post('/api/echo', (req: Request, res: Response) => {
    res.json({
      message: 'Echo endpoint',
      body: req.body,
      headers: req.headers,
      query: req.query,
    });
  });

  logger.info('✅ Routes configured successfully');
};
