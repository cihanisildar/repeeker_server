import { Request, Response } from 'express';
import { reviewSessionService } from '../services/review-session.service';
import { logger } from '../utils/logger';
import { sendResponse } from '../utils/response';
import { AuthenticatedRequest } from '@/types/express';


export const ReviewSessionController = {
  async createReviewSession(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }

      const { cardIds } = req.body;

      // Validate required fields
      if (!cardIds || !Array.isArray(cardIds)) {
        return sendResponse(res, null, 'error', 'CardIds must be an array', 400);
      }

      const reviewSession = await reviewSessionService.createReviewSession({
        userId: req.user.id,
        mode: 'review', // Default mode
        isRepeat: false,
        cards: cardIds,
      });

      return sendResponse(res, reviewSession, 'success', 'Review session created successfully', 201);
    } catch (error) {
      logger.error('Create review session error:', error);
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to create review session', 500);
    }
  },

  async completeReviewSession(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }

      const { sessionId } = req.body;
      const reviewSession = await reviewSessionService.completeReviewSession(sessionId, req.user.id);

      if (!reviewSession) {
        return sendResponse(res, null, 'error', 'Review session not found', 404);
      }

      return sendResponse(res, reviewSession, 'success', 'Review session completed successfully');
    } catch (error) {
      logger.error('Complete review session error:', error);
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to complete review session', 500);
    }
  },

  async getReviewSessions(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }

      const reviewSessions = await reviewSessionService.getReviewSessions(req.user.id);
      return sendResponse(res, reviewSessions, 'success', 'Review sessions retrieved successfully');
    } catch (error) {
      logger.error('Get review sessions error:', error);
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to get review sessions', 500);
    }
  },
}; 