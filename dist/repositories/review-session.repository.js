"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewSessionRepository = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const logger_1 = require("../utils/logger");
exports.reviewSessionRepository = {
    async create(data) {
        try {
            return await prisma_1.default.reviewSession.create({
                data: {
                    userId: data.userId,
                    mode: data.mode,
                    isRepeat: data.isRepeat,
                    cards: data.cards,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Error creating review session:', error);
            throw error;
        }
    },
    async findById(id, userId) {
        try {
            return await prisma_1.default.reviewSession.findFirst({
                where: {
                    id,
                    userId,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Error finding review session:', error);
            throw error;
        }
    },
    async findMany(userId) {
        try {
            return await prisma_1.default.reviewSession.findMany({
                where: {
                    userId,
                },
                orderBy: {
                    startedAt: 'desc',
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Error finding review sessions:', error);
            throw error;
        }
    },
    async complete(id) {
        try {
            return await prisma_1.default.reviewSession.update({
                where: { id },
                data: {
                    completedAt: new Date(),
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Error completing review session:', error);
            throw error;
        }
    },
};
