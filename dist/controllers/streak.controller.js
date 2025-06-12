"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreakController = void 0;
const streak_service_1 = require("../services/streak.service");
const logger_1 = require("../utils/logger");
const response_1 = require("../utils/response");
exports.StreakController = {
    async getStreak(req, res) {
        try {
            if (!req.user) {
                return (0, response_1.sendResponse)(res, null, 'error', 'Not authenticated', 401);
            }
            const streak = await streak_service_1.streakService.getStreak(req.user.id);
            return (0, response_1.sendResponse)(res, streak, 'success', 'Streak retrieved successfully');
        }
        catch (error) {
            logger_1.logger.error('Get streak error:', error);
            return (0, response_1.sendResponse)(res, null, 'error', error instanceof Error ? error.message : 'Failed to get streak', 500);
        }
    },
    async updateStreak(req, res) {
        try {
            if (!req.user) {
                return (0, response_1.sendResponse)(res, null, 'error', 'Not authenticated', 401);
            }
            const streak = await streak_service_1.streakService.updateStreak(req.user.id);
            return (0, response_1.sendResponse)(res, streak, 'success', 'Streak updated successfully');
        }
        catch (error) {
            logger_1.logger.error('Update streak error:', error);
            return (0, response_1.sendResponse)(res, null, 'error', error instanceof Error ? error.message : 'Failed to update streak', 500);
        }
    }
};
