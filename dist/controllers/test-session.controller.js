"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestSessionController = void 0;
const test_session_service_1 = require("../services/test-session.service");
const logger_1 = require("../utils/logger");
const response_1 = require("../utils/response");
exports.TestSessionController = {
    async createTestSession(req, res) {
        try {
            if (!req.user) {
                return (0, response_1.sendResponse)(res, null, 'error', 'Not authenticated', 401);
            }
            const testSession = await test_session_service_1.testSessionService.createTestSession(req.user.id);
            return (0, response_1.sendResponse)(res, testSession, 'success', 'Test session created successfully', 201);
        }
        catch (error) {
            logger_1.logger.error('Create test session error:', error);
            return (0, response_1.sendResponse)(res, null, 'error', error instanceof Error ? error.message : 'Failed to create test session', 500);
        }
    },
    async getTestSessions(req, res) {
        try {
            if (!req.user) {
                return (0, response_1.sendResponse)(res, null, 'error', 'Not authenticated', 401);
            }
            const testSessions = await test_session_service_1.testSessionService.getTestSessions(req.user.id);
            return (0, response_1.sendResponse)(res, testSessions, 'success', 'Test sessions retrieved successfully');
        }
        catch (error) {
            logger_1.logger.error('Get test sessions error:', error);
            return (0, response_1.sendResponse)(res, null, 'error', error instanceof Error ? error.message : 'Failed to get test sessions', 500);
        }
    },
    async getTestSession(req, res) {
        try {
            if (!req.user) {
                return (0, response_1.sendResponse)(res, null, 'error', 'Not authenticated', 401);
            }
            const { id } = req.params;
            const testSession = await test_session_service_1.testSessionService.getTestSession(id, req.user.id);
            if (!testSession) {
                return (0, response_1.sendResponse)(res, null, 'error', 'Test session not found', 404);
            }
            return (0, response_1.sendResponse)(res, testSession, 'success', 'Test session retrieved successfully');
        }
        catch (error) {
            logger_1.logger.error('Get test session error:', error);
            return (0, response_1.sendResponse)(res, null, 'error', error instanceof Error ? error.message : 'Failed to get test session', 500);
        }
    },
    async submitTestResult(req, res) {
        try {
            if (!req.user) {
                return (0, response_1.sendResponse)(res, null, 'error', 'Not authenticated', 401);
            }
            const { sessionId } = req.params;
            const { cardId, isCorrect, timeSpent } = req.body;
            const result = await test_session_service_1.testSessionService.submitTestResult({
                sessionId,
                cardId,
                isCorrect,
                timeSpent,
                userId: req.user.id
            });
            if (!result) {
                return (0, response_1.sendResponse)(res, null, 'error', 'Test session not found', 404);
            }
            return (0, response_1.sendResponse)(res, result, 'success', 'Test result submitted successfully');
        }
        catch (error) {
            logger_1.logger.error('Submit test result error:', error);
            return (0, response_1.sendResponse)(res, null, 'error', error instanceof Error ? error.message : 'Failed to submit test result', 500);
        }
    },
};
