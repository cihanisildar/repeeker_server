import { reviewSessionRepository } from '../repositories/review-session.repository';
import { logger } from '../utils/logger';

interface CreateReviewSessionData {
  userId: string;
  mode: string;
  isRepeat: boolean;
  cards: any[];
}

export const reviewSessionService = {
  async createReviewSession(data: CreateReviewSessionData) {
    return reviewSessionRepository.create(data);
  },

  async completeReviewSession(sessionId: string, userId: string) {
    const reviewSession = await reviewSessionRepository.findById(sessionId, userId);

    if (!reviewSession) {
      throw new Error('Review session not found');
    }

    return reviewSessionRepository.complete(sessionId);
  },

  async getReviewSessions(userId: string) {
    return reviewSessionRepository.findMany(userId);
  },
}; 