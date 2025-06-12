"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testSessionService = void 0;
const test_session_repository_1 = require("../repositories/test-session.repository");
const card_service_1 = require("./card.service");
exports.testSessionService = {
    async createTestSession(userId) {
        return test_session_repository_1.testSessionRepository.create(userId);
    },
    async getTestSessions(userId) {
        return test_session_repository_1.testSessionRepository.findMany(userId);
    },
    async getTestSession(id, userId) {
        const testSession = await test_session_repository_1.testSessionRepository.findById(id, userId);
        if (!testSession) {
            throw new Error('Test session not found');
        }
        return testSession;
    },
    async submitTestResult(data) {
        const testSession = await test_session_repository_1.testSessionRepository.findById(data.sessionId, data.userId);
        if (!testSession) {
            throw new Error('Test session not found');
        }
        const [testResult] = await Promise.all([
            test_session_repository_1.testSessionRepository.createTestResult({
                sessionId: data.sessionId,
                cardId: data.cardId,
                isCorrect: data.isCorrect,
                timeSpent: data.timeSpent,
            }),
            card_service_1.cardService.updateCardProgress(data.userId, data.cardId, data.isCorrect),
        ]);
        return testResult;
    },
};
