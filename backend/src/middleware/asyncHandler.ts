import { Request, Response, NextFunction } from 'express';

/**
 * Wraps async route handlers to properly handle errors
 * @param fn - The async function to wrap
 * @returns Express middleware function
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};