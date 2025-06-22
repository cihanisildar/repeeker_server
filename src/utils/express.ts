import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/express';

export const withAuth = (
  handler: (req: AuthenticatedRequest, res: Response) => Promise<any>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req as AuthenticatedRequest, res);
    } catch (error) {
      next(error);
    }
  };
};

// General async handler for non-authenticated routes
export const asyncHandler = (
  handler: (req: Request, res: Response) => Promise<any>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req, res);
    } catch (error) {
      next(error);
    }
  };
}; 