import { AuthenticatedRequest } from '@/types/express';
import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { createModuleLogger } from '../utils/logger';
import { sendResponse } from '../utils/response';
import { asyncHandler, withAuth } from '../utils/express';

const authControllerLogger = createModuleLogger('AUTH_CONTROLLER');

export const AuthController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const { firstName, lastName, email, password } = req.body;
    authControllerLogger.info('Registration request received', { email, hasFirstName: !!firstName, hasLastName: !!lastName });
    
    const result = await authService.register({ firstName, lastName, email, password });
    authControllerLogger.info('Registration successful', { email, userId: result.user.id });
    const isMobile = req.headers['x-client-type'] === 'mobile';
    if (isMobile) {
      return sendResponse(res, result, 'success', 'User registered successfully', 201);
    } else {
      if ((result as any).rp_refreshToken) {
        res.cookie('rp_refreshToken', (result as any).rp_refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        delete (result as any).rp_refreshToken;
      }
      return sendResponse(res, result, 'success', 'User registered successfully', 201);
    }
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    authControllerLogger.info('Login request received', { email });
    
    const result = await authService.login(email, password);
    authControllerLogger.info('Login successful', { email, userId: result.user.id });
    const isMobile = req.headers['x-client-type'] === 'mobile';
    if (isMobile) {
      return sendResponse(res, result, 'success', 'Login successful');
    } else {
      if ((result as any).rp_refreshToken) {
        res.cookie('rp_refreshToken', (result as any).rp_refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        delete (result as any).rp_refreshToken;
      }
      return sendResponse(res, result, 'success', 'Login successful');
    }
  }),

  refreshToken: asyncHandler(async (req: Request, res: Response) => {
    const isMobile = req.headers['x-client-type'] === 'mobile';
    let refreshToken: string | undefined;
    if (isMobile) {
      refreshToken = req.body.rp_refreshToken;
    } else {
      refreshToken = req.cookies.rp_refreshToken;
    }
    if (!refreshToken) {
      return sendResponse(res, null, 'error', 'No refresh token provided', 401);
    }
    const result = await authService.refreshToken(refreshToken);
    if (isMobile) {
      return sendResponse(res, result, 'success', 'Token refreshed successfully');
    } else {
      if ((result as any).rp_refreshToken) {
        res.cookie('rp_refreshToken', (result as any).rp_refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        delete (result as any).rp_refreshToken;
      }
      return sendResponse(res, result, 'success', 'Token refreshed successfully');
    }
  }),

  oauthLogin: asyncHandler(async (req: Request, res: Response) => {
    const { email, firstName, lastName, image, provider, providerId } = req.body;
    authControllerLogger.info('OAuth login request received', { email, provider });
    
    const result = await authService.oauthLogin({
      email,
      firstName,
      lastName,
      image,
      provider,
      providerId
    });
    
    authControllerLogger.info('OAuth login successful', { email, provider, userId: result.user.id });
    const isMobile = req.headers['x-client-type'] === 'mobile';
    if (isMobile) {
      return sendResponse(res, result, 'success', 'OAuth login successful');
    } else {
      if ((result as any).rp_refreshToken) {
        res.cookie('rp_refreshToken', (result as any).rp_refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        delete (result as any).rp_refreshToken;
      }
      return sendResponse(res, result, 'success', 'OAuth login successful');
    }
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
    const { id, email, firstName, lastName, image } = req.body;
    authControllerLogger.info('Google user sync request received', { 
      googleId: id, 
      email, 
      hasFirstName: !!firstName, 
      hasLastName: !!lastName, 
      hasImage: !!image 
    });
    
    // Use the existing syncNextAuthUser method
    const user = await authService.syncNextAuthUser({
      id,
      email,
      firstName,
      lastName,
      image
    });

    // Generate tokens for the user
    const tokens = req.user && req.user.id === user.id
      ? undefined // If already authenticated, don't issue new tokens
      : require('../services/token.service').tokenService.generateTokenPair({ id: user.id, email: user.email });

    const isMobile = req.headers['x-client-type'] === 'mobile';
    if (isMobile && tokens) {
      return sendResponse(res, {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          image: user.image,
          googleId: user.googleId
        },
        ...tokens
      }, 'success', 'Google user synced successfully');
    } else {
      if (tokens && tokens.rp_refreshToken) {
        res.cookie('rp_refreshToken', tokens.rp_refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        delete (tokens as any).rp_refreshToken;
      }
      return sendResponse(res, {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          image: user.image,
          googleId: user.googleId
        },
        ...(tokens || {})
      }, 'success', 'Google user synced successfully');
    }
  }),

  testGoogleUserCreate: asyncHandler(async (req: Request, res: Response) => {
    authControllerLogger.info('Test Google user creation request received');
    
    const testGoogleUser = {
      id: 'test-google-id-' + Date.now(),
      email: 'test-google-' + Date.now() + '@example.com',
      firstName: 'Test',
      lastName: 'GoogleUser',
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
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
        googleId: user.googleId
      }
    }, 'success', 'Test completed');
  }),
}; 