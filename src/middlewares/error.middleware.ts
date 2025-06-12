import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { sendResponse } from '../utils/response';

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error:', err);

  if (err instanceof AppError) {
    return sendResponse(res, null, 'error', err.message, err.statusCode);
  }

  if (err.name === 'ValidationError') {
    return sendResponse(res, null, 'error', err.message, 400);
  }

  if (err.name === 'UnauthorizedError') {
    return sendResponse(res, null, 'error', 'Unauthorized', 401);
  }

  return sendResponse(res, null, 'error', 'Internal server error', 500);
}; 