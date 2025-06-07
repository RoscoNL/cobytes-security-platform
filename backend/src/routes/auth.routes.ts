import { Router, Request, Response } from 'express';
import { logger } from '@utils/logger';
import { asyncHandler } from '@middleware/asyncHandler';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = Router();

// Mock user database
const users = new Map<string, any>();

// Initialize with a test user
users.set('admin@cobytes.com', {
  id: 'user_1',
  email: 'admin@cobytes.com',
  password: bcrypt.hashSync('admin123', 10),
  role: 'admin',
  name: 'Admin User',
  createdAt: new Date()
});

// Login endpoint
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  logger.info('POST /api/auth/login - User login attempt', { email });
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password are required'
    });
  }
  
  const user = users.get(email);
  
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }
  
  // Generate JWT token
  const token = jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET || 'cobytes-secret-key',
    { expiresIn: '24h' }
  );
  
  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;
  
  res.json({
    success: true,
    data: {
      user: userWithoutPassword,
      token,
      expiresIn: 86400 // 24 hours in seconds
    }
  });
}));

// Register endpoint
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, organization } = req.body;
  logger.info('POST /api/auth/register - New user registration', { email });
  
  if (!email || !password || !name) {
    return res.status(400).json({
      success: false,
      error: 'Email, password, and name are required'
    });
  }
  
  if (users.has(email)) {
    return res.status(409).json({
      success: false,
      error: 'User already exists'
    });
  }
  
  // Create new user
  const hashedPassword = bcrypt.hashSync(password, 10);
  const userId = `user_${Date.now()}`;
  
  const newUser = {
    id: userId,
    email,
    password: hashedPassword,
    name,
    organization,
    role: 'user',
    createdAt: new Date()
  };
  
  users.set(email, newUser);
  
  // Generate JWT token
  const token = jwt.sign(
    { 
      userId: newUser.id, 
      email: newUser.email, 
      role: newUser.role 
    },
    process.env.JWT_SECRET || 'cobytes-secret-key',
    { expiresIn: '24h' }
  );
  
  // Remove password from response
  const { password: _, ...userWithoutPassword } = newUser;
  
  res.status(201).json({
    success: true,
    data: {
      user: userWithoutPassword,
      token,
      expiresIn: 86400
    }
  });
}));

// Refresh token endpoint
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;
  logger.info('POST /api/auth/refresh - Token refresh request');
  
  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'Token is required'
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cobytes-secret-key') as any;
    
    // Generate new token
    const newToken = jwt.sign(
      { 
        userId: decoded.userId, 
        email: decoded.email, 
        role: decoded.role 
      },
      process.env.JWT_SECRET || 'cobytes-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      data: {
        token: newToken,
        expiresIn: 86400
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
}));

// Logout endpoint
router.post('/logout', asyncHandler(async (_req: Request, res: Response) => {
  logger.info('POST /api/auth/logout - User logout');
  
  // In a real app, you might want to blacklist the token here
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

// Verify token endpoint
router.get('/verify', asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  logger.info('GET /api/auth/verify - Token verification');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'No token provided'
    });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cobytes-secret-key') as any;
    const user = Array.from(users.values()).find(u => u.id === decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token: {
          valid: true,
          expiresAt: new Date(decoded.exp * 1000)
        }
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
}));

export const authRoutes = router;