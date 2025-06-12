import { Request, Response } from 'express';
import { reviewScheduleService } from '../services/review-schedule.service';
import { logger } from '../utils/logger';
import { sendResponse } from '../utils/response';

export const ReviewScheduleController = {
  async getSchedule(req: Request, res: Response) {
    try {
      if (!req.user) {
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }
      const result = await reviewScheduleService.getSchedule(req.user.id);
      return sendResponse(res, result, 'success', 'Schedule retrieved successfully');
    } catch (error) {
      logger.error('Get schedule error:', error);
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to get schedule', 500);
    }
  },

  async upsertSchedule(req: Request, res: Response) {
    try {
      if (!req.user) {
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }
      const { intervals, name, description } = req.body;
      const result = await reviewScheduleService.upsertSchedule(req.user.id, { intervals, name, description });
      return sendResponse(res, result, 'success', 'Schedule updated successfully');
    } catch (error) {
      logger.error('Upsert schedule error:', error);
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to update schedule', 500);
    }
  }
}; 