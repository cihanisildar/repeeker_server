"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wordListRepository = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
exports.wordListRepository = {
    async create(data) {
        return prisma_1.default.wordList.create({
            data,
        });
    },
    async findMany(userId) {
        return prisma_1.default.wordList.findMany({
            where: {
                OR: [
                    { userId },
                    { isPublic: true },
                ],
            },
            include: {
                _count: {
                    select: { cards: true },
                },
            },
        });
    },
    async findById(id, userId) {
        return prisma_1.default.wordList.findFirst({
            where: {
                id,
                OR: [
                    { userId },
                    { isPublic: true },
                ],
            },
            include: {
                cards: true,
            },
        });
    },
    async update(id, userId, data) {
        const wordList = await prisma_1.default.wordList.findFirst({
            where: {
                id,
                userId,
            },
        });
        if (!wordList) {
            return null;
        }
        return prisma_1.default.wordList.update({
            where: { id },
            data,
        });
    },
    async delete(id, userId) {
        const wordList = await prisma_1.default.wordList.findFirst({
            where: {
                id,
                userId,
            },
        });
        if (!wordList) {
            return false;
        }
        await prisma_1.default.wordList.delete({
            where: { id },
        });
        return true;
    },
};
