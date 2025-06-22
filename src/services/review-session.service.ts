import { reviewSessionRepository } from '../repositories/review-session.repository';
import { createModuleLogger } from '../utils/logger';

const reviewSessionLogger = createModuleLogger('REVIEWSESSION');

interface CreateReviewSessionData {
  userId: string;
  mode: string;
  isRepeat: boolean;
  cards: any[];
}

export const reviewSessionService = {
  async createReviewSession(data: CreateReviewSessionData) {
    reviewSessionLogger.info('Creating review session', { 
      userId: data.userId, 
      mode: data.mode, 
      isRepeat: data.isRepeat,
      cardCount: data.cards.length
    });
    
    try {
      const session = await reviewSessionRepository.create(data);
      reviewSessionLogger.info('Review session created successfully', { 
        sessionId: session.id, 
        userId: data.userId 
      });
      return session;
    } catch (error) {
      reviewSessionLogger.error('Failed to create review session', { 
        userId: data.userId,
        mode: data.mode,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async completeReviewSession(sessionId: string, userId: string) {
    reviewSessionLogger.info('Completing review session', { sessionId, userId });
    
    try {
      const reviewSession = await reviewSessionRepository.findById(sessionId, userId);

      if (!reviewSession) {
        reviewSessionLogger.warn('Review session not found for completion', { sessionId, userId });
        throw new Error('Review session not found');
      }

      const result = await reviewSessionRepository.complete(sessionId);
      reviewSessionLogger.info('Review session completed successfully', { sessionId, userId });
      return result;
    } catch (error) {
      reviewSessionLogger.error('Failed to complete review session', { 
        sessionId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async getReviewSessions(userId: string) {
    reviewSessionLogger.debug('Fetching review sessions', { userId });
    
    try {
      const sessions = await reviewSessionRepository.findMany(userId);
      reviewSessionLogger.debug('Review sessions fetched successfully', { 
        userId, 
        count: sessions.length 
      });
      return sessions;
    } catch (error) {
      reviewSessionLogger.error('Failed to fetch review sessions', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },
}; 