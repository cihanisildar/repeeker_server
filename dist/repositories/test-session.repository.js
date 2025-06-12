"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testSessionRepository = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
exports.testSessionRepository = {
    async create(userId) {
        return prisma_1.default.testSession.create({
            data: {
                userId,
            },
        });
    },
    async findMany(userId) {
        return prisma_1.default.testSession.findMany({
            where: {
                userId,
            },
            include: {
                results: {
                    include: {
                        card: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    },
    async findById(id, userId) {
        return prisma_1.default.testSession.findFirst({
            where: {
                id,
                userId,
            },
            include: {
                results: {
                    include: {
                        card: true,
                    },
                },
            },
        });
    },
    async createTestResult(data) {
        return prisma_1.default.testResult.create({
            data,
            include: {
                card: true,
            },
        });
    },
};
