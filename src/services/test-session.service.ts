import { testSessionRepository } from '../repositories/test-session.repository';
import { cardService } from './card.service';
import { createModuleLogger } from '../utils/logger';

const testSessionLogger = createModuleLogger('TESTSESSION');

export const testSessionService = {
  async createTestSession(userId: string) {
    testSessionLogger.info('Creating test session', { userId });
    
    try {
      const session = await testSessionRepository.create(userId);
      testSessionLogger.info('Test session created successfully', { sessionId: session.id, userId });
      return session;
    } catch (error) {
      testSessionLogger.error('Failed to create test session', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async getTestSessions(userId: string) {
    testSessionLogger.debug('Fetching test sessions', { userId });
    
    try {
      const sessions = await testSessionRepository.findMany(userId);
      testSessionLogger.debug('Test sessions fetched successfully', { userId, count: sessions.length });
      return sessions;
    } catch (error) {
      testSessionLogger.error('Failed to fetch test sessions', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async getTestHistory(userId: string) {
    testSessionLogger.debug('Fetching test history', { userId });
    
    try {
      const history = await testSessionRepository.findTestHistory(userId);
      testSessionLogger.debug('Test history fetched successfully', { userId, count: history?.sessions?.length || 'N/A' });
      return history;
    } catch (error) {
      testSessionLogger.error('Failed to fetch test history', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async getTestSession(id: string, userId: string) {
    testSessionLogger.debug('Fetching test session by ID', { sessionId: id, userId });
    
    try {
      const testSession = await testSessionRepository.findById(id, userId);

      if (!testSession) {
        testSessionLogger.warn('Test session not found', { sessionId: id, userId });
        throw new Error('Test session not found');
      }

      testSessionLogger.debug('Test session found', { sessionId: id, userId });
      return testSession;
    } catch (error) {
      testSessionLogger.error('Failed to fetch test session', { 
        sessionId: id,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async submitTestResult(data: {
    sessionId: string;
    cardId: string;
    isCorrect: boolean;
    timeSpent: number;
    userId: string;
  }) {
    testSessionLogger.info('Submitting test result', {
      sessionId: data.sessionId,
      cardId: data.cardId,
      isCorrect: data.isCorrect,
      timeSpent: data.timeSpent,
      userId: data.userId
    });

    try {
      const testSession = await testSessionRepository.findById(data.sessionId, data.userId);

      if (!testSession) {
        testSessionLogger.warn('Test session not found for result submission', { 
          sessionId: data.sessionId, 
          userId: data.userId 
        });
        throw new Error('Test session not found');
      }

      const [testResult] = await Promise.all([
        testSessionRepository.createTestResult({
          sessionId: data.sessionId,
          cardId: data.cardId,
          isCorrect: data.isCorrect,
          timeSpent: data.timeSpent,
        }),
        cardService.updateCardProgress(data.userId, data.cardId, data.isCorrect),
      ]);

      testSessionLogger.info('Test result submitted successfully', { 
        sessionId: data.sessionId,
        cardId: data.cardId,
        userId: data.userId,
        isCorrect: data.isCorrect
      });

      return testResult;
    } catch (error) {
      testSessionLogger.error('Failed to submit test result', { 
        sessionId: data.sessionId,
        cardId: data.cardId,
        userId: data.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },
}; 