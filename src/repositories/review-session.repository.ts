import prisma from '../lib/prisma';
import { logger } from '../utils/logger';

interface CreateReviewSessionData {
  userId: string;
  mode: string;
  isRepeat: boolean;
  cards: any[];
}

export const reviewSessionRepository = {
  async create(data: CreateReviewSessionData) {
    try {
      return await prisma.reviewSession.create({
        data: {
          userId: data.userId,
          mode: data.mode,
          isRepeat: data.isRepeat,
          cards: data.cards,
        },
      });
    } catch (error) {
      logger.error('Error creating review session:', error);
      throw error;
    }
  },

  async findById(id: string, userId: string) {
    try {
      return await prisma.reviewSession.findFirst({
        where: {
          id,
          userId,
        },
      });
    } catch (error) {
      logger.error('Error finding review session:', error);
      throw error;
    }
  },

  async findMany(userId: string) {
    try {
      return await prisma.reviewSession.findMany({
        where: {
          userId,
        },
        orderBy: {
          startedAt: 'desc',
        },
      });
    } catch (error) {
      logger.error('Error finding review sessions:', error);
      throw error;
    }
  },

  async complete(id: string) {
    try {
      return await prisma.reviewSession.update({
        where: { id },
        data: {
          completedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('Error completing review session:', error);
      throw error;
    }
  },
}; 