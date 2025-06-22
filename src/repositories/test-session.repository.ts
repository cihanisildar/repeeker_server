import prisma from '../lib/prisma';
import { TestSession, TestResult } from '@prisma/client';
import { createModuleLogger } from '../utils/logger';

const testSessionRepositoryLogger = createModuleLogger('TestSessionRepository');

export const testSessionRepository = {
  async create(userId: string): Promise<TestSession> {
    testSessionRepositoryLogger.debug('Creating test session', { userId });
    
    try {
      const testSession = await prisma.testSession.create({
        data: {
          userId,
        },
      });
      
      testSessionRepositoryLogger.info('Successfully created test session', { 
        sessionId: testSession.id, 
        userId 
      });
      
      return testSession;
    } catch (error) {
      testSessionRepositoryLogger.error('Failed to create test session', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async findMany(userId: string): Promise<TestSession[]> {
    testSessionRepositoryLogger.debug('Finding test sessions for user', { userId });
    
    try {
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
      
      testSessionRepositoryLogger.debug('Successfully found test sessions', { 
        userId, 
        count: testSessions.length,
        totalResults: testSessions.reduce((sum, session) => sum + session.results.length, 0)
      });
      
      return testSessions;
    } catch (error) {
      testSessionRepositoryLogger.error('Failed to find test sessions', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async findTestHistory(userId: string) {
    testSessionRepositoryLogger.debug('Finding test history for user', { userId });
    
    try {
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

      testSessionRepositoryLogger.debug('Successfully calculated test history', { 
        userId, 
        totalSessions,
        totalTests,
        correctAnswers,
        accuracy: Math.round(accuracy * 100) / 100,
        averageTimeSpent: Math.round(averageTimeSpent * 100) / 100
      });

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
    } catch (error) {
      testSessionRepositoryLogger.error('Failed to find test history', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async findById(id: string, userId: string): Promise<TestSession | null> {
    testSessionRepositoryLogger.debug('Finding test session by ID', { sessionId: id, userId });
    
    try {
      const testSession = await prisma.testSession.findFirst({
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
      
      testSessionRepositoryLogger.debug('Test session lookup result', { 
        sessionId: id, 
        userId,
        found: !!testSession,
        resultsCount: testSession?.results.length || 0
      });
      
      return testSession;
    } catch (error) {
      testSessionRepositoryLogger.error('Failed to find test session by ID', { 
        sessionId: id,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async createTestResult(data: {
    sessionId: string;
    cardId: string;
    isCorrect: boolean;
    timeSpent: number;
  }): Promise<TestResult> {
    testSessionRepositoryLogger.debug('Creating test result', { 
      sessionId: data.sessionId,
      cardId: data.cardId,
      isCorrect: data.isCorrect,
      timeSpent: data.timeSpent
    });
    
    try {
      const testResult = await prisma.testResult.create({
        data,
        include: {
          card: true,
        },
      });
      
      testSessionRepositoryLogger.info('Successfully created test result', { 
        resultId: testResult.id,
        sessionId: data.sessionId,
        cardId: data.cardId,
        isCorrect: data.isCorrect,
        timeSpent: data.timeSpent
      });
      
      return testResult;
    } catch (error) {
      testSessionRepositoryLogger.error('Failed to create test result', { 
        sessionId: data.sessionId,
        cardId: data.cardId,
        isCorrect: data.isCorrect,
        timeSpent: data.timeSpent,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },
}; 