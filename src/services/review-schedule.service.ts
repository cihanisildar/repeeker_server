import { reviewScheduleRepository } from '../repositories/review-schedule.repository';

export const reviewScheduleService = {
  async getSchedule(userId: string) {
    return reviewScheduleRepository.getByUserId(userId);
  },

  async upsertSchedule(userId: string, data: { intervals?: number[]; name?: string; description?: string; isDefault?: boolean }) {
    return reviewScheduleRepository.upsertByUserId(userId, data);
  }
}; 