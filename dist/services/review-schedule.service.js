"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewScheduleService = void 0;
const review_schedule_repository_1 = require("../repositories/review-schedule.repository");
exports.reviewScheduleService = {
    async getSchedule(userId) {
        return review_schedule_repository_1.reviewScheduleRepository.getByUserId(userId);
    },
    async upsertSchedule(userId, data) {
        return review_schedule_repository_1.reviewScheduleRepository.upsertByUserId(userId, data);
    }
};
