import { cardRepository } from '../repositories/card.repository';
import { reviewSessionRepository } from '../repositories/review-session.repository';
import { createModuleLogger } from '../utils/logger';
import { validateDateRange, validatePagination } from '../utils/validation';

const analyticsLogger = createModuleLogger('ANALYTICS');

interface LearningVelocity {
  period: string; // 'daily' | 'weekly' | 'monthly'
  cardsLearned: number;
  reviewsCompleted: number;
  averageAccuracy: number;
  timeSpent: number; // in minutes
}

interface DifficultCard {
  id: string;
  word: string;
  definition: string;
  failureRate: number;
  consecutiveFailures: number;
  lastReviewed: Date | null;
  suggestedAction: 'review_again' | 'break_down' | 'add_examples' | 'practice_more';
}

interface OptimalReviewTime {
  hour: number;
  accuracy: number;
  reviewCount: number;
  averageResponseTime: number;
}

interface LearningInsight {
  type: 'streak_breaking' | 'difficulty_pattern' | 'time_optimization' | 'progress_plateau';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  actionable: boolean;
  suggestions: string[];
}

export const analyticsService = {
  /**
   * Get learning velocity trends over time
   */
  async getLearningVelocity(userId: string, period: 'daily' | 'weekly' | 'monthly' = 'daily', days: number = 30): Promise<LearningVelocity[]> {
    analyticsLogger.debug('Calculating learning velocity', { userId, period, days });

    try {
      const { startDate, endDate } = validateDateRange(undefined, undefined, days);
      
      // Get review history for the period
      const reviewHistory = await cardRepository.getReviewHistory(userId, startDate.toISOString(), endDate.toISOString(), days);
      
      if (!reviewHistory?.reviewsByDate) {
        return [];
      }

      // Group data by period
      const velocityData: Record<string, LearningVelocity> = {};
      
      Object.entries(reviewHistory.reviewsByDate).forEach(([date, cards]) => {
        const periodKey = this.getPeriodKey(new Date(date), period);
        
        if (!velocityData[periodKey]) {
          velocityData[periodKey] = {
            period: periodKey,
            cardsLearned: 0,
            reviewsCompleted: 0,
            averageAccuracy: 0,
            timeSpent: 0
          };
        }
        
        const totalReviews = cards.reduce((sum, card) => sum + card.successCount + card.failureCount, 0);
        const successfulReviews = cards.reduce((sum, card) => sum + card.successCount, 0);
        
        velocityData[periodKey].cardsLearned += cards.length;
        velocityData[periodKey].reviewsCompleted += totalReviews;
        
        // Calculate weighted accuracy
        if (totalReviews > 0) {
          const accuracy = (successfulReviews / totalReviews) * 100;
          velocityData[periodKey].averageAccuracy = 
            (velocityData[periodKey].averageAccuracy + accuracy) / 2;
        }
      });

      const result = Object.values(velocityData).sort((a, b) => a.period.localeCompare(b.period));
      
      analyticsLogger.debug('Learning velocity calculated', { 
        userId, 
        period, 
        days, 
        dataPoints: result.length 
      });
      
      return result;
    } catch (error) {
      analyticsLogger.error('Failed to calculate learning velocity', {
        userId,
        period,
        days,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  /**
   * Identify consistently difficult cards
   */
  async getDifficultCards(userId: string, limit: number = 10): Promise<DifficultCard[]> {
    analyticsLogger.debug('Identifying difficult cards', { userId, limit });

    try {
      const { limit: validatedLimit } = validatePagination(limit);
      
      const cards = await cardRepository.findMany(userId);
      
      const difficultCards = cards
        .filter(card => {
          const totalReviews = card.successCount + card.failureCount;
          return totalReviews >= 3; // Only consider cards with sufficient review data
        })
        .map(card => {
          const totalReviews = card.successCount + card.failureCount;
          const failureRate = card.failureCount / totalReviews;
          
          // Calculate consecutive failures (approximation based on recent performance)
          const consecutiveFailures = card.failureCount > card.successCount ? 
            Math.min(card.failureCount, 3) : 0;
          
          // Determine suggested action based on patterns
          let suggestedAction: DifficultCard['suggestedAction'] = 'review_again';
          if (failureRate > 0.7) {
            suggestedAction = 'break_down';
          } else if (failureRate > 0.5 && consecutiveFailures >= 2) {
            suggestedAction = 'add_examples';
          } else if (failureRate > 0.4) {
            suggestedAction = 'practice_more';
          }
          
          return {
            id: card.id,
            word: card.word,
            definition: card.definition,
            failureRate: Math.round(failureRate * 100) / 100,
            consecutiveFailures,
            lastReviewed: card.lastReviewed,
            suggestedAction
          };
        })
        .filter(card => card.failureRate > 0.3) // Only include cards with >30% failure rate
        .sort((a, b) => b.failureRate - a.failureRate) // Sort by failure rate
        .slice(0, validatedLimit);

      analyticsLogger.debug('Difficult cards identified', { 
        userId, 
        totalCards: cards.length,
        difficultCards: difficultCards.length,
        averageFailureRate: difficultCards.length > 0 
          ? Math.round((difficultCards.reduce((sum, card) => sum + card.failureRate, 0) / difficultCards.length) * 100) / 100
          : 0
      });

      return difficultCards;
    } catch (error) {
      analyticsLogger.error('Failed to identify difficult cards', {
        userId,
        limit,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  /**
   * Analyze optimal review times (placeholder - would need actual timing data)
   */
  async getOptimalReviewTimes(userId: string): Promise<OptimalReviewTime[]> {
    analyticsLogger.debug('Analyzing optimal review times', { userId });

    try {
      // This is a placeholder implementation
      // In a real implementation, you would track review timestamps and performance
      const sessionStats = await reviewSessionRepository.getSessionStats(userId, 30);
      
      // Mock data for demonstration - replace with actual analysis
      const mockOptimalTimes: OptimalReviewTime[] = [
        { hour: 9, accuracy: 85.2, reviewCount: 45, averageResponseTime: 2800 },
        { hour: 14, accuracy: 78.9, reviewCount: 32, averageResponseTime: 3200 },
        { hour: 19, accuracy: 82.1, reviewCount: 38, averageResponseTime: 2950 },
      ];

      analyticsLogger.debug('Optimal review times analyzed', { 
        userId, 
        optimalTimes: mockOptimalTimes.length 
      });

      return mockOptimalTimes;
    } catch (error) {
      analyticsLogger.error('Failed to analyze optimal review times', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  /**
   * Generate personalized learning insights
   */
  async getLearningInsights(userId: string): Promise<LearningInsight[]> {
    analyticsLogger.debug('Generating learning insights', { userId });

    try {
      const insights: LearningInsight[] = [];
      
      // Analyze difficult cards pattern
      const difficultCards = await this.getDifficultCards(userId, 5);
      if (difficultCards.length >= 3) {
        insights.push({
          type: 'difficulty_pattern',
          title: 'Multiple Challenging Cards Detected',
          description: `You have ${difficultCards.length} cards with high failure rates. Consider reviewing these more frequently or breaking them down into smaller concepts.`,
          severity: 'medium',
          actionable: true,
          suggestions: [
            'Create additional example sentences for difficult words',
            'Use the "Again" button more liberally to reset difficult cards',
            'Consider breaking complex definitions into simpler parts'
          ]
        });
      }

      // Analyze learning velocity
      const velocity = await this.getLearningVelocity(userId, 'daily', 7);
      const recentVelocity = velocity.slice(-3);
      const avgRecentAccuracy = recentVelocity.reduce((sum, v) => sum + v.averageAccuracy, 0) / recentVelocity.length;
      
      if (avgRecentAccuracy < 70) {
        insights.push({
          type: 'difficulty_pattern',
          title: 'Accuracy Below Optimal Range',
          description: `Your recent accuracy is ${Math.round(avgRecentAccuracy)}%. Consider slowing down or reviewing cards more frequently.`,
          severity: 'high',
          actionable: true,
          suggestions: [
            'Take more time to think before answering',
            'Review challenging cards more frequently',
            'Use quality ratings (Hard/Good/Easy) to better calibrate intervals'
          ]
        });
      }

      // Analyze session completion patterns
      const sessionStats = await reviewSessionRepository.getSessionStats(userId, 14);
      if (sessionStats.completionRate < 80) {
        insights.push({
          type: 'streak_breaking',
          title: 'Low Session Completion Rate',
          description: `You're completing only ${Math.round(sessionStats.completionRate)}% of your review sessions. Consider shorter sessions or reviewing fewer cards at once.`,
          severity: 'medium',
          actionable: true,
          suggestions: [
            'Limit review sessions to 10-15 cards',
            'Take breaks between difficult cards',
            'Set a timer for focused review periods'
          ]
        });
      }

      // Check for progress plateau
      if (velocity.length >= 7) {
        const earlyVelocity = velocity.slice(0, 3);
        const lateVelocity = velocity.slice(-3);
        const earlyAvg = earlyVelocity.reduce((sum, v) => sum + v.cardsLearned, 0) / earlyVelocity.length;
        const lateAvg = lateVelocity.reduce((sum, v) => sum + v.cardsLearned, 0) / lateVelocity.length;
        
        if (lateAvg <= earlyAvg * 0.8) {
          insights.push({
            type: 'progress_plateau',
            title: 'Learning Progress Plateau',
            description: 'Your learning velocity has slowed down recently. This might be a good time to add new cards or review your study strategy.',
            severity: 'low',
            actionable: true,
            suggestions: [
              'Add new cards to your collection',
              'Review your study schedule and adjust timing',
              'Try different review modes (flashcard vs multiple choice)'
            ]
          });
        }
      }

      analyticsLogger.debug('Learning insights generated', { 
        userId, 
        insights: insights.length,
        severityBreakdown: {
          high: insights.filter(i => i.severity === 'high').length,
          medium: insights.filter(i => i.severity === 'medium').length,
          low: insights.filter(i => i.severity === 'low').length
        }
      });

      return insights;
    } catch (error) {
      analyticsLogger.error('Failed to generate learning insights', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  /**
   * Get comprehensive learning dashboard data
   */
  async getLearningDashboard(userId: string): Promise<{
    velocity: LearningVelocity[];
    difficultCards: DifficultCard[];
    optimalTimes: OptimalReviewTime[];
    insights: LearningInsight[];
    summary: {
      totalCards: number;
      averageAccuracy: number;
      streakDays: number;
      nextReviewCount: number;
    };
  }> {
    analyticsLogger.debug('Building learning dashboard', { userId });

    try {
      // Fetch all analytics data in parallel
      const [velocity, difficultCards, optimalTimes, insights, cardStats, todayCards] = await Promise.all([
        this.getLearningVelocity(userId, 'daily', 14),
        this.getDifficultCards(userId, 5),
        this.getOptimalReviewTimes(userId),
        this.getLearningInsights(userId),
        cardRepository.getStats(userId),
        cardRepository.findTodayCards(userId, 50)
      ]);

      const summary = {
        totalCards: cardStats?.totalCards || 0,
        averageAccuracy: cardStats?.successRate || 0,
        streakDays: 0, // Would need to implement streak calculation
        nextReviewCount: todayCards?.total || 0
      };

      const dashboard = {
        velocity,
        difficultCards,
        optimalTimes,
        insights,
        summary
      };

      analyticsLogger.debug('Learning dashboard built', { 
        userId, 
        summary,
        componentsLoaded: {
          velocity: velocity.length,
          difficultCards: difficultCards.length,
          insights: insights.length
        }
      });

      return dashboard;
    } catch (error) {
      analyticsLogger.error('Failed to build learning dashboard', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  /**
   * Helper function to group dates by period
   */
  private getPeriodKey(date: Date, period: 'daily' | 'weekly' | 'monthly'): string {
    switch (period) {
      case 'daily':
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
      case 'weekly':
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        return startOfWeek.toISOString().split('T')[0];
      case 'monthly':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      default:
        return date.toISOString().split('T')[0];
    }
  }
}; 