import prisma from '../lib/prisma';
import { createModuleLogger } from '../utils/logger';

const reviewScheduleRepositoryLogger = createModuleLogger('ReviewScheduleRepository');

export const reviewScheduleRepository = {
  async upsertByUserId(userId: string, data?: { intervals?: number[]; name?: string; description?: string; isDefault?: boolean }) {
    reviewScheduleRepositoryLogger.debug('Upserting review schedule', { 
      userId, 
      intervals: data?.intervals,
      name: data?.name,
      isDefault: data?.isDefault,
      hasDescription: !!data?.description
    });
    
    try {
      const reviewSchedule = await prisma.reviewSchedule.upsert({
        where: { userId },
        update: data || {},
        create: {
          userId,
          intervals: data?.intervals || [1, 2, 7, 30, 365],
          name: data?.name || 'Default Schedule',
          description: data?.description || 'Default spaced repetition schedule',
          isDefault: data?.isDefault ?? true
        }
      });
      
      reviewScheduleRepositoryLogger.info('Successfully upserted review schedule', { 
        scheduleId: reviewSchedule.id,
        userId, 
        name: reviewSchedule.name,
        intervals: reviewSchedule.intervals,
        isDefault: reviewSchedule.isDefault
      });
      
      return reviewSchedule;
    } catch (error) {
      reviewScheduleRepositoryLogger.error('Failed to upsert review schedule', { 
        userId,
        data,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async getByUserId(userId: string) {
    reviewScheduleRepositoryLogger.debug('Getting review schedule by user ID', { userId });
    
    try {
      const reviewSchedule = await prisma.reviewSchedule.findUnique({
        where: { userId }
      });
      
      reviewScheduleRepositoryLogger.debug('Review schedule lookup result', { 
        userId,
        found: !!reviewSchedule,
        name: reviewSchedule?.name,
        intervals: reviewSchedule?.intervals,
        isDefault: reviewSchedule?.isDefault
      });
      
      return reviewSchedule;
    } catch (error) {
      reviewScheduleRepositoryLogger.error('Failed to get review schedule by user ID', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}; 