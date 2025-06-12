"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
exports.userRepository = {
    async findByEmail(email) {
        return prisma_1.default.user.findUnique({
            where: { email },
        });
    },
    async create(data) {
        return prisma_1.default.user.create({
            data,
        });
    },
    async findById(id) {
        return prisma_1.default.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                emailVerified: true,
                image: true,
                password: true,
                lastTestDate: true,
                lastReviewDate: true,
                currentStreak: true,
                longestStreak: true,
                streakUpdatedAt: true
            },
        });
    },
    async update(id, data) {
        return prisma_1.default.user.update({
            where: { id },
            data,
        });
    },
    async delete(id) {
        return prisma_1.default.user.delete({
            where: { id },
        });
    },
};
