import { Request, Response, NextFunction } from 'express';

export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Resource not found',
      path: req.url,
      method: req.method
    },
    timestamp: new Date().toISOString()
  });
};
