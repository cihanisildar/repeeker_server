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

  async findTestHistory(userId: string) {
    const testSessions = await prisma.testSession.findMany({
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

    // Calculate aggregated statistics
    const totalSessions = testSessions.length;
    const totalTests = testSessions.reduce((sum, session) => sum + session.results.length, 0);
    const correctAnswers = testSessions.reduce((sum, session) => 
      sum + session.results.filter(result => result.isCorrect).length, 0
    );
    const accuracy = totalTests > 0 ? (correctAnswers / totalTests) * 100 : 0;
    const averageTimeSpent = totalTests > 0 
      ? testSessions.reduce((sum, session) => 
          sum + session.results.reduce((sessionSum, result) => sessionSum + result.timeSpent, 0), 0
        ) / totalTests 
      : 0;

    return {
      sessions: testSessions,
      statistics: {
        totalSessions,
        totalTests,
        correctAnswers,
        accuracy: Math.round(accuracy * 100) / 100, // Round to 2 decimal places
        averageTimeSpent: Math.round(averageTimeSpent * 100) / 100,
      },
    };
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