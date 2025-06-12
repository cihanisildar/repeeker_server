import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    logger.debug('Auth header:', authHeader);

    if (!authHeader) {
      logger.debug('No auth header found');
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    logger.debug('Extracted token:', token);

    if (!token) {
      logger.debug('No token found in auth header');
      return res.status(401).json({ message: 'No token provided' });
    }

    logger.debug('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'Secret is set' : 'Secret is not set');
    
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET as string) as {
      id: string;
      email: string;
    };
    
    logger.debug('Decoded token:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      logger.error('JWT Error details:', {
        name: error.name,
        message: error.message
      });
    }
    res.status(401).json({ message: 'Invalid token' });
  }
}; 