import prisma from '../lib/prisma';
import { createModuleLogger } from '../utils/logger';

const reviewSessionRepositoryLogger = createModuleLogger('ReviewSessionRepository');

interface CreateReviewSessionData {
  userId: string;
  mode: string;
  isRepeat: boolean;
  cards: any[];
  maxCards?: number;
  sessionType?: 'daily' | 'custom' | 'failed_cards';
}

interface SessionResults {
  cardsReviewed: number;
  correctAnswers: number;
  timeSpent: number; // in seconds
}

export const reviewSessionRepository = {
  async create(data: CreateReviewSessionData) {
    reviewSessionRepositoryLogger.debug('Creating review session', { 
      userId: data.userId,
      mode: data.mode,
      isRepeat: data.isRepeat,
      cardsCount: data.cards.length,
      maxCards: data.maxCards,
      sessionType: data.sessionType
    });
    
    try {
      // Validate input data
      if (!data.userId) {
        throw new Error('userId is required');
      }
      
      if (!data.mode || (data.mode !== 'flashcard' && data.mode !== 'multiple-choice')) {
        throw new Error('mode must be either "flashcard" or "multiple-choice"');
      }
      
      if (!Array.isArray(data.cards)) {
        throw new Error('cards must be an array');
      }
      
      if (data.cards.length === 0) {
        throw new Error('cards array cannot be empty');
      }
      
      // Apply card limit if specified
      const sessionCards = data.maxCards && data.maxCards > 0 
        ? data.cards.slice(0, data.maxCards)
        : data.cards;
      
      const reviewSession = await prisma.reviewSession.create({
        data: {
          userId: data.userId,
          mode: data.mode,
          isRepeat: data.isRepeat,
          cards: sessionCards,
        },
      });
      
      reviewSessionRepositoryLogger.info('Successfully created review session', { 
        sessionId: reviewSession.id,
        userId: data.userId,
        mode: data.mode,
        isRepeat: data.isRepeat,
        originalCardsCount: data.cards.length,
        sessionCardsCount: sessionCards.length,
        sessionType: data.sessionType
      });
      
      return reviewSession;
    } catch (error) {
      reviewSessionRepositoryLogger.error('Failed to create review session', { 
        userId: data.userId,
        mode: data.mode,
        isRepeat: data.isRepeat,
        cardsCount: data.cards?.length,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async findById(id: string, userId: string) {
    reviewSessionRepositoryLogger.debug('Finding review session by ID', { sessionId: id, userId });
    
    try {
      // Validate input
      if (!id || !userId) {
        throw new Error('sessionId and userId are required');
      }
      
      const reviewSession = await prisma.reviewSession.findFirst({
        where: {
          id,
          userId,
        },
      });
      
      reviewSessionRepositoryLogger.debug('Review session lookup result', { 
        sessionId: id,
        userId,
        found: !!reviewSession,
        isCompleted: !!reviewSession?.completedAt
      });
      
      return reviewSession;
    } catch (error) {
      reviewSessionRepositoryLogger.error('Failed to find review session by ID', { 
        sessionId: id,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async findMany(userId: string, limit: number = 10) {
    reviewSessionRepositoryLogger.debug('Finding review sessions for user', { userId, limit });
    
    try {
      // Validate input
      if (!userId) {
        throw new Error('userId is required');
      }
      
      if (limit <= 0 || limit > 100) {
        throw new Error('limit must be between 1 and 100');
      }
      
      const reviewSessions = await prisma.reviewSession.findMany({
        where: {
          userId,
        },
        orderBy: {
          startedAt: 'desc',
        },
        take: limit,
      });
      
      // Add calculated fields for better client experience
      const enhancedSessions = reviewSessions.map(session => {
        const sessionCards = Array.isArray(session.cards) ? session.cards : [];
        const duration = session.completedAt 
          ? Math.floor((new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 1000)
          : null;
        
        return {
          ...session,
          cardCount: sessionCards.length,
          duration, // in seconds
          isCompleted: !!session.completedAt
        };
      });
      
      reviewSessionRepositoryLogger.debug('Successfully found review sessions', { 
        userId,
        count: reviewSessions.length,
        limit,
        completedSessions: reviewSessions.filter(s => s.completedAt).length
      });
      
      return enhancedSessions;
    } catch (error) {
      reviewSessionRepositoryLogger.error('Failed to find review sessions', { 
        userId,
        limit,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async complete(id: string, results?: SessionResults) {
    reviewSessionRepositoryLogger.debug('Completing review session', { sessionId: id, results });
    
    try {
      // Validate input
      if (!id) {
        throw new Error('sessionId is required');
      }
      
      // Check if session exists and is not already completed
      const existingSession = await prisma.reviewSession.findUnique({
        where: { id },
      });
      
      if (!existingSession) {
        throw new Error('Review session not found');
      }
      
      if (existingSession.completedAt) {
        throw new Error('Review session is already completed');
      }
      
      // Validate results if provided
      if (results) {
        if (results.cardsReviewed < 0 || results.correctAnswers < 0 || results.timeSpent < 0) {
          throw new Error('All result values must be non-negative');
        }
        
        if (results.correctAnswers > results.cardsReviewed) {
          throw new Error('correctAnswers cannot be greater than cardsReviewed');
        }
      }
      
      const now = new Date();
      const sessionDuration = Math.floor((now.getTime() - new Date(existingSession.startedAt).getTime()) / 1000);
      
      const reviewSession = await prisma.reviewSession.update({
        where: { id },
        data: {
          completedAt: now,
        },
      });
      
      // Calculate completion stats
      const sessionCards = Array.isArray(existingSession.cards) ? existingSession.cards : [];
      const completionStats = {
        sessionDuration,
        cardCount: sessionCards.length,
        completionRate: results ? (results.cardsReviewed / sessionCards.length * 100) : null,
        accuracy: results && results.cardsReviewed > 0 
          ? (results.correctAnswers / results.cardsReviewed * 100) 
          : null
      };
      
      reviewSessionRepositoryLogger.info('Successfully completed review session', { 
        sessionId: id,
        completedAt: reviewSession.completedAt,
        stats: completionStats,
        providedResults: !!results
      });
      
      return {
        ...reviewSession,
        stats: completionStats
      };
    } catch (error) {
      reviewSessionRepositoryLogger.error('Failed to complete review session', { 
        sessionId: id,
        results,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async getSessionStats(userId: string, days: number = 30) {
    reviewSessionRepositoryLogger.debug('Getting session statistics', { userId, days });
    
    try {
      if (!userId) {
        throw new Error('userId is required');
      }
      
      if (days <= 0 || days > 365) {
        throw new Error('days must be between 1 and 365');
      }
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const sessions = await prisma.reviewSession.findMany({
        where: {
          userId,
          startedAt: {
            gte: startDate
          }
        },
        orderBy: {
          startedAt: 'desc'
        }
      });
      
      // Calculate statistics
      const totalSessions = sessions.length;
      const completedSessions = sessions.filter(s => s.completedAt).length;
      const totalCards = sessions.reduce((sum, session) => {
        const cards = Array.isArray(session.cards) ? session.cards : [];
        return sum + cards.length;
      }, 0);
      
      const completionRate = totalSessions > 0 ? (completedSessions / totalSessions * 100) : 0;
      const averageCardsPerSession = totalSessions > 0 ? Math.round(totalCards / totalSessions) : 0;
      
      // Group by date for trend analysis
      const sessionsByDate = sessions.reduce((acc, session) => {
        const date = new Date(session.startedAt).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(session);
        return acc;
      }, {} as Record<string, typeof sessions>);
      
      const stats = {
        totalSessions,
        completedSessions,
        completionRate: Math.round(completionRate * 100) / 100,
        totalCards,
        averageCardsPerSession,
        sessionsByDate,
        period: {
          days,
          startDate,
          endDate: new Date()
        }
      };
      
      reviewSessionRepositoryLogger.debug('Successfully calculated session statistics', { 
        userId, 
        days,
        stats: {
          totalSessions,
          completedSessions,
          completionRate: stats.completionRate,
          totalCards,
          averageCardsPerSession
        }
      });
      
      return stats;
    } catch (error) {
      reviewSessionRepositoryLogger.error('Failed to get session statistics', { 
        userId,
        days,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}; 