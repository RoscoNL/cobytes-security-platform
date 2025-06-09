import { Router, Request, Response } from 'express';
import { logger } from '@utils/logger';
import { asyncHandler } from '@middleware/asyncHandler';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '@config/typeorm';
import { User } from '@models/user.model';

const router = Router();

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
  
  try {
    // Use real database
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { email: email.toLowerCase() }
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Account is disabled'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'cobytes-security-secret-2024',
      { expiresIn: '7d' }
    );
    
    // Return user data (without password)
    const { password: _, ...userData } = user;
    
    res.json({
      success: true,
      data: {
        token,
        user: userData
      }
    });
  } catch (error: any) {
    logger.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: error.message
    });
  }
}));

// Register endpoint
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, organization } = req.body;
  logger.info('POST /api/auth/register - New user registration', { email });
  
  // No real user database integrated yet
  return res.status(503).json({
    success: false,
    error: 'Registration service not available - real user database integration required'
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cobytes-security-secret-2024') as any;
    
    // Get user from database
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: decoded.id }
    });
    
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