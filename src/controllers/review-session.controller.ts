import { Request, Response } from 'express';
import { reviewSessionService } from '../services/review-session.service';
import { createModuleLogger } from '../utils/logger';
import { sendResponse } from '../utils/response';
import { AuthenticatedRequest } from '@/types/express';

const reviewSessionControllerLogger = createModuleLogger('REVIEWSESSION_CONTROLLER');

export const ReviewSessionController = {
  async createReviewSession(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    const { cardIds } = req.body;
    reviewSessionControllerLogger.info('Create review session request received', { 
      userId, 
      cardCount: cardIds?.length 
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

      const reviewSession = await reviewSessionService.createReviewSession({
        userId,
        mode: 'review', // Default mode
        isRepeat: false,
        cards: cardIds,
      });

      reviewSessionControllerLogger.info('Review session created successfully', { 
        userId, 
        sessionId: reviewSession.id,
        cardCount: cardIds.length
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

  async completeReviewSession(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    const { sessionId } = req.body;
    reviewSessionControllerLogger.info('Complete review session request received', { 
      userId, 
      sessionId 
    });
    
    try {
      if (!userId) {
        reviewSessionControllerLogger.warn('Complete review session request without authentication');
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }

      const reviewSession = await reviewSessionService.completeReviewSession(sessionId, userId);

      if (!reviewSession) {
        reviewSessionControllerLogger.warn('Review session not found for completion', { 
          userId, 
          sessionId 
        });
        return sendResponse(res, null, 'error', 'Review session not found', 404);
      }

      reviewSessionControllerLogger.info('Review session completed successfully', { 
        userId, 
        sessionId 
      });
      return sendResponse(res, reviewSession, 'success', 'Review session completed successfully');
    } catch (error) {
      reviewSessionControllerLogger.error('Failed to complete review session', { 
        userId,
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to complete review session', 500);
    }
  },

  async getReviewSessions(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    reviewSessionControllerLogger.debug('Get review sessions request received', { userId });
    
    try {
      if (!userId) {
        reviewSessionControllerLogger.warn('Get review sessions request without authentication');
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }

      const reviewSessions = await reviewSessionService.getReviewSessions(userId);
      reviewSessionControllerLogger.debug('Review sessions retrieved successfully', { 
        userId, 
        count: reviewSessions.length 
      });
      return sendResponse(res, reviewSessions, 'success', 'Review sessions retrieved successfully');
    } catch (error) {
      reviewSessionControllerLogger.error('Failed to get review sessions', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to get review sessions', 500);
    }
  },
}; 