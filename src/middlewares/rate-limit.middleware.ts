import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';

const rateLimitMessage = (req: Request, res: Response) => {
  logger.warn(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
  return res.status(429).json({
    error: 'Too many requests',
    message: 'You have exceeded the maximum number of requests. Please try again later.',
    retryAfter: Math.round(req.rateLimit?.resetTime! / 1000) || 60
  });
};

export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: rateLimitMessage,
  standardHeaders: true, 
  legacyHeaders: false,
  handler: rateLimitMessage,
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: process.env.NODE_ENV === 'development' ? 100 : 5, 
  message: rateLimitMessage,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitMessage,
  skipSuccessfulRequests: true,
});

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 60, 
  message: rateLimitMessage,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitMessage,
});

export const testSessionRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  message: rateLimitMessage,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitMessage,
}); 