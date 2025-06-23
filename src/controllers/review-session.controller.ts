import { Request, Response } from 'express';
import { reviewSessionService } from '../services/review-session.service';
import { createModuleLogger } from '../utils/logger';
import { sendResponse } from '../utils/response';
import { AuthenticatedRequest } from '@/types/express';
import { validatePagination } from '../utils/validation';

const reviewSessionControllerLogger = createModuleLogger('REVIEWSESSION_CONTROLLER');

export const ReviewSessionController = {
  async createReviewSession(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    const { cardIds, mode = 'flashcard', isRepeat = false, maxCards, sessionType = 'custom' } = req.body;
    reviewSessionControllerLogger.info('Create review session request received', { 
      userId, 
      cardCount: cardIds?.length,
      mode,
      isRepeat,
      maxCards,
      sessionType
    });
    
    try {
      if (!userId) {
        reviewSessionControllerLogger.warn('Create review session request without authentication');
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }

      // Validate required fields
      if (!cardIds || !Array.isArray(cardIds)) {
        reviewSessionControllerLogger.warn('Create review session with invalid cardIds', { 
          userId, 
          cardIds: typeof cardIds
        });
        return sendResponse(res, null, 'error', 'CardIds must be an array', 400);
      }

      if (cardIds.length === 0) {
        reviewSessionControllerLogger.warn('Create review session with empty cardIds', { userId });
        return sendResponse(res, null, 'error', 'CardIds array cannot be empty', 400);
      }

      // Validate maxCards if provided
      if (maxCards !== undefined && (typeof maxCards !== 'number' || maxCards <= 0 || maxCards > 100)) {
        reviewSessionControllerLogger.warn('Invalid maxCards parameter', { userId, maxCards });
        return sendResponse(res, null, 'error', 'maxCards must be a number between 1 and 100', 400);
      }

      const reviewSession = await reviewSessionService.createReviewSession({
        userId,
        mode,
        isRepeat,
        cards: cardIds,
        maxCards,
        sessionType
      });

      reviewSessionControllerLogger.info('Review session created successfully', { 
        userId, 
        sessionId: reviewSession.id,
        originalCardCount: cardIds.length,
        finalCardCount: Array.isArray(reviewSession.cards) ? reviewSession.cards.length : 0
      });
      return sendResponse(res, reviewSession, 'success', 'Review session created successfully', 201);
    } catch (error) {
      reviewSessionControllerLogger.error('Failed to create review session', { 
        userId,
        cardCount: cardIds?.length,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to create review session', 500);
    }
  },

  async createDailyReviewSession(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    const { maxReviews = 50, maxNewCards = 20, prioritizeOverdue = true } = req.body;
    reviewSessionControllerLogger.info('Create daily review session request received', { 
      userId,
      maxReviews,
      maxNewCards,
      prioritizeOverdue
    });
    
    try {
      if (!userId) {
        reviewSessionControllerLogger.warn('Create daily review session request without authentication');
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }

      // Validate parameters
      if (maxReviews && (typeof maxReviews !== 'number' || maxReviews <= 0 || maxReviews > 100)) {
        return sendResponse(res, null, 'error', 'maxReviews must be a number between 1 and 100', 400);
      }

      if (maxNewCards && (typeof maxNewCards !== 'number' || maxNewCards < 0 || maxNewCards > 50)) {
        return sendResponse(res, null, 'error', 'maxNewCards must be a number between 0 and 50', 400);
      }

      const reviewSession = await reviewSessionService.createDailyReviewSession(userId, {
        maxReviews,
        maxNewCards,
        prioritizeOverdue
      });

      if (!reviewSession) {
        reviewSessionControllerLogger.info('No cards available for daily review session', { userId });
        return sendResponse(res, null, 'success', 'No cards available for review today', 200);
      }

      reviewSessionControllerLogger.info('Daily review session created successfully', { 
        userId, 
        sessionId: reviewSession.id,
        metadata: reviewSession.metadata
      });
      return sendResponse(res, reviewSession, 'success', 'Daily review session created successfully', 201);
    } catch (error) {
      reviewSessionControllerLogger.error('Failed to create daily review session', { 
        userId,
        maxReviews,
        maxNewCards,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to create daily review session', 500);
    }
  },

  async createFailedCardsSession(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    const { days = 7 } = req.query;
    reviewSessionControllerLogger.info('Create failed cards session request received', { userId, days });
    
    try {
      if (!userId) {
        reviewSessionControllerLogger.warn('Create failed cards session request without authentication');
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }

      const daysNumber = typeof days === 'string' ? parseInt(days, 10) : (typeof days === 'number' ? days : 7);
      if (isNaN(daysNumber) || daysNumber <= 0 || daysNumber > 30) {
        return sendResponse(res, null, 'error', 'days must be a number between 1 and 30', 400);
      }

      const reviewSession = await reviewSessionService.createFailedCardsSession(userId, daysNumber);

      if (!reviewSession) {
        reviewSessionControllerLogger.info('No failed cards found for session', { userId, days: daysNumber });
        return sendResponse(res, null, 'success', 'No failed cards found for review session', 200);
      }

      reviewSessionControllerLogger.info('Failed cards session created successfully', { 
        userId, 
        sessionId: reviewSession.id,
        days: daysNumber
      });
      return sendResponse(res, reviewSession, 'success', 'Failed cards review session created successfully', 201);
    } catch (error) {
      reviewSessionControllerLogger.error('Failed to create failed cards session', { 
        userId,
        days,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to create failed cards session', 500);
    }
  },

  async completeReviewSession(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    const { sessionId, results } = req.body;
    reviewSessionControllerLogger.info('Complete review session request received', { 
      userId, 
      sessionId,
      hasResults: !!results
    });
    
    try {
      if (!userId) {
        reviewSessionControllerLogger.warn('Complete review session request without authentication');
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }

      if (!sessionId) {
        return sendResponse(res, null, 'error', 'sessionId is required', 400);
      }

      // Validate results if provided
      if (results) {
        const { cardsReviewed, correctAnswers, timeSpent } = results;
        
        if (typeof cardsReviewed !== 'number' || cardsReviewed < 0) {
          return sendResponse(res, null, 'error', 'cardsReviewed must be a non-negative number', 400);
        }
        
        if (typeof correctAnswers !== 'number' || correctAnswers < 0) {
          return sendResponse(res, null, 'error', 'correctAnswers must be a non-negative number', 400);
        }
        
        if (typeof timeSpent !== 'number' || timeSpent < 0) {
          return sendResponse(res, null, 'error', 'timeSpent must be a non-negative number', 400);
        }
        
        if (correctAnswers > cardsReviewed) {
          return sendResponse(res, null, 'error', 'correctAnswers cannot exceed cardsReviewed', 400);
        }
      }

      const reviewSession = await reviewSessionService.completeReviewSession(sessionId, userId, results);

      if (!reviewSession) {
        reviewSessionControllerLogger.warn('Review session not found for completion', { 
          userId, 
          sessionId 
        });
        return sendResponse(res, null, 'error', 'Review session not found', 404);
      }

      reviewSessionControllerLogger.info('Review session completed successfully', { 
        userId, 
        sessionId,
        results
      });
      return sendResponse(res, reviewSession, 'success', 'Review session completed successfully');
    } catch (error) {
      reviewSessionControllerLogger.error('Failed to complete review session', { 
        userId,
        sessionId,
        results,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to complete review session', 500);
    }
  },

  async getReviewSessions(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    const { limit } = req.query;
    reviewSessionControllerLogger.debug('Get review sessions request received', { userId, limit });
    
    try {
      if (!userId) {
        reviewSessionControllerLogger.warn('Get review sessions request without authentication');
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }

      const { limit: validatedLimit } = validatePagination(limit);

      const reviewSessions = await reviewSessionService.getReviewSessions(userId, validatedLimit);
      reviewSessionControllerLogger.debug('Review sessions retrieved successfully', { 
        userId, 
        count: reviewSessions.length,
        limit: validatedLimit
      });
      return sendResponse(res, reviewSessions, 'success', 'Review sessions retrieved successfully');
    } catch (error) {
      reviewSessionControllerLogger.error('Failed to get review sessions', { 
        userId,
        limit,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to get review sessions', 500);
    }
  },

  async getSessionProgress(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    const { sessionId } = req.params;
    reviewSessionControllerLogger.debug('Get session progress request received', { userId, sessionId });
    
    try {
      if (!userId) {
        reviewSessionControllerLogger.warn('Get session progress request without authentication');
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }

      if (!sessionId) {
        return sendResponse(res, null, 'error', 'sessionId is required', 400);
      }

      const progress = await reviewSessionService.getSessionProgress(sessionId, userId);
      
      reviewSessionControllerLogger.debug('Session progress retrieved successfully', { 
        userId, 
        sessionId,
        isCompleted: progress.isCompleted
      });
      return sendResponse(res, progress, 'success', 'Session progress retrieved successfully');
    } catch (error) {
      reviewSessionControllerLogger.error('Failed to get session progress', { 
        userId,
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to get session progress', 500);
    }
  }
}; 