import { Request, Response } from 'express';
import { testSessionService } from '../services/test-session.service';
import { logger } from '../utils/logger';
import { sendResponse } from '../utils/response';
import { AuthenticatedRequest } from '@/types/express';

export const TestSessionController = {
  async createTestSession(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }

      const testSession = await testSessionService.createTestSession(req.user.id);
      return sendResponse(res, testSession, 'success', 'Test session created successfully', 201);
    } catch (error) {
      logger.error('Create test session error:', error);
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to create test session', 500);
    }
  },

  async getTestSessions(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }

      const testSessions = await testSessionService.getTestSessions(req.user.id);
      return sendResponse(res, testSessions, 'success', 'Test sessions retrieved successfully');
    } catch (error) {
      logger.error('Get test sessions error:', error);
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to get test sessions', 500);
    }
  },

  async getTestHistory(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }

      const testHistory = await testSessionService.getTestHistory(req.user.id);
      return sendResponse(res, testHistory, 'success', 'Test history retrieved successfully');
    } catch (error) {
      logger.error('Get test history error:', error);
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to get test history', 500);
    }
  },

  async getTestSession(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }

      const { id } = req.params;
      const testSession = await testSessionService.getTestSession(id, req.user.id);

      if (!testSession) {
        return sendResponse(res, null, 'error', 'Test session not found', 404);
      }

      return sendResponse(res, testSession, 'success', 'Test session retrieved successfully');
    } catch (error) {
      logger.error('Get test session error:', error);
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to get test session', 500);
    }
  },

  async submitTestResult(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }

      const { sessionId } = req.params;
      const { cardId, isCorrect, timeSpent } = req.body;

      // Validate required fields
      if (!cardId) {
        return sendResponse(res, null, 'error', 'cardId is required', 400);
      }
      if (typeof isCorrect !== 'boolean') {
        return sendResponse(res, null, 'error', 'isCorrect must be a boolean', 400);
      }
      if (typeof timeSpent !== 'number') {
        return sendResponse(res, null, 'error', 'timeSpent must be a number', 400);
      }

      logger.info('Received test result submission:', {
        sessionId,
        cardId,
        isCorrect,
        timeSpent,
        userId: req.user.id
      });

      const result = await testSessionService.submitTestResult({
        sessionId,
        cardId,
        isCorrect,
        timeSpent,
        userId: req.user.id
      });

      if (!result) {
        return sendResponse(res, null, 'error', 'Test session not found', 404);
      }

      return sendResponse(res, result, 'success', 'Test result submitted successfully');
    } catch (error) {
      logger.error('Submit test result error:', error);
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to submit test result', 500);
    }
  },
}; 