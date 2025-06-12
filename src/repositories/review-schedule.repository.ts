import prisma from '../lib/prisma';

export const reviewScheduleRepository = {
  async upsertByUserId(userId: string, data?: { intervals?: number[]; name?: string; description?: string; isDefault?: boolean }) {
    return prisma.reviewSchedule.upsert({
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
  },

  async getByUserId(userId: string) {
    return prisma.reviewSchedule.findUnique({
      where: { userId }
    });
  }
}; 