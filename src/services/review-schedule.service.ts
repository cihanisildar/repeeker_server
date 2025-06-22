import { reviewScheduleRepository } from '../repositories/review-schedule.repository';
import { createModuleLogger } from '../utils/logger';

const reviewScheduleLogger = createModuleLogger('REVIEWSCHEDULE');

export const reviewScheduleService = {
  async getSchedule(userId: string) {
    reviewScheduleLogger.debug('Fetching review schedule', { userId });
    
    try {
      const schedule = await reviewScheduleRepository.getByUserId(userId);
      reviewScheduleLogger.debug('Review schedule fetched successfully', { 
        userId, 
        hasSchedule: !!schedule,
        scheduleId: schedule?.id
      });
      return schedule;
    } catch (error) {
      reviewScheduleLogger.error('Failed to fetch review schedule', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async upsertSchedule(userId: string, data: { intervals?: number[]; name?: string; description?: string; isDefault?: boolean }) {
    reviewScheduleLogger.info('Upserting review schedule', { 
      userId, 
      hasIntervals: !!data.intervals,
      intervalCount: data.intervals?.length,
      name: data.name,
      isDefault: data.isDefault
    });
    
    try {
      const schedule = await reviewScheduleRepository.upsertByUserId(userId, data);
      reviewScheduleLogger.info('Review schedule upserted successfully', { 
        userId, 
        scheduleId: schedule.id,
        isDefault: schedule.isDefault
      });
      return schedule;
    } catch (error) {
      reviewScheduleLogger.error('Failed to upsert review schedule', { 
        userId,
        data,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}; 