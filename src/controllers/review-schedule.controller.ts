import { Request, Response } from 'express';
import { reviewScheduleService } from '../services/review-schedule.service';
import { createModuleLogger } from '../utils/logger';
import { sendResponse } from '../utils/response';
import { AuthenticatedRequest } from '@/types/express';

const reviewScheduleControllerLogger = createModuleLogger('REVIEWSCHEDULE_CONTROLLER');

export const ReviewScheduleController = {
  async getSchedule(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    reviewScheduleControllerLogger.debug('Get review schedule request received', { userId });
    
    try {
      if (!userId) {
        reviewScheduleControllerLogger.warn('Get review schedule request without authentication');
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }
      
      const result = await reviewScheduleService.getSchedule(userId);
      reviewScheduleControllerLogger.debug('Review schedule retrieved successfully', { 
        userId, 
        hasSchedule: !!result,
        scheduleId: result?.id
      });
      return sendResponse(res, result, 'success', 'Schedule retrieved successfully');
    } catch (error) {
      reviewScheduleControllerLogger.error('Failed to get review schedule', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to get schedule', 500);
    }
  },

  async upsertSchedule(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    const { intervals, name, description } = req.body;
    reviewScheduleControllerLogger.info('Upsert review schedule request received', { 
      userId, 
      hasIntervals: !!intervals,
      intervalCount: intervals?.length,
      name
    });
    
    try {
      if (!userId) {
        reviewScheduleControllerLogger.warn('Upsert review schedule request without authentication');
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }
      
      const result = await reviewScheduleService.upsertSchedule(userId, { intervals, name, description });
      reviewScheduleControllerLogger.info('Review schedule upserted successfully', { 
        userId, 
        scheduleId: result.id,
        isDefault: result.isDefault
      });
      return sendResponse(res, result, 'success', 'Schedule updated successfully');
    } catch (error) {
      reviewScheduleControllerLogger.error('Failed to upsert review schedule', { 
        userId,
        intervals,
        name,
        description,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to update schedule', 500);
    }
  }
}; 