import { Request, Response } from 'express';
import { testSessionService } from '../services/test-session.service';
import { createModuleLogger } from '../utils/logger';
import { sendResponse } from '../utils/response';
import { AuthenticatedRequest } from '@/types/express';

const testSessionControllerLogger = createModuleLogger('TESTSESSION_CONTROLLER');

export const TestSessionController = {
  async createTestSession(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    testSessionControllerLogger.info('Create test session request received', { userId });
    
    try {
      if (!userId) {
        testSessionControllerLogger.warn('Create test session request without authentication');
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }

      const testSession = await testSessionService.createTestSession(userId);
      testSessionControllerLogger.info('Test session created successfully', { 
        userId, 
        sessionId: testSession.id 
      });
      return sendResponse(res, testSession, 'success', 'Test session created successfully', 201);
    } catch (error) {
      testSessionControllerLogger.error('Failed to create test session', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to create test session', 500);
    }
  },

  async getTestSessions(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    testSessionControllerLogger.debug('Get test sessions request received', { userId });
    
    try {
      if (!userId) {
        testSessionControllerLogger.warn('Get test sessions request without authentication');
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }

      const testSessions = await testSessionService.getTestSessions(userId);
      testSessionControllerLogger.debug('Test sessions retrieved successfully', { 
        userId, 
        count: testSessions.length 
      });
      return sendResponse(res, testSessions, 'success', 'Test sessions retrieved successfully');
    } catch (error) {
      testSessionControllerLogger.error('Failed to get test sessions', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to get test sessions', 500);
    }
  },

  async getTestHistory(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    testSessionControllerLogger.debug('Get test history request received', { userId });
    
    try {
      if (!userId) {
        testSessionControllerLogger.warn('Get test history request without authentication');
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }

      const testHistory = await testSessionService.getTestHistory(userId);
      testSessionControllerLogger.debug('Test history retrieved successfully', { userId });
      return sendResponse(res, testHistory, 'success', 'Test history retrieved successfully');
    } catch (error) {
      testSessionControllerLogger.error('Failed to get test history', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to get test history', 500);
    }
  },

  async getTestSession(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    const { id } = req.params;
    testSessionControllerLogger.debug('Get test session request received', { userId, sessionId: id });
    
    try {
      if (!userId) {
        testSessionControllerLogger.warn('Get test session request without authentication');
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }

      const testSession = await testSessionService.getTestSession(id, userId);

      if (!testSession) {
        testSessionControllerLogger.warn('Test session not found', { userId, sessionId: id });
        return sendResponse(res, null, 'error', 'Test session not found', 404);
      }

      testSessionControllerLogger.debug('Test session retrieved successfully', { userId, sessionId: id });
      return sendResponse(res, testSession, 'success', 'Test session retrieved successfully');
    } catch (error) {
      testSessionControllerLogger.error('Failed to get test session', { 
        userId,
        sessionId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to get test session', 500);
    }
  },

  async submitTestResult(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    const { sessionId } = req.params;
    const { cardId, isCorrect, timeSpent, userAnswer } = req.body;
    
    testSessionControllerLogger.info('Submit test result request received', {
      userId,
      sessionId,
      cardId,
      isCorrect,
      timeSpent
    });
    
    try {
      if (!userId) {
        testSessionControllerLogger.warn('Submit test result request without authentication');
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }

      const result = await testSessionService.submitTestResult({
        sessionId,
        cardId,
        isCorrect,
        timeSpent,
        userId,
        userAnswer
      });

      if (!result) {
        testSessionControllerLogger.warn('Test session not found for result submission', { 
          userId, 
          sessionId 
        });
        return sendResponse(res, null, 'error', 'Test session not found', 404);
      }

      testSessionControllerLogger.info('Test result submitted successfully', {
        userId,
        sessionId,
        cardId,
        isCorrect,
        resultId: result.id
      });
      return sendResponse(res, result, 'success', 'Test result submitted successfully');
    } catch (error) {
      testSessionControllerLogger.error('Failed to submit test result', { 
        userId,
        sessionId,
        cardId,
        isCorrect,
        timeSpent,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to submit test result', 500);
    }
  },
}; 