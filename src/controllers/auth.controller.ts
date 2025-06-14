import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { logger } from '../utils/logger';
import { sendResponse } from '../utils/response';
import { AuthenticatedRequest } from '@/types/express';
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
}; 