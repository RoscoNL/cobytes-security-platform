import session from 'express-session';
import { redisClient } from '../config/redis';
const RedisStore = require('connect-redis').default;

declare module 'express-session' {
  interface SessionData {
    cartId?: number;
    userId?: number;
  }
}

export const sessionMiddleware = session({
  store: new RedisStore({
    client: redisClient as any,
    prefix: 'session:',
  }),
  secret: process.env.SESSION_SECRET || 'cobytes-security-platform-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  }
});