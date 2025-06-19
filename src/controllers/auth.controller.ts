import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { logger } from '../utils/logger';
import { sendResponse } from '../utils/response';
import { AuthenticatedRequest } from '@/types/express';
import { userRepository } from '../repositories/user.repository';
import prisma from '../lib/prisma';
import jwt from 'jsonwebtoken';

export const AuthController = {
  async register(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;
      const result = await authService.register({ name, email, password });
      return sendResponse(res, result, 'success', 'User registered successfully', 201);
    } catch (error) {
      logger.error('Registration error:', error);
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Registration failed', 500);
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      return sendResponse(res, result, 'success', 'Login successful');
    } catch (error) {
      logger.error('Login error:', error);
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Login failed', 401);
    }
  },

  async oauthLogin(req: Request, res: Response) {
    try {
      const { email, name, image, provider, providerId } = req.body;
      
      if (!email || !provider || !providerId) {
        return sendResponse(res, null, 'error', 'Missing required fields: email, provider, providerId', 400);
      }

      const result = await authService.oauthLogin({
        email,
        name,
        image,
        provider,
        providerId
      });
      
      return sendResponse(res, result, 'success', 'OAuth login successful');
    } catch (error) {
      logger.error('OAuth login error:', error);
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'OAuth login failed', 401);
    }
  },

  async getCurrentUser(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }

      const user = await authService.getCurrentUser(userId);
      return sendResponse(res, user, 'success', 'User retrieved successfully');
    } catch (error) {
      logger.error('Get current user error:', error);
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to get user', 500);
    }
  },

  async testDatabase(req: Request, res: Response) {
    try {
      logger.debug('Testing database connection...');
      
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;
      logger.debug('Database connection successful');
      
      // Test user creation
      const testUser = await userRepository.create({
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        password: 'test123'
      });
      logger.debug('Test user created:', testUser.id);
      
      // Clean up test user
      await userRepository.delete(testUser.id);
      logger.debug('Test user deleted');
      
      return sendResponse(res, { status: 'Database working' }, 'success', 'Database test successful');
    } catch (error) {
      logger.error('Database test error:', error);
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Database test failed', 500);
    }
  },

  async debugToken(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return sendResponse(res, null, 'error', 'No authorization header', 400);
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        return sendResponse(res, null, 'error', 'No token found', 400);
      }

      // Try to decode without verification first
      const decodedWithoutVerification = jwt.decode(token);
      
      // Try NextAuth secret
      let nextAuthDecoded = null;
      try {
        nextAuthDecoded = jwt.verify(token, process.env.NEXTAUTH_SECRET as string);
      } catch (error) {
        logger.debug('NextAuth verification failed:', error);
      }

      // Try JWT secret
      let jwtDecoded = null;
      try {
        jwtDecoded = jwt.verify(token, process.env.JWT_SECRET as string);
      } catch (error) {
        logger.debug('JWT verification failed:', error);
      }

      // Test with the specific Google OAuth token from logs
      const googleOAuthToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwODU1NzcwODc2MDUxOTI2OTYyNCIsImVtYWlsIjoibXVoYW1tZXQuaXNpbGRhckBvZ3IuZHB1LmVkdS50ciIsIm5hbWUiOiJNVUhBTU1FVCBDxLBIQU4gScWeSUxEQVIgScWeSUxEQVIiLCJpYXQiOjE3NTAyODI5MjIsImV4cCI6MTc1Mjg3NDkyMn0.h_gzOPRxAgU-gSNLU6c5hNOF6MAAOP9Xf-zP6IyzusM';
      
      let googleTokenDecoded = null;
      try {
        googleTokenDecoded = jwt.verify(googleOAuthToken, process.env.NEXTAUTH_SECRET as string);
      } catch (error) {
        logger.debug('Google OAuth token verification failed:', error);
      }

      // Decode the Google OAuth token without verification to see its structure
      const googleTokenDecodedWithoutVerification = jwt.decode(googleOAuthToken);

      return sendResponse(res, {
        tokenLength: token.length,
        decodedWithoutVerification,
        nextAuthDecoded,
        jwtDecoded,
        googleOAuthTokenDecoded: googleTokenDecoded,
        googleTokenDecodedWithoutVerification,
        nextAuthSecret: process.env.NEXTAUTH_SECRET ? 'Set' : 'Not set',
        jwtSecret: process.env.JWT_SECRET ? 'Set' : 'Not set',
        secretsMatch: process.env.NEXTAUTH_SECRET === process.env.JWT_SECRET,
        environment: process.env.NODE_ENV
      }, 'success', 'Token debug info');
    } catch (error) {
      logger.error('Token debug error:', error);
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Token debug failed', 500);
    }
  },

  async checkSecrets(req: Request, res: Response) {
    try {
      return sendResponse(res, {
        nextAuthSecretSet: !!process.env.NEXTAUTH_SECRET,
        jwtSecretSet: !!process.env.JWT_SECRET,
        nextAuthSecretLength: process.env.NEXTAUTH_SECRET?.length || 0,
        jwtSecretLength: process.env.JWT_SECRET?.length || 0,
        secretsMatch: process.env.NEXTAUTH_SECRET === process.env.JWT_SECRET,
        environment: process.env.NODE_ENV
      }, 'success', 'Secrets check completed');
    } catch (error) {
      logger.error('Secrets check error:', error);
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Secrets check failed', 500);
    }
  },

  async syncGoogleUser(req: Request, res: Response) {
    try {
      logger.debug('=== Google User Sync Endpoint Called ===');
      logger.debug('Request method:', req.method);
      logger.debug('Request URL:', req.url);
      logger.debug('Request headers:', req.headers);
      logger.debug('Request body:', req.body);
      
      const { id, email, name, image } = req.body;
      
      if (!id || !email) {
        logger.error('Missing required fields for Google user sync');
        logger.error('Received data:', { id, email, name, image });
        return sendResponse(res, null, 'error', 'Missing required fields: id, email', 400);
      }

      logger.debug('Syncing Google user:', { id, email, name, image });
      
      // Use the existing syncNextAuthUser method
      const user = await authService.syncNextAuthUser({
        id,
        email,
        name,
        image
      });

      logger.debug('Google user sync completed successfully:', {
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        userGoogleId: user.googleId
      });

      return sendResponse(res, {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          googleId: user.googleId
        }
      }, 'success', 'Google user synced successfully');
    } catch (error) {
      logger.error('Google user sync error:', error);
      logger.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Google user sync failed', 500);
    }
  },

  async testGoogleUserCreate(req: Request, res: Response) {
    try {
      logger.debug('=== Testing Google User Creation ===');
      
      const testGoogleUser = {
        id: 'test-google-id-' + Date.now(),
        email: 'test-google-' + Date.now() + '@example.com',
        name: 'Test Google User',
        image: 'https://example.com/test-image.jpg'
      };

      logger.debug('Creating test Google user:', testGoogleUser);
      
      const user = await authService.syncNextAuthUser(testGoogleUser);

      logger.debug('Test Google user created successfully:', {
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        userGoogleId: user.googleId
      });

      return sendResponse(res, {
        message: 'Test Google user created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          googleId: user.googleId
        }
      }, 'success', 'Test completed');
    } catch (error) {
      logger.error('Test Google user creation error:', error);
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Test failed', 500);
    }
  },
}; 