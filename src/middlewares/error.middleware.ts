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

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    if (prismaError.code === 'P2002') {
      return sendResponse(res, null, 'error', 'A record with this information already exists', 409);
    }
    if (prismaError.code === 'P2025') {
      return sendResponse(res, null, 'error', 'Record not found', 404);
    }
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return sendResponse(res, null, 'error', err.message, 400);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendResponse(res, null, 'error', 'Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return sendResponse(res, null, 'error', 'Token expired', 401);
  }

  if (err.name === 'UnauthorizedError') {
    return sendResponse(res, null, 'error', 'Unauthorized', 401);
  }

  // Handle syntax errors (malformed JSON, etc.)
  if (err instanceof SyntaxError && 'body' in err) {
    return sendResponse(res, null, 'error', 'Invalid JSON in request body', 400);
  }

  // Default error
  const isDevelopment = process.env.NODE_ENV === 'development';
  const message = isDevelopment ? err.message : 'Internal server error';
  
  return sendResponse(res, null, 'error', message, 500);
}; 