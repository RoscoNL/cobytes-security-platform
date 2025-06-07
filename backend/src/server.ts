import express, { Application } from 'express';
import { createServer } from 'http';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from '@middleware/errorHandler';
import { notFoundHandler } from '@middleware/notFoundHandler';
import { requestLogger } from '@middleware/requestLogger';
import corsMiddleware from '@middleware/cors';
import { configureRoutes } from '@routes/index';
import { logger } from '@utils/logger';
import { initializeDatabase } from '@config/typeorm';
import { connectRedis } from '@config/redis';
import WebSocketService from '@services/websocket.service';
import schedulerService from '@services/scheduler.service';

// Load environment variables
dotenv.config();

// Create Express application
const app: Application = express();

// Create HTTP server
const httpServer = createServer(app);

// Basic middleware
app.use(helmet());
app.use(corsMiddleware);
app.use(compression());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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