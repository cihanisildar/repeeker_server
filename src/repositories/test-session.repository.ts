import prisma from '../lib/prisma';
import { TestSession, TestResult } from '@prisma/client';

export const testSessionRepository = {
  async create(userId: string): Promise<TestSession> {
    return prisma.testSession.create({
      data: {
        userId,
      },
    });
  },

  async findMany(userId: string): Promise<TestSession[]> {
    return prisma.testSession.findMany({
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

  async findById(id: string, userId: string): Promise<TestSession | null> {
    return prisma.testSession.findFirst({
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

  async createTestResult(data: {
    sessionId: string;
    cardId: string;
    isCorrect: boolean;
    timeSpent: number;
  }): Promise<TestResult> {
    return prisma.testResult.create({
      data,
      include: {
        card: true,
      },
    });
  },
}; 