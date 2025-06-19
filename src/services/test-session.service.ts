import { testSessionRepository } from '../repositories/test-session.repository';
import { cardService } from './card.service';
import { logger } from '../utils/logger';

export const testSessionService = {
  async createTestSession(userId: string) {
    return testSessionRepository.create(userId);
  },

  async getTestSessions(userId: string) {
    return testSessionRepository.findMany(userId);
  },

  async getTestHistory(userId: string) {
    return testSessionRepository.findTestHistory(userId);
  },

  async getTestSession(id: string, userId: string) {
    const testSession = await testSessionRepository.findById(id, userId);

    if (!testSession) {
      throw new Error('Test session not found');
    }

    return testSession;
  },

  async submitTestResult(data: {
    sessionId: string;
    cardId: string;
    isCorrect: boolean;
    timeSpent: number;
    userId: string;
  }) {
    logger.info('Submitting test result:', {
      sessionId: data.sessionId,
      cardId: data.cardId,
      isCorrect: data.isCorrect,
      timeSpent: data.timeSpent,
      userId: data.userId
    });

    const testSession = await testSessionRepository.findById(data.sessionId, data.userId);

    if (!testSession) {
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

    return testResult;
  },
}; 