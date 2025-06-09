import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { getRedis } from '../config/redis';
import { logger } from '../utils/logger';
import jwt from 'jsonwebtoken';

export class WebSocketService {
  private io: Server;
  private static instance: WebSocketService;

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: [
          'http://localhost:3000',
          'http://localhost:3002',
          process.env.FRONTEND_URL || 'http://localhost:3002'
        ],
        credentials: true
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    this.setupInMemorySubscriptions();
    
    // Store singleton instance
    WebSocketService.instance = this;
  }

  // Get singleton instance
  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      throw new Error('WebSocketService not initialized');
    }
    return WebSocketService.instance;
  }

  private setupMiddleware() {
    // Optional authentication middleware
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
          socket.data.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role
          };
        } catch (error) {
          logger.debug('Invalid token in WebSocket connection', { error });
        }
      }
      
      next();
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.info('New WebSocket connection', { 
        id: socket.id,
        user: socket.data.user?.email || 'anonymous'
      });

      // Join scan room for updates
      socket.on('subscribe:scan', (scanId: number) => {
        const room = `scan:${scanId}`;
        socket.join(room);
        logger.debug(`Socket ${socket.id} joined room ${room}`);
      });

      // Leave scan room
      socket.on('unsubscribe:scan', (scanId: number) => {
        const room = `scan:${scanId}`;
        socket.leave(room);
        logger.debug(`Socket ${socket.id} left room ${room}`);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        logger.debug('WebSocket disconnected', { id: socket.id });
      });
    });
  }

  private setupInMemorySubscriptions() {
    try {
      const redis = getRedis();
      
      // Subscribe to scan progress updates
      redis.subscribe('scan-progress', (message: string) => {
        try {
          const data = JSON.parse(message);
          this.emitToScan(data.scanId, 'scan:progress', data);
        } catch (error) {
          logger.error('Failed to parse scan progress message', { error });
        }
      });
      
      logger.info('WebSocket service initialized with in-memory pub/sub');
    } catch (error) {
      logger.error('Failed to setup in-memory subscriptions', { error });
    }
  }

  // Method to emit events from other parts of the application
  public emitToScan(scanId: number, event: string, data: any) {
    const room = `scan:${scanId}`;
    this.io.to(room).emit(event, data);
  }

  // Get connected clients count
  public getConnectedClients(): number {
    return this.io.sockets.sockets.size;
  }

  // Get clients in a specific scan room
  public getClientsInScanRoom(scanId: number): number {
    const room = `scan:${scanId}`;
    const roomClients = this.io.sockets.adapter.rooms.get(room);
    return roomClients ? roomClients.size : 0;
  }
}

export default WebSocketService;