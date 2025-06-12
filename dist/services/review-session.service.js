"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewSessionService = void 0;
const review_session_repository_1 = require("../repositories/review-session.repository");
exports.reviewSessionService = {
    async createReviewSession(data) {
        return review_session_repository_1.reviewSessionRepository.create(data);
    },
    async completeReviewSession(sessionId, userId) {
        const reviewSession = await review_session_repository_1.reviewSessionRepository.findById(sessionId, userId);
        if (!reviewSession) {
            throw new Error('Review session not found');
        }
        return review_session_repository_1.reviewSessionRepository.complete(sessionId);
    },
    async getReviewSessions(userId) {
        return review_session_repository_1.reviewSessionRepository.findMany(userId);
    },
};
