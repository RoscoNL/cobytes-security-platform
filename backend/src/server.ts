import dotenv from 'dotenv';

// Load environment variables FIRST before any other imports
dotenv.config();

import express, { Application } from 'express';
import { createServer } from 'http';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { errorHandler } from '@middleware/errorHandler';
import { notFoundHandler } from '@middleware/notFoundHandler';
import { requestLogger } from '@middleware/requestLogger';
import corsMiddleware from '@middleware/cors';
import { sessionMiddleware } from '@middleware/session';
import { conditionalBodyParser, conditionalUrlEncodedParser } from '@middleware/bodyParser';
import { configureRoutes } from '@routes/index';
import { logger } from '@utils/logger';
import { initializeDatabase } from '@config/typeorm';
import { connectRedis } from '@config/redis';
import WebSocketService from '@services/websocket.service';
import schedulerService from '@services/scheduler.service';
import productService from '@services/product.service';
import couponService from '@services/coupon.service';

// Create Express application
const app: Application = express();

// Create HTTP server
const httpServer = createServer(app);

// Basic middleware
app.use(helmet());
app.use(corsMiddleware);
app.use(compression());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Body parsing middleware - only parse bodies for POST/PUT/PATCH requests
app.use(conditionalBodyParser);
app.use(conditionalUrlEncodedParser);

// Session middleware - temporarily disabled
// app.use(sessionMiddleware);

// Custom middleware
app.use(requestLogger);

// Configure routes
configureRoutes(app);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    // Connect to databases
    await initializeDatabase();
    await connectRedis();
    
    // Initialize services
    await productService.initializeProducts();
    await couponService.initializeDefaultCoupons();
    
    // Initialize WebSocket service
    const wsService = new WebSocketService(httpServer);
    
    // Initialize scheduler service
    await schedulerService.initialize();
    
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔌 WebSocket service initialized`);
      logger.info(`⏰ Scheduler service initialized`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();