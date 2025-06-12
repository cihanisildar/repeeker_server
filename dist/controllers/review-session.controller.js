"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewSessionController = void 0;
const review_session_service_1 = require("../services/review-session.service");
const logger_1 = require("../utils/logger");
const response_1 = require("../utils/response");
exports.ReviewSessionController = {
    async createReviewSession(req, res) {
        try {
            if (!req.user) {
                return (0, response_1.sendResponse)(res, null, 'error', 'Not authenticated', 401);
            }
            const { cardIds } = req.body;
            // Validate required fields
            if (!cardIds || !Array.isArray(cardIds)) {
                return (0, response_1.sendResponse)(res, null, 'error', 'CardIds must be an array', 400);
            }
            const reviewSession = await review_session_service_1.reviewSessionService.createReviewSession({
                userId: req.user.id,
                mode: 'review', // Default mode
                isRepeat: false,
                cards: cardIds,
            });
            return (0, response_1.sendResponse)(res, reviewSession, 'success', 'Review session created successfully', 201);
        }
        catch (error) {
            logger_1.logger.error('Create review session error:', error);
            return (0, response_1.sendResponse)(res, null, 'error', error instanceof Error ? error.message : 'Failed to create review session', 500);
        }
    },
    async completeReviewSession(req, res) {
        try {
            if (!req.user) {
                return (0, response_1.sendResponse)(res, null, 'error', 'Not authenticated', 401);
            }
            const { sessionId } = req.body;
            const reviewSession = await review_session_service_1.reviewSessionService.completeReviewSession(sessionId, req.user.id);
            if (!reviewSession) {
                return (0, response_1.sendResponse)(res, null, 'error', 'Review session not found', 404);
            }
            return (0, response_1.sendResponse)(res, reviewSession, 'success', 'Review session completed successfully');
        }
        catch (error) {
            logger_1.logger.error('Complete review session error:', error);
            return (0, response_1.sendResponse)(res, null, 'error', error instanceof Error ? error.message : 'Failed to complete review session', 500);
        }
    },
    async getReviewSessions(req, res) {
        try {
            if (!req.user) {
                return (0, response_1.sendResponse)(res, null, 'error', 'Not authenticated', 401);
            }
            const reviewSessions = await review_session_service_1.reviewSessionService.getReviewSessions(req.user.id);
            return (0, response_1.sendResponse)(res, reviewSessions, 'success', 'Review sessions retrieved successfully');
        }
        catch (error) {
            logger_1.logger.error('Get review sessions error:', error);
            return (0, response_1.sendResponse)(res, null, 'error', error instanceof Error ? error.message : 'Failed to get review sessions', 500);
        }
    },
};
