import { Request, Response } from 'express';
import { streakService } from '../services/streak.service';
import { createModuleLogger } from '../utils/logger';
import { sendResponse } from '../utils/response';
import { AuthenticatedRequest } from '@/types/express';

const streakControllerLogger = createModuleLogger('STREAK_CONTROLLER');

export const StreakController = {
  async getStreak(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    streakControllerLogger.debug('Get streak request received', { userId });
    
    try {
      if (!userId) {
        streakControllerLogger.warn('Get streak request without authentication');
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }

      const streak = await streakService.getStreak(userId);
      streakControllerLogger.debug('Streak retrieved successfully', { 
        userId, 
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak
      });
      return sendResponse(res, streak, 'success', 'Streak retrieved successfully');
    } catch (error) {
      streakControllerLogger.error('Failed to get streak', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to get streak', 500);
    }
  },

  async updateStreak(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    streakControllerLogger.info('Update streak request received', { userId });
    
    try {
      if (!userId) {
        streakControllerLogger.warn('Update streak request without authentication');
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }

      const streak = await streakService.updateStreak(userId);
      streakControllerLogger.info('Streak updated successfully', { 
        userId, 
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak
      });
      return sendResponse(res, streak, 'success', 'Streak updated successfully');
    } catch (error) {
      streakControllerLogger.error('Failed to update streak', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to update streak', 500);
    }
  }
}; 