import { Request, Response, NextFunction } from 'express';
import express from 'express';

// Only parse JSON bodies for requests that should have bodies
export const conditionalBodyParser = (req: Request, res: Response, next: NextFunction) => {
  // Skip body parsing for GET and DELETE requests
  if (req.method === 'GET' || req.method === 'DELETE' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }
  
  // Use Express JSON parser for other methods
  express.json({ limit: '10mb' })(req, res, next);
};

// Only parse URL-encoded bodies for requests that should have bodies
export const conditionalUrlEncodedParser = (req: Request, res: Response, next: NextFunction) => {
  // Skip body parsing for GET and DELETE requests
  if (req.method === 'GET' || req.method === 'DELETE' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }
  
  // Use Express URL-encoded parser for other methods
  express.urlencoded({ extended: true, limit: '10mb' })(req, res, next);
};