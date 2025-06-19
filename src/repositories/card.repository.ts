import prisma from '../lib/prisma';
import { Card, CardProgress } from '@prisma/client';
import { addDays } from 'date-fns';

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
    // Ensure the user has a review schedule (upsert)
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
    return prisma.card.create({
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
  },

  async findMany(userId: string, wordListId?: string): Promise<Card[]> {
    return prisma.card.findMany({
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
  },

  async findById(id: string, userId: string): Promise<Card | null> {
    return prisma.card.findFirst({
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
    const card = await prisma.card.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!card) {
      return null;
    }

    return prisma.card.update({
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
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const card = await prisma.card.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!card) {
      return false;
    }

    await prisma.card.delete({
      where: { id },
    });

    return true;
  },

  async updateProgress(userId: string, cardId: string, isSuccess: boolean): Promise<CardProgress> {
    return prisma.cardProgress.upsert({
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
  },

  async findTodayCards(userId: string) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // Fetch all active cards due up to today (including overdue)
    const cards = await prisma.card.findMany({
      where: {
        userId,
        reviewStatus: 'ACTIVE',
        nextReview: { lte: endOfDay }
      },
      include: {
        wordDetails: true,
        wordList: true,
        reviews: true,
        user: true
      }
    });

    // Filter out cards already reviewed today
    const pendingCards = cards.filter(card =>
      !card.reviews.some(review => {
        const created = new Date(review.createdAt);
        return created >= startOfDay && created < endOfDay;
      })
    );

    return { cards: pendingCards, total: pendingCards.length };
  },

  async getStats(userId: string) {
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
  },

  async getUpcomingCards(userId: string, days: number = 7, startDays: number = -14) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        reviewSchedule: true
      }
    });

    if (!user) {
      return null;
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startDate = new Date(startOfToday);
    startDate.setDate(startDate.getDate() + startDays);
    const endDate = new Date(startOfToday);
    endDate.setDate(endDate.getDate() + days);

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

    return {
      cards: groupedCards,
      total: Object.values(groupedCards).reduce((sum: number, group: any) => sum + group.total, 0),
      intervals
    };
  },

  async addToReview(userId: string, cardIds: string[]) {
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
    return {
      updatedCount: updatedCards.count,
      message: `Successfully added ${updatedCards.count} cards to review`
    };
  },

  async reviewCard(userId: string, cardId: string, isSuccess: boolean) {
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
      return null;
    }

    const intervals = card.user.reviewSchedule?.intervals || [1, 7, 30, 365];
    let newReviewStep = Math.max(0, card.reviewStep);
    let nextInterval = intervals[newReviewStep] || intervals[0] || 1;
    if (isSuccess && newReviewStep < intervals.length - 1) {
      newReviewStep++;
      nextInterval = intervals[newReviewStep] || intervals[intervals.length - 1] || 1;
    }
    const now = new Date();
    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + nextInterval);
    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: {
        lastReviewed: now,
        nextReview,
        reviewStep: newReviewStep,
        viewCount: { increment: 1 },
        successCount: isSuccess ? { increment: 1 } : undefined,
        failureCount: !isSuccess ? { increment: 1 } : undefined,
        reviewStatus: isSuccess && newReviewStep === intervals.length - 1 ? 'COMPLETED' : undefined,
        reviews: {
          create: {
            isSuccess
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
    return updatedCard;
  },

  async getReviewHistory(userId: string, startDate?: string, endDate?: string, days: number = 30) {
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
    return {
      cards,
      statistics: {
        totalReviews,
        totalSuccess,
        totalFailures,
        averageSuccessRate,
      },
      reviewsByDate,
    };
  },
}; 