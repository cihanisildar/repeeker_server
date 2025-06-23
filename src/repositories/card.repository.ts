import prisma from '../lib/prisma';
import { Card, CardProgress } from '@prisma/client';
import { addDays } from 'date-fns';
import { createModuleLogger } from '../utils/logger';
import { calculateSM2, convertToSM2Quality } from '../utils/sm2-algorithm';

const cardRepositoryLogger = createModuleLogger('CardRepository');

export const cardRepository = {
  async create(data: {
    word: string;
    definition: string;
    userId: string;
    wordListId?: string;
    wordDetails?: {
      synonyms: string[];
      antonyms: string[];
      examples: string[];
      notes?: string;
    };
  }): Promise<Card> {
    cardRepositoryLogger.debug('Creating new card', { 
      word: data.word, 
      userId: data.userId, 
      wordListId: data.wordListId,
      hasWordDetails: !!data.wordDetails 
    });
    
    try {
      // Ensure the user has a review schedule (upsert)
      cardRepositoryLogger.debug('Upserting review schedule for user', { userId: data.userId });
      const reviewSchedule = await prisma.reviewSchedule.upsert({
        where: { userId: data.userId },
        update: {},
        create: {
          userId: data.userId,
          intervals: [1, 2, 7, 30, 365],
          name: 'Default Schedule',
          description: 'Default spaced repetition schedule',
          isDefault: true
        }
      });
      
      const intervals = reviewSchedule.intervals || [1, 2, 7, 30, 365];
      const firstInterval = intervals[0] || 1;
      const now = new Date();
      
      cardRepositoryLogger.debug('Creating card with review schedule', { 
        firstInterval, 
        nextReview: addDays(now, firstInterval),
        intervals: intervals.length 
      });
      
      const card = await prisma.card.create({
        data: {
          word: data.word,
          definition: data.definition,
          userId: data.userId,
          wordListId: data.wordListId,
          nextReview: addDays(now, firstInterval),
          reviewStep: 0,
          wordDetails: data.wordDetails ? {
            create: {
              synonyms: data.wordDetails.synonyms,
              antonyms: data.wordDetails.antonyms,
              examples: data.wordDetails.examples,
              notes: data.wordDetails.notes,
            },
          } : undefined,
        },
        include: {
          wordDetails: true,
          user: true,
        },
      });
      
      cardRepositoryLogger.info('Successfully created card', { 
        cardId: card.id, 
        word: card.word, 
        userId: card.userId 
      });
      
      return card;
    } catch (error) {
      cardRepositoryLogger.error('Failed to create card', { 
        word: data.word,
        userId: data.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async findMany(userId: string, wordListId?: string): Promise<Card[]> {
    cardRepositoryLogger.debug('Finding cards for user', { userId, wordListId });
    
    try {
      const cards = await prisma.card.findMany({
        where: {
          userId,
          ...(wordListId ? { wordListId } : {}),
        },
        include: {
          wordDetails: true,
          progress: {
            where: { userId },
          },
          user: true,
        },
      });
      
      cardRepositoryLogger.debug('Successfully found cards', { 
        userId, 
        wordListId, 
        count: cards.length 
      });
      
      return cards;
    } catch (error) {
      cardRepositoryLogger.error('Failed to find cards', { 
        userId,
        wordListId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async findById(id: string, userId: string): Promise<Card | null> {
    cardRepositoryLogger.debug('Finding card by ID', { cardId: id, userId });
    
    try {
      const card = await prisma.card.findFirst({
        where: {
          id,
          userId,
        },
        include: {
          wordDetails: true,
          progress: {
            where: { userId },
          },
          user: true,
        },
      });
      
      cardRepositoryLogger.debug('Card lookup result', { 
        cardId: id, 
        userId,
        found: !!card,
        word: card?.word 
      });
      
      return card;
    } catch (error) {
      cardRepositoryLogger.error('Failed to find card by ID', { 
        cardId: id,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async update(id: string, userId: string, data: {
    word?: string;
    definition?: string;
    wordDetails?: {
      synonyms: string[];
      antonyms: string[];
      examples: string[];
      notes?: string;
    };
  }): Promise<Card | null> {
    cardRepositoryLogger.debug('Updating card', { 
      cardId: id, 
      userId,
      word: data.word,
      hasWordDetails: !!data.wordDetails 
    });
    
    try {
      const card = await prisma.card.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!card) {
        cardRepositoryLogger.warn('Card not found for update', { cardId: id, userId });
        return null;
      }

      const updatedCard = await prisma.card.update({
        where: { id },
        data: {
          word: data.word,
          definition: data.definition,
          wordDetails: data.wordDetails ? {
            upsert: {
              create: {
                synonyms: data.wordDetails.synonyms,
                antonyms: data.wordDetails.antonyms,
                examples: data.wordDetails.examples,
                notes: data.wordDetails.notes,
              },
              update: {
                synonyms: data.wordDetails.synonyms,
                antonyms: data.wordDetails.antonyms,
                examples: data.wordDetails.examples,
                notes: data.wordDetails.notes,
              },
            },
          } : undefined,
        },
        include: {
          wordDetails: true,
          user: true,
        },
      });
      
      cardRepositoryLogger.info('Successfully updated card', { 
        cardId: id, 
        userId,
        word: updatedCard.word 
      });
      
      return updatedCard;
    } catch (error) {
      cardRepositoryLogger.error('Failed to update card', { 
        cardId: id,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async delete(id: string, userId: string): Promise<boolean> {
    cardRepositoryLogger.debug('Deleting card', { cardId: id, userId });
    
    try {
      const card = await prisma.card.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!card) {
        cardRepositoryLogger.warn('Card not found for deletion', { cardId: id, userId });
        return false;
      }

      await prisma.card.delete({
        where: { id },
      });
      
      cardRepositoryLogger.info('Successfully deleted card', { 
        cardId: id, 
        userId,
        word: card.word 
      });

      return true;
    } catch (error) {
      cardRepositoryLogger.error('Failed to delete card', { 
        cardId: id,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async updateProgress(userId: string, cardId: string, isSuccess: boolean): Promise<CardProgress> {
    cardRepositoryLogger.debug('Updating card progress', { userId, cardId, isSuccess });
    
    try {
      const progress = await prisma.cardProgress.upsert({
        where: {
          userId_originalCardId: {
            userId,
            originalCardId: cardId,
          },
        },
        create: {
          userId,
          originalCardId: cardId,
          viewCount: 1,
          successCount: isSuccess ? 1 : 0,
          failureCount: isSuccess ? 0 : 1,
          lastReviewed: new Date(),
        },
        update: {
          viewCount: { increment: 1 },
          successCount: { increment: isSuccess ? 1 : 0 },
          failureCount: { increment: isSuccess ? 0 : 1 },
          lastReviewed: new Date(),
        },
      });
      
      cardRepositoryLogger.debug('Successfully updated card progress', { 
        userId, 
        cardId,
        viewCount: progress.viewCount,
        successCount: progress.successCount,
        failureCount: progress.failureCount
      });
      
      return progress;
    } catch (error) {
      cardRepositoryLogger.error('Failed to update card progress', { 
        userId,
        cardId,
        isSuccess,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async findTodayCards(userId: string, limit?: number) {
    cardRepositoryLogger.debug('Finding today\'s cards for review', { userId, limit });
    
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      // Use database-level filtering for better performance
      const cards = await prisma.card.findMany({
        where: {
          userId,
          reviewStatus: 'ACTIVE',
          nextReview: { lte: endOfDay },
          // Exclude cards already reviewed today using NOT EXISTS pattern
          NOT: {
            reviews: {
              some: {
                createdAt: {
                  gte: startOfDay,
                  lt: endOfDay
                }
              }
            }
          }
        },
        include: {
          wordDetails: true,
          wordList: {
            select: { id: true, name: true }
          },
          user: {
            select: {
              reviewSchedule: {
                select: { intervals: true }
              }
            }
          }
        },
        orderBy: [
          // Prioritize overdue cards
          { nextReview: 'asc' },
          // Then by failure rate (most difficult first)
          { failureCount: 'desc' },
          // Finally by oldest cards
          { createdAt: 'asc' }
        ],
        ...(limit ? { take: limit } : {})
      });

      // Add priority scoring for better client-side sorting if needed
      const cardsWithPriority = cards.map(card => {
        const isOverdue = card.nextReview < now;
        const failureRate = card.failureCount / Math.max(1, card.successCount + card.failureCount);
        const daysSinceCreated = Math.floor((now.getTime() - card.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          ...card,
          priority: {
            isOverdue,
            failureRate,
            daysSinceCreated
          }
        };
      });

      cardRepositoryLogger.debug('Successfully found today\'s cards', { 
        userId, 
        totalCards: cards.length,
        overdueCards: cardsWithPriority.filter(c => c.priority.isOverdue).length,
        limit
      });

      return { 
        cards: cardsWithPriority, 
        total: cardsWithPriority.length,
        hasMore: limit ? cards.length === limit : false
      };
    } catch (error) {
      cardRepositoryLogger.error('Failed to find today\'s cards', { 
        userId,
        limit,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async getStats(userId: string) {
    cardRepositoryLogger.debug('Getting card statistics', { userId });
    
    try {
      const cards = await prisma.card.findMany({
        where: { userId },
        include: { reviews: true }
      });
      
      const totalCards = cards.length;
      const activeCards = cards.filter(c => c.reviewStatus === 'ACTIVE').length;
      const completedCards = cards.filter(c => c.reviewStatus === 'COMPLETED').length;
      const totalReviews = cards.reduce((sum, c) => sum + c.successCount + c.failureCount, 0);
      const totalSuccess = cards.reduce((sum, c) => sum + c.successCount, 0);
      const successRate = totalReviews > 0 ? Math.round((totalSuccess / totalReviews) * 100) : 0;
      const challengingCards = cards.filter(c => c.failureCount > c.successCount && c.reviewStatus === 'ACTIVE').length;
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const reviewsToday = cards.reduce((sum, c) => sum + c.reviews.filter(r => r.createdAt >= startOfDay && r.createdAt < endOfDay).length, 0);
      
      cardRepositoryLogger.debug('Successfully calculated card statistics', { 
        userId, 
        totalCards, 
        activeCards, 
        completedCards,
        successRate,
        challengingCards,
        reviewsToday
      });
      
      return {
        totalCards,
        activeCards,
        completedCards,
        successRate,
        challengingCards,
        reviewsToday,
        totalReviews,
        totalSuccess,
        totalFailures: totalReviews - totalSuccess
      };
    } catch (error) {
      cardRepositoryLogger.error('Failed to get card statistics', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async getUpcomingCards(userId: string, days: number = 7, startDays: number = -14) {
    cardRepositoryLogger.debug('Getting upcoming cards', { 
      userId, 
      days, 
      startDays 
    });
    
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true,
          reviewSchedule: true
        }
      });

      if (!user) {
        cardRepositoryLogger.warn('User not found for upcoming cards', { userId });
        return null;
      }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startDate = new Date(startOfToday);
    startDate.setDate(startDate.getDate() + startDays);
    const endDate = new Date(startOfToday);
    endDate.setDate(startDate.getDate() + days);

    const cards = await prisma.card.findMany({
      where: {
        userId,
        reviewStatus: 'ACTIVE',
      },
      select: {
        id: true,
        word: true,
        definition: true,
        createdAt: true,
        lastReviewed: true,
        nextReview: true,
        reviewStep: true,
        reviewStatus: true,
        failureCount: true,
        wordDetails: true,
        wordList: {
          select: {
            name: true,
            id: true
          }
        },
        reviews: true
      }
    });

    const { isValid, format, addDays } = require('date-fns');
    const intervals = user.reviewSchedule?.intervals || [1, 2, 7, 30, 365];

    type GroupedCard = {
      total: number;
      reviewed: number;
      notReviewed: number;
      fromFailure: number;
      cards: (typeof cards[0] & { isFromFailure: boolean; reviewStep: number; isFutureReview?: boolean })[];
    };

    const groupedCards = cards.reduce((acc: Record<string, GroupedCard>, card) => {
      const baseDate = card.lastReviewed || card.createdAt;
      if (!isValid(new Date(baseDate))) {
        return acc;
      }
      const currentInterval = card.reviewStep >= 0 && card.reviewStep < intervals.length 
        ? intervals[card.reviewStep] 
        : intervals[0];
      const immediateNextReview = addDays(new Date(baseDate), currentInterval);
      if (!isValid(immediateNextReview)) {
        return acc;
      }
      const immediateNextReviewStr = format(immediateNextReview, 'yyyy-MM-dd');
      if (immediateNextReview >= startDate && immediateNextReview < endDate) {
        if (!acc[immediateNextReviewStr]) {
          acc[immediateNextReviewStr] = {
            total: 0,
            reviewed: 0,
            notReviewed: 0,
            fromFailure: 0,
            cards: []
          };
        }
        const hasBeenReviewed = card.reviews.some(review => {
          const reviewDate = new Date(review.createdAt);
          if (!isValid(reviewDate)) {
            return false;
          }
          return format(reviewDate, 'yyyy-MM-dd') === immediateNextReviewStr;
        });
        acc[immediateNextReviewStr].cards.push({
          ...card,
          reviewStep: card.reviewStep,
          isFromFailure: card.failureCount > 0,
          isFutureReview: false
        });
        acc[immediateNextReviewStr].total++;
        if (hasBeenReviewed) {
          acc[immediateNextReviewStr].reviewed++;
        } else {
          acc[immediateNextReviewStr].notReviewed++;
          if (card.failureCount > 0) {
            acc[immediateNextReviewStr].fromFailure++;
          }
        }
      }
      intervals.forEach((interval, step) => {
        if (step > card.reviewStep) {
          const futureReviewDate = addDays(new Date(baseDate), interval);
          if (!isValid(futureReviewDate)) {
            return;
          }
          const futureDateStr = format(futureReviewDate, 'yyyy-MM-dd');
          if (
            futureReviewDate >= startDate &&
            futureReviewDate < endDate &&
            !(acc[futureDateStr]?.cards.some((c: any) => c.id === card.id))
          ) {
            if (!acc[futureDateStr]) {
              acc[futureDateStr] = {
                total: 0,
                reviewed: 0,
                notReviewed: 0,
                fromFailure: 0,
                cards: []
              };
            }
            acc[futureDateStr].cards.push({
              ...card,
              reviewStep: step,
              isFromFailure: false,
              isFutureReview: true
            });
            acc[futureDateStr].total++;
            acc[futureDateStr].notReviewed++;
          }
        }
      });
      return acc;
    }, {} as Record<string, GroupedCard>);

      const result = {
        cards: groupedCards,
        total: Object.values(groupedCards).reduce((sum: number, group: any) => sum + group.total, 0),
        intervals
      };
      
      cardRepositoryLogger.debug('Successfully got upcoming cards', { 
        userId, 
        days, 
        startDays,
        totalCards: result.total,
        dateRanges: Object.keys(groupedCards).length
      });
      
      return result;
    } catch (error) {
      cardRepositoryLogger.error('Failed to get upcoming cards', { 
        userId,
        days,
        startDays,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async addToReview(userId: string, cardIds: string[]) {
    cardRepositoryLogger.debug('Adding cards to review', { 
      userId, 
      cardIds: cardIds.length,
      cardIdsList: cardIds
    });
    
    try {
      const now = new Date();
      const updatedCards = await prisma.card.updateMany({
        where: {
          id: { in: cardIds },
          userId
        },
        data: {
          reviewStatus: 'ACTIVE',
          nextReview: now,
          lastReviewed: null,
          successCount: 0,
          failureCount: 0
        }
      });
      
      const result = {
        updatedCount: updatedCards.count,
        message: `Successfully added ${updatedCards.count} cards to review`
      };
      
      cardRepositoryLogger.info('Successfully added cards to review', { 
        userId,
        requestedCards: cardIds.length,
        updatedCount: updatedCards.count
      });
      
      return result;
    } catch (error) {
      cardRepositoryLogger.error('Failed to add cards to review', { 
        userId,
        cardIds: cardIds.length,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

    async reviewCard(userId: string, cardId: string, isSuccess: boolean, responseQuality?: number) {
    cardRepositoryLogger.debug('Reviewing card', { 
      userId, 
      cardId, 
      isSuccess,
      responseQuality
    });
    
    try {
      const card = await prisma.card.findUnique({
        where: { id: cardId },
        include: { 
          user: { 
            select: { 
              reviewSchedule: true
            }
          },
          wordDetails: true,
          wordList: {
            select: {
              name: true,
              id: true
            }
          }
        }
      });

      if (!card || card.userId !== userId) {
        cardRepositoryLogger.warn('Card not found or access denied for review', { 
          cardId, 
          userId,
          cardExists: !!card,
          cardUserId: card?.userId
        });
        return null;
      }

      // Use SM-2 algorithm for intelligent interval calculation
      const sm2Quality = convertToSM2Quality(isSuccess, responseQuality);
      const sm2Result = calculateSM2({
        interval: card.interval,
        easeFactor: card.easeFactor,
        consecutiveCorrect: card.consecutiveCorrect
      }, sm2Quality);

      const now = new Date();
      const nextReview = new Date(now);
      nextReview.setDate(nextReview.getDate() + sm2Result.interval);
      
      // Determine review status based on performance
      const newReviewStatus = sm2Result.consecutiveCorrect >= 5 && sm2Result.interval >= 90 
        ? 'COMPLETED' 
        : 'ACTIVE';
      
      const updatedCard = await prisma.card.update({
        where: { id: cardId },
        data: {
          lastReviewed: now,
          nextReview,
          // Update SM-2 fields
          interval: sm2Result.interval,
          easeFactor: sm2Result.easeFactor,
          consecutiveCorrect: sm2Result.consecutiveCorrect,
          // Update counters
          viewCount: { increment: 1 },
          successCount: isSuccess ? { increment: 1 } : undefined,
          failureCount: !isSuccess ? { increment: 1 } : undefined,
          reviewStatus: newReviewStatus,
          reviews: {
            create: {
              isSuccess,
              quality: responseQuality || (isSuccess ? 3 : 0)
            }
          }
        },
        include: {
          wordDetails: true,
          wordList: {
            select: {
              name: true,
              id: true
            }
          },
          user: true
        }
      });

      cardRepositoryLogger.info('Successfully reviewed card with SM-2', { 
        userId,
        cardId,
        word: updatedCard.word,
        isSuccess,
        responseQuality,
        sm2Quality,
        oldInterval: card.interval,
        newInterval: sm2Result.interval,
        oldEaseFactor: card.easeFactor,
        newEaseFactor: sm2Result.easeFactor,
        consecutiveCorrect: sm2Result.consecutiveCorrect,
        nextReview: updatedCard.nextReview,
        reviewStatus: updatedCard.reviewStatus
      });
      
      return updatedCard;
    } catch (error) {
      cardRepositoryLogger.error('Failed to review card', { 
        userId,
        cardId,
        isSuccess,
        responseQuality,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async getReviewHistory(userId: string, startDate?: string, endDate?: string, days: number = 30) {
    cardRepositoryLogger.debug('Getting review history', { 
      userId, 
      startDate, 
      endDate, 
      days 
    });
    
    try {
      let dateFilter: any = {};
      if (startDate && endDate) {
        dateFilter = {
          lastReviewed: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        };
      } else {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days);
        dateFilter = {
          lastReviewed: {
            gte: start,
            lte: end,
          },
        };
      }
    const cards = await prisma.card.findMany({
      where: {
        userId,
        ...dateFilter,
      },
      select: {
        id: true,
        word: true,
        lastReviewed: true,
        nextReview: true,
        successCount: true,
        failureCount: true,
        reviewStatus: true,
        wordList: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        lastReviewed: 'desc',
      },
    });
    const totalReviews = cards.reduce((sum, card) => sum + card.successCount + card.failureCount, 0);
    const totalSuccess = cards.reduce((sum, card) => sum + card.successCount, 0);
    const totalFailures = cards.reduce((sum, card) => sum + card.failureCount, 0);
    const averageSuccessRate = totalReviews > 0 
      ? (totalSuccess / totalReviews) * 100 
      : 0;
    const reviewsByDate = cards.reduce((acc, card) => {
      if (!card.lastReviewed) return acc;
      const date = new Date(card.lastReviewed).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(card);
      return acc;
    }, {} as Record<string, typeof cards>);
      const result = {
        cards,
        statistics: {
          totalReviews,
          totalSuccess,
          totalFailures,
          averageSuccessRate,
        },
        reviewsByDate,
      };
      
      cardRepositoryLogger.debug('Successfully got review history', { 
        userId,
        startDate,
        endDate,
        days,
        cardsCount: cards.length,
        totalReviews,
        totalSuccess,
        totalFailures,
        averageSuccessRate: Math.round(averageSuccessRate * 100) / 100
      });
      
      return result;
    } catch (error) {
      cardRepositoryLogger.error('Failed to get review history', { 
        userId,
        startDate,
        endDate,
        days,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async findAvailableCards(userId: string, wordListId: string): Promise<Card[]> {
    cardRepositoryLogger.debug('Finding available cards for word list', { userId, wordListId });
    
    try {
      const cards = await prisma.card.findMany({
        where: {
          userId,
          OR: [
            { wordListId: null },
            { wordListId: { not: wordListId } }
          ]
        },
        include: {
          wordDetails: true,
          progress: {
            where: { userId },
          },
          user: true,
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      cardRepositoryLogger.debug('Successfully found available cards', { 
        userId, 
        wordListId, 
        count: cards.length 
      });
      
      return cards;
    } catch (error) {
      cardRepositoryLogger.error('Failed to find available cards', { 
        userId,
        wordListId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },
}; 