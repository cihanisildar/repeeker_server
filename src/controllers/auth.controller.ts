import { AuthenticatedRequest } from '@/types/express';
import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { createModuleLogger } from '../utils/logger';
import { sendResponse } from '../utils/response';
import { asyncHandler, withAuth } from '../utils/express';

const authControllerLogger = createModuleLogger('AUTH_CONTROLLER');

export const AuthController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    authControllerLogger.info('Registration request received', { email, hasName: !!name });
    
    const result = await authService.register({ name, email, password });
    authControllerLogger.info('Registration successful', { email, userId: result.user.id });
    return sendResponse(res, result, 'success', 'User registered successfully', 201);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    authControllerLogger.info('Login request received', { email });
    
    const result = await authService.login(email, password);
    authControllerLogger.info('Login successful', { email, userId: result.user.id });
    return sendResponse(res, result, 'success', 'Login successful');
  }),

  oauthLogin: asyncHandler(async (req: Request, res: Response) => {
    const { email, name, image, provider, providerId } = req.body;
    authControllerLogger.info('OAuth login request received', { email, provider });
    
    const result = await authService.oauthLogin({
      email,
      name,
      image,
      provider,
      providerId
    });
    
    authControllerLogger.info('OAuth login successful', { email, provider, userId: result.user.id });
    return sendResponse(res, result, 'success', 'OAuth login successful');
  }),

  getCurrentUser: async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    authControllerLogger.debug('Get current user request', { userId });
    
    if (!userId) {
      authControllerLogger.warn('Get current user request without authentication');
      return sendResponse(res, null, 'error', 'Not authenticated', 401);
    }

    const user = await authService.getCurrentUser(userId);
    authControllerLogger.debug('Current user retrieved successfully', { userId });
    return sendResponse(res, user, 'success', 'User retrieved successfully');
  },

  syncGoogleUser: asyncHandler(async (req: Request, res: Response) => {
    const { id, email, name, image } = req.body;
    authControllerLogger.info('Google user sync request received', { 
      googleId: id, 
      email, 
      hasName: !!name, 
      hasImage: !!image 
    });
    
    // Use the existing syncNextAuthUser method
    const user = await authService.syncNextAuthUser({
      id,
      email,
      name,
      image
    });

    authControllerLogger.info('Google user sync completed successfully', {
      userId: user.id,
      email: user.email,
      googleId: user.googleId
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
  }),

  testGoogleUserCreate: asyncHandler(async (req: Request, res: Response) => {
    authControllerLogger.info('Test Google user creation request received');
    
    const testGoogleUser = {
      id: 'test-google-id-' + Date.now(),
      email: 'test-google-' + Date.now() + '@example.com',
      name: 'Test Google User',
      image: 'https://example.com/test-image.jpg'
    };

    authControllerLogger.debug('Creating test Google user', { testUser: testGoogleUser });
    
    const user = await authService.syncNextAuthUser(testGoogleUser);

    authControllerLogger.info('Test Google user created successfully', {
      userId: user.id,
      email: user.email,
      googleId: user.googleId
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
  }),
}; 