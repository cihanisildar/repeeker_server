import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { authService } from '../services/auth.service';

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify token with NextAuth secret
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET as string) as {
      id: string;
      email: string;
      name?: string;
      picture?: string;
    };

    // Sync the user with our database
    try {
      const dbUser = await authService.syncNextAuthUser(decoded);
      
      // Use the database user ID instead of NextAuth ID
      req.user = {
        id: dbUser.id,
        email: dbUser.email || '',
        name: dbUser.name || undefined,
        image: dbUser.image || undefined
      };
    } catch (syncError) {
      logger.error('Error syncing NextAuth user:', syncError);
      return res.status(500).json({ message: 'Failed to sync user' });
    }
    
    // Ensure req.user is set
    if (!req.user) {
      logger.error('req.user is not set after authentication');
      return res.status(500).json({ message: 'Authentication failed' });
    }
    
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