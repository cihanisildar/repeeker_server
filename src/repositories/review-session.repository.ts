import prisma from '../lib/prisma';
import { createModuleLogger } from '../utils/logger';

const reviewSessionRepositoryLogger = createModuleLogger('ReviewSessionRepository');

interface CreateReviewSessionData {
  userId: string;
  mode: string;
  isRepeat: boolean;
  cards: any[];
}

export const reviewSessionRepository = {
  async create(data: CreateReviewSessionData) {
    reviewSessionRepositoryLogger.debug('Creating review session', { 
      userId: data.userId,
      mode: data.mode,
      isRepeat: data.isRepeat,
      cardsCount: data.cards.length
    });
    
    try {
      const reviewSession = await prisma.reviewSession.create({
        data: {
          userId: data.userId,
          mode: data.mode,
          isRepeat: data.isRepeat,
          cards: data.cards,
        },
      });
      
      reviewSessionRepositoryLogger.info('Successfully created review session', { 
        sessionId: reviewSession.id,
        userId: data.userId,
        mode: data.mode,
        isRepeat: data.isRepeat,
        cardsCount: data.cards.length
      });
      
      return reviewSession;
    } catch (error) {
      reviewSessionRepositoryLogger.error('Failed to create review session', { 
        userId: data.userId,
        mode: data.mode,
        isRepeat: data.isRepeat,
        cardsCount: data.cards.length,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async findById(id: string, userId: string) {
    reviewSessionRepositoryLogger.debug('Finding review session by ID', { sessionId: id, userId });
    
    try {
      const reviewSession = await prisma.reviewSession.findFirst({
        where: {
          id,
          userId,
        },
      });
      
      reviewSessionRepositoryLogger.debug('Review session lookup result', { 
        sessionId: id,
        userId,
        found: !!reviewSession
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

  async findMany(userId: string) {
    reviewSessionRepositoryLogger.debug('Finding review sessions for user', { userId });
    
    try {
      const reviewSessions = await prisma.reviewSession.findMany({
        where: {
          userId,
        },
        orderBy: {
          startedAt: 'desc',
        },
      });
      
      reviewSessionRepositoryLogger.debug('Successfully found review sessions', { 
        userId,
        count: reviewSessions.length
      });
      
      return reviewSessions;
    } catch (error) {
      reviewSessionRepositoryLogger.error('Failed to find review sessions', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async complete(id: string) {
    reviewSessionRepositoryLogger.debug('Completing review session', { sessionId: id });
    
    try {
      const reviewSession = await prisma.reviewSession.update({
        where: { id },
        data: {
          completedAt: new Date(),
        },
      });
      
      reviewSessionRepositoryLogger.info('Successfully completed review session', { 
        sessionId: id,
        completedAt: reviewSession.completedAt
      });
      
      return reviewSession;
    } catch (error) {
      reviewSessionRepositoryLogger.error('Failed to complete review session', { 
        sessionId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },
}; 