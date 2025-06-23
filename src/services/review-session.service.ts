import { reviewSessionRepository } from '../repositories/review-session.repository';
import { cardRepository } from '../repositories/card.repository';
import { createModuleLogger } from '../utils/logger';

const reviewSessionLogger = createModuleLogger('REVIEWSESSION');

interface CreateReviewSessionData {
  userId: string;
  mode: string;
  isRepeat: boolean;
  cards: any[];
  maxCards?: number;
  sessionType?: 'daily' | 'custom' | 'failed_cards';
}

interface ReviewSessionConfig {
  maxNewCards: number;
  maxReviews: number; 
  maxDuration: number; // in minutes
  breakInterval: number; // cards between breaks
  prioritizeOverdue: boolean;
}

const DEFAULT_SESSION_CONFIG: ReviewSessionConfig = {
  maxNewCards: 20,
  maxReviews: 50,
  maxDuration: 30,
  breakInterval: 10,
  prioritizeOverdue: true
};

export const reviewSessionService = {
  async createReviewSession(data: CreateReviewSessionData) {
    reviewSessionLogger.info('Creating review session', { 
      userId: data.userId, 
      mode: data.mode, 
      isRepeat: data.isRepeat,
      cardCount: data.cards.length,
      maxCards: data.maxCards,
      sessionType: data.sessionType
    });
    
    try {
      // Validate session data
      if (!data.userId || !data.mode) {
        throw new Error('userId and mode are required for creating review session');
      }

      if (!Array.isArray(data.cards)) {
        throw new Error('cards must be an array');
      }

      // Apply batching if maxCards is specified
      let sessionCards = data.cards;
      if (data.maxCards && data.maxCards > 0) {
        sessionCards = data.cards.slice(0, data.maxCards);
        reviewSessionLogger.info('Applied card limit to session', { 
          originalCount: data.cards.length,
          limitedCount: sessionCards.length,
          maxCards: data.maxCards
        });
      }

      const session = await reviewSessionRepository.create({
        ...data,
        cards: sessionCards
      });
      
      reviewSessionLogger.info('Review session created successfully', { 
        sessionId: session.id, 
        userId: data.userId,
        actualCardCount: sessionCards.length
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

  async createDailyReviewSession(userId: string, config: Partial<ReviewSessionConfig> = {}) {
    const sessionConfig = { ...DEFAULT_SESSION_CONFIG, ...config };
    reviewSessionLogger.info('Creating daily review session', { userId, config: sessionConfig });

    try {
      // Get today's cards with prioritization
      const todayCardsResult = await cardRepository.findTodayCards(userId, sessionConfig.maxReviews);
      
      if (!todayCardsResult?.cards || todayCardsResult.cards.length === 0) {
        reviewSessionLogger.info('No cards available for daily review session', { userId });
        return null;
      }

      // Separate overdue and regular cards
      const now = new Date();
      const overdueCards = todayCardsResult.cards.filter(card => new Date(card.nextReview) < now);
      const regularCards = todayCardsResult.cards.filter(card => new Date(card.nextReview) >= now);

      // Build session cards with prioritization
      let sessionCards = [];
      
      if (sessionConfig.prioritizeOverdue && overdueCards.length > 0) {
        // Add overdue cards first
        sessionCards.push(...overdueCards.slice(0, Math.floor(sessionConfig.maxReviews * 0.7)));
        
        // Fill remaining slots with regular cards
        const remainingSlots = sessionConfig.maxReviews - sessionCards.length;
        if (remainingSlots > 0) {
          sessionCards.push(...regularCards.slice(0, remainingSlots));
        }
      } else {
        // Just take cards in order
        sessionCards = todayCardsResult.cards.slice(0, sessionConfig.maxReviews);
      }

      const session = await this.createReviewSession({
        userId,
        mode: 'flashcard',
        isRepeat: false,
        cards: sessionCards.map(card => ({
          id: card.id,
          word: card.word,
          definition: card.definition,
          isOverdue: new Date(card.nextReview) < now,
          difficulty: card.failureCount / Math.max(1, card.successCount + card.failureCount)
        })),
        sessionType: 'daily'
      });

      reviewSessionLogger.info('Daily review session created', {
        userId,
        sessionId: session.id,
        totalAvailable: todayCardsResult.cards.length,
        overdueCards: overdueCards.length,
        regularCards: regularCards.length,
        sessionCards: sessionCards.length
      });

      return {
        ...session,
        metadata: {
          totalAvailable: todayCardsResult.cards.length,
          overdueCards: overdueCards.length,
          sessionCards: sessionCards.length,
          hasMore: todayCardsResult.hasMore,
          config: sessionConfig
        }
      };
    } catch (error) {
      reviewSessionLogger.error('Failed to create daily review session', {
        userId,
        config: sessionConfig,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async createFailedCardsSession(userId: string, days: number = 7) {
    reviewSessionLogger.info('Creating failed cards review session', { userId, days });

    try {
      // Get cards that have been failed recently
      const failedCards = await cardRepository.findMany(userId);
      
      const recentlyFailedCards = failedCards
        .filter(card => {
          const recentFailures = card.failureCount > 0;
          const hasRecentActivity = card.lastReviewed && 
            (new Date().getTime() - new Date(card.lastReviewed).getTime()) <= (days * 24 * 60 * 60 * 1000);
          const isDifficult = card.failureCount >= card.successCount;
          
          return recentFailures && hasRecentActivity && isDifficult;
        })
        .sort((a, b) => b.failureCount - a.failureCount) // Most failed first
        .slice(0, 25); // Limit to 25 cards

      if (recentlyFailedCards.length === 0) {
        reviewSessionLogger.info('No failed cards found for session', { userId, days });
        return null;
      }

      const session = await this.createReviewSession({
        userId,
        mode: 'flashcard',
        isRepeat: true,
        cards: recentlyFailedCards.map(card => ({
          id: card.id,
          word: card.word,
          definition: card.definition,
          failureCount: card.failureCount,
          successCount: card.successCount
        })),
        sessionType: 'failed_cards'
      });

      reviewSessionLogger.info('Failed cards session created', {
        userId,
        sessionId: session.id,
        failedCardsCount: recentlyFailedCards.length
      });

      return session;
    } catch (error) {
      reviewSessionLogger.error('Failed to create failed cards session', {
        userId,
        days,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async completeReviewSession(sessionId: string, userId: string, results?: {
    cardsReviewed: number;
    correctAnswers: number;
    timeSpent: number; // in seconds
  }) {
    reviewSessionLogger.info('Completing review session', { sessionId, userId, results });
    
    try {
      const reviewSession = await reviewSessionRepository.findById(sessionId, userId);

      if (!reviewSession) {
        reviewSessionLogger.warn('Review session not found for completion', { sessionId, userId });
        throw new Error('Review session not found');
      }

      if (reviewSession.completedAt) {
        reviewSessionLogger.warn('Review session already completed', { sessionId, userId });
        throw new Error('Review session already completed');
      }

      const result = await reviewSessionRepository.complete(sessionId, results);
      
      // Log completion statistics
      if (results) {
        const accuracy = results.cardsReviewed > 0 
          ? Math.round((results.correctAnswers / results.cardsReviewed) * 100) 
          : 0;
        
        reviewSessionLogger.info('Review session completed with stats', { 
          sessionId, 
          userId,
          cardsReviewed: results.cardsReviewed,
          accuracy: `${accuracy}%`,
          timeSpent: `${Math.round(results.timeSpent / 60)}min`
        });
      }
      
      return result;
    } catch (error) {
      reviewSessionLogger.error('Failed to complete review session', { 
        sessionId,
        userId,
        results,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async getReviewSessions(userId: string, limit: number = 10) {
    reviewSessionLogger.debug('Fetching review sessions', { userId, limit });
    
    try {
      // Validate limit
      if (limit <= 0 || limit > 100) {
        throw new Error('Limit must be between 1 and 100');
      }

      const sessions = await reviewSessionRepository.findMany(userId, limit);
      reviewSessionLogger.debug('Review sessions fetched successfully', { 
        userId, 
        count: sessions.length,
        limit
      });
      return sessions;
    } catch (error) {
      reviewSessionLogger.error('Failed to fetch review sessions', { 
        userId,
        limit,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async getSessionProgress(sessionId: string, userId: string) {
    reviewSessionLogger.debug('Getting session progress', { sessionId, userId });

    try {
      const session = await reviewSessionRepository.findById(sessionId, userId);
      
      if (!session) {
        throw new Error('Review session not found');
      }

      const sessionCards = Array.isArray(session.cards) ? session.cards : [];
      const isCompleted = !!session.completedAt;
      
      // Calculate progress metrics
      const progress = {
        sessionId: session.id,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        isCompleted,
        totalCards: sessionCards.length,
        mode: session.mode,
        isRepeat: session.isRepeat
      };

      reviewSessionLogger.debug('Session progress calculated', { 
        sessionId, 
        userId,
        progress
      });

      return progress;
    } catch (error) {
      reviewSessionLogger.error('Failed to get session progress', {
        sessionId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}; 