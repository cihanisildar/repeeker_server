"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.streakService = void 0;
const user_repository_1 = require("../repositories/user.repository");
const error_middleware_1 = require("../middlewares/error.middleware");
exports.streakService = {
    async getStreak(userId) {
        const user = await user_repository_1.userRepository.findById(userId);
        if (!user) {
            throw new error_middleware_1.AppError(404, 'User not found');
        }
        return {
            currentStreak: user.currentStreak,
            longestStreak: user.longestStreak,
            lastReviewDate: user.lastReviewDate
        };
    },
    async updateStreak(userId) {
        const user = await user_repository_1.userRepository.findById(userId);
        if (!user) {
            throw new error_middleware_1.AppError(404, 'User not found');
        }
        const now = new Date();
        const lastReview = user.lastReviewDate;
        let { currentStreak, longestStreak } = user;
        // Check if this is the first review or if the streak is broken
        if (!lastReview || daysBetween(lastReview, now) > 1) {
            currentStreak = 1;
        }
        else if (daysBetween(lastReview, now) === 1) {
            // Increment streak if review is on consecutive day
            currentStreak += 1;
        }
        // If review is on the same day, keep current streak
        // Update longest streak if current streak is longer
        longestStreak = Math.max(currentStreak, longestStreak);
        // Update user streak data
        const updatedUser = await user_repository_1.userRepository.update(userId, {
            currentStreak,
            longestStreak,
            lastReviewDate: now,
            streakUpdatedAt: now
        });
        return {
            currentStreak: updatedUser.currentStreak,
            longestStreak: updatedUser.longestStreak,
            lastReviewDate: updatedUser.lastReviewDate
        };
    }
};
// Helper function to calculate days between two dates
function daysBetween(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000;
    const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
    return Math.round(Math.abs((d1.getTime() - d2.getTime()) / oneDay));
}
