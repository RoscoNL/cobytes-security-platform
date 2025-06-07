import { logger } from '@utils/logger';
import { EventEmitter } from 'events';

// In-memory storage for cache and pub/sub
const memoryStore = new Map<string, any>();
const eventEmitter = new EventEmitter();

// In-memory Redis replacement
class InMemoryRedis {
  private store: Map<string, any>;
  private timers: Map<string, NodeJS.Timeout>;
  private eventEmitter: EventEmitter;

  constructor() {
    this.store = memoryStore;
    this.timers = new Map();
    this.eventEmitter = eventEmitter;
  }

  async get(key: string): Promise<string | null> {
    const value = this.store.get(key);
    return value !== undefined ? value : null;
  }

  async set(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async setex(key: string, ttl: number, value: string): Promise<void> {
    this.store.set(key, value);
    
    // Clear existing timer if any
    const existingTimer = this.timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Set new timer for expiration
    const timer = setTimeout(() => {
      this.store.delete(key);
      this.timers.delete(key);
    }, ttl * 1000);
    
    this.timers.set(key, timer);
  }

  async del(...keys: string[]): Promise<void> {
    for (const key of keys) {
      this.store.delete(key);
      const timer = this.timers.get(key);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(key);
      }
    }
  }

  async exists(key: string): Promise<number> {
    return this.store.has(key) ? 1 : 0;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
    return Array.from(this.store.keys()).filter(key => regex.test(key));
  }

  async publish(channel: string, message: string): Promise<void> {
    this.eventEmitter.emit(channel, message);
  }

  subscribe(channel: string, callback: (message: string) => void): void {
    this.eventEmitter.on(channel, callback);
  }

  unsubscribe(channel: string, callback: (message: string) => void): void {
    this.eventEmitter.off(channel, callback);
  }

  async quit(): Promise<void> {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    // Remove all listeners
    this.eventEmitter.removeAllListeners();
  }
}

// Redis client instance
let redisClient: InMemoryRedis | null = null;

// Connect to Redis (now just initializes in-memory store)
export const connectRedis = async (): Promise<void> => {
  redisClient = new InMemoryRedis();
  logger.info('✅ In-memory cache initialized (Redis replacement)');
  logger.info('📦 Using in-memory storage for caching and pub/sub');
  return Promise.resolve();
};

// Get Redis client
export const getRedis = (): InMemoryRedis => {
  if (!redisClient) {
    throw new Error('In-memory cache not initialized. Call connectRedis() first.');
  }
  return redisClient;
};

// Close Redis connection
export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    logger.info('In-memory cache cleared');
  }
};

// Cache helpers
export const cache = {
  // Get value from cache
  get: async (key: string): Promise<any> => {
    const redis = getRedis();
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  },

  // Set value in cache
  set: async (key: string, value: any, ttl?: number): Promise<void> => {
    const redis = getRedis();
    const serialized = JSON.stringify(value);
    
    if (ttl) {
      await redis.setex(key, ttl, serialized);
    } else {
      await redis.set(key, serialized);
    }
  },

  // Delete from cache
  del: async (key: string): Promise<void> => {
    const redis = getRedis();
    await redis.del(key);
  },

  // Check if key exists
  exists: async (key: string): Promise<boolean> => {
    const redis = getRedis();
    const exists = await redis.exists(key);
    return exists === 1;
  },

  // Clear cache by pattern
  clearPattern: async (pattern: string): Promise<void> => {
    const redis = getRedis();
    const keys = await redis.keys(pattern);
    
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },
};

// Session storage helpers
export const sessions = {
  // Store session
  store: async (sessionId: string, data: any, ttl = 86400): Promise<void> => {
    await cache.set(`session:${sessionId}`, data, ttl);
  },

  // Get session
  get: async (sessionId: string): Promise<any> => {
    return await cache.get(`session:${sessionId}`);
  },

  // Delete session
  destroy: async (sessionId: string): Promise<void> => {
    await cache.del(`session:${sessionId}`);
  },
};

// Export redisClient for services that need direct access
export { redisClient };
