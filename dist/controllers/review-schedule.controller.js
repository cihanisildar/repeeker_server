"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewScheduleController = void 0;
const review_schedule_service_1 = require("../services/review-schedule.service");
const logger_1 = require("../utils/logger");
const response_1 = require("../utils/response");
exports.ReviewScheduleController = {
    async getSchedule(req, res) {
        try {
            if (!req.user) {
                return (0, response_1.sendResponse)(res, null, 'error', 'Not authenticated', 401);
            }
            const result = await review_schedule_service_1.reviewScheduleService.getSchedule(req.user.id);
            return (0, response_1.sendResponse)(res, result, 'success', 'Schedule retrieved successfully');
        }
        catch (error) {
            logger_1.logger.error('Get schedule error:', error);
            return (0, response_1.sendResponse)(res, null, 'error', error instanceof Error ? error.message : 'Failed to get schedule', 500);
        }
    },
    async upsertSchedule(req, res) {
        try {
            if (!req.user) {
                return (0, response_1.sendResponse)(res, null, 'error', 'Not authenticated', 401);
            }
            const { intervals, name, description } = req.body;
            const result = await review_schedule_service_1.reviewScheduleService.upsertSchedule(req.user.id, { intervals, name, description });
            return (0, response_1.sendResponse)(res, result, 'success', 'Schedule updated successfully');
        }
        catch (error) {
            logger_1.logger.error('Upsert schedule error:', error);
            return (0, response_1.sendResponse)(res, null, 'error', error instanceof Error ? error.message : 'Failed to update schedule', 500);
        }
    }
};
