"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewScheduleRepository = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
exports.reviewScheduleRepository = {
    async upsertByUserId(userId, data) {
        return prisma_1.default.reviewSchedule.upsert({
            where: { userId },
            update: data || {},
            create: {
                userId,
                intervals: data?.intervals || [1, 2, 7, 30, 365],
                name: data?.name || 'Default Schedule',
                description: data?.description || 'Default spaced repetition schedule',
                isDefault: data?.isDefault ?? true
            }
        });
    },
    async getByUserId(userId) {
        return prisma_1.default.reviewSchedule.findUnique({
            where: { userId }
        });
    }
};
