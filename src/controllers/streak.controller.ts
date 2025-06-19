import { Request, Response } from 'express';
import { streakService } from '../services/streak.service';
import { logger } from '../utils/logger';
import { sendResponse } from '../utils/response';
import { AuthenticatedRequest } from '@/types/express';

export const StreakController = {
  async getStreak(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }

      const streak = await streakService.getStreak(req.user.id);
      return sendResponse(res, streak, 'success', 'Streak retrieved successfully');
    } catch (error) {
      logger.error('Get streak error:', error);
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to get streak', 500);
    }
  },

  async updateStreak(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }

      const streak = await streakService.updateStreak(req.user.id);
      return sendResponse(res, streak, 'success', 'Streak updated successfully');
    } catch (error) {
      logger.error('Update streak error:', error);
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to update streak', 500);
    }
  }
}; 